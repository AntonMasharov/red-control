import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parse } from 'yaml';

test('imported legal provisions have atomic IDs, complete citation mappings and traceable exact text', () => {
  const root = new URL('../', import.meta.url);
  const laws = parse(readFileSync(new URL('src/content/global/laws/laws.yaml', root), 'utf8'));
  const sources = parse(readFileSync(new URL('src/content/global/documents/sources.yaml', root), 'utf8'));
  const audit = JSON.parse(readFileSync(new URL('docs/legal-import/dk-uik-2026-reference-map.json', root), 'utf8'));
  assert.equal(audit.entries.length, 107);
  assert.equal(new Set(audit.entries.map(row => row.id)).size, 107);
  for (const row of audit.entries) {
    const law = laws[row.id];
    assert.ok(law, row.id);
    assert.equal(createHash('sha256').update(law.text).digest('hex'), row.textSha256, row.id);
    assert.deepEqual(law.sourceIds, [row.sourceId]);
    assert.equal(sources[row.sourceId].purpose, 'raw-law');
    assert.equal(law.references[0].locator, row.locator);
    assert.ok(!law.text.includes('HYPERLINK'));
  }
  for (const mapping of audit.mappings) {
    assert.ok(mapping.lawIds.length);
    for (const id of mapping.lawIds) assert.ok(laws[id], mapping.citation);
  }
  assert.deepEqual(audit.mappings[0].lawIds, [
    'fz67:article-30:clause-3', 'fz67:article-30:clause-5', 'fz67:article-64:clause-1',
  ]);
  assert.ok(laws['fz67:article-30:clause-9:subclause-а'].text.includes('в электронном виде'));
  assert.ok(laws['fz67:article-30:clause-9:subclause-к'].text.startsWith('к)'));
  assert.equal(laws['fz67:article-61:clause-5'].status, 'repealed-in-source');
});
