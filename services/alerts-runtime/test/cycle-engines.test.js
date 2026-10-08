import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,mkdirSync,writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {openLedger} from '../src/ledger.js';
import {PILOT_CONTEXT} from '../src/context.js';
import {runCycle,collectFeeds} from '../../../scripts/mac-alerts-cycle.mjs';
import {modernFinanceUrl,collectFinance,financeCycle,businessCycle,observationUrl} from '../src/engines.js';
const now=new Date('2026-10-05T10:00:00Z');
function fixture(t){const dir=mkdtempSync(path.join(os.tmpdir(),'ivan-cycle-')),ledger=openLedger(path.join(dir,'alerts.sqlite'),{now:()=>now.getTime()});
 t.after(()=>{ledger.close();rmSync(dir,{recursive:true,force:true});});return {dir,ledger};}
test('collection preserves bounded source failure codes instead of a counter without cause',async t=>{
 const {dir,ledger}=fixture(t);
 const result=await collectFeeds({directory:dir,ledger,
  runImpl:async(_binary,args)=>writeFileSync(args[args.indexOf('--output')+1],JSON.stringify({items:[],excluded:{},errors:[{feedId:'a'.repeat(16),code:'FEED_UNAVAILABLE',detail:'PRIVATE OUTPUT'}]})),
  ingestImpl:async()=>({read:0}),officialImpl:async()=>({errors:[{code:'OFFICIAL_RELEASE_CONTENT_MISMATCH',detail:'PRIVATE CONTENT'}]})});
 assert.deepEqual(result.sourceErrors,[{code:'FEED_UNAVAILABLE',feedId:'a'.repeat(16)},{code:'OFFICIAL_RELEASE_CONTENT_MISMATCH'}]);
 assert.equal(result.failedFeeds,2);assert.doesNotMatch(JSON.stringify(result.sourceErrors),/PRIVATE/);
});
test('Mac resume runs only present slots and a second process cannot replay collections or spend',async t=>{
 const {dir,ledger}=fixture(t);let calls=0;
 const options={ledger,settings:{stateDir:dir},now,feeds:async()=>{calls++;return{};},finance:async()=>{calls++;return{};},business:async()=>{calls++;return{};},select:async()=>assert.fail(),synthesize:async()=>assert.fail(),deliver:async()=>assert.fail()};
 await runCycle(options);assert.equal(calls,3);await runCycle(options);assert.equal(calls,3);assert.equal(ledger.cycleStatus().filter(r=>r.status==='done').length,4);
});
test('fresh Finance baseline records public data while missing importance evidence cannot enqueue an alert',async t=>{
 const {dir,ledger}=fixture(t);mkdirSync(path.join(dir,'snapshots'),{mode:0o700});
 const result=await financeCycle({ledger,directory:dir,now,collectImpl:async()=>({version:1,date:'2026-10-05',collecte_le:now.toISOString(),erreurs:[],indicateurs:[]}),judgeImpl:async()=>[{id:'btc_eur',niveau:'important',texte:'Un changement sans avis Jev'}]});
 assert.equal(result.ingested,0);assert.equal(result.personal_data,false);assert.deepEqual(ledger.counts(),{});
 assert.match(modernFinanceUrl('https://data-api.ecb.europa.eu/service/data/ICP/M.U2.N.000000.4.ANR'),/HICP\/M.U2.N.000000.4D0.ANR/);
 assert.match(observationUrl({source:'https://data-api.ecb.europa.eu/service/data/FM/EXAMPLE?lastNObservations=1',date_obs:'2026-10-05'}),/startPeriod=2026-10-05/);
});
test('empty Business cycle stays silent and never invents a score or payment evidence',async t=>{
 const {dir,ledger}=fixture(t);const result=await businessCycle({ledger,directory:dir,now,triageImpl:async()=>assert.fail()});
 assert.equal(result.added,0);assert.equal(result.payment_evidence_invented,false);assert.equal(result.opportunity_scores_created,0);
});
test('Finance boundary drops the open Kraken candle and uses the new HICP dataset',async()=>{
 const requested=[];
 const rows=Array.from({length:33},(_,i)=>[Date.parse('2026-09-01T00:00:00Z')/1000+i*86400,'0','0','0',String(i===32?999:100+i)]);
 const result=await collectFinance(async url=>{requested.push(url);
  if(url.includes('api.kraken.com'))return {ok:true,text:async()=>JSON.stringify({error:[],result:{PAIR:rows,last:0}})};
  return {ok:false};},now);
 assert.ok(requested.some(u=>u.includes('/HICP/')&&u.includes('4D0')));
 assert.equal(result.indicateurs.find(i=>i.id==='btc_eur').valeur,131);
});
test('partial source outages are visible and reserve a bounded retry instead of a successful day',async t=>{
 const {dir,ledger}=fixture(t);let calls=0;
 const options={ledger,settings:{stateDir:dir},now,feeds:async()=>({}),finance:async()=>{calls++;return {indicators:6,sourceErrors:['core inflation unavailable']};},business:async()=>({}),select:async()=>assert.fail(),synthesize:async()=>assert.fail(),deliver:async()=>assert.fail()};
 const result=await runCycle(options);assert.equal(result.results.finance.degraded,true);
 assert.equal(ledger.cycleStatus().find(r=>r.name==='finance').status,'failed');
 await runCycle(options);assert.equal(calls,1);
});
test('one transient public-source timeout is recovered; permanent HTTP errors are not hammered',async()=>{
 let attempts=0;
 const rows=Array.from({length:33},(_,i)=>[Date.parse('2026-09-01T00:00:00Z')/1000+i*86400,'0','0','0',String(100+i)]);
 const result=await collectFinance(async url=>{
  if(url.includes('pair=XBTEUR')){
   attempts++;if(attempts===1)throw Object.assign(Error(),{name:'TimeoutError'});
   return {ok:true,text:async()=>JSON.stringify({error:[],result:{PAIR:rows,last:0}})};
  }
  return {ok:false,status:404};
 },now);
 assert.equal(attempts,2);assert.equal(result.indicateurs.find(i=>i.id==='btc_eur')?.valeur,131);
});

test('the configured worker policy reuses a recorded review once without another Jev call',async t=>{
 const {dir,ledger}=fixture(t),item={producer:'sentinelle',scope:'public',topic:'system',url:'https://example.org/policy',title:'Une mesure utile',publishedAt:'2026-10-05T08:00:00Z',observedAt:'2026-10-05T09:00:00Z',readAt:'2026-10-05T09:00:00Z',sourceStatus:'read',excerpt:'Le pilote conserve les preuves et les reçus lors de ses redémarrages.'};
 const {id}=ledger.ingest(item),job=ledger.claim(),selection={decision:'keep',confidence:0.3,provider:'jev',context_version:PILOT_CONTEXT.version,request_id:'00000000-0000-4000-a000-000000000000'};
 ledger.finish(id,job.owner,{state:'review',reason:'SELECTION_UNCERTAIN',brief:{selection}});
 let generated=0;
 const options={ledger,settings:{stateDir:dir,selectionPolicy:{keepMinConfidence:0.2,skipMinConfidence:0.25}},now,
  feeds:async()=>({}),finance:async()=>({}),business:async()=>({}),select:async()=>assert.fail('recorded decision must not spend again'),
  synthesize:async()=>{generated++;return{goal:'system',facts:[{summary:'Les preuves sont conservées.',quote:item.excerpt}],utility:'Vérifier la reprise du pilote.',action:'Vérifier le diagnostic.'};},deliver:async()=>assert.fail()};
 const r=await runCycle(options);assert.equal(r.policyRevisions,1);assert.equal(generated,1);
 assert.equal(ledger.get(id).state,'ready');assert.equal(ledger.get(id).brief.selection.request_id,selection.request_id);
 assert.equal(ledger.get(id).brief.selection.replayed,true);
 await runCycle(options);assert.equal(generated,1);
});

test('invalid worker policy stops before collecting or spending',async t=>{
 const {dir,ledger}=fixture(t);
 await assert.rejects(runCycle({ledger,settings:{stateDir:dir,selectionPolicy:{keepMinConfidence:-1,skipMinConfidence:0.25}},now,feeds:async()=>assert.fail(),select:async()=>assert.fail(),synthesize:async()=>assert.fail(),deliver:async()=>assert.fail()}),{code:'ALERT_SELECTION_POLICY_INVALID'});
});

test('new Business evidence gets only one bounded current-week follow-up',async t=>{
 const {dir,ledger}=fixture(t);let calls=0;
 const options={ledger,settings:{stateDir:dir},now,feeds:async()=>({}),finance:async()=>({}),business:async()=>{calls++;return{};},hasBusinessEvidence:()=>true,select:async()=>assert.fail(),synthesize:async()=>assert.fail(),deliver:async()=>assert.fail()};
 await runCycle(options);assert.equal(calls,2);await runCycle({...options,now:new Date('2026-10-06T10:00:00Z')});assert.equal(calls,2);
});

test('missing engine decisions reserve a degraded retry instead of a successful silent cycle',async t=>{
 const {dir,ledger}=fixture(t);
 const r=await runCycle({ledger,settings:{stateDir:dir},now,feeds:async()=>({}),finance:async()=>({pendingDecisions:1,decisionErrors:1}),business:async()=>({}),hasBusinessEvidence:()=>false,select:async()=>assert.fail(),synthesize:async()=>assert.fail(),deliver:async()=>assert.fail()});
 assert.equal(r.results.finance.degraded,true);assert.equal(ledger.cycleStatus().find(r=>r.name==='finance').status,'failed');
});
