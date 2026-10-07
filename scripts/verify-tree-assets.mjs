import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
const runtime = JSON.parse(await readFile('resources/pok-runtime/resources/runtime-manifest.json', 'utf8'));
const root = resolve('resources/passive-tree');
const versions = (await readdir(root)).filter(name => /^\d+_\d+$/.test(name));
if (!versions.includes('0_5')) throw new Error('Passive-tree 0_5 display resources are required. Run scripts/prepare-tree-assets.py.');
for (const version of versions) {
  const folder = join(root, version);
  const manifest = JSON.parse(await readFile(join(folder, 'manifest.json'), 'utf8'));
  if (manifest.schemaVersion !== 1 || manifest.version !== version || manifest.source.commit !== runtime.pob_commit) throw new Error(`POK runtime and passive-tree ${version} source versions differ.`);
  if (manifest.diagnostics.missingArtwork.length) throw new Error(`Missing artwork in passive-tree ${version}.`);
  await stat(join(folder, 'tree.json')); await stat(join(folder, 'ATTRIBUTION.txt')); await stat(join(folder, 'POB-LICENSE.md'));
  for (const file of new Set(Object.values(manifest.assets).map(asset => asset.file))) {
    if (!/^[A-Za-z0-9._-]+\.(?:png|webp)$/.test(file)) throw new Error('Unexpected asset file name.');
    await stat(join(folder, file));
  }
}
console.log(`Passive trees ready: ${versions.join(', ')}; PoB ${runtime.pob_commit}`);
