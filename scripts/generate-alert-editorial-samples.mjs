// Four isolated editorial fixtures, zero selection/delivery, never the live queue.
import {readFileSync,writeFileSync,appendFileSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {validateItem,PILOT_CONTEXT} from '../services/alerts-runtime/src/context.js';
import {createNativeSynthesis,synthesisPrompt} from '../services/alerts-runtime/src/synthesis.js';
import {renderBrief} from '../services/alerts-runtime/src/pipeline.js';
export const SAMPLE_IDS=Object.freeze(['I01','I02b','I12','I13']);
export async function generateSamples(corpus,{synthesize,record=()=>{}}={}){
 if(corpus?.role!=='evaluation-independante'||!Array.isArray(corpus.cas)||corpus.cas.length>50||
    new Set(corpus.cas.map(c=>c.id)).size!==corpus.cas.length||typeof synthesize!=='function')throw Error('ALERT_CORPUS_INVALID');
 const samples=SAMPLE_IDS.map(id=>corpus.cas.find(c=>c.id===id));
 if(samples.some(c=>!c?.entree?.source))throw Error('ALERT_CORPUS_INVALID');
 // Validate all fixtures before starting any completion. Labels and expected
 // decisions are never supplied to the model, and captured read dates stay put.
 const inputs=samples.map(c=>{const source=c.entree.source,coverage=source.lecture;
  return validateItem({...source,...(source.sourceStatus==='read'&&!source.readAt?{readAt:source.observedAt}:{}),
   ...(Number.isSafeInteger(coverage?.textChars)?{textChars:coverage.textChars,excerptMode:coverage.excerptMode,excerptTruncated:coverage.excerptTruncated}:{})});});
 const rows=[];
 for(let i=0;i<samples.length;i++){
  const c=samples[i],item=inputs[i],started=Date.now();
  const row={id:c.id,variante:'current-v3',purpose:'editorial-evaluation',contextVersion:PILOT_CONTEXT.version,
   sourceKind:c.reel===true?'captured-public-fixture':'synthetic-fixture',sourceReadAt:item.readAt,
   promptChars:synthesisPrompt(item,{purpose:'editorial-evaluation'}).length,selectionMeasured:false,deliveryMeasured:false};
  try{const brief=await synthesize(item);row.message=renderBrief(item,brief);row.brief=brief;row.status='GENERATED';}
  catch(error){row.status='ERROR';row.error_code=/^[A-Z_]{1,64}$/.test(error.code??error.message??'')?(error.code??error.message):'ALERT_SAMPLE_FAILED';}
  row.durationMs=Date.now()-started;rows.push(row);await record(row);
 }
 return {contextVersion:PILOT_CONTEXT.version,samples:rows.length,generated:rows.filter(r=>r.status==='GENERATED').length,
  errors:rows.filter(r=>r.status==='ERROR').length,selectionCalls:0,telegramMessages:0,providerUsageAvailable:false,rows};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const [mode,input,output]=process.argv.slice(2);
  if(mode!=='--live'||!path.isAbsolute(input??'')||!path.isAbsolute(output??''))throw Error('ALERT_SAMPLES_USAGE');
  const dir=lstatSync(path.dirname(output));if(!dir.isDirectory()||dir.isSymbolicLink()||dir.uid!==process.getuid()||(dir.mode&0o077))throw Error('PRIVATE_EVALUATION_OUTPUT_REQUIRED');
  const bytes=readFileSync(input);if(bytes.length>512000)throw Error('ALERT_CORPUS_INVALID');
  // Write-once output also prevents a repeated command from spending twice.
  writeFileSync(output,'',{mode:0o600,flag:'wx'});
  const report=await generateSamples(JSON.parse(bytes),{synthesize:createNativeSynthesis({binary:process.env.IVAN_OPENCLAW_BINARY??'openclaw',purpose:'editorial-evaluation'}),
   record:row=>appendFileSync(output,JSON.stringify({...row,corpusSha256:createHash('sha256').update(bytes).digest('hex')})+'\n')});
  const {rows,...metrics}=report;console.log(JSON.stringify(metrics));if(report.errors)process.exitCode=1;
 }catch(error){console.error(/^[A-Z_]{1,64}$/.test(error.message)?error.message:'ALERT_SAMPLES_FAILED');process.exitCode=1;}
}
