import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeAutomations, inspectPilot } from './inspect-mac-pilot.mjs';

test('native automation inventory reveals Career activity without leaking prompts or addresses',()=>{
  const jobs=[{agentId:'ivan-career',enabled:true,payload:{kind:'agentTurn',message:'PRIVATE PROMPT'},
    delivery:{to:'PRIVATE TARGET'},state:{lastRunStatus:'error',lastError:'PRIVATE ERROR'}},
    {agentId:'ivan-system',enabled:true,payload:{kind:'agentTurn'},state:{lastRunStatus:'ok'}}];
  const result=summarizeAutomations({jobs,total:2,hasMore:false});
  assert.equal(result.career_enabled,1);assert.equal(result.agents['ivan-career'].lastErrors,1);
  assert.equal(result.agents['ivan-career'].activeErrors,1);
  assert.equal(JSON.stringify(result).includes('PRIVATE'),false);
  assert.throws(()=>summarizeAutomations({jobs,total:3,hasMore:true}),/INCOMPLETE/);
});

test('diagnostic reports partial failure without reflecting command output or credentials',async()=>{
  const result=await inspectPilot({call:async args=>{
    if(args[0]==='cron')throw Error('PRIVATE CLI OUTPUT');return{ok:true};
  },getToken:()=> 'synthetic-private-token',fetchImpl:async url=>({ok:true,json:async()=>url.endsWith('/health')?
    {ok:true,provider:'jev'}:{calls:4,month:'2026-10',estimated_cost_eur:0.01,privateData:'PRIVATE DATA'}})});
  assert.equal(result.openclaw_healthy,true);assert.equal(result.jev.usage_available,true);
  assert.equal(result.jev.usage.calls,4);
  assert.equal(result.automations.error_code,'AUTOMATION_INVENTORY_UNAVAILABLE');
  assert.equal(JSON.stringify(result).includes('PRIVATE'),false);assert.equal(JSON.stringify(result).includes('synthetic-private-token'),false);
});
