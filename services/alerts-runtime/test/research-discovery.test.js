import test from 'node:test';import assert from 'node:assert/strict';import {buildResearchBundle} from '../src/research-discovery.js';
import {researchHash} from '../src/research-contract.js';
const now=new Date('2026-10-16T20:00:00Z');
test('asset identity survives enrichment and search snippets never become quoted sources',async()=>{
 const text=JSON.stringify({metrics:{priceUsd:10,maxSupply:20}}),s={id:'market',url:'https://prices.org/asset',title:'Token market',text,readAt:now.toISOString(),publishedAt:now.toISOString(),kind:'market-data',sha256:researchHash(text)};
 const seed={topic:'finance',category:'asset',anchorUrl:'https://prices.org/project',title:'Token project',text:'Seed',sources:[s],asset:{name:'Token',officialWebsite:'https://project.org/'},calculations:[]};
 const r=await buildResearchBundle(seed,{now,searchImpl:async()=>({results:[{url:'https://hype.org/token',title:'Token will grow 999 percent'}]}),fetchImpl:async url=>({url,contentType:'text/html',readAt:now.toISOString(),text:'<title>Token docs</title><article>'+('The project documents token governance and describes that holders do not own its business revenue. ').repeat(3)+'</article>'})});
 assert.equal(r.bundle.category,'asset');assert.ok(!JSON.stringify(r.bundle).includes('999'));assert.equal(r.bundle.sources[1].publishedAt,null);
});
test('failed search and unread pages remain coverage failures, not evidence of no opportunity',async()=>{
 const seed={topic:'business',category:'business',anchorUrl:'https://example.org/pain',title:'An actual problem',text:'The customer cannot use the purchased service.',readAt:now.toISOString(),publishedAt:null};
 const r=await buildResearchBundle(seed,{now,searchImpl:async()=>({results:[],error_code:'PUBLIC_RESEARCH_SEARCH_CHALLENGE'}),fetchImpl:async()=>assert.fail()});
 assert.equal(r.bundle,null);assert.ok(r.coverage.errors.some(e=>e.code==='PUBLIC_RESEARCH_SEARCH_CHALLENGE'));
});
test('requested macro topic and current month drive search, while the request is not a source',async()=>{
 const queries=[],seed={topic:'finance',category:'macro',sourceType:'request',anchorUrl:'https://duckduckgo.com/?q=inflation+Japan',title:'inflation Japan',text:'not evidence',readAt:now.toISOString(),publishedAt:null};
 const r=await buildResearchBundle(seed,{now:new Date('2026-12-02T10:00:00Z'),searchImpl:async q=>{queries.push(q);return {results:[]};},fetchImpl:async()=>assert.fail()});
 assert.equal(r.bundle,null);assert.equal(r.coverage.sources,0);assert.ok(queries.every(q=>q.includes('inflation Japan')));assert.match(queries[0],/December 2026/);
});
