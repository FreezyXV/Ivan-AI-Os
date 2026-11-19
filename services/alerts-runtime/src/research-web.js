// Discovery is never evidence. Only a separately fetched, bounded public page
// may enter a research bundle; all page contents remain untrusted data.
import {request as httpsRequest} from 'node:https';
import {lookup as dnsLookup} from 'node:dns/promises';
import {isIP} from 'node:net';
import {createHash} from 'node:crypto';

const fail=code=>{throw Object.assign(new Error(code),{code});};
const sha=value=>createHash('sha256').update(value).digest('hex');
function publicAddress(address){
 const version=isIP(address);
 if(version===4){
  const [a,b,c]=address.split('.').map(Number);
  return !(a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||
   a===100&&b>=64&&b<=127||a===192&&(b===168||b===0&&(c===0||c===2)||b===88&&c===99)||
   a===198&&(b===18||b===19||b===51&&c===100)||a===203&&b===0&&c===113);
 }
 if(version===6){
  // Global unicast only. Reject scoped, mapped, local and transition ranges;
  // in particular 6to4 can otherwise embed an internal IPv4 destination.
  const host=new URL(`https://[${address}]/`).hostname.slice(1,-1).toLowerCase();
  if(host.startsWith('64:ff9b::')){
   // RFC 6052's well-known DNS64 prefix is returned by this Mac's resolver.
   // It is usable only when the embedded destination passes the IPv4 rules.
   const [left,right='']=host.split('::'),a=left.split(':'),b=right?right.split(':'):[];
   const words=[...a,...Array(8-a.length-b.length).fill('0'),...b].map(value=>parseInt(value,16));
   return words.slice(2,6).every(value=>value===0)&&publicAddress(`${words[6]>>8}.${words[6]&255}.${words[7]>>8}.${words[7]&255}`);
  }
  const [first,second='0']=host.split(':');const a=parseInt(first,16),b=parseInt(second||'0',16);
  return a>=0x2000&&a<=0x3fff&&a!==0x2002&&!(a===0x2001&&(b<0x200||b===0xdb8))&&
   !(a===0x3fff&&b<0x1000);
 }
 return false;
}
function publicUrl(value){
 let url;try{url=new URL(value);}catch{fail('PUBLIC_RESEARCH_URL_REFUSED');}
 const host=url.hostname.replace(/^\[|\]$/g,'').toLowerCase();
 if(url.protocol!=='https:'||url.username||url.password||url.port||!host||host.includes('%')||
   (isIP(host)?!publicAddress(host):!host.includes('.')||/(?:^|\.)(?:localhost|local|internal|lan|home|test|invalid|example)\.?$/.test(host)))fail('PUBLIC_RESEARCH_URL_REFUSED');
 url.hash='';return url;
}
function cancelled(signal){
 const code=signal.reason?.code==='PUBLIC_RESEARCH_TIMEOUT'?'PUBLIC_RESEARCH_TIMEOUT':'PUBLIC_RESEARCH_ABORTED';
 return Object.assign(new Error(code),{code});
}

export async function fetchPublic(value,{maxBytes=800000,timeoutMs=10000,maxRedirects=0,signal,lookupImpl=dnsLookup,requestImpl=httpsRequest}={}){
 if(!Number.isSafeInteger(maxRedirects)||maxRedirects<0||maxRedirects>2||!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>60000)fail('PUBLIC_RESEARCH_INPUT_INVALID');
 const controller=new AbortController(),abort=()=>controller.abort(signal?.reason);
 if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});
 // Every hop shares this controller/deadline. Per-connection timers below are
 // only additional bounds; a redirect never receives a fresh total allowance.
 const timer=setTimeout(()=>controller.abort(Object.assign(new Error('PUBLIC_RESEARCH_TIMEOUT'),{code:'PUBLIC_RESEARCH_TIMEOUT'})),timeoutMs);
 let target=value;
 try{
  for(let hop=0;;hop++){
   try{return await fetchOnce(target,{maxBytes,timeoutMs,signal:controller.signal,lookupImpl,requestImpl,allowRedirect:hop<maxRedirects});}
   catch(error){
    if(error?.code!=='PUBLIC_RESEARCH_REDIRECT_REFUSED'||typeof error.location!=='string')throw error;
    try{target=new URL(error.location,publicUrl(target)).href;}catch{fail('PUBLIC_RESEARCH_URL_REFUSED');}
   }
  }
 }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
async function fetchOnce(value,{maxBytes,timeoutMs,signal,lookupImpl,requestImpl,allowRedirect}){
 const url=publicUrl(value),host=url.hostname.replace(/^\[|\]$/g,'');
 if(!Number.isSafeInteger(maxBytes)||maxBytes<1||maxBytes>2000000||!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>60000)fail('PUBLIC_RESEARCH_INPUT_INVALID');
 const controller=new AbortController(),abort=()=>controller.abort(signal?.reason);
 if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});
 const timer=setTimeout(()=>controller.abort(Object.assign(new Error('PUBLIC_RESEARCH_TIMEOUT'),{code:'PUBLIC_RESEARCH_TIMEOUT'})),timeoutMs);
 let onAbort;const stopped=new Promise((_,reject)=>{onAbort=()=>reject(cancelled(controller.signal));controller.signal.addEventListener('abort',onAbort,{once:true});if(controller.signal.aborted)onAbort();});
 try{
  const addresses=await Promise.race([isIP(host)?Promise.resolve([{address:host,family:isIP(host)}]):Promise.resolve().then(()=>lookupImpl(host,{all:true,verbatim:true})),stopped]);
  if(!Array.isArray(addresses)||!addresses.length||addresses.length>32||addresses.some(row=>!row||!publicAddress(row.address)||isIP(row.address)!==Number(row.family)))fail('PUBLIC_RESEARCH_DNS_REFUSED');
  const selected=addresses.find(row=>Number(row.family)===4)??addresses[0];
  const pinned={address:selected.address,family:Number(selected.family)};
  let contentType='';
  const body=await Promise.race([new Promise((resolve,reject)=>{
   let req,response,finished=false;const chunks=[];let size=0;
   const stop=error=>{if(finished)return;finished=true;controller.signal.removeEventListener('abort',onStop);response?.destroy();if(error){req?.destroy(error);reject(error);}else resolve(Buffer.concat(chunks));};
   const onStop=()=>stop(cancelled(controller.signal));controller.signal.addEventListener('abort',onStop,{once:true});
   try{
    if(controller.signal.aborted){onStop();return;}
    req=requestImpl(url,{method:'GET',agent:false,servername:isIP(host)?undefined:host,
     headers:{accept:'text/html, text/plain, application/json, application/xml;q=0.8','accept-encoding':'identity','user-agent':'Ivan-AI-OS-public-research/1'},
     // TLS still checks the original hostname. The connection never resolves
     // it again, so a second DNS answer cannot rebind to localhost.
     lookup:(name,options,callback)=>{
      if(typeof options==='function'){callback=options;options={};}
      if(name!==host){callback(Object.assign(new Error('PUBLIC_RESEARCH_DNS_REFUSED'),{code:'PUBLIC_RESEARCH_DNS_REFUSED'}));return;}
      if(options?.all)callback(null,[pinned]);else callback(null,pinned.address,pinned.family);
     }
    },incoming=>{
     response=incoming;response.on('error',error=>stop(error));
     const status=Number(response.statusCode),headers=response.headers??{};contentType=String(headers['content-type']??'application/octet-stream').slice(0,200);
     if(status>=300&&status<400){
      const redirect=Object.assign(new Error('PUBLIC_RESEARCH_REDIRECT_REFUSED'),{code:'PUBLIC_RESEARCH_REDIRECT_REFUSED'});
      if(allowRedirect&&[301,302,303,307,308].includes(status)&&typeof headers.location==='string'&&headers.location.length>0&&headers.location.length<=4096)redirect.location=headers.location;
      stop(redirect);return;
     }
     if(!Number.isInteger(status)||status<200||status>=300){stop(Object.assign(new Error('PUBLIC_RESEARCH_UNAVAILABLE'),{code:'PUBLIC_RESEARCH_UNAVAILABLE'}));return;}
     if(headers['content-encoding']&&!/^identity$/i.test(String(headers['content-encoding']))){stop(Object.assign(new Error('PUBLIC_RESEARCH_ENCODING_REFUSED'),{code:'PUBLIC_RESEARCH_ENCODING_REFUSED'}));return;}
     const length=headers['content-length'];if(length!==undefined&&(!/^\d+$/.test(String(length))||Number(length)>maxBytes)){stop(Object.assign(new Error('PUBLIC_RESEARCH_TOO_LARGE'),{code:'PUBLIC_RESEARCH_TOO_LARGE'}));return;}
     response.on('data',chunk=>{if(finished)return;const bytes=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);size+=bytes.length;if(size>maxBytes){stop(Object.assign(new Error('PUBLIC_RESEARCH_TOO_LARGE'),{code:'PUBLIC_RESEARCH_TOO_LARGE'}));return;}chunks.push(bytes);});
     response.on('end',()=>stop());response.on('aborted',()=>stop(Object.assign(new Error('PUBLIC_RESEARCH_UNAVAILABLE'),{code:'PUBLIC_RESEARCH_UNAVAILABLE'})));
     response.on('close',()=>{if(!response.readableEnded)stop(Object.assign(new Error('PUBLIC_RESEARCH_UNAVAILABLE'),{code:'PUBLIC_RESEARCH_UNAVAILABLE'}));});
    });
    req.on('error',error=>stop(error));req.end();
   }catch(error){stop(error);}
  }),stopped]);
  return {url:url.href,text:body.toString('utf8'),contentType,sha256:sha(body),readAt:new Date().toISOString()};
 }catch(error){if(/^PUBLIC_RESEARCH_[A-Z_]+$/.test(error?.code??''))throw error;fail('PUBLIC_RESEARCH_UNAVAILABLE');}
 finally{clearTimeout(timer);controller.signal.removeEventListener('abort',onAbort);signal?.removeEventListener('abort',abort);}
}

function entities(text){
 return String(text).replace(/&#(x[0-9a-f]+|\d+);/gi,(_,value)=>{const code=value[0].toLowerCase()==='x'?parseInt(value.slice(1),16):Number(value);return code>0&&code<=0x10ffff&&!(code>=0xd800&&code<=0xdfff)?String.fromCodePoint(code):' ';})
  .replace(/&(amp|lt|gt|quot|apos|nbsp|ndash|mdash|hellip|rsquo|lsquo|rdquo|ldquo|euro);/gi,(_,value)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',ndash:'–',mdash:'—',hellip:'…',rsquo:'’',lsquo:'‘',rdquo:'”',ldquo:'“',euro:'€'}[value.toLowerCase()]));
}
const plain=html=>entities(html.replace(/<[^>]*>/g,' ')).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,' ').replace(/\s+/g,' ').trim();
function attributes(tag){const values={};for(const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g))values[match[1].toLowerCase()]=entities(match[2]??match[3]??match[4]??'');return values;}
function challenge(html){
 const title=plain(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]??'');
 return /(?:just a moment|attention required|access denied|security check|captcha|verify (?:you are|you're) human|robot check|are you a robot)/i.test(title)||
  /<(?:form|div)\b[^>]*(?:id|class)=["'][^"']*(?:challenge-form|anomaly-modal|cf-challenge|g-recaptcha|h-captcha)[^"']*["']/i.test(html);
}
function published(html){
 const dates=[];
 for(const tag of html.matchAll(/<meta\b[^>]*>/gi)){const a=attributes(tag[0]);if(/^(?:article:published_time|datepublished|pubdate|dc\.date|dcterms\.created)$/i.test(a.property??a.name??a.itemprop??''))dates.push(a.content);}
 for(const tag of html.matchAll(/<time\b[^>]*>/gi)){const a=attributes(tag[0]);if(/datePublished/i.test(a.itemprop??''))dates.push(a.datetime);}
 let scripts=0;
 for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)){
  if(++scripts>20)break;if(!/^application\/ld\+json$/i.test(attributes(match[1]).type??'')||match[2].length>200000)continue;
  try{
   let visited=0;const visit=(node,depth=0)=>{if(++visited>100||depth>5||!node||typeof node!=='object')return;if(Array.isArray(node)){for(const child of node)visit(child,depth+1);return;}
    if([node['@type']].flat().some(type=>/^(?:Article|NewsArticle|BlogPosting|Report|TechArticle)$/i.test(type??''))&&typeof node.datePublished==='string')dates.push(node.datePublished);
    if(node['@graph'])visit(node['@graph'],depth+1);
   };visit(JSON.parse(match[2]));
  }catch{/* Malformed structured data supplies no publication date. */}
 }
 for(const date of dates){
  if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}(?:[Tt ][\d:.]+(?:[Zz]|[+-]\d{2}:?\d{2}))?$/.test(date))continue;
  const [year,month,day]=date.slice(0,10).split('-').map(Number),calendar=new Date(Date.UTC(year,month-1,day));
  if(calendar.toISOString().slice(0,10)!==date.slice(0,10))continue;
  const stamp=new Date(date);if(Number.isFinite(stamp.getTime()))return stamp.toISOString();
 }
 return null;
}
export function extractPublicPage(response,{maxTextChars=24000}={}){
 if(!Number.isSafeInteger(maxTextChars)||maxTextChars<150||maxTextChars>200000)fail('PUBLIC_RESEARCH_INPUT_INVALID');
 if(!response||typeof response.text!=='string'||response.text.length>2000000)fail('PUBLIC_RESEARCH_CONTENT_INVALID');
 const url=publicUrl(response.url).href,html=response.text;
 if(challenge(html))fail('PUBLIC_RESEARCH_CHALLENGE');
 const isHtml=/html|xhtml/i.test(response.contentType??'text/html');
 if(!isHtml&&!/^text\/plain\b/i.test(response.contentType??''))fail('PUBLIC_RESEARCH_CONTENT_UNSUPPORTED');
 let title=plain(isHtml?html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]??html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]??'':html.split('\n')[0]).slice(0,240);
 let article=html;
 if(isHtml){
  article=article.replace(/<!--[\s\S]*?-->/g,' ').replace(/<(script|style|noscript|template|svg|iframe)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,' ');
  article=article.match(/<article\b[^>]*>([\s\S]*?)<\/article\s*>/i)?.[1]??article.match(/<main\b[^>]*>([\s\S]*?)<\/main\s*>/i)?.[1]??article.match(/<body\b[^>]*>([\s\S]*?)<\/body\s*>/i)?.[1]??article;
  article=article.replace(/<(nav|header|footer|aside|form|button)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,' ').replace(/<head\b[^>]*>[\s\S]*?<\/head\s*>/gi,' ');
 }
 const text=(isHtml?plain(article):article.replace(/\s+/g,' ').trim()).slice(0,maxTextChars).trim();
 if(text.length<150||text===title)fail('PUBLIC_RESEARCH_CONTENT_INSUFFICIENT');
 if(!title)title=new URL(url).hostname;
 return {url,title,text,publishedAt:isHtml?published(html):null,readAt:response.readAt??new Date().toISOString(),sha256:response.sha256??sha(html),kind:'page'};
}

export async function searchPublic(query,{fetchImpl=fetchPublic,limit=6}={}){
 if(typeof query!=='string'||!query.trim()||query.length>500||!Number.isSafeInteger(limit)||limit<1||limit>10)return {results:[],error_code:'PUBLIC_RESEARCH_SEARCH_INPUT_INVALID'};
 try{
  const url=new URL('https://lite.duckduckgo.com/lite/');url.searchParams.set('q',query.trim());
  const response=await fetchImpl(url.href);const html=response?.text;
  if(typeof html!=='string'||html.length>2000000)return {results:[],error_code:'PUBLIC_RESEARCH_SEARCH_UNAVAILABLE'};
  if(challenge(html))return {results:[],error_code:'PUBLIC_RESEARCH_SEARCH_CHALLENGE'};
  const results=[],seen=new Set();
  for(const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)){
   const a=attributes(match[1]);if(!(a.class??'').split(/\s+/).includes('result-link')||!a.href)continue;
   try{
    let target=new URL(a.href,'https://lite.duckduckgo.com');
    if(/^(?:www\.)?duckduckgo\.com$/i.test(target.hostname)&&target.pathname==='/l/')target=new URL(target.searchParams.get('uddg'));
    const candidate=publicUrl(target.href).href,title=plain(match[2]).slice(0,240);
    if(!title||seen.has(candidate)||/(?:^|\.)duckduckgo\.com$/i.test(new URL(candidate).hostname))continue;
    seen.add(candidate);results.push({url:candidate,title});if(results.length===limit)break;
   }catch{/* One malformed search link cannot authorize or block other sources. */}
  }
  return results.length?{results}:{results:[],error_code:'PUBLIC_RESEARCH_SEARCH_EMPTY'};
 }catch{return {results:[],error_code:'PUBLIC_RESEARCH_SEARCH_UNAVAILABLE'};}
}
