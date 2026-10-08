import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateCorpus} from './evaluate-alert-corpus.mjs';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const source={producer:'sentinelle',scope:'public',topic:'system',url:'https://example.org/read',title:'Fixture',sourceStatus:'read',excerpt:'A public feature preserves the budget on restart.',publishedAt:'2026-10-05T08:00:00Z',observedAt:'2026-10-05T09:00:00Z',readAt:'2026-10-05T09:00:00Z'};
const corpus={role:'evaluation-independante',cas:[{id:'useful',entree:{source},attendu:{selection:'keep',livraison:'digest'}},{id:'mixed',entree:{demande:'mixed tasks'},attendu:{decoupage:[]}}]};
test('offline measurement never invents Jev accuracy or claims delivery or prose verification',async()=>{
 const r=await evaluateCorpus(corpus);assert.equal(r.measured,0);assert.equal(r.strictAccuracy,null);assert.equal(r.providerAttempts,0);assert.equal(r.deliveryMeasured,false);
});
test('a late malformed source is rejected before any provider call',async()=>{
 const broken=structuredClone(corpus);broken.cas.push({id:'broken',entree:{source:{...source,scope:'private'}}});let calls=0;
 await assert.rejects(evaluateCorpus(broken,{select:async()=>{calls++;}}));assert.equal(calls,0);
});
test('a repeated live CLI refuses the existing output before reading credentials or contacting a gateway',t=>{
 const dir=mkdtempSync(path.join(tmpdir(),'ivan-evaluation-once-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const input=path.join(dir,'input.json'),output=path.join(dir,'output.json');writeFileSync(input,JSON.stringify(corpus));
 writeFileSync(output,'previous result');
 const result=spawnSync(process.execPath,[fileURLToPath(new URL('./evaluate-alert-corpus.mjs',import.meta.url)),'--live',input,output],
  {encoding:'utf8',env:{...process.env,IVAN_DECISION_TOKEN:'too-short'}});
 assert.equal(result.status,1);assert.match(result.stderr,/ALERT_EVALUATION_ALREADY_STARTED/);
 assert.equal(readFileSync(output,'utf8'),'previous result');
});
test('low confidence counts as a wrong abstention; labels never enter the provider input',async()=>{
 const r=await evaluateCorpus(corpus,{select:async item=>{assert.equal(item.attendu,undefined);return {provider:'jev',decision:'keep',confidence:0.4};}});
 assert.equal(r.measured,1);assert.equal(r.correct,0);assert.equal(r.strictAccuracy,0);assert.equal(r.results[0].actual,'review');assert.equal(r.results[1].status,'NOT_MEASURED');
});
test('measurement uses the configured production policy, including probabilities',async()=>{
 const select=async()=>({provider:'jev',decision:'review',confidence:0.3,probabilities:{keep:0.6,review:0.3,skip:0.1}});
 const selectionPolicy={keepMinConfidence:1,skipMinConfidence:1,keepMinProbability:0.5,skipMinProbability:0.4};
 const old=await evaluateCorpus(corpus,{select});assert.equal(old.results[0].actual,'review');
 const current=await evaluateCorpus(corpus,{select,selectionPolicy});assert.equal(current.results[0].actual,'keep');
 assert.deepEqual(current.selectionPolicy,selectionPolicy);assert.equal(current.results[0].probabilities.keep,0.6);
});
test('invalid production policy is rejected before spending',async()=>{
 let calls=0;await assert.rejects(evaluateCorpus(corpus,{selectionPolicy:{keepMinConfidence:-1,skipMinConfidence:0.25},select:async()=>{calls++;}}));
 assert.equal(calls,0);
});
