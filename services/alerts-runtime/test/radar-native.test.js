import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,realpathSync,rmSync,readFileSync} from 'node:fs';import {tmpdir} from 'node:os';import path from 'node:path';
import {createRadarTool} from '../../../hooks/openclaw/ivan-alerts/radar-tool.js';import {createNativeRadar} from '../src/radar-native.js';
import {sealRadarEvidence} from '../src/radar-brief.js';import {openResearchStore} from '../src/research-store.js';import {prepareRadarCards} from '../src/radar-prepare.js';
import {probeRadarTool} from '../../../scripts/probe-radar-tool.mjs';
const at='2026-10-31T08:00:00.000Z',source={url:'https://nodejs.org/api/test.html',title:'Timers in tests',text:'Mock timers can be advanced in a test. Tests can control the clock without waiting for the real timeout. The test context owns its mocked timer APIs and can restore the original clock.',readAt:at,publishedAt:null};
const c=id=>({id,subject:'Tester le passage du temps sans attendre',fact:{summary:'Les tests peuvent faire avancer des horloges simulées.',evidence_index:0},interest:'Cela permet de reproduire un comportement qui dépend du temps.',utility:'Hypothèse : vérifier les reprises de Jarvis à heure fixe sans attendre la nuit.',concreteUse:'Écrire un test isolé qui avance l’horloge et vérifie le créneau de reprise.',limitation:'Le test de l’horloge ne simule pas une vraie mise en veille du Mac.'});
const item={producer:'sentinelle',scope:'public',topic:'engineering',url:source.url,title:source.title,publishedAt:at,observedAt:at,sourceStatus:'title-only',excerpt:''};
function fixture(t){const dir=mkdtempSync(path.join(realpathSync(tmpdir()),'ivan-radar-native-'));const store=openResearchStore(dir,{now:()=>Date.parse(at)});t.after(()=>{store.close();rmSync(dir,{recursive:true,force:true});});return store;}
test('real radar factory/adapter runs isolated writer and reviewer; no tool exists for another manager',async()=>{
 const manifest=JSON.parse(readFileSync(new URL('../../../hooks/openclaw/ivan-alerts/openclaw.plugin.json',import.meta.url)));assert.ok(manifest.contracts.tools.includes('ivan_radar_complete'));
 assert.equal(createRadarTool({agentId:'main'},{}),null);
 const evidence=sealRadarEvidence([{id:'0123456789',topic:'engineering',source}]),seen=[];
 const tool=createRadarTool({agentId:'ivan-system'},{complete:async args=>{seen.push(args);return {text:JSON.stringify(args.message.startsWith('Rédige')?[c('0123456789')]:{items:[{id:'0123456789',decision:'approve',issues:[]}]})};}});
 const complete=createNativeRadar({runImpl:async(_b,args)=>{const p=JSON.parse(args[4]);return {stdout:JSON.stringify({ok:true,output:await tool.execute('proof',p.args)})};}});
 const cards=await complete({evidence,stage:'analysis'}),review=await complete({evidence,stage:'contradiction',cards});assert.equal(review.items[0].decision,'approve');assert.equal(seen.length,2);assert.match(seen[1].extraSystemPrompt,/indépendante/);
});
test('unread page never reaches the model; a later source is not starved by that failure',async t=>{
 const store=fixture(t),id=store.radar.register(item),settings={research:{dailyModelLimit:12}};
 const r=await prepareRadarCards({store,rows:[store.radar.topic(id)],settings,fetchImpl:async()=>{throw Error();},complete:async()=>assert.fail()});assert.equal(r.nativeCalls,0);assert.equal(r.state,'waiting-source');assert.equal(store.radar.preparable().length,0);assert.equal(store.radar.summary().preparationErrors[0].error,'RESEARCH_RADAR_SOURCE_UNAVAILABLE');
 store.radar.register({...item,url:'https://nodejs.org/api/other.html'});assert.equal(store.radar.preparable().length,1);
});
test('batch calls and research share the daily reservation budget; crashes cannot replay a paid preparation',async t=>{
 const store=fixture(t),id=store.radar.register(item),batch=store.radar.beginPreparation([id]);
 store.radar.saveEvidence(batch.id,batch.owner,sealRadarEvidence([{id,topic:'engineering',source}]));store.radar.reserveModelCall(batch.id,batch.owner,'analysis',{dailyLimit:2});store.radar.reserveModelCall(batch.id,batch.owner,'contradiction',{dailyLimit:2});
 const request=store.enqueue({topic:'system',anchorUrl:'https://nodejs.org/',title:'Research',text:'A request',readAt:at}),job=store.claim({id:request.id});assert.throws(()=>store.reserveCall(job.id,job.owner,'analysis',{dailyLimit:2}),{code:'RESEARCH_DAILY_MODEL_LIMIT'});assert.equal(store.summary().modelCallsToday,2);
 assert.equal(store.radar.beginPreparation([id]),null);assert.equal(store.radar.preparable().length,0);
});
test('capability probe rejects an unavailable tool without asking for a model completion',async()=>{
 assert.equal((await probeRadarTool({runImpl:async()=>({stdout:JSON.stringify({ok:false,error:{code:'not_found'}})})})).available,false);
 assert.equal((await probeRadarTool({runImpl:async(_b,args)=>{const p=JSON.parse(args[4]);assert.deepEqual(p.args.evidence,{});return {stdout:JSON.stringify({ok:true,output:{details:{status:'UNAVAILABLE',phase:'VALIDATE',error_code:'RESEARCH_RADAR_BRIEF_INVALID'}}})};}})).available,true);
});
