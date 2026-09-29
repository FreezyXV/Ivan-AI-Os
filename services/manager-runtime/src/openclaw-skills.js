// Runtime capability filter owned by Codex. Keep Claude's complete registry intact.
// Memory requires a dedicated tool; Telegram exec and workspace limits stay in force.
export function isOpenClawSkillAvailable(skill) {
  return skill?.statut === "actif" && skill.manager !== "finance" && skill.name !== "memoire-obsidian";
}
