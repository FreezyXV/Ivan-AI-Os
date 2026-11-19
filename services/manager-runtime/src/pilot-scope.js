import {PILOT_STATE} from '../../../shared/pilot-state.mjs';

// Remove operational access, rather than editing manager workspaces or archives.
export function applyPilotScope(config) {
  const excluded = new Set([...PILOT_STATE.excludedRoutes,...PILOT_STATE.pausedRoutes].map(route => `ivan-${route}`));
  const agents = config.agents;
  if (!agents || !agents.entries?.main && !agents.list?.some(agent => agent.id==='main')) throw Error('PILOT_SECRETARY_REQUIRED');
  if (agents.entries) for (const id of excluded) delete agents.entries[id];
  if (agents.list) agents.list = agents.list.filter(agent => !excluded.has(agent.id));
  const scopes = [agents.defaults,...Object.values(agents.entries??{}),...(agents.list??[])];
  for (const scope of scopes) {
    const allowed = scope?.subagents?.allowAgents;
    if (Array.isArray(allowed)) scope.subagents.allowAgents = allowed.filter(id => !excluded.has(id));
  }
  if (Array.isArray(config.bindings)) config.bindings = config.bindings.filter(binding => !excluded.has(binding.agentId));
  return config;
}
