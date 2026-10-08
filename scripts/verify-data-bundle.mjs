import { sha256File } from './file-integrity.mjs';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve('resources');
function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
async function json(path) { return JSON.parse(await readFile(path, 'utf8')); }
function requireHex(value, name) {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/i.test(value)) throw new Error(`${name} must be a sha256 digest.`);
}
function requireRelative(value, name) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._/-]{0,240}$/.test(value) || value.includes('..') || value.includes('//'))
    throw new Error(`${name} must be a safe resource-relative path.`);
  return value;
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

const manifest = await json(join(root, 'bundle-manifest.json'));
if (manifest.schemaVersion !== 1 || manifest.apiVersion !== 1) throw new Error('Unsupported bundle manifest.');
if (!manifest.bundleId || !manifest.pok?.sourceCommit || !manifest.pob?.commit) throw new Error('Bundle identity is incomplete.');
if (manifest.runtime?.mode === 'checkout') throw new Error('Checkout data bundles are development-only and cannot pass production verification.');
const stable = value => {
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + stable(value[key])).join(',') + '}';
  return JSON.stringify(value);
};
const expectedBundleId = 'pokbundle-' + sha256(stable({ ...manifest, bundleId: undefined })).slice(0, 32);
if (manifest.bundleId !== expectedBundleId) throw new Error('Bundle ID does not match manifest content.');
if (!manifest.catalog || manifest.catalog.schemaVersion !== 1) throw new Error('Catalog manifest is incomplete.');
requireHex(manifest.catalog.digest, 'catalog.digest');
const catalogPath = requireRelative(manifest.catalog.path, 'catalog.path');
if (!Array.isArray(manifest.files) || !manifest.files.length) throw new Error('Bundle files are missing.');

for (const entry of manifest.files) {
  const relativePath = requireRelative(entry.path, 'files[].path');
  requireHex(entry.sha256, `sha256 for ${relativePath}`);
  const file = join(root, relativePath);
  const info = await stat(file);
  if (!info.isFile()) throw new Error(`${relativePath} is not a file.`);
  if (info.size !== entry.size) throw new Error(`${relativePath} size differs.`);
  const actual = await sha256File(file);
  if (actual !== entry.sha256.toLowerCase()) throw new Error(`${relativePath} digest differs.`);
}

const fileSet = new Set(manifest.files.map(entry => entry.path));
const catalog = await json(join(root, catalogPath));
if (sha256(await readFile(join(root, catalogPath))) !== manifest.catalog.digest.toLowerCase()) throw new Error('Catalog digest differs.');
if (catalog.schemaVersion !== manifest.catalog.schemaVersion || catalog.extractorVersion !== manifest.catalog.extractorVersion) throw new Error('Catalog schema differs.');
if (catalog.source?.pobCommit !== manifest.pob.commit) throw new Error('Catalog PoB commit differs from bundle.');
if (catalog.source?.exporterVersion !== '1' || catalog.source?.pokSourceDigest !== manifest.pok.sourceDigest ||
  catalog.source?.pobSourceDigest !== manifest.pob.sourceDigest || catalog.source?.kbManifestSha256 !== manifest.kb.manifestSha256 ||
  catalog.source?.kbContentSha256 !== manifest.kb.contentSha256) throw new Error('Catalog provenance differs from bundle identity.');
assertCatalogDiagnostics(catalog.diagnostics);
if (catalog.defaultTreeVersion !== manifest.trees?.defaultVersion) throw new Error('Catalog default tree differs from bundle.');
if (!Array.isArray(manifest.trees?.supportedVersions) || !manifest.trees.supportedVersions.length ||
  stable(catalog.supportedTreeVersions) !== stable(manifest.trees.supportedVersions)) throw new Error("Supported tree versions differ between catalog and bundle.");
for (const version of manifest.trees.supportedVersions) {
  if (typeof version !== "string" || !/^\d{1,3}_\d{1,3}(?:_\d{1,3})?$/.test(version)) throw new Error("Invalid tree version.");
  const treeRoot = requireRelative(`${manifest.trees.path}/${version}`, 'tree path');
  const treeManifestPath = `${treeRoot}/manifest.json`;
  if (!fileSet.has(treeManifestPath)) throw new Error(`Tree manifest is missing from bundle files: ${version}`);
  const treeManifest = await json(join(root, treeManifestPath));
  if (treeManifest.source?.commit !== manifest.pob.commit) throw new Error(`Passive tree ${version} PoB commit differs from bundle.`);
  if (treeManifest.schemaVersion !== 1 || treeManifest.version !== version) throw new Error(`Passive tree ${version} schema/version differs.`);
  requireHex(treeManifest.source.treeSha256, 'source.treeSha256');
  requireHex(treeManifest.treeFileSha256, 'treeFileSha256');
  const treeFile = `${treeRoot}/${requireRelative(treeManifest.treeFile, 'treeFile')}`;
  if (!fileSet.has(treeFile)) throw new Error(`Tree data is missing from bundle files: ${version}`);
  if (await sha256File(join(root, treeFile)) !== treeManifest.treeFileSha256) throw new Error(`Passive tree ${version} transformed hash differs.`);
  for (const asset of Object.values(treeManifest.assets ?? {})) {
    const assetFile = `${treeRoot}/${requireRelative(asset.file, 'tree asset')}`;
    if (!fileSet.has(assetFile)) throw new Error(`Tree asset is missing from bundle files: ${assetFile}`);
  }
}

const runtime = await json(join(root, 'pok-runtime', 'resources', 'runtime-manifest.json'));
if (runtime.pob_commit !== manifest.pob.commit) throw new Error('Runtime PoB commit differs from bundle.');
if (runtime.version && manifest.pok.version && runtime.version !== manifest.pok.version) throw new Error('Runtime version differs from bundle.');
if (runtime.identity?.apiVersion !== 1 || runtime.identity.pob?.commit !== manifest.pob.commit) throw new Error('Runtime identity differs from bundle.');
for (const required of [manifest.runtime?.manifest, manifest.catalog.path, `${manifest.runtime?.path}/${runtime.entrypoint?.[0]}`]) {
  const value = requireRelative(required, 'required file');
  if (!fileSet.has(value)) throw new Error(`Required bundle file is missing: ${value}`);
}
for (const relativePath of Object.keys(runtime.sha256 ?? {})) {
  const bundled = requireRelative(`${manifest.runtime.path}/${relativePath}`, 'runtime sha256 file');
  if (!fileSet.has(bundled)) throw new Error(`Runtime manifest file is missing from bundle files: ${bundled}`);
}

console.log(`Data bundle ready: ${manifest.bundleId}; PoB ${manifest.pob.commit}; catalog ${catalog.entries.length} entries`);
