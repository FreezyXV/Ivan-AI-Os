import test from "node:test";
import assert from "node:assert/strict";
import { createManagerPlan, buildDispatchPlan, ROUTES } from "../src/plan.js";
import { routePilotTask } from "../../../hooks/openclaw/ivan-route/pilot-routing.js";
import { applyPilotScope } from "../src/pilot-scope.js";
const skills = [...ROUTES, "orchestrator"].map(manager => ({ name: `${manager}-skill`, manager, statut: "actif" }));
skills.push({ name: "recherche-sourcee", manager: "knowledge", statut: "actif" }, { name: "rapport-telegram", manager: "system", statut: "actif" });
const managers = [...ROUTES, "orchestrator"].map(route => ({ route, skills: [`${route}-skill`], description: "Synthetic role" }));
const metadata = { requested_tasks: ["unit_test"], urgency: "none", details_available: false };

test("role definitions are preserved and Knowledge is absent from native delegation", () => {
  const plan = createManagerPlan({ managers, skills, runtimeRoot: "/synthetic-private-runtime/managers" });
  assert.equal(plan.roles.length, 7);
  assert.equal(new Set(plan.roles.map(r => r.workspace)).size, 7);
  assert.equal(Object.keys(plan.openclawFragment.agents.entries).length, 6);
  assert.equal(plan.roles.find(r => r.route === "finance").publicContextOnly, true);
  const entries = plan.openclawFragment.agents.entries;
  assert.equal(entries.main.subagents.allowAgents.length, 5);
  assert.equal(entries["ivan-knowledge"],undefined);
  assert.equal(entries["ivan-finance"].tools.allow.includes("write"), false);
  for (const [id, entry] of Object.entries(entries)) {
    assert.ok(entry.tools.deny.includes("exec"));
    assert.equal(entry.tools.fs.workspaceOnly, true);
    if (id !== "main") { assert.deepEqual(entry.subagents.allowAgents, [id]); assert.ok(entry.tools.deny.includes("message")); }
  }
  assert.equal(plan.openclawFragment.agents.defaults.subagents.maxSpawnDepth, 2);
});
test("confirmed routes preserve dispatch fields and excluded routes never delegate", () => {
  const plan = createManagerPlan({ managers, skills, runtimeRoot: "/synthetic-private-runtime/managers" });
  for (const manager of ROUTES) {
    const result = buildDispatchPlan({ route: { status: "ROUTED", manager, manager_confidence: 0.95 }, metadata, plan });
    assert.equal(result.executable, false);
    if(manager==="knowledge"){assert.equal(result.status,"EXCLUDED");assert.equal(result.spawn,undefined);continue;}
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
  assert.equal(Object.keys(plan.openclawFragment.agents.entries).length,5);
  assert.equal(plan.openclawFragment.agents.entries.main.subagents.allowAgents.includes('ivan-career'),false);
  const result=buildDispatchPlan({route:{status:'ROUTED',manager:'career',manager_confidence:1},metadata,plan});
  assert.equal(result.status,'PAUSED');assert.equal(result.spawn,undefined);
  for(const pausedRoutes of [['unknown'],['career','career'],'career'])
    assert.throws(()=>createManagerPlan({ managers, skills, runtimeRoot:'/synthetic-private-runtime/managers',pausedRoutes }),/INVALID_PAUSED_ROUTES/);
});
test('the pilot removes legacy bindings and accepts only active qualified metadata',()=>{
 const agents=['main','ivan-knowledge','ivan-career','ivan-finance','ivan-system'];
 const config={agents:{entries:Object.fromEntries(agents.map(id=>[id,{workspace:`/${id}`,subagents:{allowAgents:agents}}])),
   list:agents.map(id=>({id})),defaults:{subagents:{allowAgents:agents}}},bindings:agents.map(agentId=>({agentId}))};
 applyPilotScope(config);
 assert.deepEqual(Object.keys(config.agents.entries),['main','ivan-finance','ivan-system']);
 assert.deepEqual(config.agents.list.map(a=>a.id),['main','ivan-finance','ivan-system']);
 assert.deepEqual(config.agents.entries.main.subagents.allowAgents,['main','ivan-finance','ivan-system']);
 assert.equal(config.agents.entries.main.workspace,'/main');
 assert.equal(config.bindings.length,3);
 for(const [task,reason] of [['topic_research','PILOT_ROUTE_EXCLUDED'],['job_search','PILOT_ROUTE_PAUSED'],['portfolio_review','PILOT_PRIVATE_FINANCE']]){
  assert.equal(routePilotTask({...metadata,requested_tasks:[task]}).reason_code,reason);
 }
 const route=routePilotTask({...metadata,requested_tasks:['learning_material','financial_research']});
 const plan=createManagerPlan({managers,skills,runtimeRoot:'/synthetic-runtime',pausedRoutes:['career']});
 assert.equal(buildDispatchPlan({route,metadata,plan}).spawn.agentId,'ivan-finance');
});
test('declared external runtimes retain Engineering but cannot pretend a shell-less native worker will implement its task',()=>{
 const definitions=managers.map(m=>({...m,runtimes:m.route==='engineering'?['codex','claude-code']:['openclaw']}));
 const plan=createManagerPlan({managers:definitions,skills,runtimeRoot:'/synthetic-runtime',pausedRoutes:['career']});
 assert.equal(plan.roles.length,7);assert.equal(plan.roles.find(r=>r.route==='engineering').runtime,'external');
 assert.equal(plan.openclawFragment.agents.entries['ivan-engineering'],undefined);
 assert.equal(plan.openclawFragment.agents.entries.main.subagents.allowAgents.includes('ivan-engineering'),false);
 const dispatch=buildDispatchPlan({route:{status:'ROUTED',manager:'engineering',manager_confidence:1},metadata,plan});
 assert.equal(dispatch.status,'EXTERNAL_MANAGER_HANDOFF');assert.deepEqual(dispatch.runtimes,['codex','claude-code']);
 assert.equal(dispatch.executable,false);assert.equal(dispatch.spawn,undefined);
 assert.throws(()=>createManagerPlan({managers:definitions.map(m=>({...m,runtimes:['unknown']})),skills,runtimeRoot:'/synthetic-runtime'}),/INVALID_MANAGER_RUNTIMES/);
});
test('runtime compatibility takes precedence over a native tool or an otherwise active skill',()=>{
 const definitions=managers.map(m=>m.route==='system'?{...m,skills:['system-skill','rapport-telegram']}:m);
 const filtered=skills.map(s=>s.name==='system-skill'?{...s,compatibility:['codex','claude-code']}:s);
 const plan=createManagerPlan({managers:definitions,skills:filtered,runtimeRoot:'/synthetic-runtime'});
 assert.deepEqual(plan.openclawFragment.agents.entries['ivan-system'].skills,['rapport-telegram']);
});
