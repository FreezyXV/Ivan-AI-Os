import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {prepareHookSettings,updateHook} from './update-claude-hook.mjs';
const old='node "/old/pre-tool-use.mjs"',next='/new/pre-tool-use.mjs';
const settings={env:{IVAN_CLAUDE_HOOK_MODE:'gate',IVAN_GATEWAY_URL:'http://127.0.0.1:4311'},permissions:{allow:['Read']},
 hooks:{PreToolUse:[{matcher:'Write|Bash',hooks:[{type:'command',command:old,timeout:5},{type:'command',command:'other'}]}]}};
test('a pinned update preserves mode, native permissions and every unrelated hook',()=>{
 const result=prepareHookSettings(settings,{previousCommand:old,hookPath:next});
 assert.deepEqual(result.env,settings.env);assert.deepEqual(result.permissions,settings.permissions);
 assert.equal(result.hooks.PreToolUse[0].hooks[0].command,`node "${next}"`);
 assert.equal(result.hooks.PreToolUse[0].hooks[1].command,'other');assert.equal(settings.hooks.PreToolUse[0].hooks[0].command,old);
 assert.throws(()=>prepareHookSettings(settings,{previousCommand:'missing',hookPath:next}),/HOOK_ENTRY_NOT_UNIQUE/);
});
test('the update keeps an exact backup and refuses concurrent changes before writing',t=>{
 const dir=mkdtempSync(path.join(tmpdir(),'ivan-hook-update-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const settingsPath=path.join(dir,'settings.json'),hookPath=path.join(dir,'pre-tool-use.mjs');
 const original=JSON.stringify(settings);writeFileSync(settingsPath,original);writeFileSync(hookPath,'// reviewed snapshot');
 const plan={settingsPath,hookPath,previousCommand:old,backupDir:dir,expectedSha256:createHash('sha256').update(original).digest('hex')};
 const result=updateHook(plan);assert.equal(readFileSync(result.backup,'utf8'),original);
 assert.equal(JSON.parse(readFileSync(settingsPath)).env.IVAN_CLAUDE_HOOK_MODE,'gate');
 const current=readFileSync(settingsPath,'utf8');assert.throws(()=>updateHook(plan),/HOOK_SETTINGS_CHANGED/);
 assert.equal(readFileSync(settingsPath,'utf8'),current);
});
