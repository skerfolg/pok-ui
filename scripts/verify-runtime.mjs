import { sha256File } from './file-integrity.mjs';
import { readFile, stat } from 'node:fs/promises';
import { isAbsolute, resolve, join } from 'node:path';
const platform = process.argv[2] || process.platform;
const root = resolve('resources/pok-runtime');
const manifest = JSON.parse(await readFile(join(root, 'resources/runtime-manifest.json'), 'utf8'));
function assertRelativePath(value, name) {
  if (typeof value !== 'string' || isAbsolute(value) || value.includes('\0') || value.split(/[\\/]/).some(part => !part || part === '.' || part === '..')) {
    throw new Error(`${name} must be a relative path inside the runtime.`);
  }
}

if (manifest.format_version !== 1 || typeof manifest.platform !== 'string' || !manifest.platform.startsWith(platform + '-') ||
  typeof manifest.pob_commit !== 'string' || !Array.isArray(manifest.entrypoint) || !manifest.entrypoint.length ||
  !manifest.sha256 || typeof manifest.sha256 !== 'object') throw new Error(`A native ${platform} runtime is required.`);
assertRelativePath(manifest.entrypoint[0], 'entrypoint[0]');
await stat(join(root, manifest.entrypoint[0]));
for (const [relativePath, expected] of Object.entries(manifest.sha256)) {
  assertRelativePath(relativePath, `sha256.${relativePath}`);
  if (typeof expected !== 'string' || !/^[0-9a-f]{64}$/i.test(expected)) throw new Error(`Runtime manifest contains an invalid digest for ${relativePath}.`);
  const actual = await sha256File(join(root, relativePath));
  if (actual !== expected.toLowerCase()) throw new Error(`Runtime file digest differs: ${relativePath}`);
}
if (!manifest.identity || manifest.identity.apiVersion !== 1) throw new Error('Runtime identity is missing.');
console.log(`Runtime ready: ${manifest.platform}; POK ${manifest.version}; PoB ${manifest.pob_commit}`);
