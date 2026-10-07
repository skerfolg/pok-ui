import { readFile, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
const platform = process.argv[2] || process.platform;
const root = resolve('resources/pok-runtime');
const manifest = JSON.parse(await readFile(join(root, 'resources/runtime-manifest.json'), 'utf8'));
if (manifest.format_version !== 1 || !manifest.platform.startsWith(platform + '-')) throw new Error(`A native ${platform} runtime is required.`);
await stat(join(root, platform === 'win32' ? 'pok.exe' : 'pok'));
if (!manifest.pob_commit || Object.keys(manifest.sha256 ?? {}).length < 1) throw new Error('Runtime provenance is missing.');
console.log(`Runtime ready: ${manifest.platform}; PoB ${manifest.pob_commit}`);
