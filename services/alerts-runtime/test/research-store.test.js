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
