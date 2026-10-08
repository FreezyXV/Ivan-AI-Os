// Skills and configuration auditor: what every agent pays in context, duplicated rules, bloated or
// under-used skills, instruction files that grow. Read-only, deterministic, 0 token.
// Usage: node audit.mjs [--json]
import { existsSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SKILLS_ROOT, buildRegistry, parseSkill } from "../../tools/registry.mjs";

const REPO = path.resolve(SKILLS_ROOT, "..");
export const LIMITS = { description_chars: 600, body_lines: 120, instruction_lines: 60, duplicate_min_chars: 70 };
const tokens = chars => Math.round(chars / 4);

export function audit({ root = SKILLS_ROOT, repo = REPO } = {}) {
  const { results } = buildRegistry(root);
  // Invalid skills are the registry's job to report; the audit covers the valid ones.
  const skills = results.filter(r => !r.errors.length).map(r => {
    const text = readFileSync(path.join(r.dir, "SKILL.md"), "utf8");
    const { body } = parseSkill(text);
    return { name: r.entry.name, description: r.entry.description, body, lines: body.split("\n").length, statut: r.entry.statut, evals: Boolean(r.evals) };
  });
  const findings = [];
  // Descriptions are loaded for every skill in every session: they are the permanent context cost.
  const descriptionTokens = skills.reduce((s, k) => s + tokens(k.description.length), 0);
  for (const k of skills) {
    if (k.description.length > LIMITS.description_chars) findings.push({ niveau: "a_corriger", skill: k.name, texte: `description de ${k.description.length} caractères (> ${LIMITS.description_chars}) : chargée à chaque session` });
    if (k.lines > LIMITS.body_lines) findings.push({ niveau: "remarque", skill: k.name, texte: `${k.lines} lignes : déplacer le détail dans un fichier de référence` });
    if (k.statut === "actif" && !k.evals) findings.push({ niveau: "remarque", skill: k.name, texte: "actif sans evals.json : déclenchement non mesuré" });
  }
  // The same long rule copied in several skills drifts over time: keep it in one place.
  const seen = new Map();
  for (const k of skills) for (const raw of k.body.split("\n")) {
    const line = raw.replace(/^[-*\d.\s]+/, "").trim();
    if (line.length < LIMITS.duplicate_min_chars) continue;
    seen.set(line, [...new Set([...(seen.get(line) ?? []), k.name])]);
  }
  for (const [line, names] of seen) if (names.length > 1) findings.push({ niveau: "a_corriger", skill: names.join(", "), texte: `règle dupliquée : « ${line.slice(0, 90)}… »` });
  for (const f of ["AGENTS.md", "CLAUDE.md"]) {
    const file = path.join(repo, f);
    if (!existsSync(file)) continue;
    const n = readFileSync(file, "utf8").split("\n").length;
    if (n > LIMITS.instruction_lines) findings.push({ niveau: "a_corriger", skill: f, texte: `${n} lignes (> ${LIMITS.instruction_lines}) : chargé dans chaque session` });
  }
  return { skills: skills.length, cout_descriptions_tokens: descriptionTokens, findings };
}

export function report(a) {
  const byLevel = level => a.findings.filter(f => f.niveau === level);
  const lines = [`# Audit skills et configuration`, "", `${a.skills} skills ; descriptions chargées à chaque session : ~${a.cout_descriptions_tokens} tokens.`, ""];
  for (const [level, title] of [["a_corriger", "À corriger"], ["remarque", "Remarques"]]) {
    const list = byLevel(level);
    if (list.length) lines.push(`## ${title} (${list.length})`, "", ...list.map(f => `- **${f.skill}** : ${f.texte}`), "");
  }
  if (!a.findings.length) lines.push("Rien à signaler.");
  return lines.join("\n");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  const a = audit();
  console.log(process.argv.includes("--json") ? JSON.stringify(a, null, 2) : report(a));
}
