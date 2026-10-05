import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {openLedger} from '../src/ledger.js';
import {processNext} from '../src/pipeline.js';
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
