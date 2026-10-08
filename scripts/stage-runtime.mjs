import { performAtomicSwap } from './bundle-swap.mjs';
import { sha256File } from './file-integrity.mjs';
import { cp, mkdir, readFile, rm, stat } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname, isAbsolute, join, resolve } from 'node:path';

const source = process.argv[2] && resolve(process.argv[2]);
if (!source) throw new Error('Usage: npm run runtime:stage -- <frozen/pok directory>');

function assertRelativePath(value, name) {
  if (typeof value !== 'string' || isAbsolute(value) || value.includes('\0') || value.split(/[\\/]/).some(part => !part || part === '.' || part === '..')) {
    throw new Error(`${name} must be a relative path inside the runtime.`);
  }
}

async function sha256(path) { return sha256File(path); }

async function verifyRuntime(root) {
  const manifest = JSON.parse(await readFile(join(root, 'resources/runtime-manifest.json'), 'utf8'));
  if (manifest.format_version !== 1 || typeof manifest.version !== 'string' || typeof manifest.pob_commit !== 'string' ||
    !Array.isArray(manifest.entrypoint) || !manifest.entrypoint.length || !manifest.entrypoint.every(part => typeof part === 'string') ||
    !manifest.sha256 || typeof manifest.sha256 !== 'object') throw new Error('Unsupported POK runtime manifest.');
  assertRelativePath(manifest.entrypoint[0], 'entrypoint[0]');
  await stat(join(root, manifest.entrypoint[0]));
  for (const [file, digest] of Object.entries(manifest.sha256)) {
    assertRelativePath(file, `sha256.${file}`);
    if (!/^[0-9a-f]{64}$/.test(String(digest))) throw new Error(`Invalid SHA-256 for ${file}.`);
    const actual = await sha256(join(root, file));
    if (actual !== digest) throw new Error(`Runtime file hash mismatch: ${file}`);
  }
  return manifest;
}

const destination = resolve('resources/pok-runtime');
const temp = resolve('resources', `.pok-runtime.stage-${randomUUID()}`);

await mkdir(dirname(destination), { recursive: true });
try {
  await cp(source, temp, { recursive: true, errorOnExist: true, force: false });
  const manifest = await verifyRuntime(temp);
  await performAtomicSwap({
    workspace: resolve("."),
    backupsRoot: resolve(".local", "runtime-backups"),
    entries: [{ label: "runtime", target: destination, staged: temp, backupName: "pok-runtime" }]
  });
  console.log(`Staged POK ${manifest.version}, PoB ${manifest.pob_commit}, ${manifest.platform}`);
} finally {
  await rm(temp, { recursive: true, force: true });
}
