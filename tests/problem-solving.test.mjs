import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { problemRoute, previousProblemProgress } from '../src/features/roadmap/problem-solving.ts';
import { freshState, recordKey, readState, serializeState } from '../src/data/model.ts';
import { validateCatalog } from '../scripts/catalog-validation.mjs';

const config = parse(
  readFileSync(new URL('../src/content/global/problem-solving.yaml', import.meta.url), 'utf8'),
);
const task = { id: 'test', text: 'Пункт', lawIds: [], sourceIds: [], media: [] };

test('authored default route applies only when the task has no override; empty route disables it', () => {
  assert.deepEqual(
    problemRoute(task, config).map((s) => s.id),
    ['oral', 'complaint', 'police', 'prosecutor'],
  );
  assert.deepEqual(
    problemRoute({ ...task, problemSolving: ['complaint', 'oral'] }, config).map((s) => s.id),
    ['complaint', 'oral'],
  );
  assert.deepEqual(problemRoute({ ...task, problemSolving: [] }, config), []);
});

test('problem history survives export/reload and is scoped to the selected day and station', () => {
  const state = freshState();
  const key = recordKey(state, 'morning:task');
  state.problems = { [key]: { completed: ['oral', 'complaint'], waiting: true, resolved: false } };
  const restored = readState(serializeState(state));
  assert.deepEqual(restored.problems, state.problems);
  assert.notEqual(recordKey({ ...state, precinctId: 'other' }, 'morning:task'), key);
  const damaged = JSON.parse(serializeState(state));
  damaged.observer.problems[key].completed = [42];
  assert.throws(() => readState(JSON.stringify(damaged)), /решения проблем/);
});

test('catalog rejects unknown stages and complaint links', () => {
  const authored = JSON.parse(
    readFileSync(new URL('../src/content/catalog.generated.json', import.meta.url), 'utf8'),
  );
  validateCatalog(authored);
  const stage = structuredClone(authored);
  stage.problemSolving.default.push('missing');
  assert.throws(() => validateCatalog(stage), /Unknown problem-solving stage/);
  const complaint = structuredClone(authored);
  complaint.tasks['roadmap-home:item-03'].complaintId = 'missing';
  assert.throws(() => validateCatalog(complaint), /Unknown complaint/);
});

test('back reverses completion, next-step navigation, waiting and resolution', () => {
  const base = { completed: ['oral'], reviewing: true, waiting: false, resolved: false };
  assert.deepEqual(previousProblemProgress(base).completed, []);
  assert.equal(previousProblemProgress({ ...base, reviewing: false }).reviewing, true);
  assert.equal(previousProblemProgress({ ...base, waiting: true }).waiting, false);
  assert.equal(previousProblemProgress({ ...base, resolved: true }).resolved, false);
});
