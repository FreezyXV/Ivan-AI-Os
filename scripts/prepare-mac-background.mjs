import { lstatSync, realpathSync, readFileSync, mkdirSync, writeFileSync, chmodSync, mkdtempSync, rmSync, renameSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { launchAgentPlist, validateSettings, LABEL } from "../services/mac-runtime/src/service.js";

// Produces a reviewable private candidate. No Keychain write, launchctl or runtime stop.
const [releaseRoot, nodePath, workspaceRoot, runtimeDirectory, output] = process.argv.slice(2);
let stage;
try {
  if (process.platform !== "darwin" || process.argv.length !== 7 ||
      ![releaseRoot, nodePath, workspaceRoot, runtimeDirectory, output].every(p => p && path.isAbsolute(p))) throw new Error();
  const manifest = JSON.parse(readFileSync(path.join(releaseRoot, "runtime-release.json"), "utf8"));
  if (!/^[a-f0-9]{40}$/.test(manifest.commit) || !lstatSync(nodePath).isFile() || lstatSync(output, { throwIfNoEntry: false })) throw new Error();
  const parent = realpathSync(path.dirname(output)), stat = lstatSync(parent);
  if (stat.uid !== process.getuid?.() || (stat.mode & 0o077)) throw new Error();
  for (let dir = parent;; dir = path.dirname(dir)) {
    if (lstatSync(path.join(dir, ".git"), { throwIfNoEntry: false })) throw new Error();
    if (dir === path.dirname(dir)) break;
  }
  stage = mkdtempSync(path.join(parent, ".jev-background-"));
  const helper = path.join(stage, "jev-keychain");
  execFileSync("/usr/bin/swiftc", [path.join(releaseRoot, "services/mac-runtime/src/keychain.swift"), "-o", helper], { timeout: 120000, stdio: ["ignore", "pipe", "pipe"] });
  chmodSync(helper, 0o700);
  const settings = { version: 1, releaseRoot: realpathSync(releaseRoot), workspaceRoot: realpathSync(workspaceRoot), runtimeDirectory: realpathSync(runtimeDirectory),
    keychainHelper: path.join(output, "jev-keychain"), keychainAccount: "jev-gateway", port: 4311, usdToEurRate: 1, routingMode: "jev" };
  validateSettings({ ...settings, keychainHelper: helper });
  const settingsPath = path.join(output, "settings.json"), plist = launchAgentPlist({ nodePath, runnerPath: path.join(settings.releaseRoot, "scripts/mac-jev-background.mjs"), settingsPath });
  writeFileSync(path.join(stage, "settings.json"), JSON.stringify(settings, null, 2), { flag: "wx", mode: 0o600 });
  const plistPath = path.join(stage, `${LABEL}.plist`); writeFileSync(plistPath, plist, { flag: "wx", mode: 0o600 });
  execFileSync("/usr/bin/plutil", ["-lint", plistPath], { stdio: ["ignore", "pipe", "pipe"] });
  writeFileSync(path.join(stage, "preparation.json"), JSON.stringify({ status: "BACKGROUND_PREPARED_NOT_ACTIVATED", commit: manifest.commit, credential_in_keychain: false, loopback: true, budget_preserved: true, paid_calls: 0 }), { flag: "wx", mode: 0o600 });
  renameSync(stage, output); stage = undefined;
  console.log("BACKGROUND_PREPARED_NOT_ACTIVATED");
} catch { console.error("BACKGROUND_PREPARATION_REFUSED"); process.exitCode = 1; }
finally { if (stage) rmSync(stage, { recursive: true, force: true }); }
