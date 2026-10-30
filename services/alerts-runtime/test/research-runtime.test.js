import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,mkdirSync,realpathSync,rmSync,readFileSync} from 'node:fs';import {tmpdir} from 'node:os';import path from 'node:path';
import {researchTick} from '../src/research-runtime.js';import {openResearchStore} from '../src/research-store.js';import {sealBundle,researchHash} from '../src/research-contract.js';
import {createNativeResearch} from '../src/research-native.js';import {createResearchTool} from '../../../hooks/openclaw/ivan-alerts/research-tool.js';
import {openDossiers} from '../../../shared/opportunity-dossier.mjs';
const now=new Date('2026-10-16T20:00:00Z'),textA='Our shop loses confirmed orders when the cache serves another customer session.',textB='Exclude the cart and checkout from page caching. This procedure does not fix external proxies.';
const bundle=sealBundle({topic:'business',title:'Commandes perdues et cache',anchorUrl:'https://example.org/pain',sources:[['pain','https://example.org/pain',textA],['docs','https://vendor.org/docs',textB]].map(([id,url,text])=>({id,url,text,title:id,readAt:now.toISOString(),publishedAt:null,kind:'page',sha256:researchHash(text)}))});
const report={category:'business',title:'Vérifier les erreurs de cache',facts:[{summary:'Un commerce décrit des commandes perdues lors de la mise en cache.',source_id:'pain',evidence_index:0}],thesis:'Hypothèse : un diagnostic des proxys pourrait résoudre un blocage des boutiques.',whyNow:'Le problème empêche de traiter les commandes.',counterargument:'La configuration de cache existante peut suffire.',unknowns:['Demande indépendante inconnue.'],nextStep:'Comparer la documentation et des témoignages publics indépendants.',invalidation:'La configuration existante résout entièrement les cas observés.',horizon:'short',valuation:'non estimable'};
function setup(t){let time=now.getTime();const dir=mkdtempSync(path.join(realpathSync(tmpdir()),'ivan-research-flow-')),vaultPath=path.join(dir,'vault');mkdirSync(vaultPath);mkdirSync(path.join(vaultPath,'.obsidian'));
 const settings={target:'123456789',research:{enabled:true,directory:path.join(dir,'research')},opportunities:{directory:path.join(dir,'dossiers'),vaultPath}},store=openResearchStore(settings.research.directory,{now:()=>time});
 const seed={topic:'business',anchorUrl:bundle.anchorUrl,title:bundle.title,text:textA,readAt:now.toISOString(),publishedAt:null};const {id}=store.enqueue(seed);
 t.after(()=>{store.close();rmSync(dir,{recursive:true,force:true});});return{dir,settings,store,seed,id,advance:ms=>{time+=ms;}};}
function native(decision='approve'){
 const seen=[];const tool=createResearchTool({agentId:'ivan-system'},{complete:async args=>{
  seen.push(args.extraSystemPrompt);return{text:JSON.stringify(args.extraSystemPrompt.startsWith('Analyste')?{decision:'report',report}:{decision,strongestCounterargument:'La procédure existante peut résoudre le problème sans nouvelle offre.',issues:decision==='approve'?[]:['EXISTING_SOLUTION']})};}});
 const complete=createNativeResearch({runImpl:async(_bin,args)=>{const p=JSON.parse(args[4]);return{stdout:JSON.stringify({ok:true,output:await tool.execute('test',p.args)})};}});
 return {complete,seen};
}
test('public bundle → analyst → separate devil’s advocate → Obsidian → one Telegram receipt → persistent human choice',async t=>{
 const f=setup(t),{complete,seen}=native();let sends=0;
 const args={...f,now,discover:async()=>({queued:0}),build:async()=>({bundle,coverage:{sources:2}}),complete,forceDelivery:true,
 deliver:async({text})=>{const dossiers=openDossiers(f.settings.opportunities);const rows=dossiers.list();assert.equal(rows.length,1);assert.ok(readFileSync(path.join(f.settings.opportunities.vaultPath,dossiers.project(rows[0].id).note)));dossiers.close();assert.match(text,/Avocat du diable/);sends++;return{delivered:true,messageId:'123'};}};
 const r=await researchTick(args);assert.equal(r.nativeCalls,2);assert.equal(sends,1);assert.equal(r.delivered,1);
 assert.match(seen[0],/Analyste/);assert.match(seen[1],/indépendant/);await researchTick(args);assert.equal(sends,1);
 const dossiers=openDossiers(f.settings.opportunities),id=dossiers.list()[0].id;
 const choice=dossiers.decide(id,'tester','Chercher des preuves indépendantes.',{origin:'codex-explicit-user'});assert.equal(choice.revision,1);assert.equal(dossiers.get(id).decisions.length,1);dossiers.close();
});
test('the independent critic can actually block a dossier and no prose is delivered',async t=>{
 const f=setup(t),{complete}=native('reject');const r=await researchTick({...f,now,discover:async()=>({}),build:async()=>({bundle,coverage:{}}),complete,forceDelivery:true,deliver:async()=>assert.fail()});
 assert.equal(r.outcome,'rejected');assert.equal(f.store.get(f.id).review.decision,'reject');assert.equal(r.modelCalls,2);
});
test('missing research access remains a visible coverage failure, never an invented opportunity',async t=>{
 const f=setup(t);const r=await researchTick({...f,now,discover:async()=>({}),build:async()=>({bundle:null,coverage:{errors:[{code:'PUBLIC_RESEARCH_SEARCH_CHALLENGE'}]}}),complete:async()=>assert.fail(),forceDelivery:true,deliver:async()=>assert.fail()});
 assert.equal(r.nativeCalls,0);assert.equal(r.outcome,'evidence-insufficient');assert.equal(f.store.get(f.id).state,'research');assert.equal(r.coverage.errors[0].code,'PUBLIC_RESEARCH_SEARCH_CHALLENGE');
});
test('an uncertain send stays quarantined and is never retried after another tick',async t=>{
 const f=setup(t),{complete}=native();let attempts=0;const args={...f,now,discover:async()=>({}),build:async()=>({bundle,coverage:{}}),complete,forceDelivery:true,deliver:async()=>{attempts++;throw Error('network');}};
 assert.equal((await researchTick(args)).deliveryUnknown,1);await researchTick(args);assert.equal(attempts,1);assert.equal(f.store.get(f.id).state,'delivery_unknown');
});

test('expired sends are reconciled even when the daily model budget is exhausted',async t=>{
 const f=setup(t),{complete}=native();f.settings.research.dailyModelLimit=2;
 await researchTick({...f,now:new Date('2026-10-16T08:00:00Z'),discover:async()=>({}),build:async()=>({bundle,coverage:{}}),complete,deliver:async()=>assert.fail()});
 assert.equal(f.store.get(f.id).state,'ready');f.store.beginDelivery(f.id);f.advance(120001);
 const r=await researchTick({...f,now,discover:async()=>({}),complete:async()=>assert.fail(),deliver:async()=>assert.fail()});
 assert.equal(r.reconciled.unknown,1);assert.equal(f.store.get(f.id).state,'delivery_unknown');
});
test('a specific evidence gap delegates one additional research task, without an endless agent loop',async t=>{
 const f=setup(t),{complete}=native('research');const args={...f,now:new Date('2026-10-16T08:00:00Z'),discover:async()=>({}),build:async()=>({bundle,coverage:{}}),complete,deliver:async()=>assert.fail()};
 const first=await researchTick(args);assert.equal(first.deepeningQueued,true);assert.equal(f.store.list('pending').length,1);
 const second=await researchTick(args);assert.equal(second.deepeningQueued,undefined);assert.equal(f.store.list('pending').length,0);assert.equal(second.modelCalls,4);
});
test('flushing approved research does not spend another analysis call or reopen another job',async t=>{
 const f=setup(t),{complete}=native();f.store.enqueue({...f.seed,anchorUrl:'https://another.org/pain'});
 await researchTick({...f,jobId:f.id,now:new Date('2026-10-16T08:00:00Z'),discover:async()=>({}),build:async()=>({bundle,coverage:{}}),complete,deliver:async()=>assert.fail()});
 const r=await researchTick({...f,now,deliveryOnly:true,forceDelivery:true,discover:async()=>assert.fail(),complete:async()=>assert.fail(),deliver:async()=>({delivered:true,messageId:'124'})});
 assert.equal(r.nativeCalls,0);assert.equal(r.delivered,1);assert.equal(f.store.list('pending').length,1);assert.equal(r.modelCalls,2);
});
