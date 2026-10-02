import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, relative, dirname, isAbsolute, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { selectComplaintIds } from './complaint-selection.mjs';
import { parse } from 'yaml';
import { validateCatalog, validateCampaignFile } from './catalog-validation.mjs';
import {
  generateSourceAssets,
  generateLessonVideos,
  lessonVideoSources,
  mergeSourceTables,
} from './source-assets.mjs';
const root = fileURLToPath(new URL('../src/content/', import.meta.url));
const read = (p) => parse(readFileSync(resolve(root, p), 'utf8'), { uniqueKeys: true });
const manifest = read('catalog-manifest.yaml');
assert.equal(manifest.schemaVersion, 1);
const catalog = { schemaVersion: 1, revision: manifest.revision, campaigns: {} };
for (const key of [
  'sources',
  'laws',
  'topics',
  'tasks',
  'blocks',
  'roadmaps',
  'documents',
  'headquarters',
  'contacts',
  'complaints',
  'complaint-templates',
])
  catalog[key === 'complaint-templates' ? 'complaintTemplates' : key] = read(
    'global/' + (key === 'laws' ? 'laws/' : key === 'sources' ? 'documents/' : '') + key + '.yaml',
  );
catalog.problemSolving = read('global/problem-solving.yaml');
catalog.sources = mergeSourceTables(catalog.sources, read('global/videos/sources.yaml'));
for (const path of manifest.campaigns) {
  assert.ok(
    !relative(root, resolve(root, path)).startsWith('..'),
    'Campaign escapes content directory',
  );
  const authored = read(path);
  const { commissionsFile, ...definition } = validateCampaignFile({
    ...authored,
    election: { ...authored.election, lawIds: [], sourceIds: [] },
  });
  const commissionsPath = resolve(dirname(resolve(root, path)), commissionsFile);
  const relativePath = relative(root, commissionsPath);
  assert.ok(
    !isAbsolute(commissionsFile) &&
      !isAbsolute(relativePath) &&
      relativePath !== '..' &&
      !relativePath.startsWith('..' + sep),
    'Commission file must be relative and stay inside the content directory',
  );
  const campaign = { ...definition, commissions: read(commissionsPath) };
  // Optional campaign-local tables support nested content without global file collisions.
  const local = resolve(root, path, '..', 'content');
  for (const key of ['sources', 'laws', 'topics', 'tasks', 'blocks', 'roadmaps', 'documents']) {
    const files = [];
    const walk = (dir) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const p = resolve(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (entry.name.endsWith('.yaml')) files.push(p);
      }
    };
    try {
      walk(resolve(local, key));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    for (const file of files.sort())
      for (const [id, row] of Object.entries(
        parse(readFileSync(file, 'utf8'), { uniqueKeys: true }),
      )) {
        assert.ok(id.startsWith(campaign.election.id + ':'), 'Local IDs must use campaign prefix');
        assert.ok(!Object.hasOwn(catalog[key], id), 'Duplicate content ID: ' + id);
        catalog[key][id] = row;
      }
  }
  assert.ok(!Object.hasOwn(catalog.campaigns, campaign.election.id), 'Duplicate campaign');
  catalog.campaigns[campaign.election.id] = campaign;
}
// Derived scope is never manually duplicated in election manifests.
for (const campaign of Object.values(catalog.campaigns)) {
  const election = campaign.election;
  const roadmap = catalog.roadmaps[election.roadmapConfigId];
  assert.ok(roadmap, 'Unknown roadmap: ' + election.roadmapConfigId);
  const topics = election.topicIds.map((id) => {
    assert.ok(catalog.topics[id], 'Unknown topic: ' + id);
    return catalog.topics[id];
  });
  const tasks = [...roadmap.steps, ...roadmap.anytime].flatMap((step) => {
    assert.ok(catalog.blocks[step.blockId], 'Unknown block: ' + step.blockId);
    return catalog.blocks[step.blockId].taskIds.map((id) => {
      assert.ok(catalog.tasks[id], 'Unknown task: ' + id);
      return catalog.tasks[id];
    });
  });
  // Roadmap tasks select complaints; legal references do not select them.
  election.complaintIds = selectComplaintIds(
    catalog.complaints,
    tasks,
    election.complaintIds,
  );
  const complaints = election.complaintIds.map((id) => {
    assert.ok(catalog.complaints[id], 'Unknown complaint: ' + id);
    return catalog.complaints[id];
  });
  election.lawIds = [
    ...new Set(
      [...topics, ...tasks]
        .flatMap((row) => row.lawIds)
        .concat(complaints.flatMap((row) => row.lawIds)),
    ),
  ];
  const laws = election.lawIds.map((id) => {
    assert.ok(catalog.laws[id], 'Unknown law: ' + id);
    return catalog.laws[id];
  });
  election.sourceIds = [
    ...new Set(
      [...topics, ...tasks, ...laws]
        .flatMap((row) => row.sourceIds)
        .concat(
          election.documentIds.map((id) => {
            assert.ok(catalog.documents[id], 'Unknown document: ' + id);
            return catalog.documents[id].sourceId;
          }),
        ),
    ),
  ];
}
validateCatalog(catalog);
const assets = generateSourceAssets(catalog.sources, root);
const videos = generateLessonVideos(catalog.sources);
const videoIds = new Set(lessonVideoSources(catalog.sources).map((source) => source.id));
for (const topic of Object.values(catalog.topics))
  if (topic.videoId)
    assert.ok(videoIds.has(topic.videoId), 'Unknown or unpublished video ID: ' + topic.videoId);
const assetsTarget = resolve(root, 'source-assets.generated.ts');
if (process.argv.includes('--check'))
  assert.equal(
    readFileSync(assetsTarget, 'utf8'),
    assets,
    'Source assets are stale. Run npm run build:content.',
  );
else writeFileSync(assetsTarget, assets);
const videosTarget = resolve(root, 'lesson-videos.generated.ts');
if (process.argv.includes('--check'))
  assert.equal(
    readFileSync(videosTarget, 'utf8'),
    videos,
    'Lesson videos are stale. Run npm run build:content.',
  );
else writeFileSync(videosTarget, videos);

const output = JSON.stringify(catalog, null, 2) + '\n';
const target = resolve(root, 'catalog.generated.json');
if (process.argv.includes('--check'))
  assert.equal(
    readFileSync(target, 'utf8'),
    output,
    'Catalog is stale. Run npm run build:content.',
  );
else writeFileSync(target, output);
console.log('Validated offline catalog: ' + Object.keys(catalog.campaigns).length + ' campaigns.');

const settings = JSON.stringify(read('global/app-settings.yaml'), null, 2) + '\n';
const settingsTarget = resolve(root, '../core/constants/app-settings.generated.json');
if (process.argv.includes('--check'))
  assert.equal(readFileSync(settingsTarget, 'utf8'), settings, 'App settings are stale');
else writeFileSync(settingsTarget, settings);
