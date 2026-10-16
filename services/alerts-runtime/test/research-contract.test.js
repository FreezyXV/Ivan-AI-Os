import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {sealBundle,validateResearchReport,reportBinding,validateResearchReview,renderResearchMessage} from '../src/research-contract.js';
const hash=v=>createHash('sha256').update(v).digest('hex');
const source=(id,url,text)=>({id,url,title:id,readAt:'2026-10-16T21:00:00Z',publishedAt:null,kind:'page',text,sha256:hash(text)});
const raw={topic:'business',title:'Une douleur à vérifier',anchorUrl:'https://example.org/pain',sources:[
 source('pain','https://example.org/pain','Our shop loses confirmed orders when the cache serves another customer session.'),
 source('docs','https://docs.vendor.org/cache','Exclude the cart and checkout from page caching. This procedure does not fix external proxies.')],calculations:[]};
const draft={category:'business',title:'Vérifier les erreurs de cache des boutiques',facts:[{summary:'Un commerce décrit des commandes perdues lors de la mise en cache.',source_id:'pain',evidence_index:0}],
 thesis:'Hypothèse : un diagnostic des proxys pourrait résoudre un blocage des boutiques.',whyNow:'Le problème empêche de traiter les commandes.',
 counterargument:'La configuration de cache existante peut déjà suffire.',unknowns:['Fréquence et demande indépendante inconnues.'],
 nextStep:'Comparer la configuration documentée avec les témoignages publics.',invalidation:'La procédure existante résout entièrement les cas observés.',horizon:'short',valuation:'non estimable'};
export const fixture=()=>({bundle:sealBundle(raw),draft});
test('research uses read pages, multiple publishers and exact source references',()=>{
 const {bundle,draft}=fixture(),report=validateResearchReport(bundle,draft);
 assert.equal(report.facts[0].quote,raw.sources[0].text);assert.match(renderResearchMessage(bundle,report),/Avocat du diable/);
 assert.throws(()=>sealBundle({...raw,sources:[raw.sources[0],{...raw.sources[0],id:'copy',url:'https://other.org/copy'}]}));
 assert.throws(()=>validateResearchReport(bundle,{...draft,facts:[{summary:'Le commerce perd 99 commandes.',source_id:'pain',evidence_index:0}]}));
 assert.throws(()=>validateResearchReport(bundle,{...draft,facts:[{summary:'Affirmation.',source_id:'invented',evidence_index:0}]}));
});
test('a good-looking investment report cannot fabricate a price, a fair valuation or omit its bear case',()=>{
 const {bundle,draft}=fixture();
 for(const patch of [{counterargument:''},{valuation:'acheter à 42 euros'},{horizon:'always'}, {title:'Faire 100 %'}])assert.throws(()=>validateResearchReport(bundle,{...draft,...patch}));
});
test('independent reviewer may refuse and its receipt must bind the actual report and evidence',()=>{
 const {bundle,draft}=fixture(),report=validateResearchReport(bundle,draft),binding=reportBinding(bundle,report);
 assert.equal(validateResearchReview(bundle,report,{decision:'research',strongestCounterargument:'La procédure de cache existe déjà ; le besoin résiduel reste à démontrer.',issues:['INSUFFICIENT_EVIDENCE'],binding}).decision,'research');
 assert.throws(()=>validateResearchReview(bundle,report,{decision:'approve',strongestCounterargument:'À vérifier.',issues:[],binding:'0'.repeat(64)}));
 assert.throws(()=>validateResearchReview(bundle,report,{decision:'approve',strongestCounterargument:'',issues:[],binding}));
});
test('a calculation cannot omit its inputs or turn missing supply into a zero valuation',()=>{
 const data=JSON.stringify({metrics:{priceUsd:10,maxSupply:null}}),market={...source('market','https://prices.org/token',data),kind:'market-data'};
 for(const inputs of [{},{priceUsd:10,maxSupply:0}])assert.throws(()=>sealBundle({...raw,sources:[market,raw.sources[0]],
  calculations:[{id:'fdvUsd',formula:'priceUsd * maxSupply',inputs,value:0,sourceSha256:market.sha256}]}));
 const bundle=sealBundle({...raw,sources:[market,raw.sources[0]],calculations:[{id:'fdvUsd',formula:'priceUsd * maxSupply',inputs:{priceUsd:10,maxSupply:null},value:null,sourceSha256:market.sha256}]});
 assert.equal(bundle.calculations[0].value,null);
});
test('scientific and decimal prices agree, but changing dollars into euros is unsupported',()=>{
 const {draft}=fixture(),text='The token price is 1e-7 USD, observed publicly.';
 const bundle=sealBundle({...raw,sources:[source('price','https://prices.org/token',text),raw.sources[1]]});
 const report=validateResearchReport(bundle,{...draft,facts:[{summary:'Le cours observé est de 0,0000001 USD.',source_id:'price',evidence_index:0}]});
 assert.equal(report.facts.length,1);
 assert.throws(()=>validateResearchReport(bundle,{...draft,facts:[{summary:'Le cours observé est de 0,0000001 euro.',source_id:'price',evidence_index:0}]}),{code:'RESEARCH_FACT_UNSUPPORTED'});
});
