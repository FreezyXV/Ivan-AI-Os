import path from "node:path";
import { ROUTES, ROLE_IDS } from "./plan.js";

// Pure proposal: preserve credentials, bindings, models and the Secretary's
// existing workspace. The caller writes only a private, inactive candidate.
export function proposeRuntimeConfig({ current, plan, defaultMainWorkspace, gatewayUrl, routePluginPath, previousRoutePath }) {
  if (!/^http:\/\/(127\.0\.0\.1|\[::1\]):[0-9]+\/?$/.test(gatewayUrl ?? "")) throw new Error("LOOPBACK_GATEWAY_REQUIRED");
  const port = Number(new URL(gatewayUrl).port);
  if (port < 1024 || port > 65535) throw new Error("LOOPBACK_GATEWAY_REQUIRED");
  const fragment = plan?.openclawFragment?.agents;
  const expectedIds = ["main", ...ROUTES.map(r => ROLE_IDS[r])];
  if (!fragment || Object.keys(fragment.entries).length !== 7 || expectedIds.some(id => !fragment.entries[id])) throw new Error("INCOMPLETE_MANAGER_PLAN");
  const config = JSON.parse(JSON.stringify(current));
  const agents = config.agents ?? {}, entries = agents.entries ?? {}, previousMain = entries.main ?? {};
  const workspace = previousMain.workspace ?? agents.defaults?.workspace ?? defaultMainWorkspace;
  if (typeof workspace !== "string" || !path.isAbsolute(workspace) || path.resolve(workspace) !== path.resolve(fragment.entries.main.workspace)) throw new Error("SECRETARY_WORKSPACE_CHANGE_REFUSED");
  if (expectedIds.slice(1).some(id => entries[id])) throw new Error("EXISTING_MANAGER_PRESERVED");
  if (Object.entries(entries).some(([id, entry]) => id !== "main" && entry.default === true)) throw new Error("EXISTING_DEFAULT_AGENT_PRESERVED");
  const inheritedAgents = previousMain.subagents?.allowAgents ?? agents.defaults?.subagents?.allowAgents;
  if (inheritedAgents && !inheritedAgents.includes("*") && expectedIds.slice(1).some(id => !inheritedAgents.includes(id))) throw new Error("EXISTING_DELEGATION_RESTRICTION_PRESERVED");
  const desiredMain = fragment.entries.main;
  const limits = { ...agents.defaults?.subagents, ...fragment.defaults.subagents };
  for (const [key, value] of Object.entries(fragment.defaults.subagents)) {
    const previous = agents.defaults?.subagents?.[key];
    if (Number.isFinite(previous)) limits[key] = Math.min(previous, value);
  }
  const selectedSkills = previousMain.skills ?? agents.defaults?.skills;
  const main = {
    ...previousMain, ...desiredMain,
    skills: selectedSkills ? desiredMain.skills.filter(s => selectedSkills.includes(s)) : desiredMain.skills,
    tools: { ...previousMain.tools, ...desiredMain.tools,
      deny: [...new Set([...(previousMain.tools?.deny ?? []), ...desiredMain.tools.deny])],
      fs: { ...previousMain.tools?.fs, workspaceOnly: true } },
    subagents: { ...previousMain.subagents, ...desiredMain.subagents }
  };
  config.agents = { ...agents, defaults: { ...agents.defaults, subagents: limits },
    entries: { ...entries, ...fragment.entries, main } };
  const plugins = config.plugins ?? {}, route = plugins.entries?.["ivan-ai-os-route"];
  if (!route?.enabled) throw new Error("EXISTING_ROUTE_PLUGIN_REQUIRED");
  config.plugins = { ...plugins, entries: { ...plugins.entries,
    "ivan-ai-os-route": { ...route, config: { ...route.config, gatewayUrl } } } };
  if (routePluginPath !== undefined) {
    if (!path.isAbsolute(routePluginPath) || path.basename(routePluginPath) !== "ivan-route") throw new Error("INVALID_PINNED_PLUGIN_PATH");
    const previousPaths = plugins.load?.paths ?? [];
    if (typeof previousRoutePath !== "string" || !previousPaths.includes(previousRoutePath)) throw new Error("EXISTING_ROUTE_SOURCE_REQUIRED");
    config.plugins.load = { ...plugins.load, paths: [...previousPaths.filter(p => p !== previousRoutePath), routePluginPath] };
  }
  return config;
}
