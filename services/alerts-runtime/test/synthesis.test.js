import test from 'node:test';
import assert from 'node:assert/strict';
import {synthesisPrompt,parseBrief,createNativeSynthesis} from '../src/synthesis.js';
import {createSynthesisTool} from '../../../hooks/openclaw/ivan-alerts/tool.js';
const item={producer:'sentinelle',scope:'public',topic:'system',url:'https://example.org/one',title:'Une source publique',
 publishedAt:'2026-10-05T08:00:00Z',observedAt:'2026-10-05T09:00:00Z',readAt:'2026-10-05T09:00:00Z',sourceStatus:'read',excerpt:'Une preuve publique pour le pilote.'};
const brief={goal:'system',facts:[{summary:'Une preuve publique.',quote:'Une preuve publique'}],utility:'Une utilité',action:'Rien à faire'};
test('only read evidence enters an isolated native completion and private/deferred inputs cannot generate',async()=>{
 assert.match(synthesisPrompt(item),/Aucun outil/);assert.throws(()=>synthesisPrompt({...item,sourceStatus:'title-only'}));
 assert.equal(createSynthesisTool({agentId:'main'},{}),null);let calls=0;
 const tool=createSynthesisTool({agentId:'ivan-system'},{complete:async args=>{calls++;assert.equal(args.agentId,'ivan-system');assert.equal(args.model,undefined);return {text:JSON.stringify(brief)};}});
 assert.equal((await tool.execute('test',{item})).details.status,'READY');
 assert.equal((await tool.execute('test',{item:{...item,topic:'career'}})).details.status,'UNAVAILABLE');assert.equal(calls,1);
 assert.throws(()=>parseBrief('invented'));
});
test('native RPC requires a checked plugin result and records one call without fabricated usage',async()=>{
 const synth=createNativeSynthesis({runImpl:async(_bin,args)=>{
  assert.equal(args[2],'tools.invoke');const p=JSON.parse(args[4]);assert.equal(p.name,'ivan_alert_synthesize');assert.equal(p.args.item.excerpt,item.excerpt);
  return {stdout:JSON.stringify({ok:true,output:{details:{status:'READY',execution:'native-isolated-completion',brief}}})};}});
 assert.equal((await synth(item)).generation.providerUsageAvailable,false);
 const bad=createNativeSynthesis({runImpl:async()=>({stdout:'{"ok":false}'})});await assert.rejects(bad(item),{code:'ALERT_SYNTHESIS_UNAVAILABLE'});
 const exit=createNativeSynthesis({runImpl:async()=>{throw Object.assign(Error(),{code:1});}});await assert.rejects(exit(item),{code:'ALERT_SYNTHESIS_UNAVAILABLE'});
});
