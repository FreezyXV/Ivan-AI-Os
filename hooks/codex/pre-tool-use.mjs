// Native Codex input → the reviewed, pinned Claude adapter. No second policy catalogue.
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {lstatSync} from 'node:fs';
const deny=reason=>({hookSpecificOutput:{hookEventName:'PreToolUse',permissionDecision:'deny',permissionDecisionReason:reason}});
export function toClaudeCalls(input){
 if(input?.tool_name==='Bash'){
  if(typeof input.tool_input?.command!=='string')throw Error('CODEX_PATCH_METADATA_INVALID');
  return[{tool_name:'Bash',tool_input:{command:input.tool_input.command}}];
 }
 if(input?.tool_name!=='apply_patch')return[];
 const command=typeof input.tool_input==='string'?input.tool_input:input.tool_input?.command;
 if(typeof command!=='string'||command.length>1000000||!command.startsWith('*** Begin Patch\n')||!command.trimEnd().endsWith('*** End Patch'))throw Error('CODEX_PATCH_METADATA_INVALID');
 const cwd=input.cwd;if(!path.isAbsolute(cwd??''))throw Error('CODEX_PATCH_METADATA_INVALID');
 // Only headers become path metadata. Added/removed file contents never enter Jev.
 const files=[...command.matchAll(/^\*\*\* (?:Add File:|Update File:|Delete File:|Move to:) (.+)$/gm)].map(m=>m[1]);
 if(files.length<1||files.length>20||files.some(f=>/[\r\x00]/.test(f)))throw Error('CODEX_PATCH_METADATA_INVALID');
 return [...new Set(files.map(f=>path.resolve(cwd,f)))].map(file=>({tool_name:'Edit',tool_input:{file_path:file}}));
}
export function createCodexHook({claudeRun}={}){
 if(typeof claudeRun!=='function')throw Error('CODEX_HOOK_ADAPTER_REQUIRED');
 return async(input,options={})=>{
  const env={...options.env,IVAN_CLAUDE_HOOK_MODE:options.env?.IVAN_CODEX_HOOK_MODE==='gate'?'gate':'shadow'};
  let calls;try{calls=toClaudeCalls(input);}catch{return env.IVAN_CLAUDE_HOOK_MODE==='gate'?deny('Ivan AI OS : métadonnées de patch illisibles, vérifier le patch avant exécution.'):null;}
  for(const call of calls){
   const result=await claudeRun(call,{...options,env}),decision=result?.hookSpecificOutput?.permissionDecision;
   if(decision==='deny')return result;
   // Codex currently does not implement PreToolUse "ask". Never emit a shape
   // that silently fails open, nor claim that the adapter authorizes an action.
   if(decision==='ask')return deny('Ivan AI OS : validation du garde-fou requise ; le hook Codex ne sait pas demander cette validation.');
   if(decision)throw Error('CODEX_HOOK_OUTPUT_INVALID');
  }
  return null;
 };
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const [adapter]=process.argv.slice(2);
  if(!path.isAbsolute(adapter??''))throw Error('CODEX_HOOK_ADAPTER_REQUIRED');
  const stat=lstatSync(adapter);if(!stat.isFile()||stat.isSymbolicLink()||stat.uid!==process.getuid())throw Error('CODEX_HOOK_ADAPTER_INVALID');
  const {run}=await import(pathToFileURL(adapter));let raw='';
  for await(const chunk of process.stdin){raw+=chunk;if(raw.length>1000000)throw Error('CODEX_HOOK_INPUT_TOO_LARGE');}
  const output=await createCodexHook({claudeRun:run})(JSON.parse(raw),{env:process.env});
  if(output)process.stdout.write(JSON.stringify(output));
 }catch{
  // Exit 2 is a supported native block. No raw input, path, key or exception.
  process.stderr.write('IVAN_CODEX_HOOK_UNAVAILABLE');process.exitCode=process.env.IVAN_CODEX_HOOK_MODE==='gate'?2:0;
 }
}
