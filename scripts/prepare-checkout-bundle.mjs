import { sha256File } from './file-integrity.mjs';
import { ensureInside, performAtomicSwap } from './bundle-swap.mjs';
import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const workspace = resolve('.');
const scriptDir = dirname(fileURLToPath(import.meta.url));
const resources = resolve('resources');
const localRoot = resolve('.local', 'checkout-bundle-prepare');
const backupsRoot = resolve('.local', 'bundle-backups');

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const pokRoot = arg('--pok-root');
const python = arg('--python');
const treePython = arg('--tree-python');
if (!pokRoot || !python || !treePython) throw new Error('Usage: node scripts/prepare-checkout-bundle.mjs --pok-root <source> --python <python> --tree-python <python>');

function stable(value) {
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + stable(value[key])).join(',') + '}';
  return JSON.stringify(value);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function exists(path) {
  return Boolean(await stat(path).catch(() => undefined));
}

function relativeResource(root, path) {
  const value = relative(root, path).split(sep).join('/');
  if (!value || value.startsWith('..') || isAbsolute(value)) throw new Error(`Path escapes resources: ${path}`);
  return value;
}

async function json(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function assertIdentity(identity, label = 'identity') {
  if (!identity || typeof identity !== 'object' || identity.apiVersion !== 1) throw new Error(`${label} is not a POK runtime identity.`);
  for (const digest of [identity.pok?.sourceDigest, identity.pob?.sourceDigest, identity.kb?.manifestSha256, identity.kb?.contentSha256]) {
    if (typeof digest !== 'string' || !/^[0-9a-f]{64}$/i.test(digest)) throw new Error(`${label} has an invalid source digest.`);
  }
  if (!identity.pok?.version || !identity.pok?.sourceCommit || !identity.pob?.commit) throw new Error(`${label} is incomplete.`);
}

function compareStable(a, b, message) {
  if (stable(a) !== stable(b)) throw new Error(message);
}

function run(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const useShell = process.platform === 'win32' && /\.(?:cmd|bat)$/i.test(command);
    const child = spawn(command, args, { shell: useShell, stdio: ['ignore', 'pipe', 'pipe'], ...options });
    let stdout = '', stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', code => {
      if (code === 0) resolvePromise({ stdout, stderr });
      else reject(Object.assign(new Error(`${command} ${args.join(' ')} failed with ${code}\n${stdout}\n${stderr}`), { stdout, stderr, code }));
    });
  });
}

async function desktopJson(root, pythonPath, args) {
  const env = { ...process.env, PYTHONPATH: [join(root, 'src'), process.env.PYTHONPATH].filter(Boolean).join(process.platform === 'win32' ? ';' : ':') };
  const result = await run(pythonPath, ['-m', 'pok.desktop', ...args], { cwd: root, env });
  return JSON.parse(result.stdout);
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

async function fileEntry(root, path) {
  const info = await stat(path);
  return { path: relativeResource(root, path), size: info.size, sha256: await sha256File(path) };
}

function validateCatalog(catalog, identity) {
  if (catalog?.schemaVersion !== 1 || catalog?.extractorVersion !== '1') throw new Error('Catalog export has an unsupported schema.');
  if (catalog.source?.pobCommit !== identity.pob.commit ||
    catalog.source?.pokSourceDigest !== identity.pok.sourceDigest ||
    catalog.source?.pobSourceDigest !== identity.pob.sourceDigest ||
    catalog.source?.kbManifestSha256 !== identity.kb.manifestSha256 ||
    catalog.source?.kbContentSha256 !== identity.kb.contentSha256 ||
    catalog.source?.exporterVersion !== '1') throw new Error('Catalog provenance differs from checkout identity.');
  if (!Array.isArray(catalog.supportedTreeVersions) || !catalog.supportedTreeVersions.includes(catalog.defaultTreeVersion)) throw new Error('Catalog tree versions are invalid.');
}

async function findPobRoot(root, commit) {
  const candidates = [`external/pob/${commit.slice(0, 7)}`, 'external/pob', 'external/PathOfBuilding-PoE2', 'pob', 'resources/pob', 'PathOfBuilding-PoE2'];
  for (const candidate of candidates) {
    const path = join(root, candidate);
    if (await exists(join(path, 'src', 'TreeData')) && await exists(join(path, 'LICENSE.md'))) return path;
  }
  throw new Error('Cannot find pinned PoB source checkout under the POK root.');
}

async function verifyAttributionFiles(passiveTreeRoot) {
  for (const version of await readdir(passiveTreeRoot).catch(() => [])) {
    if (!/^\d+_\d+(?:_\d+)?$/.test(version)) continue;
    if (!await exists(join(passiveTreeRoot, version, 'ATTRIBUTION.md'))) throw new Error(`Passive-tree ${version} attribution file is missing.`);
  }
}

async function swapResources(stageResources) {
  return performAtomicSwap({
    workspace,
    backupsRoot,
    entries: [{ label: 'resources', target: resources, staged: stageResources, backupName: 'resources' }]
  });
}

const sourceRoot = resolve(pokRoot);
const pythonPath = resolve(python);
const treePythonPath = resolve(treePython);
if (!await exists(sourceRoot)) throw new Error(`POK source root does not exist: ${sourceRoot}`);
if (!await exists(pythonPath)) throw new Error(`Python executable does not exist: ${pythonPath}`);
if (!await exists(treePythonPath)) throw new Error(`Tree Python executable does not exist: ${treePythonPath}`);

await mkdir(localRoot, { recursive: true });
await mkdir(backupsRoot, { recursive: true });
const stageRoot = join(localRoot, 'stage-' + randomUUID());
const stageResources = join(stageRoot, 'resources');
ensureInside(workspace, stageRoot, 'stageRoot');
await mkdir(stageResources, { recursive: true });
for (const folder of ['passive-tree', 'pok-runtime']) {
  await mkdir(join(stageResources, folder), { recursive: true });
  await writeFile(join(stageResources, folder, '.gitkeep'), '');
}

try {
  const identity = await desktopJson(sourceRoot, pythonPath, ['identity', '--root', sourceRoot]);
  assertIdentity(identity);
  await json(join(stageResources, 'engine-identity.json'), identity);

  const catalogPath = join(stageResources, 'pob-catalog', 'catalog.json');
  await desktopJson(sourceRoot, pythonPath, ['export-ui', '--output', catalogPath]);
  const catalog = await readJson(catalogPath);
  validateCatalog(catalog, identity);

  const pobRoot = await findPobRoot(sourceRoot, identity.pob.commit);
  const treeVersions = catalog.supportedTreeVersions;
  // The converter validates raw input hashes before reusing an atlas. Seed only
  // previously verified outputs so source-only engine edits need no image rebuild.
  if (process.argv.includes('--reuse-tree-assets') && await exists(join(resources, 'bundle-manifest.json'))) {
    const previous = await readJson(join(resources, 'bundle-manifest.json'));
    for (const file of previous.files ?? []) {
      if (!file.path.startsWith('passive-tree/') || !treeVersions.includes(file.path.split('/')[1])) continue;
      const source = join(resources, file.path);
      const target = join(stageResources, file.path);
      ensureInside(join(resources, 'passive-tree'), source, 'cached tree source');
      ensureInside(join(stageResources, 'passive-tree'), target, 'cached tree target');
      if (await sha256File(source) !== file.sha256) throw new Error(`Cached tree hash differs: ${file.path}`);
      await mkdir(dirname(target), { recursive: true });
      await copyFile(source, target);
    }
  }
  await run(treePythonPath, [join(scriptDir, 'prepare-tree-assets.py'), '--pob-root', pobRoot, '--source-revision', identity.pob.commit, '--versions', ...treeVersions, '--output', join(stageResources, 'passive-tree')], { cwd: workspace });
  await verifyAttributionFiles(join(stageResources, 'passive-tree'));

  const afterIdentity = await desktopJson(sourceRoot, pythonPath, ['identity', '--root', sourceRoot]);
  compareStable(identity, afterIdentity, 'POK checkout identity changed while preparing the bundle; rerun the command.');
  validateCatalog(await readJson(catalogPath), afterIdentity);

  const files = (await Promise.all([
    join(stageResources, 'engine-identity.json'),
    ...await walk(join(stageResources, 'pob-catalog')),
    ...(await Promise.all(treeVersions.map(version => walk(join(stageResources, 'passive-tree', version))))).flat()
  ].map(path => fileEntry(stageResources, path)))).sort((a, b) => a.path.localeCompare(b.path));
  const catalogBytes = await readFile(catalogPath);
  const treeDigest = sha256(stable(files.filter(file => file.path.startsWith('passive-tree/'))));
  const manifest = {
    schemaVersion: 1,
    apiVersion: 1,
    bundleId: '',
    identity,
    pok: identity.pok,
    pob: identity.pob,
    kb: identity.kb,
    capabilities: identity.capabilities,
    runtime: { mode: 'checkout', path: 'checkout', manifest: 'engine-identity.json' },
    catalog: { path: 'pob-catalog/catalog.json', digest: sha256(catalogBytes), schemaVersion: 1, extractorVersion: '1' },
    trees: { path: 'passive-tree', sha256: treeDigest, defaultVersion: catalog.defaultTreeVersion, supportedVersions: catalog.supportedTreeVersions },
    files
  };
  manifest.bundleId = 'pokbundle-' + sha256(stable({ ...manifest, bundleId: undefined })).slice(0, 32);
  await json(join(stageResources, 'bundle-manifest.json'), manifest);

  const backup = await swapResources(stageResources);
  console.log(`Prepared checkout bundle ${manifest.bundleId}; POK ${identity.pok.version}; PoB ${identity.pob.commit}; catalog ${catalog.entries.length} entries; files ${files.length}; backup ${relative(workspace, backup)}`);
} catch (error) {
  await rm(stageRoot, { recursive: true, force: true }).catch(() => undefined);
  throw error;
}
