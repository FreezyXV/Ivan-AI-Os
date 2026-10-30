// Keep the old schedule loaded until the prepared replacement can take over.
// All steps run in one process; a failed activation always checks schedule recovery.
import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import {readFileSync} from 'node:fs';import {homedir} from 'node:os';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
const run=promisify(execFile),root=fileURLToPath(new URL('../',import.meta.url));
export async function activatePrepared(prepared,{runImpl=run,wait=ms=>new Promise(r=>setTimeout(r,ms)),maxWaitMs=180000}={}){
 const {candidate,settingsPath,previousSettings,backupDir,expectedCurrentSha256}=prepared??{};
 if(![candidate,settingsPath,previousSettings,backupDir].every(v=>typeof v==='string'&&path.isAbsolute(v))||! /^[a-f0-9]{64}$/.test(expectedCurrentSha256??''))throw Error('OPPORTUNITY_ACTIVATION_ARGUMENTS');
 const service=`gui/${process.getuid()}/com.ivan-ai-os.alerts`,node=process.execPath;
 const invoke=(script,args)=>runImpl(node,[path.join(root,'scripts',script),...args],{timeout:180000,maxBuffer:65536});
 const ensureOld=()=>invoke('install-mac-alerts.mjs',[previousSettings,'--update',settingsPath]);
 try{
  // Never bootout an in-flight cycle just to prepare a configuration change.
  const deadline=Date.now()+maxWaitMs;
  while(true){let state;try{state=await runImpl('/bin/launchctl',['print',service],{timeout:5000});}catch{break;}
   if(!/^\s*state = running$/m.test(state.stdout))break;
   if(Date.now()>=deadline)throw Error('OPPORTUNITY_WORKER_BUSY');await wait(1000);
  }
  const changed=await invoke('switch-openclaw-config.mjs',['--candidate',candidate,'--backup-dir',backupDir,'--expected-current-sha256',expectedCurrentSha256]);
  const result=JSON.parse(changed.stdout.trim());if(!['ACTIVE','UNCHANGED'].includes(result.status))throw Error('OPPORTUNITY_CONFIG_NOT_ACTIVE');
  await invoke('install-mac-alerts.mjs',[settingsPath,'--update',previousSettings]);
  await runImpl('/bin/launchctl',['print',service],{timeout:5000});return {status:'ACTIVE',scheduleLoaded:true};
 }catch(error){
  // The config helper performs its own rollback. The scheduler must never be
  // left disabled while a human/model qualification or next chat is awaited.
  try{await runImpl('/bin/launchctl',['print',service],{timeout:5000});}
  catch{try{await ensureOld();}catch{throw Error('OPPORTUNITY_SCHEDULE_RECOVERY_FAILED');}}
  throw Error(error.message==='OPPORTUNITY_WORKER_BUSY'?error.message:'OPPORTUNITY_ACTIVATION_FAILED_SCHEDULE_PRESERVED');
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{const file=process.argv[2],allowed=path.join(homedir(),'.ivan-ai-os/');if(!path.isAbsolute(file??'')||!file.startsWith(allowed))throw Error('OPPORTUNITY_ACTIVATION_ARGUMENTS');
  console.log(JSON.stringify(await activatePrepared(JSON.parse(readFileSync(file)))));
 }catch(e){console.error(/^[A-Z_]+$/.test(e.message)?e.message:'OPPORTUNITY_ACTIVATION_FAILED');process.exitCode=1;}
}
