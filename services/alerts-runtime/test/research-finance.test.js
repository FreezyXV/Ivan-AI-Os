import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {collectFinanceResearch,discoverFinanceUniverse} from '../src/research-finance.js';

const now=new Date('2026-10-16T12:00:00Z');
const ticker=(extra={})=>({id:'btc-bitcoin',name:'Bitcoin',symbol:'BTC',last_updated:'2026-10-16T11:55:00Z',
 circulating_supply:20,total_supply:20,max_supply:25,quotes:{USD:{price:10,market_cap:200,volume_24h:40}},...extra});
const project=(extra={})=>({id:'btc-bitcoin',name:'Bitcoin',symbol:'BTC',is_active:true,description:'Peer-to-peer payments.',
 links:{website:['https://bitcoin.org/']},contracts:[],...extra});
const response=value=>new Response(JSON.stringify(value),{headers:{'content-type':'application/json'}});
const fetcher=(tick=ticker(),meta=project())=>async url=>response(url.includes('/tickers/')?tick:meta);
const collect=options=>collectFinanceResearch({assetIds:['btc-bitcoin'],now,...options});

test('market evidence has exact identity, timestamp, source hash and reproducible calculations',async()=>{
 const calls=[];const result=await collect({fetchImpl:async(url,options)=>{
  calls.push(url);assert.equal(options.redirect,'error');assert.ok(options.signal);assert.equal(options.headers.authorization,undefined);
  return response(url.includes('/tickers/')?ticker():project());}});
 assert.equal(result.errors.length,0);assert.equal(result.requests,2);assert.equal(calls.length,2);
 const asset=result.assets[0];assert.equal(asset.id,'btc-bitcoin');assert.equal(asset.officialWebsite,'https://bitcoin.org/');
 assert.deepEqual(asset.metrics,{priceUsd:10,marketCapUsd:200,volume24hUsd:40,circulatingSupply:20,totalSupply:20,maxSupply:25});
 assert.equal(asset.calculations.fdvUsd.value,250);assert.equal(asset.calculations.circulatingToMax.value,0.8);
 assert.equal(asset.calculations.volumeToMarketCap.value,0.2);
 assert.equal(asset.calculations.fdvUsd.formula,'priceUsd * maxSupply');
 for(const source of result.sources){assert.equal(source.sha256,createHash('sha256').update(source.text).digest('hex'));assert.ok(source.text.length<=6000);}
 assert.equal(result.sources[0].publishedAt,'2026-10-16T11:55:00.000Z');
 assert.equal(result.sources[1].publishedAt,null,'a metadata response has no article publication date');
 assert.match(result.sources[1].text,/CoinPaprika/);assert.match(result.sources[1].text,/not independently verified/);
 assert.equal(asset.calculations.fdvUsd.sourceSha256,result.sources[0].sha256);
 assert.equal(asset.investmentQualification,'insufficient-single-provider');
});

test('stale, future, invalid and timezone-less quotes do not become usable prices',async()=>{
 for(const last_updated of ['2026-10-16T10:59:59Z','2026-10-16T12:10:00Z','not-a-date','2026-10-16T11:55:00']){
  const result=await collect({fetchImpl:fetcher(ticker({last_updated}))});assert.equal(result.assets.length,0,last_updated);
  assert.match(result.errors[0].code,/FINANCE_(STALE|INVALID)_TIMESTAMP/);assert.equal(result.requests,1);
 }
 for(const last_updated of ['2026-02-30T12:00:00Z','2026-10-16T24:00:00Z']){
  const result=await collect({fetchImpl:fetcher(ticker({last_updated}))});assert.equal(result.assets.length,0);
  assert.equal(result.errors[0].code,'FINANCE_INVALID_TIMESTAMP');
 }
});

test('missing optional data stay null and cannot imply zero dilution or volume',async()=>{
 const result=await collect({fetchImpl:fetcher(ticker({circulating_supply:'',total_supply:null,max_supply:0,
  quotes:{USD:{price:10,market_cap:'',volume_24h:null}}}))});const asset=result.assets[0];
 assert.equal(asset.metrics.maxSupply,null);assert.equal(asset.metrics.totalSupply,null);
 assert.equal(asset.calculations.fdvUsd.value,null);assert.equal(asset.calculations.circulatingToMax.value,null);
 assert.equal(asset.calculations.volumeToMarketCap.value,null);assert.ok(asset.missing.includes('maxSupply'));
 assert.ok(asset.missing.includes('marketCapUsd'));
});

test('non-positive or missing prices, negative metrics and inconsistent supplies fail closed',async()=>{
 for(const changes of [
  {quotes:{USD:{price:0}}},{quotes:{USD:{price:'10'}}},{quotes:{}},
  {quotes:{USD:{price:10,market_cap:-1}}},{circulating_supply:26},{total_supply:19}
 ]){const result=await collect({fetchImpl:fetcher(ticker(changes))});assert.equal(result.assets.length,0);assert.match(result.errors[0].code,/FINANCE_INVALID_/);}
});

test('ticker ID/symbol and project identity inconsistencies cannot cross-wire assets',async()=>{
 for(const bad of [ticker({id:'eth-ethereum'}),ticker({symbol:'ETH'}),ticker({name:'Not Bitcoin'})]){
  const result=await collect({fetchImpl:fetcher(bad)});assert.equal(result.assets.length,0);assert.equal(result.errors[0].code,'FINANCE_IDENTITY_MISMATCH');
 }
 const result=await collect({fetchImpl:fetcher(ticker(),project({symbol:'ETH'}))});
 assert.equal(result.assets.length,0);assert.equal(result.sources.length,0);assert.equal(result.errors[0].code,'FINANCE_IDENTITY_MISMATCH');
});

test('metadata outages preserve a valid market snapshot but disclose missing project research',async()=>{
 const result=await collect({fetchImpl:async url=>url.includes('/tickers/')?response(ticker()):new Response('{}',{status:429})});
 assert.equal(result.assets.length,1);assert.equal(result.sources.length,1);assert.equal(result.assets[0].officialWebsite,null);
 assert.ok(result.assets[0].missing.includes('projectMetadata'));assert.equal(result.errors[0].code,'FINANCE_METADATA_UNAVAILABLE');
 assert.equal(result.requests,2,'no automatic retry after rate limits');
});

test('untrusted links are pointers only, with no arbitrary fetch; contract metadata is bounded',async()=>{
 const urls=[];const result=await collect({fetchImpl:async url=>{urls.push(url);return response(url.includes('/tickers/')?ticker():project({
  description:'x'.repeat(20000),links:{website:['http://localhost/','https://127.0.0.1/','https://bitcoin.org/?token=bad','https://bitcoin.org/']},
  contracts:[{contract:'0x123',platform:'eth-ethereum',type:'ERC20'}],platform:'eth-ethereum',contract:'0x123'}));}});
 assert.equal(urls.length,2);assert.equal(result.assets[0].officialWebsite,'https://bitcoin.org/');
 assert.equal(result.assets[0].project.contracts[0].contract,'0x123');assert.equal(result.assets[0].project.platform,'eth-ethereum');
 assert.ok(result.sources[1].text.length<=6000);assert.equal(result.assets[0].project.descriptionTruncated,true);
});

test('stream byte ceiling, malformed JSON and provider failures give sanitized errors',async()=>{
 for(const fetchImpl of [async()=>new Response('x'.repeat(400001)),async()=>new Response('{'),async()=>{throw Error('private runtime detail');}]){
  const result=await collect({fetchImpl});assert.equal(result.assets.length,0);assert.equal(result.errors.length,1);
  assert.doesNotMatch(JSON.stringify(result),/private runtime detail/);
 }
});

test('at most four unique validated slugs are fetched, and invalid configuration makes no requests',async()=>{
 let calls=0;const fetchImpl=async url=>{calls++;const id=new URL(url).pathname.split('/').at(-1),symbol=id.split('-')[0].toUpperCase();
  return response(url.includes('/tickers/')?ticker({id,name:'Fixture asset',symbol}):project({id,name:'Fixture asset',symbol}));};
 const result=await collectFinanceResearch({assetIds:['aaa-first','aaa-first','bbb-second','ccc-third','ddd-fourth','eee-fifth'],now,fetchImpl});
 assert.equal(result.assets.length,4);assert.equal(calls,8);assert.equal(result.deferred,1);
 for(const assetIds of [['../../etc/passwd'],['https://example.com'],['btc-bitcoin?key=x']]){
  await assert.rejects(collectFinanceResearch({assetIds,now,fetchImpl}),/FINANCE_INVALID_CONFIG/);
 }
 assert.equal(calls,8);
});

test('abort signals are propagated and incomplete streaming cannot become market evidence',async()=>{
 const result=await collect({fetchImpl:async(_url,{signal})=>{assert.ok(signal instanceof AbortSignal);return new Response(new ReadableStream({start(controller){controller.error(Error('untrusted transport failure'));}}));}});
 assert.equal(result.assets.length,0);assert.equal(result.errors[0].code,'FINANCE_UNAVAILABLE');
});

const listed=(id,rank,name='Exploration asset')=>({id,rank,name,symbol:id.split('-')[0].toUpperCase(),is_active:true,type:'coin'});
const universe=()=>[listed('btc-bitcoin',1,'Bitcoin'),listed('aaa-first',5),listed('bbb-second',6),listed('ccc-third',7),listed('ddd-fourth',150)];

test('exploration rotates by UTC day over eligible assets, never by projected return',async()=>{
 const fetchImpl=async()=>response(universe());
 const first=await discoverFinanceUniverse({fetchImpl,now});
 const second=await discoverFinanceUniverse({fetchImpl,now:new Date(now.getTime()+86400000)});
 assert.equal(first.provider,'CoinPaprika');assert.equal(first.explorationOnly,true);assert.equal(first.degraded,false);
 assert.equal(first.assetIds.length,3);assert.equal(first.assetIds[0],'btc-bitcoin');assert.equal(first.universeSize,4);
 assert.notDeepEqual(first.assetIds,second.assetIds);assert.equal(first.selectionDay,'2026-10-16');
 assert.deepEqual(first.errors,[]);
 const reordered=await discoverFinanceUniverse({fetchImpl:async()=>response(universe().reverse()),now});
 assert.deepEqual(first.assetIds,reordered.assetIds,'provider response ordering cannot change the rotation');
});

test('exploration excludes inactive assets, out-of-range ranks, identifiable stable/wrapped coins and malformed IDs',async()=>{
 const coins=[...universe(),listed('usdc-usd-coin',8,'USD Coin'),listed('usdt-tether',9,'Tether'),
  listed('wbtc-wrapped-bitcoin',10,'Wrapped Bitcoin'),listed('bthe-bridged-ether',11,'Bridged Ether'),
  listed('bad-low',4),listed('bad-high',151),listed('../../bad',12),{...listed('bad-inactive',13),is_active:false},listed('aaa-first',5)];
 const first=await discoverFinanceUniverse({fetchImpl:async()=>response(coins),now});
 assert.equal(first.universeSize,4);assert.equal(new Set(first.assetIds).size,3);
 assert.ok(first.assetIds.every(id=>id==='btc-bitcoin'||['aaa-first','bbb-second','ccc-third','ddd-fourth'].includes(id)));
});

test('one universe request per UTC day is shared across concurrent calls and failures, including different result limits',async()=>{
 let calls=0;const fetchImpl=async(url,options)=>{calls++;assert.equal(url,'https://api.coinpaprika.com/v1/coins');
  assert.equal(options.redirect,'error');assert.ok(options.signal);return response(universe());};
 const results=await Promise.all([discoverFinanceUniverse({fetchImpl,now}),discoverFinanceUniverse({fetchImpl,now,maxAssets:1})]);
 assert.equal(calls,1);assert.equal(results[0].assetIds.length,3);assert.deepEqual(results[1].assetIds,['btc-bitcoin']);
 await discoverFinanceUniverse({fetchImpl,now});assert.equal(calls,1);
 let failures=0;const unavailable=async()=>{failures++;throw Error('untrusted provider detail');};
 const failed=await discoverFinanceUniverse({fetchImpl:unavailable,now});await discoverFinanceUniverse({fetchImpl:unavailable,now});
 assert.equal(failures,1);assert.deepEqual(failed.assetIds,['btc-bitcoin','eth-ethereum','sol-solana']);
 assert.equal(failed.degraded,true);assert.equal(failed.universeSize,null);assert.doesNotMatch(JSON.stringify(failed),/untrusted provider detail/);
});

test('oversized, malformed and too-small universe responses produce explicit degraded fallback without retries',async()=>{
 for(const fetchImpl of [async()=>new Response('x'.repeat(8000001)),async()=>response({error:'provider detail'}),
  async()=>new Response('{'),async()=>response([listed('btc-bitcoin',1)])]){
  const result=await discoverFinanceUniverse({fetchImpl,now});assert.equal(result.degraded,true);assert.equal(result.assetIds.length,3);
  assert.equal(result.explorationOnly,true);assert.equal(result.errors.length,1);assert.match(result.errors[0].code,/^FINANCE_UNIVERSE_/);
 }
});

test('universe configuration cannot make extra or arbitrary requests',async()=>{
 let calls=0;const fetchImpl=async()=>{calls++;return response(universe());};
 for(const options of [{maxAssets:0},{maxAssets:4},{maxAssets:1.5},{now:new Date('invalid')}]){
  await assert.rejects(discoverFinanceUniverse({fetchImpl,now,...options}),/FINANCE_INVALID_CONFIG/);
 }
 assert.equal(calls,0);
});
