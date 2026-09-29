// Skill registry: parse and validate skills/<name>/SKILL.md (Agent Skills format
// shared by Claude Code, Codex and OpenClaw). Usage: node skills/tools/registry.mjs
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SKILLS_ROOT = fileURLToPath(new URL("..", import.meta.url));
const TOP_LEVEL = new Set(["name", "description", "license", "compatibility", "metadata", "allowed-tools"]);
const ENUMS = {
  manager: ["business", "career", "finance", "knowledge", "engineering", "system"],
  risque: ["lecture", "brouillon", "ecriture-depot", "action-externe"],
  profil: ["oui", "non"],
  statut: ["actif", "brouillon"]
};
// Ivan's decision (2026-09-29): clients and personal finances never reach OpenClaw.
export const OPENCLAW_DROPPED_SECTIONS = ["Clients", "Cadre d'investissement"];
export const OPENCLAW_EXCLUDED_MANAGERS = ["finance"];
const REQUIRED_METADATA = ["version", "famille", "manager", "risque", "profil", "statut", "provenance"];
// Credentials and direct personal identifiers never belong in a shared skill.
const FORBIDDEN = [
  [/\b(?:sk|pk|rk)-[A-Za-z0-9_-]{16,}/, "API key"],
  [/\bgh[pousr]_[A-Za-z0-9]{20,}/, "GitHub token"],
  [/\bAKIA[0-9A-Z]{16}\b/, "AWS key"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "private key"],
  [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, "email address"],
  [/(?:\+|\b00)\d[\d .-]{8,}\d\b/, "phone number"]
];

export function parseSkill(text) {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text.replace(/\r\n/g, "\n"));
  if (!match) throw new Error("missing frontmatter");
  const data = {}, metadata = {};
  let inMetadata = false;
  for (const line of match[1].split("\n")) {
    if (!line.trim()) continue;
    const nested = /^ {2}([a-z][a-z0-9_-]*): (.+)$/.exec(line);
    if (inMetadata && nested) { metadata[nested[1]] = unquote(nested[2]); continue; }
    const top = /^([a-z][a-z0-9_-]*):(?: (.*))?$/.exec(line);
    if (!top) throw new Error(`unparsable frontmatter line: ${line.slice(0, 40)}`);
    inMetadata = top[1] === "metadata" && !top[2];
    data[top[1]] = inMetadata ? metadata : unquote(top[2] ?? "");
  }
  return { data, body: match[2] };
}

function unquote(value) {
  const v = value.trim();
  return /^(["']).*\1$/.test(v) ? v.slice(1, -1) : v;
}

export function validateSkill(dir, { privateTerms = [] } = {}) {
  const errors = [];
  const file = path.join(dir, "SKILL.md");
  if (!existsSync(file)) return { errors: ["SKILL.md missing"] };
  const text = readFileSync(file, "utf8");
  let parsed;
  try { parsed = parseSkill(text); } catch (error) { return { errors: [error.message] }; }
  const { data, body } = parsed;
  const name = path.basename(dir);
  for (const key of Object.keys(data)) if (!TOP_LEVEL.has(key)) errors.push(`unknown frontmatter key: ${key}`);
  if (data.name !== name) errors.push(`name must equal directory (${name})`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64) errors.push("name must be kebab-case, 64 chars max");
  if (typeof data.description !== "string" || !data.description || data.description.length > 1024) errors.push("description required, 1024 chars max");
  const meta = typeof data.metadata === "object" ? data.metadata : {};
  for (const key of REQUIRED_METADATA) if (!meta[key]) errors.push(`metadata.${key} required`);
  for (const [key, allowed] of Object.entries(ENUMS)) if (meta[key] && !allowed.includes(meta[key])) errors.push(`metadata.${key} must be one of ${allowed.join("|")}`);
  if (meta.version && !/^\d+\.\d+\.\d+$/.test(meta.version)) errors.push("metadata.version must be semver");
  if (meta.profil === "oui" && !body.includes("profil.md")) errors.push("profile skill must say where profil.md is read");
  if (body.split("\n").length > 500) errors.push("body over 500 lines: move detail to reference files");
  for (const [pattern, label] of FORBIDDEN) if (pattern.test(text)) errors.push(`forbidden content: ${label}`);
  const lower = text.toLowerCase();
  for (const term of privateTerms) if (lower.includes(term.toLowerCase())) errors.push("private profile term found in shared skill");
  for (const [, target] of body.matchAll(/\]\((?!https?:|#)([^)\s]+)\)/g)) {
    if (!existsSync(path.join(dir, target))) errors.push(`broken link: ${target}`);
  }
  const evals = checkEvals(dir, name, errors);
  return { errors, entry: { name, description: data.description, ...meta }, evals };
}

// Optional trigger evaluations: 3 prompts that must select the skill, 2 near misses
// naming the skill that should win instead, and one verifiable deliverable criterion.
function checkEvals(dir, name, errors) {
  const file = path.join(dir, "evals.json");
  if (!existsSync(file)) return undefined;
  let evals;
  try { evals = JSON.parse(readFileSync(file, "utf8")); } catch { errors.push("evals.json is not valid JSON"); return undefined; }
  const text = (value, min = 10) => typeof value === "string" && value.trim().length >= min;
  if (evals.skill !== name || evals.version !== 1) errors.push("evals.json: skill must equal name, version 1");
  if (!Array.isArray(evals.positifs) || evals.positifs.length !== 3 || !evals.positifs.every(p => text(p))) errors.push("evals.json: exactly 3 positifs");
  if (!Array.isArray(evals.negatifs) || evals.negatifs.length !== 2 || !evals.negatifs.every(n => text(n?.demande) && text(n?.attendu, 2) && n.attendu !== name)) errors.push("evals.json: exactly 2 negatifs {demande, attendu≠skill}");
  if (!text(evals.livrable, 20)) errors.push("evals.json: livrable required");
  for (const [pattern, label] of FORBIDDEN) if (pattern.test(JSON.stringify(evals))) errors.push(`evals.json forbidden content: ${label}`);
  return evals;
}

export function skillDirs(root = SKILLS_ROOT) {
  return readdirSync(root).filter(n => !/^[._]/.test(n) && !["tools", "test"].includes(n))
    .map(n => path.join(root, n)).filter(p => statSync(p).isDirectory());
}

// Names on "Clients : a, b, c" lines of the private profile; checked only where it exists.
export function privateTermsFrom(profilePath) {
  if (!profilePath || !existsSync(profilePath)) return [];
  const lines = readFileSync(profilePath, "utf8").match(/^Clients\s*:.*$/gm) ?? [];
  return [...new Set(lines.flatMap(l => l.replace(/^Clients\s*:/, "").split(/,|\bet\b|\./)).map(t => t.trim()).filter(t => t.length >= 3))];
}

export function buildRegistry(root = SKILLS_ROOT, options = {}) {
  const results = skillDirs(root).map(dir => ({ dir, ...validateSkill(dir, options) }));
  const names = new Set(results.map(r => r.entry?.name));
  for (const r of results) for (const n of r.evals?.negatifs ?? []) {
    // "aucun" = the request must trigger no skill at all (plain answer).
    if (n.attendu !== "aucun" && !names.has(n.attendu)) r.errors.push(`evals.json: unknown expected skill ${n.attendu}`);
  }
  return { ok: results.every(r => !r.errors.length), results };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const profile = process.env.IVAN_PROFILE_PATH;
  const { ok, results } = buildRegistry(SKILLS_ROOT, { privateTerms: privateTermsFrom(profile) });
  for (const r of results) {
    const e = r.entry ?? {};
    console.log(`${r.errors.length ? "KO" : "OK"}  ${path.basename(r.dir).padEnd(26)} ${e.manager ?? "?"}/${e.risque ?? "?"} ${e.statut ?? ""}${r.evals ? "  evals" : ""}`);
    for (const error of r.errors) console.log(`    - ${error}`);
  }
  console.log(`\n${results.length} skill(s)${profile ? ", private profile checked" : ""}.`);
  process.exit(ok ? 0 : 1);
}
