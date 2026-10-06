import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {openLedger} from '../src/ledger.js';
import {ingestCandidates,supportsPublicSource} from '../../../scripts/ingest-alert-candidates.mjs';
const at=Date.parse('2026-10-05T10:00:00Z');
const item={producer:'sentinelle',scope:'public',topic:'system',sourceStatus:'title-only',
  url:'https://simonwillison.net/2026/Oct/3/example/',title:'Un fait public',excerpt:'Un extrait RSS.',
  publishedAt:'2026-10-03T00:00:00Z',observedAt:'2026-10-05T09:00:00Z'};
function fixture(t){const dir=mkdtempSync(path.join(os.tmpdir(),'ivan-ingest-')),ledger=openLedger(path.join(dir,'alerts.sqlite'));
 t.after(()=>{ledger.close();rmSync(dir,{recursive:true,force:true});});return ledger;}
const evidence=source=>({item:{...source,sourceStatus:'read',readAt:source.observedAt,excerpt:'Une véritable preuve issue de la page publiée.'},
 sourceReceipt:{url:source.url,readAt:source.observedAt,publishedDay:'2026-10-03',publicationPrecision:'day',extractor:'simon-blog-v1',responseSha256:'a'.repeat(64),bodyBytes:120}});
test('primary readers accept announcement routes only, never arbitrary URLs or authenticated pages',()=>{
 for(const url of ['https://mistral.ai/news/mistral-large-4/','https://developers.cloudflare.com/changelog/post/2026-10-02-web-search/'])assert.equal(supportsPublicSource(url),true);
 for(const url of ['not a url','http://nextjs.org/blog/example','https://user:pass@mistral.ai/news/example/','https://mistral.ai:444/news/example/','https://mistral.ai/news/example/#x','https://mistral.ai/news/example/?x=1','https://docs.mistral.ai/models/example'])assert.equal(supportsPublicSource(url),false);
});
test('reading a repost keeps the primary publication day so an old article never becomes fresh',async t=>{
 const ledger=fixture(t),source={...item,url:'https://developers.cloudflare.com/changelog/post/2026-09-20-web-search/',publishedAt:'2026-10-05T08:00:00Z'};
 const r=await ingestCandidates({ledger,envelope:{version:1,producer:'sentinelle',items:[source]},now:at,readSource:async raw=>{
  const e=evidence(raw);e.item.publishedAt='2026-09-20T00:00:00Z';e.sourceReceipt.publishedDay='2026-09-20';e.sourceReceipt.extractor='public-article-v1';return e;
 }});
 assert.equal(r.read,1);const read=ledger.get(ledger.ingest(source).id);assert.equal(read.item.publishedAt,'2026-09-20T00:00:00Z');
});
test('RSS export is promoted only through a matching page reader and is not fetched twice',async t=>{
 const ledger=fixture(t),envelope={version:1,producer:'sentinelle',items:[item]};let calls=0;
 const readSource=async source=>{calls++;return evidence(source);};
 const result=await ingestCandidates({ledger,envelope,readSource,now:at});assert.equal(result.read,1);assert.equal(result.sourceReceipts.length,1);
 assert.equal((await ingestCandidates({ledger,envelope,readSource,now:at})).duplicates,1);assert.equal(calls,1);
});
test('stale, unsupported, deferred, unreadable and mismatched sources never become read',async t=>{
 const ledger=fixture(t);let calls=0;
 const items=[{...item,url:'https://example.org/unsupported'}, {...item,url:item.url.replace('/example/','/old/'),publishedAt:'2026-09-01T00:00:00Z'},
 {...item,url:item.url.replace('/example/','/deferred/'),topic:'career'}, item];
 const result=await ingestCandidates({ledger,envelope:{version:1,producer:'sentinelle',items},now:at,
  readSource:async source=>{calls++;return {...evidence(source),item:{...evidence(source).item,url:'https://example.org/wrong'}};}});
 assert.equal(calls,1);assert.equal(result.read,0);assert.equal(result.readerErrors,1);assert.equal(result.unread,4);
 assert.equal(result.readerFailures[0].code,'ALERT_SOURCE_EVIDENCE_INVALID');
});
test('read limit bounds network work and imported records cannot claim they were read',async t=>{
 const ledger=fixture(t),items=[item,{...item,url:item.url.replace('/example/','/another/')}];let calls=0;
 const result=await ingestCandidates({ledger,envelope:{version:1,producer:'sentinelle',items},readLimit:1,now:at,
  readSource:async source=>{calls++;throw Error('private response');}});
 assert.equal(calls,1);assert.equal(result.unread,2);
 assert.equal(result.readerFailures[0].code,'PUBLIC_SOURCE_UNAVAILABLE');assert.ok(!JSON.stringify(result).includes('private response'));
 await assert.rejects(ingestCandidates({ledger,envelope:{version:1,producer:'sentinelle',items:[{...item,excerpt:'Un fait public complet prétendument lu.',sourceStatus:'read',readAt:item.observedAt}]}}),{code:'ALERT_EXPORT_INVALID'});
});
