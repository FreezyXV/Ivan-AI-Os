// Runs the installed OpenClaw hook runner in an isolated registry, with synthetic
// calls and an ephemeral authenticated gateway. Does not load live config,
// install a plugin, contact Telegram/TypeSafe, or run a model.
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { once } from "node:events";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import plugin from "../hooks/openclaw/ivan-observer/index.js";
import { createTrustedEvaluator } from "../services/jev-gateway/src/trusted-evaluator.js";
import { createGatewayServer } from "../services/jev-gateway/src/server.js";

const root = process.argv[2];
if (!root || !path.isAbsolute(root)) throw new Error("Provide the absolute installed OpenClaw package directory.");
const { version } = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
if (version !== "2026.9.5") throw new Error("This verification is pinned to OpenClaw 2026.9.5; inspect a new runtime contract first.");
const candidates = readdirSync(path.join(root, "dist")).filter(n => /^hooks-[\w-]+\.mjs$/.test(n)).map(name => {
  const source = readFileSync(path.join(root, "dist", name), "utf8");
  return { name, source, exportName: source.match(/createHookRunner as (\w+)/)?.[1] };
}).filter(entry => entry.exportName);
assert.equal(candidates.length, 1, "Expected one verified hook-runner export");
const candidate = candidates[0];
const createHookRunner = (await import(pathToFileURL(path.join(root, "dist", candidate.name)).href))[candidate.exportName];
assert.equal(typeof createHookRunner, "function");

const scratch = mkdtempSync(path.join(tmpdir(), "ivan-native-observer-"));
const token = randomBytes(32).toString("hex");
const serviceEvents = [], warnings = [];
const observerAudit = path.join(scratch, "observer.jsonl");
const server = createGatewayServer({ trustedEvaluator: createTrustedEvaluator({
  token, workspaceRoot: scratch, audit: e => serviceEvents.push(e),
  decide: async () => ({ decision: "REVIEW", confidence: 0, provider: "mock" })
}) });
let runner;
try {
  writeFileSync(path.join(scratch, "before.md"), "synthetic-before");
  writeFileSync(path.join(scratch, "after.md"), "synthetic-after");
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  // This process owns only a generated, disposable test token.
  process.env.IVAN_DECISION_TOKEN = token;
  const registry = { typedHooks: [] };
  plugin.register({
    pluginConfig: { enabled: true, agentId: "verification", tools: ["read"], gatewayUrl: `http://127.0.0.1:${server.address().port}`, auditPath: observerAudit },
    logger: { warn: code => warnings.push(code) },
    on: (hookName, handler, options = {}) => registry.typedHooks.push({ pluginId: plugin.id, hookName, handler, source: "isolated-verification", ...options })
  });
  runner = createHookRunner(registry, { catchErrors: false });
  const ctx = { agentId: "verification", toolName: "read", runId: "synthetic-run", toolCallId: "synthetic-call-1" };
  const event = { toolName: "read", params: { path: "before.md" } };
  assert.equal(await runner.runBeforeToolCall(event, ctx), undefined);
  assert.equal(readFileSync(path.join(scratch, event.params.path), "utf8"), "synthetic-before");
  await runner.runAfterToolCall({ ...event, result: "synthetic-result-not-for-audit" }, ctx);

  // OpenClaw isolates each handler's original event: even a prior rewrite is
  // invisible to this observer until the completion event exposes used params.
  registry.typedHooks.push({ pluginId: "synthetic-rewriter", hookName: "before_tool_call", priority: 50, handler: () => ({ params: { path: "after.md" } }) });
  const second = { ...ctx, toolCallId: "synthetic-call-2" };
  const rewritten = await runner.runBeforeToolCall(event, second);
  assert.equal(rewritten.params.path, "after.md");
  assert.equal(event.params.path, "before.md");
  assert.equal(readFileSync(path.join(scratch, rewritten.params.path), "utf8"), "synthetic-after");
  await runner.runAfterToolCall({ ...event, params: rewritten.params }, second);

  registry.typedHooks.push({ pluginId: "synthetic-blocker", hookName: "before_tool_call", priority: 100, handler: () => ({ block: true }) });
  assert.equal((await runner.runBeforeToolCall(event, { ...ctx, toolCallId: "synthetic-call-3" })).block, true);
  assert.equal(serviceEvents.length, 2, "Earlier blocked call must not be represented as captured");

  const rawAudit = readFileSync(observerAudit, "utf8");
  const observations = rawAudit.trim().split("\n").map(line => JSON.parse(line));
  assert.equal(observations.length, 4);
  assert.equal(observations[1].params_unchanged, true);
  assert.equal(observations[3].params_unchanged, false);
  assert.equal(observations[0].request_id, serviceEvents[0].request_id);
  assert.equal(observations[0].action_binding, serviceEvents[0].action_binding);
  assert.equal(observations[2].request_id, serviceEvents[1].request_id);
  assert.equal(rawAudit.includes(token), false);
  assert.equal(rawAudit.includes("before.md"), false);
  assert.equal(rawAudit.includes("synthetic-result-not-for-audit"), false);
  assert.deepEqual(warnings, []);
  console.log(JSON.stringify({
    ok: true, openclaw_version: version,
    hook_runner_sha256: createHash("sha256").update(candidate.source).digest("hex"),
    correlated_calls: 2, changed_parameter_calls: 1, earlier_block_verified: true,
    evaluation_provider: "mock", installed_in_live_gateway: false
  }, null, 2));
} finally {
  if (runner) await runner.runGatewayStop({ reason: "isolated verification complete" }, {});
  await new Promise(resolve => server.close(resolve));
  delete process.env.IVAN_DECISION_TOKEN;
  rmSync(scratch, { recursive: true, force: true });
}
