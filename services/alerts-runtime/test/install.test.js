import test from 'node:test';
import assert from 'node:assert/strict';
import {launchAgent} from '../../../scripts/install-mac-alerts.mjs';
test('launchd invokes one pinned cycle without a key, recipient or generated command in its arguments',()=>{
 const p=launchAgent({node:'/node',releaseRoot:'/release/orchestrator-123abcd',settingsPath:'/private/a & b.json',stateDir:'/private/state'});
 assert.match(p,/<integer>300<\/integer>/);assert.match(p,/mac-alerts-cycle.mjs/);
 assert.match(p,/a &amp; b.json/);assert.doesNotMatch(p,/Bearer|telegram|--digest-now|--process-now|<key>KeepAlive/);
 assert.throws(()=>launchAgent({node:'node',releaseRoot:'/release/orchestrator-123abcd',settingsPath:'/settings',stateDir:'/state'}));
});
