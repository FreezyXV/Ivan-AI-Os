import test from 'node:test';
import assert from 'node:assert/strict';
import {bootstrapWithRetry} from './reload-launch-agent.mjs';
const base={domain:'gui/501',plist:'/private/tmp/synthetic.plist'};
test('launchd unloading EIO receives bounded retries rather than breaking activation and rollback',async()=>{
 let calls=0,waits=0;await bootstrapWithRetry({...base,pause:async()=>waits++,run:async()=>{if(++calls<3)throw Object.assign(Error('still unloading'),{code:5});}});
 assert.equal(calls,3);assert.equal(waits,2);
});
test('persistent EIO stops after the bound; permanent errors do not retry',async()=>{
 let calls=0;await assert.rejects(bootstrapWithRetry({...base,pause:async()=>{},run:async()=>{calls++;throw Object.assign(Error(),{code:5});}}));assert.equal(calls,8);
 calls=0;await assert.rejects(bootstrapWithRetry({...base,pause:async()=>{},run:async()=>{calls++;throw Object.assign(Error(),{code:113});}}));assert.equal(calls,1);
});
