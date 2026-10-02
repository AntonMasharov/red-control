import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog, campaignContent } from '../src/content/catalog.ts';
import { ContentRepository, resolveContent } from '../src/data/repositories/content.ts';
import { generateComplaint } from '../src/features/complaints/engine.ts';
import { freshState, serializeState, readState } from '../src/data/model.ts';

test('laws are derived from content, ignoring manual election law lists', () => {
  const changed = structuredClone(catalog);
  const campaign = changed.campaigns['municipal-2026'];
  campaign.election.lawIds = [];
  campaign.election.sourceIds = [];
  const selected = resolveContent(changed, campaign.election.id);
  assert.ok(selected.laws.length);
  assert.deepEqual(
    selected.sources.map((source) => source.id),
    [...new Set(selected.laws.flatMap((law) => law.sourceIds))],
  );
  assert.ok(selected.laws.length < campaignContent('state-duma-2026').laws.length);
});

test('complaint references participate in scoping without duplication', () => {
  const changed = structuredClone(catalog);
  const campaign = changed.campaigns['municipal-2026'];
  const id = Object.keys(changed.laws).at(-1);
  campaign.complaints[0].checkbox_items[0].law_references = [id, id];
  const selected = resolveContent(changed, campaign.election.id);
  assert.equal(selected.laws.filter((law) => law.id === id).length, 1);
});

test('repository uses an interchangeable asynchronous provider and propagates failure', async () => {
  const repository = new ContentRepository({ loadCatalog: async () => catalog });
  assert.deepEqual(
    await repository.forElection('municipal-2026'),
    campaignContent('municipal-2026'),
  );
  const unavailable = new ContentRepository({
    loadCatalog: async () => {
      throw new Error('unavailable');
    },
  });
  await assert.rejects(unavailable.forElection('municipal-2026'), /unavailable/);
});

test('complaint assembly respects authored order, deduplicates laws, and preserves literal facts', () => {
  const template = structuredClone(campaignContent('municipal-2026').complaints[0]);
  template.checkbox_items[0].law_references = ['law'];
  template.checkbox_items[1].law_references = ['law'];
  const variables = {
    time: '10:00',
    recipient: 'УИК № 123',
    observer_name: 'Иван Иванов',
    uik_number: '123',
    date: '01.10.2026',
    facts: 'literal {{text}}',
  };
  const result = generateComplaint(template, ['list', 'register'], variables, {
    law: { title: 'Основание', text: 'Текст' },
  });
  assert.ok(result.indexOf('реестром') < result.indexOf('списком'));
  assert.equal(result.split('Основание').length, 2);
  assert.ok(result.includes('literal {{text}}'));
  assert.ok(result.includes('Подпись члена УИК'));
  assert.throws(() => generateComplaint(template, [], variables, {}));
  assert.throws(() => generateComplaint(template, ['missing'], variables, {}));
  assert.throws(() =>
    generateComplaint(template, ['register'], { ...variables, observer_name: '' }, {}),
  );
  assert.throws(() => generateComplaint(template, ['register'], variables, {}));
});

test('unfinished complaints survive reload and remain isolated between contexts', () => {
  const state = freshState();
  const key = JSON.stringify(['municipal-2026', 'station']);
  state.complaintComposers = {
    [key]: {
      selected: ['register'],
      facts: 'event',
      name: 'Observer',
      recipient: 'UIK',
      text: 'draft',
    },
  };
  const restored = readState(serializeState(state));
  assert.deepEqual(restored.complaintComposers, state.complaintComposers);
  assert.equal(
    restored.complaintComposers[JSON.stringify(['state-duma-2026', 'station'])],
    undefined,
  );
});

test('sample elections bundle two to four stations with separate hierarchy and members', () => {
  for (const id of ['municipal-2026', 'state-duma-2026']) {
    const commissions = Object.values(catalog.campaigns[id].commissions);
    const stations = commissions.filter((node) => node.kind === 'UIK');
    assert.ok(stations.length >= 2 && stations.length <= 4);
    assert.ok(stations.every((node) => node.members.length && node.electionId === id));
    assert.ok(commissions.some((node) => node.kind === 'OIK'));
    assert.ok(commissions.some((node) => node.kind === 'TIK'));
  }
});

test('invalid persisted composer records fail without discarding observations', () => {
  const snapshot = JSON.parse(serializeState(freshState()));
  snapshot.observer.complaintComposers = {
    broken: { selected: [1], facts: '', name: '', recipient: '', text: '' },
  };
  assert.throws(() => readState(JSON.stringify(snapshot)), /черновик/);
  snapshot.observer.complaintComposers.broken.selected = [];
  snapshot.observer.complaintComposers.broken.variables = { time: 12 };
  assert.throws(() => readState(JSON.stringify(snapshot)), /черновик/);
});
