import path from "node:path";
import { validateRoutingMetadata } from "../../jev-gateway/src/routing-metadata.js";
import { isOpenClawSkillAvailable } from "./openclaw-skills.js";

export const ROUTES = Object.freeze(["business", "career", "finance", "knowledge", "engineering", "system"]);
export const ROLE_IDS = Object.freeze(Object.fromEntries(ROUTES.map(route => [route, `ivan-${route}`])));
const deniedTools = ["exec", "process", "message", "gateway", "plugins", "cron", "sessions_send"];

// Native sessions_yield acknowledgment is only a waiting reply. Keep the
// unfinished verification obligation in message so it survives the next turn.
export const MANAGER_RESUME_MESSAGE = "La mission reste à terminer : vérifier le résultat du worker contre le cahier des charges, puis rendre au parent un rapport final non vide avec résultat, vérifications et limites. Le rapport interne est un livrable encore dû ; NO_REPLY ne le remplace pas. Ne pas annoncer de tests exécutés sans preuve. Ne pas créer de worker supplémentaire ni boucler sur les historiques.";
export const MANAGER_COMPLETION_GUIDANCE = `Après sessions_spawn, attendre via sessions_yield avec ce paramètre exact : ${JSON.stringify({ message: MANAGER_RESUME_MESSAGE })}. Utiliser message, pas acknowledgment. À la reprise, achever la vérification et retourner le rapport au parent.`;

// Input comes from Claude's reviewed registry, never a model-provided role list.
export function createManagerPlan({ managers, skills, runtimeRoot, mainWorkspace }) {
  if (!path.isAbsolute(runtimeRoot) || !Array.isArray(managers) || managers.length !== 7 || !Array.isArray(skills)) throw new Error("INVALID_MANAGER_REGISTRY");
  if (mainWorkspace !== undefined && (typeof mainWorkspace !== "string" || !path.isAbsolute(mainWorkspace))) throw new Error("INVALID_MAIN_WORKSPACE");
  const expected = new Set(["orchestrator", ...ROUTES]);
  const known = new Map(skills.map(skill => [skill.name, skill]));
  const roles = managers.map(manager => {
    if (!expected.delete(manager.route) || !Array.isArray(manager.skills) || manager.skills.some(name => !known.has(name))) throw new Error("INVALID_MANAGER_REGISTRY");
    const publicFinance = manager.route === "finance";
    // Ivan explicitly chose public Finance on OpenClaw plus private context on
    // Claude. Reuse public research/report skills, never the personal finance skill.
    const candidates = publicFinance ? ["recherche-sourcee", "rapport-telegram"] : manager.skills;
    if (candidates.some(name => !known.has(name))) throw new Error("INVALID_MANAGER_REGISTRY");
    const allowed = candidates.filter(name => isOpenClawSkillAvailable(known.get(name)));
    if (!allowed.length) throw new Error("MANAGER_WITHOUT_SKILLS");
    return {
      role: manager.route === "orchestrator" ? "chief-of-staff" : manager.route,
      route: manager.route, agentId: manager.route === "orchestrator" ? "main" : ROLE_IDS[manager.route],
      runtime: "openclaw", workspace: manager.route === "orchestrator" && mainWorkspace
        ? mainWorkspace : path.join(runtimeRoot, manager.route === "orchestrator" ? "chief-of-staff" : manager.route),
      ...(manager.route === "orchestrator" && mainWorkspace ? { preparedWorkspace: path.join(runtimeRoot, "chief-of-staff") } : {}),
      skills: allowed, description: publicFinance ? "Veille financière publique : macro, taux, évolutions et opportunités sourcées pour éclairer les décisions d'Ivan." : manager.description,
      publicContextOnly: publicFinance, status: "PREPARED_NOT_ACTIVATED"
    };
  });
  if (expected.size) throw new Error("INVALID_MANAGER_REGISTRY");
  if (new Set(roles.map(role => path.resolve(role.workspace))).size !== 7) throw new Error("WORKSPACE_COLLISION");
  const native = roles.filter(role => role.runtime === "openclaw");
  const agentEntries = Object.fromEntries(native.map(role => [role.agentId, {
    ...(role.agentId === "main" ? { default: true } : {}),
    workspace: role.workspace, skills: role.skills,
    tools: { deny: role.agentId === "main" ? ["exec", "process", "gateway", "plugins", "cron"] : deniedTools,
      ...(role.publicContextOnly ? { allow: ["read", "web_search", "web_fetch", "sessions_spawn", "sessions_yield", "subagents", "sessions_list", "sessions_history"] } : {}),
      fs: { workspaceOnly: true } },
    subagents: { allowAgents: role.agentId === "main" ? native.filter(r => r.agentId !== "main").map(r => r.agentId) : [role.agentId], delegationMode: "prefer" }
  }]));
  return {
    version: 1, roles,
    openclawFragment: { agents: { defaults: { subagents: { maxSpawnDepth: 2, maxChildrenPerAgent: 2, maxConcurrent: 3, runTimeoutSeconds: 300 } }, entries: agentEntries } },
    privateFinanceBridge: { role: "finance", runtime: "claude-private", receivesPrivateDataThroughTelegram: false, automaticExecution: false },
    activation: "REQUIRES_REVIEWED_SOURCE_AND_COORDINATED_RUNTIME_MIGRATION"
  };
}

// A dispatch suggestion is a workflow plan, not execution permission. The
// native sessions_spawn tool remains responsible for its own authorization.
export function buildDispatchPlan({ route, metadata, plan }) {
  const safeMetadata = validateRoutingMetadata(metadata);
  if (!route || route.status !== "ROUTED" || !ROUTES.includes(route.manager) || !Number.isFinite(route.manager_confidence) || route.manager_confidence < 0.7 || route.manager_confidence > 1) {
    return { status: "REVIEW", reason: "ROUTE_UNCONFIRMED", executable: false };
  }
  const role = plan.roles.find(r => r.route === route.manager);
  if (!role) throw new Error("MANAGER_NOT_CONFIGURED");
  if (safeMetadata.requested_tasks.includes("portfolio_review")) return { status: "PRIVATE_CLAUDE_HANDOFF", manager: "finance", executable: false, private_data_forwarded: false };
  return {
    status: "DELEGATION_PROPOSED", manager: route.manager, executable: false,
    spawn: { agentId: role.agentId, runtime: "subagent", context: "isolated", mode: "run", runTimeoutSeconds: 300, deliver: false,
      task: `Traiter les métadonnées de tâche suivantes dans ton rôle ${role.role} : ${JSON.stringify(safeMetadata)}. Si le cahier des charges manque, demander uniquement les informations nécessaires à l'exécution. Aucun paiement, contact tiers, publication ou opération destructive. Retourner un résultat vérifiable au chef de cabinet. ${MANAGER_COMPLETION_GUIDANCE}` }
  };
}
