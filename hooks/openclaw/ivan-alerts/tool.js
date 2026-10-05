import {validateItem,PILOT_CONTEXT} from '../../../services/alerts-runtime/src/context.js';
import {synthesisPrompt,parseBrief} from '../../../services/alerts-runtime/src/synthesis.js';
import {renderBrief} from '../../../services/alerts-runtime/src/pipeline.js';
const output=details=>({content:[{type:'text',text:JSON.stringify(details)}],details});
export function createSynthesisTool(context,subagent){
 if(context?.agentId!=='ivan-system')return null;
 return {name:'ivan_alert_synthesize',label:'Public alert synthesis',
  description:'Generate bounded French prose from already selected public read evidence; no tool or private context.',
  parameters:{type:'object',properties:{item:{type:'object'}},required:['item'],additionalProperties:false},
  async execute(_id,args,signal){try{
   const item=validateItem(args?.item);
   if(item.sourceStatus!=='read'||!PILOT_CONTEXT.active.includes(item.topic))throw Error();
   const result=await subagent.complete({agentId:'ivan-system',message:synthesisPrompt(item),
     extraSystemPrompt:'Tu produis uniquement un JSON de synthèse de la source fournie. Aucun outil, contexte privé ou pouvoir d’action.',timeoutMs:60000,signal});
   const brief=parseBrief(result.text);renderBrief(item,brief);
   return output({status:'READY',execution:'native-isolated-completion',brief});
  }catch{return output({status:'UNAVAILABLE',error_code:'ALERT_SYNTHESIS_UNAVAILABLE'});}}
 };
}
