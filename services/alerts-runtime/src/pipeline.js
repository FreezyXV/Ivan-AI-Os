import { PILOT_CONTEXT, prefilter, fail } from './context.js';
const text=(value,max)=>typeof value==='string'&&value.trim().length>0&&value.length<=max&&!/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value);
const numbers=value=>value.match(/\d+(?:[.,]\d+)*/g)?.map(n=>n.replaceAll(',','.'))??[];
export function renderBrief(item,brief){
  if(!brief||!Array.isArray(brief.facts)||brief.facts.length<1||brief.facts.length>4||
      !text(brief.utility,500)||!text(brief.action,300)||!PILOT_CONTEXT.active.includes(brief.goal)||
      (brief.uncertainty!==undefined&&!text(brief.uncertainty,300)))fail('ALERT_BRIEF_INVALID');
  for(const fact of brief.facts){
    if(!text(fact.summary,350)||!text(fact.quote,600)||!item.excerpt.includes(fact.quote)||
       numbers(fact.summary).some(n=>!numbers(fact.quote).includes(n)))fail('ALERT_FACT_UNSUPPORTED');
  }
  const paragraphs=[item.title,`Publié le ${item.publishedAt.slice(0,10)}.`,...brief.facts.map(f=>`• ${f.summary}`),
    `\nUtilité pour toi : ${brief.utility}`,`\nÀ faire : ${brief.action}`,
    ...(brief.uncertainty?[`\nLimite : ${brief.uncertainty}`]:[]),`\nSource : ${item.url}`];
  const message=paragraphs.join('\n');if(message.length>2500)fail('ALERT_BRIEF_TOO_LONG');return message;
}
export async function processNext({ledger,select,synthesize,now=Date.now(),maxAgeHours=72}){
  const job=ledger.claim();if(!job)return {state:'idle'};
  const complete=(state,reason,brief)=>ledger.finish(job.id,job.owner,{state,reason,brief});
  const local=prefilter(job.item,{now,maxAgeHours});
  if(local.decision!=='select')return complete(local.decision==='skip'?'skipped':'review',local.reason);
  if(typeof select!=='function')return complete('review','SELECTION_NOT_CONFIGURED');
  let selection;
  try{selection=await select(job.item,PILOT_CONTEXT);}catch{return complete('review','SELECTION_UNAVAILABLE');}
  if(!selection||!['keep','skip','review'].includes(selection.decision)||
     !Number.isFinite(selection.confidence)||selection.confidence<0||selection.confidence>1)return complete('review','SELECTION_INVALID');
  if(selection.decision==='skip'&&selection.confidence>=0.75)return complete('skipped','SELECTION_REJECTED');
  if(selection.decision!=='keep'||selection.confidence<0.75)return complete('review','SELECTION_UNCERTAIN');
  if(typeof synthesize!=='function')return complete('review','SYNTHESIS_NOT_CONFIGURED');
  try{
    const brief=await synthesize(job.item,PILOT_CONTEXT),message=renderBrief(job.item,brief);
    return complete('ready','BRIEF_VERIFIED',{...brief,message,contextVersion:PILOT_CONTEXT.version});
  }catch(e){return complete('review',e?.code==='ALERT_FACT_UNSUPPORTED'?'ALERT_FACT_UNSUPPORTED':'SYNTHESIS_UNAVAILABLE');}
}
export async function deliverReady({ledger,id,deliver}){
  if(typeof deliver!=='function')fail('ALERT_DELIVERY_NOT_CONFIGURED');
  const job=ledger.beginDelivery(id);if(!job)return {state:'not_ready'};
  let receipt;try{receipt=await deliver({id:job.id,text:job.brief.message});}catch{}
  // Unknown delivery never retries automatically: Telegram may have accepted
  // a message before a timeout. Reconcile against its receipt first.
  return ledger.finishDelivery(job.id,job.owner,receipt);
}
