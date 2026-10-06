import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {openLedger} from '../services/alerts-runtime/src/ledger.js';
import {ingestCandidates} from './ingest-alert-candidates.mjs';
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
 assert.equal(calls,8);assert.equal(zero.readLimitExhausted,15);
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

test('a missing terminal archive cannot stop a feed batch or trigger another read',async()=>{
 const item={scope:'public',producer:'sentinelle',topic:'system',url:'https://simonwillison.net/2026/Oct/5/proof/',title:'Une annonce déjà livrée',publishedAt:'2026-10-05T08:00:00Z',observedAt:'2026-10-05T09:00:00Z',sourceStatus:'title-only',excerpt:''};
 const result=await ingestCandidates({ledger:{unreadCandidates:()=>[],ingest:()=>({id:'known',duplicate:true,state:'delivered'}),get:()=>assert.fail('terminal archive must never be loaded by the collector')},envelope:{version:1,producer:'sentinelle',items:[item]},readSource:async()=>assert.fail(),now:Date.parse('2026-10-05T10:00:00Z')});
 assert.equal(result.duplicates,1);assert.equal(result.readAttempts,0);
});
