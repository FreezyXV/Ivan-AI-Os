import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {openLedger} from '../src/ledger.js';
const source=(url='https://example.org/one')=>({producer:'sentinelle',scope:'public',topic:'system',url,
 title:'Une annonce publique',publishedAt:'2026-10-05T08:00:00Z',observedAt:'2026-10-05T09:00:00Z',readAt:'2026-10-05T09:00:00Z',
 sourceStatus:'read',excerpt:'Le pilote conserve les reçus après une reprise du service.'});
function fixture(t){const dir=mkdtempSync(path.join(tmpdir(),'ivan-retention-'));let at=Date.parse('2026-10-05T10:00:00Z');
 const ledger=openLedger(path.join(dir,'alerts.sqlite'),{now:()=>at,capacity:2});
 t.after(()=>{ledger.close();rmSync(dir,{recursive:true,force:true});});return {dir,ledger,advance:days=>{at+=days*86400000;}};}
test('the same read announcement on distinct URLs spends once, while changed facts or topic remain distinct',t=>{
 const {ledger}=fixture(t),first=ledger.ingest(source());
 const again=ledger.ingest({...source('https://example.net/repost'),producer:'secretaire'});
 assert.equal(again.duplicate,true);assert.equal(again.id,first.id);assert.equal(again.deduplication,'read-evidence');
 assert.equal(ledger.ingest({...source('https://example.org/changed'),excerpt:source().excerpt+' Une nouveauté différente.'}).duplicate,false);
 assert.throws(()=>ledger.ingest({...source('https://example.org/third'),topic:'finance'}),{code:'ALERT_QUEUE_FULL'});
});
test('terminal history does not exhaust the active queue and archival keeps receipts, evidence and deduplication',t=>{
 const {ledger,advance,dir}=fixture(t);const first=ledger.ingest(source()),job=ledger.claim();
 ledger.finish(job.id,job.owner,{state:'ready',reason:'BRIEF_VERIFIED',brief:{message:'Synthèse autonome.'}});
 const sending=ledger.beginDelivery(first.id);ledger.finishDelivery(first.id,sending.owner,{delivered:true,messageId:'telegram:one'});
 const second=ledger.ingest({...source('https://example.org/two'),title:'Deuxième annonce'}),other=ledger.claim();
 ledger.finish(other.id,other.owner,{state:'skipped',reason:'SELECTION_REJECTED'});
 assert.equal(ledger.ingest({...source('https://example.org/three'),title:'Troisième annonce'}).state,'pending');
 assert.equal(ledger.archiveTerminal().archived,0);advance(31);
 assert.equal(ledger.archiveTerminal().archived,2);
 const restored=ledger.get(first.id);assert.equal(restored.item.excerpt,source().excerpt);
 assert.equal(restored.brief.message,'Synthèse autonome.');assert.equal(restored.receipt.messageId,'telegram:one');
 assert.equal(ledger.ingest(source()).state,'delivered');assert.equal(ledger.ingest(source('https://example.net/alias')).id,first.id);
 assert.equal(ledger.archiveTerminal().archived,0);
 const archive=path.join(dir,'archive',restored.archive.filename),bytes=readFileSync(archive);
 writeFileSync(archive,Buffer.from('damaged'));
 assert.throws(()=>ledger.get(first.id),{code:'ALERT_ARCHIVE_UNAVAILABLE'});writeFileSync(archive,bytes);
 assert.equal(ledger.get(second.id).state,'skipped');
});
test('uncertain sends, active work and reviews are retained intact instead of archived or reopened',t=>{
 const {ledger,advance}=fixture(t),first=ledger.ingest(source()),job=ledger.claim();
 ledger.finish(job.id,job.owner,{state:'ready',reason:'BRIEF_VERIFIED',brief:{message:'Synthèse.'}});
 const send=ledger.beginDelivery(first.id);ledger.finishDelivery(first.id,send.owner,null);
 const second=ledger.ingest({...source('https://example.org/two'),title:'Deuxième annonce'}),review=ledger.claim();
 ledger.finish(review.id,review.owner,{state:'review',reason:'SELECTION_UNCERTAIN'});advance(60);
 assert.equal(ledger.archiveTerminal().archived,0);assert.equal(ledger.get(first.id).state,'delivery_unknown');
 assert.equal(ledger.get(second.id).state,'review');assert.equal(ledger.claim(),null);
 assert.throws(()=>ledger.ingest({...source('https://example.org/third'),title:'Troisième annonce'}),{code:'ALERT_QUEUE_FULL'});
});
test('a feed-only alias acquiring already known page evidence never opens a second selection',t=>{
 const {ledger}=fixture(t),first=ledger.ingest(source()),aliasSource=source('https://example.net/repost');
 const alias=ledger.ingest({...aliasSource,sourceStatus:'title-only',excerpt:''});
 const result=ledger.ingest(aliasSource);assert.equal(result.id,first.id);assert.equal(result.duplicate,true);
 assert.equal(ledger.get(alias.id).reason,'DUPLICATE_EVIDENCE');assert.equal(ledger.claim().id,first.id);assert.equal(ledger.claim(),null);
});
test('archival can run in successive batches and opening another connection preserves every tombstone',t=>{
 const {ledger,advance,dir}=fixture(t);
 for(const title of ['one','two']){ledger.ingest({...source('https://example.org/'+title),title});const job=ledger.claim();ledger.finish(job.id,job.owner,{state:'skipped',reason:'SELECTION_REJECTED'});}
 advance(31);assert.equal(ledger.archiveTerminal({limit:1}).archived,1);assert.equal(ledger.archiveTerminal({limit:1}).archived,1);
 const other=openLedger(path.join(dir,'alerts.sqlite'));try{
  assert.equal(other.ingest({...source('https://example.net/one'),title:'one'}).state,'skipped');
  assert.equal(other.list('skipped').length,2);assert.equal(other.archiveTerminal().archived,0);
 }finally{other.close();}
});
