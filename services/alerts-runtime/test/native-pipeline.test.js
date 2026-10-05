import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {openLedger} from '../src/ledger.js';
import {processNext} from '../src/pipeline.js';
import {PILOT_CONTEXT} from '../src/context.js';
import {runCycle} from '../../../scripts/mac-alerts-cycle.mjs';
const at=Date.parse('2026-10-05T18:00:00Z');
const item=n=>({producer:'sentinelle',scope:'public',topic:'system',url:`https://example.org/native/${n}`,title:'Reprise mesurée du service',
 sourceStatus:'read',publishedAt:'2026-10-05T16:00:00Z',observedAt:'2026-10-05T17:00:00Z',readAt:'2026-10-05T17:00:00Z',
 excerpt:`Le service conserve le compteur après un redémarrage. Le reçu confirme la fin de la tâche. Cas distinct ${n}.`});
const brief=()=>({goal:'system',facts:[{summary:'Le compteur est conservé après redémarrage.',quote:'Le service conserve le compteur après un redémarrage.'}],
 utility:'Vérifier la reprise des agents avec leurs résultats enregistrés.',action:'Comparer le compteur avant et après la reprise.'});
function fixture(t){const dir=mkdtempSync(path.join(tmpdir(),'ivan-native-pipeline-')),ledger=openLedger(path.join(dir,'alerts.sqlite'),{now:()=>at});
 t.after(()=>{ledger.close();rmSync(dir,{recursive:true,force:true});});return{ledger,dir};}
test('native editorial assessment is one completion and never depends on Jev or a second prose call',async t=>{
 const {ledger}=fixture(t);ledger.ingest(item('one'));let calls=0;
 const result=await processNext({ledger,now:at,assess:async()=>{calls++;return{decision:'keep',brief:brief(),generation:{modelCalls:1}};},
  select:async()=>assert.fail('Jev must not be an obligatory editorial gate'),synthesize:async()=>assert.fail('no duplicate prose completion')});
 assert.equal(result.state,'ready');assert.equal(calls,1);assert.equal(result.brief.selection.provider,'native-editorial');
 assert.equal(result.brief.selection.confidence,undefined);assert.equal(result.brief.generation.modelCalls,1);
});
test('deferred evidence costs no completion; skipped or ambiguous evidence cannot carry a publishable brief',async t=>{
 const {ledger}=fixture(t);ledger.ingest({...item('paused'),topic:'career'});
 assert.equal((await processNext({ledger,now:at,assess:async()=>assert.fail('local exclusions are free')})).state,'skipped');
 ledger.ingest(item('unresolved'));
 const review=await processNext({ledger,now:at,assess:async()=>({decision:'review'})});assert.equal(review.state,'review');
 assert.equal(review.brief.message,undefined);
 ledger.ingest(item('bad-skip'));
 assert.equal((await processNext({ledger,now:at,assess:async()=>({decision:'skip',brief:brief()})})).reason,'NATIVE_ASSESSMENT_INVALID');
});
test('native selection cannot make an unsupported summary publishable, and a timeout remains recoverable',async t=>{
 const {ledger}=fixture(t);ledger.ingest(item('unsupported'));
 const bad=brief();bad.facts[0].quote='Un résultat qui ne figure pas dans la source.';
 assert.equal((await processNext({ledger,now:at,assess:async()=>({decision:'keep',brief:bad})})).reason,'ALERT_FACT_UNSUPPORTED');
 ledger.ingest(item('timeout'));
 const result=await processNext({ledger,now:at,stageTimeoutMs:15,assess:async()=>new Promise(()=>{})});
 assert.equal(result.reason,'NATIVE_ASSESSMENT_TIMEOUT');
 assert.equal(ledger.retryTransient({minDelayMs:0}),1);assert.equal(ledger.retryTransient({minDelayMs:0}),0);
});
test('a native cycle bounds all model completions, including skipped items, without initialising Jev auth',async t=>{
 const {ledger,dir}=fixture(t);for(let i=0;i<3;i++)ledger.ingest(item(i));let calls=0;
 const result=await runCycle({ledger,settings:{stateDir:dir,selectionMode:'native-editorial'},now:new Date(at),processNow:true,
  feeds:async()=>({}),finance:async()=>({}),business:async()=>({}),hasBusinessEvidence:()=>false,
  assess:async()=>{calls++;return{decision:'skip'};},synthesize:async()=>assert.fail('native assessment already owns prose'),
  select:async()=>assert.fail('no Jev call'),deliver:async()=>assert.fail('nothing to deliver')});
 assert.equal(calls,2);assert.equal(result.results.process.nativeCalls,2);assert.equal(result.results.process.decisions,0);
 assert.equal(result.queue.pending,1);assert.equal(result.queue.skipped,2);
});
test('an invalid model output is held for review without spending a transient-recovery attempt',async t=>{
 const {ledger}=fixture(t);ledger.ingest(item('invalid-rpc'));
 const result=await processNext({ledger,now:at,assess:async()=>{throw Object.assign(Error('private text'),{code:'ALERT_FACT_UNSUPPORTED'});}});
 assert.equal(result.reason,'ALERT_FACT_UNSUPPORTED');assert.equal(result.state,'review');
 assert.equal(ledger.retryTransient({minDelayMs:0}),0);
});
test('qualified native editorial mode requires the recorded Jev keep before any completion and preserves both decisions',async t=>{
 const {ledger}=fixture(t);let native=0;const select=async()=>({decision:'keep',confidence:0.9,provider:'jev',context_version:PILOT_CONTEXT.version,request_id:'00000000-0000-4000-a000-000000000001'});
 ledger.ingest(item('borderline'));
 const held=await processNext({ledger,now:at,assessmentAfterSelection:true,select:async()=>({decision:'review',confidence:0.9}),assess:async()=>{native++;assert.fail('uncertain Jev must not invoke prose');}});
 assert.equal(held.reason,'SELECTION_UNCERTAIN');assert.equal(native,0);
 ledger.ingest(item('confirmed'));
 const good=await processNext({ledger,now:at,assessmentAfterSelection:true,select,assess:async()=>{native++;return{decision:'keep',brief:brief()};}});
 assert.equal(good.state,'ready');assert.equal(good.brief.selection.provider,'jev');assert.equal(good.brief.assessment.decision,'keep');assert.equal(native,1);
});
test('qualified mode caches the paid decision across a native outage and respects the cycle model limits',async t=>{
 const {ledger,dir}=fixture(t);ledger.ingest(item('native-down'));let paid=0;
 const select=async()=>{paid++;return{decision:'keep',confidence:0.9,provider:'jev',context_version:PILOT_CONTEXT.version,request_id:'00000000-0000-4000-a000-000000000002'};};
 const failed=await processNext({ledger,now:at,assessmentAfterSelection:true,select,assess:async()=>{throw Error('temporary outage');}});
 assert.equal(failed.reason,'NATIVE_ASSESSMENT_UNAVAILABLE');assert.equal(failed.brief.selection.provider,'jev');
 assert.equal(ledger.retryTransient({minDelayMs:0}),1);
 const resumed=await processNext({ledger,now:at,assessmentAfterSelection:true,select,assess:async()=>({decision:'keep',brief:brief()})});
 assert.equal(resumed.state,'ready');assert.equal(resumed.brief.selection.replayed,true);assert.equal(paid,1);
 for(let i=0;i<3;i++)ledger.ingest(item('cycle-qualified-'+i));
 const cycle=await runCycle({ledger,settings:{stateDir:dir,selectionMode:'jev-native-editorial'},now:new Date(at),processNow:true,
  feeds:async()=>({}),finance:async()=>({}),business:async()=>({}),hasBusinessEvidence:()=>false,select,
  assess:async()=>({decision:'keep',brief:brief()}),deliver:async()=>assert.fail('no digest slot')});
 assert.equal(cycle.results.process.decisions,2);assert.equal(cycle.results.process.nativeCalls,2);
 assert.equal(cycle.queue.pending,1);assert.equal(cycle.results.process.generations,2);
});
test('a later verified item uses the next digest page after the daily cycle completed, without resending the first',async t=>{
 const {ledger,dir}=fixture(t);const key='digest:2026-10-05';let sends=0;
 const options={ledger,settings:{stateDir:dir,selectionMode:'native-editorial'},now:new Date(at),processNow:true,
  feeds:async()=>({}),finance:async()=>({}),business:async()=>({}),hasBusinessEvidence:()=>false,
  assess:async()=>({decision:'keep',brief:brief()}),deliver:async()=>({delivered:true,messageId:String(++sends)})};
 ledger.ingest(item('first-page'));await runCycle(options);assert.equal(sends,1);
 ledger.ingest(item('late-page'));
 await runCycle({...options,now:new Date(at+60000)});assert.equal(sends,2);assert.equal(ledger.digestStatus(key+':p2').state,'delivered');
 await runCycle({...options,now:new Date(at+120000)});assert.equal(sends,2);
 ledger.ingest(item('third-page'));await runCycle({...options,now:new Date(at+180000)});assert.equal(sends,3);
 ledger.ingest(item('fourth-page'));await runCycle({...options,now:new Date(at+240000)});assert.equal(sends,3);assert.equal(ledger.counts().ready,1);
});
test('an uncertain first page prevents automatic digest continuation for later ready items',async t=>{
 const {ledger,dir}=fixture(t);let sends=0;
 const options={ledger,settings:{stateDir:dir,selectionMode:'native-editorial'},now:new Date(at),processNow:true,
  feeds:async()=>({}),finance:async()=>({}),business:async()=>({}),hasBusinessEvidence:()=>false,
  assess:async()=>({decision:'keep',brief:brief()}),deliver:async()=>{sends++;return undefined;}};
 ledger.ingest(item('uncertain-page'));await runCycle(options);assert.equal(sends,1);
 ledger.ingest(item('after-uncertain'));await runCycle({...options,now:new Date(at+60000)});assert.equal(sends,1);
 assert.equal(ledger.counts().ready,1);
});


test('native failure stages survive durable storage while malformed prose cannot consume a retry',async t=>{
 const {ledger}=fixture(t);
 for(const [stage,code] of [['COMPLETE','ALERT_ASSESSMENT_UNAVAILABLE'],['PARSE','ALERT_ASSESSMENT_INVALID'],['VALIDATE','ALERT_FACT_UNSUPPORTED']]){
  const {id}=ledger.ingest(item('stage-'+stage));
  await processNext({ledger,now:at,assessmentAfterSelection:true,
   select:async()=>({decision:'keep',confidence:0.9,provider:'jev',context_version:PILOT_CONTEXT.version}),
   assess:async()=>{throw Object.assign(Error('synthetic private exception'),{code,failureStage:stage});}});
  const stored=ledger.get(id);
  assert.deepEqual(stored.brief.nativeFailure,{code,stage});
  assert.equal(stored.brief.selection.provider,'jev');assert.ok(!JSON.stringify(stored.brief).includes('private exception'));
 }
 assert.equal(ledger.retryTransient({minDelayMs:0}),1,'only completion outage is retryable');
});

test('a short unverified incident is held without either provider call',async t=>{
 const {ledger}=fixture(t);ledger.ingest({...item('rumour'),title:'GitHub down?',excerpt:'GitHub is down again; production builds are broken.'});
 const result=await processNext({ledger,now:at,assessmentAfterSelection:true,
  select:async()=>assert.fail('no Jev spend'),assess:async()=>assert.fail('no native spend')});
 assert.equal(result.reason,'SOURCE_EVIDENCE_INSUFFICIENT');assert.equal(result.state,'review');
});
