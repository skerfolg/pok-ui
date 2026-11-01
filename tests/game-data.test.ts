import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { GameDataStore } from '../src/main/game-data';
import type { RuntimeIdentity } from '../src/shared/game-data';

function stable(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return '{' + Object.keys(record).sort().map(key => JSON.stringify(key) + ':' + stable(record[key])).join(',') + '}';
  }
  return JSON.stringify(value);
}

function sha256(value: Uint8Array | string): string {
  return createHash('sha256').update(value).digest('hex');
}

const digest = 'a'.repeat(64);
const identity: RuntimeIdentity = {
  apiVersion: 1,
  pok: { version: 'fixture-pok', sourceCommit: 'pok-source', sourceDigest: digest },
  pob: { commit: '5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6', sourceDigest: 'b'.repeat(64) },
  kb: { manifestSha256: 'c'.repeat(64), contentSha256: 'd'.repeat(64), patch: '0.5.0' },
  capabilities: { computeXml: true, renderItem: true, catalogExport: true }
};

async function json(path: string, value: unknown): Promise<void> {
  await writeFile(path, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), 'pok-ui-game-data-'));
  const root = join(directory, 'resources');
  await mkdir(join(root, 'pok-runtime', 'resources'), { recursive: true });
  await mkdir(join(root, 'pob-catalog'), { recursive: true });
  await mkdir(join(root, 'passive-tree', '0_5'), { recursive: true });
  await writeFile(join(root, 'pok-runtime', 'python.exe'), 'runtime', 'utf8');
  await json(join(root, 'pok-runtime', 'resources', 'runtime-manifest.json'), {
    format_version: 1,
    version: identity.pok.version,
    platform: 'win32-x64',
    pob_commit: identity.pob.commit,
    entrypoint: ['python.exe', '-m', 'pok.desktop', 'serve'],
    identity,
    sha256: { 'python.exe': sha256('runtime') }
  });
  const catalog = {
    schemaVersion: 1,
    extractorVersion: '1',
    defaultTreeVersion: '0_5',
    supportedTreeVersions: ['0_5'],
    classes: [{ id: 'mercenary', internalId: 3, legacyId: 2, name: 'Mercenary', startNodeId: '100', ascendancies: [{ id: 'witchhunter', name: 'Witchhunter', legacyId: 1 }] }],
    entries: [
      { id: 'base:crossbow', type: 'base', name: 'Crossbow', category: 'weapon', subType: 'crossbow', raw: { source: 'fixture' } },
      { id: 'gem:gas-grenade', type: 'gem', name: 'Gas Grenade', category: 'skill', raw: { source: 'fixture' }, levels: [1, 2] }
    ],
    source: { pobCommit: identity.pob.commit, pokSourceDigest: identity.pok.sourceDigest, pobSourceDigest: identity.pob.sourceDigest,
      kbManifestSha256: identity.kb.manifestSha256, kbContentSha256: identity.kb.contentSha256, exporterVersion: '1' },
    diagnostics: []
  };
  await json(join(root, 'pob-catalog', 'catalog.json'), catalog);
  await json(join(root, 'passive-tree', '0_5', 'manifest.json'), {
    schemaVersion: 1,
    version: '0_5',
    treeFile: 'tree.json',
    assets: { icon: { file: 'icon.webp', mime: 'image/webp', width: 4, height: 4 } },
    source: { project: 'PathOfBuilding-PoE2', commit: identity.pob.commit, treeSha256: sha256(JSON.stringify({ nodes: { '1': { skill: 1, name: 'Node', orbit: 0, orbitIndex: 0 } }, groups: {}, classes: [], constants: { orbitRadii: [], orbitAnglesByOrbit: [] }, nodeOverlay: {}, min_x: 0, max_x: 0, min_y: 0, max_y: 0 })) },
    treeFileSha256: sha256(JSON.stringify({ nodes: { '1': { skill: 1, name: 'Node', orbit: 0, orbitIndex: 0 } }, groups: {}, classes: [], constants: { orbitRadii: [], orbitAnglesByOrbit: [] }, nodeOverlay: {}, min_x: 0, max_x: 0, min_y: 0, max_y: 0 })),
    diagnostics: { missingArtwork: [] }
  });
  const tree = { nodes: { '1': { skill: 1, name: 'Node', orbit: 0, orbitIndex: 0 } }, groups: {}, classes: [], constants: { orbitRadii: [], orbitAnglesByOrbit: [] }, nodeOverlay: {}, min_x: 0, max_x: 0, min_y: 0, max_y: 0 };
  await writeFile(join(root, 'passive-tree', '0_5', 'tree.json'), JSON.stringify(tree), 'utf8');
  await writeFile(join(root, 'passive-tree', '0_5', 'icon.webp'), Buffer.from([82, 73, 70, 70]));
  const relativeFiles = [
    'pok-runtime/python.exe',
    'pok-runtime/resources/runtime-manifest.json',
    'pob-catalog/catalog.json',
    'passive-tree/0_5/manifest.json',
    'passive-tree/0_5/tree.json',
    'passive-tree/0_5/icon.webp'
  ];
  const files = await Promise.all(relativeFiles.map(async path => {
    const bytes = await readFile(join(root, path));
    return { path, size: bytes.byteLength, sha256: sha256(bytes) };
  }));
  const manifest = {
    schemaVersion: 1,
    apiVersion: 1,
    bundleId: '',
    identity,
    pok: identity.pok,
    pob: identity.pob,
    kb: identity.kb,
    capabilities: identity.capabilities,
    runtime: { path: 'pok-runtime', manifest: 'pok-runtime/resources/runtime-manifest.json' },
    catalog: { path: 'pob-catalog/catalog.json', digest: files.find(file => file.path === 'pob-catalog/catalog.json')!.sha256, schemaVersion: 1, extractorVersion: '1' },
    trees: { path: 'passive-tree', sha256: sha256(stable(files.filter(file => file.path.startsWith('passive-tree/')))), defaultVersion: '0_5', supportedVersions: ['0_5'] },
    files
  };
  manifest.bundleId = 'pokbundle-' + sha256(stable({ ...manifest, bundleId: undefined })).slice(0, 32);
  await json(join(root, 'bundle-manifest.json'), manifest);
  return {
    root, manifest, async cleanup() {
      assert.ok(resolve(directory).startsWith(resolve(tmpdir(), 'pok-ui-game-data-')));
      await rm(directory, { recursive: true, force: true });
    }
  };
}

async function rewriteAsCheckoutBundle(root: string, manifest: any) {
  const runtimeManifest = JSON.parse(await readFile(join(root, 'pok-runtime', 'resources', 'runtime-manifest.json'), 'utf8'));
  await json(join(root, 'engine-identity.json'), runtimeManifest.identity);
  await rm(join(root, 'pok-runtime'), { recursive: true, force: true });
  manifest.runtime = { mode: 'checkout', path: 'checkout', manifest: 'engine-identity.json' };
  manifest.files = manifest.files.filter((file: { path: string }) => !file.path.startsWith('pok-runtime/'));
  const identityBytes = await readFile(join(root, 'engine-identity.json'));
  manifest.files.push({ path: 'engine-identity.json', size: identityBytes.byteLength, sha256: sha256(identityBytes) });
  manifest.files.sort((a: { path: string }, b: { path: string }) => a.path.localeCompare(b.path));
  manifest.bundleId = 'pokbundle-' + sha256(stable({ ...manifest, bundleId: undefined })).slice(0, 32);
  await json(join(root, 'bundle-manifest.json'), manifest);
}

test('game data store verifies bundle identity, catalog queries and bundle-scoped tree assets', async () => {
  const f = await fixture();
  try {
    const store = new GameDataStore(f.root);
    const info = await store.getInfo();
    assert.equal(info.status, 'ready');
    assert.equal(info.bundleId, f.manifest.bundleId);
    assert.equal(info.identity?.pob.commit, identity.pob.commit);
    assert.equal(info.defaultTreeVersion, '0_5');
    assert.equal(info.classes?.[0].startNodeId, '100');
    const query = await store.query({ type: 'base', query: 'cross', limit: 10 });
    assert.equal(query.total, 1);
    assert.equal(query.entries[0].id, 'base:crossbow');
    assert.equal((await store.getEntry('gem', 'gem:gas-grenade')).levels?.[1], 2);
    const tree = await store.loadTree('0_5');
    assert.equal(tree.assets.icon.url, `pok-tree://assets/${f.manifest.bundleId}/0_5/icon.webp`);
    assert.deepEqual(await store.asset(tree.assets.icon.url), { body: Uint8Array.from([82, 73, 70, 70]), mime: 'image/webp' });
  } finally { await f.cleanup(); }
});

test('bundle verification rejects stale files, mismatched engines and wrong tree source', async () => {
  const f = await fixture();
  try {
    assert.equal((await new GameDataStore(f.root).verifyEngine({ identity })).ok, true);
    const wrong = structuredClone(identity);
    wrong.pob.commit = 'different';
    const verification = await new GameDataStore(f.root).verifyEngine({ identity: wrong });
    assert.equal(verification.ok, false);
    assert.match(verification.reason ?? '', /PoB/);
    await writeFile(join(f.root, 'pob-catalog', 'catalog.json'), '{"schemaVersion":1}', 'utf8');
    const info = await new GameDataStore(f.root).getInfo();
    assert.equal(info.status, 'corrupt');
    assert.equal(info.error, '게임 데이터 묶음이 손상되었거나 현재 POK 런타임과 일치하지 않습니다.');
  } finally { await f.cleanup(); }
});

test('bundle manifest must include runtime manifest, entrypoint and every runtime sha256 file', async () => {
  const f = await fixture();
  try {
    const manifestPath = join(f.root, 'bundle-manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    manifest.files = manifest.files.filter((file: { path: string }) => file.path !== 'pok-runtime/python.exe');
    manifest.bundleId = 'pokbundle-' + sha256(stable({ ...manifest, bundleId: undefined })).slice(0, 32);
    await json(manifestPath, manifest);
    const info = await new GameDataStore(f.root).getInfo();
    assert.equal(info.status, 'corrupt');
    assert.equal(info.error, '게임 데이터 묶음이 손상되었거나 현재 POK 런타임과 일치하지 않습니다.');
  } finally { await f.cleanup(); }
});

test('catalog provenance must match runtime identity beyond the PoB commit', async () => {
  const f = await fixture();
  try {
    const catalogPath = join(f.root, 'pob-catalog', 'catalog.json');
    const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
    catalog.source.kbManifestSha256 = 'e'.repeat(64);
    await json(catalogPath, catalog);
    const bytes = await readFile(catalogPath);
    const manifestPath = join(f.root, 'bundle-manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    manifest.catalog.digest = sha256(bytes);
    for (const file of manifest.files) {
      if (file.path === 'pob-catalog/catalog.json') {
        file.size = bytes.byteLength;
        file.sha256 = sha256(bytes);
      }
    }
    manifest.bundleId = 'pokbundle-' + sha256(stable({ ...manifest, bundleId: undefined })).slice(0, 32);
    await json(manifestPath, manifest);
    const info = await new GameDataStore(f.root).getInfo();
    assert.equal(info.status, 'corrupt');
  } finally { await f.cleanup(); }
});

test('catalog diagnostics allow documented PoB-delegated functions and reject fatal losses', async () => {
  const f = await fixture();
  try {
    const catalogPath = join(f.root, 'pob-catalog', 'catalog.json');
    const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
    catalog.diagnostics = [
      { code: 'unsupported-lua-function', source: 'mods', path: 'AffixData.Prefix.apply', handling: 'delegated-to-pob' },
      { code: 'unsupported-lua-function', source: 'skills', path: '$.data.PerfectStrikePlayer.preDamageFunc', handling: 'delegated-to-pob' },
      { code: 'typed-map-conversion', path: 'BaseItemTypes', lossless: true }
    ];
    await json(catalogPath, catalog);
    let bytes = await readFile(catalogPath);
    let manifestPath = join(f.root, 'bundle-manifest.json');
    let manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    manifest.catalog.digest = sha256(bytes);
    for (const file of manifest.files) if (file.path === 'pob-catalog/catalog.json') { file.size = bytes.byteLength; file.sha256 = sha256(bytes); }
    manifest.bundleId = 'pokbundle-' + sha256(stable({ ...manifest, bundleId: undefined })).slice(0, 32);
    await json(manifestPath, manifest);
    const allowed = await new GameDataStore(f.root).getInfo();
    assert.equal(allowed.status, 'ready');
    assert.equal(allowed.catalog?.diagnostics, 3);
    catalog.diagnostics = [{ code: 'unsupported-lua-function', source: 'skills', path: '$.data.Other.Func', handling: 'omitted' }];
    await json(catalogPath, catalog);
    bytes = await readFile(catalogPath);
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    manifest.catalog.digest = sha256(bytes);
    for (const file of manifest.files) if (file.path === 'pob-catalog/catalog.json') { file.size = bytes.byteLength; file.sha256 = sha256(bytes); }
    manifest.bundleId = 'pokbundle-' + sha256(stable({ ...manifest, bundleId: undefined })).slice(0, 32);
    await json(manifestPath, manifest);
    const rejected = await new GameDataStore(f.root).getInfo();
    assert.equal(rejected.status, 'corrupt');
  } finally { await f.cleanup(); }
});

test('launch descriptor rechecks runtime bytes after cached bundle info', async () => {
  const f = await fixture();
  try {
    const store = new GameDataStore(f.root);
    assert.equal((await store.getInfo()).status, 'ready');
    await writeFile(join(f.root, 'pok-runtime', 'python.exe'), 'changed-runtime', 'utf8');
    await assert.rejects(store.getLaunchDescriptor(), /해시|digest|differs|다릅니다/);
  } finally { await f.cleanup(); }
});

test('checkout bundle is rejected by default but supports catalog and tree lookup with explicit opt-in', async () => {
  const f = await fixture();
  try {
    await rewriteAsCheckoutBundle(f.root, f.manifest);
    const rejected = await new GameDataStore(f.root).getInfo();
    assert.equal(rejected.status, 'corrupt');
    const store = new GameDataStore(f.root, { allowCheckout: true });
    const info = await store.getInfo();
    assert.equal(info.status, 'ready');
    assert.equal(info.runtimeMode, 'checkout');
    assert.equal(info.bundleId, f.manifest.bundleId);
    const query = await store.query({ type: 'gem', query: 'gas' });
    assert.equal(query.total, 1);
    assert.equal((await store.loadTree('0_5')).assets.icon.url, `pok-tree://assets/${f.manifest.bundleId}/0_5/icon.webp`);
    await assert.rejects(store.getLaunchDescriptor(), /checkout|descriptor|실행/);
  } finally { await f.cleanup(); }
});

test('missing bundle info returns a user-facing message without local paths', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pok-ui-game-data-missing-'));
  try {
    const info = await new GameDataStore(join(directory, 'resources')).getInfo();
    assert.equal(info.status, 'missing');
    assert.equal(info.error, '게임 데이터 묶음이 준비되지 않았습니다.');
    assert.doesNotMatch(info.error ?? '', /[A-Z]:\\|\/tmp|ENOENT/i);
  } finally {
    assert.ok(resolve(directory).startsWith(resolve(tmpdir(), 'pok-ui-game-data-missing-')));
    await rm(directory, { recursive: true, force: true });
  }
});
