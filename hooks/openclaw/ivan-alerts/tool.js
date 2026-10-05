import {validateItem,PILOT_CONTEXT,suspiciousSource} from '../../../services/alerts-runtime/src/context.js';
import {synthesisPrompt,parseBrief,bindEvidence,validatePromptVariant,validateAssessment,assessmentItemSha256} from '../../../services/alerts-runtime/src/synthesis.js';
import {renderBrief} from '../../../services/alerts-runtime/src/pipeline.js';
const output=details=>({content:[{type:'text',text:JSON.stringify(details)}],details});
export function createSynthesisTool(context,subagent){
 if(context?.agentId!=='ivan-system')return null;
 return {name:'ivan_alert_synthesize',label:'Public alert synthesis',
  description:'Assess public read evidence and draft only useful information in one isolated completion, or synthesize an already selected item; no tools or private context.',
  parameters:{type:'object',properties:{item:{type:'object'},purpose:{type:'string',enum:['selected','editorial-evaluation','assessment']},promptVariant:{type:'string',enum:['current','compact-v1']}},required:['item'],additionalProperties:false},
  async execute(_id,args,signal){let stage='VALIDATE';try{
   const item=validateItem(args?.item);
   const purpose=args?.purpose??'selected';
   const promptVariant=args?.promptVariant??'current';validatePromptVariant(purpose,promptVariant);
   if(item.sourceStatus!=='read'||!PILOT_CONTEXT.active.includes(item.topic)||suspiciousSource(item.excerpt)||signal?.aborted)throw Error();
   stage='COMPLETE';const result=await subagent.complete({agentId:'ivan-system',message:synthesisPrompt(item,{purpose,promptVariant}),
     extraSystemPrompt:'Tu produis uniquement le JSON documentaire demandé à partir de la source fournie. Aucun outil, contexte privé ou pouvoir d’action.',timeoutMs:60000,signal});
   if(signal?.aborted)throw Error();
   if(purpose==='assessment'){
    stage='PARSE';const assessment=validateAssessment(item,parseBrief(result.text));
    return output({status:assessment.decision==='keep'?'READY':assessment.decision==='skip'?'SKIPPED':'REVIEW',
     execution:'native-isolated-completion',purpose,promptVariant,context_version:PILOT_CONTEXT.version,itemSha256:assessmentItemSha256(item),
     ...assessment,...(assessment.decision==='skip'?{reason_code:'EDITORIAL_NOT_RELEVANT'}:assessment.decision==='review'?{reason_code:'EDITORIAL_EVIDENCE_INSUFFICIENT'}:{})});
   }
   stage='PARSE';const brief=bindEvidence(item,parseBrief(result.text));renderBrief(item,brief);
   return output({status:'READY',execution:'native-isolated-completion',purpose,promptVariant,brief});
  }catch(error){
   const code=stage==='PARSE'&&['ALERT_FACT_UNSUPPORTED','ALERT_BRIEF_INVALID','ALERT_BRIEF_TOO_LONG','ALERT_ASSESSMENT_INVALID','ALERT_SYNTHESIS_INVALID'].includes(error?.code)?error.code:'ALERT_SYNTHESIS_UNAVAILABLE';
   return output({status:'UNAVAILABLE',error_code:code,error_stage:stage});}}
 };
}
