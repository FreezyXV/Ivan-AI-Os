import {withDeadline} from './deadline.js';
import {prefilter} from './context.js';
export async function sendDigest({ledger,key,deliver,now=Date.now(),maxItems=2}){
  ledger.reconcile();
  const rows=ledger.list('ready',100).filter(row=>prefilter(row.item,{now}).decision==='select');
  let text='Veille utile — Ivan AI OS\n',ids=[];
  for(const row of rows){
    const next=text+'\n'+row.brief.message+'\n';
    if(next.length>2500)continue;
    text=next;ids.push(row.id);if(ids.length>=maxItems)break;
  }
  if(!ids.length)return {state:'empty',count:0};
  const job=ledger.reserveDigest({key,ids,text});if(!job)return {state:'already_reserved',count:0};
  let receipt;
  try{receipt=await withDeadline(signal=>deliver({text:job.text,signal}),25000,'DIGEST_TIMEOUT');}catch{}
  return ledger.finishDigest(job.key,job.owner,receipt);
}
