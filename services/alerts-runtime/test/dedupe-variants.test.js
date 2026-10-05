import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,chmodSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {openLedger} from '../src/ledger.js';

// K07-2 (Claude, @23cf0be): the same read page from two producers must stay one item
// even when feed titles differ (typographic apostrophe, " | Site" suffix) or the topic differs.
const body='Here is the same article body read by both producers. '.repeat(5);
const base={scope:'public',publishedAt:'2026-10-03T23:34:02.000Z',observedAt:'2026-10-05T11:00:00.000Z',
  readAt:'2026-10-05T11:00:00.000Z',sourceStatus:'read',excerpt:body};
function ledger(t){const dir=mkdtempSync(path.join(tmpdir(),'dedupe-'));chmodSync(dir,0o700);t.after(()=>rmSync(dir,{recursive:true,force:true}));
  return openLedger(path.join(dir,'q.sqlite'),{now:()=>Date.parse('2026-10-05T12:00:00Z')});}

test('read-evidence dedupe ignores title punctuation, site suffix and producer topic',t=>{
  const L=ledger(t);
  const a=L.ingest({...base,producer:'sentinelle',topic:'system',url:'https://simonwillison.net/2026/Oct/3/x/',title:"We're going to need default hard budget caps"});
  for(const [url,title,topic] of [['https://simonwillison.net/2026/Oct/3/x?s=1',"We’re going to need default hard budget caps",'system'],
    ['https://simonwillison.net/2026/Oct/3/x?s=2',"We're going to need default hard budget caps | Simon Willison",'system'],
    ['https://simonwillison.net/2026/Oct/3/x?s=3',"We're going to need default hard budget caps",'engineering']]){
    const r=L.ingest({...base,producer:'secretaire',topic,url,title});
    assert.equal(r.id,a.id,title+' / '+topic);assert.equal(r.duplicate,true);
  }
  assert.equal(L.counts().pending,1);
});

test('short or different evidence is never merged by the relaxed key',t=>{
  const L=ledger(t);
  const short={...base,excerpt:'Subscribe to our newsletter today.'};
  L.ingest({...short,producer:'sentinelle',topic:'system',url:'https://example.org/a',title:'A'});
  const b=L.ingest({...short,producer:'secretaire',topic:'system',url:'https://example.org/b',title:'B'});
  assert.equal(b.duplicate,false,'generic short text is not proof of the same article');
  const c=L.ingest({...base,excerpt:body+' Extra.',producer:'secretaire',topic:'system',url:'https://simonwillison.net/other',title:'Other'});
  assert.equal(c.duplicate,false);
  const d=L.ingest({...base,producer:'secretaire',topic:'system',url:'https://other.example/x',title:"We're going to need default hard budget caps"});
  L.ingest({...base,producer:'sentinelle',topic:'system',url:'https://simonwillison.net/y',title:'Y'});
  assert.equal(d.duplicate,false,'same text on another host is not merged');
});
