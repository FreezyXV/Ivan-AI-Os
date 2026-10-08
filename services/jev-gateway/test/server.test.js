import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createGatewayServer } from "../src/server.js";
import { createTrustedEvaluator } from "../src/trusted-evaluator.js";
import { testBudget } from "./helpers.js";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { decideWithProvider } from "../src/provider.js";
import { routeRequest } from "../src/routing.js";
import { PRICED_MODEL } from "../src/budget.js";

const token = "synthetic-http-auth-token-for-tests-only";

async function listen(t, options) {
  const server = createGatewayServer(options);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise(resolve => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

test("all decision endpoints are disabled without auth configuration while health remains available", async t => {
  const url = await listen(t);
  assert.equal((await fetch(`${url}/health`)).status, 200);
  for (const endpoint of ["evaluate-tool", "route", "decide", "classify"]) {
    const response = await fetch(`${url}/v1/${endpoint}`, { method: "POST" });
    assert.equal(response.status, 503);
    assert.equal((await response.json()).reason_code, "TRUSTED_EVALUATION_DISABLED");
  }
});

test("all endpoints authenticate before parsing; route rejects free text and decide rejects caller policy claims", async t => {
  const audit = [], calls = [];
  const { budget } = testBudget(t);
  const trustedEvaluator = createTrustedEvaluator({ token, audit: event => audit.push(event) });
  const url = await listen(t, { trustedEvaluator, budget, route: async metadata => { calls.push(metadata); return { status: "REVIEW", manager: null, provider: "mock" }; } });
  const headers = { "content-type": "application/json", authorization: `Bearer ${token}` };
  for (const endpoint of ["evaluate-tool", "route", "decide"]) {
    for (const authorization of [undefined, "Bearer wrong"]) {
      const response = await fetch(`${url}/v1/${endpoint}`, { method: "POST", headers: authorization ? { authorization } : {}, body: "{invalid-private-fixture" });
      assert.equal(response.status, 401);
    }
  }
  assert.equal((await fetch(`${url}/v1/usage`)).status, 401);
  assert.equal(audit.length, 0); assert.equal(calls.length, 0);
  for (const payload of [{ text: "private-fixture" }, { metadata: { requested_tasks: ["unit_test"], urgency: "none", details_available: false, text: "private-fixture" } }]) {
    assert.equal((await fetch(`${url}/v1/route`, { method: "POST", headers, body: JSON.stringify(payload) })).status, 400);
  }
  const metadata = { requested_tasks: ["unit_test"], urgency: "none", details_available: false };
  assert.equal((await fetch(`${url}/v1/route`, { method: "POST", headers, body: JSON.stringify({ metadata }) })).status, 200);
  assert.deepEqual(calls, [metadata]);
  const invalid = await fetch(`${url}/v1/decide`, { method: "POST", headers, body: JSON.stringify({ action: { intent: "private-fixture" }, policies: [] }) });
  assert.equal(invalid.status, 400);
  const concrete = await fetch(`${url}/v1/decide`, { method: "POST", headers, body: JSON.stringify({ tool: "message", arguments: { action: "send" } }) });
  assert.equal((await concrete.json()).decision, "REQUIRE_HUMAN");
  const usage = await fetch(`${url}/v1/usage`, { headers });
  assert.equal((await usage.json()).monthly_budget_micro_eur, 10_000_000);
  assert.equal(JSON.stringify(audit).includes("private-fixture"), false);
});

test("HTTP authentication precedes evaluation; invalid requests are audited and closed", async t => {
  const audit = [];
  let providerCalls = 0;
  const trustedEvaluator = createTrustedEvaluator({ token, audit: event => audit.push(event), decide: async () => { providerCalls++; } });
  const url = await listen(t, { trustedEvaluator });
  const call = { tool: "message", arguments: { action: "send", message: "private-fixture" } };
  async function post(body, authorization) {
    const response = await fetch(`${url}/v1/evaluate-tool`, {
      method: "POST", headers: { "content-type": "application/json", ...(authorization ? { authorization } : {}) }, body
    });
    return { status: response.status, body: await response.json() };
  }
  for (const header of [undefined, "Bearer incorrect"]) assert.equal((await post(JSON.stringify(call), header)).status, 401);
  assert.equal(audit.length, 0);
  const result = await post(JSON.stringify(call), `Bearer ${token}`);
  assert.equal(result.status, 200);
  assert.equal(result.body.decision, "REQUIRE_HUMAN");
  assert.equal(audit.length, 1);
  for (const body of ["{bad", "null", JSON.stringify({ ...call, policies: [] })]) {
    const invalid = await post(body, `Bearer ${token}`);
    assert.equal(invalid.status, 400);
    assert.equal(invalid.body.executable, false);
  }
  assert.equal(audit.length, 4);
  assert.equal(JSON.stringify(audit).includes("private-fixture"), false);
  assert.equal(providerCalls, 0);
});

test("routing and concrete evaluation share reservations; rejected calls never reach the provider", async t => {
  const saved = { provider: process.env.JEV_PROVIDER, key: process.env.TYPESAFE_API_KEY, model: process.env.JEV_MODEL };
  process.env.JEV_PROVIDER = "jev";
  process.env.TYPESAFE_API_KEY = "synthetic-integration-key";
  process.env.JEV_MODEL = PRICED_MODEL;
  t.after(() => {
    for (const [name, value] of [["JEV_PROVIDER", saved.provider], ["TYPESAFE_API_KEY", saved.key], ["JEV_MODEL", saved.model]]) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  });
  const { budget, directory } = testBudget(t, { monthlyMicroEuro: 5500 });
  writeFileSync(path.join(directory, "note.md"), "synthetic local fixture");
  let started, release;
  const firstStarted = new Promise(resolve => { started = resolve; });
  const requests = [];
  const response = () => ({ ok: true, json: async () => ({ model: PRICED_MODEL, usage: { input_tokens: 300 }, answers: {
    manager: { type: "choice", choice: "engineering", confidence: 0.95 },
    needs_details: { type: "noul", noul: 0.9 }, urgency: { type: "score", score: 0 },
    permission: { type: "choice", choice: "ALLOW", confidence: 0.95, probabilities: { ALLOW: 0.95, REVIEW: 0.04, DENY: 0.01 } }
  } }) });
  const fetchImpl = async (_url, options) => {
    requests.push(JSON.parse(options.body));
    if (requests.length === 1) return new Promise(resolve => { release = () => resolve(response()); started(); });
    return response();
  };
  const audit = [];
  const trustedEvaluator = createTrustedEvaluator({ token, workspaceRoot: directory, audit: e => audit.push(e), decide: input => decideWithProvider(input, { budget, fetchImpl }) });
  const url = await listen(t, { trustedEvaluator, budget, route: metadata => routeRequest(metadata, { budget, fetchImpl }) });
  const headers = { authorization: `Bearer ${token}`, "content-type": "application/json" };
  const post = (endpoint, body) => fetch(`${url}/v1/${endpoint}`, { method: "POST", headers, body: JSON.stringify(body) });
  const pending = post("route", { metadata: { requested_tasks: ["unit_test"], urgency: "none", details_available: false } });
  await firstStarted;
  const call = { tool: "read", arguments: { path: "note.md", content: "private-detail-not-for-provider" } };
  assert.equal((await post("decide", call)).status, 503);
  assert.equal(requests.length, 1);
  release();
  assert.equal((await pending).status, 200);
  const evaluated = await post("evaluate-tool", call);
  assert.equal((await evaluated.json()).decision, "REVIEW");
  assert.equal(requests.length, 2);
  assert.equal(budget.status().calls, 2);
  assert.equal(budget.status().charged_micro_eur, 26);
  assert.equal(budget.status().usage_unknown_calls, 0);
  assert.equal(JSON.stringify(requests).includes("private-detail-not-for-provider"), false);
  assert.equal(JSON.stringify(requests).includes("note.md"), false);
});
