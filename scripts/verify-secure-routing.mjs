// Actual installed OpenClaw loader/tool + real local HTTP + synthetic TypeSafe
// transport. No live gateway/config, real provider request or Telegram message.
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createJevBudget, PRICED_MODEL } from "../services/jev-gateway/src/budget.js";
import { createTrustedEvaluator } from "../services/jev-gateway/src/trusted-evaluator.js";
import { createGatewayServer } from "../services/jev-gateway/src/server.js";
import { routeRequest } from "../services/jev-gateway/src/routing.js";

const root = process.argv[2];
if (!root || !path.isAbsolute(root)) throw new Error("Provide the absolute installed OpenClaw package directory.");
assert.equal(JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).version, "2026.9.5");
const candidates = readdirSync(path.join(root, "dist")).filter(n => /^loader-runtime-load-[\w-]+\.mjs$/.test(n)).map(name => ({
  name, exportName: readFileSync(path.join(root, "dist", name), "utf8").match(/loadOpenClawPlugins as (\w+)/)?.[1]
})).filter(entry => entry.exportName);
assert.equal(candidates.length, 1);
const scratch = mkdtempSync(path.join(tmpdir(), "ivan-secure-route-"));
const envNames = ["OPENCLAW_STATE_DIR", "OPENCLAW_CONFIG_PATH", "IVAN_DECISION_TOKEN", "IVAN_DECISION_TOKEN_FILE", "JEV_PROVIDER", "JEV_MODEL", "TYPESAFE_API_KEY"];
const original = Object.fromEntries(envNames.map(name => [name, process.env[name]]));
const token = randomBytes(32).toString("hex"), calls = [];
const budget = createJevBudget({ filename: path.join(scratch, "budget.json") });
const fetchImpl = async (_url, options) => {
  calls.push(JSON.parse(options.body));
  return { ok: true, json: async () => ({ model: PRICED_MODEL, usage: { input_tokens: 300 }, answers: {
    manager: { type: "choice", choice: "engineering", confidence: 0.95 },
    needs_details: { type: "noul", noul: 0.9 }, urgency: { type: "score", score: 0 }
  } }) };
};
const server = createGatewayServer({ budget, trustedEvaluator: createTrustedEvaluator({ token, audit() {} }), route: metadata => routeRequest(metadata, { budget, fetchImpl }) });
try {
  process.env.OPENCLAW_STATE_DIR = scratch;
  process.env.OPENCLAW_CONFIG_PATH = path.join(scratch, "unused-config.json");
  delete process.env.IVAN_DECISION_TOKEN;
  process.env.IVAN_DECISION_TOKEN_FILE = path.join(scratch, "decision-token");
  writeFileSync(process.env.IVAN_DECISION_TOKEN_FILE, token, { mode: 0o600 });
  process.env.JEV_PROVIDER = "jev";
  process.env.JEV_MODEL = PRICED_MODEL;
  process.env.TYPESAFE_API_KEY = "synthetic-provider-key";
  server.listen(0, "127.0.0.1"); await once(server, "listening");
  const gatewayUrl = `http://127.0.0.1:${server.address().port}`;
  const candidate = candidates[0];
  const load = (await import(pathToFileURL(path.join(root, "dist", candidate.name)).href))[candidate.exportName];
  const id = "ivan-ai-os-route";
  const registry = load({
    config: { plugins: { enabled: true, allow: [id], load: { paths: [fileURLToPath(new URL("../hooks/openclaw/ivan-route", import.meta.url))] }, entries: { [id]: { enabled: true, config: { gatewayUrl } } } } },
    workspaceDir: scratch, activate: false, cache: false, onlyPluginIds: [id], throwOnLoadError: true,
    logger: { debug() {}, info() {}, warn() {}, error() {} }
  });
  assert.equal(registry.plugins.find(p => p.id === id)?.status, "loaded");
  const entry = registry.tools.find(t => t.pluginId === id && t.names.includes("ivan_route"));
  assert.ok(entry);
  const tool = await entry.factory({ agentId: "synthetic", workspaceDir: scratch });
  assert.equal(Object.hasOwn(tool.parameters.properties, "text"), false);
  const metadata = { requested_tasks: ["unit_test"], urgency: "none", details_available: false };
  const result = await tool.execute("synthetic-call", metadata);
  assert.equal(result.details.manager, "engineering");
  assert.deepEqual(calls[0].state, metadata);
  assert.equal(calls.length, 1);
  const rejected = await tool.execute("synthetic-invalid", { ...metadata, text: "private-fixture-never-for-provider" });
  assert.equal(rejected.details.status, "REVIEW");
  assert.equal(calls.length, 1);
  assert.equal((await fetch(`${gatewayUrl}/v1/route`, { method: "POST", body: "{bad" })).status, 401);
  assert.equal(budget.status().charged_micro_eur, 13);
  const journal = readFileSync(path.join(scratch, "budget.json"), "utf8");
  assert.equal(journal.includes(token), false);
  assert.equal(journal.includes("unit_test"), false);
  console.log(JSON.stringify({ ok: true, native_tool: "ivan_route", authentication_verified: true, provider_state_metadata_only: true, synthetic_usage_input_tokens: 300, accounted_calls: 1, real_typesafe_calls: 0, live_gateway_untouched: true }));
} finally {
  await new Promise(resolve => server.close(resolve));
  for (const name of envNames) {
    if (original[name] === undefined) delete process.env[name]; else process.env[name] = original[name];
  }
  rmSync(scratch, { recursive: true, force: true });
}
