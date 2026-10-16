import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,realpathSync,rmSync} from 'node:fs';import path from 'node:path';import {tmpdir} from 'node:os';
import {handleResearchCommand} from '../../../hooks/openclaw/ivan-opportunities/research-command.js';import {openResearchStore} from '../src/research-store.js';
const native=args=>({channel:'telegram',isAuthorizedSender:true,senderId:'123456789',from:'telegram:123456789',accountId:'default',args});
test('only the real owner DM can queue a public research request; the request is never treated as read evidence',async t=>{
 const dir=mkdtempSync(path.join(realpathSync(tmpdir()),'ivan-request-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));const config={researchDirectory:dir,ownerId:'123456789',accountId:'default'};
 for(const patch of [{senderId:'999'},{from:'telegram:group:-12'},{isAuthorizedSender:false},{accountId:'other'},{messageThreadId:2}])assert.match((await handleResearchCommand({...native('actif btc-bitcoin'),...patch},config)).text,/réservée/);
 assert.match((await handleResearchCommand(native('actif btc-bitcoin'),config)).text,/ajoutée/);
 assert.match((await handleResearchCommand(native('actif btc-bitcoin'),config)).text,/déjà/);
 const store=openResearchStore(dir),row=store.list('pending')[0];assert.equal(row.seed.sourceType,'request');assert.equal(row.seed.asset.id,'btc-bitcoin');assert.equal(store.summary().modelCalls,0);store.close();
 assert.match((await handleResearchCommand(native('macro mon portefeuille'),config)).text,/publiques seulement/);
});
test('a new day permits a fresh explicit request without reopening previous attempts',async t=>{
 const dir=mkdtempSync(path.join(realpathSync(tmpdir()),'ivan-request-day-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));const config={researchDirectory:dir,ownerId:'123456789',accountId:'default'};
 const request=native('actif btc-bitcoin');
 assert.match((await handleResearchCommand(request,config,{now:new Date('2026-10-16T12:00:00Z')})).text,/ajoutée/);
 const store=openResearchStore(dir),old=store.claim();store.finish(old.id,old.owner,{state:'research',error:'RESEARCH_EVIDENCE_INSUFFICIENT'});store.close();
 assert.match((await handleResearchCommand(request,config,{now:new Date('2026-10-16T18:00:00Z')})).text,/déjà/);
 assert.match((await handleResearchCommand(request,config,{now:new Date('2026-10-23T12:00:00Z')})).text,/ajoutée/);
 const after=openResearchStore(dir);assert.equal(after.get(old.id).state,'research');assert.equal(after.list('pending').length,1);after.close();
});
