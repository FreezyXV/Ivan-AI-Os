import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readdirSync,unlinkSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {openLedger} from '../src/ledger.js';
import {processNext} from '../src/pipeline.js';
import {sendDigest} from '../src/digest.js';
import {createSynthesisTool} from '../../../hooks/openclaw/ivan-alerts/tool.js';
import {validateBusinessFiche} from '../src/business-fiche.js';
import {createRequire} from 'node:module';
const now=Date.parse('2026-10-06T10:00:00Z');
const item={producer:'hacker-news-public',scope:'public',topic:'business',url:'https://news.ycombinator.com/item?id=100',title:'Ask HN: Reviewing generated code',
 publishedAt:new Date(now-3600000).toISOString(),observedAt:new Date(now).toISOString(),readAt:new Date(now).toISOString(),sourceStatus:'read',excerpt:'Our team spends hours reviewing generated code for duplicate modules. Existing reviewers miss architecture problems.'};
const brief={goal:'business',facts:[{summary:'Une équipe décrit une revue coûteuse du code généré.',evidence_index:0}],utility:'Étudier une douleur précise de revue du code.',action:'Comparer localement les méthodes de revue.'};
const fiche={sujet:'revue-code-genere',probleme:'Une équipe décrit une revue coûteuse du code généré.',acheteur:{profil:'Équipes utilisant du code généré',statut:'hypothèse'},
 preuves:[{type:'douleur',evidence_index:0}],objections:['Hypothèse : les outils existants peuvent déjà suffire.'],hypothese:'Hypothèse : une revue structurée pourrait réduire cette difficulté.',
 prochainTest:{description:'Comparer localement les méthodes de revue sur un exemple public.',dureeJours:3,coutEur:0,reversible:true,contactTiers:false},decision:'exploratoire',limites:'Un seul témoignage ; aucun paiement observé.'};
test('OpenClaw can synchronously load the plugin factory without evaluating asynchronous engine CLI modules',()=>{
 assert.equal(typeof createRequire(import.meta.url)('../../../hooks/openclaw/ivan-alerts/tool.js').createSynthesisTool,'function');
});
test('one Business completion reaches the common digest with a validated fiche and never repeats after resume',async t=>{
 const directory=mkdtempSync(path.join(os.tmpdir(),'ivan-business-'));let clock=now,ledger=openLedger(path.join(directory,'alerts.sqlite'),{now:()=>clock});
 t.after(()=>{ledger.close();rmSync(directory,{recursive:true,force:true});});let calls=0,sends=0;
 const tool=createSynthesisTool({agentId:'ivan-system'},{complete:async()=>{calls++;return{text:JSON.stringify({decision:'keep',brief:{...brief,business_fiche:fiche}})};}});
 const assess=async source=>{const d=(await tool.execute('one',{item:source,purpose:'assessment'})).details;assert.equal(d.status,'READY');return{decision:d.decision,brief:d.brief};};
 ledger.ingest(item);const r=await processNext({ledger,now,assessmentAfterSelection:true,select:async()=>({decision:'keep',confidence:0.9}),assess});
 assert.equal(r.state,'ready');assert.equal(r.brief.business_fiche.sourcesDistinctes,1);
 assert.deepEqual(r.brief.businessEditorialWarnings.sort(),['HYPOTHESE_SANS_MARCHE','TEST_SANS_RECHERCHE_DE_PREUVE']);
 assert.match(r.brief.message,/Acheteur envisagé/);assert.match(r.brief.message,/Hypothèse/);assert.match(r.brief.message,/3 jours/);
 assert.equal(r.brief.business_fiche.preuves[0].citation,item.excerpt.split('. ')[0]+'.');
 const deliver=async()=>{sends++;return{delivered:true,messageId:'test-business-receipt'};};
 await sendDigest({ledger,key:'digest:business:test',deliver,now});await sendDigest({ledger,key:'digest:business:test',deliver,now});
 await processNext({ledger,now,select:async()=>assert.fail(),assess:async()=>assert.fail()});
 assert.equal(calls,1);assert.equal(sends,1);assert.equal(ledger.get(r.id).state,'delivered');
 assert.deepEqual(ledger.businessSummary(),{validatedFiches:1,scoredFiches:0});
 ledger.close();ledger=openLedger(path.join(directory,'alerts.sqlite'),{now:()=>clock});
 assert.equal(ledger.get(r.id).brief.businessEditorialWarnings.length,2,'editorial warnings survive restart alongside the receipt');
 assert.deepEqual(ledger.businessSummary(),{validatedFiches:1,scoredFiches:0});
 assert.equal(ledger.businessFiches()[0].fiche.acheteur.statut,'hypothèse');
 await sendDigest({ledger,key:'digest:business:test',deliver,now});assert.equal(sends,1);
 clock+=31*86400000;assert.equal(ledger.archiveTerminal().archived,1);
 const archive=path.join(directory,'archive');for(const file of readdirSync(archive))unlinkSync(path.join(archive,file));
 assert.deepEqual(ledger.businessSummary(),{validatedFiches:1,scoredFiches:0});
 assert.equal(ledger.businessFiches().length,1,'Business record survives a missing source archive without rereading it');
});

test('Business content cannot fabricate proof, private fit, payment or a recommendation',async()=>{
 for(const mutate of [f=>f.preuves[0].evidence_index=99,f=>f.preuves[0].url='https://example.org/foreign',
  f=>f.prochainTest.reversible=false,f=>f.decision='lancer',f=>f.hypothese='Une offre à 999999 euros disponible.',
  f=>f.preuves[0].citation='']){
  const f=structuredClone(fiche);mutate(f);
  // A literal empty quote must not be silently replaced by an index.
  if(f.preuves[0].citation==='')delete f.preuves[0].evidence_index;
  const tool=createSynthesisTool({agentId:'ivan-system'},{complete:async()=>({text:JSON.stringify({decision:'keep',brief:{...brief,business_fiche:f}})})});
  const rejected=(await tool.execute('bad',{item,purpose:'assessment'})).details;
  assert.equal(rejected.status,'UNAVAILABLE');
  if(f.decision==='lancer')assert.ok(rejected.validation_checks.includes('DECISION_SANS_RESULTAT_MOTEUR'));
 }
});

test('the bridge recalculates real public score inputs and rejects invented payment or profile evidence',()=>{
 const bound={...structuredClone(fiche),sourcesDistinctes:1,preuves:[{url:item.url,date:item.publishedAt.slice(0,10),type:'douleur',citation:item.excerpt}],
  moteur:{source:'signals.mjs#scoreOpportunity',entree:{sujet:fiche.sujet,cible:fiche.acheteur.profil,douleur:fiche.probleme,jours_premier_euro:30,
   criteres:Object.fromEntries(['demande','paiement','concurrence','fit','delai_mvp','cout_acquisition'].map(k=>[k,{note:k==='paiement'?0:1}]))}},decision:'abandon',scoreCode:5};
 assert.equal(validateBusinessFiche(item,bound).score.total,5);
 bound.scoreCode=30;assert.throws(()=>validateBusinessFiche(item,bound),{code:'ALERT_BUSINESS_FICHE_INVALID'});
 bound.scoreCode=6;bound.moteur.entree.criteres.paiement.note=1;
 assert.throws(()=>validateBusinessFiche(item,bound),{code:'ALERT_BUSINESS_FICHE_INVALID'});
 bound.scoreCode=7;bound.moteur.entree.criteres.paiement.note=0;bound.moteur.entree.criteres.fit={note:3,preuve:'profil'};
 assert.throws(()=>validateBusinessFiche(item,bound),{code:'ALERT_BUSINESS_FICHE_INVALID'});
});
