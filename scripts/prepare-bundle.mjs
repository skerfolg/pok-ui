import { sha256File } from './file-integrity.mjs';
import { ensureInside, performAtomicSwap } from './bundle-swap.mjs';
import { copyFile, cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const workspace = resolve('.');
const scriptDir = dirname(fileURLToPath(import.meta.url));
const resources = resolve('resources');
const lock = resolve('pok-runtime.lock.json');
const localRoot = resolve('.local', 'bundle-prepare');
const backupsRoot = resolve('.local', 'bundle-backups');

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const runtimeSource = arg('--runtime');
const treePython = arg('--tree-python');
const writeLock = process.argv.includes('--write-lock');
if (!runtimeSource || !treePython) throw new Error('Usage: node scripts/prepare-bundle.mjs --runtime <artifact> --tree-python <python> [--write-lock]');

function assertRelativePath(value, name) {
  if (typeof value !== 'string' || isAbsolute(value) || value.includes('\0') || value.split(/[\\/]/).some(part => !part || part === '.' || part === '..')) {
    throw new Error(`${name} must be a relative path inside the runtime.`);
  }
}

async function exists(path) {
  return Boolean(await stat(path).catch(() => undefined));
}

async function sha256(path) { return sha256File(path); }

async function readRuntimeManifest(runtimeRoot) {
  const manifest = JSON.parse(await readFile(join(runtimeRoot, 'resources', 'runtime-manifest.json'), 'utf8'));
  if (manifest.format_version !== 1 || typeof manifest.pob_commit !== 'string' || !Array.isArray(manifest.entrypoint) || !manifest.entrypoint.length ||
    !manifest.sha256 || typeof manifest.sha256 !== 'object') throw new Error('Unsupported POK runtime manifest.');
  assertRelativePath(manifest.entrypoint[0], 'entrypoint[0]');
  await stat(join(runtimeRoot, manifest.entrypoint[0]));
  for (const [file, digest] of Object.entries(manifest.sha256)) {
    assertRelativePath(file, `sha256.${file}`);
    if (!/^[0-9a-f]{64}$/i.test(String(digest))) throw new Error(`Invalid runtime digest for ${file}.`);
    if (await sha256(join(runtimeRoot, file)) !== String(digest).toLowerCase()) throw new Error(`Runtime file digest differs: ${file}`);
  }
  return manifest;
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

function exportCommand(manifest, runtimeRoot, outputPath) {
  const entrypoint = [...manifest.entrypoint];
  const serveIndex = entrypoint.lastIndexOf('serve');
  if (serveIndex < 0) throw new Error('Runtime entrypoint must contain serve so it can be replaced with export-ui.');
  entrypoint[serveIndex] = 'export-ui';
  return { command: join(runtimeRoot, entrypoint[0]), args: [...entrypoint.slice(1), '--output', outputPath] };
}

async function resolvePobRoot(manifest, runtimeRoot) {
  const candidates = [
    manifest.pob_root, manifest.pobRoot, manifest.pob?.root, manifest.paths?.pob_root, manifest.paths?.pobRoot,
    manifest.resources?.pob_root, manifest.resources?.pobRoot, 'pob', 'resources/pob', 'PathOfBuilding-PoE2'
  ].filter(Boolean);
  for (const candidate of candidates) {
    assertRelativePath(candidate, 'pob_root');
    const root = join(runtimeRoot, candidate);
    if (await exists(join(root, 'src', 'TreeData')) && await exists(join(root, 'LICENSE.md'))) return root;
  }
  throw new Error('Runtime manifest does not identify the staged raw PoB root.');
}

async function ensureGitkeep(root) {
  for (const folder of ['pok-runtime', 'pob-catalog', 'passive-tree']) {
    await mkdir(join(root, 'resources', folder), { recursive: true });
    await writeFile(join(root, 'resources', folder, '.gitkeep'), '', { flag: 'a' });
  }
}

async function swapPreparedBundle(stageRoot) {
  return performAtomicSwap({
    workspace,
    backupsRoot,
    entries: [
      { label: 'resources', target: resources, staged: join(stageRoot, 'resources'), backupName: 'resources' },
      { label: 'lock', target: lock, staged: join(stageRoot, 'pok-runtime.lock.json'), backupName: 'pok-runtime.lock.json' }
    ]
  });
}

const runtimeArtifact = resolve(runtimeSource);
const treePythonPath = resolve(treePython);
if (!await exists(runtimeArtifact)) throw new Error(`Runtime artifact does not exist: ${runtimeArtifact}`);
if (!await exists(treePythonPath)) throw new Error(`Tree converter Python does not exist: ${treePythonPath}`);
await mkdir(localRoot, { recursive: true });
await mkdir(backupsRoot, { recursive: true });
const stageRoot = join(localRoot, 'stage-' + randomUUID());
ensureInside(workspace, stageRoot, 'stageRoot');
await mkdir(join(stageRoot, 'resources'), { recursive: true });

try {
  await ensureGitkeep(stageRoot);
  await cp(runtimeArtifact, join(stageRoot, 'resources', 'pok-runtime'), { recursive: true, errorOnExist: false, force: true });
  const runtimeRoot = join(stageRoot, 'resources', 'pok-runtime');
  const manifest = await readRuntimeManifest(runtimeRoot);
  const catalogOutput = join(stageRoot, 'resources', 'pob-catalog', 'catalog.json');
  const exporter = exportCommand(manifest, runtimeRoot, catalogOutput);
  await mkdir(dirname(catalogOutput), { recursive: true });
  await run(exporter.command, exporter.args, { cwd: runtimeRoot });
  const pobRoot = await resolvePobRoot(manifest, runtimeRoot);
  const treeVersions = manifest.ui_tree_versions ?? manifest.tree_versions ?? ['all'];
  if (!Array.isArray(treeVersions) || !treeVersions.length || !treeVersions.every(value => typeof value === 'string')) throw new Error('Tree version list is invalid.');
  await run(treePythonPath, [join(scriptDir, 'prepare-tree-assets.py'), '--pob-root', pobRoot, '--source-revision', manifest.pob_commit, '--versions', ...treeVersions, '--output', join(stageRoot, 'resources', 'passive-tree')], { cwd: workspace });
  if (!writeLock) await copyFile(lock, join(stageRoot, 'pok-runtime.lock.json'));
  await run(process.execPath, [join(scriptDir, 'prepare-data-bundle.mjs'), ...(writeLock ? ['--write-lock'] : [])], { cwd: stageRoot });
  await run(process.execPath, [join(scriptDir, 'verify-data-bundle.mjs')], { cwd: stageRoot });
  const backup = await swapPreparedBundle(stageRoot);
  console.log(`Prepared bundle from POK ${manifest.version}; PoB ${manifest.pob_commit}; backup ${relative(workspace, backup)}`);
} catch (error) {
  await rm(stageRoot, { recursive: true, force: true }).catch(() => undefined);
  throw error;
}
