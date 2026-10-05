import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,readdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {applySchedule} from './install-mac-alerts.mjs';
function fixture(t){const dir=mkdtempSync(path.join(tmpdir(),'ivan-schedule-update-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const plist=path.join(dir,'schedule.plist');writeFileSync(plist,'previous',{mode:0o600});
 return {dir,plist,backupDir:dir,previousBody:'previous',body:'candidate',domain:'gui/501'};
}
test('repeating an update is harmless; old backup names and orphaned temp files do not block it',async t=>{
 const f=fixture(t);writeFileSync(path.join(f.dir,'alerts.rollback.plist'),'first backup');writeFileSync(f.plist+'.update','orphan');
 let loaded=true;const actions=[];
 const run=async(_bin,args)=>{actions.push(args[0]);if(args[0]==='print'&&!loaded)throw {code:113};if(args[0]==='bootout')loaded=false;if(args[0]==='bootstrap')loaded=true;};
 assert.equal((await applySchedule({...f,run})).alreadyActive,false);
 assert.equal(readFileSync(f.plist,'utf8'),'candidate');
 const files=readdirSync(f.dir);actions.length=0;
 assert.equal((await applySchedule({...f,run})).alreadyActive,true);
 assert.deepEqual(actions,['print']);assert.deepEqual(readdirSync(f.dir),files);
 assert.equal(readFileSync(f.plist+'.update','utf8'),'orphan');assert.equal(readFileSync(path.join(f.dir,'alerts.rollback.plist'),'utf8'),'first backup');
});
test('a permanent bootstrap failure restores the old schedule, keeps its backup and removes only its own temp file',async t=>{
 const f=fixture(t);let loaded=true;
 const run=async(_bin,args)=>{if(args[0]==='print'&&!loaded)throw {code:113};
  if(args[0]==='bootout')loaded=false;
  if(args[0]==='bootstrap'){if(readFileSync(f.plist,'utf8')==='candidate')throw {code:113};loaded=true;}};
 await assert.rejects(applySchedule({...f,run}),/ALERT_UPDATE_ROLLED_BACK/);
 assert.equal(readFileSync(f.plist,'utf8'),'previous');assert.equal(loaded,true);
 const backups=readdirSync(f.dir).filter(name=>/^alerts\.rollback-/.test(name));assert.equal(backups.length,1);
 assert.equal(readFileSync(path.join(f.dir,backups[0]),'utf8'),'previous');assert.ok(!readdirSync(f.dir).some(name=>name.includes('.update-')));
});
test('an identical unloaded schedule is bootstrapped; mismatched schedules and an unknown launchctl error are preserved',async t=>{
 const f=fixture(t);const actions=[];
 const run=async(_bin,args)=>{actions.push(args[0]);if(args[0]==='print')throw {code:113};};
 await applySchedule({...f,body:'previous',run});assert.deepEqual(actions,['print','bootstrap']);
 await assert.rejects(applySchedule({...f,previousBody:'unrelated',run}),/ALERT_EXISTING_SCHEDULE_DIFFERS/);
 await assert.rejects(applySchedule({...f,run:async()=>{throw {code:5};}}));assert.equal(readFileSync(f.plist,'utf8'),'previous');
});
test('a failed rollback is reported as unavailable, never as a successful restoration',async t=>{
 const f=fixture(t);
 const run=async(_bin,args)=>{if(args[0]==='bootstrap')throw {code:113};};
 await assert.rejects(applySchedule({...f,run}),/ALERT_UPDATE_ROLLBACK_FAILED/);
 assert.equal(readFileSync(f.plist,'utf8'),'previous');
});
test('a loaded service that fails its post-start health check is stopped before restoring its previous job',async t=>{
 const f=fixture(t);let loaded=true,bootouts=0;
 const run=async(_bin,args)=>{if(args[0]==='print'&&!loaded)throw {code:113};if(args[0]==='bootout'){loaded=false;bootouts++;}
  if(args[0]==='bootstrap'){assert.equal(loaded,false);loaded=true;}};
 await assert.rejects(applySchedule({...f,run,verify:async()=>{throw Error('unhealthy');}}),/ALERT_UPDATE_ROLLED_BACK/);
 assert.equal(bootouts,2);assert.equal(loaded,true);assert.equal(readFileSync(f.plist,'utf8'),'previous');
});
