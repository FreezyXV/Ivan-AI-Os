// Build a private, inactive configuration for review. No restart, model call,
// credential rotation, live config write or Secretary workspace migration.
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { proposeRuntimeConfig } from "../services/manager-runtime/src/runtime-config.js";

const [liveConfigPath, planPath, output, cliPath, releaseRoot] = process.argv.slice(2);
const digest = value => createHash("sha256").update(value).digest("hex");
function contextInventory(workspace) {
  const files = ["AGENTS.md", "SOUL.md", "USER.md", "IDENTITY.md", "TOOLS.md", "MEMORY.md", "HEARTBEAT.md"];
  const context = files.filter(name => existsSync(path.join(workspace, name))).map(name => {
    const file = path.join(workspace, name), stat = lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("SECRETARY_CONTEXT_LINK_REFUSED");
    return { name, sha256: digest(readFileSync(file)) };
  });
  const memory = [];
  function visit(directory) {
    if (!existsSync(directory)) return;
    if (!lstatSync(directory).isDirectory() || lstatSync(directory).isSymbolicLink()) throw new Error("SECRETARY_MEMORY_LINK_REFUSED");
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name), stat = lstatSync(file);
      if (stat.isSymbolicLink()) throw new Error("SECRETARY_MEMORY_LINK_REFUSED");
      if (stat.isDirectory()) visit(file);
      else if (stat.isFile()) memory.push([path.relative(workspace, file), stat.size, stat.mtimeMs]);
    }
  }
  visit(path.join(workspace, "memory"));
  // Read no memory bodies, print no private filenames.
  return { context, memory_file_count: memory.length, memory_inventory_digest: digest(JSON.stringify(memory.sort())) };
}
let stage;
try {
  if (![liveConfigPath, planPath, output, cliPath].every(p => p && path.isAbsolute(p))) throw new Error("ABSOLUTE_PATHS_REQUIRED");
  const parent = realpathSync(path.dirname(output)), stat = lstatSync(parent);
  if (stat.uid !== process.getuid?.() || !stat.isDirectory() || (stat.mode & 0o077)) throw new Error("PRIVATE_OUTPUT_PARENT_REQUIRED");
  for (let p = parent;; p = path.dirname(p)) {
    if (existsSync(path.join(p, ".git"))) throw new Error("OUTPUT_INSIDE_REPOSITORY");
    if (path.dirname(p) === p) break;
  }
  if (lstatSync(output, { throwIfNoEntry: false })) throw new Error("EXISTING_PROPOSAL_PRESERVED");
  const sourceStat = lstatSync(liveConfigPath);
  if (!sourceStat.isFile() || sourceStat.isSymbolicLink() || sourceStat.nlink !== 1) throw new Error("UNSAFE_LIVE_CONFIG");
  const original = readFileSync(liveConfigPath), current = JSON.parse(original);
  const plan = JSON.parse(readFileSync(planPath, "utf8"));
  let routePluginPath;
  if (releaseRoot !== undefined) {
    if (!path.isAbsolute(releaseRoot)) throw new Error("ABSOLUTE_RELEASE_REQUIRED");
    routePluginPath = path.join(realpathSync(releaseRoot), "hooks/openclaw/ivan-route");
    const manifest = JSON.parse(readFileSync(path.join(routePluginPath, "openclaw.plugin.json"), "utf8"));
    if (manifest.id !== "ivan-ai-os-route" || !existsSync(path.join(releaseRoot, "runtime-release.json"))) throw new Error("INVALID_RUNTIME_RELEASE");
  }
  const previousRoutePath = fileURLToPath(new URL("../hooks/openclaw/ivan-route", import.meta.url));
  const candidate = proposeRuntimeConfig({ current, plan, defaultMainWorkspace: path.join(homedir(), ".openclaw/workspace"), gatewayUrl: "http://127.0.0.1:4311", routePluginPath, previousRoutePath });
  const mainWorkspace = candidate.agents.entries.main.workspace, before = contextInventory(mainWorkspace);
  stage = mkdtempSync(path.join(parent, ".ivan-activation-stage-"));
  const candidatePath = path.join(stage, "openclaw.proposed.json"), state = path.join(stage, "native-validation");
  mkdirSync(state, { mode: 0o700 });
  writeFileSync(candidatePath, JSON.stringify(candidate, null, 2), { mode: 0o600, flag: "wx" });
  const result = spawnSync(cliPath, ["config", "validate", "--json"], { encoding: "utf8", timeout: 30000,
    env: { PATH: process.env.PATH, HOME: homedir(), OPENCLAW_CONFIG_PATH: candidatePath, OPENCLAW_STATE_DIR: state } });
  if (result.status !== 0 || JSON.parse(result.stdout).valid !== true) throw new Error("NATIVE_CANDIDATE_VALIDATION_FAILED");
  rmSync(state, { recursive: true });
  if (digest(original) !== digest(readFileSync(liveConfigPath)) || JSON.stringify(before) !== JSON.stringify(contextInventory(mainWorkspace))) throw new Error("SOURCE_CHANGED_DURING_PREPARATION");
  const summary = { status: "PREPARED_NOT_ACTIVATED", native_config_valid: true, roles: Object.keys(candidate.agents.entries).length,
    paused_roles:plan.roles.filter(r=>r.status==="PAUSED").map(r=>r.route),
    secretary_workspace_preserved: true, context_files_unchanged: before.context.length,
    memory_file_count_unchanged: before.memory_file_count, memory_bodies_read: 0,
    unusable_memory_skill_excluded: plan.roles.every(r => !r.skills.includes("memoire-obsidian")),
    live_config_modified: false, models_started: 0, gateway_restarted: false,
    gateway_endpoint: "http://127.0.0.1:4311", credential_rotation_verified: false,
    pinned_plugin_prepared: Boolean(routePluginPath),
    remaining: ["Claude review and Ivan activation GO", ...(!routePluginPath ? ["stable plugin source"] : []), "private TypeSafe provisioning", "credential replacement", "native and Telegram dispatch evidence", "Claude hook shadow activation"] };
  if (!summary.unusable_memory_skill_excluded) throw new Error("UNAVAILABLE_MEMORY_SKILL_INSTALLED");
  writeFileSync(path.join(stage, "activation-summary.json"), JSON.stringify(summary, null, 2), { mode: 0o600, flag: "wx" });
  writeFileSync(path.join(stage, "source-fingerprints.json"), JSON.stringify({ live_config_sha256: digest(original), secretary: before }), { mode: 0o600, flag: "wx" });
  renameSync(stage, output); stage = undefined;
  console.log(JSON.stringify(summary));
} catch (error) {
  const code = error.code ?? error.message;
  console.error(/^[A-Z][A-Z_]{0,63}$/.test(code) ? code : "ACTIVATION_PREPARATION_REFUSED"); process.exitCode = 1;
} finally { if (stage) rmSync(stage, { recursive: true, force: true }); }
