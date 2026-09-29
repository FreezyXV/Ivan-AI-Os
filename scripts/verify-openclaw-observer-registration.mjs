// Inspect the installed native loader in a disposable state directory. No live
// config, gateway activation, model, Telegram or provider request is involved.
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = process.argv[2];
if (!root || !path.isAbsolute(root)) throw new Error("Provide the absolute installed OpenClaw package directory.");
assert.equal(JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).version, "2026.9.5");
const candidates = readdirSync(path.join(root, "dist")).filter(n => /^loader-runtime-load-[\w-]+\.mjs$/.test(n)).map(name => ({
  name, exportName: readFileSync(path.join(root, "dist", name), "utf8").match(/loadOpenClawPlugins as (\w+)/)?.[1]
})).filter(entry => entry.exportName);
assert.equal(candidates.length, 1);
const scratch = mkdtempSync(path.join(tmpdir(), "ivan-loader-check-"));
const envNames = ["OPENCLAW_STATE_DIR", "OPENCLAW_CONFIG_PATH", "IVAN_DECISION_TOKEN"];
const original = Object.fromEntries(envNames.map(name => [name, process.env[name]]));
try {
  process.env.OPENCLAW_STATE_DIR = scratch;
  process.env.OPENCLAW_CONFIG_PATH = path.join(scratch, "unused-config.json");
  delete process.env.IVAN_DECISION_TOKEN;
  const candidate = candidates[0];
  const load = (await import(pathToFileURL(path.join(root, "dist", candidate.name)).href))[candidate.exportName];
  const id = "ivan-ai-os-observer";
  const warnings = [];
  const pluginPath = fileURLToPath(new URL("../hooks/openclaw/ivan-observer", import.meta.url));
  const registry = load({
    config: { plugins: { enabled: true, allow: [id], load: { paths: [pluginPath] }, entries: {
      [id]: { enabled: true, config: { enabled: true, agentId: "synthetic", tools: ["read"], gatewayUrl: "http://127.0.0.1:4310", auditPath: path.join(scratch, "audit.jsonl") } }
    } } },
    workspaceDir: scratch, activate: false, cache: false, onlyPluginIds: [id], throwOnLoadError: true,
    logger: { debug() {}, info() {}, error() {}, warn(message) {
      if (message === "OBSERVER_DISABLED_INVALID_CONFIG") warnings.push(message);
    } }
  });
  assert.equal(registry.plugins.find(p => p.id === id)?.status, "loaded");
  assert.equal(registry.typedHooks.filter(h => h.pluginId === id).length, 0);
  assert.equal(warnings.length, 1);
  console.log(JSON.stringify({ native_loader_returns: true, plugin_status: "loaded", observer_hooks: 0, missing_token_warning: true, active_gateway_untouched: true }));
} finally {
  for (const name of envNames) {
    if (original[name] === undefined) delete process.env[name];
    else process.env[name] = original[name];
  }
  rmSync(scratch, { recursive: true, force: true });
}
