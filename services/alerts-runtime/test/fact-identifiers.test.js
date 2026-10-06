import test from 'node:test';import assert from 'node:assert/strict';
import{renderBrief}from'../src/pipeline.js';

test('a refusal explains which check failed without retaining draft or source content',()=>{
 const source={...item,excerpt:'The image service has an SSRF vulnerability.'};
 for(const [value,check] of [
  [brief('Un fait public.','PRIVATE fabricated quotation'),'FACT_1_QUOTE_NOT_IN_SOURCE'],
  [brief('Le service corrige 42 failles.',source.excerpt),'FACT_1_NUMBER_NOT_IN_QUOTE'],
  [brief('Le service désactive AVIF.',source.excerpt),'FACT_1_IDENTIFIER_NOT_IN_QUOTE']]){
  assert.throws(()=>renderBrief(source,value),error=>error.code==='ALERT_FACT_UNSUPPORTED'&&error.validationChecks?.includes(check)&&!JSON.stringify(error).includes('PRIVATE'));
 }
});
const item={title:'Source',url:'https://example.org/source',producer:'sentinelle',publishedAt:'2026-10-05T08:00:00Z',excerpt:'Updates are available in v16.3.8 (Active LTS). The image service has an SSRF vulnerability. AVIF is disabled.'};
const brief=(summary,quote)=>({goal:'engineering',facts:[{summary,quote}],utility:'Vérifier si le projet est concerné.',action:'Consulter la version installée.'});
test('an acronym from another evidence passage cannot be added to the fact linked to a version quote',()=>{
 assert.throws(()=>renderBrief(item,brief('v16.3.8 corrige une SSRF.','Updates are available in v16.3.8 (Active LTS).')),{code:'ALERT_FACT_UNSUPPORTED'});
 assert.throws(()=>renderBrief(item,brief('Le service désactive AVIF.','The image service has an SSRF vulnerability.')),{code:'ALERT_FACT_UNSUPPORTED'});
 assert.doesNotThrow(()=>renderBrief(item,brief('Une vulnérabilité SSRF est décrite.','The image service has an SSRF vulnerability.')));
});
test('versions and advisory IDs must match the own quote with full token boundaries',()=>{
 for(const [summary,quote]of[['Correctif v16.3.8.','Version 16.3.8 is unrelated.'],['Correctif CVE-2026-123.','CVE-2026-1234 is patched.'],['Correctif GHSA-abcd-efgh-1234.','GHSA-abcd-efgh-5678 is patched.']])
  assert.throws(()=>renderBrief({...item,excerpt:quote},brief(summary,quote)),{code:'ALERT_FACT_UNSUPPORTED'});
 const quote='CVE-2026-1234 and GHSA-abcd-efgh-1234 affect v16.3.8.';
 assert.doesNotThrow(()=>renderBrief({...item,excerpt:quote},brief('v16.3.8 est concernée par CVE-2026-1234 et GHSA-abcd-efgh-1234.',quote)));
});
test('ordinary prose, French translated institutions and quoted acronym casing remain usable',()=>{
 const quote='The ECB publishes inflation data about AI services.';
 assert.doesNotThrow(()=>renderBrief({...item,excerpt:quote},brief('La BCE publie des données sur les services d’IA.',quote)));
 assert.doesNotThrow(()=>renderBrief({...item,excerpt:'SSRf is described.'},brief('Une SSRF est décrite.','SSRf is described.')));
});

test('model names and protocol versions are matched whole, never as a prefix',()=>{
 for(const id of ['GPT-6','GLM-5.3','HTTP/2','GPT-6-mini','SSRFs']){
  const quote=`The ${id} release is available.`;
  assert.doesNotThrow(()=>renderBrief({...item,excerpt:quote},brief(`${id} est disponible.`,quote)),id);
 }
 for(const [id,quoted]of [['GLM-5.3','GLM-5.30'],['GPT-6','GPT-6-mini'],['HTTP/2','HTTP/20']]){
  const quote=`The ${quoted} release has 2 changes.`;
  assert.throws(()=>renderBrief({...item,excerpt:quote},brief(`${id} est disponible.`,quote)),{code:'ALERT_FACT_UNSUPPORTED'});
 }
});
test('closed translated economic identifiers keep their own evidence and cannot borrow from another passage',()=>{
 for(const [fr,en]of [['IPCH','HICP'],['PIB','GDP'],['FMI','IMF'],['UE','EU']]){
  const quote=`The ${en} report is available.`;
  assert.doesNotThrow(()=>renderBrief({...item,excerpt:quote},brief(`Le rapport ${fr} est disponible.`,quote)));
 }
 const excerpt='HICP inflation is measured. The IMF publishes a separate report.';
 assert.throws(()=>renderBrief({...item,excerpt},brief('Le FMI mesure l’IPCH.','HICP inflation is measured.')),{code:'ALERT_FACT_UNSUPPORTED'});
});
