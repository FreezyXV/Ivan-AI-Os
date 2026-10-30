import test from 'node:test';import assert from 'node:assert/strict';import {activatePrepared} from './activate-opportunity-release.mjs';
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
