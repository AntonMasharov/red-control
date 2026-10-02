import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolveContent } from '../src/data/repositories/content.ts';

test('Google roadmap wording and DOCX-only law mappings are preserved and scoped to the election', () => {
  const root = new URL('../', import.meta.url);
  const catalog = JSON.parse(readFileSync(new URL('src/content/catalog.generated.json', root), 'utf8'));
  const audit = JSON.parse(readFileSync(new URL('docs/roadmap-import/task-law-map.json', root), 'utf8'));
  const legalAudit = JSON.parse(readFileSync(new URL('docs/legal-import/dk-uik-2026-reference-map.json', root), 'utf8'));
  const source = readFileSync(new URL('docs/roadmap-import/google-doc-source.txt', root), 'utf8');
  assert.equal(audit.entries.length, 89);
  assert.equal(audit.withoutDirectLegalCitation.length, 6);
  const selected = resolveContent(catalog, 'deputy-2026');
  const visibleLaws = new Set(selected.laws.map(law => law.id));
  for (const entry of audit.entries) {
    const task = catalog.tasks[entry.taskId];
    assert.ok(source.includes(entry.googleText), entry.taskId);
    assert.equal(task.text, [...entry.context, entry.googleText].join('\n\n'));
    const mapped = [...new Set(entry.docxCitationParagraphs.flatMap(paragraph =>
      legalAudit.mappings.find(row => row.paragraph === paragraph).lawIds))];
    assert.deepEqual(task.lawIds, mapped);
    for (const id of task.lawIds) assert.ok(visibleLaws.has(id), id);
  }
  assert.deepEqual(selected.sources.map(source => source.id).sort(),
    ['cik-multiday-voting', 'fz67-2026-excerpts']);
});

test('actual election schedules daily, early-evening and last-day blocks and isolates home-voting trips', () => {
  execFileSync(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import { electionCatalog, electionStages, taskRecordId } from './src/data/model.ts';
    const election = electionCatalog.find(row => row.id === 'deputy-2026');
    for (const day of [1, 2, 3]) {
      const stages = electionStages(election, day);
      assert.ok(stages.some(stage => stage.id === 'morning'));
      assert.ok(stages.some(stage => stage.id === 'voting'));
      assert.equal(stages.some(stage => stage.id === 'evening'), day < 3);
      assert.equal(stages.some(stage => stage.id === 'counting'), day === 3);
      assert.equal(stages.some(stage => stage.id === 'protocol'), day === 3);
      const home = stages.find(stage => stage.id === 'home');
      assert.equal(home.anytime, true);
      assert.equal(home.repeatable, true);
      assert.notEqual(taskRecordId(home, home.items[0].id, 'trip-1'), taskRecordId(home, home.items[0].id, 'trip-2'));
    }
  `], { cwd: new URL('../', import.meta.url), stdio: 'pipe' });
});
