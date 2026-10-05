import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,mkdirSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {openLedger} from '../src/ledger.js';
import {runCycle} from '../../../scripts/mac-alerts-cycle.mjs';
import {modernFinanceUrl,collectFinance,financeCycle,businessCycle,observationUrl} from '../src/engines.js';
const now=new Date('2026-10-05T10:00:00Z');
function fixture(t){const dir=mkdtempSync(path.join(os.tmpdir(),'ivan-cycle-')),ledger=openLedger(path.join(dir,'alerts.sqlite'));
 t.after(()=>{ledger.close();rmSync(dir,{recursive:true,force:true});});return {dir,ledger};}
test('Mac resume runs only present slots and a second process cannot replay collections or spend',async t=>{
 const {dir,ledger}=fixture(t);let calls=0;
 const options={ledger,settings:{stateDir:dir},now,feeds:async()=>{calls++;return{};},finance:async()=>{calls++;return{};},business:async()=>{calls++;return{};},select:async()=>assert.fail(),synthesize:async()=>assert.fail(),deliver:async()=>assert.fail()};
 await runCycle(options);assert.equal(calls,3);await runCycle(options);assert.equal(calls,3);assert.equal(ledger.cycleStatus().filter(r=>r.status==='done').length,4);
});
test('fresh Finance baseline records public data while missing importance evidence cannot enqueue an alert',async t=>{
 const {dir,ledger}=fixture(t);mkdirSync(path.join(dir,'snapshots'),{mode:0o700});
 const result=await financeCycle({ledger,directory:dir,now,collectImpl:async()=>({version:1,date:'2026-10-05',collecte_le:now.toISOString(),erreurs:[],indicateurs:[]}),judgeImpl:async()=>[{id:'btc_eur',niveau:'important',texte:'Un changement sans avis Jev'}]});
 assert.equal(result.ingested,0);assert.equal(result.personal_data,false);assert.deepEqual(ledger.counts(),{});
 assert.match(modernFinanceUrl('https://data-api.ecb.europa.eu/service/data/ICP/M.U2.N.000000.4.ANR'),/HICP\/M.U2.N.000000.4D0.ANR/);
 assert.match(observationUrl({source:'https://data-api.ecb.europa.eu/service/data/FM/EXAMPLE?lastNObservations=1',date_obs:'2026-10-05'}),/startPeriod=2026-10-05/);
});
test('empty Business cycle stays silent and never invents a score or payment evidence',async t=>{
 const {dir,ledger}=fixture(t);const result=await businessCycle({ledger,directory:dir,now,triageImpl:async()=>assert.fail()});
 assert.equal(result.added,0);assert.equal(result.payment_evidence_invented,false);assert.equal(result.opportunity_scores_created,0);
});
test('Finance boundary drops the open Kraken candle and uses the new HICP dataset',async()=>{
 const requested=[];
 const rows=Array.from({length:33},(_,i)=>[Date.parse('2026-09-01T00:00:00Z')/1000+i*86400,'0','0','0',String(i===32?999:100+i)]);
 const result=await collectFinance(async url=>{requested.push(url);
  if(url.includes('api.kraken.com'))return {ok:true,text:async()=>JSON.stringify({error:[],result:{PAIR:rows,last:0}})};
  return {ok:false};},now);
 assert.ok(requested.some(u=>u.includes('/HICP/')&&u.includes('4D0')));
 assert.equal(result.indicateurs.find(i=>i.id==='btc_eur').valeur,131);
});
