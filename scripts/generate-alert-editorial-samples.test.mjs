import test from 'node:test';
import assert from 'node:assert/strict';
import {generateSamples,SAMPLE_IDS} from './generate-alert-editorial-samples.mjs';
const source={producer:'sentinelle',scope:'public',topic:'system',url:'https://example.org/fixture',title:'Exemple public',
 publishedAt:'2026-10-05T08:00:00Z',observedAt:'2026-10-05T09:00:00Z',readAt:'2026-10-05T09:00:00Z',sourceStatus:'read',excerpt:'Une preuve publique pour le pilote.'};
const corpus={role:'evaluation-independante',cas:SAMPLE_IDS.map((id,i)=>({id,reel:i!==2,entree:{source},attendu:{secretLabel:'DO_NOT_FORWARD'}}))};
test('bounded samples are explicitly fixtures, not new selections or Telegram deliveries; labels stay out of generation',async()=>{
 let calls=0,stored=0;const result=await generateSamples(corpus,{record:()=>stored++,synthesize:async item=>{
  calls++;assert.equal(item.readAt,source.readAt);assert.ok(!JSON.stringify(item).includes('DO_NOT_FORWARD'));
  return {goal:'system',facts:[{summary:'Une preuve publique.',quote:'Une preuve publique'}],utility:'Comparer les résultats.',action:'Rien à faire.'};}});
 assert.equal(calls,4);assert.equal(stored,4);assert.equal(result.generated,4);assert.equal(result.selectionCalls,0);assert.equal(result.telegramMessages,0);
 assert.equal(result.rows[2].sourceKind,'synthetic-fixture');assert.ok(result.rows.every(r=>r.selectionMeasured===false&&r.deliveryMeasured===false));
});
test('validate the entire set before spending; individual generation failures stay visible without retrying',async()=>{
 let calls=0;const synthesize=async()=>{calls++;throw Error('raw private diagnostic');};
 const broken=structuredClone(corpus);broken.cas[3].entree.source.scope='private';
 await assert.rejects(generateSamples(broken,{synthesize}));assert.equal(calls,0);
 const result=await generateSamples(corpus,{synthesize});assert.equal(calls,4);assert.equal(result.errors,4);
 assert.ok(!JSON.stringify(result).includes('raw private diagnostic'));
});
