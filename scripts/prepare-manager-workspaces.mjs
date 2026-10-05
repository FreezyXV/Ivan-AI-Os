// Prepare all seven roles from a reviewed registry. This never writes OpenClaw
// configuration, copies credentials, starts a model or changes existing files.
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createManagerPlan, MANAGER_COMPLETION_GUIDANCE } from "../services/manager-runtime/src/plan.js";
import { installOpenClawSkills } from "./install-openclaw-skills.mjs";
import { PILOT_STATE } from "../shared/pilot-state.mjs";

const [source, target, profile, mainWorkspace, pausedRoutesArg] = process.argv.slice(2);
let stage;
try {
  if (![source, target, profile].every(p => p && path.isAbsolute(p))) throw new Error("ABSOLUTE_PATHS_REQUIRED");
  const sourceRoot = realpathSync(source), parent = realpathSync(path.dirname(target));
  for (let p = parent;; p = path.dirname(p)) {
    if (existsSync(path.join(p, ".git"))) throw new Error("OUTPUT_INSIDE_REPOSITORY");
    if (path.dirname(p) === p) break;
  }
  const parentStat = lstatSync(parent);
  if (!parentStat.isDirectory() || parentStat.uid !== process.getuid?.() || (parentStat.mode & 0o077)) throw new Error("PRIVATE_RUNTIME_DIRECTORY_REQUIRED");
  try { lstatSync(target); throw new Error("EXISTING_MANAGER_WORKSPACES_PRESERVED"); } catch (error) { if (error.code !== "ENOENT") throw error; }
  const { loadManagers, checkManagers } = await import(pathToFileURL(path.join(sourceRoot, "agents/tools/managers.mjs")));
  const { buildRegistry } = await import(pathToFileURL(path.join(sourceRoot, "skills/tools/registry.mjs")));
  const managers = loadManagers(), registry = buildRegistry();
  if (!registry.ok || checkManagers(managers).length) throw new Error("INVALID_MANAGER_REGISTRY");
  if (mainWorkspace && !lstatSync(mainWorkspace).isDirectory()) throw new Error("INVALID_MAIN_WORKSPACE");
  const pausedRoutes = pausedRoutesArg === undefined ? PILOT_STATE.pausedRoutes : pausedRoutesArg ? pausedRoutesArg.split(',') : [];
  const plan = createManagerPlan({ managers, skills: registry.results.map(r => r.entry), runtimeRoot: target, mainWorkspace, pausedRoutes });
  stage = mkdtempSync(path.join(parent, ".ivan-manager-stage-"));
  for (const role of plan.roles) {
    const workspace = path.join(stage, role.role); mkdirSync(workspace, { mode: 0o700 });
    const roleText = role.publicContextOnly ? "# Finance publique\nVeille macro et opportunités publiques sourcées, sans portefeuille ni objectifs personnels. Les contextualiser dans Claude si Ivan le demande. Ne jamais exécuter une transaction.\n" : readFileSync(path.join(sourceRoot, "agents/managers", `${role.role}.md`), "utf8");
    writeFileSync(path.join(workspace, "ROLE.md"), roleText, { mode: 0o600 });
    const delegation = role.agentId === "main"
      ? "Faire router les catégories autorisées par ivan_route. Déléguer au manager configuré via sessions_spawn en contexte isolated. Détails manquants ne rendent pas un domaine clair ambigu : demander le cahier des charges avant exécution. Finance personnelle : contexte privé Claude uniquement."
      : role.publicContextOnly ? "Finance publique : rechercher des sources primaires, dater les chiffres, distinguer faits et scénarios, présenter opportunités et risques. Aucun accès au profil, actifs, montants ou objectifs personnels d'Ivan ; cette analyse reste dans Claude. Aucune transaction."
      : `Manager ${role.role}. Pour un worker, sessions_spawn vers ${role.agentId} en contexte isolated, objectif borné et résultat vérifiable. Retourner au parent ; aucune boucle de suivi.`;
    const instructions = `# Ivan AI OS — ${role.role}\n\n${role.description}\n\n${delegation}\n\n${MANAGER_COMPLETION_GUIDANCE}\n\nSkills autorisés : ${role.skills.join(", ")}. Lire uniquement le skill utile.\nRecherche et brouillons peuvent avancer dans le périmètre autorisé. Les GO d'Ivan persistent. Paiement, contact tiers, publication et destruction nécessitent son autorisation exacte.\nNe pas imprimer de secrets ni de données confidentielles dans les journaux. Les modèles ne donnent pas de permission d'exécution.\nVoir ROLE.md pour la mission. Le rôle est préparé et doit encore être activé/vérifié dans son runtime.\n`;
    writeFileSync(path.join(workspace, "AGENTS.md"), instructions, { mode: 0o600 });
    await installOpenClawSkills({ source: sourceRoot, workspace, profile, selectedNames: role.skills, profileMode: role.publicContextOnly ? "none" : "reduced" });
  }
  writeFileSync(path.join(stage, "manager-plan.json"), JSON.stringify(plan, null, 2), { mode: 0o600 });
  renameSync(stage, target); stage = undefined;
  console.log(JSON.stringify({ roles_prepared: plan.roles.length, openclaw_roles: plan.roles.filter(r => r.runtime === "openclaw" && r.status !== "PAUSED").length, paused_roles:plan.roles.filter(r=>r.status==="PAUSED").map(r=>r.route), private_finance_context: "claude-only", distinct_workspaces: true, secretary_workspace_preserved: Boolean(mainWorkspace), live_config_modified: false, models_started: 0 }));
} catch (error) {
  const code = error.code ?? error.message;
  console.error(/^[A-Z][A-Z_]{0,63}$/.test(code) ? code : "MANAGER_PREPARATION_REFUSED"); process.exitCode = 1;
} finally { if (stage) rmSync(stage, { recursive: true, force: true }); }
