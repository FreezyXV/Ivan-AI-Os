import test from 'node:test';import assert from 'node:assert/strict';import {activatePrepared} from './activate-opportunity-release.mjs';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import path from 'node:path';
const p={candidate:'/private/tmp/candidate',settingsPath:'/private/tmp/new',previousSettings:'/private/tmp/old',backupDir:'/private/tmp/backup',expectedCurrentSha256:'a'.repeat(64)};
test('activation does not unload the old worker while it waits, then verifies the replacement schedule',async()=>{
 const calls=[];let checks=0;const r=await activatePrepared(p,{wait:async()=>{},runImpl:async(bin,args)=>{calls.push(args);
  if(bin==='/bin/launchctl')return {stdout:++checks===1?'state = running':'state = waiting'};
  return {stdout:args[0].endsWith('switch-openclaw-config.mjs')?'{"status":"ACTIVE"}':'{}'};
 }});assert.equal(r.scheduleLoaded,true);assert.ok(!calls.some(a=>a.includes('bootout')));assert.ok(calls.some(a=>a.includes('/private/tmp/new')&&a.includes('--update')));
});
test('failed switch with an absent schedule restores the previous worker before returning failure',async()=>{
 let checks=0,recovered=false;await assert.rejects(activatePrepared(p,{runImpl:async(bin,args)=>{
  if(bin==='/bin/launchctl'){checks++;throw Error('missing');}
  if(args[0].endsWith('switch-openclaw-config.mjs'))throw Error('failure');
  assert.equal(args[1],p.previousSettings);recovered=true;return {stdout:'{}'};
 }}),/SCHEDULE_PRESERVED/);assert.equal(checks,2);assert.equal(recovered,true);
});
test('a failed schedule replacement rolls config and schedule back together',async t=>{
 const dir=mkdtempSync(path.join(tmpdir(),'ivan-activation-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));const candidate=path.join(dir,'candidate');writeFileSync(candidate,'new');
 let switches=0,oldRestored=false,waits=0,checks=0;
 await assert.rejects(activatePrepared({...p,candidate},{wait:async()=>{waits++;},runImpl:async(bin,args)=>{
  if(bin==='/bin/launchctl')return {stdout:++checks===2?'state = running':'state = waiting'};
  if(args[0].endsWith('switch-openclaw-config.mjs')){switches++;return {stdout:JSON.stringify({status:'ACTIVE',backup:'/private/tmp/old-config'})};}
  if(args[1]===p.settingsPath)throw Error('ALERT_UPDATE_ROLLED_BACK');
  assert.equal(args[1],p.previousSettings);oldRestored=true;return {stdout:'{}'};
 }}),/FAILED_SCHEDULE_PRESERVED/);assert.equal(switches,2);assert.equal(oldRestored,true);assert.equal(waits,1);
});
test('a rollback that cannot restore config is reported as partial, never as coherent success',async()=>{
 await assert.rejects(activatePrepared(p,{runImpl:async(bin,args)=>{
  if(bin==='/bin/launchctl')return {stdout:'state = waiting'};
  if(args[0].endsWith('switch-openclaw-config.mjs'))return {stdout:'{"status":"ACTIVE"}'};
  if(args[1]===p.settingsPath)throw Error('install failed');return {stdout:'{}'};
 }}),/PARTIAL_SCHEDULE_PRESERVED/);
});
test('missing new tool fails activation before replacing the schedule and rolls the config back',async t=>{
 const dir=mkdtempSync(path.join(tmpdir(),'ivan-capability-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));const candidate=path.join(dir,'candidate'),settingsPath=path.join(dir,'settings');writeFileSync(candidate,'new');writeFileSync(settingsPath,'{"openclawBinary":"/test/openclaw"}');let switched=0,installed=false,restored=false;
 await assert.rejects(activatePrepared({...p,candidate,settingsPath,probeRadar:true},{runImpl:async(bin,args)=>{
  if(bin==='/bin/launchctl')return {stdout:'state = waiting'};
  if(args[0].endsWith('switch-openclaw-config.mjs')){switched++;return {stdout:JSON.stringify({status:'ACTIVE',backup:'/private/tmp/old-config'})};}
  if(args[0].endsWith('probe-radar-tool.mjs')){assert.equal(args[1],'/test/openclaw');return {stdout:'{"available":false}'};}
  if(args[1]===settingsPath)installed=true;if(args[1]===p.previousSettings)restored=true;return {stdout:'{}'};
 }}),/SCHEDULE_PRESERVED/);assert.equal(switched,2);assert.equal(installed,false);assert.equal(restored,true);
});
