import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {openLedger} from '../src/ledger.js';
import {processNext} from '../src/pipeline.js';
import {createJevSelector} from '../src/jev-selector.js';
import {PILOT_CONTEXT} from '../src/context.js';
import {runCycle} from '../../../scripts/mac-alerts-cycle.mjs';

const at=Date.parse('2026-10-05T10:00:00Z');
const receipt=confidence=>({decision:'keep',confidence,provider:'jev',
  request_id:'00000000-0000-4000-a000-000000000000',context_version:PILOT_CONTEXT.version});
const item=i=>({producer:'sentinelle',scope:'public',topic:'system',url:`https://example.org/recovery/${i}`,
  title:`Annonce indépendante ${i}`,publishedAt:'2026-10-05T08:00:00Z',observedAt:'2026-10-05T09:00:00Z',
  readAt:'2026-10-05T09:00:00Z',sourceStatus:'read',excerpt:'Le pilote conserve les preuves et les reçus lors de ses redémarrages.'});
const brief=()=>({goal:'system',facts:[{summary:'Le pilote conserve ses preuves.',quote:'Le pilote conserve les preuves'}],
  utility:'Préserver les preuves lors de la reprise du pilote.',action:'Vérifier les reçus après redémarrage.'});
function fixture(t){
  const dir=mkdtempSync(path.join(tmpdir(),'ivan-selection-recovery-'));let clock=at;
  const file=path.join(dir,'alerts.sqlite');let ledger=openLedger(file,{now:()=>clock});
  t.after(()=>{ledger.close();rmSync(dir,{recursive:true,force:true});});
  return{dir,get ledger(){return ledger;},advance(ms){clock+=ms;},get now(){return clock;},
    reopen(){ledger.close();ledger=openLedger(file,{now:()=>clock});}};
}

test('unchanged reviews beyond the first page eventually release a useful receipt without reselecting',async t=>{
  const f=fixture(t);let final;
  for(let i=0;i<101;i++){
    f.advance(1);final=f.ledger.ingest(item(i)).id;
    const result=await processNext({ledger:f.ledger,now:f.now,select:async()=>receipt(i===100?0.3:0.1)});
    assert.equal(result.reason,'SELECTION_UNCERTAIN');
  }
  let generated=0;
  const options=()=>({ledger:f.ledger,settings:{stateDir:f.dir,selectionPolicy:{keepMinConfidence:0.2,skipMinConfidence:0.25}},
    now:new Date(f.now),processNow:true,feeds:async()=>({}),finance:async()=>({}),business:async()=>({}),
    select:async()=>assert.fail('an unchanged recorded source must not spend another Jev request'),
    synthesize:async()=>{generated++;return brief();},deliver:async()=>assert.fail('qualification never sends Telegram')});
  await runCycle(options());
  assert.equal(f.ledger.get(final).state,'review','first pass remains bounded to its first page');
  f.advance(60000);
  const second=await runCycle(options());
  assert.equal(second.policyRevisions,1);
  assert.equal(f.ledger.get(final).state,'ready');
  assert.equal(f.ledger.get(final).brief.selection.replayed,true);
  assert.equal(generated,1);
  assert.deepEqual(f.ledger.counts(),{review:100,ready:1});
  f.advance(60000);await runCycle(options());assert.equal(generated,1);
});

test('a synthesis timeout survives a database reopen and resumes using its original Jev receipt',async t=>{
  const f=fixture(t),id=f.ledger.ingest(item('timeout')).id;let selected=0,generated=0;
  const first=await processNext({ledger:f.ledger,now:f.now,stageTimeoutMs:15,
    select:async()=>{selected++;return receipt(0.9);},synthesize:async()=>{generated++;return new Promise(()=>{});}});
  assert.equal(first.reason,'SYNTHESIS_TIMEOUT');
  const requestId=first.brief.selection.request_id;
  f.reopen();f.advance(900001);assert.equal(f.ledger.retryTransient(),1);
  const next=await processNext({ledger:f.ledger,now:f.now,
    select:async()=>{selected++;assert.fail('native retry must reuse the bound paid receipt');},
    synthesize:async()=>{generated++;return brief();}});
  assert.equal(next.state,'ready');assert.equal(selected,1);assert.equal(generated,2);
  assert.equal(next.brief.selection.request_id,requestId);
  assert.equal(next.brief.selection.replayed,true);
  assert.equal(f.ledger.get(id).retries,1);
});

test('a native retry cannot reuse a receipt from another selection context',async t=>{
  const f=fixture(t);f.ledger.ingest(item('old-context'));let selected=0;
  await processNext({ledger:f.ledger,now:f.now,select:async()=>{selected++;return{...receipt(0.9),context_version:'obsolete-context'};},
    synthesize:async()=>{throw Error('temporary native outage');}});
  f.advance(900001);assert.equal(f.ledger.retryTransient(),1);
  const result=await processNext({ledger:f.ledger,now:f.now,select:async()=>{selected++;return receipt(0.9);},synthesize:async()=>brief()});
  assert.equal(result.state,'ready');assert.equal(selected,2);
  assert.equal(result.brief.selection.replayed,undefined);
});

test('the production adapter rejects malformed probabilities rather than silently falling back to KEEP',async()=>{
  const malformed=[null,[],{keep:0.99,review:0.99,skip:0.99},{keep:0.8,review:0.2},{keep:0.8,review:0.1,skip:-0.1}];
  for(const probabilities of malformed){
    const select=createJevSelector({token:'synthetic-token-'.repeat(4),fetchImpl:async()=>({ok:true,json:async()=>({
      ...receipt(0.9),question:'alerts.pertinence.mac-v3',probabilities})})});
    await assert.rejects(select(item('malformed'),PILOT_CONTEXT),{code:'ALERT_SELECTION_UNAVAILABLE'});
  }
  const legacy=createJevSelector({token:'synthetic-token-'.repeat(4),fetchImpl:async()=>({ok:true,json:async()=>({
    ...receipt(0.9),question:'alerts.pertinence.mac-v3'})})});
  assert.deepEqual(await legacy(item('legacy'),PILOT_CONTEXT),receipt(0.9),'a genuinely absent field stays compatible');
});
test('a versioned context migration is bounded, preserves obsolete decisions and never resends attempted alerts',async t=>{
 const f=fixture(t),ids=[];
 for(let i=0;i<10;i++){
  ids.push(f.ledger.ingest(item('migration-'+i)).id);
  const job=f.ledger.claim();
  f.ledger.finish(job.id,job.owner,{state:'review',reason:'SELECTION_UNCERTAIN',brief:{selection:{...receipt(0.3),context_version:'old-context'}}});
 }
 const migrated=f.ledger.reselectReviewedContext();assert.equal(migrated.requeued,8);
 assert.equal(f.ledger.counts().pending,8);assert.equal(f.ledger.counts().review,2);
 const second=f.ledger.reselectReviewedContext();assert.equal(second.requeued,2);
 let calls=0;
 const result=await processNext({ledger:f.ledger,now:f.now,select:async()=>{calls++;return receipt(0.9);},synthesize:async()=>brief()});
 assert.equal(result.state,'ready');assert.equal(calls,1);assert.equal(result.brief.selection.replayed,undefined);
 const send=f.ledger.beginDelivery(result.id);f.ledger.finishDelivery(send.id,send.owner,undefined);
 assert.equal(f.ledger.get(send.id).state,'delivery_unknown');
 assert.equal(f.ledger.reselectReviewedContext().requeued,0);
 assert.equal(f.ledger.get(send.id).state,'delivery_unknown');
 assert.throws(()=>f.ledger.reselectReviewedContext({limit:9}),{code:'ALERT_REVISION_INVALID'});
});
test('context migration cannot promote an old, deferred, unread or fabricated receipt',async t=>{
 const f=fixture(t);
 f.ledger.ingest(item('stale-migration'));
 const old=f.ledger.claim();f.ledger.finish(old.id,old.owner,{state:'review',reason:'SELECTION_UNCERTAIN',brief:{selection:{...receipt(0.3),context_version:'old-context'}}});
 f.advance(73*3600000);
 assert.equal(f.ledger.reselectReviewedContext().requeued,0);
 assert.equal(f.ledger.reselectReviewedContext().checked,0,'examined stale reviews do not mask the next page forever');
 const id=f.ledger.ingest({...item('fabricated'),publishedAt:new Date(f.now).toISOString(),observedAt:new Date(f.now).toISOString(),readAt:new Date(f.now).toISOString()}).id;
 const job=f.ledger.claim();
 f.ledger.finish(id,job.owner,{state:'review',reason:'SELECTION_UNCERTAIN',brief:{selection:{...receipt(0.3),context_version:'old-context',request_id:'invented'}}});
 assert.equal(f.ledger.reselectReviewedContext().requeued,0);
});
