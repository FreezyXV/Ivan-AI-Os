import test from 'node:test';
import assert from 'node:assert/strict';
import { selectAlert } from '../src/alert-selection.js';
import { PRICED_MODEL } from '../src/budget.js';
import { testBudget } from './helpers.js';
import { PILOT_CONTEXT } from '../../alerts-runtime/src/context.js';

// Claude calibration 2026-10-05 (94 cases, 188 calls): the 3-way choice collapses to "review"
// and its confidence does not separate true keeps from noise. TypeSafe returns per-option
// probabilities; the gateway must expose them (validated) so P(keep) can be calibrated.
const payload={scope:'public',topic:'system',title:'Codex allowance halved',
  excerpt:'Starting October 30, 2026, your included usage in ChatGPT Work and Codex will decrease.',context_version:PILOT_CONTEXT.version};
function providerEnv(t){
  const names=['JEV_PROVIDER','TYPESAFE_API_KEY','JEV_MODEL'],saved=Object.fromEntries(names.map(n=>[n,process.env[n]]));
  Object.assign(process.env,{JEV_PROVIDER:'jev',TYPESAFE_API_KEY:'synthetic-key',JEV_MODEL:PRICED_MODEL});
  t.after(()=>{for(const name of names){if(saved[name]===undefined)delete process.env[name];else process.env[name]=saved[name];}});
}
const select=(t,extra)=>{providerEnv(t);const raw={model:PRICED_MODEL,usage:{input_tokens:200},answers:{alert_selection:{type:'choice',choice:'review',confidence:0.68,...extra}}};
  return selectAlert(payload,{budget:testBudget(t).budget,fetchImpl:async()=>({ok:true,status:200,json:async()=>raw,text:async()=>JSON.stringify(raw)})});};
test('valid per-option probabilities are exposed with the decision',async t=>{
  const r=await select(t,{probabilities:{keep:0.27,review:0.68,skip:0.05}});
  assert.deepEqual(r.probabilities,{keep:0.27,review:0.68,skip:0.05});
  assert.equal(r.decision,'review');
});
test('absent probabilities remain compatible but malformed distributions are refused',async t=>{
  assert.equal((await select(t,{})).probabilities,undefined);
  await assert.rejects(select(t,{probabilities:{keep:0.9,review:0.9,skip:0.9}}),{code:'TYPESAFE_ALERT_SELECTION_RESPONSE_INVALID'});
  await assert.rejects(select(t,{probabilities:{keep:0.5,review:0.5}}),{code:'TYPESAFE_ALERT_SELECTION_RESPONSE_INVALID'});
});
