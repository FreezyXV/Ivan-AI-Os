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
test('a native editorial backlog cannot be misreported as a stalled Jev calibration',()=>{
 const result=summarizeAlertCycles({selectionMode:'native-editorial',counts:[{state:'pending',n:4},{state:'delivered',n:2}],
  reviewReasons:[{reason:'SELECTION_UNCERTAIN',n:3}],delivery:{updated:123,messageId:'59'}});
 assert.equal(result.selectionMode,'native-editorial');assert.equal(result.diagnosis.code,'PROCESS_PENDING');
 assert.equal(result.lastDelivery.messageId,'59');
 const unread=summarizeAlertCycles({selectionMode:'native-editorial',reviewReasons:[{reason:'SELECTION_UNCERTAIN',n:3},{reason:'SOURCE_NOT_READ',n:7}]});
 assert.equal(unread.diagnosis.code,'EXPAND_READERS');
});

test('content refusals remain visible even beside unread pages, pending work or ready messages',()=>{
 for(const counts of [[],[{state:'ready',n:1}],[{state:'pending',n:2}]]){
  const result=summarizeAlertCycles({counts,reviewReasons:[{reason:'ALERT_FACT_UNSUPPORTED',n:2},{reason:'NATIVE_ASSESSMENT_INVALID',n:1},{reason:'SOURCE_NOT_READ',n:4}]});
  assert.deepEqual(result.contentRefusals,{total:3,reasons:{ALERT_FACT_UNSUPPORTED:2,NATIVE_ASSESSMENT_INVALID:1},code:'CHECK_EDITORIAL_REJECTIONS'});
 }
 assert.equal(summarizeAlertCycles({reviewReasons:[{reason:'ALERT_FACT_UNSUPPORTED',n:1}]}).diagnosis.code,'CHECK_EDITORIAL_REJECTIONS');
 const uncertain=summarizeAlertCycles({counts:[{state:'delivery_unknown',n:1}],reviewReasons:[{reason:'ALERT_FACT_UNSUPPORTED',n:1}]});
 assert.equal(uncertain.diagnosis.code,'CHECK_DELIVERY_RECEIPT');assert.equal(uncertain.contentRefusals.total,1);
});

test('all active diagnostic actions survive simultaneous refusals, ready work and uncertain delivery',()=>{
 const r=summarizeAlertCycles({counts:[{state:'ready',n:2},{state:'pending',n:1},{state:'delivery_unknown',n:1}],
  reviewReasons:[{reason:'ALERT_FACT_UNSUPPORTED',n:1},{reason:'SOURCE_NOT_READ',n:3}]});
 assert.deepEqual(r.diagnoses.map(d=>d.code),['CHECK_DELIVERY_RECEIPT','CHECK_EDITORIAL_REJECTIONS','WAIT_DIGEST','PROCESS_PENDING','EXPAND_READERS']);
 assert.equal(r.diagnosis.code,'CHECK_DELIVERY_RECEIPT');
 const idle=summarizeAlertCycles({});assert.deepEqual(idle.diagnoses,[idle.diagnosis]);
});
