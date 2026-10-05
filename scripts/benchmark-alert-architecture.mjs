// One coordinated benchmark, no live queue mutation or Telegram delivery.
import {readFileSync,lstatSync,openSync,writeSync,closeSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {validateItem,prefilter,PILOT_CONTEXT} from '../services/alerts-runtime/src/context.js';
import {createJevSelector} from '../services/alerts-runtime/src/jev-selector.js';
import {createNativeAssessment} from '../services/alerts-runtime/src/synthesis.js';
import {selectionOutcome} from '../services/alerts-runtime/src/pipeline.js';
export async function benchmark(fixtures,{select,assess,record=()=>{}}={}){
 if(!Array.isArray(fixtures)||fixtures.length<1||fixtures.length>50||new Set(fixtures.map(f=>f.id)).size!==fixtures.length)throw Error('ARCHITECTURE_FIXTURES_INVALID');
 const inputs=fixtures.map(f=>{if(!/^[A-Za-z0-9_-]{1,40}$/.test(f.id??''))throw Error('ARCHITECTURE_FIXTURES_INVALID');return{id:f.id,item:validateItem(f.item)};});
 let jevAttempts=0,nativeAttempts=0,errors=0;
 for(const {id,item} of inputs){
  // Historical semantic replay: the actual fixture observation time is used.
  // Never pretend these old articles are fresh production news.
  const local=prefilter(item,{now:Date.parse(item.observedAt)});
  if(local.decision!=='select'){record({id,local,decision:local.decision==='skip'?'skip':'review',calls:0,deliveryMeasured:false});continue;}
  const row={id,local,deliveryMeasured:false};
  for(const [key,fn] of [['jev',select],['native',assess]]){
   if(!fn){row[key]={error:'PROVIDER_NOT_MEASURED'};continue;}
   const started=Date.now();if(key==='jev')jevAttempts++;else nativeAttempts++;
   try{row[key]={...await fn(item,PILOT_CONTEXT),ms:Date.now()-started};}
   catch(error){errors++;row[key]={error:/^(ALERT_|NATIVE_)[A-Z_]{1,64}$/.test(error.code??'')?error.code:'PROVIDER_UNAVAILABLE',ms:Date.now()-started};}
  }
  record(row);
 }
 return{cases:inputs.length,jevAttempts,nativeAttempts,errors,queueMutations:0,telegramCalls:0};
}
export function scoreBenchmark(labels,rows,{policy={keepMinConfidence:0.75,skipMinConfidence:0.75}}={}){
 const expected=labels?.labels;
 if(!Array.isArray(expected)||new Set(expected.map(l=>l.id)).size!==expected.length||
    expected.some(l=>!['keep','review','skip'].includes(l.selection))||rows.length!==expected.length||
    new Set(rows.map(r=>r.id)).size!==rows.length||rows.some(r=>!expected.some(l=>l.id===r.id)))throw Error('ARCHITECTURE_RESULTS_INCOMPLETE');
 const byId=new Map(expected.map(l=>[l.id,l.selection])),matrices={B:{},C:{},D:{},E:{}};
 for(const row of rows){
  const b=row.decision??(row.jev?.error?'review':selectionOutcome(row.jev,policy));
  const c=row.decision??(row.native?.error?'review':row.native?.decision);
  if(!['keep','review','skip'].includes(c))throw Error('ARCHITECTURE_RESULTS_INVALID');
  for(const [key,out] of Object.entries({B:b,C:c,D:b==='skip'?'skip':c,E:b==='keep'?c:b})){
   const cell=byId.get(row.id)+'>'+out;matrices[key][cell]=(matrices[key][cell]??0)+1;
  }
 }
 return Object.fromEntries(Object.entries(matrices).map(([key,matrix])=>{
  const g=k=>matrix[k]??0,n=rows.length,useful=g('keep>keep')+g('keep>review')+g('keep>skip');
  return[key,{n,matrix,usefulFound:g('keep>keep'),useful,recall:useful?g('keep>keep')/useful:null,
   noiseKept:g('skip>keep')+g('review>keep'),usefulDropped:g('keep>skip'),
   exact:(g('keep>keep')+g('review>review')+g('skip>skip'))/n,deliveryMeasured:false}];
 }));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 let fd;
 try{
  const [mode,input,labelsPath,output]=process.argv.slice(2);
  if(mode==='--score'){
   if(![input,labelsPath].every(v=>path.isAbsolute(v??''))||output!==undefined)throw Error('ARCHITECTURE_BENCHMARK_USAGE');
   const labels=JSON.parse(readFileSync(input)),records=readFileSync(labelsPath,'utf8').trim().split('\n').map(JSON.parse);
   if(records[0]?.fixturesSha256!==labels.fixturesSha256||records.at(-1)?.status!=='COMPLETE')throw Error('ARCHITECTURE_RESULTS_INCOMPLETE');
   console.log(JSON.stringify(scoreBenchmark(labels,records.filter(r=>r.id))));process.exit(0);
  }
  if(mode!=='--live'||![input,labelsPath,output].every(v=>path.isAbsolute(v??'')))throw Error('ARCHITECTURE_BENCHMARK_USAGE');
  const parent=lstatSync(path.dirname(output));if(!parent.isDirectory()||parent.isSymbolicLink()||parent.uid!==process.getuid()||(parent.mode&0o077))throw Error('PRIVATE_BENCHMARK_OUTPUT_REQUIRED');
  const bytes=readFileSync(input);if(bytes.length>512000)throw Error('ARCHITECTURE_FIXTURES_INVALID');
  const fixtures=bytes.toString().trim().split('\n').map(JSON.parse),labels=JSON.parse(readFileSync(labelsPath));
  const fixturesSha256=createHash('sha256').update(bytes).digest('hex');
  if(labels.fixturesSha256!==fixturesSha256)throw Error('ARCHITECTURE_FIXTURES_CHANGED');
  await benchmark(fixtures);scoreBenchmark(labels,fixtures.map(f=>({id:f.id,decision:'review'})));
  fd=openSync(output,'wx',0o600);const record=row=>writeSync(fd,JSON.stringify(row)+'\n');
  record({type:'run',status:'IN_PROGRESS',at:new Date().toISOString(),fixturesSha256,contextVersion:PILOT_CONTEXT.version,deliveryMeasured:false});
  const rows=[],result=await benchmark(fixtures,{select:createJevSelector(),assess:createNativeAssessment({binary:'/Users/yoanpetrov/.openclaw/bin/openclaw'}),record:row=>{rows.push(row);record(row);}});
  const scores=scoreBenchmark(labels,rows);
  record({type:'end',status:'COMPLETE',...result,scores});console.log(JSON.stringify({result,scores}));
 }catch(error){console.error(error.code==='EEXIST'?'ARCHITECTURE_BENCHMARK_ALREADY_STARTED':/^[A-Z_]+$/.test(error.message)?error.message:'ARCHITECTURE_BENCHMARK_FAILED');process.exitCode=1;}
 finally{if(fd!==undefined)closeSync(fd);}
}
