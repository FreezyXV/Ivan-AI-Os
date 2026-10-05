import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateCorpus} from './evaluate-alert-corpus.mjs';
const source={producer:'sentinelle',scope:'public',topic:'system',url:'https://example.org/read',title:'Fixture',sourceStatus:'read',excerpt:'A public feature preserves the budget on restart.',publishedAt:'2026-10-05T08:00:00Z',observedAt:'2026-10-05T09:00:00Z',readAt:'2026-10-05T09:00:00Z'};
const corpus={role:'evaluation-independante',cas:[{id:'useful',entree:{source},attendu:{selection:'keep',livraison:'digest'}},{id:'mixed',entree:{demande:'mixed tasks'},attendu:{decoupage:[]}}]};
test('offline measurement never invents Jev accuracy or claims delivery or prose verification',async()=>{
 const r=await evaluateCorpus(corpus);assert.equal(r.measured,0);assert.equal(r.strictAccuracy,null);assert.equal(r.providerAttempts,0);assert.equal(r.deliveryMeasured,false);
});
test('low confidence counts as a wrong abstention; labels never enter the provider input',async()=>{
 const r=await evaluateCorpus(corpus,{select:async item=>{assert.equal(item.attendu,undefined);return {provider:'jev',decision:'keep',confidence:0.4};}});
 assert.equal(r.measured,1);assert.equal(r.correct,0);assert.equal(r.strictAccuracy,0);assert.equal(r.results[0].actual,'review');assert.equal(r.results[1].status,'NOT_MEASURED');
});
