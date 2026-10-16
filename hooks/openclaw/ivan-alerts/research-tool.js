const output=details=>({content:[{type:'text',text:JSON.stringify(details)}],details});
export function createResearchTool(context,subagent){
 if(context?.agentId!=='ivan-system')return null;
 return {name:'ivan_research_complete',label:'Evidence-based research and devil’s advocate',
 description:'Analyze a public evidence bundle or independently challenge a report. No tools, private profile or permission to act.',
 parameters:{type:'object',properties:{bundle:{type:'object'},stage:{enum:['analysis','contradiction']},report:{type:'object'}},required:['bundle','stage'],additionalProperties:false},
 async execute(_id,args,signal){let phase='VALIDATE';try{
  const c=await import('../../../services/alerts-runtime/src/research-contract.js');const bundle=c.sealBundle(args.bundle),stage=args.stage;
  if(!['analysis','contradiction'].includes(stage)||signal?.aborted||stage==='analysis'&&args.report!==undefined)c.researchFail('RESEARCH_STAGE_INVALID');
  const prompt=stage==='analysis'?c.researchPrompt(bundle):c.researchReviewPrompt(bundle,args.report);
  phase='COMPLETE';const response=await subagent.complete({agentId:'ivan-system',message:prompt,
   extraSystemPrompt:stage==='analysis'?'Analyste documentaire uniquement. Aucun outil, contexte privé, transaction ou pouvoir d’action.':'Avocat du diable indépendant : cherche à invalider la thèse à partir des preuves. Aucun outil ni pouvoir d’action.',timeoutMs:60000,signal});
  if(signal?.aborted)c.researchFail('RESEARCH_NATIVE_UNAVAILABLE');
  phase='PARSE';if(typeof response.text!=='string'||response.text.length>12000)c.researchFail('RESEARCH_REPORT_INVALID');
  const raw=JSON.parse(response.text.replace(/^```(?:json)?\s*|\s*```$/g,''));phase='VALIDATE';let result,binding;
  if(stage==='analysis'){
   if(!raw||Object.keys(raw).some(k=>!['decision','report'].includes(k))||!['report','skip','research'].includes(raw.decision))c.researchFail('RESEARCH_REPORT_INVALID');
   if(raw.decision==='report')result={decision:'report',report:c.validateResearchReport(bundle,raw.report)};
   else{if(raw.report!==undefined)c.researchFail('RESEARCH_REPORT_INVALID');result=raw;}
  }else{
   binding=c.reportBinding(bundle,args.report);result=c.validateResearchReview(bundle,args.report,{...raw,binding});
   delete result.binding;
  }
  return output({status:'COMPLETE',execution:'native-isolated-completion',version:c.RESEARCH_VERSION,bundleId:bundle.id,stage,result,...(binding?{binding}:{})});
 }catch(e){return output({status:'UNAVAILABLE',phase,error_code:/^RESEARCH_[A-Z_]+$/.test(e.code??'')?e.code:'RESEARCH_NATIVE_UNAVAILABLE'});}}
 };
}
