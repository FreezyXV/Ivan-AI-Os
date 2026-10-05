import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {measure} from './measure-alert-selection.mjs';
const item={scope:'public',producer:'sentinelle',topic:'system',url:'https://example.org/proof',title:'Une mesure',publishedAt:'2026-10-05T08:00:00Z',observedAt:'2026-10-05T09:00:00Z',readAt:'2026-10-05T09:00:00Z',sourceStatus:'read',excerpt:'La file conserve les reçus de livraison après un redémarrage.'};
test('one request per input preserves probabilities and never sends labels',async()=>{
 const recorded=[];let calls=0;
 const r=await measure([{id:'a',item,label:'keep'}],{select:async raw=>{calls++;assert.equal(raw.label,undefined);return{decision:'keep',confidence:0.3,probabilities:{keep:0.6,review:0.3,skip:0.1}};},record:r=>recorded.push(r)});
 assert.equal(calls,1);assert.equal(r.errors,0);assert.equal(recorded[0].probabilities.keep,0.6);
});
test('all inputs are checked before any call and a failed request is never repeated',async()=>{
 await assert.rejects(measure([{id:'a',item},{id:'b',item:{...item,url:'broken'}}],{select:async()=>assert.fail()}));
 let calls=0;const r=await measure([{id:'a',item}],{select:async()=>{calls++;throw Error();}});assert.equal(calls,1);assert.equal(r.errors,1);
});
test('an existing output stops before credentials or provider are needed',()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'measure-once-'));try{
  const input=path.join(dir,'inputs.jsonl'),output=path.join(dir,'results.jsonl');writeFileSync(input,JSON.stringify({id:'a',item}));writeFileSync(output,'claimed');
  const run=spawnSync(process.execPath,['scripts/measure-alert-selection.mjs',input,output],{encoding:'utf8',env:{...process.env,IVAN_JEV_TOKEN:'short'}});
  assert.equal(run.status,1);assert.match(run.stderr,/ALERT_MEASURE_ALREADY_STARTED/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
