import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { openLedger } from '../src/ledger.js';
import { validateItem, prefilter, canonicalUrl, PILOT_CONTEXT } from '../src/context.js';
import { renderBrief, processNext, deliverReady } from '../src/pipeline.js';

const at=Date.parse('2026-10-05T10:00:00Z');
const item=(overrides={})=>({producer:'sentinelle',url:'https://example.org/news/mac?utm_source=bot#detail',
  scope:'public',topic:'system',title:'Le pilote Mac reprend ses tâches',
  publishedAt:'2026-10-05T08:00:00Z',observedAt:'2026-10-05T09:00:00Z',readAt:'2026-10-05T09:00:00Z',
  sourceStatus:'read',excerpt:'Le test synthétique observe une reprise après 15 secondes. Il ne mesure pas la disponibilité générale.',...overrides});
const brief=()=>({goal:'system',facts:[{summary:'Le test observe une reprise après 15 secondes.',quote:'une reprise après 15 secondes'}],
  utility:'Ce résultat concerne la reprise des services du pilote Mac.',action:'Vérifier la même reprise sur le service réel.',
  uncertainty:'Cette source synthétique ne prouve pas une disponibilité permanente.'});
function fixture(t){
  const dir=mkdtempSync(path.join(os.tmpdir(),'ivan-alert-test-'));let time=at;
  const file=path.join(dir,'ledger.sqlite'),ledger=openLedger(file,{now:()=>time,leaseMs:1000});
  t.after(()=>{ledger.close();rmSync(dir,{recursive:true,force:true});});
  return {ledger,file,advance:ms=>{time+=ms;}};
}
const keep=async()=>({decision:'keep',confidence:0.9});

test('two bot producers share a canonical source and one queue entry',t=>{
  const {ledger}=fixture(t),first=ledger.ingest(item());
  const second=ledger.ingest(item({producer:'secretaire',url:'https://example.org/news/mac?fbclid=tracking'}));
  assert.equal(first.duplicate,false);assert.equal(second.duplicate,true);assert.equal(first.id,second.id);
  assert.deepEqual(ledger.counts(),{pending:1});
});

test('deferred topics and stale sources spend no selection or synthesis calls',async t=>{
  const {ledger}=fixture(t);let calls=0;
  const select=async()=>{calls++;return keep();},synthesize=async()=>{calls++;return brief();};
  for(const [suffix,patch,reason] of [
    ['career',{topic:'career'},'TOPIC_DEFERRED'],['knowledge',{topic:'knowledge'},'TOPIC_DEFERRED'],
    ['ovh',{topic:'ovh'},'TOPIC_DEFERRED'],['old',{publishedAt:'2026-09-01T08:00:00Z'},'SOURCE_STALE']]){
    ledger.ingest(item({...patch,url:`https://example.org/${suffix}`}));
    const result=await processNext({ledger,select,synthesize,now:at});
    assert.equal(result.state,'skipped');assert.equal(result.reason,reason);
  }
  assert.equal(calls,0);
});

test('a title or inaccessible source cannot become a synthesized article',async t=>{
  const {ledger}=fixture(t);let calls=0;
  for(const sourceStatus of ['title-only','unavailable']){
    ledger.ingest(item({url:`https://example.org/${sourceStatus}`,sourceStatus,excerpt:''}));
    const result=await processNext({ledger,now:at,select:()=>{calls++;},synthesize:()=>{calls++;}});
    assert.equal(result.state,'review');assert.equal(result.reason,'SOURCE_NOT_READ');
  }
  assert.equal(calls,0);
});

test('invalid calendar dates, future evidence and invalid filter configuration are caught',()=>{
  assert.throws(()=>validateItem(item({publishedAt:'2026-02-30T08:00:00Z'})),{code:'ALERT_ITEM_INVALID'});
  assert.equal(prefilter(validateItem(item({readAt:'2026-10-06T09:00:00Z'})),{now:at}).reason,'SOURCE_DATE_IN_FUTURE');
  assert.throws(()=>prefilter(item(),{now:at,maxAgeHours:-1}),{code:'ALERT_FILTER_CONFIG_INVALID'});
  assert.equal(validateItem(item({readAt:'2026-10-05T09:00:00.123Z'})).readAt,'2026-10-05T09:00:00.123Z');
});

test('URL normalization rejects credentials and local hosts; content-changing parameters survive',()=>{
  for(const url of ['http://example.org','https://user:pass@example.org','https://localhost/a',
    'https://127.1/a','https://10.1.2.3/a','https://172.20.1.2/a','https://[::1]/a'])
    assert.throws(()=>canonicalUrl(url),{code:'ALERT_URL_INVALID'});
  assert.equal(canonicalUrl('https://example.org/?article=4&utm_medium=bot#x'),'https://example.org/?article=4');
});

test('uncertain, malformed and unavailable selections do not trigger prose generation',async t=>{
  const {ledger}=fixture(t);let calls=0;
  const selections=[async()=>({decision:'keep',confidence:0.4}),async()=>({decision:'whatever',confidence:1}),
    async()=>{throw Error('provider outage');},async()=>({decision:'skip',confidence:0.9})];
  const expected=['SELECTION_UNCERTAIN','SELECTION_INVALID','SELECTION_UNAVAILABLE','SELECTION_REJECTED'];
  for(let i=0;i<selections.length;i++){
    ledger.ingest(item({url:`https://example.org/selection/${i}`,title:`Sélection indépendante ${i}`}));
    const result=await processNext({ledger,now:at,select:selections[i],synthesize:()=>{calls++;}});
    assert.equal(result.reason,expected[i]);
  }
  assert.equal(calls,0);
});

test('verified brief is self-contained and passes only compact public context to providers',async t=>{
  const {ledger}=fixture(t);ledger.ingest(item());
  const result=await processNext({ledger,now:at,select:async(source,context)=>{
    assert.equal(source.scope,'public');assert.deepEqual(context,PILOT_CONTEXT);return keep();
  },synthesize:async(source,context)=>{assert.equal(context.version,PILOT_CONTEXT.version);return brief();}});
  assert.equal(result.state,'ready');assert.match(result.brief.message,/15 secondes/);
  assert.match(result.brief.message,/Utilité pour toi/);assert.match(result.brief.message,/À faire/);
  assert.match(result.brief.message,/Source : https:\/\/example.org\/news\/mac$/);
});

test('fabricated quotation or unsupported number prevents automatic delivery',async t=>{
  const {ledger}=fixture(t);
  for(const [i,fact] of [
    {summary:'Reprise en 2 secondes.',quote:'une reprise après 15 secondes'},
    {summary:'Tout fonctionne.',quote:'Cette phrase ne figure pas dans la source.'}
  ].entries()){
    ledger.ingest(item({url:`https://example.org/fact/${i}`,title:`Vérification indépendante ${i}`}));
    const result=await processNext({ledger,now:at,select:keep,synthesize:async()=>({...brief(),facts:[fact]})});
    assert.equal(result.state,'review');assert.equal(result.reason,'ALERT_FACT_UNSUPPORTED');
  }
  assert.throws(()=>renderBrief(validateItem(item()),{...brief(),goal:'career'}),{code:'ALERT_BRIEF_INVALID'});
});

test('separate SQLite connections cannot claim the same live lease',t=>{
  const {ledger,file}=fixture(t),other=openLedger(file,{now:()=>at,leaseMs:1000});
  try{ledger.ingest(item());const first=ledger.claim();assert.ok(first.owner);assert.equal(other.claim(),null);}
  finally{other.close();}
});

test('expired work is recoverable and its old worker cannot overwrite the new result',t=>{
  const {ledger,advance}=fixture(t);ledger.ingest(item());const first=ledger.claim();advance(1001);
  const second=ledger.claim();assert.notEqual(first.owner,second.owner);
  assert.throws(()=>ledger.finish(first.id,first.owner,{state:'skipped',reason:'OLD_WORKER'}),{code:'ALERT_LEASE_LOST'});
  assert.equal(ledger.finish(second.id,second.owner,{state:'review',reason:'RECOVERED'}).state,'review');
});

test('a crashed process releases SQLite locks and its lease is recoverable',async t=>{
  const {ledger,file,advance}=fixture(t);const {id}=ledger.ingest(item());
  const moduleUrl=new URL('../src/ledger.js',import.meta.url).href;
  const code=`import { openLedger } from ${JSON.stringify(moduleUrl)};
    const ledger=openLedger(${JSON.stringify(file)},{now:()=>${at},leaseMs:1000});
    ledger.claim(); process.kill(process.pid,'SIGKILL');`;
  const child=spawn(process.execPath,['--input-type=module','-e',code],{stdio:'ignore'});
  await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',(exit,signal)=>{
    try{assert.equal(signal,'SIGKILL');resolve();}catch(e){reject(e);}
  });});
  assert.equal(ledger.get(id).state,'processing');advance(1001);
  assert.equal(ledger.claim().id,id);assert.equal(statSync(file).mode&0o077,0);
});

test('two simultaneous delivery requests invoke the sender once and preserve its receipt',async t=>{
  const {ledger}=fixture(t),{id}=ledger.ingest(item());
  await processNext({ledger,now:at,select:keep,synthesize:async()=>brief()});let calls=0;
  let release;const paused=new Promise(resolve=>{release=resolve;});
  const first=deliverReady({ledger,id,deliver:async()=>{calls++;await paused;return {delivered:true,messageId:'telegram:123'};}});
  const second=await deliverReady({ledger,id,deliver:()=>{calls++;}});
  assert.equal(second.state,'not_ready');release();assert.equal((await first).state,'delivered');assert.equal(calls,1);
  assert.deepEqual(ledger.get(id).receipt,{delivered:true,messageId:'telegram:123'});
});

test('a delivery timeout is held for reconciliation and never automatically retried',async t=>{
  const {ledger}=fixture(t),{id}=ledger.ingest(item());
  await processNext({ledger,now:at,select:keep,synthesize:async()=>brief()});let calls=0;
  assert.equal((await deliverReady({ledger,id,deliver:async()=>{calls++;throw Error('timeout after send');}})).state,'delivery_unknown');
  assert.equal((await deliverReady({ledger,id,deliver:async()=>{calls++;}})).state,'not_ready');assert.equal(calls,1);
});

test('crash during sending does not return the alert to the unsent queue',async t=>{
  const {ledger,advance}=fixture(t),{id}=ledger.ingest(item());
  await processNext({ledger,now:at,select:keep,synthesize:async()=>brief()});ledger.beginDelivery(id);advance(1001);
  assert.equal(ledger.reconcile(),1);assert.equal(ledger.get(id).state,'delivery_unknown');assert.equal(ledger.claim(),null);
});

test('ready requires a message and confirmed delivery requires an actual receipt identifier',t=>{
  const {ledger}=fixture(t),{id}=ledger.ingest(item()),job=ledger.claim();
  assert.throws(()=>ledger.finish(id,job.owner,{state:'ready',reason:'BRIEF_VERIFIED'}),{code:'ALERT_RESULT_INVALID'});
  ledger.finish(id,job.owner,{state:'ready',reason:'BRIEF_VERIFIED',brief:{message:'Test synthétique'}});
  const send=ledger.beginDelivery(id);assert.equal(ledger.finishDelivery(id,send.owner,{delivered:true}).state,'delivery_unknown');
});

test('a hanging provider is cancelled and cannot block the next queued alert',async t=>{
  const {ledger}=fixture(t);ledger.ingest(item());let signal;
  const result=await processNext({ledger,now:at,stageTimeoutMs:15,
    select:async(_item,_context,options)=>{signal=options.signal;return new Promise(()=>{});}});
  assert.equal(result.reason,'SELECTION_TIMEOUT');assert.equal(result.state,'review');assert.equal(signal.aborted,true);
  ledger.ingest(item({url:'https://example.org/next',title:'Une autre annonce après la panne'}));
  assert.equal((await processNext({ledger,now:at,select:keep,synthesize:async()=>brief()})).state,'ready');
});

test('synthesis timeout preserves the Jev decision receipt instead of retrying',async t=>{
  const {ledger}=fixture(t);ledger.ingest(item());
  const selected={decision:'keep',confidence:0.9,provider:'jev',request_id:'00000000-0000-4000-a000-000000000000',context_version:PILOT_CONTEXT.version};
  const result=await processNext({ledger,now:at,stageTimeoutMs:15,select:async()=>selected,synthesize:async()=>new Promise(()=>{})});
  assert.equal(result.reason,'SYNTHESIS_TIMEOUT');assert.deepEqual({...result.brief.selection,itemSha256:undefined},{...selected,policy:{keepMinConfidence:0.75,skipMinConfidence:0.75},itemSha256:undefined});assert.match(result.brief.selection.itemSha256,/^[a-f0-9]{64}$/);
});

test('a sender that never returns becomes uncertain and is never invoked twice',async t=>{
  const {ledger}=fixture(t),{id}=ledger.ingest(item());
  await processNext({ledger,now:at,select:keep,synthesize:async()=>brief()});let signal;
  const result=await deliverReady({ledger,id,timeoutMs:15,deliver:async options=>{signal=options.signal;return new Promise(()=>{});}});
  assert.equal(result.state,'delivery_unknown');assert.equal(signal.aborted,true);assert.equal(ledger.beginDelivery(id),null);
});

test('a resumed old worker reports lease loss without overwriting the new owner',async t=>{
  const {ledger,advance}=fixture(t),{id}=ledger.ingest(item());
  let resume;const waiting=new Promise(resolve=>{resume=resolve;});
  let syntheses=0;
  const old=processNext({ledger,now:at,select:async()=>{await waiting;return keep();},synthesize:async()=>{syntheses++;return brief();}});
  await new Promise(resolve=>setImmediate(resolve));advance(1001);
  const current=ledger.claim();ledger.finish(id,current.owner,{state:'review',reason:'NEW_OWNER_RESULT'});resume();
  assert.equal((await old).state,'lease_lost');assert.equal(ledger.get(id).reason,'NEW_OWNER_RESULT');
  assert.equal(syntheses,0);
});

test('new source evidence can release an unread review without retrying delivered or uncertain sends',async t=>{
  const {ledger}=fixture(t);
  const unread=item({sourceStatus:'title-only',excerpt:'Un extrait RSS incomplet.'});
  const {id}=ledger.ingest(unread);
  assert.equal((await processNext({ledger,now:at})).reason,'SOURCE_NOT_READ');
  const updated=ledger.ingest(item());
  assert.equal(updated.evidenceUpdated,true);assert.equal(ledger.get(id).state,'pending');
  await processNext({ledger,now:at,select:keep,synthesize:async()=>brief()});
  await deliverReady({ledger,id,deliver:async()=>{throw Error('uncertain');}});
  assert.equal(ledger.ingest(item()).state,'delivery_unknown');
  assert.equal(ledger.get(id).state,'delivery_unknown');
});

test('invalid stage configuration cannot consume a queued source or masquerade as provider failure',async t=>{
 const {ledger}=fixture(t);const {id}=ledger.ingest(item());
 await assert.rejects(processNext({ledger,stageTimeoutMs:70000}),{code:'ALERT_DEADLINE_CONFIG_INVALID'});
 assert.equal(ledger.get(id).state,'pending');
 await processNext({ledger,now:at,select:async()=>{throw Error();}});
 assert.equal(ledger.retryTransient({minDelayMs:0}),1);
 await processNext({ledger,now:at,select:async()=>{throw Error();}});
 assert.equal(ledger.retryTransient({minDelayMs:0}),0);
});
test('operator reader repair permits one changed evidence revision but never reopens an attempted send',async t=>{
 const {ledger}=fixture(t);const original=item();const {id}=ledger.ingest(original);
 await processNext({ledger,now:at,select:async()=>({decision:'review',confidence:0.8})});
 const updated={...original,excerpt:'Une preuve différente, réellement lue, après correction du lecteur.'};
 assert.equal(ledger.reviseReviewedEvidence(updated,{revision:'reader-clean-v2'}).revised,true);
 await processNext({ledger,now:at,select:async()=>({decision:'review',confidence:0.8})});
 assert.equal(ledger.reviseReviewedEvidence(original,{revision:'reader-clean-v2'}).revised,false);
 assert.equal(ledger.get(id).state,'review');
 assert.equal(ledger.reviseReviewedEvidence({...original,topic:'finance'},{revision:'reader-clean-v3'}).revised,false);
 const {id:other}=ledger.ingest(item({url:'https://example.org/sent',title:'Une autre annonce à livrer'}));
 await processNext({ledger,now:at,select:keep,synthesize:async()=>brief()});
 await deliverReady({ledger,id:other,deliver:async()=>{throw Error();}});
 assert.equal(ledger.reviseReviewedEvidence({...updated,url:'https://example.org/sent'},{revision:'reader-clean-v2'}).revised,false);
 assert.equal(ledger.get(other).state,'delivery_unknown');
});

test('a native synthesis retry reuses the bound Jev receipt instead of paying selection again',async t=>{
 const {ledger,advance}=fixture(t);ledger.ingest(item());let selected=0;
 const options={ledger,now:at,select:async()=>{selected++;return{decision:'keep',confidence:0.9,provider:'jev',context_version:PILOT_CONTEXT.version,request_id:'00000000-0000-4000-a000-000000000000'};},synthesize:async()=>{throw Error('temporary native outage');}};
 await processNext(options);advance(900001);assert.equal(ledger.retryTransient(),1);
 await processNext({...options,now:at+900001,synthesize:async()=>brief()});assert.equal(selected,1);assert.equal(ledger.counts().ready,1);
});
