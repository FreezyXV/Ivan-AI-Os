import test from 'node:test';import assert from 'node:assert/strict';
import{renderBrief}from'../src/pipeline.js';
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
