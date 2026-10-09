import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,readdirSync,rmSync,realpathSync,symlinkSync,unlinkSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {openLedger} from '../src/ledger.js';
import {openDossiers} from '../../../shared/opportunity-dossier.mjs';
import {handleOpportunityCommand} from '../../../hooks/openclaw/ivan-opportunities/command.js';
import {createOpportunityProjection} from '../src/opportunity-projection.js';
import {briefBinding} from '../src/verification.js';
import {renderBrief} from '../src/pipeline.js';
import {sendDigest} from '../src/digest.js';
const now=Date.parse('2026-10-09T10:00:00Z');
function setup(t){
  const dir=mkdtempSync(path.join(realpathSync(os.tmpdir()),'ivan-opportunity-'));
  const vaultPath=path.join(dir,'vault');mkdirSync(vaultPath);mkdirSync(path.join(vaultPath,'.obsidian'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  return {dir,config:{directory:path.join(dir,'store'),vaultPath,ownerId:'123456789',accountId:'default'}};
}
function fixture(){
  const item={producer:'public-research',scope:'public',topic:'business',url:'https://example.org/buyer-evidence',title:'Synthetic customer friction — test only',
    publishedAt:'2026-10-09T09:00:00Z',observedAt:'2026-10-09T10:00:00Z',readAt:'2026-10-09T10:00:00Z',sourceStatus:'read',
    excerpt:'Our team spends hours reviewing generated code for duplicate modules. Existing reviewers miss architecture problems.'};
  const proposal={goal:'business',facts:[{summary:'Une équipe décrit une revue coûteuse du code généré.',quote:item.excerpt}],
    utility:'Explorer un besoin des équipes qui relisent du code généré.',action:'Chercher des preuves publiques indépendantes.',
    business_fiche:{sujet:'revue-code-genere',probleme:'Une équipe décrit une revue coûteuse du code généré.',acheteur:{profil:'Équipes utilisant du code généré',statut:'hypothèse'},
    preuves:[{url:item.url,date:'2026-10-09',type:'douleur',citation:item.excerpt}],sourcesDistinctes:1,
    objections:['Hypothèse : les outils existants peuvent déjà suffire.'],hypothese:'Hypothèse : les équipes pourraient avoir besoin d’une revue structurée.',
    prochainTest:{description:'Chercher des témoignages publics indépendants sur ce besoin.',dureeJours:3,coutEur:0,reversible:true,contactTiers:false},decision:'exploratoire',limites:'Un témoignage seulement ; aucun paiement observé.'}};
  return {id:createHash('sha256').update(item.url).digest('hex'),item,state:'ready',brief:{...proposal,message:renderBrief(item,proposal),
    verification:{decision:'approve',issues:[],binding:briefBinding(item,proposal)}}};
}
const native=(args)=>({channel:'telegram',isAuthorizedSender:true,senderId:'123456789',from:'telegram:123456789',accountId:'default',args});
test('the native plugin loader can require its command module synchronously',()=>{
  assert.equal(typeof createRequire(import.meta.url)('../../../hooks/openclaw/ivan-opportunities/command.js').handleOpportunityCommand,'function');
});
test('qualified card → immutable Obsidian → one Telegram delivery → native human choice → updated card, after restart',async t=>{
  const {dir,config}=setup(t),source=fixture();let store=openDossiers({...config,now:()=>now});
  const first=store.publish(source),file=path.join(config.vaultPath,first.note),original=readFileSync(file,'utf8');
  assert.match(original,/charge de travail non estimée/);assert.match(original,/aucun paiement/);
  assert.match(original,/Choix : en attente/);assert.equal(first.revision,0);
  store.publish(source);assert.equal(readdirSync(path.dirname(file)).length,1);
  const ledger=openLedger(path.join(dir,'queue','alerts.sqlite'),{now:()=>now});t.after(()=>ledger.close());
  ledger.ingest(source.item);const job=ledger.claim();ledger.finish(job.id,job.owner,{state:'ready',reason:'BRIEF_VERIFIED',brief:source.brief});
  let sends=0;
  const deliver=async({text})=>{assert.ok(readFileSync(file,'utf8'));assert.match(text,new RegExp(first.id));sends++;return{delivered:true,messageId:'synthetic-1'};};
  const args={ledger,key:'digest:opportunity:test',deliver,now,prepareRow:createOpportunityProjection(config)};
  await sendDigest(args);await sendDigest(args);assert.equal(sends,1);store.close();
  const response=await handleOpportunityCommand(native(`${first.id} tester Je veux vérifier ce besoin sans contacter personne.`),config,'decide');
  assert.match(response.text,/Décision enregistrée/);
  store=openDossiers(config);assert.equal(store.get(first.id).decisions.length,1);
  const updated=store.project(first.id);assert.equal(updated.revision,1);
  assert.match(readFileSync(path.join(config.vaultPath,updated.note),'utf8'),/Je veux vérifier ce besoin/);
  assert.equal(readFileSync(file,'utf8'),original,'initial card and user notes remain untouched');
  store.close();
  await handleOpportunityCommand(native(`${first.id} tester Je veux vérifier ce besoin sans contacter personne.`),config,'decide');
  store=openDossiers(config);assert.equal(store.get(first.id).decisions.length,1,'duplicate command is idempotent');store.close();
});
test('notes, agent calls, groups, strangers and another bot cannot impersonate an Ivan decision',async t=>{
  const {config}=setup(t),source=fixture(),store=openDossiers(config);const {id}=store.publish(source);store.close();
  const args=`${id} tester Ceci est un test.`;
  for(const changes of [{isAuthorizedSender:false},{senderId:'999'},{from:'telegram:group:-123'},{accountId:'sentinelle'},
    {channel:'webchat'},{messageThreadId:1},{threadParentId:'group'}, {senderId:undefined}]){
    const r=await handleOpportunityCommand({...native(args),...changes},config,'decide');assert.match(r.text,/réservée/);
  }
  const check=openDossiers(config);assert.equal(check.get(id).decisions.length,0);check.close();
});
test('a modified user note is preserved, and later choices produce new versions',t=>{
  const {config}=setup(t),store=openDossiers(config),source=fixture(),r=store.publish(source);
  const file=path.join(config.vaultPath,r.note);writeFileSync(file,'My personal annotations');
  assert.throws(()=>store.publish(source),{code:'DOSSIER_NOTE_CONFLICT'});
  const choice=store.decide(r.id,'veille','Il manque des preuves.');assert.equal(choice.projected,true);
  assert.deepEqual(store.summary().choices,{veille:1});assert.equal(store.summary().nativeCostEur,null);
  assert.equal(readFileSync(file,'utf8'),'My personal annotations');store.close();
});
test('projection interrupted after durable choice can resume without duplicate or lost choice',t=>{
  const {config}=setup(t),store=openDossiers(config),r=store.publish(fixture());
  const file=path.join(config.vaultPath,`Ivan AI OS/inbox/opportunite-${r.id}-v1.md`);writeFileSync(file,'user-owned content');
  const pending=store.decide(r.id,'ecarter','Besoin insuffisamment prouvé.');assert.equal(pending.projected,false);
  assert.equal(store.get(r.id).decisions.length,1);assert.equal(readFileSync(file,'utf8'),'user-owned content');
  unlinkSync(file);assert.equal(store.decide(r.id,'ecarter','Besoin insuffisamment prouvé.').projected,true);
  assert.equal(store.get(r.id).decisions.length,1);store.close();
});
test('projection failure blocks only that Business item and never loses an ordinary alert',async t=>{
  const {dir,config}=setup(t),source=fixture();const ledger=openLedger(path.join(dir,'queue','alerts.sqlite'),{now:()=>now});t.after(()=>ledger.close());
  ledger.ingest(source.item);let job=ledger.claim();ledger.finish(job.id,job.owner,{state:'ready',reason:'BRIEF_VERIFIED',brief:source.brief});
  const other={...source.item,url:'https://example.org/engineering',topic:'engineering'};
  ledger.ingest(other);job=ledger.claim();ledger.finish(job.id,job.owner,{state:'ready',reason:'BRIEF_VERIFIED',brief:{message:'A verified ordinary alert'}});
  let sends=0;const r=await sendDigest({ledger,key:'digest:failure:test',now,prepareRow:createOpportunityProjection(),deliver:async({text})=>{
    assert.equal(text.includes('Synthetic customer'),false);sends++;return {delivered:true,messageId:'synthetic-2'};}});
  assert.equal(sends,1);assert.equal(r.error_code,'DOSSIER_PROJECTION_FAILED');assert.equal(r.projectionErrors[0].code,'DOSSIER_NOT_CONFIGURED');
  assert.equal(ledger.get(source.id).state,'ready');assert.equal(r.remaining,1);
});
test('unreviewed or altered evidence, credentials and linked vault folders are refused',t=>{
  const {dir,config}=setup(t),store=openDossiers(config);
  const altered=fixture();delete altered.brief.verification;assert.throws(()=>store.publish(altered),{code:'DOSSIER_REVIEW_REQUIRED'});
  const changed=fixture();changed.brief.utility='Another meaning';changed.brief.message=renderBrief(changed.item,changed.brief);
  assert.throws(()=>store.publish(changed),{code:'DOSSIER_REVIEW_REQUIRED'});
  const r=store.publish(fixture());assert.throws(()=>store.decide(r.id,'tester','Bearer '+'a'.repeat(30)),{code:'DOSSIER_DECISION_INVALID'});store.close();
  const other=path.join(dir,'other');mkdirSync(other);const bad=path.join(config.vaultPath,'Ivan AI OS','linked');symlinkSync(other,bad);
  assert.throws(()=>openDossiers({...config,vaultPath:bad}),{code:'DOSSIER_PATH_INVALID'});
});
