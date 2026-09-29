// Validate a prepared public configuration in an isolated native state. Never
// read the live OpenClaw configuration, auth stores or private profile contents.
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { tmpdir } from "node:os";

let scratch;
try {
  const [planPath, cliPath] = process.argv.slice(2);
  if (![planPath, cliPath].every(p => p && path.isAbsolute(p))) throw new Error("ABSOLUTE_PATHS_REQUIRED");
  const plan = JSON.parse(readFileSync(planPath, "utf8"));
  if (plan.roles.length !== 7 || new Set(plan.roles.map(r => r.workspace)).size !== 7) throw new Error("INCOMPLETE_MANAGER_PLAN");
  scratch = mkdtempSync(path.join(tmpdir(), "ivan-manager-native-"));
  const configPath = path.join(scratch, "openclaw.json");
  writeFileSync(configPath, JSON.stringify(plan.openclawFragment), { mode: 0o600 });
  const result = spawnSync(cliPath, ["config", "validate", "--json"], {
    encoding: "utf8", timeout: 30000,
    env: { PATH: process.env.PATH, HOME: process.env.HOME, OPENCLAW_STATE_DIR: scratch, OPENCLAW_CONFIG_PATH: configPath }
  });
  const valid = result.status === 0 && JSON.parse(result.stdout).valid === true;
  const finance = plan.roles.find(r => r.route === "finance");
  const profileFree = finance.skills.every(name => !readdirSync(path.join(finance.workspace, "skills", name)).includes("profil.md"));
  const privateModes = plan.roles.every(role => (statSync(role.preparedWorkspace ?? role.workspace).mode & 0o777) === 0o700);
  console.log(JSON.stringify({ native_config_valid: valid, roles: plan.roles.length, finance_profile_free: profileFree, private_modes: privateModes, live_config_modified: false, models_started: 0 }));
  if (!valid || !profileFree || !privateModes) process.exitCode = 1;
} catch { console.error("MANAGER_PLAN_VERIFICATION_FAILED"); process.exitCode = 1; }
finally { if (scratch) rmSync(scratch, { recursive: true, force: true }); }
