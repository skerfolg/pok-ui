import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const exec = promisify(execFile);
const repo = resolve('.');

function sha256(value: Uint8Array | string): string {
  return createHash('sha256').update(value).digest('hex');
}

async function json(path: string, value: unknown): Promise<void> {
  await writeFile(path, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), 'pok-ui-bundle-'));
  const resources = join(directory, 'resources');
  await mkdir(join(resources, 'pok-runtime', 'resources'), { recursive: true });
  await mkdir(join(resources, 'pob-catalog'), { recursive: true });
  await mkdir(join(resources, 'passive-tree', '0_5'), { recursive: true });
  const identity = {
    apiVersion: 1,
    pok: { version: 'fixture-pok', sourceCommit: 'pok-source', sourceDigest: 'a'.repeat(64) },
    pob: { commit: '5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6', sourceDigest: 'b'.repeat(64) },
    kb: { manifestSha256: 'c'.repeat(64), contentSha256: 'd'.repeat(64), patch: '0.5.0' },
    capabilities: { computeXml: true, renderItem: true, catalogExport: true }
  };
  await writeFile(join(resources, 'pok-runtime', 'python.exe'), 'runtime', 'utf8');
  await json(join(resources, 'pok-runtime', 'resources', 'runtime-manifest.json'), {
    format_version: 1,
    version: identity.pok.version,
    platform: 'win32-x64',
    pob_commit: identity.pob.commit,
    entrypoint: ['python.exe', '-m', 'pok.desktop', 'serve'],
    identity,
    sha256: { 'python.exe': sha256('runtime') }
  });
  await json(join(resources, 'pob-catalog', 'catalog.json'), {
    schemaVersion: 1,
    extractorVersion: '1',
    defaultTreeVersion: '0_5',
    supportedTreeVersions: ['0_5'],
    classes: [],
    entries: [{ id: 'base:one', type: 'base', name: 'One', raw: {} }],
    source: { pobCommit: identity.pob.commit, pokSourceDigest: identity.pok.sourceDigest, pobSourceDigest: identity.pob.sourceDigest,
      kbManifestSha256: identity.kb.manifestSha256, kbContentSha256: identity.kb.contentSha256, exporterVersion: '1' },
    diagnostics: []
  });
  const tree = { nodes: {}, groups: {}, classes: [], constants: { orbitRadii: [], orbitAnglesByOrbit: [] }, nodeOverlay: {}, min_x: 0, max_x: 0, min_y: 0, max_y: 0 };
  await writeFile(join(resources, 'passive-tree', '0_5', 'tree.json'), JSON.stringify(tree), 'utf8');
  await writeFile(join(resources, 'passive-tree', '0_5', 'icon.webp'), 'img', 'utf8');
  await json(join(resources, 'passive-tree', '0_5', 'manifest.json'), {
    schemaVersion: 1,
    version: '0_5',
    treeFile: 'tree.json',
    assets: { icon: { file: 'icon.webp', mime: 'image/webp', width: 1, height: 1 } },
    source: { project: 'PathOfBuilding-PoE2', commit: identity.pob.commit, treeSha256: sha256(JSON.stringify(tree)) },
    treeFileSha256: sha256(JSON.stringify(tree)),
    diagnostics: { missingArtwork: [] }
  });
  return {
    directory,
    resources,
    async cleanup() {
      assert.ok(resolve(directory).startsWith(resolve(tmpdir(), 'pok-ui-bundle-')));
      await rm(directory, { recursive: true, force: true });
    }
  };
}

async function runtimeArtifact(directory: string, options: { badExport?: boolean } = {}) {
  const root = join(directory, options.badExport ? 'bad-runtime' : 'runtime-artifact');
  const digestIdentity = {
    apiVersion: 1,
    pok: { version: options.badExport ? 'bad-pok' : 'fixture-pok', sourceCommit: 'pok-source', sourceDigest: 'a'.repeat(64) },
    pob: { commit: '5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6', sourceDigest: 'b'.repeat(64) },
    kb: { manifestSha256: 'c'.repeat(64), contentSha256: 'd'.repeat(64), patch: '0.5.0' },
    capabilities: { computeXml: true, renderItem: true, catalogExport: true }
  };
  await mkdir(join(root, 'resources'), { recursive: true });
  await mkdir(join(root, 'pob', 'src', 'TreeData', '0_5'), { recursive: true });
  await writeFile(join(root, 'pob', 'LICENSE.md'), 'license', 'utf8');
  const exporterJs = `
const fs=require('fs'),path=require('path');
const out=process.argv[process.argv.indexOf('--output')+1];
if (${options.badExport ? 'true' : 'false'}) process.exit(7);
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out, JSON.stringify({
  schemaVersion:1, extractorVersion:'1', defaultTreeVersion:'0_5', supportedTreeVersions:['0_5'], classes:[],
  entries:[{id:'base:one',type:'base',name:'One',raw:{}}],
  source:{pobCommit:'${digestIdentity.pob.commit}',pokSourceDigest:'${digestIdentity.pok.sourceDigest}',pobSourceDigest:'${digestIdentity.pob.sourceDigest}',kbManifestSha256:'${digestIdentity.kb.manifestSha256}',kbContentSha256:'${digestIdentity.kb.contentSha256}',exporterVersion:'1'},
  diagnostics:[]
}, null, 2)+'\\n');
`;
  await writeFile(join(root, 'exporter.js'), exporterJs, 'utf8');
  await writeFile(join(root, 'exporter.cmd'), '@echo off\r\nnode "%~dp0exporter.js" %*\r\n', 'utf8');
  const manifest = {
    format_version: 1,
    version: digestIdentity.pok.version,
    platform: 'win32-x64',
    pob_commit: digestIdentity.pob.commit,
    pob_root: 'pob',
    ui_tree_versions: ['0_5'],
    entrypoint: ['exporter.cmd', 'serve'],
    identity: digestIdentity,
    sha256: {
      'exporter.cmd': sha256(await readFile(join(root, 'exporter.cmd'))),
      'exporter.js': sha256(await readFile(join(root, 'exporter.js')))
    }
  };
  await json(join(root, 'resources', 'runtime-manifest.json'), manifest);
  return root;
}

async function treeConverter(directory: string) {
  const script = join(directory, 'tree-converter.js');
  await writeFile(script, `
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const arg=n=>process.argv[process.argv.indexOf(n)+1];
const out=arg('--output'), rev=arg('--source-revision');
const version='0_5', dir=path.join(out,version);
fs.mkdirSync(dir,{recursive:true});
const tree=JSON.stringify({nodes:{},groups:{},classes:[],constants:{orbitRadii:[],orbitAnglesByOrbit:[]},nodeOverlay:{},min_x:0,max_x:0,min_y:0,max_y:0});
fs.writeFileSync(path.join(dir,'tree.json'),tree);
fs.writeFileSync(path.join(dir,'icon.webp'),'img');
fs.writeFileSync(path.join(dir,'ATTRIBUTION.md'),'fixture');
fs.writeFileSync(path.join(dir,'POB-LICENSE.md'),'fixture');
fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify({schemaVersion:1,version,treeFile:'tree.json',assets:{icon:{file:'icon.webp',mime:'image/webp',width:1,height:1}},source:{project:'fixture',commit:rev,treeSha256:crypto.createHash('sha256').update('source').digest('hex'),files:{'tree.json':crypto.createHash('sha256').update('source').digest('hex')}},treeFileSha256:crypto.createHash('sha256').update(tree).digest('hex'),diagnostics:{missingArtwork:[]},counts:{nodes:0,assetNames:1,imageFiles:1}},null,2)+'\\n');
`, 'utf8');
  const cmd = join(directory, 'tree-converter.cmd');
  await writeFile(cmd, '@echo off\r\nnode "%~dp0tree-converter.js" %*\r\n', 'utf8');
  return cmd;
}

test('prepare and verify data bundle bind runtime, catalog, tree and file hashes', async () => {
  const f = await fixture();
  try {
    await exec(process.execPath, [join(repo, 'scripts', 'prepare-data-bundle.mjs'), '--write-lock'], { cwd: f.directory });
    await exec(process.execPath, [join(repo, 'scripts', 'prepare-data-bundle.mjs')], { cwd: f.directory });
    const manifest = JSON.parse(await readFile(join(f.resources, 'bundle-manifest.json'), 'utf8'));
    assert.match(manifest.bundleId, /^pokbundle-[0-9a-f]{32}$/);
    assert.equal(manifest.pob.commit, '5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6');
    const verified = await exec(process.execPath, [join(repo, 'scripts', 'verify-data-bundle.mjs')], { cwd: f.directory });
    assert.match(verified.stdout, /Data bundle ready/);
    await writeFile(join(f.resources, 'pob-catalog', 'catalog.json'), '{"schemaVersion":1}', 'utf8');
    await assert.rejects(exec(process.execPath, [join(repo, 'scripts', 'verify-data-bundle.mjs')], { cwd: f.directory }), /digest differs|Command failed/);
  } finally { await f.cleanup(); }
});

test('prepare data bundle requires a lock and rejects mismatched runtime locks', async () => {
  const f = await fixture();
  try {
    await assert.rejects(exec(process.execPath, [join(repo, 'scripts', 'prepare-data-bundle.mjs')], { cwd: f.directory }), /pok-runtime\.lock\.json is required|Command failed/);
    await exec(process.execPath, [join(repo, 'scripts', 'prepare-data-bundle.mjs'), '--write-lock'], { cwd: f.directory });
    const lockPath = join(f.directory, 'pok-runtime.lock.json');
    const lock = JSON.parse(await readFile(lockPath, 'utf8'));
    lock.pob.commit = 'different';
    await json(lockPath, lock);
    await assert.rejects(exec(process.execPath, [join(repo, 'scripts', 'prepare-data-bundle.mjs')], { cwd: f.directory }), /does not match|Command failed/);
  } finally { await f.cleanup(); }
});

test('production verifier rejects checkout-mode development bundles', async () => {
  const f = await fixture();
  try {
    await exec(process.execPath, [join(repo, 'scripts', 'prepare-data-bundle.mjs'), '--write-lock'], { cwd: f.directory });
    const manifestPath = join(f.resources, 'bundle-manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    manifest.runtime.mode = 'checkout';
    await json(manifestPath, manifest);
    await assert.rejects(exec(process.execPath, [join(repo, 'scripts', 'verify-data-bundle.mjs')], { cwd: f.directory }), /Checkout data bundles|Command failed/);
  } finally { await f.cleanup(); }
});

test('prepare and verify reject fatal catalog diagnostics while allowing delegated PoB functions', async () => {
  const f = await fixture();
  try {
    const catalogPath = join(f.resources, 'pob-catalog', 'catalog.json');
    const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
    catalog.diagnostics = [
      { code: 'unsupported-lua-function', source: 'mods', path: 'AffixData.Prefix.apply', handling: 'delegated-to-pob' },
      { code: 'typed-map-conversion', path: 'ModsById', lossless: true }
    ];
    await json(catalogPath, catalog);
    await exec(process.execPath, [join(repo, 'scripts', 'prepare-data-bundle.mjs'), '--write-lock'], { cwd: f.directory });
    await exec(process.execPath, [join(repo, 'scripts', 'prepare-data-bundle.mjs')], { cwd: f.directory });
    await exec(process.execPath, [join(repo, 'scripts', 'verify-data-bundle.mjs')], { cwd: f.directory });
    catalog.diagnostics = [{ code: 'cycle', path: 'skills.Bad.loop' }];
    await json(catalogPath, catalog);
    await assert.rejects(exec(process.execPath, [join(repo, 'scripts', 'prepare-data-bundle.mjs'), '--write-lock'], { cwd: f.directory }), /unhandled diagnostics|Command failed/);
  } finally { await f.cleanup(); }
});

test('bundle prepare stages everything and preserves old resources and lock on exporter failure', async () => {
  const f = await fixture();
  try {
    await exec(process.execPath, [join(repo, 'scripts', 'prepare-data-bundle.mjs'), '--write-lock'], { cwd: f.directory });
    await exec(process.execPath, [join(repo, 'scripts', 'prepare-data-bundle.mjs')], { cwd: f.directory });
    const originalLock = await readFile(join(f.directory, 'pok-runtime.lock.json'), 'utf8');
    const originalRuntime = await readFile(join(f.resources, 'pok-runtime', 'resources', 'runtime-manifest.json'), 'utf8');
    const converter = await treeConverter(f.directory);
    const badRuntime = await runtimeArtifact(f.directory, { badExport: true });
    await assert.rejects(exec(process.execPath, [join(repo, 'scripts', 'prepare-bundle.mjs'), '--runtime', badRuntime, '--tree-python', converter, '--write-lock'], { cwd: f.directory }), /failed|Command failed/);
    assert.equal(await readFile(join(f.directory, 'pok-runtime.lock.json'), 'utf8'), originalLock);
    assert.equal(await readFile(join(f.resources, 'pok-runtime', 'resources', 'runtime-manifest.json'), 'utf8'), originalRuntime);
    const goodRuntime = await runtimeArtifact(f.directory);
    const prepared = await exec(process.execPath, [join(repo, 'scripts', 'prepare-bundle.mjs'), '--runtime', goodRuntime, '--tree-python', converter, '--write-lock'], { cwd: f.directory });
    assert.match(prepared.stdout, /Prepared bundle/);
    const verified = await exec(process.execPath, [join(repo, 'scripts', 'verify-data-bundle.mjs')], { cwd: f.directory });
    assert.match(verified.stdout, /Data bundle ready/);
    assert.notEqual(await readFile(join(f.resources, 'pok-runtime', 'resources', 'runtime-manifest.json'), 'utf8'), originalRuntime);
  } finally { await f.cleanup(); }
});

function stableManifest(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(stableManifest).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => JSON.stringify(key) + ':' + stableManifest(item)).join(',') + '}';
  return JSON.stringify(value);
}

test('production verifier rejects extra manifest tree versions before shipping', async () => {
  const f = await fixture();
  try {
    await exec(process.execPath, [join(repo, 'scripts', 'prepare-data-bundle.mjs'), '--write-lock'], { cwd: f.directory });
    const manifestPath = join(f.resources, 'bundle-manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    manifest.trees.supportedVersions.push('0_4');
    manifest.bundleId = 'pokbundle-' + sha256(stableManifest({ ...manifest, bundleId: undefined })).slice(0, 32);
    await json(manifestPath, manifest);
    await assert.rejects(exec(process.execPath, [join(repo, 'scripts', 'verify-data-bundle.mjs')], { cwd: f.directory }), /Supported tree versions differ/);
  } finally { await f.cleanup(); }
});

test('runtime stage replaces a fresh gitkeep-only destination', async () => {
  const f = await fixture();
  try {
    const artifact = await runtimeArtifact(f.directory);
    const target = join(f.resources, 'pok-runtime');
    await rm(target, { recursive: true, force: true });
    await mkdir(target);
    await writeFile(join(target, '.gitkeep'), '');
    const result = await exec(process.execPath, [join(repo, 'scripts', 'stage-runtime.mjs'), artifact], { cwd: f.directory });
    assert.match(result.stdout, /Staged POK/);
    assert.equal(await readFile(join(target, 'exporter.js'), 'utf8'), await readFile(join(artifact, 'exporter.js'), 'utf8'));
  } finally { await f.cleanup(); }
});
