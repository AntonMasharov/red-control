import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';
import * as model from '../src/data/model.ts';

const source = readFileSync(new URL('../src/data/store.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const manifest = JSON.parse(
  readFileSync(new URL('../src/core/constants/app-settings.generated.json', import.meta.url), 'utf8'),
);

function harness() {
  let saved = null;
  let failWrites = false;
  const storage = {
    load: () => (saved ? model.readState(saved) : null),
    persist: (state) => {
      if (failWrites) throw new Error('disk full');
      saved = JSON.stringify(state);
    },
  };
  function restart(boot = true) {
    const exports = {};
    vm.runInNewContext(code, {
      exports,
      Date,
      require: (name) => {
        if (name === 'react') return { useSyncExternalStore: (_subscribe, snapshot) => snapshot() };
        if (name === 'expo-crypto') return { randomUUID };
        if (name === './storage') return storage;
        if (name === './model') return model;
        if (name === '../core/constants/app-settings.generated.json') return { default: manifest };
        throw new Error(`Unexpected import ${name}`);
      },
    });
    if (boot) exports.boot();
    return exports;
  }
  return {
    restart,
    fail: () => {
      failWrites = true;
    },
  };
}

const first = model.precinctCatalog[0];
const second = model.precinctCatalog.find(
  (p) => p.electionId === first.electionId && p.id !== first.id,
);
const another = model.precinctCatalog.find((p) => p.electionId !== first.electionId);
function choose(store, p = first) {
  store.actions.selectContext(p.electionId, p.id, 'Тестовый наблюдатель');
}

test('observer must select an admin election and matching station; admin mutations are absent', () => {
  const store = harness().restart();
  assert.equal(model.hasSelectedContext(store.getState()), false);
  assert.throws(() => store.actions.increment());
  assert.throws(() => store.actions.selectContext(first.electionId, another.id, ''));
  for (const name of [
    'createElection',
    'selectElection',
    'savePrecinct',
    'importPrecincts',
    'contact',
    'material',
  ])
    assert.equal(store.actions[name], undefined);
  choose(store);
  assert.equal(model.hasSelectedContext(store.getState()), true);
});

test('turnout survives midnight and restart, corrections and undo; stations remain isolated', (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date(2026, 8, 18, 23, 59, 59) });
  const h = harness();
  let store = h.restart();
  choose(store);
  store.actions.increment();
  store.actions.increment();
  store.actions.reconcile('20:00', 2);
  t.mock.timers.tick(2000);
  store = h.restart();
  assert.equal(model.countFor(store.getState()), 2);
  store.actions.correct(5, 'Исправление');
  store.actions.increment();
  t.mock.timers.tick(86400000);
  store = h.restart();
  store.actions.undo();
  assert.equal(model.countFor(store.getState()), 5);
  assert.throws(() => store.actions.undo());
  choose(store, second);
  assert.equal(model.countFor(store.getState()), 0);
  store.actions.increment();
  choose(store, first);
  assert.equal(model.countFor(store.getState()), 5);
  choose(store, another);
  assert.equal(model.countFor(store.getState()), 0);
  assert.equal(model.activeElection(store.getState()).id, another.electionId);
});

test('failed writes preserve published and persisted state, including context selection', () => {
  const h = harness();
  const store = h.restart();
  choose(store);
  store.actions.increment();
  const before = store.getState();
  h.fail();
  assert.throws(() => store.actions.increment());
  assert.equal(store.getState(), before);
  assert.throws(() => store.actions.selectContext(another.electionId, another.id, ''));
  assert.equal(store.getState(), before);
  assert.equal(model.countFor(h.restart().getState()), 1);
});

test('store hook restores selection after refresh and notes copy independently', () => {
  const h = harness();
  let store = h.restart();
  choose(store);
  store.actions.note('arrival', 'Исходник');
  store.actions.copyNote('room', 'Исходник', 'arrival');
  store.actions.noteTemplate('Шаблон', 'Исходник');
  store.actions.note('arrival', 'Изменено');
  const before = JSON.stringify(store.getState());
  store = h.restart(false);
  assert.equal(JSON.stringify(store.useStore()), before);
  assert.equal(model.hasSelectedContext(store.getState()), true);
  assert.equal(store.getState().noteCopies[0].text, 'Исходник');
});

test('personal contact edits and deletion persist and reject other precincts', () => {
  const h = harness();
  let store = h.restart();
  choose(store);
  store.actions.addContact('Name', 'Role', '+79991234567');
  const id = store.getState().personalContacts[0].id;
  store.actions.editContact(id, 'Updated', '', '+79997654321');
  store = h.restart();
  assert.equal(store.getState().personalContacts[0].name, 'Updated');
  assert.equal(store.getState().personalContacts[0].phone, '+79997654321');
  choose(store, second);
  assert.throws(() => store.actions.editContact(id, 'Wrong', '', '+79991234567'));
  assert.throws(() => store.actions.deleteContact(id));
  choose(store);
  store.actions.deleteContact(id);
  store = h.restart();
  assert.equal(store.getState().personalContacts.length, 0);
});

test('setup and station members survive restart, export and station changes', () => {
  const h = harness();
  let store = h.restart();
  choose(store);
  const members = model.requiredMembers();
  members[0].name = 'Chair Name';
  members[0].party = 'Affiliation';
  members.push({ id: 'custom-member', role: 'Member', name: 'Custom Name', party: '' });
  store.actions.saveMembers(members);
  store = h.restart();
  assert.equal(model.hasSelectedContext(store.getState()), true);
  assert.equal(model.membersFor(store.getState())[0].name, 'Chair Name');
  const restored = model.readState(model.serializeState(store.getState()));
  assert.equal(model.membersFor(restored).length, 4);
  choose(store, second);
  assert.ok(!model.membersFor(store.getState()).some((m) => m.id === 'custom-member'));
  choose(store);
  assert.equal(model.membersFor(store.getState())[0].party, 'Affiliation');
});
