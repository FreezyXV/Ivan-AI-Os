import { READ_SKILL_TOOLS } from './openclaw-read-skills.js';
// Runtime capability filter owned by Codex. Keep Claude's complete registry intact.
// Memory requires a dedicated tool; Telegram exec and workspace limits stay in force.
export function isOpenClawSkillAvailable(skill, { availableTools = [] } = {}) {
  if (skill?.statut !== "actif") return false;
  const required = READ_SKILL_TOOLS[skill.name];
  if (required) return required.every(name => availableTools.includes(name)) &&
    (skill.manager !== "finance" || (skill.name === "finance-engine" && skill.profil === "non"));
  return skill.manager !== "finance";
}
