import {DatabaseSync} from 'node:sqlite';
import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeAutomations, summarizeAlertCycles, inspectPilot, readAlertCycleRows } from './inspect-mac-pilot.mjs';

test('persisted reader failures remain visible after a successful cycle without hiding ready syntheses',()=>{
 const r=summarizeAlertCycles({counts:[{state:'ready',n:1}],cycles:[{name:'feeds',status:'done',metrics:'{}'}],
  sourceReadFailures:[{code:'PUBLIC_SOURCE_TOO_LARGE',n:2,private:'PRIVATE'}, {code:'PRIVATE RAW TEXT',n:1}]});
 assert.deepEqual(r.sourceReadFailures,{total:2,codes:{PUBLIC_SOURCE_TOO_LARGE:2}});
 assert.ok(r.diagnoses.some(d=>d.code==='CHECK_SOURCE_READS'));
 assert.ok(r.diagnoses.some(d=>d.code==='WAIT_DIGEST'));assert.doesNotMatch(JSON.stringify(r),/PRIVATE/);
});

test('latest failed collection is actionable beside ready work, and a later successful collection clears it',()=>{
 const failed={name:'feeds',status:'failed',attempts:2,metrics:JSON.stringify({result:{failedFeeds:1,sourceErrors:[{code:'FEED_UNAVAILABLE',private:'PRIVATE'}]}})};
 const r=summarizeAlertCycles({counts:[{state:'ready',n:1}],cycles:[failed]});
 assert.ok(r.diagnoses.some(d=>d.code==='CHECK_COLLECTION'));
 assert.equal(r.latest[0].failedFeeds,1);assert.deepEqual(r.latest[0].errorCodes,['FEED_UNAVAILABLE']);
 assert.doesNotMatch(JSON.stringify(r),/PRIVATE/);
 const recovered=summarizeAlertCycles({cycles:[{name:'feeds',status:'done',metrics:'{}'},failed]});
 assert.ok(!recovered.diagnoses.some(d=>d.code==='CHECK_COLLECTION'));
});
test('an interrupted native cycle is visible beside ready work and a successful current cycle clears the action',()=>{
 const interrupted={name:'process',status:'failed',metrics:JSON.stringify({error_code:'CYCLE_INTERRUPTED'})};
 const r=summarizeAlertCycles({counts:[{state:'ready',n:1}],cycles:[interrupted]});
 assert.ok(r.diagnoses.some(d=>d.code==='CHECK_PROCESS_RECOVERY'));
 assert.ok(r.diagnoses.some(d=>d.code==='WAIT_DIGEST'));
 const recovered=summarizeAlertCycles({cycles:[{name:'process',status:'done',metrics:'{}'},interrupted]});
 assert.ok(!recovered.diagnoses.some(d=>d.code==='CHECK_PROCESS_RECOVERY'));
});
test('editorial check counts expose the failing field, never a raw draft or exception',()=>{
 const r=summarizeAlertCycles({reviewReasons:[{reason:'ALERT_FACT_UNSUPPORTED',n:1}],rejectionChecks:[
  {code:'FACT_1_IDENTIFIER_NOT_IN_QUOTE',n:1},{code:'PRIVATE DRAFT CONTENT',n:4}]});
 assert.deepEqual(r.contentRefusals.checks,{FACT_1_IDENTIFIER_NOT_IN_QUOTE:1});assert.doesNotMatch(JSON.stringify(r),/PRIVATE/);
});
test('a failed reader exposes its cause, separately from unavailable feeds',()=>{
 const r=summarizeAlertCycles({cycles:[{name:'feeds',status:'failed',metrics:JSON.stringify({result:{readerErrors:1,readerFailures:[{code:'PUBLIC_SOURCE_TOO_LARGE',private:'PRIVATE'}]}})}]});
 assert.equal(r.latest[0].readerErrors,1);assert.equal(r.latest[0].degraded,true);
 assert.deepEqual(r.latest[0].errorCodes,['PUBLIC_SOURCE_TOO_LARGE']);assert.doesNotMatch(JSON.stringify(r),/PRIVATE/);
});

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


test('frequent process cycles cannot hide the latest failed digest from diagnosis',()=>{
 const db=new DatabaseSync(':memory:');
 try{
  db.exec('CREATE TABLE cycles(name TEXT,status TEXT,attempts INTEGER,metrics TEXT,updated INTEGER)');
  const insert=db.prepare('INSERT INTO cycles VALUES(?,?,?,?,?)');
  insert.run('digest','done',1,JSON.stringify({result:{state:'delivery_unknown',count:2,deliveredCount:0}}),1);
  for(let n=2;n<150;n++)insert.run('process','done',1,'{}',n);
  const rows=readAlertCycleRows(db),summary=summarizeAlertCycles({cycles:rows});
  assert.ok(rows.some(row=>row.name==='digest'));
  assert.ok(rows.filter(row=>row.name==='process').length<=3);
  assert.equal(summary.latest.find(row=>row.name==='digest').degraded,true);
  assert.ok(summary.diagnoses.some(d=>d.code==='CHECK_DIGEST_DELIVERY'));
 }finally{db.close();}
});
