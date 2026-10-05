// Replace only this project's pinned adapter; preserve modes and native permissions.
import path from 'node:path';
import {readFileSync,writeFileSync,lstatSync,renameSync,unlinkSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
export function prepareHookSettings(settings,{previousCommand,hookPath}={}){
 if(!path.isAbsolute(hookPath??'')||/["\r\n]/.test(hookPath)||typeof previousCommand!=='string')throw Error('HOOK_UPDATE_INVALID');
 const next=structuredClone(settings),matches=[];
 for(const group of next.hooks?.PreToolUse??[])for(const hook of group.hooks??[])
  if(hook.type==='command'&&hook.command===previousCommand)matches.push(hook);
 if(matches.length!==1)throw Error('HOOK_ENTRY_NOT_UNIQUE');
 matches[0].command=`node "${hookPath}"`;
 return next;
}
export function updateHook({settingsPath,hookPath,previousCommand,expectedSha256,backupDir}){
 const stat=lstatSync(settingsPath);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1||stat.uid!==process.getuid())throw Error('HOOK_SETTINGS_UNAVAILABLE');
 const original=readFileSync(settingsPath),sha=createHash('sha256').update(original).digest('hex');
 if(sha!==expectedSha256)throw Error('HOOK_SETTINGS_CHANGED');
 const source=lstatSync(hookPath),dir=lstatSync(backupDir);
 if(!source.isFile()||source.isSymbolicLink()||!dir.isDirectory()||dir.isSymbolicLink()||dir.uid!==process.getuid()||(dir.mode&0o077))throw Error('HOOK_SOURCE_UNAVAILABLE');
 const next=prepareHookSettings(JSON.parse(original),{previousCommand,hookPath});
 const backup=path.join(backupDir,`claude-settings-${sha}-${randomUUID()}.rollback.json`),temp=settingsPath+`.update-${randomUUID()}`;
 writeFileSync(backup,original,{flag:'wx',mode:0o600});
 try{
  writeFileSync(temp,JSON.stringify(next,null,2)+'\n',{flag:'wx',mode:stat.mode&0o777});
  if(createHash('sha256').update(readFileSync(settingsPath)).digest('hex')!==sha)throw Error('HOOK_SETTINGS_CHANGED');
  renameSync(temp,settingsPath);
 }finally{try{unlinkSync(temp);}catch{}}
 return {status:'UPDATED',hookPath,backup,mode:next.env?.IVAN_CLAUDE_HOOK_MODE,gateway:next.env?.IVAN_GATEWAY_URL};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{const [planPath]=process.argv.slice(2);if(!path.isAbsolute(planPath??''))throw Error('HOOK_UPDATE_USAGE');
  console.log(JSON.stringify(updateHook(JSON.parse(readFileSync(planPath)))));
 }catch(error){console.error(/^[A-Z_]{1,64}$/.test(error.message)?error.message:'HOOK_UPDATE_FAILED');process.exitCode=1;}
}
