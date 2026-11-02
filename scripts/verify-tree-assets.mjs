import { readFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';

async function sha256(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex');
}

const runtime = JSON.parse(await readFile('resources/pok-runtime/resources/runtime-manifest.json', 'utf8'));
const catalog = JSON.parse(await readFile('resources/pob-catalog/catalog.json', 'utf8'));
const root = resolve('resources/passive-tree');
if (!runtime.pob_commit || runtime.identity?.pob?.commit !== runtime.pob_commit) throw new Error('Runtime PoB identity is missing or inconsistent.');
if (catalog.schemaVersion !== 1 || catalog.extractorVersion !== '1' || catalog.source?.pobCommit !== runtime.pob_commit) throw new Error('Catalog and runtime source versions differ.');
if (!Array.isArray(catalog.supportedTreeVersions) || !catalog.supportedTreeVersions.includes(catalog.defaultTreeVersion)) throw new Error('Catalog tree versions are invalid.');
const versions = (await readdir(root)).filter(name => /^\d+_\d+(?:_\d+)?$/.test(name));
for (const version of catalog.supportedTreeVersions) {
  if (!versions.includes(version)) throw new Error(`Passive-tree ${version} display resources are required. Run scripts/prepare-tree-assets.py.`);
}
for (const version of versions) {
  const folder = join(root, version);
  const manifest = JSON.parse(await readFile(join(folder, 'manifest.json'), 'utf8'));
  if (manifest.schemaVersion !== 1 || manifest.version !== version || manifest.source.commit !== runtime.pob_commit) throw new Error(`POK runtime and passive-tree ${version} source versions differ.`);
  if (manifest.diagnostics.missingArtwork.length) throw new Error(`Missing artwork in passive-tree ${version}.`);
  if (manifest.treeFileSha256 !== await sha256(join(folder, 'tree.json'))) throw new Error(`Passive-tree ${version} emitted tree hash mismatch.`);
  await stat(join(folder, 'tree.json')); await stat(join(folder, 'ATTRIBUTION.md')); await stat(join(folder, 'POB-LICENSE.md'));
  for (const file of new Set(Object.values(manifest.assets).map(asset => asset.file))) {
    if (!/^[A-Za-z0-9._-]+\.(?:png|webp)$/.test(file)) throw new Error('Unexpected asset file name.');
    await stat(join(folder, file));
  }
}
console.log(`Passive trees ready: ${catalog.supportedTreeVersions.join(', ')}; default ${catalog.defaultTreeVersion}; PoB ${runtime.pob_commit}`);
