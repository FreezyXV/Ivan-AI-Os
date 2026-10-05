import test from 'node:test';
import assert from 'node:assert/strict';
import {selectionOutcome,DEFAULT_SELECTION_POLICY} from '../src/pipeline.js';

test('default policy reproduces the 0.75 rule exactly',()=>{
  assert.deepEqual(DEFAULT_SELECTION_POLICY,{keepMinConfidence:0.75,skipMinConfidence:0.75});
  assert.equal(selectionOutcome({decision:'keep',confidence:0.9}),'keep');
  assert.equal(selectionOutcome({decision:'keep',confidence:0.52}),'review');
  assert.equal(selectionOutcome({decision:'skip',confidence:0.8}),'skip');
  assert.equal(selectionOutcome({decision:'skip',confidence:0.5}),'review');
  assert.equal(selectionOutcome({decision:'review',confidence:0.99}),'review');
});
test('calibrated policies use measured confidence floors or P(keep)/P(skip)',()=>{
  const raw={keepMinConfidence:0,skipMinConfidence:0};
  assert.equal(selectionOutcome({decision:'keep',confidence:0.33},raw),'keep');
  assert.equal(selectionOutcome({decision:'skip',confidence:0.27},raw),'skip');
  const prob={keepMinConfidence:0,skipMinConfidence:0,keepMinProbability:0.3,skipMinProbability:0.6};
  assert.equal(selectionOutcome({decision:'review',confidence:0.64,probabilities:{keep:0.31,review:0.64,skip:0.05}},prob),'keep');
  assert.equal(selectionOutcome({decision:'review',confidence:0.5,probabilities:{keep:0.05,review:0.3,skip:0.65}},prob),'skip');
  assert.equal(selectionOutcome({decision:'review',confidence:0.5,probabilities:{keep:0.2,review:0.5,skip:0.3}},prob),'review');
  assert.equal(selectionOutcome({decision:'review',confidence:0.5},prob),'review','no probabilities: only the decision rules apply');
});
test('invalid policies are refused',()=>{
  for(const bad of [{keepMinConfidence:-1,skipMinConfidence:0},{keepMinConfidence:0,skipMinConfidence:2},{keepMinConfidence:0,skipMinConfidence:0,keepMinProbability:0}])
    assert.throws(()=>selectionOutcome({decision:'keep',confidence:1},bad),{code:'ALERT_SELECTION_POLICY_INVALID'});
});
