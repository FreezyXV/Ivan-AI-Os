// Package skills for runtimes that cannot read the repository (claude.ai upload,
// OpenClaw skills folder). Profile skills get the private profile copied in.
// Usage: node skills/tools/package.mjs [--out DIR] [--profile FILE] [--openclaw] [name ...]
// --openclaw (Ivan's decision 2026-09-29): drop the "Clients" and "Cadre d'investissement"
// profile sections and exclude finance skills; clients and personal finances stay on Claude.
import { chmodSync, cpSync, existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SKILLS_ROOT, buildRegistry, privateTermsFrom } from "./registry.mjs";

const REPO_ROOT = path.resolve(SKILLS_ROOT, "..");

export const OPENCLAW_DROPPED_SECTIONS = ["Clients", "Cadre d'investissement"];
export const OPENCLAW_EXCLUDED_MANAGERS = ["finance"];

export function withoutSections(text, headings) {
  return headings.reduce((result, heading) => {
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return result.replace(new RegExp(`^## ${escaped}[^\\n]*\\n[\\s\\S]*?(?=^## |(?![\\s\\S]))`, "m"), "");
  }, text);
}

export function packageSkills({ out, profile, names = [], root = SKILLS_ROOT, openclaw = false }) {
  const target = path.resolve(out);
  mkdirSync(target, { recursive: true });
  const real = realpathSync(target);
  const repo = realpathSync(REPO_ROOT);
  // The private profile must never be written anywhere Git can pick it up.
  if (real === repo || real.startsWith(repo + path.sep)) throw new Error("OUTPUT_INSIDE_REPOSITORY");
  const { ok, results } = buildRegistry(root, { privateTerms: privateTermsFrom(profile) });
  if (!ok) throw new Error("INVALID_SKILLS");
  const packaged = [], skipped = [];
  for (const { dir, entry } of results) {
    if (names.length && !names.includes(entry.name)) continue;
    if (openclaw && OPENCLAW_EXCLUDED_MANAGERS.includes(entry.manager)) { skipped.push(entry.name); continue; }
    if (entry.profil === "oui" && !(profile && existsSync(profile))) { skipped.push(entry.name); continue; }
    const dest = path.join(real, entry.name);
    cpSync(dir, dest, { recursive: true, filter: src => !/(?:^|\/)(?:__pycache__|\.DS_Store)$/.test(src) });
    if (entry.profil === "oui") {
      const text = readFileSync(profile, "utf8");
      writeFileSync(path.join(dest, "profil.md"), openclaw ? withoutSections(text, OPENCLAW_DROPPED_SECTIONS) : text, { mode: 0o600 });
      chmodSync(path.join(dest, "profil.md"), 0o600);
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
  const openclaw = args.includes("--openclaw");
  const result = packageSkills({ out, profile, openclaw, names: args.filter(a => a !== "--openclaw") });
  console.log(JSON.stringify(result, null, 2));
  if (result.skipped.length) console.error(`Skipped (profile missing or excluded for OpenClaw): ${result.skipped.join(", ")}`);
}
