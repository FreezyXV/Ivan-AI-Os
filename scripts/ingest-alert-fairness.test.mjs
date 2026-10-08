import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {openLedger} from '../services/alerts-runtime/src/ledger.js';
import {ingestCandidates} from './ingest-alert-candidates.mjs';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {canonicalUrl} from '../services/alerts-runtime/src/context.js';
const now=Date.parse('2026-10-05T12:00:00Z');
function source(index,topic='engineering'){
 return {producer:'sentinelle',scope:'public',topic,sourceStatus:'title-only',url:`https://nextjs.org/blog/source-${index}`,
 title:`Public source ${index}`,excerpt:'Feed metadata without article proof.',
 publishedAt:new Date(now-(index+1)*3600000).toISOString(),observedAt:new Date(now-1000).toISOString()};
}
const envelope=items=>({version:1,producer:'sentinelle',items});
function fixture(t){const dir=mkdtempSync(path.join(os.tmpdir(),'ivan-read-fairness-'));const ledger=openLedger(path.join(dir,'alerts.sqlite'));
 t.after(()=>{ledger.close();rmSync(dir,{recursive:true,force:true});});return ledger;}
function evidence(item){return {item:{...item,sourceStatus:'read',readAt:item.observedAt,excerpt:`Verified article facts specific to ${item.title}.`},
 sourceReceipt:{url:item.url,readAt:item.observedAt,publishedDay:item.publishedAt.slice(0,10),extractor:'public-article-v1',responseSha256:'a'.repeat(64),bodyBytes:120}};}
const crowded=()=>[...Array.from({length:12},(_,i)=>source(i)),source(12,'business'),source(13,'finance'),source(14,'system')];

test('a crowded technical feed cannot starve the active Business, Finance or System category',async t=>{
 const ledger=fixture(t),seen=[];const result=await ingestCandidates({ledger,envelope:envelope(crowded()),readLimit:8,now,
 readSource:async item=>{seen.push(item);return evidence(item);}});
 assert.equal(seen.length,8);assert.deepEqual(new Set(seen.map(x=>x.topic)),new Set(['business','finance','engineering','system']));
 assert.deepEqual(seen.slice(4).map(x=>x.title),[1,2,3,4].map(i=>`Public source ${i}`),'remaining slots go to freshest eligible sources');
 assert.equal(result.readAttempts,8);assert.equal(result.read,8);assert.equal(result.readLimitExhausted,7);
 assert.equal(result.readerErrors,0);assert.equal(result.unsupportedSources,0);
});

test('freshness determines the reservations and remaining reads independently of feed ordering',async t=>{
 const a=fixture(t),b=fixture(t),seenA=[],seenB=[];
 const read=seen=>async item=>{seen.push(item.url);return evidence(item);};
 await ingestCandidates({ledger:a,envelope:envelope(crowded()),readLimit:8,now,readSource:read(seenA)});
 await ingestCandidates({ledger:b,envelope:envelope(crowded().reverse()),readLimit:8,now,readSource:read(seenB)});
 assert.deepEqual(seenB,seenA);
});

test('failed reads still consume the hard global budget; zero and oversize budgets never call a reader',async t=>{
 const ledger=fixture(t);let calls=0;const readSource=async()=>{calls++;throw new Error('private transport detail');};
 const result=await ingestCandidates({ledger,envelope:envelope(crowded()),readLimit:8,now,readSource});
 assert.equal(calls,8);assert.equal(result.readerErrors,8);assert.equal(result.readLimitExhausted,7);assert.equal(result.unread,15);
 assert.ok(!JSON.stringify(result).includes('private transport detail'));
 const zero=await ingestCandidates({ledger,envelope:envelope(crowded()),readLimit:0,now,readSource});
 assert.equal(calls,8);assert.equal(zero.readLimitExhausted,7);assert.equal(zero.readDeferred,8);
 await assert.rejects(ingestCandidates({ledger,envelope:envelope(crowded()),readLimit:9,now,readSource}),{code:'ALERT_EXPORT_INVALID'});
 assert.equal(calls,8);
});

test('deferred, stale and unsupported sources are distinct from budget exhaustion and cannot steal category reservations',async t=>{
 const ledger=fixture(t),seen=[];
 const items=[{...source(20,'career')},{...source(21,'finance'),publishedAt:'2026-09-01T00:00:00Z'},
 {...source(22,'business'),url:'https://example.org/unsupported'},...crowded()];
 const result=await ingestCandidates({ledger,envelope:envelope(items),readLimit:8,now,readSource:async item=>{seen.push(item);return evidence(item);}});
 assert.equal(seen.length,8);assert.ok(seen.some(i=>i.topic==='finance'));assert.ok(seen.some(i=>i.topic==='business'));
 assert.ok(!seen.some(i=>i.topic==='career'));assert.equal(result.sourceFiltered,2);assert.equal(result.unsupportedSources,1);
 assert.equal(result.readLimitExhausted,7);assert.equal(result.unread,10);
 assert.ok(result.readSkips.some(x=>x.reason==='TOPIC_DEFERRED'));assert.ok(result.readSkips.some(x=>x.reason==='SOURCE_STALE'));
 assert.ok(result.readSkips.some(x=>x.reason==='PUBLIC_SOURCE_UNSUPPORTED'));assert.ok(result.readSkips.some(x=>x.reason==='SOURCE_READ_LIMIT'));
});

test('duplicate exports and previously proven pages consume no additional read slots',async t=>{
 const ledger=fixture(t),seen=[];const items=[source(0),source(0),source(1,'finance'),source(2,'business')];
 const readSource=async item=>{seen.push(item.url);return evidence(item);};
 const first=await ingestCandidates({ledger,envelope:envelope(items),readLimit:8,now,readSource});
 assert.equal(seen.length,3);assert.equal(first.readAttempts,3);assert.equal(first.duplicates,1);
 const second=await ingestCandidates({ledger,envelope:envelope(items),readLimit:8,now,readSource});
 assert.equal(seen.length,3);assert.equal(second.readAttempts,0);assert.equal(second.unread,0);assert.equal(second.duplicates,4);
});

test('Next HTML receipts accept 600KB only on Next while other hosts keep their 400KB ceiling',async t=>{
 for(const [url,bytes,expected] of [['https://nextjs.org/blog/large',498948,1],
  ['https://nextjs.org/blog/huge',600001,0],['https://huggingface.co/blog/large',498948,0]]){
  const ledger=fixture(t),item={...source(0),url};
  const result=await ingestCandidates({ledger,envelope:envelope([item]),now,
   readSource:async item=>({...evidence(item),sourceReceipt:{...evidence(item).sourceReceipt,bodyBytes:bytes}})});
  assert.equal(result.read,expected,url);assert.equal(result.readerErrors,1-expected,url);
 }
});

test('Mistral slash aliases reuse the same proven source without another read',async t=>{
 const ledger=fixture(t),item={...source(0),url:'https://mistral.ai/news/mistral-large-4/'};
 const first=ledger.ingest(evidence(item).item);
 const result=await ingestCandidates({ledger,envelope:envelope([item,{...item,url:item.url+'/'},{...item,url:item.url.slice(0,-1)}]),now,
  readSource:async()=>assert.fail('already read announcement')});
 assert.equal(result.readAttempts,0);assert.equal(result.duplicates,3);
 assert.equal(ledger.get(first.id).item.url,item.url);
});

test('legacy unread aliases are retired without changing proven sources or attempted deliveries',t=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'ivan-legacy-alias-')),filename=path.join(dir,'alerts.sqlite');
 let ledger=openLedger(filename);t.after(()=>{ledger.close();rmSync(dir,{recursive:true,force:true});});
 const canonical={...source(0),url:'https://mistral.ai/news/mistral-large-4/'};
 const target=ledger.ingest(evidence(canonical).item);
 const ready=ledger.claim();ledger.finish(ready.id,ready.owner,{state:'ready',reason:'QUALIFIED',brief:{message:'A verified message.'}});
 const sending=ledger.beginDelivery(target.id);
 ledger.finishDelivery(target.id,sending.owner,{delivered:true,messageId:'proof-1'});
 const before=ledger.get(target.id);ledger.close();
 const db=new DatabaseSync(filename),aliases=[];
 // These identities were written before URL canonicalization existed.
 for(const [url,status,state,topic] of [[canonical.url+'/','title-only','review','engineering'],
  [canonical.url+'//','read','review','engineering'],[canonical.url+'///','title-only','sending','engineering'],
  [canonical.url+'////','title-only','review','career']]){
  const item={...canonical,url,topic,sourceStatus:status,...(status==='read'?{readAt:canonical.observedAt}:{})};
  const id=createHash('sha256').update(url).digest('hex');aliases.push(id);
  db.prepare('INSERT INTO alerts(id,url,item,state,created,updated,reason) VALUES(?,?,?,?,?,?,?)')
   .run(id,url,JSON.stringify(item),state,now,now,'SOURCE_NOT_READ');
 }
 db.close();ledger=openLedger(filename);
 assert.equal(ledger.resolveUnreadAliases(),1);assert.equal(ledger.resolveUnreadAliases(),0);
 assert.deepEqual(ledger.get(target.id),before);
 assert.equal(ledger.get(aliases[0]).reason,'DUPLICATE_SOURCE_URL');
 assert.equal(ledger.get(aliases[0]).brief.duplicateOf,target.id);
 assert.equal(ledger.get(aliases[1]).state,'review');assert.equal(ledger.get(aliases[2]).state,'sending');
 assert.equal(ledger.get(aliases[3]).state,'review');
 assert.equal(canonicalUrl('https://example.org/resource//'),'https://example.org/resource//');
 assert.equal(canonicalUrl('https://mistral.ai/docs/example//'),'https://mistral.ai/docs/example//');
});

test('a missing terminal archive cannot stop a feed batch or trigger another read',async()=>{
 const item={scope:'public',producer:'sentinelle',topic:'system',url:'https://simonwillison.net/2026/Oct/5/proof/',title:'Une annonce déjà livrée',publishedAt:'2026-10-05T08:00:00Z',observedAt:'2026-10-05T09:00:00Z',sourceStatus:'title-only',excerpt:''};
 const result=await ingestCandidates({ledger:{resolveUnreadAliases:()=>0,unreadCandidates:()=>[],ingest:()=>({id:'known',duplicate:true,state:'delivered'}),get:()=>assert.fail('terminal archive must never be loaded by the collector')},envelope:{version:1,producer:'sentinelle',items:[item]},readSource:async()=>assert.fail(),now:Date.parse('2026-10-05T10:00:00Z')});
 assert.equal(result.duplicates,1);assert.equal(result.readAttempts,0);
});

test('structural failures survive restart and free the next cycle for another source',async t=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'ivan-reader-restart-'));
 let ledger=openLedger(path.join(dir,'alerts.sqlite'));
 t.after(()=>{ledger.close();rmSync(dir,{recursive:true,force:true});});
 const seen=[],items=[source(0),source(1),source(2)];
 const readSource=async item=>{seen.push(item.title);if(item.url!==items[2].url)
  throw Object.assign(Error('private body'),{code:'PUBLIC_SOURCE_TOO_LARGE'});return evidence(item);};
 await ingestCandidates({ledger,envelope:envelope(items),readLimit:2,now,readSource});
 ledger.close();ledger=openLedger(path.join(dir,'alerts.sqlite'));
 const second=await ingestCandidates({ledger,envelope:envelope([]),readLimit:2,now:now+1000,readSource});
 assert.deepEqual(seen,items.map(i=>i.title));
 assert.equal(second.read,1);assert.equal(second.readAttempts,1);
 const third=await ingestCandidates({ledger,envelope:envelope(items),readLimit:2,now:now+2000,readSource});
 assert.equal(third.readAttempts,0);assert.equal(third.readDeferred,2);
 assert.ok(!JSON.stringify(third).includes('private body'));
});

test('transient reader failures cool down, stop after three attempts and reset only for a new reader revision',async t=>{
 const ledger=fixture(t),items=[source(0)];let calls=0;
 const options={ledger,envelope:envelope(items),readLimit:1,readerRevision:'a'.repeat(64),
  readSource:async()=>{calls++;throw Object.assign(Error('private network detail'),{code:'PUBLIC_SOURCE_TIMEOUT'});}};
 for(const at of [now,now+1000,now+1800000,now+1800001,now+9000000,now+90000000])
  await ingestCandidates({...options,now:at});
 assert.equal(calls,3);
 await ingestCandidates({...options,now:now+90000001,readerRevision:'b'.repeat(64)});
 assert.equal(calls,4);
});

test('a changed reader revision retries structural failures without reopening delivered evidence',async t=>{
 const ledger=fixture(t),items=[source(0)];let calls=0;
 const options={ledger,envelope:envelope(items),readLimit:1,now,readerRevision:'a'.repeat(64),
  readSource:async item=>{calls++;if(calls===1)throw Object.assign(Error(),{code:'PUBLIC_SOURCE_DATE_UNVERIFIED'});return evidence(item);}};
 await ingestCandidates(options);
 await ingestCandidates(options);assert.equal(calls,1);
 await ingestCandidates({...options,readerRevision:'b'.repeat(64)});assert.equal(calls,2);
 await ingestCandidates({...options,readerRevision:'c'.repeat(64)});assert.equal(calls,2);
 assert.deepEqual(ledger.sourceReadFailures(),[]);
});

test('a hundred blocked pages cannot hide an older readable page behind the backlog limit',async t=>{
 const ledger=fixture(t),revision='a'.repeat(64),items=Array.from({length:101},(_,i)=>
  ({...source(i),publishedAt:new Date(now-(i+1)*600000).toISOString()}));
 for(const item of items.slice(0,100)){
  const {id}=ledger.ingest(item);
  ledger.recordSourceReadFailure(id,{revision,code:'PUBLIC_SOURCE_TOO_LARGE',at:now});
 }
 ledger.ingest(items[100]);let seen;
 const result=await ingestCandidates({ledger,envelope:envelope([]),readerRevision:revision,readLimit:1,now,
  readSource:async item=>{seen=item.url;return evidence(item);}});
 assert.equal(seen,items[100].url);assert.equal(result.read,1);
});
