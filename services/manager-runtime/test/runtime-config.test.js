import test from "node:test";
import assert from "node:assert/strict";
import { createManagerPlan, ROUTES } from "../src/plan.js";
import { proposeRuntimeConfig } from "../src/runtime-config.js";
const skills = [...ROUTES, "orchestrator"].map(manager => ({ name: `${manager}-skill`, manager, statut: "actif" }));
skills.push({ name: "recherche-sourcee", manager: "knowledge", statut: "actif" }, { name: "rapport-telegram", manager: "system", statut: "actif" });
const managers = [...ROUTES, "orchestrator"].map(route => ({ route, skills: [`${route}-skill`], description: "Synthetic" }));
const makePlan = () => createManagerPlan({ managers, skills, runtimeRoot: "/prepared/managers", mainWorkspace: "/existing-secretary" });
const current = {
  agents: { defaults: { model: { primary: "synthetic-model" } }, entries: { main: { name: "Secrétaire", tools: { deny: ["synthetic-denied"], allow: ["read", "sessions_spawn"] } } } },
  tools: { deny: ["exec"] }, bindings: [{ agentId: "main", match: { channel: "telegram" } }],
  channels: { telegram: { botToken: "SYNTHETIC_NOT_A_SECRET", allowFrom: ["synthetic-user"] } },
  plugins: { allow: ["ivan-ai-os-route"], entries: { "ivan-ai-os-route": { enabled: true, config: { gatewayUrl: "http://127.0.0.1:4310" } } } }
};
const propose = (overrides = {}) => proposeRuntimeConfig({ current, plan: makePlan(), defaultMainWorkspace: "/existing-secretary", gatewayUrl: "http://127.0.0.1:4311", ...overrides });

test("candidate preserves identity, credentials, bindings and model without mutating input", () => {
  const before = structuredClone(current), result = propose();
  assert.deepEqual(current, before);
  for (const key of ["bindings", "channels", "tools"]) assert.deepEqual(result[key], current[key]);
  assert.deepEqual(result.agents.defaults.model, current.agents.defaults.model);
  assert.equal(result.agents.entries.main.name, "Secrétaire");
  assert.equal(result.agents.entries.main.workspace, "/existing-secretary");
  assert.ok(result.agents.entries.main.tools.deny.includes("synthetic-denied"));
  assert.deepEqual(result.agents.entries.main.tools.allow, current.agents.entries.main.tools.allow);
  assert.equal(Object.keys(result.agents.entries).length, 7);
  assert.equal(result.plugins.entries["ivan-ai-os-route"].config.gatewayUrl, "http://127.0.0.1:4311");
});
test("explicit Secretary workspace and stricter existing limits are preserved", () => {
  const input = structuredClone(current);
  input.agents.entries.main.workspace = "/existing-secretary";
  input.agents.defaults.subagents = { maxConcurrent: 1, runTimeoutSeconds: 120, archiveAfterMinutes: 10 };
  const result = propose({ current: input, defaultMainWorkspace: "/irrelevant-default" });
  assert.equal(result.agents.defaults.subagents.maxConcurrent, 1);
  assert.equal(result.agents.defaults.subagents.runTimeoutSeconds, 120);
  assert.equal(result.agents.defaults.subagents.archiveAfterMinutes, 10);
  assert.throws(() => propose({ defaultMainWorkspace: "/different-workspace" }), /SECRETARY_WORKSPACE_CHANGE_REFUSED/);
});
test("existing manager and delegation restrictions require explicit reconciliation", () => {
  const input = structuredClone(current); input.agents.entries["ivan-career"] = { workspace: "/old-career" };
  assert.throws(() => propose({ current: input }), /EXISTING_MANAGER_PRESERVED/);
  delete input.agents.entries["ivan-career"]; input.agents.entries.main.subagents = { allowAgents: ["ivan-career"] };
  assert.throws(() => propose({ current: input }), /EXISTING_DELEGATION_RESTRICTION_PRESERVED/);
});
test("candidate cannot point at remote or ambiguous gateway addresses", () => {
  for (const gatewayUrl of ["http://localhost:4311", "https://example.invalid", "http://127.0.0.1:4311/private", "http://127.0.0.1:70000"]) {
    assert.throws(() => propose({ gatewayUrl }));
  }
});
test("pinned plugin replaces only the route source and preserves other plugins", () => {
  const input = structuredClone(current);
  input.plugins.load = { paths: ["/builder/hooks/openclaw/ivan-route", "/other/ivan-route"] };
  const result = propose({ current: input, routePluginPath: "/private-release/hooks/openclaw/ivan-route", previousRoutePath: "/builder/hooks/openclaw/ivan-route" });
  assert.deepEqual(result.plugins.load.paths, ["/other/ivan-route", "/private-release/hooks/openclaw/ivan-route"]);
  assert.deepEqual(input.plugins.load.paths, ["/builder/hooks/openclaw/ivan-route", "/other/ivan-route"]);
});

test("runtime candidate keeps an explicitly paused role out of the active roster", () => {
  const plan=createManagerPlan({ managers,skills,runtimeRoot:'/prepared/managers',mainWorkspace:'/existing-secretary',pausedRoutes:['career'] });
  const result=propose({plan});
  assert.equal(Object.hasOwn(result.agents.entries,'ivan-career'),false);
  assert.equal(Object.keys(result.agents.entries).length,6);
  assert.deepEqual(result.channels,current.channels);
});
test('external Engineering is retained logically; an existing native Engineering is never silently deleted',()=>{
 const definitions=managers.map(m=>({...m,runtimes:m.route==='engineering'?['codex','claude-code']:['openclaw']}));
 const plan=createManagerPlan({managers:definitions,skills,runtimeRoot:'/prepared/managers',mainWorkspace:'/existing-secretary',pausedRoutes:['career']});
 const result=propose({plan});assert.equal(Object.keys(result.agents.entries).length,5);
 const existing=structuredClone(current);existing.agents.entries['ivan-engineering']={workspace:'/existing-engineering'};
 assert.throws(()=>propose({plan,current:existing}),/EXISTING_MANAGER_PRESERVED/);
 assert.equal(existing.agents.entries['ivan-engineering'].workspace,'/existing-engineering');
});
