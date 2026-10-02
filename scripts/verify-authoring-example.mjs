import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, isAbsolute, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';

const workspace = dirname(dirname(fileURLToPath(import.meta.url)));
const staging = mkdtempSync(join(workspace, '.authoring-check-'));
const id = 'example-city-2027';
try {
  cpSync(join(workspace, 'src/content'), join(staging, 'src/content'), { recursive: true });
  mkdirSync(join(staging, 'src/core/constants'), { recursive: true });
  mkdirSync(join(staging, 'scripts'));
  for (const file of ['build-content.mjs', 'catalog-validation.mjs', 'source-assets.mjs']) {
    cpSync(join(workspace, 'scripts', file), join(staging, 'scripts', file));
  }
  cpSync(join(workspace, 'examples/authoring', id), join(staging, 'src/content/elections', id), {
    recursive: true,
  });
  const headquartersPath = join(staging, 'src/content/global/headquarters.yaml');
  const headquarters = parse(readFileSync(headquartersPath, 'utf8'));
  if (!headquarters.shared) {
    const exampleHeadquarters = parse(readFileSync(join(workspace, 'examples/authoring/global/headquarters.yaml'), 'utf8'));
    writeFileSync(headquartersPath, stringify({ ...headquarters, ...exampleHeadquarters }));
  }
  const manifestPath = join(staging, 'src/content/catalog-manifest.yaml');
  const manifest = parse(readFileSync(manifestPath, 'utf8'));
  manifest.campaigns.push(`elections/${id}/manifest.yaml`);
  writeFileSync(manifestPath, stringify(manifest));
  const builder = join(staging, 'scripts/build-content.mjs');
  execFileSync(process.execPath, [builder], { cwd: workspace, stdio: 'inherit' });
  execFileSync(process.execPath, [builder, '--check'], { cwd: workspace, stdio: 'inherit' });
  const catalog = JSON.parse(readFileSync(join(staging, 'src/content/catalog.generated.json'), 'utf8'));
  assert.ok(catalog.campaigns[id], 'Starter election was not included');
  assert.ok(catalog.laws[`${id}:example-law`], 'Starter legal entry was not included');
  console.log('Starter election builds successfully. Active content was not modified.');
} finally {
  const localPath = relative(workspace, staging);
  assert.ok(localPath.startsWith('.authoring-check-') && !localPath.includes('..') && !isAbsolute(localPath));
  rmSync(staging, { recursive: true, force: true });
}
