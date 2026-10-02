import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { electionStages } from '../src/data/model.ts';

const catalog = JSON.parse(
  readFileSync(new URL('./fixtures/catalog.json', import.meta.url), 'utf8'),
);
const campaign = catalog.campaigns['edg-2026'];

test('EDG roadmap covers three dates and every task has scoped atomic legal links', () => {
  assert.deepEqual(campaign.election.dates, ['2026-09-18', '2026-09-19', '2026-09-20']);
  const seen = new Set();
  for (const day of [1, 2, 3]) {
    const stages = electionStages(campaign.election, day);
    assert.ok(stages.some((s) => s.id === 'opening-' + day));
    assert.equal(
      stages.some((s) => s.id === 'closing'),
      day < 3,
    );
    assert.equal(
      stages.some((s) => s.id === 'count'),
      day === 3,
    );
    assert.ok(stages.some((s) => s.id === 'home' && s.anytime));
    assert.ok(catalog.roadmaps[campaign.election.roadmapConfigId].anytime.some((s) => s.id === 'home' && s.repeatable));
    for (const stage of stages)
      for (const task of stage.items) {
        seen.add(task.id);
        assert.ok(task.lawIds.length > 0, task.id);
        assert.doesNotMatch(task.text, /8[-–]10 сентября|8[-–]9 сентября/);
        for (const id of task.lawIds) {
          assert.ok(campaign.election.lawIds.includes(id));
          const law = catalog.laws[id];
          assert.equal(law.references.length, 1);
          assert.match(law.text, /\]\(https:\/\//);
          assert.match(law.title, /№(?:67-ФЗ|20-ФЗ|86\/718-8)/);
          assert.match(
            law.references[0].locator,
            /^(?:подп\. «[а-я]» )?(?:п\.|ч\.|приложение) \d+(?:\.\d+)?(?: ст\. \d+(?:\.\d+)?)?$/,
          );
        }
      }
  }
  assert.equal(
    seen.size,
    Object.values(catalog.tasks).filter((t) => t.id.startsWith('edg-2026:')).length,
  );
});

test('compound citations expand independently, including decimal endpoints and subpoints', () => {
  assert.deepEqual(catalog.tasks['edg-2026:arrival-28c40e3c37'].lawIds, [
    'edg-2026:67-30-3',
    'edg-2026:67-30-5',
    'edg-2026:67-64-1',
  ]);
  for (const id of [
    'edg-2026:67-66-10',
    'edg-2026:67-66-11',
    'edg-2026:67-66-11.1',
    'edg-2026:67-30-9-к',
    'edg-2026:cec-app-1',
  ]) {
    assert.ok(catalog.laws[id], id);
  }
  const titles = campaign.election.lawIds.map((id) => catalog.laws[id].title);
  assert.equal(new Set(titles).size, titles.length, 'One record per legal locator');
});

test('EDG includes the supplied Tyumen UIK and preserves training campaign progress keys', () => {
  const uik = campaign.commissions['edg-2026:tyumen-uik-2917'];
  assert.equal(uik.number, '2917');
  assert.equal(uik.electionId, campaign.election.id);
  assert.equal(uik.demo, false);
  assert.equal(campaign.commissions[uik.parentId].kind, 'TIK');
  assert.ok(catalog.headquarters[uik.hqId]);
  assert.deepEqual(uik.members, []);
  assert.equal(catalog.campaigns['demo-multiday-2026'].election.roadmapConfigId, 'standard');
  assert.ok(catalog.tasks['arrival-28c40e3c37']);
  assert.notEqual(campaign.election.roadmapConfigId, 'standard');
});
