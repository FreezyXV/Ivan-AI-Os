import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeOutcomes} from './audit-mac-outcomes.mjs';
const since=Date.parse('2026-10-09T21:00:00Z'),until=since+7*86400000;
const alert=(topic,goal,state='delivered')=>({created:since+10,updated:since+20,state,item:JSON.stringify({topic}),brief:JSON.stringify({goal})});
test('explicit qualitative feedback is reported independently from a numeric rating',()=>{
 const feedback=[{scope:'pilot',verdict:'low-usefulness',reason:'Peu utile',created:until,origin:'codex-explicit-user'}];
 const s=summarizeOutcomes({since,until,alerts:[],digests:[],cycles:[],feedback});
 assert.deepEqual(s.opportunities.feedback,feedback);assert.equal(s.opportunities.usefulnessRating,null);
});
test('two sources in one message are one delivery, not two successes; missing costs and ratings stay unknown',()=>{
 const s=summarizeOutcomes({since,until,alerts:[alert('business','engineering'),alert('finance','finance')],
  digests:[{key:'digest:1',state:'delivered'},{key:'digest:2',state:'delivery_unknown'}],
  cycles:[{name:'process',status:'done',metrics:'{"result":{"nativeCalls":3}}'},{name:'process',status:'done',metrics:'{}'}],choices:[{choice:'tester'}],dossiers:1});
 assert.equal(s.delivery.confirmedMessages,1);assert.equal(s.delivery.confirmedSources,2);assert.equal(s.delivery.confirmationRate,0.5);
 assert.equal(s.delivery.confirmedByGoal.engineering,1);assert.equal(s.delivery.historicalFailureCauseUnavailable,1);
 assert.equal(s.operations.nativeCostEur,null);assert.equal(s.opportunities.usefulnessRating,null);assert.equal(s.opportunities.timeSavedMinutes,null);
});
test('a failed delivery phase persists as operational evidence while an empty sample has no fabricated reliability',()=>{
 const s=summarizeOutcomes({since,until,alerts:[],digests:[{key:'digest:1',state:'delivered'},{key:'digest:1:p2',state:'delivery_unknown'}],cycles:[{key:'digest:1',name:'digest',status:'failed',metrics:JSON.stringify({result:{pages:[{state:'delivered'},{deliveryFailure:{stage:'NATIVE_TIMEOUT'}}]}})}]});
 assert.deepEqual(s.delivery.failurePhases,{NATIVE_TIMEOUT:1});assert.equal(s.delivery.historicalFailureCauseUnavailable,0);
 assert.equal(summarizeOutcomes({since,until,alerts:[],digests:[],cycles:[]}).delivery.confirmationRate,null);
});
