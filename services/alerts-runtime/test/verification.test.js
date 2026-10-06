import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createSynthesisTool} from '../../../hooks/openclaw/ivan-alerts/tool.js';
import {createNativeVerification,briefBinding,validateVerification} from '../src/verification.js';
import {openLedger} from '../src/ledger.js';
import {processNext} from '../src/pipeline.js';
import {runCycle} from '../../../scripts/mac-alerts-cycle.mjs';
const at=Date.parse('2026-10-07T10:00:00Z');
const item={producer:'sentinelle',url:'https://example.org/agent-recovery',title:'Reprise des agents',scope:'public',topic:'system',
 sourceStatus:'read',publishedAt:'2026-10-07T08:00:00Z',observedAt:'2026-10-07T09:00:00Z',readAt:'2026-10-07T09:00:00Z',
 excerpt:'The service records a receipt and resumes only tasks without a confirmed receipt.'};
const brief={goal:'system',facts:[{summary:'Le service reprend les tâches sans reçu confirmé.',quote:item.excerpt}],
 utility:'Vérifier la reprise des tâches des agents.',action:'Comparer les reçus avant et après une reprise.'};
function fixture(t){const dir=mkdtempSync(path.join(tmpdir(),'ivan-verification-')),ledger=openLedger(path.join(dir,'alerts.sqlite'),{now:()=>at});
 t.after(()=>{ledger.close();rmSync(dir,{force:true,recursive:true});});return {dir,ledger};}
test('independent verification is one isolated completion bound to the exact source and brief',async()=>{
 let calls=0;const tool=createSynthesisTool({agentId:'ivan-system'},{complete:async args=>{
  calls++;assert.match(args.message,/relecteur indépendant/);assert.ok(!args.tools);return{text:'{"decision":"approve","issues":[]}'};}});
 const verify=createNativeVerification({runImpl:async(_bin,args)=>{
  const p=JSON.parse(args[4]);assert.equal(p.args.purpose,'verification');
  return {stdout:JSON.stringify({ok:true,output:await tool.execute('verify',p.args)})};}});
 const result=await verify(item,brief,{},{});
 assert.equal(calls,1);assert.equal(result.decision,'approve');assert.equal(result.binding,briefBinding(item,brief));
 assert.equal(result.modelCalls,1);assert.equal(result.providerUsageAvailable,false);
});
test('fabricated bindings and contradictory verifier decisions cannot approve a brief',async()=>{
 for(const value of [{decision:'approve',issues:['NOT_RELEVANT']},{decision:'reject',issues:[]},
  {decision:'approve',issues:[],text:'unsolicited prose'},{decision:'review',issues:['UNKNOWN']}])
  assert.throws(()=>validateVerification(value),{code:'ALERT_VERIFICATION_INVALID'});
 const tool=createSynthesisTool({agentId:'ivan-system'},{complete:async()=>({text:'{"decision":"approve","issues":[]}'})});
 const verify=createNativeVerification({runImpl:async()=>{const output=await tool.execute('verify',{item,brief,purpose:'verification'});
  output.details.binding='0'.repeat(64);return{stdout:JSON.stringify({ok:true,output})};}});
 await assert.rejects(verify(item,brief,{},{}),{code:'ALERT_VERIFICATION_INVALID'});
});
test('a negative or unavailable verifier prevents delivery; only its outage gets one retry',async t=>{
 const {ledger}=fixture(t);
 for(const [index,result,state] of [[0,{decision:'reject',issues:['NOT_RELEVANT']},'skipped'],
  [1,{decision:'reject',issues:['UNSUPPORTED_CONTEXT']},'review'],[2,{decision:'approve',issues:[]},'ready']]){
  const source={...item,url:item.url+'/'+index,excerpt:item.excerpt+' '+index};ledger.ingest(source);
  const r=await processNext({ledger,now:at,assess:async()=>({decision:'keep',brief}),
   verify:async(i,b)=>({...result,binding:briefBinding(i,b)})});
  assert.equal(r.state,state);assert.equal(r.brief.verification.decision,result.decision);
 }
 ledger.ingest({...item,url:item.url+'/unavailable',excerpt:item.excerpt+' unique pending example'});
 const r=await processNext({ledger,now:at,assess:async()=>({decision:'keep',brief}),verify:async()=>{throw Error('private details');}});
 assert.equal(r.reason,'NATIVE_VERIFICATION_UNAVAILABLE');assert.equal(ledger.retryTransient({minDelayMs:0}),1);
 assert.equal(ledger.retryTransient({minDelayMs:0}),0);assert.ok(!JSON.stringify(r).includes('private details'));
 ledger.ingest({...item,url:item.url+'/invalid',excerpt:item.excerpt+' different malformed example'});
 const invalid=await processNext({ledger,now:at,assess:async()=>({decision:'keep',brief}),
  verify:async()=>{throw Object.assign(Error('invalid verifier shape'),{code:'ALERT_VERIFICATION_INVALID',failureStage:'VALIDATE'});}});
 assert.equal(invalid.reason,'NATIVE_VERIFICATION_INVALID');assert.equal(ledger.retryTransient({minDelayMs:0}),0);
});
test('the paired native cycle caps both writer and verifier calls even when several candidates are pending',async t=>{
 const {ledger,dir}=fixture(t);for(let i=0;i<4;i++)ledger.ingest({...item,url:item.url+'/'+i,excerpt:item.excerpt+' '+i});
 let writers=0,verifiers=0;
 const cycle=await runCycle({ledger,settings:{stateDir:dir,selectionMode:'native-editorial',verifyNativeBrief:true},
  now:new Date(at),feeds:async()=>({}),finance:async()=>({}),business:async()=>({}),hasBusinessEvidence:()=>false,
  select:async()=>assert.fail('no Jev'),assess:async()=>{writers++;return{decision:'keep',brief};},
  verify:async(i,b)=>{verifiers++;return{decision:'approve',issues:[],binding:briefBinding(i,b)};},deliver:async()=>assert.fail()});
 assert.equal(writers,2);assert.equal(verifiers,2);assert.equal(cycle.results.process.nativeCalls,4);
 assert.equal(ledger.counts().pending,2);assert.equal(ledger.counts().ready,2);
});
