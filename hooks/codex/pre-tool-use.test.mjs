import test from 'node:test';
import assert from 'node:assert/strict';
import {createCodexHook,toClaudeCalls} from './pre-tool-use.mjs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
test('patch headers including rename targets are classified; private file contents never leave the adapter',()=>{
 const input={cwd:'/project',tool_name:'apply_patch',tool_input:{command:'*** Begin Patch\n*** Update File: services/a.js\n@@\n+PRIVATE_CONTENT_NOT_FOR_JEV\n*** Move to: constitution/new.md\n*** End Patch\n'}};
 const calls=toClaudeCalls(input);assert.equal(calls.length,2);assert.equal(calls[1].tool_input.file_path,'/project/constitution/new.md');
 assert.ok(!JSON.stringify(calls).includes('PRIVATE_CONTENT'));assert.deepEqual(toClaudeCalls({tool_name:'web_search'}),[]);
});
test('an unavailable pinned adapter keeps shadow non-blocking and gives gate a supported exit-2 refusal',()=>{
 for(const [mode,status] of [['shadow',0],['gate',2]]){
  const result=spawnSync(process.execPath,[fileURLToPath(new URL('./pre-tool-use.mjs',import.meta.url)),'/nonexistent/reviewed-adapter.mjs'],
   {input:'{}',encoding:'utf8',env:{...process.env,IVAN_CODEX_HOOK_MODE:mode}});
  assert.equal(result.status,status);assert.equal(result.stdout,'');assert.equal(result.stderr,'IVAN_CODEX_HOOK_UNAVAILABLE');
 }
});
test('ordinary operations retain silence while native ask incompatibility is converted to a supported block',async()=>{
 let calls=0;const hook=createCodexHook({claudeRun:async input=>{calls++;return input.tool_input.file_path?.includes('constitution')?
  {hookSpecificOutput:{permissionDecision:'ask'}}:null;}});
 assert.equal(await hook({tool_name:'Bash',tool_input:{command:'git status'}}),null);
 const result=await hook({cwd:'/project',tool_name:'apply_patch',tool_input:{command:'*** Begin Patch\n*** Update File: constitution/a.md\n@@\n+x\n*** End Patch'}});
 assert.equal(result.hookSpecificOutput.permissionDecision,'deny');assert.equal(calls,2);
 assert.ok(!JSON.stringify(result).includes('"ask"'));assert.ok(!JSON.stringify(result).includes('"allow"'));
});
test('malformed patch metadata fails closed only in gate and the shared adapter receives the selected mode',async()=>{
 let calls=0;const hook=createCodexHook({claudeRun:async(_input,options)=>{calls++;assert.equal(options.env.IVAN_CLAUDE_HOOK_MODE,'gate');return null;}});
 const bad={cwd:'/project',tool_name:'apply_patch',tool_input:{command:'unparseable'}};
 assert.equal(await hook(bad),null);assert.equal((await hook(bad,{env:{IVAN_CODEX_HOOK_MODE:'gate'}})).hookSpecificOutput.permissionDecision,'deny');
 await hook({tool_name:'Bash',tool_input:{command:'git status'}},{env:{IVAN_CODEX_HOOK_MODE:'gate'}});assert.equal(calls,1);
});
