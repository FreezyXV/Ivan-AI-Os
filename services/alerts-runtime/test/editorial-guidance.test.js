import test from 'node:test';
import assert from 'node:assert/strict';
import {synthesisPrompt} from '../src/synthesis.js';

// Claude K06 blind scoring of 8 native outputs @9136f58/23cf0be: fidelity 2/2 everywhere; the
// losses were (1) attaching a source to the Mac pilot when no pilot component is named,
// (2) actions that skip the check deciding whether Ivan is concerned, (3) study protocols
// turned into requirements. Both variants must carry the three rules.
const item={producer:'sentinelle',url:'https://nextjs.org/blog/september-2026-security-release',title:'September 2026 Security Release',
  topic:'engineering',scope:'public',publishedAt:'2026-09-30T18:00:00.000Z',observedAt:'2026-10-05T12:09:36.000Z',
  readAt:'2026-10-05T12:09:36.000Z',sourceStatus:'read',excerpt:'Updates are now available in v16.3.8 (Active LTS) and v15.5.27 (Maintenance LTS) to address these issues.'};
test('both prompt variants carry the three editorial rules from the K06 scoring',()=>{
  for(const [purpose,promptVariant] of [['selected','current'],['editorial-evaluation','current'],['editorial-evaluation','compact-v1']]){
    const p=synthesisPrompt(item,{purpose,promptVariant});
    assert.match(p,/pilote.{0,80}seulement si/i,`${promptVariant}: pilot attachment`);
    assert.match(p,/commence par la vérification/i,`${promptVariant}: check first`);
    assert.match(p,/protocole d.une étude/i,`${promptVariant}: proportionality`);
  }
});
