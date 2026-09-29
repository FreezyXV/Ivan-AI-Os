import test from "node:test";
import assert from "node:assert/strict";
import { createObserver } from "../observer.js";
import { createKeyedBinding } from "../../../../services/jev-gateway/src/action-binding.js";
import plugin from "../index.js";

const token = "synthetic-observer-test-key-no-real-credential";
const bind = createKeyedBinding(token);
const secret = "private-fixture-do-not-log";
const ctx = { agentId: "main", toolName: "message", runId: "run-private-fixture", toolCallId: "call-private-fixture" };
const event = () => ({ toolName: "message", params: { action: "send", target: secret, message: secret } });
function fixture(options = {}) {
  const events = [], warnings = [], sent = [];
  const observer = createObserver({
    token, agentId: "main", tools: ["message"], audit: e => events.push(e), warn: e => warnings.push(e),
    evaluate: async body => {
      sent.push(JSON.parse(body));
      return { action_binding: bind(JSON.parse(body)), request_id: "00000000-0000-4000-8000-000000000001", decision: "REQUIRE_HUMAN", policy_revision: "a".repeat(64) };
    }, ...options
  });
  return { observer, events, warnings, sent };
}

test("observer correlates before/after without altering calls or persisting arguments/results", async () => {
  const { observer, events, warnings, sent } = fixture();
  const input = event(), original = structuredClone(input);
  assert.equal(await observer.before(input, ctx), undefined);
  assert.equal(observer.after({ ...input, result: { credentials: secret } }, ctx), undefined);
  assert.deepEqual(input, original);
  assert.equal(sent.length, 1);
  assert.equal(events[0].decision, "REQUIRE_HUMAN");
  assert.equal(events[1].params_unchanged, true);
  assert.equal(events[0].observation_id, events[1].observation_id);
  assert.equal(JSON.stringify(events).includes(secret), false);
  assert.equal(JSON.stringify(events).includes(ctx.runId), false);
  assert.equal(JSON.stringify(events).includes(token), false);
  assert.deepEqual(warnings, []);
});

test("capture snapshots before awaiting; detects a later rewrite and reports errors without text", async () => {
  let release;
  const { observer, events } = fixture({ evaluate: body => new Promise(resolve => { release = () => resolve({ action_binding: bind(JSON.parse(body)), request_id: "fixture", decision: "REVIEW", policy_revision: "a".repeat(64) }); }) });
  const input = event();
  const running = observer.before(input, ctx);
  input.params.target = "modified-target";
  release(); await running;
  observer.after({ ...input, error: secret }, ctx);
  assert.equal(events[1].params_unchanged, false);
  assert.equal(events[1].outcome, "reported_error");
  assert.notEqual(events[0].action_binding, events[1].action_binding);
  assert.equal(JSON.stringify(events).includes(secret), false);
});

test("scope is explicit and missing or conflicting runtime identities are not guessed", async () => {
  const { observer, sent, warnings } = fixture();
  await observer.before(event(), { ...ctx, agentId: "other" });
  await observer.before({ toolName: "exec", params: {} }, { ...ctx, toolName: "exec" });
  for (const context of [{ ...ctx, runId: undefined }, { ...ctx, toolCallId: undefined }, { ...ctx, toolName: "exec" }]) await observer.before(event(), context);
  await observer.before({ ...event(), runId: "different" }, ctx);
  assert.equal(sent.length, 0);
  assert.equal(warnings.length, 4);
  assert.equal(warnings.every(w => w === "OBSERVER_CAPTURE_INVALID"), true);
});

test("concurrent calls with identical arguments retain distinct runtime correlation", async () => {
  const { observer, events } = fixture();
  const second = { ...ctx, runId: "other-run" };
  await Promise.all([observer.before(event(), ctx), observer.before(event(), second)]);
  observer.after(event(), second);
  observer.after(event(), ctx);
  assert.equal(events[0].action_binding, events[1].action_binding);
  assert.notEqual(events[0].call_ref, events[1].call_ref);
  assert.equal(events[1].observation_id, events[2].observation_id);
  assert.equal(events[0].observation_id, events[3].observation_id);
});

test("duplicates, capacity, expiry and unmatched completions never invent evidence", async () => {
  let time = 0;
  const { observer, events, sent, warnings } = fixture({ now: () => time, maxPending: 1, ttlMs: 100 });
  await observer.before(event(), ctx);
  await observer.before(event(), ctx);
  await observer.before(event(), { ...ctx, toolCallId: "another" });
  assert.equal(sent.length, 1);
  time = 101;
  observer.after(event(), ctx);
  assert.equal(events.at(-1).phase, "expired");
  assert.deepEqual(warnings, ["OBSERVER_DUPLICATE_BEFORE", "OBSERVER_CAPACITY_REACHED", "OBSERVER_UNMATCHED_AFTER"]);
});

test("evaluation or audit failures and digest mismatch grant no authority and leak no error", async () => {
  for (const evaluate of [async () => { throw new Error(secret); }, async () => ({ action_binding: "b".repeat(64), decision: "ALLOW" })]) {
    const { observer, events, warnings } = fixture({ evaluate });
    assert.equal(await observer.before(event(), ctx), undefined);
    assert.equal(events[0].evaluation, "unavailable");
    assert.equal(events[0].decision, undefined);
    assert.deepEqual(warnings, ["OBSERVER_EVALUATION_UNAVAILABLE"]);
    assert.equal(JSON.stringify({ events, warnings }).includes(secret), false);
  }
  const { observer, warnings } = fixture({ audit: () => { throw new Error(secret); } });
  assert.equal(await observer.before(event(), ctx), undefined);
  assert.deepEqual(warnings, ["OBSERVER_AUDIT_UNAVAILABLE"]);
});

test("stopping records incomplete calls and prevents late evaluation evidence", async () => {
  let release;
  const { observer, events } = fixture({ evaluate: () => new Promise(resolve => { release = resolve; }) });
  const running = observer.before(event(), ctx);
  observer.stop();
  release({ action_binding: bind({ tool: "message", arguments: event().params }) });
  await running;
  observer.after(event(), ctx);
  assert.equal(events.length, 1);
  assert.equal(events[0].phase, "incomplete");
});

test("invalid observer configuration does not abort registration or register hooks", () => {
  const registered = [];
  const warnings = [];
  const api = { on: (...args) => registered.push(args), logger: { warn: code => warnings.push(code) }, pluginConfig: {} };
  plugin.register(api);
  assert.equal(registered.length, 0);
  // A malformed URL fails independently of any credential in the environment.
  assert.doesNotThrow(() => plugin.register({ ...api, pluginConfig: { enabled: true, gatewayUrl: "not-a-url" } }));
  assert.deepEqual(warnings, ["OBSERVER_DISABLED_INVALID_CONFIG"]);
  assert.equal(registered.length, 0);
});

test("enabled observer without a token warns and lets the host continue", () => {
  const original = process.env.IVAN_DECISION_TOKEN;
  const originalFile = process.env.IVAN_DECISION_TOKEN_FILE;
  const registered = [], warnings = [];
  try {
    delete process.env.IVAN_DECISION_TOKEN;
    process.env.IVAN_DECISION_TOKEN_FILE = "/nonexistent-ivan-fixture/missing-token";
    assert.doesNotThrow(() => plugin.register({
      pluginConfig: { enabled: true, agentId: "synthetic", tools: ["read"], gatewayUrl: "http://127.0.0.1:4310", auditPath: "/tmp/unused-observer-fixture.jsonl" },
      on: (...args) => registered.push(args), logger: { warn: code => warnings.push(code) }
    }));
    assert.deepEqual(registered, []);
    assert.deepEqual(warnings, ["OBSERVER_DISABLED_INVALID_CONFIG"]);
  } finally {
    if (original === undefined) delete process.env.IVAN_DECISION_TOKEN;
    else process.env.IVAN_DECISION_TOKEN = original;
    if (originalFile === undefined) delete process.env.IVAN_DECISION_TOKEN_FILE;
    else process.env.IVAN_DECISION_TOKEN_FILE = originalFile;
  }
});
