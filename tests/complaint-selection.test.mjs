import test from 'node:test';
import assert from 'node:assert/strict';
import { selectComplaintIds } from '../scripts/complaint-selection.mjs';

test('complaints follow roadmap tasks, merge manual additions once and ignore law references', () => {
  const rows = {
    a: { id: 'a', lawIds: ['used', 'extra'] },
    b: { id: 'b', lawIds: ['extra'] },
    c: { id: 'c', lawIds: [] },
  };
  assert.deepEqual(selectComplaintIds(rows, [{ complaintId: 'a' }]), ['a']);
  assert.deepEqual(selectComplaintIds(rows, [{ complaintId: 'a' }], ['c', 'a']), ['c', 'a']);
  assert.deepEqual(selectComplaintIds(rows, [{ lawIds: ['used'] }]), []);
  assert.throws(() => selectComplaintIds(rows, [{ complaintId: 'missing' }]), /Unknown complaint for task/);
  assert.deepEqual(selectComplaintIds(rows, []), []);
  assert.throws(() => selectComplaintIds(rows, [], ['missing']), /Unknown complaint/);
});
