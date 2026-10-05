// Remove a paused role from the active roster, preserving its definition for
// private restore. Files, sessions and source manager definitions are untouched.
export function pauseManager(config, agentId) {
  if (!/^ivan-[a-z]+$/.test(agentId) || !config?.agents?.entries?.[agentId])
    throw new Error('MANAGER_PAUSE_INVALID');
  const next = structuredClone(config);
  const definition = structuredClone(next.agents.entries[agentId]);
  delete next.agents.entries[agentId];
  for (const agent of Object.values(next.agents.entries)) {
    if (Array.isArray(agent.subagents?.allowAgents))
      agent.subagents.allowAgents = agent.subagents.allowAgents.filter(id => id !== agentId);
  }
  return { config: next, paused: { agentId, definition } };
}
