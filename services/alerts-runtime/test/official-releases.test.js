import test from 'node:test';
import assert from 'node:assert/strict';
import {collectOfficialRelease} from '../src/official-releases.js';
const release={tag_name:'v2026.9.8',published_at:'2026-10-03T03:21:47Z',html_url:'https://github.com/openclaw/openclaw/releases/tag/v2026.9.8'};
const now=new Date('2026-10-05T12:00:00Z');
test('official release reads its tagged changelog once, preserving real publication and evidence',async()=>{
 let calls=0,seen=false;const ledger={get:()=>seen,ingest:item=>{seen=true;assert.equal(item.publishedAt,release.published_at.replace('Z','.000Z'));assert.match(item.excerpt,/preserve plugin settings/);assert.doesNotMatch(item.excerpt,/Thanks|#123/);return {id:'proof',duplicate:false};}};
 const fetchImpl=async(url,options)=>{calls++;assert.equal(options.redirect,'error');return {ok:true,text:async()=>url.includes('api.github.com')?JSON.stringify([release]):'## 2026.9.8\n\n### Highlights\n- **Safer updates:** preserve plugin settings and recover SQLite contention. (#123) Thanks @author.\n\n### Fixes\n'};};
 const v=await collectOfficialRelease({ledger,now,fetchImpl});assert.equal(v.ingested,1);assert.match(v.sourceReceipt.contentUrl,/\/v2026.9.8\/CHANGELOG\//);
 assert.equal((await collectOfficialRelease({ledger,now,fetchImpl})).duplicate,true);assert.equal(calls,3);
});
test('old, future and mismatched release evidence never enters the queue',async()=>{
 const ledger={get:()=>null,ingest:()=>assert.fail()};
 for(const date of ['2026-09-01T00:00:00Z','2026-10-06T00:00:00Z']){
  const fetchImpl=async()=>({ok:true,text:async()=>JSON.stringify([{...release,published_at:date}])});
  assert.equal((await collectOfficialRelease({ledger,now,fetchImpl})).ingested,0);
 }
 await assert.rejects(collectOfficialRelease({ledger,now,fetchImpl:async u=>({ok:true,text:async()=>u.includes('api.github.com')?JSON.stringify([release]):'## Another version\n'})}),/CONTENT_MISMATCH/);
});
