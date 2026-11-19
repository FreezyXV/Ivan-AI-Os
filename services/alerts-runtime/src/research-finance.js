// Discovery universe, not an investment shortlist. CoinPaprika is one market
// aggregator: its project metadata and reported websites are not primary project
// research or independent confirmation of adoption, value, liquidity or safety.
import {createHash} from 'node:crypto';

const origin='https://api.coinpaprika.com/v1';
const defaults=['btc-bitcoin','eth-ethereum','sol-solana'];
const known={
 'btc-bitcoin':{name:'Bitcoin',symbol:'BTC'},
 'eth-ethereum':{name:'Ethereum',symbol:'ETH'},
 'sol-solana':{name:'Solana',symbol:'SOL'}
};
const sha=value=>createHash('sha256').update(value).digest('hex');
const fail=code=>{throw Error(code);};
const clean=(value,max=160)=>typeof value==='string'?value.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max):null;

async function readJson(url,fetchImpl){
 try{
  const response=await fetchImpl(url,{redirect:'error',signal:AbortSignal.timeout(8000),
   headers:{accept:'application/json','user-agent':'Ivan-AI-OS-finance-research/1'}});
  if(!response.ok||!response.body?.getReader)fail('FINANCE_UNAVAILABLE');
  const reader=response.body.getReader(),chunks=[];let bytes=0;
  try{
   while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;
    if(bytes>400000)fail('FINANCE_RESPONSE_TOO_LARGE');chunks.push(value);}
  }finally{await reader.cancel().catch(()=>{});}
  const body=Buffer.concat(chunks).toString('utf8');let value;
  try{value=JSON.parse(body);}catch{fail('FINANCE_INVALID_RESPONSE');}
  if(!value||typeof value!=='object'||Array.isArray(value))fail('FINANCE_INVALID_RESPONSE');
  return {value,bytes,responseSha256:sha(body)};
 }catch(error){
  // Never persist a server body, request exception or local transport details.
  if(/^FINANCE_[A-Z_]+$/.test(error?.message??''))throw error;
  fail('FINANCE_UNAVAILABLE');
 }
}

function identity(value,id,expected=null){
 if(value.id!==id||typeof value.name!=='string'||!value.name.trim()||value.name.length>120||
  typeof value.symbol!=='string'||!/^[A-Z0-9]{1,15}$/.test(value.symbol)||
  value.symbol!==id.split('-')[0].toUpperCase()||
  (expected&&(value.name!==expected.name||value.symbol!==expected.symbol)))fail('FINANCE_IDENTITY_MISMATCH');
 return {id,name:value.name,symbol:value.symbol};
}

function timestamp(value,at,maxAgeMs){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value))fail('FINANCE_INVALID_TIMESTAMP');
 const [year,month,day,hour,minute,second]=value.slice(0,19).split(/[-T:]/).map(Number);
 const calendar=new Date(Date.UTC(year,month-1,day));
 if(calendar.getUTCFullYear()!==year||calendar.getUTCMonth()!==month-1||calendar.getUTCDate()!==day||hour>23||minute>59||second>59)fail('FINANCE_INVALID_TIMESTAMP');
 const time=Date.parse(value);if(!Number.isFinite(time)||time>at+300000)fail('FINANCE_INVALID_TIMESTAMP');
 if(at-time>maxAgeMs)fail('FINANCE_STALE_TIMESTAMP');
 return new Date(time).toISOString();
}

function metric(value,{required=false,zeroMissing=false}={}){
 if(value===undefined||value===null||value===''||(zeroMissing&&value===0)){
  if(required)fail('FINANCE_INVALID_PRICE');return null;
 }
 if(typeof value!=='number'||!Number.isFinite(value)||value<0||(required&&value===0))fail(required?'FINANCE_INVALID_PRICE':'FINANCE_INVALID_METRIC');
 return value;
}

function metrics(value){
 const usd=value.quotes?.USD??{},result={priceUsd:metric(usd.price,{required:true}),marketCapUsd:metric(usd.market_cap),
  volume24hUsd:metric(usd.volume_24h),circulatingSupply:metric(value.circulating_supply),totalSupply:metric(value.total_supply),
  maxSupply:metric(value.max_supply,{zeroMissing:true})};
 const {circulatingSupply:c,totalSupply:t,maxSupply:m}=result;
 if((c!==null&&t!==null&&c>t+Math.max(1,t)*1e-8)||
  (c!==null&&m!==null&&c>m+Math.max(1,m)*1e-8)||
  (t!==null&&m!==null&&t>m+Math.max(1,m)*1e-8))fail('FINANCE_INVALID_SUPPLY');
 return result;
}

function reportedWebsite(value){
 for(const candidate of Array.isArray(value)?value.slice(0,10):[]){
  if(typeof candidate!=='string'||candidate.length>300)continue;
  try{const url=new URL(candidate),host=url.hostname.toLowerCase();
   // A reported website is only returned as a pointer, never fetched here. The
   // downstream source reader must independently enforce its network policy.
   if(url.protocol==='https:'&&!url.username&&!url.password&&!url.search&&!url.hash&&!url.port&&
    host.includes('.')&&!/^[\d.]+$/.test(host)&&!host.includes(':')&&
    !/(?:^|\.)(?:localhost|local|internal|test|invalid|example)$/.test(host))return url.href;
  }catch{}
 }
 return null;
}

function projectMetadata(value){
 const description=clean(value.description,2500),contracts=Array.isArray(value.contracts)?value.contracts.slice(0,4).flatMap(c=>{
  const contract=clean(c?.contract,160),platform=clean(c?.platform,80);return contract&&platform?[{contract,platform,type:clean(c.type,40)}]:[];
 }):[];
 return {provider:'CoinPaprika',description:description||null,descriptionTruncated:typeof value.description==='string'&&value.description.length>2500,
  type:['coin','token'].includes(value.type)?value.type:null,platform:clean(value.platform,80),contract:clean(value.contract,160),contracts,
  officialWebsite:reportedWebsite(value.links?.website),websiteVerification:'provider-reported; not independently verified',
  developmentStatus:clean(value.development_status,160),proofType:clean(value.proof_type,160)};
}

function source({url,title,readAt,publishedAt,kind,data}){
 const text=JSON.stringify(data);if(text.length>6000)fail('FINANCE_SOURCE_TOO_LARGE');
 return {id:sha(url+'\n'+text),url,title,readAt,publishedAt,kind,text,sha256:sha(text)};
}

function calculations(m,marketSource){
 const receipt=(formula,inputs,value)=>{
  if(value!==null&&!Number.isFinite(value))fail('FINANCE_INVALID_CALCULATION');
  return {formula,inputs,value,sourceSha256:marketSource.sha256,asOf:marketSource.publishedAt,
   limitation:'Deterministic arithmetic on a single provider snapshot; not fair value or an executable quote.'};
 };
 return {
  fdvUsd:receipt('priceUsd * maxSupply',{priceUsd:m.priceUsd,maxSupply:m.maxSupply},m.maxSupply===null?null:m.priceUsd*m.maxSupply),
  circulatingToMax:receipt('circulatingSupply / maxSupply',{circulatingSupply:m.circulatingSupply,maxSupply:m.maxSupply},
   m.circulatingSupply===null||m.maxSupply===null?null:m.circulatingSupply/m.maxSupply),
  volumeToMarketCap:receipt('volume24hUsd / marketCapUsd',{volume24hUsd:m.volume24hUsd,marketCapUsd:m.marketCapUsd},
   m.volume24hUsd===null||m.marketCapUsd===null||m.marketCapUsd===0?null:m.volume24hUsd/m.marketCapUsd)
 };
}

export async function collectFinanceResearch({assetIds=defaults,fetchImpl=fetch,now=new Date(),maxAssets=4,maxAgeMs=3600000}={}){
 const at=now instanceof Date?now.getTime():NaN;
 if(!Number.isFinite(at)||!Array.isArray(assetIds)||assetIds.length>32||
  assetIds.some(id=>typeof id!=='string'||id.length>100||!/^[a-z0-9]{1,15}-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))||
  !Number.isInteger(maxAssets)||maxAssets<1||maxAssets>4||!Number.isFinite(maxAgeMs)||maxAgeMs<60000||maxAgeMs>86400000||typeof fetchImpl!=='function')fail('FINANCE_INVALID_CONFIG');
 const ids=[...new Set(assetIds)],readAt=now.toISOString(),result={assets:[],sources:[],errors:[],requests:0,deferred:Math.max(0,ids.length-maxAssets)};
 for(const id of ids.slice(0,maxAssets)){
  try{
   const tickerUrl=`${origin}/tickers/${id}`;result.requests++;
   const ticker=await readJson(tickerUrl,fetchImpl),who=identity(ticker.value,id,known[id]);
   const publishedAt=timestamp(ticker.value.last_updated,at,maxAgeMs),m=metrics(ticker.value);
   const marketSource=source({url:tickerUrl,title:`${who.name} (${who.symbol}) — CoinPaprika market snapshot`,readAt,publishedAt,kind:'market-data',
    data:{provider:'CoinPaprika',...who,asOf:publishedAt,quoteCurrency:'USD',metrics:m}});
   const missing=Object.entries(m).filter(([,v])=>v===null).map(([key])=>key),sources=[marketSource];
   const receipts=[{url:tickerUrl,readAt,bytes:ticker.bytes,responseSha256:ticker.responseSha256}];
   let project=null;
   const projectUrl=`${origin}/coins/${id}`;
   try{
    result.requests++;const metadata=await readJson(projectUrl,fetchImpl);identity(metadata.value,id,who);
    if(metadata.value.is_active===false)fail('FINANCE_INACTIVE_ASSET');
    project=projectMetadata(metadata.value);
    sources.push(source({url:projectUrl,title:`${who.name} (${who.symbol}) — metadata reported by CoinPaprika`,readAt,publishedAt:null,kind:'project',
     data:{...who,...project,limitation:'Aggregator metadata, not primary project documentation. Official website not independently verified or read.'}}));
    receipts.push({url:projectUrl,readAt,bytes:metadata.bytes,responseSha256:metadata.responseSha256});
    if(!project.description)missing.push('projectDescription');if(!project.officialWebsite)missing.push('officialWebsite');
   }catch(error){
    if(['FINANCE_IDENTITY_MISMATCH','FINANCE_INACTIVE_ASSET'].includes(error.message))throw error;
    missing.push('projectMetadata','officialWebsite');result.errors.push({id,code:'FINANCE_METADATA_UNAVAILABLE'});
   }
   const asset={...who,asOf:publishedAt,metrics:m,missing,calculations:calculations(m,marketSource),project,
    officialWebsite:project?.officialWebsite??null,sources,receipts,investmentQualification:'insufficient-single-provider'};
   result.assets.push(asset);result.sources.push(...sources);
  }catch(error){result.errors.push({id,code:/^FINANCE_[A-Z_]+$/.test(error?.message??'')?error.message:'FINANCE_UNAVAILABLE'});}
 }
 return result;
}

// Per-process request coalescing only. The scheduler must persist this daily
// result between process restarts; this public connector never writes a cache.
const universeCache=new WeakMap();
const stableOrWrapped=coin=>/\b(?:stable[ -]?coin|wrapped|bridged|staked|liquid staking|tether|usd coin|usdd|trueusd|pax dollar|paxos standard|paypal usd|dai|frax|euro coin)\b/i.test(coin.name)||
 /^(?:USDT|USDC|USDD|USDE|USDS|TUSD|BUSD|GUSD|LUSD|SUSD|PYUSD|FDUSD|USD1|DAI|FRAX|EURC|EURT|WBTC|WETH)$/.test(coin.symbol);

async function readUniverse(fetchImpl){
 try{
  const url=`${origin}/coins`,response=await fetchImpl(url,{redirect:'error',signal:AbortSignal.timeout(10000),
   headers:{accept:'application/json','user-agent':'Ivan-AI-OS-finance-universe/1'}});
  if(!response.ok||!response.body?.getReader)fail('FINANCE_UNIVERSE_UNAVAILABLE');
  const reader=response.body.getReader(),chunks=[];let bytes=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;
   if(bytes>8000000)fail('FINANCE_UNIVERSE_TOO_LARGE');chunks.push(value);}}
  finally{await reader.cancel().catch(()=>{});}
  const body=Buffer.concat(chunks).toString('utf8');let coins;
  try{coins=JSON.parse(body);}catch{fail('FINANCE_UNIVERSE_INVALID_RESPONSE');}
  if(!Array.isArray(coins))fail('FINANCE_UNIVERSE_INVALID_RESPONSE');
  const valid=coins.filter(coin=>coin&&typeof coin.id==='string'&&coin.id.length<=100&&
   /^[a-z0-9]{1,15}-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(coin.id)&&typeof coin.name==='string'&&coin.name.length>0&&coin.name.length<=120&&
   typeof coin.symbol==='string'&&/^[A-Z0-9]{1,15}$/.test(coin.symbol)&&coin.id.split('-')[0].toUpperCase()===coin.symbol&&
   coin.is_active===true&&['coin','token'].includes(coin.type));
  if(!valid.some(coin=>coin.id==='btc-bitcoin'&&coin.name==='Bitcoin'&&coin.symbol==='BTC'))fail('FINANCE_UNIVERSE_INVALID_RESPONSE');
  const pool=[...new Map(valid.filter(coin=>Number.isInteger(coin.rank)&&coin.rank>=5&&coin.rank<=150&&!stableOrWrapped(coin))
   .map(coin=>[coin.id,{id:coin.id,rank:coin.rank}])).values()]
   .sort((a,b)=>a.rank-b.rank||(a.id<b.id?-1:a.id>b.id?1:0));
  return {pool,requestReceipt:{url,bodyBytes:bytes,responseSha256:sha(body)}};
 }catch(error){return {code:/^FINANCE_UNIVERSE_[A-Z_]+$/.test(error?.message??'')?error.message:'FINANCE_UNIVERSE_UNAVAILABLE'};}
}

export async function discoverFinanceUniverse({fetchImpl=fetch,now=new Date(),maxAssets=3}={}){
 const at=now instanceof Date?now.getTime():NaN;
 if(!Number.isFinite(at)||typeof fetchImpl!=='function'||!Number.isInteger(maxAssets)||maxAssets<1||maxAssets>3)fail('FINANCE_INVALID_CONFIG');
 const selectionDay=now.toISOString().slice(0,10);
 let cache=universeCache.get(fetchImpl);if(!cache){cache=new Map();universeCache.set(fetchImpl,cache);}
 if(!cache.has(selectionDay)){
  cache.set(selectionDay,readUniverse(fetchImpl));
  // Keep a bounded cache; the normal scheduler advances chronologically.
  if(cache.size>2)cache.delete(cache.keys().next().value);
 }
 const result=await cache.get(selectionDay),base={provider:'CoinPaprika',explorationOnly:true,selectionDay,
  limitation:'Daily rotation of a small rank-bounded sample, not an exhaustive screener or investment recommendation.'};
 if(result.code||result.pool.length<maxAssets-1)return {...base,assetIds:defaults.slice(0,maxAssets),universeSize:result.pool?.length??null,
  degraded:true,errors:[{code:result.code??'FINANCE_UNIVERSE_TOO_SMALL'}]};
 const start=Math.floor(at/86400000)*2%Math.max(1,result.pool.length),assetIds=['btc-bitcoin'];
 for(let i=0;i<maxAssets-1;i++)assetIds.push(result.pool[(start+i)%result.pool.length].id);
 return {...base,assetIds,universeSize:result.pool.length,degraded:false,errors:[],requestReceipt:result.requestReceipt};
}
