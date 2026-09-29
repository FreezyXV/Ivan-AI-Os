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
let root, loaded = false, helper, namespace;
const id = randomUUID(), account = `test-${id}`;
function run(command, args, input) {
  return execFileSync(command, args, { input, encoding: "utf8", timeout: 15000, maxBuffer: 8192, stdio: ["pipe", "pipe", "pipe"] });
}
try {
  if (process.platform !== "darwin" || process.argv.length !== 5 || ![releaseRoot, nodePath, preparedHelper].every(p => p && path.isAbsolute(p))) throw new Error();
  root = mkdtempSync("/private/tmp/ivan-launchd-proof-");
  helper = path.join(root, "jev-keychain"); copyFileSync(preparedHelper, helper); chmodSync(helper, 0o700);
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
  const domain = `gui/${process.getuid()}`; namespace = `${domain}/${label}`;
  run("/bin/launchctl", ["bootstrap", domain, plistPath]); loaded = true;
  const base = `http://127.0.0.1:${port}`, options = { headers: { authorization: `Bearer ${token}`, connection: "close" }, signal: AbortSignal.timeout(1000) };
  async function ready() {
    for (let i = 0; i < 40; i++) {
      try {
        const response = await fetch(base + "/v1/usage", { ...options, signal: AbortSignal.timeout(300) });
        if (response.ok) return await response.json();
      } catch {}
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    throw new Error();
  }
  assert.equal((await ready()).calls, initial.calls);
  assert.equal((await fetch(base + "/v1/usage", { headers: { connection: "close" } })).status, 401);
  const opinion = await (await fetch(base + "/v1/evaluate-tool", { ...options, method: "POST", headers: { ...options.headers, "content-type": "application/json" }, body: JSON.stringify({ tool: "exec", arguments: { command: "synthetic-no-execution" } }) })).json();
  assert.equal(opinion.executable, false); assert.equal(opinion.provider, "deterministic-kernel");
  run("/bin/launchctl", ["kickstart", "-k", namespace]);
  const restarted = await ready(); assert.equal(restarted.calls, initial.calls); assert.equal(restarted.charged_micro_eur, initial.charged_micro_eur);
  console.log(JSON.stringify({ native_keychain_roundtrip: true, launch_agent_started: true, authenticated: true, native_restart_verified: true, ledger_preserved: true, actual_provider_calls: 0, live_gateway_modified: false, production_credential_accessed: false }));
} catch { console.error("MAC_BACKGROUND_NATIVE_PROOF_FAILED"); process.exitCode = 1; }
finally {
  if (loaded) try { run("/bin/launchctl", ["bootout", namespace]); } catch {}
  if (helper) try { run(helper, ["delete", account]); } catch { console.error("SYNTHETIC_KEYCHAIN_CLEANUP_REQUIRED"); process.exitCode = 1; }
  if (root) rmSync(root, { recursive: true, force: true });
}
