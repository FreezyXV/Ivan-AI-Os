import test from 'node:test';
import assert from 'node:assert/strict';
import { pauseManager } from '../src/pause.js';

test('pause removes active role and delegates while preserving definitions and unrelated settings', () => {
  const config = { agents: { entries: {
    main: { workspace: '/synthetic/main', subagents: { allowAgents: ['ivan-career','ivan-system'] } },
    'ivan-career': { workspace: '/synthetic/career', skills: ['synthetic-career'] },
    'ivan-system': { workspace: '/synthetic/system', subagents: { allowAgents: ['ivan-career'] } }
  }}, channels: { synthetic: { enabled: true } } };
  const before = structuredClone(config), result = pauseManager(config, 'ivan-career');
  assert.deepEqual(config, before);
  assert.deepEqual(result.paused.definition, before.agents.entries['ivan-career']);
  assert.equal(Object.hasOwn(result.config.agents.entries, 'ivan-career'), false);
  assert.deepEqual(result.config.agents.entries.main.subagents.allowAgents, ['ivan-system']);
  assert.deepEqual(result.config.agents.entries['ivan-system'].subagents.allowAgents, []);
  assert.deepEqual(result.config.channels, before.channels);
  assert.equal(result.config.agents.entries.main.workspace, before.agents.entries.main.workspace);
});

test('pause rejects main, absent roles and malformed configuration', () => {
  for (const [config, id] of [[{agents:{entries:{main:{}}}}, 'main'], [{agents:{entries:{}}}, 'ivan-career'], [null,'ivan-career']])
    assert.throws(() => pauseManager(config,id), /MANAGER_PAUSE_INVALID/);
});
