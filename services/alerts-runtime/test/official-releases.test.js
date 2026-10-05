import test from 'node:test';
import assert from 'node:assert/strict';
import {collectOfficialRelease} from '../src/official-releases.js';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {openLedger} from '../src/ledger.js';
const release={tag_name:'v2026.9.8',published_at:'2026-10-03T03:21:47Z',html_url:'https://github.com/openclaw/openclaw/releases/tag/v2026.9.8'};
const now=new Date('2026-10-05T12:00:00Z');
test('official release reads its tagged changelog once, preserving real publication and evidence',async()=>{
 let calls=0,seen=false;const ledger={get:()=>seen?{item:{sourceStatus:'read'}}:null,ingest:item=>{seen=true;assert.equal(item.publishedAt,release.published_at.replace('Z','.000Z'));assert.match(item.excerpt,/preserve plugin settings/);assert.doesNotMatch(item.excerpt,/Thanks|#123/);return {id:'proof',duplicate:false};}};
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
 const result=await collectOfficialRelease({ledger:{get:()=>null,ingest:item=>{assert.equal(item.sourceStatus,'unavailable');return {id:'unread',duplicate:false};}},now,
  fetchImpl:async u=>({ok:true,text:async()=>u.includes('api.github.com')?JSON.stringify([release]):'## Another version\n'})});
 assert.equal(result.read,0);assert.equal(result.errors[0].code,'OFFICIAL_RELEASE_CONTENT_MISMATCH');
});
test('an existing latest version does not hide fresh backports, and one missing changelog does not abort the rest',async t=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'ivan-release-regression-')),ledger=openLedger(path.join(dir,'alerts.sqlite'));
 t.after(()=>{ledger.close();rmSync(dir,{recursive:true,force:true});});
 const older=tag=>({...release,tag_name:tag,html_url:release.html_url.replace(release.tag_name,tag)});
 const second=older('v2026.8.35'),third=older('v2026.8.34');
 const calls=[];let missing=true;
 const fetchImpl=async url=>{calls.push(url);return {ok:!missing||!url.includes('/v2026.8.35/'),text:async()=>
  url.includes('api.github.com')?JSON.stringify([release,second,third]):'## '+url.split('/CHANGELOG/')[1].replace('.md','')+'\n\n### Highlights\n- Recover a failed service update while preserving the existing settings and data.\n\n### Fixes\n'};};
 const first=await collectOfficialRelease({ledger,now,fetchImpl});
 assert.equal(first.read,2);assert.equal(first.unavailable,1);assert.equal(first.errors.length,1);
 assert.equal(ledger.list('pending').length,3);
 assert.equal(ledger.list('pending').filter(row=>row.item.sourceStatus==='unavailable').length,1);
 calls.length=0;missing=false;
 const retry=await collectOfficialRelease({ledger,now,fetchImpl});
 assert.equal(retry.duplicates,2);assert.equal(retry.evidenceUpdated,1);assert.equal(retry.read,1);
 assert.equal(calls.length,2);assert.equal(ledger.list('pending').filter(row=>row.item.sourceStatus==='read').length,3);
});
test('release date and tag validation are per candidate, never a reason to skip a valid following release',async()=>{
 let reads=0;const result=await collectOfficialRelease({now,ledger:{get:()=>null,ingest:()=>{reads++;return {id:'valid',duplicate:false};}},
  fetchImpl:async url=>({ok:true,text:async()=>url.includes('api.github.com')?JSON.stringify([
    {...release,published_at:'2026-09-01T00:00:00Z'}, {...release,tag_name:'v2026.9.8-preview',prerelease:true},release]):
    '## 2026.9.8\n\n### Highlights\n- Preserve all settings and recover the gateway after an interrupted update.\n'})});
 assert.equal(reads,1);assert.equal(result.read,1);
});
