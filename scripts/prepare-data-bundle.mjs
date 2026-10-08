import { sha256File } from './file-integrity.mjs';
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

const root = resolve('resources');
const lockPath = resolve('pok-runtime.lock.json');
const writeLock = process.argv.includes('--write-lock');

function stable(value) {
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + stable(value[key])).join(',') + '}';
  return JSON.stringify(value);
}

function diagnosticCode(value) {
  return typeof value === 'string' ? value : value && typeof value === 'object' ? String(value.code ?? value.kind ?? value.type ?? '') : '';
}

function diagnosticPath(value) {
  if (!value || typeof value !== 'object') return '';
  const raw = value.path ?? value.key ?? value.location;
  return Array.isArray(raw) ? raw.join('.') : typeof raw === 'string' ? raw : '';
}

function isAllowedDiagnostic(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const code = diagnosticCode(value);
  const path = diagnosticPath(value);
  const source = typeof value.source === 'string' ? value.source : '';
  const handling = value.handling ?? value.resolution ?? value.mode;
  if (code === 'unsupported-lua-function') {
    return handling === 'delegated-to-pob' && ((source === 'mods' && /^(?:\$\.data\.)?AffixData\.[^.]+\.apply$/.test(path)) || (source === 'skills' && /^\$\.data\.[^.]+\.preDamageFunc$/.test(path)));
  }
  if (code === 'typed-map-conversion') return value.lossless === true || handling === 'lossless';
  return false;
}

function assertCatalogDiagnostics(diagnostics) {
  if (!Array.isArray(diagnostics)) throw new Error('Catalog diagnostics must be an array.');
  for (const diagnostic of diagnostics) {
    const code = diagnosticCode(diagnostic);
    if (isAllowedDiagnostic(diagnostic)) continue;
    if (/loss|cycle|nonfinite|error|unsupported|function/i.test(code) || (diagnostic && typeof diagnostic === 'object')) {
      throw new Error('Catalog export contains unhandled diagnostics.');
    }
  }
}

async function sha256(path) { return sha256File(path); }

function sha256Bytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function atomicJson(path, value) {
  const temp = join(dirname(path), `.${relative(resolve('.'), path).replace(/[\\/]/g, '-')}.${randomUUID()}.tmp`);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(temp, JSON.stringify(value, null, 2) + '\n', 'utf8');
  await rename(temp, path);
}

function relativeResource(path) {
  const value = relative(root, path).split(sep).join('/');
  if (!value || value.startsWith('..') || isAbsolute(value)) throw new Error(`Path escapes resources: ${path}`);
  return value;
}

async function walk(directory) {
  const result = [];
  for (const name of await readdir(directory)) {
    if (name === '.gitkeep') continue;
    const path = join(directory, name);
    const info = await stat(path);
    if (info.isDirectory()) result.push(...await walk(path));
    else if (info.isFile()) result.push(path);
  }
  return result;
}

async function fileEntry(path) {
  const info = await stat(path);
  return { path: relativeResource(path), size: info.size, sha256: await sha256(path) };
}

const runtimeManifestPath = join(root, 'pok-runtime', 'resources', 'runtime-manifest.json');
const runtimeManifestBytes = await readFile(runtimeManifestPath);
const runtimeManifestSha256 = sha256Bytes(runtimeManifestBytes);
const runtime = JSON.parse(runtimeManifestBytes.toString('utf8'));
if (runtime.format_version !== 1 || runtime.identity?.apiVersion !== 1 || runtime.identity.pob?.commit !== runtime.pob_commit) {
  throw new Error('Runtime manifest identity is missing or inconsistent.');
}

const catalogPath = join(root, 'pob-catalog', 'catalog.json');
const catalogBytes = await readFile(catalogPath);
const catalog = JSON.parse(catalogBytes.toString('utf8'));
if (catalog.schemaVersion !== 1 || catalog.extractorVersion !== '1' || catalog.source?.pobCommit !== runtime.pob_commit) {
  throw new Error('Catalog and runtime PoB commits differ.');
}
if (catalog.source.exporterVersion !== '1' || catalog.source.pokSourceDigest !== runtime.identity.pok.sourceDigest ||
  catalog.source.pobSourceDigest !== runtime.identity.pob.sourceDigest || catalog.source.kbManifestSha256 !== runtime.identity.kb.manifestSha256 ||
  catalog.source.kbContentSha256 !== runtime.identity.kb.contentSha256) {
  throw new Error('Catalog provenance differs from runtime identity.');
}
assertCatalogDiagnostics(catalog.diagnostics);
if (!Array.isArray(catalog.supportedTreeVersions) || !catalog.supportedTreeVersions.includes(catalog.defaultTreeVersion)) {
  throw new Error('Catalog tree versions are invalid.');
}

for (const version of catalog.supportedTreeVersions) {
  const treeManifest = JSON.parse(await readFile(join(root, 'passive-tree', version, 'manifest.json'), 'utf8'));
  if (treeManifest.source?.commit !== runtime.pob_commit) throw new Error(`Passive tree ${version} and runtime PoB commits differ.`);
}

const files = (await Promise.all([
  ...await walk(join(root, 'pok-runtime')),
  ...await walk(join(root, 'pob-catalog')),
  ...(await Promise.all(catalog.supportedTreeVersions.map(version => walk(join(root, 'passive-tree', version))))).flat()
].map(fileEntry))).sort((a, b) => a.path.localeCompare(b.path));
const fileSet = new Set(files.map(file => file.path));
for (const required of ['pok-runtime/resources/runtime-manifest.json', 'pob-catalog/catalog.json', `pok-runtime/${runtime.entrypoint[0]}`]) {
  if (!fileSet.has(required.replace(/\\/g, '/'))) throw new Error(`Required bundle file is missing: ${required}`);
}
for (const relativePath of Object.keys(runtime.sha256 ?? {})) {
  const bundled = `pok-runtime/${relativePath}`.replace(/\\/g, '/');
  if (!fileSet.has(bundled)) throw new Error(`Runtime manifest file is missing from bundle files: ${bundled}`);
}
const runtimeSha256Digest = sha256Bytes(stable(Object.fromEntries(Object.entries(runtime.sha256 ?? {}).sort(([a], [b]) => a.localeCompare(b)))));
const lock = {
  schemaVersion: 1,
  apiVersion: 1,
  pok: runtime.identity.pok,
  pob: runtime.identity.pob,
  kb: runtime.identity.kb,
  capabilities: runtime.identity.capabilities,
  runtime: {
    version: runtime.version,
    platform: runtime.platform,
    manifest: 'pok-runtime/resources/runtime-manifest.json',
    manifestSha256: runtimeManifestSha256,
    sha256Digest: runtimeSha256Digest,
    entrypoint: runtime.entrypoint
  }
};
if (writeLock) {
  await atomicJson(lockPath, lock);
  console.log(`Wrote pok-runtime.lock.json for POK ${runtime.version}; PoB ${runtime.pob_commit}`);
} else {
  let expected;
  try { expected = JSON.parse(await readFile(lockPath, 'utf8')); }
  catch (error) {
    if (error.code === 'ENOENT') throw new Error('pok-runtime.lock.json is required. Run node scripts/prepare-data-bundle.mjs --write-lock after freezing the runtime artifact.');
    throw error;
  }
  if (stable(expected) !== stable(lock)) throw new Error('pok-runtime.lock.json does not match the staged runtime artifact.');
}

const treeDigest = createHash('sha256').update(stable(files.filter(file => file.path.startsWith('passive-tree/')))).digest('hex');
const manifest = {
  schemaVersion: 1,
  apiVersion: 1,
  bundleId: '',
  identity: runtime.identity,
  pok: runtime.identity.pok,
  pob: runtime.identity.pob,
  kb: runtime.identity.kb,
  capabilities: runtime.identity.capabilities,
  runtime: { path: 'pok-runtime', manifest: 'pok-runtime/resources/runtime-manifest.json' },
  catalog: { path: 'pob-catalog/catalog.json', digest: createHash('sha256').update(catalogBytes).digest('hex'), schemaVersion: 1, extractorVersion: '1' },
  trees: { path: 'passive-tree', sha256: treeDigest, defaultVersion: catalog.defaultTreeVersion, supportedVersions: catalog.supportedTreeVersions },
  files
};
manifest.bundleId = 'pokbundle-' + createHash('sha256').update(stable({ ...manifest, bundleId: undefined })).digest('hex').slice(0, 32);
await atomicJson(join(root, 'bundle-manifest.json'), manifest);
console.log(`Prepared data bundle ${manifest.bundleId}; PoB ${runtime.pob_commit}; ${files.length} files`);
