import test from'node:test';import assert from'node:assert/strict';
import{PILOT_CONTEXT,prefilter}from'../src/context.js';import{assessmentPrompt}from'../src/synthesis.js';import{createJevSelector}from'../src/jev-selector.js';
const item={producer:'sentinelle',scope:'public',topic:'system',url:'https://example.org/news',title:'Public incident',sourceStatus:'read',publishedAt:'2026-10-05T08:00:00Z',observedAt:'2026-10-05T09:00:00Z',readAt:'2026-10-05T09:00:00Z',excerpt:'GitHub down again? This could affect our deployments.'};
test('context distinguishes a default for future projects and the only measured strict provider budget',()=>{
 assert.match(PILOT_CONTEXT.facts.join(' '),/nouveaux projets/i);assert.match(PILOT_CONTEXT.facts.join(' '),/inventaire.+pas connu/i);
 assert.match(PILOT_CONTEXT.facts.join(' '),/ni plafonnés ni mesurés/);assert.doesNotMatch(PILOT_CONTEXT.facts.join(' '),/Les services payants sont mesurés/);
 assert.match(assessmentPrompt({...item,excerpt:'A detailed public mechanism verifies execution results.'}),/Pas de fait générique ni répété/);
});
test('short unattributed assertions are held locally; attributed official evidence and numeric observations stay usable',()=>{
 const filter=raw=>prefilter(raw,{now:Date.parse(item.observedAt)});
 assert.equal(filter(item).reason,'SOURCE_EVIDENCE_INSUFFICIENT');
 assert.equal(filter({...item,excerpt:'Selon la BCE, le taux de dépôt est maintenu.',topic:'finance',url:'https://www.ecb.europa.eu/press/pr/date/2026/html/example.html'}).decision,'select');
 assert.equal(filter({...item,producer:'finance-watch',excerpt:'EUR/USD relevé à 1.10 ; variation publique mesurée de 1 %.'}).decision,'select');
 // HTTPS/source metadata alone does not turn an unverified report into evidence.
 assert.equal(filter({...item,excerpt:'According to a source, GitHub is down.'}).reason,'SOURCE_EVIDENCE_INSUFFICIENT');
});
test('Jev projection removes public contacts before transport while retaining the original evidence',async()=>{
 let body;const excerpt='A public advisory gives verified details. Contact security@example.org for responsible disclosure.';
 const raw={...item,excerpt};const select=createJevSelector({token:'synthetic-token-'.repeat(4),fetchImpl:async(_url,options)=>{
  body=JSON.parse(options.body);return{ok:true,json:async()=>({question:'alerts.pertinence.mac-v3',context_version:PILOT_CONTEXT.version,decision:'review',confidence:.4,provider:'jev',request_id:'00000000-0000-4000-a000-000000000001'})};}});
 await select(raw);assert.doesNotMatch(body.excerpt,/@/);assert.match(body.excerpt,/contact public masqué/);assert.equal(raw.excerpt,excerpt);
 assert.equal(body.excerpt.length<=1200,true);
});
