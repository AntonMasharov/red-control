import assert from 'node:assert/strict';

/** Manual additions plus complaints linked directly to selected roadmap tasks. */
export function selectComplaintIds(complaints, tasks, manualIds = []) {
  manualIds.forEach(id => assert.ok(complaints[id], 'Unknown complaint: ' + id));
  const linkedIds = tasks.flatMap(task => task.complaintId ? [task.complaintId] : []);
  linkedIds.forEach(id => assert.ok(complaints[id], 'Unknown complaint for task: ' + id));
  return [...new Set([...manualIds, ...linkedIds])];
}
