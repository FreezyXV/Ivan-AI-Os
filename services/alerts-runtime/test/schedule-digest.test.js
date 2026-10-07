import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {openLedger} from '../src/ledger.js';
import {sendDigest} from '../src/digest.js';
import {scheduleSlots} from '../src/schedule.js';
const at=Date.parse('2026-10-05T18:00:00Z');
function fixture(t){const dir=mkdtempSync(path.join(os.tmpdir(),'ivan-digest-'));let time=at;
 const ledger=openLedger(path.join(dir,'alerts.sqlite'),{now:()=>time,leaseMs:1000});t.after(()=>{ledger.close();rmSync(dir,{recursive:true,force:true});});return {ledger,advance:(ms=1001)=>time+=ms};}
function ready(ledger,suffix){const {id}=ledger.ingest({producer:'sentinelle',scope:'public',topic:'system',url:'https://example.org/'+suffix,title:`Un fait public distinct ${suffix}`,publishedAt:'2026-10-05T08:00:00Z',observedAt:'2026-10-05T09:00:00Z',readAt:'2026-10-05T09:00:00Z',sourceStatus:'read',excerpt:'Une preuve publique complète.'});
 const job=ledger.claim();ledger.finish(id,job.owner,{state:'ready',reason:'BRIEF_VERIFIED',brief:{message:'Fait vérifié, utilité et action. Source : https://example.org/'+suffix}});return id;}
test('Paris schedules survive DST and wake up in one current slot, no backlog replay',()=>{
 assert.deepEqual(scheduleSlots(new Date('2026-10-05T05:00:00Z')),{feeds:'feeds:2026-10-05:1'});
 const a=scheduleSlots(new Date(at));assert.equal(a.finance,'finance:2026-10-05');assert.equal(a.business,'business:2026-W41');assert.equal(a.digest,'digest:2026-10-05');
 assert.equal(scheduleSlots(new Date('2026-10-26T06:30:00Z')).finance,'finance:2026-10-26');
});
test('cycle reservation excludes overlapping processes and successful repeats',t=>{
 const {ledger}=fixture(t),c=ledger.claimCycle('feeds','feeds:today');assert.ok(c);assert.equal(ledger.claimCycle('feeds','feeds:today'),null);
 ledger.finishCycle(c,{ok:true,metrics:{calls:0}});assert.equal(ledger.claimCycle('feeds','feeds:today'),null);
});
test('wake reconciliation closes expired cycles, preserves live leases and bounds their recovery',t=>{
 const {ledger,advance}=fixture(t),old=ledger.claimCycle('feeds','feeds:interrupted');
 advance(900001);
 const live=ledger.claimCycle('process','process:current');
 assert.equal(ledger.reconcile(),0,'the return value still counts uncertain deliveries only');
 const failed=ledger.cycleStatus().find(c=>c.key===old.key);
 assert.equal(failed.status,'failed');assert.equal(failed.metrics.error_code,'CYCLE_INTERRUPTED');
 assert.equal(ledger.cycleStatus().find(c=>c.key===live.key).status,'running');
 assert.throws(()=>ledger.finishCycle(old,{ok:true}),{code:'ALERT_LEASE_LOST'});
 assert.equal(ledger.claimCycle('feeds',old.key),null,'no immediate catch-up burst');
 ledger.finishCycle(live,{ok:true});
 advance(900001);
 const retry=ledger.claimCycle('feeds',old.key);assert.equal(retry.attempt,2);
 advance(900001);ledger.reconcile();
 assert.equal(ledger.claimCycle('feeds',old.key),null,'the interrupted retry still consumes the second attempt');
});
test('one native digest receipt completes both producers and its key cannot resend',async t=>{
 const {ledger}=fixture(t),a=ready(ledger,'a'),b=ready(ledger,'b');let calls=0;
 const deliver=async({text})=>{calls++;assert.match(text,/example.org\/a/);assert.match(text,/example.org\/b/);return {delivered:true,messageId:'99'};};
 const r=await sendDigest({ledger,key:'digest:today',deliver,now:at});assert.equal(r.count,2);assert.equal(calls,1);assert.equal(ledger.get(a).receipt.messageId,'99');assert.equal(ledger.get(b).state,'delivered');
 assert.equal((await sendDigest({ledger,key:'digest:today',deliver,now:at})).state,'empty');assert.equal(calls,1);
});
test('crash after digest reservation never returns children to ready or sends twice',async t=>{
 const {ledger,advance}=fixture(t),id=ready(ledger,'one');const job=ledger.reserveDigest({key:'digest:today',ids:[id],text:'Un message'});assert.ok(job);
 advance();ledger.reconcile();let calls=0;await sendDigest({ledger,key:'digest:today',deliver:async()=>calls++,now:at});assert.equal(calls,0);assert.equal(ledger.get(id).state,'delivery_unknown');
});
