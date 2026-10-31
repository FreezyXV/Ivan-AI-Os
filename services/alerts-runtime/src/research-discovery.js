import {fetchPublic,extractPublicPage,searchPublic} from './research-web.js';
import {collectFinanceResearch,discoverFinanceUniverse} from './research-finance.js';
import {researchHash,sealBundle,researchFail,researchSpans} from './research-contract.js';
const decode=s=>s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,' ').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Math.min(0x10ffff,Number(n)))).replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g,v=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '})[v]).replace(/\s+/g,' ').trim();
const field=(xml,name)=>xml.match(new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)</'+name+'>','i'))?.[1]??'';
const safeCode=e=>/^PUBLIC_RESEARCH_[A-Z_]+$/.test(e?.code??'')?e.code:'RESEARCH_SOURCE_UNAVAILABLE';
const week=date=>{const d=new Date(date);d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10);};
export async function discoverResearch({store,ledger,now=new Date(),fetchImpl=fetchPublic,financeImpl=collectFinanceResearch,universeImpl=discoverFinanceUniverse}={}){
 const result={queued:0,duplicates:0,errors:[],providers:[],nativeCalls:0};
 const add=seed=>{const r=store.enqueue(seed);result[r.added?'queued':'duplicates']++;};
 const readAt=now.toISOString();
 // These are public customer reports, not evidence of willingness to pay.
 try{
  const r=await fetchImpl('https://wordpress.org/support/plugin/woocommerce/feed/');let n=0;
  for(const entry of r.text.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)){
   const xml=entry[1],url=decode(field(xml,'link')),title=decode(field(xml,'title')).slice(0,180),body=decode(field(xml,'description')||field(xml,'content:encoded')).slice(0,6000),published=Date.parse(field(xml,'pubDate'));
   if(!url.startsWith('https://wordpress.org/support/topic/')||!Number.isFinite(published)||now-published>14*86400000||published>now.getTime()+300000||body.length<100)continue;
   add({topic:'business',category:'business',anchorUrl:url,title,text:body,readAt,publishedAt:new Date(published).toISOString(),provider:'WordPress official public support RSS'});if(++n===3)break;
  }result.providers.push({provider:'woocommerce-support',read:true,candidates:n});
 }catch(e){result.errors.push({provider:'woocommerce-support',code:safeCode(e)});}
 try{
  const url='https://api.github.com/search/issues?q=repo%3An8n-io%2Fn8n+is%3Aissue+is%3Aopen+lost&sort=updated&per_page=2';
  const response=await fetchImpl(url),v=JSON.parse(response.text);let n=0;
  if(!Array.isArray(v.items))throw Error();
  for(const issue of v.items){
   if(!/^https:\/\/github\.com\/n8n-io\/n8n\/issues\/\d+$/.test(issue.html_url??'')||typeof issue.body!=='string'||issue.body.length<100||!Number.isFinite(Date.parse(issue.created_at)))continue;
   const text=`Issue publique, créée ${issue.created_at}, dernière activité ${issue.updated_at}. Auteur pseudonyme : ${String(issue.user?.login??'inconnu').slice(0,80)}.\n${issue.body}`.slice(0,7000);
   add({topic:'engineering',category:'technical',anchorUrl:issue.html_url,title:String(issue.title).slice(0,180),text,readAt,publishedAt:new Date(issue.created_at).toISOString(),provider:'GitHub official public issue API'});n++;
  }result.providers.push({provider:'github-issues',read:true,candidates:n});
 }catch(e){result.errors.push({provider:'github-issues',code:safeCode(e)});}
 const financeKey='finance:'+now.toISOString().slice(0,10);
 if(!store.discovery(financeKey)){
  try{
   const universe=await universeImpl({now,maxAssets:3});
   const data=await financeImpl({now,maxAssets:3,assetIds:universe.assetIds});
   result.providers.push({provider:'coinpaprika-universe',universeSize:universe.universeSize,explorationOnly:true,degraded:universe.degraded});
   result.errors.push(...(universe.errors??[]).map(e=>({provider:'coinpaprika-universe',code:e.code})));
   for(const a of data.assets){
    add({topic:'finance',category:'asset',anchorUrl:`https://coinpaprika.com/coin/${a.id}/`,title:`${a.name} (${a.symbol}) — projet, prix et objections`,
     text:`Univers d'exploration, pas recommandation. Données absentes : ${a.missing.join(', ')}.`,readAt,publishedAt:a.asOf,
     sources:a.sources,asset:{id:a.id,name:a.name,symbol:a.symbol,officialWebsite:a.officialWebsite,missing:a.missing},
     calculations:Object.entries(a.calculations).map(([id,c])=>({id,...c})),revision:week(now)});
   }
   result.errors.push(...data.errors.map(e=>({provider:'coinpaprika',code:e.code})));result.providers.push({provider:'coinpaprika',read:true,candidates:data.assets.length,requests:data.requests});
   store.recordDiscovery(financeKey,{assetIds:universe.assetIds,universeSize:universe.universeSize,explorationOnly:true,degraded:universe.degraded,assets:data.assets.length,errors:data.errors});
  }catch(e){result.errors.push({provider:'coinpaprika',code:/^FINANCE_[A-Z_]+$/.test(e.message??'')?e.message:'FINANCE_UNAVAILABLE'});}
 }
 if(ledger){
  const candidates=['review','skipped','delivered','pending'].flatMap(state=>ledger.list(state,100)).filter(r=>r.item.sourceStatus==='read'&&now-Date.parse(r.item.observedAt)<7*86400000);
  // One current macro dossier can combine the observation with actual economic analysis.
  const macro=candidates.filter(r=>r.item.topic==='finance').sort((a,b)=>b.updated-a.updated)[0];
  if(macro)add({topic:'finance',category:'macro',anchorUrl:macro.item.url,title:macro.item.title,text:macro.item.excerpt,readAt:macro.item.readAt,publishedAt:macro.item.publishedAt});
  const business=candidates.filter(r=>r.item.topic==='business'&&/\b(?:cannot|can't|lost|manual|expensive|hours|frustrat|switch|customers|businesses)\b/i.test(r.item.excerpt)).slice(0,2);
  for(const {item} of business)add({topic:'business',category:'business',anchorUrl:item.url,title:item.title,text:item.excerpt,readAt:item.readAt,publishedAt:item.publishedAt});
 }
 return result;
}
function focus(text,query,max=5000){
 if(text.length<=max)return text;
 const words=query.toLowerCase().match(/[a-zà-ÿ]{4,}/g)??[],spans=researchSpans(text);
 const rank=spans.map((text,index)=>({text,index,score:words.filter(w=>text.toLowerCase().includes(w)).length}));
 const chosen=new Set([0,1,...rank.sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,6).map(p=>p.index)]);
 return spans.filter((_,i)=>chosen.has(i)).join('\n').slice(0,max);
}
const publisher=url=>new URL(url).hostname.toLowerCase().replace(/^(?:www\.|docs\.|developer\.)/,'');
export async function buildResearchBundle(seed,{fetchImpl=fetchPublic,searchImpl=searchPublic,financeImpl=collectFinanceResearch,now=new Date(),priorSources,priorCalculations}={}){
 if(priorCalculations)seed={...seed,calculations:priorCalculations};
 let sources=(priorSources?.slice(0,3)??seed.sources??[]).map(s=>({...s,text:s.text.slice(0,6000)}));const errors=[],queries=[];
 const oldUrls=new Set((priorSources??[]).map(s=>s.url));
 if(!sources.length&&seed.sourceType!=='request')sources.push({id:researchHash(seed.anchorUrl),url:seed.anchorUrl,title:seed.title,kind:'seed',text:seed.text,readAt:seed.readAt,publishedAt:seed.publishedAt??null});
 if(seed.category==='asset'&&seed.asset?.id&&(!sources.length||sources.some(s=>s.kind==='market-data'&&now.getTime()-Date.parse(s.publishedAt)>3600000))){
  const data=await financeImpl({assetIds:[seed.asset.id],maxAssets:1,now}),a=data.assets[0];
  if(!a)return {bundle:null,coverage:{sources:0,errors:data.errors,queries:[],reads:0}};
  sources=[...a.sources,...sources.filter(s=>!['market-data','project'].includes(s.kind)).slice(0,1)];seed={...seed,asset:{...seed.asset,name:a.name,officialWebsite:a.officialWebsite},calculations:Object.entries(a.calculations).map(([id,c])=>({id,...c}))};
 }
 const words=seed.title.replace(/Ask HN:|[^\p{L}\p{N} .-]/gu,' ').replace(/\s+/g,' ').trim().slice(0,140);
 const targets=[];
 // A human selecting an unread radar title requests a real page read, not a
 // conversion of that title into evidence. Search is supplementary.
 if(seed.sourceType==='request'&&new URL(seed.anchorUrl).hostname!=='duckduckgo.com')targets.push({url:seed.anchorUrl,title:seed.title});
 if(seed.asset?.officialWebsite)targets.push({url:seed.asset.officialWebsite,title:seed.asset.name+' official project'});
 if(/github\.com\/n8n-io\/n8n\/issues/.test(seed.anchorUrl))targets.push({url:'https://raw.githubusercontent.com/n8n-io/n8n-docs/main/docs/hosting/cli-commands.md',title:'n8n export and import workflows CLI'});
 if(/wordpress\.org\/support\//.test(seed.anchorUrl))targets.push({url:'https://developer.woocommerce.com/docs/best-practices/performance/configuring-caching-plugins/',title:'WooCommerce existing cache procedures'});
 const year=now.getUTCFullYear(),month=new Intl.DateTimeFormat('en-GB',{month:'long',timeZone:'UTC'}).format(now);
 const entity=seed.asset?.name??(/n8n/.test(seed.anchorUrl)?'n8n':/wordpress\.org/.test(seed.anchorUrl)?'WooCommerce':'');
 const searches=Array.isArray(seed.researchQuestions)&&seed.researchQuestions.length?
  seed.researchQuestions.slice(0,2).map(q=>`${entity} ${String(q).replace(/https?:\/\/\S+|[\r\n]/g,' ').slice(0,200)}`):
  seed.category==='asset'?[`${seed.asset?.name??words} token economics official documentation supply risks`,`${seed.asset?.name??words} adoption liquidity independent analysis ${month} ${year}`]:
  seed.category==='macro'?[`${words} ${month} ${year} economic analysis`,`${words} official statistics central bank ${year}`]:
  [`${entity} ${words} problem workaround documentation`,`${entity} ${words} complaints alternative`];
 const expected=new Set((entity||words).toLowerCase().match(/[a-zà-ÿ0-9]{3,}/g)??[]);
 for(const query of searches){
  const r=await searchImpl(query,{fetchImpl,limit:5});queries.push({query,results:r.results.length,...(r.error_code?{error_code:r.error_code}:{})});
  if(r.error_code)errors.push({code:r.error_code});
  for(const hit of r.results){
   if(seed.category!=='macro'&&expected.size&&!Array.from(expected).some(w=>(hit.title+' '+hit.url).toLowerCase().includes(w)))continue;
   if(!oldUrls.has(hit.url)&&!targets.some(t=>t.url===hit.url)&&!sources.some(s=>s.url===hit.url))targets.push(hit);
  }
 }
 let reads=0;
 for(const target of targets){
  if(sources.length>=6||reads>=6)break;if(oldUrls.has(target.url)||sources.some(s=>s.url===target.url)||sources.filter(s=>publisher(s.url)===publisher(target.url)).length>=2)continue;reads++;
  try{
   const page=extractPublicPage(await fetchImpl(target.url,{maxRedirects:2})),content=focus(page.text,words);
   if(sources.some(s=>s.url===page.url||s.text===content))continue;
   sources.push({...page,id:researchHash(page.url),title:page.title.slice(0,200),text:content});
  }catch(e){errors.push({url:target.url,code:safeCode(e)});}
 }
 let bundle;try{bundle=sealBundle({topic:seed.topic,category:seed.category,title:seed.title,anchorUrl:seed.anchorUrl,sources,calculations:seed.calculations??[]});}
 catch(e){return {bundle:null,coverage:{sources:sources.length,reads,queries,errors:[...errors,{code:e.code??'RESEARCH_EVIDENCE_INSUFFICIENT'}]}};}
 return {bundle,coverage:{sources:sources.length,reads,queries,errors}};
}
