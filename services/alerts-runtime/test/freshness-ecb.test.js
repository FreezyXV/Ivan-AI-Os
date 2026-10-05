import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceMaxAgeHours} from '../src/context.js';

// Claude #58 dry run @23cf0be: an ECB President interview (/press/inter/) aged out at 72 h
// while speeches and press releases keep 168 h. Same institution, same communication class.
test('ECB interviews share the 168 h window of speeches and press releases',()=>{
  const at=url=>sourceMaxAgeHours({url});
  assert.equal(at('https://www.ecb.europa.eu/press/inter/date/2026/html/ecb.in260930~10084a5f3d.en.html'),168);
  assert.equal(at('https://www.ecb.europa.eu/press/key/date/2026/html/ecb.sp261005~1d8d998ef4.en.html'),168);
  assert.equal(at('https://www.ecb.europa.eu/press/govcdec/otherdec/2026/html/ecb.gc261002~54c6b5672b.en.html'),72,'administrative decisions stay at 72 h');
  assert.equal(at('https://simonwillison.net/2026/Oct/3/x/'),72);
});
