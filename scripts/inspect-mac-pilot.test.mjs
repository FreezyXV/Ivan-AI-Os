import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeAutomations, summarizeAlertCycles, inspectPilot } from './inspect-mac-pilot.mjs';

test('native automation inventory reveals Career activity without leaking prompts or addresses',()=>{
  const jobs=[{agentId:'ivan-career',enabled:true,payload:{kind:'agentTurn',message:'PRIVATE PROMPT'},
    delivery:{to:'PRIVATE TARGET'},state:{lastRunStatus:'error',lastError:'PRIVATE ERROR'}},
    {agentId:'ivan-system',enabled:true,payload:{kind:'agentTurn'},state:{lastRunStatus:'ok'}}];
  const result=summarizeAutomations({jobs,total:2,hasMore:false});
  assert.equal(result.career_enabled,1);assert.equal(result.agents['ivan-career'].lastErrors,1);
  assert.equal(result.agents['ivan-career'].activeErrors,1);
  assert.equal(JSON.stringify(result).includes('PRIVATE'),false);
  assert.throws(()=>summarizeAutomations({jobs,total:3,hasMore:true}),/INCOMPLETE/);
});

test('diagnostic reports partial failure without reflecting command output or credentials',async()=>{
  const result=await inspectPilot({call:async args=>{
    if(args[0]==='cron')throw Error('PRIVATE CLI OUTPUT');return{ok:true};
  },getToken:()=> 'synthetic-private-token',fetchImpl:async url=>({ok:true,json:async()=>url.endsWith('/health')?
    {ok:true,provider:'jev'}:{calls:4,month:'2026-10',estimated_cost_eur:0.01,privateData:'PRIVATE DATA'}})});
  assert.equal(result.openclaw_healthy,true);assert.equal(result.jev.usage_available,true);
  assert.equal(result.jev.usage.calls,4);
  assert.equal(result.automations.error_code,'AUTOMATION_INVENTORY_UNAVAILABLE');
  assert.equal(JSON.stringify(result).includes('PRIVATE'),false);assert.equal(JSON.stringify(result).includes('synthetic-private-token'),false);
});
test('alert health exposes backlog and partial source failures without article, prompt or recipient',()=>{
 const result=summarizeAlertCycles({counts:[{state:'review',n:12}],cycles:[{name:'finance',status:'done',attempts:1,
  metrics:JSON.stringify({durationMs:15000,result:{sourceErrors:[{code:'UNAVAILABLE'}],prompt:'PRIVATE',target:'PRIVATE'}})}]});
 assert.equal(result.queue.review,12);assert.equal(result.latest[0].degraded,true);assert.equal(result.latest[0].sourceErrors,1);
 assert.equal(result.prose_usage_available,false);assert.doesNotMatch(JSON.stringify(result),/PRIVATE/);
});
test('healthy services still expose why no alert is delivered; uncertainty and unread pages have different next actions',()=>{
 const uncertain=summarizeAlertCycles({counts:[{state:'review',n:14},{state:'expired_unsent',n:2}],reviewReasons:[{reason:'SELECTION_UNCERTAIN',n:10},{reason:'SOURCE_NOT_READ',n:4}]});
 assert.equal(uncertain.queue.expired_unsent,2);assert.equal(uncertain.diagnosis.code,'CALIBRATE_RELEVANCE');
 const unread=summarizeAlertCycles({counts:[{state:'review',n:4}],reviewReasons:[{reason:'SOURCE_NOT_READ',n:4}]});
 assert.equal(unread.diagnosis.code,'EXPAND_READERS');
 const sending=summarizeAlertCycles({counts:[{state:'delivery_unknown',n:1},{state:'ready',n:2}]});
 assert.equal(sending.diagnosis.code,'CHECK_DELIVERY_RECEIPT');
});
