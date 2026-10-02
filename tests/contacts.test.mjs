import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, contactsFor, serializeState, readState } from '../src/data/model.ts';

test('personal contacts survive export and reload and remain scoped to their precinct', () => {
  const state = freshState();
  const contact = { id: 'personal-test', name: 'Observer', role: '', phone: '+7 900 123-45-67', electionId: state.electionId, precinctId: state.precinctId };
  state.personalContacts = [contact, { ...contact, id: 'other-precinct', precinctId: 'another-precinct' }];
  const restored = readState(serializeState(state));
  assert.deepEqual(restored.personalContacts, state.personalContacts);
  assert.ok(contactsFor(restored).some((entry) => entry.id === contact.id));
  assert.ok(!contactsFor(restored).some((entry) => entry.id === 'other-precinct'));
});
