// Search is discovery only. Read the author's actual post from HN's official
// API before enqueuing anything. No contacts, scores, model calls or payments.
import {createHash} from 'node:crypto';
const sha=s=>createHash('sha256').update(s).digest('hex');
const queries=['alternative','workflow','software','manual'],revision='hn-demand-v1';
function plain(html){
 return html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]*>/g,' ')
  .replace(/&#(x[0-9a-f]+|\d+);/gi,(_,v)=>{const n=v[0].toLowerCase()==='x'?parseInt(v.slice(1),16):Number(v);return n>0&&n<=0x10ffff?String.fromCodePoint(n):' ';})
  .replace(/&(amp|lt|gt|quot|apos|nbsp);/g,(_,v)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '}[v]))
  .replace(/\s+/g,' ').trim();
}
async function json(url,fetchImpl){
 const response=await fetchImpl(url,{redirect:'error',signal:AbortSignal.timeout(8000),headers:{accept:'application/json','user-agent':'Ivan-AI-OS-public-demand/1'}});
 if(!response.ok)throw Error('PUBLIC_DEMAND_UNAVAILABLE');
 // Stream a byte ceiling; Content-Length and an already allocated huge string
 // are not a bound on a public server's response.
 const reader=response.body.getReader(),chunks=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>400000)throw Error('PUBLIC_DEMAND_TOO_LARGE');chunks.push(value);}}
 finally{await reader.cancel().catch(()=>{});}
 const body=Buffer.concat(chunks).toString('utf8');return {value:JSON.parse(body),body,size};
}
const demand=text=>/\b(?:looking for|need|recommend|alternative|switch|manual\w*|hours|expensive|frustrat\w*|struggl\w*|pain|cannot|missing|wish|paying|pay for)\b/i.test(text)&&
 /\b(?:business(?:es)?|customers?|clients?|invoic\w*|accounting|workflow|spreadsheet|appointment|booking|payroll|support|CRM|inventory|teams?|billing|sales|marketing|software|tools?|email|workspace)\b/i.test(text);
export async function collectPublicDemand({ledger,fetchImpl=fetch,now=new Date()}={}){
 const result={ingested:0,duplicates:0,evidenceUpdated:0,primaryReads:0,filtered:0,deferred:0,sourceReceipts:[],errors:[]};
 const at=now.getTime(),cut=Math.floor(at/1000)-72*3600,ids=new Map();
 for(const query of queries){
  const url=new URL('https://hn.algolia.com/api/v1/search_by_date');
  url.search=new URLSearchParams({query,tags:'ask_hn',numericFilters:`created_at_i>${cut}`,hitsPerPage:'8'});
  try{
   const {value}=await json(url.href,fetchImpl);if(!Array.isArray(value.hits)||value.hits.length>100)throw Error();
   for(const hit of value.hits.slice(0,8))if(/^\d{1,12}$/.test(hit.objectID??'')&&Number.isSafeInteger(hit.created_at_i)&&hit.created_at_i>=cut&&hit.created_at_i<=at/1000+300){
    // Search text may prune discovery, never supply a quoted fact. The official
    // post is independently checked below, including after a misleading index.
    if(typeof hit.story_text==='string'&&!demand(plain(hit.story_text))){result.filtered++;continue;}
    ids.set(hit.objectID,hit.created_at_i);
   }
  }catch{result.errors.push({code:'PUBLIC_DEMAND_SEARCH_UNAVAILABLE',feedId:sha(url.href).slice(0,16)});}
 }
 for(const [id] of [...ids].sort((a,b)=>b[1]-a[1])){
  const url=`https://news.ycombinator.com/item?id=${id}`,prior=ledger.peekSource(sha(url));
  if(prior&&(prior.sourceStatus==='read'||!['pending','review'].includes(prior.state))){result.duplicates++;continue;}
  if(ledger.discoveryDeferred(sha(url),revision,at)){result.deferred++;continue;}
  if(result.primaryReads>=4)break;
  result.primaryReads++;
  try{
   const api=`https://hacker-news.firebaseio.com/v0/item/${id}.json`,{value:p,body,size}=await json(api,fetchImpl);
   if(!p||String(p.id)!==id||p.type!=='story'||p.dead||p.deleted||!Number.isSafeInteger(p.time)||p.time<cut||p.time>at/1000+300||
      typeof p.text!=='string'||typeof p.title!=='string'){
    ledger.recordDiscoveryCheck(sha(url),{revision,code:'PUBLIC_DEMAND_NOT_ELIGIBLE',at,retryAt:at+86400000});result.filtered++;continue;}
   const text=plain(p.text),title=plain(p.title).slice(0,200);
   if(text.length<80||!demand(text)||/\b(?:who is hiring|job market|looking for (?:a )?job|career|hiring thread)\b/i.test(title)){
    ledger.recordDiscoveryCheck(sha(url),{revision,code:'PUBLIC_DEMAND_NOT_ELIGIBLE',at,retryAt:at+86400000});result.filtered++;continue;}
   const item={producer:'hn-demand',scope:'public',topic:'business',url,title,
    publishedAt:new Date(p.time*1000).toISOString(),observedAt:now.toISOString(),readAt:now.toISOString(),sourceStatus:'read',
    excerpt:text.slice(0,1200),textChars:text.length,excerptMode:'head',excerptTruncated:text.length>1200};
   const row=ledger.ingest(item);if(row.evidenceUpdated)result.evidenceUpdated++;else if(row.duplicate)result.duplicates++;else result.ingested++;
   result.sourceReceipts.push({url,api,extractor:'hn-official-api-v1',readAt:item.readAt,publishedDay:item.publishedAt.slice(0,10),bodyBytes:size,responseSha256:sha(body)});
  }catch{ledger.recordDiscoveryCheck(sha(url),{revision,code:'PUBLIC_DEMAND_CONTENT_UNAVAILABLE',at,retryAt:at+3600000});
   result.errors.push({code:'PUBLIC_DEMAND_CONTENT_UNAVAILABLE',feedId:sha(url).slice(0,16)});}
 }
 return result;
}
