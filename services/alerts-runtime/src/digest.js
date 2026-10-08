import {withDeadline} from './deadline.js';
import {fail} from './context.js';
import {digestEligible} from './schedule.js';
export async function sendDigest({ledger,key,deliver,now=Date.now(),maxItems=2,maxPages=3,readyBeforeDay}){
  if(!/^[a-zA-Z0-9:_-]{1,100}$/.test(key)||!Number.isInteger(maxItems)||maxItems<1||maxItems>3||
     !Number.isInteger(maxPages)||maxPages<1||maxPages>3||typeof deliver!=='function'||
     (readyBeforeDay!==undefined&&!/^\d{4}-\d{2}-\d{2}$/.test(readyBeforeDay)))fail('ALERT_DIGEST_INVALID');
  ledger.reconcile();const settled=ledger.settleReady(now),pages=[];
  // Stable page keys survive restarts. An attempted page never resends.
  for(let page=1;page<=maxPages;page++){
    const pageKey=page===1?key:`${key}:p${page}`;
    const existing=ledger.digestStatus(pageKey);
    if(existing?.state==='sending')break; // Do not overlap another live sender.
    if(existing)continue; // Unknown attempts stay quarantined; other items may proceed.
    const rows=ledger.list('ready',100).filter(row=>digestEligible(row,{readyBeforeDay}));if(!rows.length)break;
    let text='Veille utile — Ivan AI OS\n',ids=[];
    for(const row of rows){
      const next=text+'\n'+row.brief.message+'\n';
      if(next.length>2500){
        if(!ids.length){text=row.brief.message;ids.push(row.id);}
        break; // FIFO: the next row starts another page, never disappears.
      }
      text=next;ids.push(row.id);if(ids.length>=maxItems)break;
    }
    const job=ledger.reserveDigest({key:pageKey,ids,text});if(!job)break;
    let receipt;try{receipt=await withDeadline(signal=>deliver({text:job.text,signal}),25000,'DIGEST_TIMEOUT');}catch{}
    const result=ledger.finishDigest(job.key,job.owner,receipt);pages.push(result);
    if(result.state!=='delivered')break;
  }
  const remaining=ledger.counts().ready??0;
  return {state:pages.some(p=>p.state==='delivery_unknown')?'delivery_unknown':pages.length?(remaining?'partial':'delivered'):'empty',
    count:pages.reduce((n,p)=>n+p.count,0),deliveredCount:pages.filter(p=>p.state==='delivered').reduce((n,p)=>n+p.count,0),
    remaining,expired:settled.expired,pages};
}
