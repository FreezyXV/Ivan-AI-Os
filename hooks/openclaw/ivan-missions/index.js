import {createMissionLedger}from'./ledger.js';import{createMissionStore}from'./store.js';
export default {id:'ivan-ai-os-missions',name:'Ivan mission status',register(api){
 if(api.pluginConfig?.enabled!==true)return;
 let ledger;try{ledger=createMissionLedger(createMissionStore(api.pluginConfig.statePath));}catch{api.logger.warn('MISSION_TRACKING_DISABLED');return;}
 const observe=fn=>(event,ctx)=>{try{fn(event,ctx)}catch{api.logger.warn('MISSION_TRACKING_UNAVAILABLE')}};
 api.on('after_tool_call',observe(ledger.after),{matcher:['ivan_route','sessions_spawn','message'],timeoutMs:1000});
 api.on('subagent_ended',observe(ledger.ended));
 api.registerTool(ctx=>['main','ivan-system'].includes(ctx.agentId)?{
  name:'ivan_mission_status',label:'Ivan mission status',description:'Show ten recent observed missions, elapsed time, manager/worker returns and delivery receipts. Metadata only, no model or network calls. A delivered receipt is transport evidence, not content validation.',
  parameters:{type:'object',properties:{},additionalProperties:false},async execute(){const details={missions:ledger.status(),observation_only:true};return {content:[{type:'text',text:JSON.stringify(details)}],details};}
 }:null,{names:['ivan_mission_status'],optional:true});
}};
