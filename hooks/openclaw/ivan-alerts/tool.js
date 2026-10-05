import {validateItem,PILOT_CONTEXT} from '../../../services/alerts-runtime/src/context.js';
import {synthesisPrompt,parseBrief,bindEvidence,validatePromptVariant} from '../../../services/alerts-runtime/src/synthesis.js';
import {renderBrief} from '../../../services/alerts-runtime/src/pipeline.js';
const output=details=>({content:[{type:'text',text:JSON.stringify(details)}],details});
export function createSynthesisTool(context,subagent){
 if(context?.agentId!=='ivan-system')return null;
 return {name:'ivan_alert_synthesize',label:'Public alert synthesis',
  description:'Generate bounded French prose from already selected public read evidence; no tool or private context.',
  parameters:{type:'object',properties:{item:{type:'object'},purpose:{type:'string',enum:['selected','editorial-evaluation']},promptVariant:{type:'string',enum:['current','compact-v1']}},required:['item'],additionalProperties:false},
  async execute(_id,args,signal){let stage='VALIDATE';try{
   const item=validateItem(args?.item);
   const purpose=args?.purpose??'selected';
   const promptVariant=args?.promptVariant??'current';validatePromptVariant(purpose,promptVariant);
   if(item.sourceStatus!=='read'||!PILOT_CONTEXT.active.includes(item.topic))throw Error();
   stage='COMPLETE';const result=await subagent.complete({agentId:'ivan-system',message:synthesisPrompt(item,{purpose,promptVariant}),
     extraSystemPrompt:'Tu produis uniquement un JSON de synthèse de la source fournie. Aucun outil, contexte privé ou pouvoir d’action.',timeoutMs:60000,signal});
   stage='PARSE';const brief=bindEvidence(item,parseBrief(result.text));renderBrief(item,brief);
   return output({status:'READY',execution:'native-isolated-completion',purpose,promptVariant,brief});
  }catch(error){
   const reason=String(error?.message??'UNKNOWN').replace(/\bBearer\s+\S+|[A-Za-z0-9_-]{24,}/g,'[redacted]').slice(0,240);
   return output({status:'UNAVAILABLE',error_code:'ALERT_SYNTHESIS_UNAVAILABLE',error_stage:stage,reason});}}
 };
}
