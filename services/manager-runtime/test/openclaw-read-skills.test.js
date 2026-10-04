import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { installOpenClawSkills } from '../../../scripts/install-openclaw-skills.mjs';
const source=fileURLToPath(new URL('../../../',import.meta.url));
const capabilities={
  'business-engine':['ivan_business_brief'],
  'finance-engine':['ivan_finance_brief'],
  'memoire-obsidian':['ivan_memory_search','ivan_memory_read']
};
test('available native tools produce short public skills without shell or repository imports',async t=>{
 const root=mkdtempSync(path.join(tmpdir(),'ivan-read-skills-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 for(const [name,availableTools] of Object.entries(capabilities)) {
  const workspace=path.join(root,name);mkdirSync(workspace,{mode:0o700});
  const result=await installOpenClawSkills({source,workspace,profile:'/nonexistent-private-profile',selectedNames:[name],profileMode:'none',availableTools});
  assert.deepEqual(result.installed,[name]);
  const installed=path.join(workspace,'skills',name),body=readFileSync(path.join(installed,'SKILL.md'),'utf8');
  for(const tool of availableTools)assert.ok(body.includes(tool));
  assert.doesNotMatch(body,/node |python|\.mjs|scripts\/|~\/\.ivan-ai-os\/profil/);
  assert.match(body,/profil: "non"/);assert.match(body,/risque: lecture/);
  assert.equal(existsSync(path.join(installed,'scripts')),false);
  assert.equal(existsSync(path.join(installed,'profil.md')),false);
  assert.ok(body.length<2500);
 }
});
test('explicit skill selection refuses missing capabilities instead of silently succeeding',async t=>{
 const root=mkdtempSync(path.join(tmpdir(),'ivan-read-missing-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 await assert.rejects(installOpenClawSkills({source,workspace:root,profile:'/nonexistent-private-profile',selectedNames:['memoire-obsidian'],profileMode:'none',availableTools:['ivan_memory_search']}),/SKILL_CAPABILITY_UNAVAILABLE/);
 assert.equal(existsSync(path.join(root,'skills','memoire-obsidian')),false);
});

test('manager plan requires tools declared for the correct role, excluding personal Finance', async ()=>{
 const {createManagerPlan,ROUTES}=await import('../src/plan.js');
 const skills=[...ROUTES,'orchestrator'].map(manager=>({name:`${manager}-skill`,manager,statut:'actif'}));
 skills.push({name:'recherche-sourcee',manager:'knowledge',statut:'actif'}, {name:'rapport-telegram',manager:'system',statut:'actif'},
   {name:'finance-engine',manager:'finance',statut:'actif',profil:'non'}, {name:'veille-investissements',manager:'finance',statut:'actif',profil:'oui'},
   {name:'memoire-obsidian',manager:'system',statut:'actif',profil:'non'});
 const managers=[...ROUTES,'orchestrator'].map(route=>({route,skills:route==='finance'?['finance-engine','veille-investissements']:
   ['system','knowledge'].includes(route)?[`${route}-skill`,'memoire-obsidian']:[`${route}-skill`],description:'test'}));
 const args={managers,skills,runtimeRoot:'/synthetic-runtime'};
 const plan=createManagerPlan({...args,availableToolsByRoute:{finance:['ivan_finance_brief'],system:['ivan_memory_search','ivan_memory_read'],knowledge:['ivan_memory_search','ivan_memory_read']}});
 const entries=plan.openclawFragment.agents.entries;
 assert.ok(entries['ivan-finance'].skills.includes('finance-engine'));assert.ok(!entries['ivan-finance'].skills.includes('veille-investissements'));
 assert.ok(entries['ivan-system'].skills.includes('memoire-obsidian'));assert.ok(entries['ivan-knowledge'].skills.includes('memoire-obsidian'));
 assert.deepEqual(entries['ivan-finance'].tools.alsoAllow,['ivan_finance_brief']);
 assert.equal(entries.main.tools.alsoAllow,undefined);
 assert.throws(()=>createManagerPlan({...args,availableToolsByRoute:{finance:['ivan_memory_read']}}),/INVALID_TOOL_CAPABILITIES/);
});
