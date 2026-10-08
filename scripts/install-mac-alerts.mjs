// One reversible local schedule. Secrets stay in private settings/native auth.
import {readFileSync,writeFileSync,lstatSync,mkdirSync,existsSync,renameSync,unlinkSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {homedir} from 'node:os';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {pathToFileURL} from 'node:url';
import {bootstrapWithRetry} from './reload-launch-agent.mjs';
const run=promisify(execFile),label='com.ivan-ai-os.alerts';
const xml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function launchAgent({node,releaseRoot,settingsPath,stateDir}){
 if(![node,releaseRoot,settingsPath,stateDir].every(v=>typeof v==='string'&&path.isAbsolute(v))||!/[a-f\d]{7}$/.test(releaseRoot))throw Error('ALERT_INSTALL_INVALID');
 return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>${label}</string>
<key>ProgramArguments</key><array>${[node,path.join(releaseRoot,'scripts/mac-alerts-cycle.mjs'),settingsPath].map(v=>`<string>${xml(v)}</string>`).join('')}</array>
<key>StartInterval</key><integer>300</integer><key>RunAtLoad</key><true/>
<key>EnvironmentVariables</key><dict><key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string></dict>
<key>StandardOutPath</key><string>${xml(path.join(stateDir,'cycles.log'))}</string>
<key>StandardErrorPath</key><string>${xml(path.join(stateDir,'cycles.err.log'))}</string>
</dict></plist>\n`;
}
function replacePlist(plist,body){
 const temp=plist+'.update-'+randomUUID();let created=false;
 try{writeFileSync(temp,body,{mode:0o600,flag:'wx'});created=true;renameSync(temp,plist);created=false;}
 finally{if(created)unlinkSync(temp);}
}
export async function applySchedule({plist,body,previousBody,backupDir,domain,run,serviceLabel=label,verify=async()=>{}}){
 if(!path.isAbsolute(plist)||!path.isAbsolute(backupDir)||!/^gui\/\d+$/.test(domain)||typeof body!=='string'||typeof run!=='function'||
    !['com.ivan-ai-os.alerts','com.ivan-ai-os.jev'].includes(serviceLabel)||typeof verify!=='function')throw Error('ALERT_INSTALL_INVALID');
 const current=readFileSync(plist,'utf8');
 if(current!==body&&current!==previousBody)throw Error('ALERT_EXISTING_SCHEDULE_DIFFERS');
 let loaded=true;
 try{await run('/bin/launchctl',['print',domain+'/'+serviceLabel]);}
 catch(error){if(error.code!==113)throw error;loaded=false;}
 if(current===body){
  if(!loaded)await bootstrapWithRetry({run,domain,plist});
  await verify();
  return {alreadyActive:loaded};
 }
 // Each attempt has a distinct, immutable backup. Old temporary files are
 // evidence of a previous interruption, never an excuse to overwrite them.
 const backup=path.join(backupDir,serviceLabel.split('.').at(-1)+'.rollback-'+randomUUID()+'.plist');
 writeFileSync(backup,current,{mode:0o600,flag:'wx'});
 if(loaded)try{await run('/bin/launchctl',['bootout',domain+'/'+serviceLabel]);}catch(error){if(error.code!==113)throw error;}
 try{
  replacePlist(plist,body);await run('/usr/bin/plutil',['-lint',plist]);
  await bootstrapWithRetry({run,domain,plist});
  await verify();
 }catch(error){
  try{
   let newLoaded=true;try{await run('/bin/launchctl',['print',domain+'/'+serviceLabel]);}catch(e){if(e.code!==113)throw e;newLoaded=false;}
   if(newLoaded)await run('/bin/launchctl',['bootout',domain+'/'+serviceLabel]);
   replacePlist(plist,current);await bootstrapWithRetry({run,domain,plist});
  }
  catch{throw Error('ALERT_UPDATE_ROLLBACK_FAILED');}
  throw Error('ALERT_UPDATE_ROLLED_BACK');
 }
 return {alreadyActive:false,backup};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const [settingsPath,mode,previousSettingsPath]=process.argv.slice(2);
  if(!['--prepare','--activate','--update'].includes(mode)||!path.isAbsolute(settingsPath)||
    (mode==='--update'&&(!previousSettingsPath||!path.isAbsolute(previousSettingsPath))))throw Error('ALERT_INSTALL_USAGE');
  const st=lstatSync(settingsPath);if(!st.isFile()||st.isSymbolicLink()||st.nlink!==1||st.uid!==process.getuid()||(st.mode&0o077))throw Error('ALERT_SETTINGS_INVALID');
  const settings=JSON.parse(readFileSync(settingsPath)),release=settings.releaseRoot;
  if(!release.startsWith(path.join(homedir(),'.ivan-ai-os/releases/orchestrator-'))||!/^[a-f\d]{40}$/.test(settings.sourceCommit)||
     JSON.parse(readFileSync(path.join(release,'ivan-release.json'))).sourceCommit!==settings.sourceCommit)throw Error('ALERT_RELEASE_INVALID');
  const dir=path.join(homedir(),'Library/LaunchAgents'),plist=path.join(dir,label+'.plist');mkdirSync(dir,{recursive:true});
  const body=launchAgent({node:process.execPath,releaseRoot:release,settingsPath,stateDir:settings.stateDir});
  let previousBody;
  if(mode==='--update'){
   const previous=JSON.parse(readFileSync(previousSettingsPath));
   previousBody=launchAgent({node:process.execPath,releaseRoot:previous.releaseRoot,settingsPath:previousSettingsPath,stateDir:previous.stateDir});
   if(!existsSync(plist)||![previousBody,body].includes(readFileSync(plist,'utf8'))||previous.stateDir!==settings.stateDir)throw Error('ALERT_EXISTING_SCHEDULE_DIFFERS');
  }else if(existsSync(plist)&&readFileSync(plist,'utf8')!==body)throw Error('ALERT_EXISTING_SCHEDULE_DIFFERS');
  if(!existsSync(plist))writeFileSync(plist,body,{mode:0o600,flag:'wx'});
  const ps=lstatSync(plist);if(!ps.isFile()||ps.isSymbolicLink()||ps.nlink!==1||ps.uid!==process.getuid()||(ps.mode&0o077))throw Error('ALERT_PLIST_INVALID');
  for(const filename of ['cycles.log','cycles.err.log']){
   const file=path.join(settings.stateDir,filename);
   if(!existsSync(file))writeFileSync(file,'',{mode:0o600,flag:'wx'});
   const s=lstatSync(file);if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1||(s.mode&0o077))throw Error('ALERT_LOG_INVALID');
  }
  await run('/usr/bin/plutil',['-lint',plist],{timeout:5000});
  if(mode==='--activate'||mode==='--update'){
   const {stdout}=await run(settings.openclawBinary,['gateway','call','health','--json','--timeout','5000'],{timeout:10000});
   if(JSON.parse(stdout.slice(stdout.indexOf('{'))).ok!==true)throw Error('ALERT_GATEWAY_UNHEALTHY');
   await applySchedule({plist,body,previousBody,backupDir:path.dirname(settingsPath),domain:`gui/${process.getuid()}`,
    run:(bin,args)=>run(bin,args,{timeout:10000})});
  }
  console.log(JSON.stringify({status:mode==='--prepare'?'PREPARED':'ACTIVE',label,sourceCommit:settings.sourceCommit,intervalSeconds:300,plist}));
 }catch(error){console.error(/^[A-Z_]{3,60}$/.test(error.message)?error.message:'ALERT_INSTALL_FAILED');process.exitCode=1;}
}
