import test from'node:test';import assert from'node:assert/strict';import{randomUUID}from'node:crypto';import{mkdtempSync,readFileSync,rmSync}from'node:fs';import{tmpdir}from'node:os';import path from'node:path';import{createMissionLedger}from'../ledger.js';import{createMissionStore}from'../store.js';
function fixture(store={}){const ids={root:randomUUID(),manager:randomUUID(),child:randomUUID(),worker:randomUUID()},ledger=createMissionLedger(store);
 const call=(tool,agent,run,params,result)=>ledger.after({toolName:tool,params,result},{toolName:tool,agentId:agent,runId:run});
 call('ivan_route','main',ids.root,{}, {status:'ROUTED',manager:'system',provider:'jev'});
 call('sessions_spawn','main',ids.root,{agentId:'ivan-system',task:'SYNTHETIC_PRIVATE_PROMPT'}, {status:'accepted',context:'isolated',runId:ids.manager,childSessionKey:'agent:ivan-system:subagent:'+ids.child});
 return{ids,ledger,call};}
test('worker return and manager return do not mean delivered; queued receipt stays pending',()=>{
 const{ids,ledger,call}=fixture();call('sessions_spawn','ivan-system',ids.manager,{}, {status:'accepted',context:'isolated',runId:ids.worker});
 ledger.ended({runId:ids.worker,outcome:'ok'});assert.equal(ledger.status()[0].status,'worker_returned');
 ledger.ended({runId:ids.manager,outcome:'ok'});assert.equal(ledger.status()[0].status,'manager_returned');
 call('message','main','announce:'+ids.child,{action:'send'}, {ok:true,status:'delivery_queued',delivered:false});assert.equal(ledger.status()[0].status,'delivery_queued');
 call('message','main','announce:'+ids.child,{action:'send'}, {ok:true,receipt:{}});assert.equal(ledger.status()[0].status,'delivered');
});
test('unrelated sends, explicit destinations, failed spawns and foreign agents cannot complete a mission',()=>{
 const{ids,ledger,call}=fixture();for(const[run,params,agent]of[[randomUUID(),{action:'send'},'main'],['announce:'+ids.child,{action:'send',target:'OTHER_CHAT'},'main'],['announce:'+ids.child,{action:'send'},'ivan-finance']])call('message',agent,run,params,{ok:true,receipt:{}});
 assert.equal(ledger.status()[0].status,'manager_running');ledger.ended({runId:ids.manager,outcome:'timeout'});assert.equal(ledger.status()[0].status,'failed');
});
test('two concurrent missions match their own native completion rather than the latest request',()=>{
 const{ids,ledger,call}=fixture();const root2=randomUUID(),m2=randomUUID(),c2=randomUUID();call('ivan_route','main',root2,{}, {status:'ROUTED',manager:'career',provider:'jev'});call('sessions_spawn','main',root2,{agentId:'ivan-career'},{status:'accepted',context:'isolated',runId:m2,childSessionKey:'agent:ivan-career:subagent:'+c2});
 call('message','main','announce:'+ids.child,{action:'send'}, {ok:true,receipt:{}});assert.equal(ledger.status()[0].manager,'career');assert.equal(ledger.status()[0].status,'manager_running');assert.equal(ledger.status()[1].status,'delivered');
});
test('restart preserves observations without prompts, note bodies, recipients or provider keys',()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'ivan-missions-'));try{const file=path.join(dir,'state.json'),{ids,ledger,call}=fixture(createMissionStore(file));call('message','main','announce:'+ids.child,{action:'send',message:'SYNTHETIC_PRIVATE_BODY'}, {ok:true,receipt:{},providerKey:'SYNTHETIC_PRIVATE_KEY'});
 const raw=readFileSync(file,'utf8');for(const privateValue of ['SYNTHETIC_PRIVATE_PROMPT','SYNTHETIC_PRIVATE_BODY','SYNTHETIC_PRIVATE_KEY'])assert.equal(raw.includes(privateValue),false);
 const next=createMissionLedger(createMissionStore(file));assert.equal(next.status()[0].status,'delivered');assert.equal(next.status()[0].id,ledger.status()[0].id);
 }finally{rmSync(dir,{recursive:true,force:true})}});
test('bounded capacity retains active work and flags overdue without killing or completing it',()=>{
 let clock=0;const{ids,ledger,call}=fixture({capacity:1,now:()=>clock});clock=300001;call('ivan_route','main',randomUUID(),{}, {status:'ROUTED',manager:'finance',provider:'jev'});assert.equal(ledger.status().length,1);assert.equal(ledger.status()[0].overdue,true);assert.equal(ledger.status()[0].status,'manager_running');
});
