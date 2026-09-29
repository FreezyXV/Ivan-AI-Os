// Apply a prepared private OpenClaw config through launchd, with a bounded
// health check and an automatic rollback. Never print config or CLI output.
import { createHash, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { readFileSync, lstatSync, writeFileSync, renameSync, unlinkSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function regularPrivateFile(file) {
  const stat = lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 ||
      stat.uid !== process.getuid() || (stat.mode & 0o077) !== 0) {
    throw new Error("UNSAFE_CONFIG_FILE");
  }
  outsideRepository(dirname(file));
}

function outsideRepository(dir) {
  for (let parent = realpathSync(dir); dirname(parent) !== parent; parent = dirname(parent)) {
    if (lstatSync(join(parent, ".git"), { throwIfNoEntry: false })) {
      throw new Error("CONFIG_IN_REPOSITORY");
    }
  }
}

function privateBackupDir(dir) {
  // /var is a system symlink to /private/var on macOS; the final directory
  // itself must be real, but its ancestors may legitimately resolve.
  if (!isAbsolute(dir)) throw new Error("UNSAFE_BACKUP_DIR");
  const stat = lstatSync(dir);
  if (!stat.isDirectory() || stat.uid !== process.getuid() || (stat.mode & 0o077) !== 0) {
    throw new Error("UNSAFE_BACKUP_DIR");
  }
  outsideRepository(dir);
}

function replaceExact(file, expected, replacement) {
  regularPrivateFile(file);
  if (sha256(readFileSync(file)) !== sha256(expected)) throw new Error("CONFIG_CHANGED_CONCURRENTLY");
  const temporary = join(dirname(file), `.ivan-openclaw-${randomUUID()}.tmp`);
  try {
    writeFileSync(temporary, replacement, { mode: 0o600, flag: "wx" });
    renameSync(temporary, file);
  } finally {
    try { unlinkSync(temporary); } catch (error) { if (error.code !== "ENOENT") throw error; }
  }
}

async function waitForHealth(checkHealth, maxMs, delay = sleep) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    try { if (await checkHealth()) return true; } catch { /* bounded retry */ }
    if (Date.now() < deadline) await delay(Math.min(1000, deadline - Date.now()));
  }
  return false;
}

export async function switchOpenClawConfig({ livePath, candidatePath, backupDir,
  expectedCurrentSha256, validate, restart, checkHealth, healthTimeoutMs = 45000,
  delay = sleep }) {
  if (![livePath, candidatePath, backupDir].every(isAbsolute) ||
      !/^[a-f0-9]{64}$/.test(expectedCurrentSha256 ?? "")) throw new Error("INVALID_ARGUMENTS");
  privateBackupDir(backupDir);
  regularPrivateFile(livePath);
  regularPrivateFile(candidatePath);
  const previous = readFileSync(livePath), candidate = readFileSync(candidatePath);
  if (sha256(previous) !== expectedCurrentSha256) throw new Error("SOURCE_FINGERPRINT_MISMATCH");
  if (sha256(previous) === sha256(candidate)) return { status: "UNCHANGED", restarted: false };
  if (!(await validate(candidatePath))) throw new Error("CANDIDATE_INVALID");
  regularPrivateFile(candidatePath);
  if (sha256(readFileSync(candidatePath)) !== sha256(candidate)) throw new Error("CANDIDATE_CHANGED_DURING_VALIDATION");
  const backup = join(backupDir, `openclaw-${expectedCurrentSha256.slice(0, 12)}.rollback.json`);
  writeFileSync(backup, previous, { mode: 0o600, flag: "wx" });
  replaceExact(livePath, previous, candidate);
  try {
    await restart();
    if (!(await waitForHealth(checkHealth, healthTimeoutMs, delay))) throw new Error("HEALTH_TIMEOUT");
    return { status: "ACTIVE", restarted: true, backup };
  } catch (activationError) {
    // Do not overwrite a concurrent edit; keep both snapshots for manual recovery.
    try {
      replaceExact(livePath, candidate, previous);
      await restart();
      if (!(await waitForHealth(checkHealth, healthTimeoutMs, delay))) throw new Error("ROLLBACK_HEALTH_TIMEOUT");
      return { status: "ROLLED_BACK", restarted: true, backup, cause: activationError.message };
    } catch (rollbackError) {
      throw new AggregateError([activationError, rollbackError], "ROLLBACK_FAILED");
    }
  }
}

async function runOpenClaw(args, options = {}) {
  const { stdout } = await execFileAsync("openclaw", args, {
    timeout: options.timeout ?? 12000,
    maxBuffer: 1024 * 1024,
    env: { ...process.env, ...(options.env ?? {}) }
  });
  const start = stdout.indexOf("{");
  return JSON.parse(stdout.slice(start));
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const name = argv[i];
    if (!name?.startsWith("--") || !argv[i + 1]) throw new Error("INVALID_ARGUMENTS");
    args[name.slice(2)] = argv[i + 1];
  }
  return args;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const livePath = args.live ?? join(homedir(), ".openclaw/openclaw.json");
    const result = await switchOpenClawConfig({
      livePath, candidatePath: args.candidate, backupDir: args["backup-dir"],
      expectedCurrentSha256: args["expected-current-sha256"],
      validate: async candidate => {
        const response = await runOpenClaw(["config", "validate", "--json"],
          { timeout: 30000, env: { OPENCLAW_CONFIG_PATH: candidate } });
        return response.valid === true;
      },
      restart: async () => {
        await execFileAsync("launchctl", ["kickstart", "-k", `gui/${process.getuid()}/ai.openclaw.gateway`],
          { timeout: 20000, maxBuffer: 65536 });
      },
      checkHealth: async () => {
        const response = await runOpenClaw(["gateway", "call", "health", "--json", "--timeout", "5000"],
          { timeout: 9000 });
        return response.ok === true;
      }
    });
    console.log(JSON.stringify(result));
    if (result.status === "ROLLED_BACK") process.exitCode = 1;
  } catch (error) {
    const code = error.message === "ROLLBACK_FAILED" ? "ROLLBACK_FAILED" :
      /^[A-Z][A-Z_]{2,64}$/.test(error.message ?? "") ? error.message : "SWITCH_FAILED";
    console.error(code);
    process.exitCode = 1;
  }
}
