// Snapshot committed runtime code outside the mutable builder checkout. This
// prepares a release; it never installs/enables a plugin in the live gateway.
import { existsSync, lstatSync, mkdtempSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
const [repository, commit, output] = process.argv.slice(2);
const sources = ["services/jev-gateway/src", "services/jev-gateway/package.json", "policies/kernel", "hooks/openclaw/ivan-route", "hooks/openclaw/ivan-observer", "scripts/mac-jev-runtime.mjs", "scripts/mac-jev-smoke.sh", "scripts/verify-secure-routing.mjs", "scripts/verify-openclaw-observer.mjs", "scripts/verify-openclaw-observer-registration.mjs"];
function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", timeout: 60000,
    env: { PATH: process.env.PATH, HOME: process.env.HOME }, stdio: "pipe" });
  if (result.status !== 0) throw new Error("RELEASE_COMMAND_FAILED");
}
function inspect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name), stat = lstatSync(file);
    if (stat.isSymbolicLink() || (!stat.isDirectory() && (!stat.isFile() || stat.nlink !== 1))) throw new Error("UNSAFE_RUNTIME_SOURCE");
    if (stat.isDirectory()) inspect(file);
  }
}
let stage;
try {
  if (![repository, output].every(p => p && path.isAbsolute(p)) || !/^[a-f0-9]{40}$/.test(commit ?? "")) throw new Error("PINNED_COMMIT_AND_ABSOLUTE_PATHS_REQUIRED");
  const sourceRoot = realpathSync(repository), parent = realpathSync(path.dirname(output)), stat = lstatSync(parent);
  if (!stat.isDirectory() || stat.uid !== process.getuid?.() || (stat.mode & 0o077)) throw new Error("PRIVATE_RELEASE_PARENT_REQUIRED");
  for (let p = parent;; p = path.dirname(p)) {
    if (existsSync(path.join(p, ".git"))) throw new Error("RELEASE_INSIDE_REPOSITORY");
    if (path.dirname(p) === p) break;
  }
  if (lstatSync(output, { throwIfNoEntry: false })) throw new Error("EXISTING_RELEASE_PRESERVED");
  stage = mkdtempSync(path.join(parent, ".ivan-release-stage-"));
  const archive = path.join(stage, "source.tar");
  run("git", ["archive", "--format=tar", "-o", archive, commit, ...sources], sourceRoot);
  run("tar", ["-xf", archive, "-C", stage], sourceRoot); rmSync(archive);
  inspect(stage);
  const route = path.join(stage, "hooks/openclaw/ivan-route");
  run("npm", ["ci", "--ignore-scripts", "--legacy-peer-deps", "--no-audit", "--no-fund"], route);
  // No package lifecycle scripts and no peer OpenClaw installation.
  const lock = JSON.parse(readFileSync(path.join(route, "package-lock.json"), "utf8"));
  const manifest = { version: 1, commit, sources, route_dependency: lock.packages["node_modules/typebox"].version,
    activated: false, code_write_protection: false };
  writeFileSync(path.join(stage, "runtime-release.json"), JSON.stringify(manifest, null, 2), { flag: "wx", mode: 0o600 });
  renameSync(stage, output); stage = undefined;
  console.log(JSON.stringify({ release_prepared: true, commit, dependency_lifecycle_scripts: false, live_plugin_changed: false }));
} catch (error) {
  const code = error.code ?? error.message;
  console.error(/^[A-Z][A-Z_]{0,63}$/.test(code) ? code : "RUNTIME_RELEASE_PREPARATION_REFUSED"); process.exitCode = 1;
} finally { if (stage) rmSync(stage, { recursive: true, force: true }); }
