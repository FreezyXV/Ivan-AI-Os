import test from "node:test";
import assert from "node:assert/strict";
import { createManagerPlan, buildDispatchPlan, ROUTES } from "../src/plan.js";
const skills = [...ROUTES, "orchestrator"].map(manager => ({ name: `${manager}-skill`, manager, statut: "actif" }));
skills.push({ name: "recherche-sourcee", manager: "knowledge", statut: "actif" }, { name: "rapport-telegram", manager: "system", statut: "actif" });
const managers = [...ROUTES, "orchestrator"].map(route => ({ route, skills: [`${route}-skill`], description: "Synthetic role" }));
const metadata = { requested_tasks: ["unit_test"], urgency: "none", details_available: false };

test("all seven roles have independent workspaces and bounded native delegation", () => {
  const plan = createManagerPlan({ managers, skills, runtimeRoot: "/synthetic-private-runtime/managers" });
  assert.equal(plan.roles.length, 7);
  assert.equal(new Set(plan.roles.map(r => r.workspace)).size, 7);
  assert.equal(Object.keys(plan.openclawFragment.agents.entries).length, 7);
  assert.equal(plan.roles.find(r => r.route === "finance").publicContextOnly, true);
  const entries = plan.openclawFragment.agents.entries;
  assert.equal(entries.main.subagents.allowAgents.length, 6);
  assert.equal(entries["ivan-finance"].tools.allow.includes("write"), false);
  for (const [id, entry] of Object.entries(entries)) {
    assert.ok(entry.tools.deny.includes("exec"));
    assert.equal(entry.tools.fs.workspaceOnly, true);
    if (id !== "main") { assert.deepEqual(entry.subagents.allowAgents, [id]); assert.ok(entry.tools.deny.includes("message")); }
  }
  assert.equal(plan.openclawFragment.agents.defaults.subagents.maxSpawnDepth, 2);
});
test("all six confirmed routes select the exact role without forwarding private context", () => {
  const plan = createManagerPlan({ managers, skills, runtimeRoot: "/synthetic-private-runtime/managers" });
  for (const manager of ROUTES) {
    const result = buildDispatchPlan({ route: { status: "ROUTED", manager, manager_confidence: 0.95 }, metadata, plan });
    assert.equal(result.executable, false);
    assert.equal(result.spawn.agentId, `ivan-${manager}`); assert.equal(result.spawn.context, "isolated"); assert.equal(result.spawn.runTimeoutSeconds, 300);
  }
  const privatePlan = buildDispatchPlan({ route: { status: "ROUTED", manager: "finance", manager_confidence: 0.95 }, metadata: { ...metadata, requested_tasks: ["portfolio_review"] }, plan });
  assert.equal(privatePlan.status, "PRIVATE_CLAUDE_HANDOFF"); assert.equal(privatePlan.spawn, undefined);
});
test("ambiguous routes and private extra fields cannot produce a delegation", () => {
  const plan = createManagerPlan({ managers, skills, runtimeRoot: "/synthetic-private-runtime/managers" });
  for (const route of [null, { status: "REVIEW" }, { status: "ROUTED", manager: "unknown", manager_confidence: 1 }, { status: "ROUTED", manager: "career", manager_confidence: 0.6 }]) {
    assert.equal(buildDispatchPlan({ route, metadata, plan }).status, "REVIEW");
  }
  assert.throws(() => buildDispatchPlan({ route: { status: "ROUTED", manager: "career", manager_confidence: 1 }, metadata: { ...metadata, client: "SYNTHETIC_PRIVATE_CLIENT" }, plan }), /ROUTING_METADATA_REQUIRED/);
});
test("incomplete, duplicated or unknown manager definitions are rejected", () => {
  for (const bad of [managers.slice(1), [...managers.slice(1), managers[1]], managers.map(m => ({ ...m, skills: ["unknown"] }))]) {
    assert.throws(() => createManagerPlan({ managers: bad, skills, runtimeRoot: "/synthetic-private-runtime/managers" }), /INVALID_MANAGER_REGISTRY/);
  }
});

test("activation preserves the Secretary workspace and excludes unavailable memory access", () => {
  const extraSkills = [...skills, { name: "memoire-obsidian", manager: "system", statut: "actif" }];
  const definitions = managers.map(m => ["system", "knowledge"].includes(m.route)
    ? { ...m, skills: [...m.skills, "memoire-obsidian"] } : m);
  const plan = createManagerPlan({ managers: definitions, skills: extraSkills,
    runtimeRoot: "/synthetic-private-runtime/managers", mainWorkspace: "/existing-secretary" });
  assert.equal(plan.openclawFragment.agents.entries.main.workspace, "/existing-secretary");
  assert.equal(plan.roles.find(r => r.agentId === "main").preparedWorkspace,
    "/synthetic-private-runtime/managers/chief-of-staff");
  assert.ok(plan.roles.every(r => !r.skills.includes("memoire-obsidian")));
});

test("future plans preserve all role definitions but cannot reactivate a paused manager", () => {
  const plan = createManagerPlan({ managers, skills, runtimeRoot: "/synthetic-private-runtime/managers", pausedRoutes:["career"] });
  assert.equal(plan.roles.length,7);
  assert.equal(plan.roles.find(r=>r.route==='career').status,'PAUSED');
  assert.equal(Object.keys(plan.openclawFragment.agents.entries).length,6);
  assert.equal(plan.openclawFragment.agents.entries.main.subagents.allowAgents.includes('ivan-career'),false);
  const result=buildDispatchPlan({route:{status:'ROUTED',manager:'career',manager_confidence:1},metadata,plan});
  assert.equal(result.status,'PAUSED');assert.equal(result.spawn,undefined);
  for(const pausedRoutes of [['unknown'],['career','career'],'career'])
    assert.throws(()=>createManagerPlan({ managers, skills, runtimeRoot:'/synthetic-private-runtime/managers',pausedRoutes }),/INVALID_PAUSED_ROUTES/);
});
