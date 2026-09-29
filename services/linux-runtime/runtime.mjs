// systemd launcher for the Jev gateway. Credential contents never enter argv,
// repository files or diagnostic output.
import { constants, openSync, closeSync, fstatSync, readFileSync, statSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PRICED_MODEL } from "../jev-gateway/src/budget.js";

const root = fileURLToPath(new URL("../../", import.meta.url));
const server = join(root, "services/jev-gateway/src/server.js");

export function readCredential(directory, name) {
  if (!isAbsolute(directory) || !/^[a-z][a-z0-9.-]{0,40}$/.test(name)) throw new Error("CREDENTIALS_UNAVAILABLE");
  let fd;
  try {
    fd = openSync(join(directory, name), constants.O_RDONLY | constants.O_NOFOLLOW);
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.size < 1 || stat.size > 4000) throw new Error("CREDENTIALS_UNAVAILABLE");
    return readFileSync(fd, "utf8").replace(/\r?\n$/, "");
  } catch {
    throw new Error("CREDENTIALS_UNAVAILABLE");
  } finally { if (fd !== undefined) closeSync(fd); }
}

export function gatewayEnvironment(env = process.env) {
  const credentials = env.CREDENTIALS_DIRECTORY, state = env.STATE_DIRECTORY;
  if (!isAbsolute(credentials ?? "") || !isAbsolute(state ?? "")) throw new Error("LINUX_RUNTIME_DIRECTORY_REQUIRED");
  const stat = statSync(state);
  if (!stat.isDirectory() || stat.uid !== process.getuid?.() || (stat.mode & 0o077)) throw new Error("PRIVATE_STATE_DIRECTORY_REQUIRED");
  const token = readCredential(credentials, "decision-token");
  if (token.length < 32 || /\s/.test(token)) throw new Error("INVALID_DECISION_TOKEN");
  const provider = env.JEV_PROVIDER ?? "jev";
  if (!["mock", "jev"].includes(provider)) throw new Error("INVALID_PROVIDER");
  const key = provider === "jev" ? readCredential(credentials, "typesafe.key") : undefined;
  if (key !== undefined && (!key || /\s/.test(key))) throw new Error("INVALID_TYPESAFE_KEY");
  const port = Number(env.PORT ?? "4311");
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("INVALID_PORT");
  const { TYPESAFE_API_KEY: _inheritedKey, IVAN_DECISION_TOKEN_FILE: _inheritedTokenFile,
    ...base } = env;
  return {
    ...base,
    HOST: "127.0.0.1", PORT: String(port), JEV_PROVIDER: provider,
    JEV_MODEL: PRICED_MODEL, IVAN_DECISION_TOKEN: token,
    IVAN_WORKSPACE_ROOT: root,
    IVAN_AUDIT_PATH: join(state, "evaluation.jsonl"),
    IVAN_JEV_BUDGET_PATH: join(state, "jev-budget.json"),
    JEV_USD_TO_EUR_BUDGET_RATE: env.JEV_USD_TO_EUR_BUDGET_RATE ?? "1",
    ...(key === undefined ? {} : { TYPESAFE_API_KEY: key })
  };
}

export async function runGateway({ env = process.env, command = process.execPath } = {}) {
  const child = spawn(command, [server], {
    cwd: dirname(server), env: gatewayEnvironment(env), stdio: ["ignore", "inherit", "inherit"]
  });
  for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => child.kill(signal));
  return await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve(code ?? (signal ? 128 : 1)));
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.exitCode = await runGateway(); }
  catch (error) {
    console.error(/^[A-Z][A-Z0-9_]{2,64}$/.test(error.message ?? "") ? error.message : "LINUX_RUNTIME_FAILED");
    process.exitCode = 1;
  }
}
