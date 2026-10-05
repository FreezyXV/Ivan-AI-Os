// One paid pass: labels never enter the request; claim output before reading credentials.
import {readFileSync,lstatSync,openSync,writeSync,closeSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {validateItem,PILOT_CONTEXT} from '../services/alerts-runtime/src/context.js';
import {createJevSelector} from '../services/alerts-runtime/src/jev-selector.js';
export async function measure(inputs,{select,record=()=>{}}={}){
 if(!Array.isArray(inputs)||inputs.length<1||inputs.length>200||new Set(inputs.map(r=>r.id)).size!==inputs.length)throw Error('ALERT_MEASURE_INPUT_INVALID');
 const validated=inputs.map(r=>{if(!/^[A-Za-z0-9_-]{1,40}$/.test(r.id??''))throw Error('ALERT_MEASURE_INPUT_INVALID');return{id:r.id,item:validateItem(r.item)};});
 let attempts=0,errors=0;
 for(const {id,item} of validated){
  const started=Date.now();let row;
  try{attempts++;const selected=await select(item,PILOT_CONTEXT);row={id,rep:1,ms:Date.now()-started,...selected};}
  catch{errors++;row={id,rep:1,ms:Date.now()-started,error:'SELECTION_UNAVAILABLE'};}
  record(row);
 }
 return{cases:validated.length,attempts,errors,proseCalls:0,telegramCalls:0};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 let fd;
 try{
  const [input,output]=process.argv.slice(2);if(!path.isAbsolute(input??'')||!path.isAbsolute(output??''))throw Error('ALERT_MEASURE_USAGE');
  const parent=lstatSync(path.dirname(output));if(!parent.isDirectory()||parent.isSymbolicLink()||parent.uid!==process.getuid()||(parent.mode&0o077))throw Error('ALERT_MEASURE_PRIVATE_OUTPUT_REQUIRED');
  const bytes=readFileSync(input);if(bytes.length>512000)throw Error('ALERT_MEASURE_INPUT_INVALID');
  const rows=bytes.toString().trim().split('\n').map(l=>JSON.parse(l));
  // Complete validation before claiming output and before any paid operation.
  await measure(rows,{select:async()=>({}),record:()=>{}});
  fd=openSync(output,'wx',0o600);
  const write=row=>writeSync(fd,JSON.stringify(row)+'\n');
  write({type:'run',status:'IN_PROGRESS',at:new Date().toISOString(),inputSha256:createHash('sha256').update(bytes).digest('hex'),contextVersion:PILOT_CONTEXT.version});
  const result=await measure(rows,{select:createJevSelector(),record:write});
  write({type:'end',status:result.errors?'INCOMPLETE':'COMPLETE',...result});console.log(JSON.stringify(result));if(result.errors)process.exitCode=1;
 }catch(error){console.error(error.code==='EEXIST'?'ALERT_MEASURE_ALREADY_STARTED':/^[A-Z_]+$/.test(error.message)?error.message:'ALERT_MEASURE_FAILED');process.exitCode=1;}
 finally{if(fd!==undefined)closeSync(fd);}
}
