import { readFileSync, realpathSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { openLedger } from '../services/alerts-runtime/src/ledger.js';
import { validateItem, prefilter, fail } from '../services/alerts-runtime/src/context.js';
import { withDeadline } from '../services/alerts-runtime/src/deadline.js';
import { createJevSelector } from '../services/alerts-runtime/src/jev-selector.js';
import { processNext } from '../services/alerts-runtime/src/pipeline.js';
const run=promisify(execFile);
const reader=fileURLToPath(new URL('./read-public-alert.py',import.meta.url));
export async function readPublicSource(item,{signal}={}){
  try{
    const {stdout}=await run('python3',[reader,item.url,'--topic',item.topic,'--producer',item.producer,
      '--published-at',item.publishedAt,'--title',item.title],
      {signal,timeout:18000,maxBuffer:65536});
    return JSON.parse(stdout);
  }catch(error){
    let code='PUBLIC_SOURCE_UNAVAILABLE';
    try{const value=JSON.parse(String(error.stderr??'').trim());if(/^PUBLIC_SOURCE_[A-Z_]{1,40}$/.test(value.error))code=value.error;}catch{}
    if(signal?.aborted||error.killed)code='PUBLIC_SOURCE_TIMEOUT';
    fail(code);
  }
}
export function supportsPublicSource(url){
  const u=new URL(url);
  return /^https:\/\/simonwillison\.net\/\d{4}\/[A-Z][a-z]{2}\/\d{1,2}\/[a-z0-9-]+\/$/.test(url)||
    (['huggingface.co','nextjs.org'].includes(u.hostname)&&u.pathname.startsWith('/blog/')&&!u.search)||
    (u.hostname==='www.ecb.europa.eu'&&/^\/{1,2}press\//.test(u.pathname)&&u.pathname.endsWith('.html')&&!u.search)||
    (u.hostname==='news.ycombinator.com'&&u.pathname==='/item'&&/^\?id=\d{1,12}$/.test(u.search));
}
export async function ingestCandidates({ledger,envelope,readSource=readPublicSource,readLimit=3,now=Date.now()}){
  if(envelope?.version!==1||envelope.producer!=='sentinelle'||!Array.isArray(envelope.items)||envelope.items.length>100||
     !Number.isInteger(readLimit)||readLimit<0||readLimit>10||!Number.isFinite(now))fail('ALERT_EXPORT_INVALID');
  const summary={ingested:0,duplicates:0,evidenceUpdated:0,read:0,unread:0,readerErrors:0,readerFailures:[],sourceReceipts:[]};
  let attempts=0;
  for(const raw of envelope.items){
    const item=validateItem(raw);
    // Feed evidence never promotes itself to a read article at this boundary.
    if(item.producer!=='sentinelle'||item.sourceStatus!=='title-only')fail('ALERT_EXPORT_INVALID');
    const row=ledger.ingest(item),prior=ledger.get(row.id);
    summary[row.duplicate?'duplicates':'ingested']++;
    if(prior.item.sourceStatus==='read'||!['pending','review'].includes(prior.state))continue;
    const supported=supportsPublicSource(item.url);
    if(!supported||attempts>=readLimit||prefilter({...item,sourceStatus:'read',readAt:item.observedAt},{now}).decision!=='select'){
      summary.unread++;continue;
    }
    attempts++;
    try{
      const evidence=await withDeadline(signal=>readSource(item,{signal}),18000,'SOURCE_READ_TIMEOUT');
      const read=validateItem(evidence.item),receipt=evidence.sourceReceipt;
      if(read.url!==item.url||read.topic!==item.topic||read.producer!==item.producer||read.sourceStatus!=='read'||
         receipt?.url!==read.url||receipt.readAt!==read.readAt||receipt.publishedDay!==read.publishedAt.slice(0,10)||
         !['simon-blog-v1','public-article-v1'].includes(receipt.extractor)||!/^[a-f\d]{64}$/.test(receipt.responseSha256??'')||
         !Number.isSafeInteger(receipt.bodyBytes)||receipt.bodyBytes<20||receipt.bodyBytes>400000)fail('ALERT_SOURCE_EVIDENCE_INVALID');
      const update=ledger.ingest(read);
      if(update.evidenceUpdated){summary.evidenceUpdated++;summary.read++;summary.sourceReceipts.push({id:row.id,...receipt});}
    }catch(error){summary.readerErrors++;summary.unread++;summary.readerFailures.push({id:row.id,
      code:/^(?:PUBLIC_SOURCE_|ALERT_SOURCE_|SOURCE_READ_)[A-Z_]{1,40}$/.test(error.code??'')?error.code:'PUBLIC_SOURCE_UNAVAILABLE'});}
  }
  return summary;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===realpathSync(process.argv[1])){
  let ledger;
  try{
    const [input,ledgerPath,...flags]=process.argv.slice(2);
    if(!input||!ledgerPath||flags.some(v=>v!=='--select'))fail('ALERT_INGEST_USAGE');
    const bytes=readFileSync(input);if(bytes.length>512000)fail('ALERT_EXPORT_TOO_LARGE');
    ledger=openLedger(ledgerPath);
    const summary=await ingestCandidates({ledger,envelope:JSON.parse(bytes)});
    const processing={};let providerCalls=0;
    if(flags.includes('--select')){
      const select=createJevSelector();
      // Deliberately no prose adapter or Telegram sender in this pilot command.
      const started=Date.now();
      for(let i=0;i<100&&Date.now()-started<90000;i++){
        const result=await processNext({ledger,select:async(...args)=>{providerCalls++;return select(...args);}});
        if(result.state==='idle')break;
        processing[result.reason]=(processing[result.reason]??0)+1;
      }
    }
    console.log(JSON.stringify({...summary,processing,providerAttempts:providerCalls,queue:ledger.counts(),synthesis_calls:0,telegram_messages:0}));
  }catch(error){console.error(/^[A-Z_]+$/.test(error.message)?error.message:'ALERT_CANDIDATE_INGEST_FAILED');process.exitCode=1;}
  finally{ledger?.close();}
}
