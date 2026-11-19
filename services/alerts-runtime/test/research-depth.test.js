import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,realpathSync} from 'node:fs';import {tmpdir} from 'node:os';import path from 'node:path';
import {openResearchStore} from '../src/research-store.js';import {researchTick} from '../src/research-runtime.js';
import {buildResearchBundle} from '../src/research-discovery.js';import {sealBundle,researchHash} from '../src/research-contract.js';
const now=new Date('2026-10-30T20:00:00Z');
const seed={topic:'business',category:'business',anchorUrl:'https://customer.org/widget',title:'Widget import problems',text:'An actual customer describes manual invoice imports.',readAt:now.toISOString(),publishedAt:null};
function setup(t){const dir=mkdtempSync(path.join(realpathSync(tmpdir()),'ivan-depth-'));const settings={target:'123456789',research:{enabled:true,directory:dir},opportunities:{directory:path.join(dir,'dossiers'),vaultPath:path.join(dir,'vault')}};const store=openResearchStore(dir);t.after(()=>{store.close();rmSync(dir,{recursive:true,force:true});});return {store,settings};}
test('an analyst abstention records its actual gap and delegates one targeted follow-up',async t=>{
 const f=setup(t),{id}=f.store.enqueue(seed),bundle=sealBundle({topic:'business',category:'business',title:seed.title,anchorUrl:seed.anchorUrl,sources:[['customer','https://customer.org/a','The customer describes an actual issue importing supplier invoices.'],['vendor','https://vendor.org/a','The vendor provides free mapping corrections and diagnostic procedures.']].map(([id,url,text])=>({id,url,text,title:id,readAt:now.toISOString(),publishedAt:null,kind:'page'}))});
 const r=await researchTick({...f,now,discover:async()=>({}),build:async()=>({bundle,coverage:{}}),complete:async()=>({decision:'research',reason:'Le besoin résiduel après la correction gratuite est inconnu.',questions:['Widget import errors after latest free fix independent users']}),deliver:async()=>assert.fail()});
 assert.equal(r.deepeningQueued,true);assert.match(f.store.get(id).analysis.reason,/résiduel/);
 const next=f.store.list('pending')[0];assert.equal(next.seed.parentJob,id);assert.equal(next.seed.researchQuestions[0],'Widget import errors after latest free fix independent users');
});
test('an evidence follow-up takes priority over opening a new unrelated dossier',t=>{
 const {store}=setup(t);store.enqueue(seed);const deep=store.enqueue({...seed,anchorUrl:'https://other.org/widget',depth:1});assert.equal(store.claim().id,deep.id);
});
test('macro research follows its actual topic rather than an unrelated generic inflation query',async()=>{
 const queries=[];await buildResearchBundle({...seed,topic:'finance',category:'macro',title:'European T+1 securities settlement'},{now,searchImpl:async q=>{queries.push(q);return {results:[]};},fetchImpl:async()=>assert.fail()});
 assert.ok(queries[0].includes('securities settlement'));assert.ok(!queries[0].startsWith('France euro area inflation'));
});
test('a publisher cannot fill all evidence slots with copies of its documentation',async()=>{
 const results=[1,2,3,4,5].map(i=>({url:`https://docs.vendor.org/widget/${i}`,title:'Widget documentation'}));results.push({url:'https://independent.org/widget',title:'Widget customer feedback'});
 const r=await buildResearchBundle(seed,{now,searchImpl:async()=>({results}),fetchImpl:async url=>({url,contentType:'text/html',readAt:now.toISOString(),text:`<title>Widget</title><article>${url} ${'This article discusses actual Widget import problems and existing remedies. '.repeat(4)}</article>`})});
 assert.ok(r.bundle.sources.some(s=>s.url.includes('independent.org')));
});
test('stale asset prices are refreshed before an analyst can use them',async()=>{
 const old={id:'old',url:'https://prices.org/asset',title:'Old snapshot',kind:'market-data',readAt:'2026-10-29T12:00:00.000Z',publishedAt:'2026-10-29T12:00:00.000Z',text:'{"metrics":{"priceUsd":10}}'};
 const fresh={...old,id:'fresh',readAt:now.toISOString(),publishedAt:now.toISOString(),text:'{"metrics":{"priceUsd":20}}'};let calls=0;
 const r=await buildResearchBundle({...seed,topic:'finance',category:'asset',sources:[old],asset:{id:'btc-bitcoin',name:'Bitcoin'}},{now,financeImpl:async()=>{calls++;return {assets:[{name:'Bitcoin',sources:[fresh],calculations:{},officialWebsite:'https://bitcoin.org/'}],errors:[]};},searchImpl:async()=>({results:[]}),fetchImpl:async url=>({url,contentType:'text/html',readAt:now.toISOString(),text:'<title>Bitcoin documentation</title><article>'+('Public protocol documentation describes independent verification and limits of available market data. ').repeat(3)+'</article>'})});
 assert.equal(calls,1);assert.equal(r.bundle.sources[0].id,'fresh');assert.equal(r.bundle.sources[0].publishedAt,now.toISOString());
});
test('a financial follow-up preserves calculations bound to the refreshed parent snapshot',async()=>{
 const market=price=>({id:'market',url:'https://prices.org/asset',title:'Snapshot',kind:'market-data',readAt:now.toISOString(),publishedAt:now.toISOString(),text:JSON.stringify({metrics:{priceUsd:price,maxSupply:2}})});
 const old=market(10),fresh=market(20),calculation=s=>({id:'fdv',formula:'priceUsd * maxSupply',inputs:JSON.parse(s.text).metrics,value:JSON.parse(s.text).metrics.priceUsd*2,sourceSha256:researchHash(s.text)});
 const docs={id:'docs',url:'https://project.org/docs',title:'Primary documentation',kind:'primary',text:'Public project documentation describes the asset and known limitations.',readAt:now.toISOString(),publishedAt:null};
 const parent=sealBundle({topic:'finance',category:'asset',title:'Asset',anchorUrl:old.url,sources:[fresh,docs],calculations:[calculation(fresh)]});
 const r=await buildResearchBundle({...seed,topic:'finance',category:'asset',depth:1,sources:[old,docs],calculations:[calculation(old)],asset:{id:'btc-bitcoin',name:'Bitcoin'}},{now,priorSources:parent.sources,priorCalculations:parent.calculations,searchImpl:async()=>({results:[]}),fetchImpl:async()=>assert.fail(),financeImpl:async()=>assert.fail()});
 assert.ok(r.bundle);assert.equal(r.bundle.calculations[0].inputs.priceUsd,20);assert.equal(r.bundle.calculations[0].value,40);
});
