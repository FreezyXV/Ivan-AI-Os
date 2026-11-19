import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,rmSync,realpathSync} from 'node:fs';import {tmpdir} from 'node:os';import path from 'node:path';
import {openResearchStore} from '../src/research-store.js';
function setup(t){const dir=mkdtempSync(path.join(realpathSync(tmpdir()),'ivan-research-store-'));let time=Date.parse('2026-10-16T10:00:00Z');const store=openResearchStore(dir,{now:()=>time});t.after(()=>{store.close();rmSync(dir,{recursive:true,force:true});});return {store,advance:()=>{time+=300001;}};}
const seed={topic:'business',anchorUrl:'https://example.org/pain',title:'Pain',text:'A public customer problem.'};
test('one source is queued once and an interrupted paid stage never replays invisibly',t=>{
 const {store,advance}=setup(t),{id}=store.enqueue(seed);assert.equal(store.enqueue(seed).added,false);const r=store.claim();
 store.reserveCall(id,r.owner,'analysis',{dailyLimit:2});assert.throws(()=>store.reserveCall(id,r.owner,'analysis'),{code:'RESEARCH_CALL_ALREADY_SPENT'});
 advance();assert.equal(store.claim(),null);assert.equal(store.get(id).error,'RESEARCH_INTERRUPTED');assert.equal(store.summary().modelCalls,1);
});
test('the daily budget is reserved before calls and includes failed attempts',t=>{
 const {store}=setup(t);const {id}=store.enqueue(seed),r=store.claim();store.reserveCall(id,r.owner,'analysis',{dailyLimit:2});store.reserveCall(id,r.owner,'contradiction',{dailyLimit:2});
 const {id:next}=store.enqueue({...seed,anchorUrl:'https://other.org/pain'}),j=store.claim();assert.equal(j.id,next);
 assert.throws(()=>store.reserveCall(next,j.owner,'analysis',{dailyLimit:2}),{code:'RESEARCH_DAILY_MODEL_LIMIT'});
 assert.equal(store.summary().modelCalls,2);
});
test('a late owner request crosses a long backlog and can use capacity reserved for it',t=>{
 const {store}=setup(t);
 for(let i=0;i<120;i++)store.enqueue({...seed,anchorUrl:`https://example.org/background/${i}`});
 const old=store.claim();store.reserveCall(old.id,old.owner,'analysis',{dailyLimit:4,reservedForRequests:2});
 store.reserveCall(old.id,old.owner,'contradiction',{dailyLimit:4,reservedForRequests:2});
 const {id}=store.enqueue({...seed,anchorUrl:'https://owner.example.org/priority',origin:'telegram-native'});
 assert.equal(store.nextRequest().id,id);
 assert.equal(store.retireBackground({pendingPerTopic:6}),113);
 assert.equal(store.list('expired',120).length,113);
 assert.equal(store.hasModelCapacity({dailyLimit:4,reservedForRequests:2,count:2}),false);
 assert.equal(store.hasModelCapacity({dailyLimit:4,reservedForRequests:2,count:2,priority:true}),true);
 const next=store.claim();assert.equal(next.id,id);
 store.reserveCall(id,next.owner,'analysis',{dailyLimit:4,reservedForRequests:2});
 store.reserveCall(id,next.owner,'contradiction',{dailyLimit:4,reservedForRequests:2});
 assert.equal(store.summary().modelCallsToday,4);
});
test('an operator qualification failure cannot send a personal request notice',t=>{
 const {store}=setup(t);
 for(const origin of ['codex-qualification','telegram-native']){
  const {id}=store.enqueue({...seed,origin,revision:origin});
  const job=store.claim({id});
  store.finish(id,job.owner,{state:'research',error:'RESEARCH_EVIDENCE_INSUFFICIENT'});
  assert.equal(store.nextNotice()?.id,origin==='telegram-native'?id:undefined);
 }
});
