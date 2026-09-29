// Manager definitions (agents/managers/*.md) checked against the skills registry.
// Usage: node agents/tools/managers.mjs
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OPENCLAW_EXCLUDED_MANAGERS, buildRegistry, parseSkill, SKILLS_ROOT } from "../../skills/tools/registry.mjs";

export const MANAGERS_ROOT = fileURLToPath(new URL("../managers/", import.meta.url));
const ROUTES = ["orchestrator", "business", "career", "finance", "knowledge", "engineering", "system"];
const RUNTIMES = ["openclaw", "claude-ai", "claude-code", "codex"];
const list = value => (value ?? "").split(",").map(v => v.trim()).filter(Boolean);

export function loadManagers(root = MANAGERS_ROOT) {
  return readdirSync(root).filter(n => n.endsWith(".md")).sort().map(file => {
    const { data } = parseSkill(readFileSync(path.join(root, file), "utf8"));
    const meta = data.metadata ?? {};
    return { file, name: data.name, description: data.description, route: meta.route, statut: meta.statut,
      skills: list(meta.skills), runtimes: list(meta.runtimes) };
  });
}

export function checkManagers(managers = loadManagers(), skills = buildRegistry(SKILLS_ROOT).results.map(r => r.entry)) {
  const errors = [];
  const byName = new Map(skills.map(s => [s.name, s]));
  const routes = managers.map(m => m.route);
  for (const m of managers) {
    const where = m.file;
    if (m.name !== path.basename(m.file, ".md")) errors.push(`${where}: name must equal file name`);
    if (!m.description) errors.push(`${where}: description required`);
    if (!ROUTES.includes(m.route)) errors.push(`${where}: route must be one of ${ROUTES.join("|")}`);
    if (routes.filter(r => r === m.route).length > 1) errors.push(`${where}: duplicate route ${m.route}`);
    if (!m.runtimes.length || m.runtimes.some(r => !RUNTIMES.includes(r))) errors.push(`${where}: runtimes must be among ${RUNTIMES.join("|")}`);
    for (const s of m.skills) if (!byName.has(s)) errors.push(`${where}: unknown skill ${s}`);
    // Ivan's rule: personal-finance skills never reach OpenClaw (package.mjs --openclaw drops
    // them); a manager running there must keep at least one public skill.
    if (m.runtimes.includes("openclaw") && !openclawSkills(m, skills).length) errors.push(`${where}: no OpenClaw skill left after exclusions`);
  }
  for (const skill of skills) {
    const owner = managers.find(m => m.route === skill.manager);
    if (!owner) errors.push(`skill ${skill.name}: no manager for route ${skill.manager}`);
    else if (!owner.skills.includes(skill.name)) errors.push(`skill ${skill.name}: not listed by its manager ${owner.name}`);
  }
  return errors;
}

export function openclawSkills(manager, skills) {
  const byName = new Map(skills.map(s => [s.name, s]));
  return manager.skills.filter(s => byName.has(s) && !OPENCLAW_EXCLUDED_MANAGERS.includes(byName.get(s).manager));
}

export function skillsForRoute(route, managers = loadManagers()) {
  const manager = managers.find(m => m.route === route);
  if (!manager) throw new Error("UNKNOWN_ROUTE");
  return manager.skills;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const managers = loadManagers();
  for (const m of managers) console.log(`${m.route.padEnd(12)} ${m.name.padEnd(15)} ${m.skills.length} skills  [${m.runtimes.join(", ")}]`);
  const errors = checkManagers(managers);
  for (const e of errors) console.log(`  - ${e}`);
  console.log(errors.length ? `\n${errors.length} problème(s).` : `\n${managers.length} managers cohérents avec le registre.`);
  process.exit(errors.length ? 1 : 0);
}
