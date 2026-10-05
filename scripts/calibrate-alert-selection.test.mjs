import test from 'node:test';
import assert from 'node:assert/strict';
import {calibrate,score} from './calibrate-alert-selection.mjs';
const row=(id,set,label,decision,confidence,probabilities)=>({id,set,label,selection:{decision,confidence,...(probabilities?{probabilities}:{})}});
test('the historical rule keeps nothing when Jev answers keep with modest confidence',()=>{
  const rows=[row('a','dev','keep','keep',0.5),row('b','dev','skip','skip',0.4),row('c','dev','skip','review',0.6),row('d','holdout','keep','keep',0.45)];
  const r=calibrate(rows);
  assert.equal(r.current.dev.keepRecall,0);
  assert.equal(r.recommended.dev.falseKeep,0);
  assert.equal(r.recommended.dev.keepRecall,1);
  assert.equal(r.recommended.holdout.keepRecall,1,'reported on holdout, not tuned on it');
});
test('a policy that would send noise is never recommended',()=>{
  const rows=[row('a','dev','keep','review',0.6,{keep:0.4,review:0.5,skip:0.1}),row('b','dev','skip','review',0.6,{keep:0.45,review:0.5,skip:0.05})];
  const r=calibrate(rows);
  assert.ok(!r.recommended||r.recommended.dev.falseKeep===0);
  assert.equal(score(rows,{keepMinConfidence:1,skipMinConfidence:1,keepMinProbability:0.4}).falseKeep,1);
});
