import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateCatalog, validateShape } from '../scripts/catalog-validation.mjs';
import {
  freshState,
  readState,
  serializeState,
  recordKey,
  electionStages,
  activeElection,
} from '../src/data/model.ts';
import { campaignContent } from '../src/content/catalog.ts';
const catalog = () =>
  JSON.parse(
    readFileSync(new URL('./fixtures/catalog.json', import.meta.url), 'utf8'),
  );

test('normalized catalog rejects broken links, cycles, wrong UIK ownership and impossible dates', () => {
  validateCatalog(catalog());
  const cases = [
    (c) => {
      Object.values(c.tasks)[0].lawIds = ['missing'];
    },
    (c) => {
      const p = Object.values(c.campaigns)[0];
      const n = Object.values(p.commissions)[0];
      n.parentId = n.id;
    },
    (c) => {
      Object.values(Object.values(c.campaigns)[0].commissions).find(
        (n) => n.kind === 'UIK',
      ).electionId = 'wrong';
    },
    (c) => {
      Object.values(c.campaigns)[0].election.dates = ['2026-02-30'];
    },
    (c) => {
      Object.values(c.campaigns)[0].election.sourceIds = [];
    },
    (c) => {
      Object.values(c.blocks)[0].taskIds = ['missing'];
    },
    (c) => {
      Object.values(Object.values(c.campaigns)[0].commissions).find(
        (n) => n.kind === 'UIK',
      ).members = [{ id: '1', name: 'Name', role: 'Chair' }];
    },
  ];
  for (const mutate of cases) {
    const c = catalog();
    mutate(c);
    assert.throws(() => validateCatalog(c));
  }
});

test('campaign selectors expose only explicitly referenced material', () => {
  assert.deepEqual(campaignContent('unknown').topics, []);
  assert.deepEqual(campaignContent('unknown').laws, []);
  for (const campaign of Object.values(catalog().campaigns)) {
    const selected = campaignContent(campaign.election.id);
    assert.deepEqual(
      selected.topics.map((t) => t.id),
      campaign.election.topicIds,
    );
    assert.deepEqual(
      selected.sources.map((t) => t.id),
      [...new Set(selected.laws.flatMap((law) => law.sourceIds))],
    );
  }
});

test('v4 storage round-trips checks, stage and item notes, events and legacy context without catalog content', () => {
  const state = freshState();
  state.electionId = 'demo-multiday-2026';
  state.precinctId = 'demo-uik-9101';
  state.contextSelected = true;
  const key = recordKey(state, 'arrival');
  state.checks[key] = true;
  state.notes[key] = 'Keep this note';
  state.counter = [
    {
      id: 'event',
      electionId: state.electionId,
      precinctId: state.precinctId,
      date: '2026-09-18',
      at: '2026-09-18T08:00:00Z',
      delta: 1,
      kind: 'increment',
      note: '',
    },
  ];
  const raw = serializeState(state);
  const stored = JSON.parse(raw);
  validateShape(
    stored,
    JSON.parse(
      readFileSync(new URL('../src/data/observation.schema.json', import.meta.url), 'utf8'),
    ),
  );
  assert.equal(stored.version, 4);
  assert.equal(stored.observer.elections, undefined);
  assert.equal(stored.observer.precincts, undefined);
  assert.equal(stored.tasks, undefined);
  assert.equal(stored.sources, undefined);
  assert.equal(stored.contexts.elections[state.electionId].topicIds, undefined);
  const restored = readState(raw);
  assert.deepEqual(restored.checks, state.checks);
  assert.deepEqual(restored.notes, state.notes);
  assert.deepEqual(restored.counter, state.counter);
  assert.equal(restored.contextSelected, true);
  assert.equal(serializeState(restored), raw);
});

test('content removal retains observations in historical context and requires new selection', () => {
  const state = freshState();
  const stored = JSON.parse(serializeState(state));
  stored.contexts.elections.retired = {
    id: 'retired',
    title: 'Retired',
    dates: ['2026-09-18'],
    roadmapConfigId: 'retired-roadmap',
  };
  stored.contexts.precincts.push({
    id: 'old-uik',
    electionId: 'retired',
    number: '1',
    address: 'Historical address',
    region: 'Region',
    members: [],
    hqId: 'shared',
  });
  stored.observer.electionId = 'retired';
  stored.observer.precinctId = 'old-uik';
  stored.observer.contextSelected = true;
  stored.observer.notes[JSON.stringify(['retired', 'old-uik', '2026-09-18', 'stage'])] =
    'Historical note';
  const restored = readState(JSON.stringify(stored));
  assert.equal(restored.contextSelected, false);
  assert.ok(Object.values(restored.notes).includes('Historical note'));
  assert.deepEqual(electionStages(activeElection(restored), 1), []);
});

test('old full snapshots upgrade without changing stable progress keys', () => {
  const old = freshState();
  old.notes[recordKey(old, 'arrival')] = 'From v3';
  const migrated = readState(serializeState(readState(JSON.stringify(old))));
  assert.deepEqual(migrated.notes, old.notes);
  const invalid = JSON.parse(serializeState(old));
  delete invalid.contexts;
  assert.throws(() => readState(JSON.stringify(invalid)));
});
