import {createHash} from 'node:crypto';
const api='https://api.github.com/repos/openclaw/openclaw/releases?per_page=3';
const sha=value=>createHash('sha256').update(value).digest('hex');
async function get(url,fetchImpl){
 const response=await fetchImpl(url,{redirect:'error',signal:AbortSignal.timeout(12000),headers:{'user-agent':'Ivan-AI-OS-public-pilot','accept':'application/vnd.github+json,text/plain'}});
 if(!response.ok)throw Error('OFFICIAL_RELEASE_UNAVAILABLE');
 const text=await response.text();if(Buffer.byteLength(text)>400000)throw Error('OFFICIAL_RELEASE_TOO_LARGE');return text;
}
export async function collectOfficialRelease({ledger,fetchImpl=fetch,now=new Date()}={}){
 const releases=JSON.parse(await get(api,fetchImpl));if(!Array.isArray(releases))throw Error('OFFICIAL_RELEASE_INVALID');
 const release=releases.slice(0,3).find(r=>!r.draft&&!r.prerelease);
 if(!release||!/^v\d{4}\.\d{1,2}\.\d{1,2}$/.test(release.tag_name))return {ingested:0,reason:'NO_STABLE_RELEASE'};
 const date=Date.parse(release.published_at),age=now.getTime()-date;
 if(!Number.isFinite(date)||age< -300000||age>72*3600000)return {ingested:0,reason:'NO_FRESH_RELEASE'};
 const url='https://github.com/openclaw/openclaw/releases/tag/'+release.tag_name;
 if(release.html_url!==url)throw Error('OFFICIAL_RELEASE_INVALID');
 const priorId=sha(url);if(ledger.get(priorId))return {ingested:0,duplicate:true};
 const version=release.tag_name.slice(1),contentUrl=`https://raw.githubusercontent.com/openclaw/openclaw/${release.tag_name}/CHANGELOG/${version}.md`;
 const body=await get(contentUrl,fetchImpl);
 if(!body.startsWith('## '+version+'\n'))throw Error('OFFICIAL_RELEASE_CONTENT_MISMATCH');
 const highlight=body.split('### Highlights')[1]?.split(/\n### /)[0];
 if(!highlight)throw Error('OFFICIAL_RELEASE_CONTENT_UNAVAILABLE');
 // Remove credits/PR identifiers, not claims. The changelog is pinned to its
 // own tag; a redirect or main-branch link is never followed as release proof.
 const excerpt=highlight.split('\n').filter(l=>l.startsWith('- ')).map(l=>l.replace(/ \(#\d[\d, #]*\).*$/,'').replaceAll('**','').slice(2)).join(' ').slice(0,1200);
 if(excerpt.length<40)throw Error('OFFICIAL_RELEASE_CONTENT_UNAVAILABLE');
 const readAt=now.toISOString();
 const row=ledger.ingest({producer:'openclaw-release',scope:'public',topic:'system',url,title:'OpenClaw '+version+' — correctifs officiels',
  publishedAt:new Date(date).toISOString(),observedAt:readAt,readAt,sourceStatus:'read',excerpt});
 return {ingested:row.duplicate?0:1,id:row.id,sourceReceipt:{url,contentUrl,readAt,publishedAt:release.published_at,
  responseSha256:sha(body),bodyBytes:Buffer.byteLength(body),extractor:'official-openclaw-release-v1'}};
}
