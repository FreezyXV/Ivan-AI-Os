import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {financeCycle,businessCycle,businessHasPendingEvidence,collectFinance} from '../src/engines.js';
import {signalId} from '../../../skills/business-engine/scripts/signals.mjs';
import {scheduleSlots} from '../src/schedule.js';
const now=new Date('2026-10-05T10:00:00Z');
function folder(t){const dir=mkdtempSync(path.join(os.tmpdir(),'ivan-engine-recovery-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));return dir;}
function indicator(id,valeur,date_obs='2026-10-05'){
 return {id,valeur,date_obs,libelle:id,unite:'%',cadence:id==='bce_taux_depot'?'evenement':'mois',
  source:'https://data-api.ecb.europa.eu/service/data/HICP/M.U2.N.000000.4D0.ANR?lastNObservations=1'};
}
async function financeFixture(t,{prior,current,judgeImpl,useJev=true}){
 const dir=folder(t);mkdirSync(path.join(dir,'snapshots'),{mode:0o700});
 writeFileSync(path.join(dir,'snapshots','2026-10-04.json'),JSON.stringify({date:'2026-10-04',indicateurs:prior}),{mode:0o600});
 const ingested=[];
 const result=await financeCycle({directory:dir,now,ledger:{ingest:item=>{ingested.push(item);return {duplicate:false};}},
  collectImpl:async()=>({version:1,date:'2026-10-05',collecte_le:now.toISOString(),indicateurs:current,erreurs:[]}),judgeImpl,useJev});
 return {result,ingested};
}
test('a missing importance opinion preserves the changed public fact for common selection and exposes retry work',async t=>{
 const {result,ingested}=await financeFixture(t,{prior:[indicator('bce_taux_depot',2)],current:[indicator('bce_taux_depot',2.25)],judgeImpl:async list=>list});
 assert.equal(result.pendingDecisions,1);assert.equal(result.decisionErrors,1);assert.equal(ingested.length,1);
 assert.match(ingested[0].excerpt,/2 % → 2.25 %/);assert.equal(ingested[0].sourceStatus,'read');
 assert.equal(ingested[0].decision,undefined);assert.equal(ingested[0].importance,undefined);
});
test('importance service exceptions remain visible without discarding factual threshold changes',async t=>{
 const {result,ingested}=await financeFixture(t,{prior:[indicator('bce_taux_depot',2)],current:[indicator('bce_taux_depot',2.25)],judgeImpl:async()=>{throw Error('unavailable');}});
 assert.equal(result.pendingDecisions,1);assert.equal(ingested.length,1);
});
test('native mode collects changed public Finance facts without an unqualified Jev opinion',async t=>{
 const {result,ingested}=await financeFixture(t,{useJev:false,prior:[indicator('bce_taux_depot',2)],current:[indicator('bce_taux_depot',2.25)],
  judgeImpl:async()=>assert.fail('no obligatory Jev importance call')});
 assert.equal(ingested.length,1);assert.equal(result.pendingDecisions,0);
 assert.equal(result.classificationMode,'deterministic-observations');
});
test('changed inflation and treasury observations enter selection while unchanged or initial values stay silent',async t=>{
 const {result,ingested}=await financeFixture(t,{prior:[indicator('inflation_zone_euro',2.2,'2026-08'),indicator('us_10_ans',4.1,'2026-10-02')],
  current:[indicator('inflation_zone_euro',2.3,'2026-09'),indicator('us_10_ans',4.2,'2026-10-05'),indicator('inflation_sous_jacente',2.4,'2026-09')],judgeImpl:async list=>list});
 assert.equal(result.macroCandidates,2);assert.equal(result.pendingDecisions,0);assert.equal(ingested.length,2);
 const unchanged=await financeFixture(t,{prior:[indicator('inflation_zone_euro',2.3,'2026-09')],current:[indicator('inflation_zone_euro',2.3,'2026-09')],judgeImpl:async list=>list});
 assert.equal(unchanged.ingested.length,0);
});
test('obsolete observations and an explicit routine opinion are not promoted',async t=>{
 const {result,ingested}=await financeFixture(t,{prior:[indicator('inflation_zone_euro',2.1,'2026-05'),indicator('bce_taux_depot',2)],
  current:[indicator('inflation_zone_euro',2.2,'2026-06'),indicator('bce_taux_depot',2.25)],
  judgeImpl:async list=>list.map(a=>a.niveau==='important'?{...a,jev:0.1,niveau:'info'}:a)});
 assert.equal(result.stale,1);assert.equal(result.pendingDecisions,0);assert.equal(ingested.length,0);
});
function businessItem(i){return {url:`https://news.ycombinator.com/item?id=${i}`,topic:'business',sourceStatus:'read',
 title:`Ask HN: verified public demand ${i}`,publishedAt:'2026-10-05T09:00:00Z',excerpt:`A public request describing an observed difficulty ${i}.`};}
test('already triaged candidates are removed before the four-item limit',async t=>{
 const dir=folder(t),items=Array.from({length:6},(_,i)=>businessItem(i+1));
 writeFileSync(path.join(dir,'jev.jsonl'),items.slice(0,4).map(item=>JSON.stringify({id:signalId(item),pertinent:0.9})).join('\n')+'\n',{mode:0o600});
 const ledger={list:state=>state==='review'?items.map(item=>({item})):[]};let seen=[];
 assert.equal(businessHasPendingEvidence(ledger,dir),true);
 const r=await businessCycle({directory:dir,ledger,now,triageImpl:async staging=>{
  const signals=readFileSync(path.join(staging,'signals.jsonl'),'utf8').trim().split('\n').map(JSON.parse);seen=signals.map(s=>s.url);
  writeFileSync(path.join(staging,'jev.jsonl'),signals.map(s=>JSON.stringify({id:s.id,pertinent:0.8})).join('\n')+'\n',{mode:0o600});return {tries:signals.length,en_attente_jev:0};
 }});
 assert.deepEqual(seen,items.slice(4).map(i=>i.url));assert.equal(r.triaged,2);assert.equal(r.pendingDecisions,0);
 assert.equal(businessHasPendingEvidence(ledger,dir),false);assert.equal(r.opportunity_scores_created,0);
});
test('failed business decisions remain pending and never appear as successful triage',async t=>{
 const dir=folder(t),ledger={list:state=>state==='pending'?[{item:businessItem(1)},{item:businessItem(2)}]:[]};
 const r=await businessCycle({directory:dir,ledger,now,triageImpl:async()=>({tries:0,en_attente_jev:2})});
 assert.equal(r.triaged,0);assert.equal(r.decisionErrors,2);assert.equal(r.pendingDecisions,2);
 assert.equal(businessHasPendingEvidence(ledger,dir),true);assert.equal(r.payment_evidence_invented,false);
});
test('native mode retains Business evidence without paying a separate unqualified triage',async t=>{
 const dir=folder(t),ledger={list:state=>state==='pending'?[{item:businessItem(1)}]:[]};
 const r=await businessCycle({directory:dir,ledger,now,useJev:false,triageImpl:async()=>assert.fail('no duplicated Jev triage')});
 assert.equal(r.triaged,0);assert.equal(r.pendingEditorial,1);assert.equal(r.pendingDecisions,0);
 assert.equal(r.classificationMode,'native-editorial-queue');assert.equal(r.payment_evidence_invented,false);
});
test('a missed Monday is caught up once in the current ISO week and never expands past weeks',()=>{
 assert.equal(scheduleSlots(new Date('2026-10-05T06:59:00Z')).business,undefined);
 const monday=scheduleSlots(new Date('2026-10-05T07:00:00Z')).business;
 assert.equal(monday,'business:2026-W41');
 assert.equal(scheduleSlots(new Date('2026-10-06T10:00:00Z')).business,monday);
 assert.equal(scheduleSlots(new Date('2026-10-11T10:00:00Z')).business,monday);
 assert.equal(scheduleSlots(new Date('2026-10-12T10:00:00Z')).business,'business:2026-W42');
 assert.equal(scheduleSlots(new Date('2027-01-01T10:00:00Z')).business,'business:2026-W53');
});
test('the integrated Kraken parser selects the same last close with a cursor, a zero cursor, or no cursor',async()=>{
 const rows=Array.from({length:33},(_,i)=>[Date.parse('2026-09-01T00:00:00Z')/1000+i*86400,'0','0','0',String(i===32?999:100+i)]);
 for(const last of [rows[31][0],0,undefined]){
  const result=await collectFinance(async url=>url.includes('api.kraken.com')?
   {ok:true,text:async()=>JSON.stringify({error:[],result:{PAIR:rows,...(last===undefined?{}:{last})}})}:{ok:false,status:404},now);
  for(const id of ['btc_eur','eth_eur']){
   const i=result.indicateurs.find(i=>i.id===id);assert.equal(i?.valeur,131);assert.equal(i?.date_obs,'2026-10-02');
  }
  assert.equal(rows.length,33,'the caller response was not destructively edited');
 }
});
