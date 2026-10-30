import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,realpathSync,rmSync,mkdirSync,readdirSync,readFileSync,writeFileSync} from 'node:fs';import {tmpdir} from 'node:os';import path from 'node:path';
import {openResearchStore} from '../src/research-store.js';
import {radarTick,chooseRadarTopics} from '../src/radar.js';
import {handleRadarCommand} from '../../../hooks/openclaw/ivan-opportunities/radar-command.js';
const date=new Date('2026-10-30T19:00:00Z');
const item=(i,topic='business',sourceStatus='read')=>({producer:'sentinelle',scope:'public',topic,url:`https://example.org/${i}`,title:`Problème concret ${i}`,publishedAt:date.toISOString(),observedAt:date.toISOString(),readAt:date.toISOString(),sourceStatus,excerpt:'A shop reports that manual reconciliation of invoices takes time and asks whether an alternative exists.'});
function fixture(t){let now=date.getTime();const dir=mkdtempSync(path.join(realpathSync(tmpdir()),'ivan-radar-')),settings={research:{directory:dir},radar:{enabled:true,dailyTopics:20}};const store=openResearchStore(dir,{now:()=>now});t.after(()=>{store.close();rmSync(dir,{recursive:true,force:true});});return {settings,store,advance:ms=>now+=ms};}
const ledger=items=>({list:state=>items.filter(r=>r.state===state),radarSources:()=>items});
const native=args=>({channel:'telegram',isAuthorizedSender:true,senderId:'123456789',from:'telegram:123456789',accountId:'default',args});
test('broad radar does not ask a model to judge usefulness; unread references are labelled, deferred and uncertain sends excluded',async t=>{
 const f=fixture(t),sent=[],items=[{state:'review',item:item(1)},{state:'skipped',item:item(2,'finance','title-only')},{state:'review',item:item(3,'career')},{state:'delivery_unknown',item:item(4)},{state:'delivered',item:item(5)}];
 const r=await radarTick({...f,ledger:ledger(items),now:date,force:true,deliver:async({text})=>{sent.push(text);return {delivered:true,messageId:String(200+sent.length)};}});
 assert.equal(r.topics,2);assert.equal(r.nativeCalls,0);assert.equal(sent.length,1);assert.match(sent[0],/titre seul.*non vérifi/i);assert.match(sent[0],/à toi de juger/i);assert.doesNotMatch(sent[0],/Problème concret [345]/);
 assert.equal((await radarTick({...f,ledger:ledger(items),now:date,force:true,deliver:async()=>assert.fail()})).topics,0);
});
test('daily topic ceiling survives resume and an uncertain page never resends',async t=>{
 const f=fixture(t),items=Array.from({length:30},(_,i)=>({state:'review',item:item(i)}));let attempts=0;
 const args={...f,ledger:ledger(items),now:date,force:true,deliver:async()=>{attempts++;throw Error('unconfirmed');}};
 const r=await radarTick(args);assert.equal(attempts,1);assert.equal(r.unknown,1);assert.ok(r.topics<=20);
 assert.equal(r.state,'delivery_unknown');assert.equal(r.error_code,'RESEARCH_RADAR_DELIVERY_UNKNOWN');
 const next=await radarTick({...args,deliver:async()=>{attempts++;return {delivered:true,messageId:String(attempts)};}});assert.equal(next.unknown,0);assert.equal(next.unknownPages,1);
 assert.ok(f.store.radar.summary().topicsToday<=20);assert.equal(f.store.radar.summary().unknown,1);
 const old=f.store.radar.pages()[0];assert.equal(old.state,'unknown');
});
test('owner feedback is durable, updates preference ranking, and creuser queues a request, never an unread proof',async t=>{
 const f=fixture(t);await radarTick({...f,ledger:ledger([{state:'review',item:item(1,'finance','title-only')}]),now:date,force:true,deliver:async()=>({delivered:true,messageId:'201'})});
 const id=f.store.radar.topics()[0].id,config={ownerId:'123456789',accountId:'default',researchDirectory:f.settings.research.directory};
 for(const patch of [{senderId:'999'},{from:'telegram:group:123456789'},{isAuthorizedSender:false},{accountId:'other'},{messageThreadId:2}])assert.match((await handleRadarCommand({...native(`${id} creuser`),...patch},config,'feedback')).text,/réservée/);
 assert.match((await handleRadarCommand(native(`${id} utile Je veux comparer les actifs`),config,'feedback')).text,/enregistré/i);
 assert.equal(f.store.radar.preferences()[0].verdict,'utile');
 assert.match((await handleRadarCommand(native(`${id} creuser`),config,'feedback')).text,/recherche.*file/i);
 assert.match((await handleRadarCommand(native(`${id} creuser`),config,'feedback')).text,/déjà/i);
 const job=f.store.list('pending')[0];assert.equal(job.seed.sourceType,'request');assert.equal(job.seed.origin,'telegram-native');assert.equal(f.store.summary().modelCalls,0);
 assert.equal(f.store.radar.preferences()[0].verdict,'creuser');assert.equal(f.store.radar.feedbackHistory(id).length,2);
});
test('personalisation ranks rather than excludes and reserves exploration across active domains',()=>{
 const candidates=Array.from({length:40},(_,i)=>({id:String(i),item:item(i,['business','finance','engineering','system'][i%4])}));
 const feedback=Array.from({length:10},()=>({verdict:'utile',item:item(1,'finance'),reason:''}));
 const chosen=chooseRadarTopics(candidates,feedback,20);assert.equal(chosen.length,20);for(const topic of ['business','finance','engineering','system'])assert.ok(chosen.some(r=>r.item.topic===topic));
 assert.ok(chosen.filter(r=>r.item.topic==='finance').length>chosen.filter(r=>r.item.topic==='system').length);
 const baseline=chooseRadarTopics(candidates,[],20);assert.ok(baseline.filter(r=>r.item.topic==='business').length>=5);assert.ok(baseline.filter(r=>r.item.topic==='finance').length>=5);assert.ok(baseline.filter(r=>r.item.topic==='system').length<=3);
});
test('catalogue and feedback project new Obsidian notes; an edited note is preserved',async t=>{
 const f=fixture(t),vaultPath=path.join(f.settings.research.directory,'vault');mkdirSync(vaultPath);mkdirSync(path.join(vaultPath,'.obsidian'));f.settings.opportunities={vaultPath};
 await radarTick({...f,ledger:ledger([{state:'review',item:item(1)}]),now:date,force:true,deliver:async()=>({delivered:true,messageId:'205'})});
 const notes=path.join(vaultPath,'Ivan AI OS/radar'),page=readdirSync(notes)[0];assert.match(readFileSync(path.join(notes,page),'utf8'),/Catalogue préparé/);
 const id=f.store.radar.topics()[0].id,config={vaultPath,researchDirectory:f.settings.research.directory,ownerId:'123456789',accountId:'default'};
 await handleRadarCommand(native(`${id} utile`),config,'feedback');const feedback=readdirSync(notes).find(n=>n.startsWith('avis-'));assert.ok(feedback);
 writeFileSync(path.join(notes,feedback),'Note personnelle');const answer=await handleRadarCommand(native(`${id} utile`),config,'feedback');assert.match(answer.text,/conservé en base/);assert.equal(readFileSync(path.join(notes,feedback),'utf8'),'Note personnelle');
 assert.equal(f.store.radar.feedbackHistory(id).length,1);
});
