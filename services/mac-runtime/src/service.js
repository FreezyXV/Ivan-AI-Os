import { constants, openSync, closeSync, fstatSync, readFileSync, lstatSync, realpathSync, writeFileSync, renameSync, unlinkSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { setTimeout as pauseFor } from "node:timers/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { once } from "node:events";
import { createGatewayServer } from "../../jev-gateway/src/server.js";
import { createTrustedEvaluator } from "../../jev-gateway/src/trusted-evaluator.js";
import { readDecisionToken } from "../../jev-gateway/src/runtime-token.js";
import { getRuntimeBudget, PRICED_MODEL } from "../../jev-gateway/src/budget.js";

export const LABEL = "com.ivan-ai-os.jev";
const fields = ["version", "releaseRoot", "workspaceRoot", "runtimeDirectory", "keychainHelper", "keychainAccount", "port", "usdToEurRate", "routingMode"];
const account = value => value === "jev-gateway" || /^test-[a-f0-9-]{36}$/.test(value);
const refuse = () => { throw new Error("BACKGROUND_CONFIG_REFUSED"); };
function privateDirectory(file) {
  const s = lstatSync(file);
  if (!s.isDirectory() || s.isSymbolicLink() || s.uid !== process.getuid?.() || (s.mode & 0o077)) refuse();
}
export function readPrivateSettings(filename) {
  if (!path.isAbsolute(filename)) refuse();
  privateDirectory(path.dirname(filename));
  const fd = openSync(filename, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const s = fstatSync(fd);
    if (!s.isFile() || s.uid !== process.getuid?.() || (s.mode & 0o077) || s.nlink !== 1 || s.size > 8192) refuse();
    const value = JSON.parse(readFileSync(fd, "utf8"));
    return validateSettings(value);
  } finally { closeSync(fd); }
}
export function validateSettings(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).sort().join() !== [...fields].sort().join() || value.version !== 1 ||
      !["releaseRoot", "workspaceRoot", "runtimeDirectory", "keychainHelper"].every(k => typeof value[k] === "string" && path.isAbsolute(value[k]) && !/[\x00-\x1f]/.test(value[k])) ||
      !account(value.keychainAccount) || !Number.isInteger(value.port) || value.port < 1024 || value.port > 65535 ||
      !Number.isFinite(value.usdToEurRate) || value.usdToEurRate < 1 || value.usdToEurRate > 2 || !["jev", "table"].includes(value.routingMode)) refuse();
  privateDirectory(value.runtimeDirectory);
  if (!lstatSync(realpathSync(value.workspaceRoot)).isDirectory()) refuse();
  const helper = lstatSync(value.keychainHelper);
  if (!helper.isFile() || helper.isSymbolicLink() || helper.nlink !== 1 || helper.uid !== process.getuid?.() || (helper.mode & 0o077) || !(helper.mode & 0o100)) refuse();
  const manifest = JSON.parse(readFileSync(path.join(value.releaseRoot, "runtime-release.json"), "utf8"));
  if (!/^[a-f0-9]{40}$/.test(manifest.commit ?? "")) refuse();
  return Object.freeze({ ...value, workspaceRoot: realpathSync(value.workspaceRoot) });
}
export function readKey(settings) {
  // stdout is a private pipe to this process. It must never be inherited or logged.
  let result;
  try { result = execFileSync(settings.keychainHelper, ["read", settings.keychainAccount], { encoding: "utf8", maxBuffer: 4096, timeout: 10000, stdio: ["ignore", "pipe", "pipe"], env: {} }); }
  catch { throw new Error("KEYCHAIN_UNAVAILABLE"); }
  if (!result || result.length > 4000 || /\s/.test(result)) throw new Error("KEYCHAIN_UNAVAILABLE");
  return result;
}
const statusStates = new Set(["WAITING_KEYCHAIN", "BACKGROUND_GATEWAY_READY",
  "BACKGROUND_GATEWAY_UNAVAILABLE", "BACKGROUND_GATEWAY_STOPPED"]);
function validateStatusUpdate(value) {
  if (!value || Object.keys(value).sort().join() !== "attempts,retryAfterSeconds,state" ||
      !statusStates.has(value.state) || !Number.isSafeInteger(value.attempts) || value.attempts < 0 ||
      ![0, 5, 15, 60].includes(value.retryAfterSeconds)) throw new Error("STATUS_REFUSED");
}
export function writeRuntimeStatus(settings, update) {
  validateStatusUpdate(update);
  privateDirectory(settings.runtimeDirectory);
  const filename = path.join(settings.runtimeDirectory, "background-status.json");
  const existing = lstatSync(filename, { throwIfNoEntry: false });
  if (existing && (!existing.isFile() || existing.isSymbolicLink() || existing.nlink !== 1 ||
      existing.uid !== process.getuid?.() || (existing.mode & 0o077))) throw new Error("STATUS_REFUSED");
  const temporary = path.join(settings.runtimeDirectory, `.background-status-${randomUUID()}.tmp`);
  try {
    writeFileSync(temporary, JSON.stringify({ version: 1, pid: process.pid,
      updatedAt: new Date().toISOString(), ...update }), { mode: 0o600, flag: "wx" });
    renameSync(temporary, filename);
  } finally { try { unlinkSync(temporary); } catch (error) { if (error.code !== "ENOENT") throw error; } }
}
export function readRuntimeStatus(settings) {
  privateDirectory(settings.runtimeDirectory);
  let fd;
  try {
    fd = openSync(path.join(settings.runtimeDirectory, "background-status.json"), constants.O_RDONLY | constants.O_NOFOLLOW);
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.uid !== process.getuid?.() || (stat.mode & 0o077) || stat.nlink !== 1 || stat.size > 1024) throw new Error("STATUS_REFUSED");
    const value = JSON.parse(readFileSync(fd, "utf8"));
    if (Object.keys(value).sort().join() !== "attempts,pid,retryAfterSeconds,state,updatedAt,version" ||
        value.version !== 1 || !Number.isSafeInteger(value.pid) || value.pid < 1 ||
        !/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(value.updatedAt ?? "")) throw new Error("STATUS_REFUSED");
    validateStatusUpdate({ state: value.state, attempts: value.attempts, retryAfterSeconds: value.retryAfterSeconds });
    return value;
  } catch (error) { if (error.code === "ENOENT") return null; throw new Error("STATUS_REFUSED"); }
  finally { if (fd !== undefined) closeSync(fd); }
}
export async function waitForKey(settings, { reader = readKey, signal,
  pause = ms => pauseFor(ms, undefined, { signal }),
  report = update => writeRuntimeStatus(settings, update) } = {}) {
  let attempts = 0;
  for (;;) {
    signal?.throwIfAborted();
    try { return reader(settings); }
    catch (error) {
      if (error.message !== "KEYCHAIN_UNAVAILABLE") throw error;
      const retryAfterSeconds = [5, 15, 60][Math.min(attempts++, 2)];
      report({ state: "WAITING_KEYCHAIN", attempts, retryAfterSeconds });
      await pause(retryAfterSeconds * 1000);
    }
  }
}
export function serviceEnvironment(settings, key) {
  if (typeof key !== "string" || !key || key.length > 4000 || /\s/.test(key)) throw new Error("KEYCHAIN_UNAVAILABLE");
  return {
    HOST: "127.0.0.1", PORT: String(settings.port), JEV_PROVIDER: "jev", JEV_MODEL: PRICED_MODEL,
    TYPESAFE_API_KEY: key, IVAN_WORKSPACE_ROOT: settings.workspaceRoot,
    IVAN_DECISION_TOKEN_FILE: path.join(settings.runtimeDirectory, "decision-token"),
    IVAN_AUDIT_PATH: path.join(settings.runtimeDirectory, "evaluation.jsonl"),
    IVAN_JEV_BUDGET_PATH: path.join(settings.runtimeDirectory, "jev-budget.json"),
    JEV_USD_TO_EUR_BUDGET_RATE: String(settings.usdToEurRate),
    ...(settings.routingMode === "table" ? { JEV_ROUTING_MODE: "table" } : {})
  };
}
export async function startGateway(settings, key) {
  // launchd's environment is not trusted configuration. In particular, no
  // inherited endpoint, token, proxy or model flag can override this whitelist.
  process.env = serviceEnvironment(settings, key);
  const token = readDecisionToken();
  if (!token) throw new Error("DECISION_TOKEN_REQUIRED");
  const budget = getRuntimeBudget(); budget.status();
  const trustedEvaluator = createTrustedEvaluator({ token, workspaceRoot: settings.workspaceRoot, auditPath: process.env.IVAN_AUDIT_PATH });
  const server = createGatewayServer({ trustedEvaluator, budget });
  server.listen(settings.port, "127.0.0.1"); await once(server, "listening");
  return server;
}
const xml = value => String(value).replace(/[<>&"']/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]);
export function launchAgentPlist({ nodePath, runnerPath, settingsPath, label = LABEL }) {
  if (![nodePath, runnerPath, settingsPath].every(p => typeof p === "string" && path.isAbsolute(p) && !/[\x00-\x1f]/.test(p)) ||
      !(label === LABEL || /^com\.ivan-ai-os\.jev\.test-[a-f0-9-]{36}$/.test(label))) refuse();
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>${xml(label)}</string>
<key>ProgramArguments</key><array>${[nodePath, runnerPath, settingsPath].map(v => `<string>${xml(v)}</string>`).join("")}</array>
<key>RunAtLoad</key><true/><key>KeepAlive</key><true/>
<key>ThrottleInterval</key><integer>60</integer><key>ExitTimeOut</key><integer>10</integer>
<key>Umask</key><integer>63</integer>
<key>StandardOutPath</key><string>/dev/null</string><key>StandardErrorPath</key><string>/dev/null</string>
</dict></plist>\n`;
}
