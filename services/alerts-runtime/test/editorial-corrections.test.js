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

test('phone projection follows the gateway contact rule without masking financial observations or credentials',async()=>{
 const {redactPublicContacts}=await import('../src/jev-selector.js');
 const {isPublicClassificationText}=await import('../../jev-gateway/src/classification.js');
 for(const contact of ['+1 415 555 0100','+33 (0)1 23 45 67 89','01 23 45 67 89','security@example.org']){
  const raw=`The advisory has a concrete mitigation. Public contact: ${contact}.`;
  assert.equal(isPublicClassificationText(raw,1200),false);
  assert.equal(isPublicClassificationText(redactPublicContacts(raw),1200),true,contact);
 }
 const financial='Annual inflation is 3.8%, the deposit rate is 2.5%, and GDP grew +0.2%.';
 assert.equal(redactPublicContacts(financial),financial);
 const credential='Bearer '+'syntheticcredential'.repeat(3);
 assert.equal(isPublicClassificationText(redactPublicContacts(credential),1200),false,'gateway credential rejection preserved');
});
test('short Codex or Claude capacity allegations cost no providers; official resolved notices remain usable',()=>{
 for(const excerpt of ['Codex is down for everyone right now, status page says fine.','Claude errors with at capacity, anyone else seeing this?'])
  assert.equal(prefilter({...item,excerpt},{now:Date.parse(item.observedAt)}).reason,'SOURCE_EVIDENCE_INSUFFICIENT');
 const official={...item,url:'https://status.anthropic.com/incidents/example',excerpt:'We fixed the outage affecting API keys at 10:42 UTC.'};
 assert.equal(prefilter(official,{now:Date.parse(item.observedAt)}).decision,'select');
 const ordinary={...item,excerpt:'Codex processes the documented tasks. The database query runs at capacity in this benchmark.'};
 assert.equal(prefilter(ordinary,{now:Date.parse(item.observedAt)}).decision,'select');
});
