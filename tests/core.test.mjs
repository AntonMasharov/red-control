import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  freshState,
  readState,
  countFor,
  recordKey,
  localDate,
  currentRoadmapDay,
  createElection,
  selectedDate,
  activePrecinct,
  contactsFor,
} from '../src/data/model.ts';
import { configuredPrecincts } from '../src/content/catalog.ts';
import { composeComplaint } from '../src/content/complaint-template.ts';
import { parsePrecinctCatalog } from '../src/data/precinct-catalog.ts';

test('admin catalog restores canonical fields and preserves previous snapshot', () => {
  const raw = JSON.parse(JSON.stringify(freshState()));
  assert.equal(raw.precincts.filter((p) => p.demo).length, configuredPrecincts.filter((p) => p.demo).length);
  const station = raw.precincts.find((p) => p.demo);
  const address = station.address;
  station.address = 'Локальное изменение';
  delete raw.adminCatalogVersion;
  const upgraded = readState(JSON.stringify(raw));
  assert.equal(upgraded.precincts.find((p) => p.id === station.id).address, address);
  assert.equal(
    JSON.parse(upgraded.previousCatalogSnapshot).precincts.find((p) => p.id === station.id).address,
    'Локальное изменение',
  );
  assert.equal(upgraded.contextSelected, false);
});

test('precinct catalog validates the whole import and normalizes contacts', () => {
  const source = [
    {
      number: ' 7 ',
      region: ' Регион ',
      address: ' Адрес ',
      contacts: [{ role: 'Юрист', phone: '+7 (000) 000-00-00' }],
    },
  ];
  const rows = parsePrecinctCatalog(JSON.stringify(source));
  assert.equal(rows[0].number, '7');
  assert.equal(rows[0].contacts[0].phone, '+70000000000');
  assert.throws(() => parsePrecinctCatalog(JSON.stringify([...source, { number: '8' }])));
  assert.throws(() => parsePrecinctCatalog(JSON.stringify([...source, ...source])));
});

test('v1 migration retains old logs, notes, contacts and commission text', () => {
  const old = { ...freshState(), version: 1 };
  old.profile = { name: '', members: '', precinct: '', address: '', startDate: '2026-09-24' };
  for (const key of ['precincts', 'precinctId', 'trips', 'lawTexts', 'materials']) delete old[key];
  old.profile.members = 'Председатель: прежняя запись';
  old.contacts = [{ id: 'c', role: 'Юрист', name: 'Тест', phone: '+70000000000' }];
  old.notes['2026-09-24:arrival'] = '07:30';
  old.counter = [{ id: 'e', date: localDate(), delta: 1 }];
  const migrated = readState(JSON.stringify(old));
  assert.equal(migrated.version, 3);
  assert.equal(migrated.counter[0].delta, old.counter[0].delta);
  assert.equal(migrated.counter[0].electionId, 'initial');
  assert.deepEqual(JSON.parse(migrated.legacyBackup), old);
  assert.equal(migrated.notes[recordKey(migrated, 'arrival')], '07:30');
  assert.equal(contactsFor(migrated)[0].phone, old.contacts[0].phone);
  assert.equal(migrated.profile.members, old.profile.members);
  assert.equal(migrated.precincts[0].members.length, 3);
  assert.equal(countFor(migrated), 1);
});
test('precincts and trips have independent record keys', () => {
  const s = freshState();
  assert.deepEqual(JSON.parse(recordKey(s, 'arrival')), [
    'initial',
    'initial',
    selectedDate(s),
    'arrival',
  ]);
  assert.notEqual(recordKey(s, 'trip1:home-item'), recordKey(s, 'trip2:home-item'));
  assert.notEqual(recordKey(s, 'arrival'), recordKey({ ...s, precinctId: 'other' }, 'arrival'));
});
test('turnout accumulates all dates independently of roadmap day and scopes precincts', () => {
  const s = freshState();
  s.profile.startDate = '2020-01-01';
  s.day = 2;
  s.counter = [
    { id: '1', date: localDate(), delta: 2 },
    { id: '2', date: localDate(), delta: 9, precinctId: 'other' },
    { id: '3', date: '2020-01-02', delta: 20 },
  ];
  assert.equal(countFor(s), 22);
  assert.equal(countFor({ ...s, precinctId: 'other' }), 9);
});
test('roadmap advances and clamps at election boundaries', () => {
  const s = freshState();
  s.elections.initial = createElection('initial', 'Тест', [
    '2026-09-18',
    '2026-09-19',
    '2026-09-20',
  ]);
  for (const [date, day] of [
    ['2026-09-17', 1],
    ['2026-09-18', 1],
    ['2026-09-19', 2],
    ['2026-09-20', 3],
    ['2026-09-24', 3],
  ])
    assert.equal(currentRoadmapDay(s, date), day);
});
test('complaint works without optional facts, preserves requests and receipt block', () => {
  const text = composeComplaint({
    recipient: '',
    name: '',
    precinct: '',
    selected: ['register', 'list'],
    facts: '',
    date: '24.09.2026',
  });
  assert.match(text, /реестром заявлений/);
  assert.match(text, /списком избирателей/);
  assert.match(text, /немедленно провести заседание УИК/);
  assert.match(text, /«ПОЛУЧЕНО»/);
  assert.doesNotMatch(text, /undefined|Дополнительные обстоятельства/);
});
