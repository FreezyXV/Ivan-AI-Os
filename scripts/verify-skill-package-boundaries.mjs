// Reproduce a review finding using synthetic data and temporary files only.
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, symlinkSync, rmSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
const rootModule = process.argv[2];
if (!rootModule || !path.isAbsolute(rootModule)) throw new Error("Provide the reviewed skills/tools/package.mjs path.");
const { packageSkills } = await import(pathToFileURL(rootModule));
const dir = mkdtempSync("/private/tmp/ivan-package-proof-");
try {
  const root = path.join(dir, "source"), out = path.join(dir, "out"), name = "synthetic";
  mkdirSync(path.join(root, name), { recursive: true }); mkdirSync(path.join(out, name), { recursive: true });
  writeFileSync(path.join(root, name, "SKILL.md"), '---\nname: synthetic\ndescription: Synthetic.\nmetadata:\n  version: "1.0.0"\n  famille: test\n  manager: system\n  risque: lecture\n  profil: "oui"\n  statut: actif\n  provenance: "synthetic"\n---\nLire profil.md.\n');
  const profile = path.join(dir, "profile"), victim = path.join(dir, "repository-sentinel");
  writeFileSync(profile, "SYNTHETIC_PRIVATE_PROFILE"); writeFileSync(victim, "ORIGINAL");
  symlinkSync(victim, path.join(out, name, "profil.md"));
  let refused = false;
  try { packageSkills({ root, out, profile, openclaw: true }); } catch { refused = true; }
  const overwritten = readFileSync(victim, "utf8") !== "ORIGINAL";
  console.log(JSON.stringify({ package_refused: refused, outside_file_overwritten: overwritten, real_private_profile_read: false, all_files_temporary: true }));
  if (overwritten) process.exitCode = 1;
} finally { rmSync(dir, { recursive: true, force: true }); }
