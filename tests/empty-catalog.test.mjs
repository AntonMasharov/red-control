import test from 'node:test';
import { execFileSync } from 'node:child_process';

test('before election selection, storage loads and shared material stays unselected', () => {
  execFileSync(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import { catalog, campaignContent } from './src/content/catalog.ts';
    import { freshState, readState, serializeState, hasSelectedContext, electionStages, activeElection } from './src/data/model.ts';
    const state = freshState();
    assert.equal(hasSelectedContext(state), false);
    assert.deepEqual(electionStages(activeElection(state), 1), []);
    assert.deepEqual(campaignContent('missing').topics, []);
    assert.deepEqual(campaignContent('missing').laws, []);
    assert.deepEqual(campaignContent('missing').sources, []);
    state.notes.historical = 'Keep the observer record';
    assert.equal(readState(serializeState(state)).notes.historical, state.notes.historical);
  `], { cwd: new URL('../', import.meta.url), stdio: 'pipe' });
});
