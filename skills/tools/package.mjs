// Package skills for runtimes that cannot read the repository (claude.ai upload,
// OpenClaw skills folder). Profile skills get the private profile copied in.
// Usage: node skills/tools/package.mjs [--out NEW_DIR] [--profile FILE] [--openclaw] [--manager ROUTE] [name ...]
// --manager keeps only the skills listed by that manager in agents/managers/.
// --openclaw (Ivan's decision 2026-09-29): drop the "Clients" and "Cadre d'investissement"
// profile sections, exclude finance skills and remove any pointer to the full local profile.
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OPENCLAW_DROPPED_SECTIONS, OPENCLAW_EXCLUDED_MANAGERS, SKILLS_ROOT, buildRegistry, privateTermsFrom } from "./registry.mjs";
import { skillsForRoute } from "../../agents/tools/managers.mjs";

export { OPENCLAW_DROPPED_SECTIONS, OPENCLAW_EXCLUDED_MANAGERS };

const IGNORED = new Set(["__pycache__", ".DS_Store"]);
const FULL_PROFILE_POINTER = /\s*[,;]\s*sinon `~\/\.ivan-ai-os\/profil\.md`/g;

export function withoutSections(text, headings) {
  return headings.reduce((result, heading) => {
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return result.replace(new RegExp(`^## ${escaped}[^\\n]*\\n[\\s\\S]*?(?=^## |(?![\\s\\S]))`, "m"), "");
  }, text);
}

function insideGitRepository(dir) {
  for (let current = dir; ; current = path.dirname(current)) {
    if (existsSync(path.join(current, ".git"))) return true;
    if (path.dirname(current) === current) return false;
  }
}

// A fresh, empty output outside any Git checkout: nothing pre-existing (such as a
// planted symlink) can redirect a write, and Git cannot pick up the private profile.
function prepareOutput(out) {
  const target = path.resolve(out);
  let existing = target;
  while (!existsSync(existing)) existing = path.dirname(existing);
  if (insideGitRepository(realpathSync(existing))) throw new Error("OUTPUT_INSIDE_REPOSITORY");
  const stat = lstatSync(target, { throwIfNoEntry: false });
  if (stat && (stat.isSymbolicLink() || !stat.isDirectory() || readdirSync(target).length)) throw new Error("OUTPUT_NOT_FRESH");
  mkdirSync(target, { recursive: true, mode: 0o700 });
  return realpathSync(target);
}

// Copy regular files only; links could smuggle content in or writes out.
function copySkill(source, dest, transform) {
  mkdirSync(dest, { mode: 0o700 });
  for (const name of readdirSync(source)) {
    if (IGNORED.has(name)) continue;
    const from = path.join(source, name), to = path.join(dest, name), stat = lstatSync(from);
    if (stat.isSymbolicLink()) throw new Error("SOURCE_LINK_REFUSED");
    if (stat.isDirectory()) { copySkill(from, to, transform); continue; }
    if (!stat.isFile() || stat.nlink !== 1) throw new Error("SOURCE_LINK_REFUSED");
    const content = readFileSync(from);
    writeFileSync(to, name.endsWith(".md") ? transform(content.toString("utf8")) : content, { flag: "wx", mode: stat.mode & 0o755 });
  }
}

export function packageSkills({ out, profile, names = [], root = SKILLS_ROOT, openclaw = false }) {
  const { ok, results } = buildRegistry(root, { privateTerms: privateTermsFrom(profile) });
  if (!ok) throw new Error("INVALID_SKILLS");
  const real = prepareOutput(out);
  const transform = openclaw ? text => text.replace(FULL_PROFILE_POINTER, "") : text => text;
  const packaged = [], skipped = [];
  for (const { dir, entry } of results) {
    if (names.length && !names.includes(entry.name)) continue;
    if (openclaw && OPENCLAW_EXCLUDED_MANAGERS.includes(entry.manager)) { skipped.push(entry.name); continue; }
    if (entry.profil === "oui" && !(profile && existsSync(profile))) { skipped.push(entry.name); continue; }
    const dest = path.join(real, entry.name);
    copySkill(dir, dest, transform);
    if (entry.profil === "oui") {
      const text = readFileSync(profile, "utf8");
      // "wx" = O_CREAT|O_EXCL: never follows or replaces an existing path.
      writeFileSync(path.join(dest, "profil.md"), openclaw ? withoutSections(text, OPENCLAW_DROPPED_SECTIONS) : text, { flag: "wx", mode: 0o600 });
    }
    if (openclaw && readdirSync(dest).some(f => f.endsWith(".md") && readFileSync(path.join(dest, f), "utf8").includes(".ivan-ai-os/profil.md"))) {
      throw new Error("FULL_PROFILE_POINTER_REMAINS");
    }
    packaged.push(entry.name);
  }
  return { out: real, packaged, skipped };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const take = flag => { const i = args.indexOf(flag); return i < 0 ? undefined : args.splice(i, 2)[1]; };
  const out = take("--out") ?? path.join(homedir(), ".ivan-ai-os", "skills-dist");
  const profile = take("--profile") ?? process.env.IVAN_PROFILE_PATH ?? path.join(homedir(), ".ivan-ai-os", "profil.md");
  const route = take("--manager");
  const openclaw = args.includes("--openclaw");
  let names = args.filter(a => a !== "--openclaw");
  if (route) names = skillsForRoute(route);
  const result = packageSkills({ out, profile, openclaw, names });
  console.log(JSON.stringify(result, null, 2));
  if (result.skipped.length) console.error(`Skipped (profile missing or excluded for OpenClaw): ${result.skipped.join(", ")}`);
}
