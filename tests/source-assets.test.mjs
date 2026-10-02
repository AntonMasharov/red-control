import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateSourceAssets, generateLessonVideos, lessonVideoSources, mergeSourceTables } from '../scripts/source-assets.mjs';

test('source files generate static registrations with automatic paths and explicit overrides', () => {
  const root = mkdtempSync(join(tmpdir(), 'red-control-source-assets-'));
  try {
    mkdirSync(join(root, 'global/documents'), { recursive: true });
    mkdirSync(join(root, 'custom'));
    mkdirSync(join(root, 'global/videos'));
    writeFileSync(join(root, 'global/videos/video.mp4'), 'fixture');
    writeFileSync(join(root, 'global/documents/Жалоба.docx'), 'fixture');
    writeFileSync(join(root, 'custom/original.rtf'), 'fixture');
    const sources = {
      complaint: { id: 'complaint', name: 'Жалоба.docx', assetKey: 'complaint' },
      original: { id: 'original', name: 'Display name.rtf', file: 'custom/original.rtf', assetKey: 'original' },
      unpublished: { id: 'unpublished', name: 'missing.pdf', assetKey: null },
    };
    const output = generateSourceAssets(sources, root);
    assert.ok(output.includes('"complaint": require("./global/documents/Жалоба.docx")'));
    assert.ok(output.includes('"original": require("./custom/original.rtf")'));
    assert.ok(!output.includes('unpublished'));
    assert.ok(generateSourceAssets({ video: { id: 'video', name: 'video.mp4', purpose: 'procedure-video', assetKey: 'video' } }, root)
      .includes('require("./global/videos/video.mp4")'));
    assert.equal(generateSourceAssets(Object.fromEntries(Object.entries(sources).reverse()), root), output);
    assert.throws(() => generateSourceAssets({ x: { id: 'x', name: 'missing.pdf', assetKey: 'x' } }, root), /missing file/);
    assert.throws(() => generateSourceAssets({ x: { id: 'x', file: '../outside.pdf', assetKey: 'x' } }, root), /escapes/);
    assert.throws(() => generateSourceAssets({ ...sources, clash: { ...sources.original, assetKey: 'complaint' } }, root), /Conflicting files/);
  } finally {
    assert.ok(root.startsWith(join(tmpdir(), 'red-control-source-assets-')));
    rmSync(root, { recursive: true, force: true });
  }
});

test('separate document and video source tables merge without silent overrides', () => {
  const document = { id: 'document', purpose: 'raw-law' };
  const video = { id: 'video', purpose: 'procedure-video' };
  assert.deepEqual(mergeSourceTables({ document }, { video }), { document, video });
  assert.throws(() => mergeSourceTables({ document }, { document: video }), /Duplicate source ID/);
  assert.throws(() => mergeSourceTables({ video }, {}), /move its description/);
  assert.throws(() => mergeSourceTables({}, { document }), /accepts procedure-video/);
});

test('lesson videos are derived from published video sources using source IDs and authored titles', () => {
  const sources = {
    video: { id: 'custom-video', title: 'A "quoted" title', purpose: 'procedure-video', mime: 'video/mp4', assetKey: 'bundle-video' },
    draft: { id: 'draft', purpose: 'procedure-video', mime: 'video/mp4', assetKey: null },
    document: { id: 'document', purpose: 'raw-law', mime: 'application/pdf', assetKey: 'document' },
  };
  assert.deepEqual(lessonVideoSources(sources).map((row) => row.id), ['custom-video']);
  const output = generateLessonVideos(sources);
  assert.ok(output.includes('"custom-video": { title: "A \\"quoted\\" title", source: sourceAssets["bundle-video"] }'));
  assert.ok(!output.includes('draft'));
  assert.ok(!output.includes('document'));
  assert.equal(generateLessonVideos(Object.fromEntries(Object.entries(sources).reverse())), output);
  assert.throws(() => lessonVideoSources({ wrong: { ...sources.video, mime: 'application/pdf' } }), /expected a video MIME/);
});
