import test from 'node:test';import assert from 'node:assert/strict';
import {probeAlertTool} from './probe-alert-tool.mjs';
test('readiness tests actual scoped invocation with evidence that cannot buy a completion',async()=>{
 const r=await probeAlertTool({runImpl:async(_binary,args)=>{
  const p=JSON.parse(args[4]);assert.equal(p.agentId,'ivan-system');assert.equal(p.args.item.sourceStatus,'title-only');assert.equal(p.args.item.topic,'career');
  return{stdout:JSON.stringify({ok:true,output:{details:{status:'UNAVAILABLE',error_stage:'VALIDATE'}}})};
 }});assert.equal(r.available,true);
});
test('healthy gateway, missing tool, completion failure and malformed RPC do not qualify',async()=>{
 for(const value of [{ok:true},{ok:false,error:{code:'not_found'}},{ok:true,output:{details:{status:'UNAVAILABLE',error_stage:'COMPLETE'}}}])
  assert.equal((await probeAlertTool({runImpl:async()=>({stdout:JSON.stringify(value)})})).available,false);
 assert.equal((await probeAlertTool({runImpl:async()=>{throw Error('PRIVATE');}})).available,false);
});
