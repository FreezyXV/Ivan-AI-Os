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
 const result={ingested:0,read:0,unavailable:0,duplicates:0,evidenceUpdated:0,sourceReceipts:[],errors:[]};
 for(const release of releases.slice(0,3)){
  if(!release||release.draft||release.prerelease||!/^v\d{4}\.\d{1,2}\.\d{1,2}$/.test(release.tag_name))continue;
  const date=Date.parse(release.published_at),age=now.getTime()-date;
  if(!Number.isFinite(date)||age< -300000||age>72*3600000)continue;
  const url='https://github.com/openclaw/openclaw/releases/tag/'+release.tag_name;
  if(release.html_url!==url){result.errors.push({tag:release.tag_name,code:'OFFICIAL_RELEASE_INVALID'});continue;}
  const prior=ledger.get(sha(url));
  // Already-read records are final. Unread evidence can be acquired later,
  // under the ledger's lease/delivery rules, without repeating paid selection.
  if(prior?.item?.sourceStatus==='read'){result.duplicates++;continue;}
  const version=release.tag_name.slice(1),contentUrl=`https://raw.githubusercontent.com/openclaw/openclaw/${release.tag_name}/CHANGELOG/${version}.md`;
  const readAt=now.toISOString(),item={producer:'openclaw-release',scope:'public',topic:'system',url,
   title:'OpenClaw '+version+' — correctifs officiels',publishedAt:new Date(date).toISOString(),observedAt:readAt};
  let body,excerpt;
  try{
   body=await get(contentUrl,fetchImpl);
   if(!body.startsWith('## '+version+'\n'))throw Error('OFFICIAL_RELEASE_CONTENT_MISMATCH');
   const highlight=body.split('### Highlights')[1]?.split(/\n### /)[0];
   if(!highlight)throw Error('OFFICIAL_RELEASE_CONTENT_UNAVAILABLE');
 // Remove credits/PR identifiers, not claims. The changelog is pinned to its
 // own tag; a redirect or main-branch link is never followed as release proof.
   excerpt=highlight.split('\n').filter(l=>l.startsWith('- ')).map(l=>l.replace(/ \(#\d[\d, #]*\).*$/,'').replaceAll('**','').slice(2)).join(' ').slice(0,1200);
   if(excerpt.length<40)throw Error('OFFICIAL_RELEASE_CONTENT_UNAVAILABLE');
  }catch(error){
   // One 404/changed format must not conceal another stable release. Preserve
   // the failed source, without claiming its content was read or asking Jev.
   ledger.ingest({...item,sourceStatus:'unavailable',excerpt:''});result.unavailable++;
   result.errors.push({tag:release.tag_name,code:/^OFFICIAL_RELEASE_[A-Z_]+$/.test(error.message??'')?error.message:'OFFICIAL_RELEASE_UNAVAILABLE'});
   continue;
  }
  // Ledger failures abort the cycle; they are never mislabeled as a 404.
  const row=ledger.ingest({...item,readAt,sourceStatus:'read',excerpt,textChars:body.length,excerptMode:'head',excerptTruncated:true});
  result.ingested+=row.duplicate?0:1;result.read++;if(row.evidenceUpdated)result.evidenceUpdated++;
  result.sourceReceipts.push({id:row.id,url,contentUrl,readAt,publishedAt:release.published_at,
   responseSha256:sha(body),bodyBytes:Buffer.byteLength(body),extractor:'official-openclaw-highlights-v2'});
 }
 if(result.sourceReceipts.length===1){result.id=result.sourceReceipts[0].id;result.sourceReceipt=result.sourceReceipts[0];}
 if(result.duplicates>0&&result.read===0&&result.unavailable===0)result.duplicate=true;
 if(!result.read&&!result.unavailable&&!result.duplicates)result.reason='NO_FRESH_RELEASE';
 return result;
}
