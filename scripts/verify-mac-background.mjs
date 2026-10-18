// Native proof using an isolated Keychain account, launchd label, port and ledger.
// Never retrieves the production credential or invokes a paid endpoint.
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, chmodSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomUUID, randomBytes } from "node:crypto";
import { once } from "node:events";
import net from "node:net";
import path from "node:path";
import assert from "node:assert/strict";
import { launchAgentPlist } from "../services/mac-runtime/src/service.js";
import { createJevBudget } from "../services/jev-gateway/src/budget.js";

const [releaseRoot, nodePath, preparedHelper] = process.argv.slice(2);
let root, loaded = false, helper, namespace, phase = "PREPARE";
const id = randomUUID(), account = `test-${id}`;
function run(command, args, input, timeout = 15000) {
  return execFileSync(command, args, { input, encoding: "utf8", timeout, maxBuffer: 8192, stdio: ["pipe", "pipe", "pipe"] });
}
try {
  if (process.platform !== "darwin" || process.argv.length !== 5 || ![releaseRoot, nodePath, preparedHelper].every(p => p && path.isAbsolute(p))) throw new Error();
  root = mkdtempSync("/private/tmp/ivan-launchd-proof-");
  helper = path.join(root, "jev-keychain"); copyFileSync(preparedHelper, helper); chmodSync(helper, 0o700);
  phase = "KEYCHAIN";
  const key = `synthetic-${randomBytes(24).toString("hex")}`;
  assert.equal(run(helper, ["store", account], key).trim(), "KEYCHAIN_STORED");
  assert.equal(run(helper, ["read", account]), key);
  const runtimeDirectory = path.join(root, "runtime"); mkdirSync(runtimeDirectory, { mode: 0o700 });
  const token = randomBytes(32).toString("hex"); writeFileSync(path.join(runtimeDirectory, "decision-token"), token, { mode: 0o600 });
  const budget = createJevBudget({ filename: path.join(runtimeDirectory, "jev-budget.json") }); budget.reserve().complete(100);
  const initial = budget.status();
  const socket = net.createServer(); socket.listen(0, "127.0.0.1"); await once(socket, "listening");
  const port = socket.address().port; await new Promise(resolve => socket.close(resolve));
  const settingsPath = path.join(root, "settings.json"), label = `com.ivan-ai-os.jev.test-${id}`;
  const settings = { version: 1, releaseRoot, workspaceRoot: root, runtimeDirectory, keychainHelper: helper, keychainAccount: account, port, usdToEurRate: 1, routingMode: "jev" };
  writeFileSync(settingsPath, JSON.stringify(settings), { mode: 0o600 });
  const plistPath = path.join(root, `${label}.plist`);
  writeFileSync(plistPath, launchAgentPlist({ nodePath, runnerPath: path.join(releaseRoot, "scripts/mac-jev-background.mjs"), settingsPath, label }), { mode: 0o600 });
  run("/usr/bin/plutil", ["-lint", plistPath]);
  phase = "BOOTSTRAP";
  const domain = `gui/${process.getuid()}`; namespace = `${domain}/${label}`;
  run("/bin/launchctl", ["bootstrap", domain, plistPath]); loaded = true;
  const base = `http://127.0.0.1:${port}`, options = { headers: { authorization: `Bearer ${token}`, connection: "close" }, signal: AbortSignal.timeout(1000) };
  const jobPid = () => Number(/^\s*pid = (\d+)$/m.exec(run("/bin/launchctl", ["print", namespace]))?.[1]);
  async function ready(timeoutMs = 10000, previousPid = 0) {
    const until = Date.now() + timeoutMs;
    while (Date.now() < until) {
      try {
        const response = await fetch(base + "/v1/usage", { ...options, signal: AbortSignal.timeout(300) });
        if (response.ok && jobPid() > 0 && jobPid() !== previousPid) return await response.json();
      } catch {}
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    throw new Error();
  }
  phase = "READY";
  assert.equal((await ready()).calls, initial.calls);
  assert.equal((await fetch(base + "/v1/usage", { headers: { connection: "close" } })).status, 401);
  const opinion = await (await fetch(base + "/v1/evaluate-tool", { ...options, method: "POST", headers: { ...options.headers, "content-type": "application/json" }, body: JSON.stringify({ tool: "exec", arguments: { command: "synthetic-no-execution" } }) })).json();
  assert.equal(opinion.executable, false); assert.equal(opinion.provider, "deterministic-kernel");
  phase = "RESTART";
  const previousPid = jobPid(); assert.ok(previousPid > 0);
  run("/bin/launchctl", ["kickstart", "-k", namespace], undefined, 75000);
  phase = "RESTART_READINESS";
  // launchd may apply the configured 60-second throttle even to an immediate restart.
  const restarted = await ready(75000, previousPid); assert.equal(restarted.calls, initial.calls); assert.equal(restarted.charged_micro_eur, initial.charged_micro_eur);
  console.log(JSON.stringify({ native_keychain_roundtrip: true, launch_agent_started: true, authenticated: true, native_restart_verified: true, ledger_preserved: true, actual_provider_calls: 0, live_gateway_modified: false, production_credential_accessed: false }));
} catch (error) {
  console.error(JSON.stringify({ error_code: `MAC_BACKGROUND_${phase}_FAILED`,
    ...(typeof error.code === "string" && /^[A-Z_]+$/.test(error.code) ? { system_code: error.code } : {}),
    ...(Number.isInteger(error.status) ? { exit_status: error.status } : {}) })); process.exitCode = 1;
}
finally {
  if (loaded) try { run("/bin/launchctl", ["bootout", namespace]); } catch {}
  if (helper) try { run(helper, ["delete", account]); } catch { console.error("SYNTHETIC_KEYCHAIN_CLEANUP_REQUIRED"); process.exitCode = 1; }
  if (root) rmSync(root, { recursive: true, force: true });
}
