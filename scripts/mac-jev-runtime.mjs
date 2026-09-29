// Private local smoke/runtime launcher. Secrets never enter argv, config or Git.
import { randomBytes } from "node:crypto";
import { mkdirSync, statSync, realpathSync, writeFileSync, openSync, fsyncSync, closeSync } from "node:fs";
import { spawn } from "node:child_process";
import { once } from "node:events";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defaultRuntimeDirectory, readDecisionToken } from "../services/jev-gateway/src/runtime-token.js";
import { PRICED_MODEL } from "../services/jev-gateway/src/budget.js";
import { routeWithGateway } from "../hooks/openclaw/ivan-route/client.js";

const args = process.argv.slice(2);
if (new Set(args).size !== args.length || args.some(a => !["--stay", "--mock"].includes(a))) throw new Error("Usage: node scripts/mac-jev-runtime.mjs [--stay] [--mock]");
const root = fileURLToPath(new URL("../", import.meta.url));
const directory = process.env.IVAN_RUNTIME_DIR || defaultRuntimeDirectory;
const port = Number(process.env.PORT || 4310);
const gatewayUrl = `http://127.0.0.1:${port}`;
let child;
function hiddenKey() {
  if (!process.stdin.isTTY) throw new Error("HIDDEN_TTY_INPUT_REQUIRED");
  process.stdout.write("Clé TypeSafe (masquée, non enregistrée) : ");
  return new Promise((resolve, reject) => {
    let value = "";
    process.stdin.setRawMode(true); process.stdin.resume();
    function done(error) {
      process.stdin.off("data", data); process.stdin.setRawMode(false); process.stdin.pause(); process.stdout.write("\n");
      if (error) reject(error); else resolve(value);
    }
    function data(buffer) {
      for (const char of buffer.toString("utf8")) {
        if (char === "\u0003") return done(new Error("INPUT_CANCELLED"));
        if (char === "\r" || char === "\n") return done();
        if (char === "\u007f") value = value.slice(0, -1);
        else value += char;
        if (value.length > 4000) return done(new Error("INVALID_RUNTIME_KEY"));
      }
    }
    process.stdin.on("data", data);
  });
}
async function stop() {
  if (child && child.exitCode === null && child.signalCode === null) {
    child.kill("SIGTERM"); await once(child, "exit");
  }
}
process.on("SIGINT", () => { void stop(); });
process.on("SIGTERM", () => { void stop(); });
try {
  if (!path.isAbsolute(directory) || !Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("INVALID_RUNTIME_CONFIG");
  const requestedWorkspace = process.env.IVAN_WORKSPACE_ROOT || root;
  if (!path.isAbsolute(requestedWorkspace) || !statSync(requestedWorkspace).isDirectory()) throw new Error("INVALID_WORKSPACE_ROOT");
  const workspaceRoot = realpathSync(requestedWorkspace);
  const probe = net.createServer();
  try { probe.listen(port, "127.0.0.1"); await once(probe, "listening"); }
  catch { throw new Error("LOCAL_PORT_IN_USE"); }
  await new Promise(resolve => probe.close(resolve));
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const stat = statSync(directory);
  if (stat.uid !== process.getuid?.() || (stat.mode & 0o077)) throw new Error("PRIVATE_RUNTIME_DIRECTORY_REQUIRED");
  const tokenFile = path.join(directory, "decision-token");
  let token = readDecisionToken({ IVAN_DECISION_TOKEN_FILE: tokenFile });
  if (process.env.IVAN_DECISION_TOKEN) {
    const supplied = readDecisionToken();
    if (token && supplied !== token) throw new Error("RUNTIME_TOKEN_CONFLICT");
    token ??= supplied;
  }
  if (!token) token = randomBytes(32).toString("hex");
  if (!readDecisionToken({ IVAN_DECISION_TOKEN_FILE: tokenFile })) {
    writeFileSync(tokenFile, token, { flag: "wx", mode: 0o600 });
    const fd = openSync(tokenFile, "r"); try { fsyncSync(fd); } finally { closeSync(fd); }
  }
  const mock = args.includes("--mock");
  let key = mock ? undefined : process.env.TYPESAFE_API_KEY || await hiddenKey();
  if (!mock && (!key || /\s/.test(key))) throw new Error("INVALID_RUNTIME_KEY");
  const env = {
    PATH: process.env.PATH, HOST: "127.0.0.1", PORT: String(port),
    JEV_PROVIDER: mock ? "mock" : "jev", JEV_MODEL: PRICED_MODEL,
    IVAN_DECISION_TOKEN_FILE: tokenFile, IVAN_AUDIT_PATH: path.join(directory, "evaluation.jsonl"),
    IVAN_WORKSPACE_ROOT: workspaceRoot, IVAN_JEV_BUDGET_PATH: path.join(directory, "jev-budget.json"),
    JEV_USD_TO_EUR_BUDGET_RATE: process.env.JEV_USD_TO_EUR_BUDGET_RATE || "1",
    ...(key ? { TYPESAFE_API_KEY: key } : {})
  };
  child = spawn(process.execPath, [path.join(root, "services/jev-gateway/src/server.js")], { env, stdio: ["ignore", "ignore", "ignore"] });
  key = undefined;
  let ready = false;
  for (let i = 0; i < 20; i++) {
    if (child.exitCode !== null) break;
    try { ready = (await fetch(`${gatewayUrl}/v1/usage`, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(500) })).ok; } catch {}
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  if (!ready) throw new Error("RUNTIME_STARTUP_REFUSED");
  const result = await routeWithGateway({ requested_tasks: ["unit_test"], urgency: "none", details_available: false }, gatewayUrl, { token });
  const usage = await (await fetch(`${gatewayUrl}/v1/usage`, { headers: { authorization: `Bearer ${token}` } })).json();
  console.log(JSON.stringify({ mode: mock ? "mock" : "jev", smoke: result, usage }, null, 2));
  if (args.includes("--stay")) {
    console.log(`Runtime authentifié sur ${gatewayUrl}. Ctrl+C arrête uniquement ce service ; le compteur mensuel est conservé.`);
    await once(child, "exit");
  }
} catch (error) {
  const code = error.code ?? error.message;
  console.error(/^[A-Z][A-Z0-9_]{0,63}$/.test(code) ? code : "RUNTIME_FAILED");
  process.exitCode = 1;
} finally { await stop(); }
