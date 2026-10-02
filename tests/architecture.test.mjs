import test from 'node:test';
import assert from 'node:assert/strict';
import {
  freshState,
  createElection,
  activeElection,
  electionStages,
  canCheck,
  taskRecordId,
  recordKey,
  readState,
  contactsFor,
  selectedDate,
  stationDraftDirty,
  activePrecinct,
} from '../src/data/model.ts';

test('immutable nonconsecutive election dates drive reusable blocks for any station', () => {
  const dates = ['2027-09-19', '2027-09-17'];
  const election = createElection('test', 'Выборы', dates);
  dates[0] = '2020-01-01';
  assert.deepEqual(election.dates, ['2027-09-17', '2027-09-19']);
  assert.throws(() => election.dates.push('2027-09-20'));
  assert.throws(() => createElection('x', 'Выборы', ['2027-02-30']));
  assert.throws(() => createElection('x', 'Выборы', ['2027-09-17', '2027-09-17']));
  const first = electionStages(election, 1);
  const last = electionStages(election, 2);
  assert.ok(first.some((s) => s.id === 'closing'));
  assert.ok(!last.some((s) => s.id === 'closing'));
  assert.ok(last.some((s) => s.id === 'count'));
  assert.ok(first.some((s) => s.id === 'home' && s.anytime));
  assert.ok(first.some((s) => s.id === 'complaints' && s.anytime));
  const single = electionStages(createElection('single', 'Один день', ['2027-09-17']), 1);
  assert.equal(single.filter((s) => s.id.startsWith('opening')).length, 1);
  assert.ok(single.some((s) => s.id === 'count'));
});

test('checklist enforcement allows out-of-order checks while complaints and separate trips stay available', () => {
  const s = freshState();
  s.elections.initial = createElection('initial', 'Выборы', ['2027-09-17', '2027-09-19']);
  const stages = electionStages(activeElection(s), 1);
  const arrival = stages[0];
  assert.equal(canCheck(s, arrival.id, arrival.items[0].id), true);
  assert.equal(canCheck(s, arrival.id, arrival.items[1].id), true);
  assert.equal(canCheck(s, 'complaints', 'complaints-record'), true);
  const home = stages.find((s) => s.id === 'home');
  assert.equal(canCheck(s, 'home', home.items[0].id, 'missing'), false);
  s.trips.push({
    id: 'trip',
    date: selectedDate(s),
    title: 'Выезд',
    electionId: 'initial',
    precinctId: 'initial',
  });
  assert.equal(canCheck(s, 'home', home.items[0].id, 'trip'), true);
  assert.notEqual(
    taskRecordId(home, home.items[0].id, 'trip'),
    taskRecordId(home, home.items[0].id, 'other'),
  );
  s.day = 2;
  assert.equal(canCheck(s, arrival.id, arrival.items[0].id), true);
  assert.deepEqual(
    electionStages(activeElection({ ...s, precinctId: 'other' }), 2),
    electionStages(activeElection(s), 2),
  );
});

test('v2 migration preserves original backup, trip checks, notes and distinct contacts', () => {
  const block = electionStages(activeElection(freshState()), 1).find((s) => s.id === 'home');
  const contact = { id: 'c', name: 'Имя', role: 'Юрист', phone: '+70000000000' };
  const old = {
    version: 2,
    profile: {
      name: 'Наблюдатель',
      precinct: '1',
      address: 'Адрес',
      members: 'Состав',
      startDate: '2026-09-18',
    },
    precinctId: 'initial',
    precincts: [
      {
        id: 'initial',
        number: '1',
        region: 'Регион',
        address: 'Адрес',
        members: [],
        contacts: [contact],
      },
      {
        id: 'other',
        number: '2',
        region: 'Регион',
        address: 'Адрес 2',
        members: [],
        contacts: [{ ...contact, id: 'other-contact' }],
      },
    ],
    day: 1,
    contacts: [contact],
    counter: [{ id: 'e', date: '2026-09-18', delta: 1 }],
    reconciliations: [],
    complaints: [],
    outbox: [],
    trips: [{ id: 'trip', date: '2026-09-18', title: 'Выезд', precinctId: 'initial' }],
    checks: { ['2026-09-18:trip:' + block.items[0].id]: true },
    notes: { '2026-09-18:arrival': 'Запись', 'unknown-key': 'Не терять' },
    materials: [],
    lawTexts: { fz67: 'Ранее загруженный текст' },
  };
  const s = readState(JSON.stringify(old));
  assert.deepEqual(JSON.parse(s.legacyBackup), old);
  assert.equal(s.checks[recordKey(s, taskRecordId(block, block.items[0].id, 'trip'))], true);
  assert.equal(s.notes[recordKey(s, 'arrival')], 'Запись');
  assert.equal(s.lawTexts.fz67, old.lawTexts.fz67);
  assert.equal(contactsFor(s)[0].name, 'Имя');
  assert.notEqual(s.precincts[0].hqId, s.precincts[1].hqId);
  assert.equal(Object.keys(s.contactById).length, 2);
  const shared = structuredClone(old);
  shared.precincts[1].contacts = [contact];
  assert.equal(Object.keys(readState(JSON.stringify(shared)).contactById).length, 1);
  assert.equal(readState(JSON.stringify(s)).legacyBackup, s.legacyBackup);
});

test('invalid catalog relationships fail instead of resetting saved observations', () => {
  const state = freshState();
  state.precincts[0].hqId = 'missing';
  assert.throws(() => readState(JSON.stringify(state)));
});

test('station draft detects changes, selection and restoration without treating whitespace as edits', () => {
  const state = freshState();
  const entry = activePrecinct(state);
  assert.equal(stationDraftDirty(state, entry, ''), false);
  assert.equal(stationDraftDirty(state, { ...entry, address: 'Адрес' }, ''), true);
  assert.equal(stationDraftDirty(state, { ...entry, address: '   ' }, '  '), false);
  assert.equal(stationDraftDirty(state, entry, 'Наблюдатель'), true);
  assert.equal(stationDraftDirty(state, state.precincts[1], ''), true);
  assert.equal(stationDraftDirty(state, entry, ''), false);
});
