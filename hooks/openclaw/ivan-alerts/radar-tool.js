const output=details=>({content:[{type:'text',text:JSON.stringify(details)}],details});
export function createRadarTool(context,subagent){
 if(context?.agentId!=='ivan-system')return null;
 return {name:'ivan_radar_complete',label:'Explain public radar subjects',description:'Write or independently verify French subject cards from read public evidence; no utility selection, tools or private context.',
 parameters:{type:'object',properties:{evidence:{type:'object'},stage:{enum:['analysis','contradiction']},cards:{type:'array',items:{type:'object'}}},required:['evidence','stage'],additionalProperties:false},
 async execute(_id,args,signal){let phase='VALIDATE';try{
  const c=await import('../../../services/alerts-runtime/src/radar-brief.js'),evidence=c.sealRadarEvidence(args.evidence?.items),stage=args.stage;
  if(!['analysis','contradiction'].includes(stage)||signal?.aborted||stage==='analysis'&&args.cards!==undefined)throw Error();
  const cards=stage==='contradiction'?c.validateRadarCards(evidence,args.cards):undefined;
  phase='COMPLETE';const result=await subagent.complete({agentId:'ivan-system',message:stage==='analysis'?c.radarBriefPrompt(evidence):c.radarReviewPrompt(evidence,cards),extraSystemPrompt:stage==='analysis'?'Rédaction documentaire française uniquement, aucun outil ni historique privé.':'Relecture indépendante de fidélité et clarté, pas de sélection d’utilité. Aucun outil ni contexte privé.',timeoutMs:60000,signal});
  phase='PARSE';if(signal?.aborted||typeof result.text!=='string'||result.text.length>18000)throw Error();
  const raw=JSON.parse(result.text.replace(/^```(?:json)?\s*|\s*```$/g,''));phase='VALIDATE';
  const value=stage==='analysis'?c.validateRadarCards(evidence,raw):c.validateRadarReview(evidence,cards,{...raw,binding:c.radarCardsBinding(evidence,cards)});
  return output({status:'COMPLETE',version:c.RADAR_BRIEF_VERSION,evidenceId:evidence.id,stage,result:value,execution:'native-isolated-completion'});
 }catch(e){return output({status:'UNAVAILABLE',phase,error_code:/^RESEARCH_[A-Z_]+$/.test(e.code??'')?e.code:'RESEARCH_RADAR_NATIVE_UNAVAILABLE'});}}
 };
}
