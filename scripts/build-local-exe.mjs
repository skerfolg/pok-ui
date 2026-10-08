import { access, copyFile, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { constants as fsConstants, existsSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);

const LAUNCHER_ID = 'dev.pok.local-test-launcher.v1';
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDirectory, '..');
const releaseDirectory = resolve(repoRoot, 'release', 'local-test');
const localDirectory = resolve(repoRoot, '.local', 'local-test-user-data');
const workspaceDirectory = resolve(localDirectory, 'workspace');
const outputExe = resolve(releaseDirectory, 'POK-Local-Test.exe');
const generatedSource = resolve(releaseDirectory, 'POK-Local-Test.generated.cs');
const templatePath = resolve(scriptDirectory, 'local-test-launcher.cs');
const defaultElectronExe = resolve(repoRoot, 'node_modules', 'electron', 'dist', 'electron.exe');
const defaultCsc64 = resolve(process.env.SystemRoot || 'C:\\Windows', 'Microsoft.NET', 'Framework64', 'v4.0.30319', 'csc.exe');
const defaultCsc32 = resolve(process.env.SystemRoot || 'C:\\Windows', 'Microsoft.NET', 'Framework', 'v4.0.30319', 'csc.exe');

function usage() {
  return [
    'Usage: node scripts/build-local-exe.mjs [options]',
    '',
    'Builds release/local-test/POK-Local-Test.exe for this checkout only.',
    '',
    'Options:',
    '  --electron <path>  Electron executable to launch (default: node_modules/electron/dist/electron.exe)',
    '  --csc <path>       .NET Framework C# compiler path',
    '  --pok-root <path>  Seed checkout runtime settings in the local test workspace when absent',
    '  --python <path>    Seed Python executable path with --pok-root',
    '  --luajit <path>    Seed LuaJIT executable path with --pok-root',
    '  --help            Show this help',
  ].join('\n');
}

function parseArgs(argv) {
  const options = {
    electron: defaultElectronExe,
    csc: existsSync(defaultCsc64) ? defaultCsc64 : defaultCsc32,
    pokRoot: '',
    python: '',
    luajit: '',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') {
      console.log(usage());
      process.exit(0);
    }
    if (!['--electron', '--csc', '--pok-root', '--python', '--luajit'].includes(arg)) {
      throw new Error(`Unknown option: ${arg}\n\n${usage()}`);
    }
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
    index += 1;
    if (arg === '--electron') options.electron = resolve(value);
    if (arg === '--csc') options.csc = resolve(value);
    if (arg === '--pok-root') options.pokRoot = resolve(value);
    if (arg === '--python') options.python = resolve(value);
    if (arg === '--luajit') options.luajit = resolve(value);
  }

  return options;
}

async function assertPathExists(path, label, kind = 'file') {
  try {
    const info = await stat(path);
    if (kind === 'file' && !info.isFile()) throw new Error(`${label} is not a file: ${path}`);
    if (kind === 'directory' && !info.isDirectory()) throw new Error(`${label} is not a directory: ${path}`);
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error(`${label} was not found: ${path}`);
    throw error;
  }
}

function assertInside(parent, child, label) {
  const childRelative = relative(parent, child);
  if (childRelative === '' || childRelative.startsWith('..') || isAbsolute(childRelative)) {
    throw new Error(`${label} must stay inside ${parent}: ${child}`);
  }
}

function csharpString(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function defaultState({ pokRoot, python, luajit }) {
  return {
    schemaVersion: 1,
    chats: [],
    builds: [],
    settings: {
      theme: 'system',
      density: 'compact',
      pok: {
        mode: pokRoot ? 'checkout' : 'bundled',
        root: pokRoot,
        python,
        luajit,
      },
      agent: { provider: 'codex', executable: 'codex', model: '' },
      trade: { league: '' },
    },
  };
}

async function seedWorkspace(options) {
  await mkdir(workspaceDirectory, { recursive: true });
  const statePath = join(workspaceDirectory, 'workspace.v1.json');
  try {
    await access(statePath, fsConstants.F_OK);
    return { statePath, seeded: false };
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  if (options.pokRoot) await assertPathExists(options.pokRoot, '--pok-root', 'directory');
  if (options.python) await assertPathExists(options.python, '--python');
  if (options.luajit) await assertPathExists(options.luajit, '--luajit');

  const state = defaultState(options);
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  return { statePath, seeded: true };
}

async function ensureExistingOutputIsOurs() {
  try {
    await access(outputExe, fsConstants.F_OK);
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }

  try {
    const { stdout } = await execFile(outputExe, ['--launcher-id'], { windowsHide: true, timeout: 5000 });
    if (stdout.trim() === LAUNCHER_ID) return;
  } catch {
    // Fall through to the safety error below.
  }
  throw new Error(`Refusing to overwrite an existing file that is not a POK local-test launcher: ${outputExe}`);
}

async function build() {
  if (process.platform !== 'win32') throw new Error('The local-test executable builder is Windows-only.');
  const options = parseArgs(process.argv.slice(2));

  assertInside(repoRoot, releaseDirectory, 'release directory');
  assertInside(repoRoot, localDirectory, 'local test profile directory');
  assertInside(releaseDirectory, outputExe, 'launcher output');
  assertInside(releaseDirectory, generatedSource, 'generated source');

  await Promise.all([
    assertPathExists(templatePath, 'launcher template'),
    assertPathExists(options.electron, 'Electron executable'),
    assertPathExists(options.csc, 'C# compiler'),
    assertPathExists(resolve(repoRoot, 'package.json'), 'package.json'),
    assertPathExists(resolve(repoRoot, 'dist', 'main', 'index.cjs'), 'built main process'),
    assertPathExists(resolve(repoRoot, 'dist', 'preload', 'index.cjs'), 'built preload'),
    assertPathExists(resolve(repoRoot, 'dist', 'renderer', 'index.html'), 'built renderer'),
  ]);

  await mkdir(releaseDirectory, { recursive: true });
  const seed = await seedWorkspace(options);
  await ensureExistingOutputIsOurs();

  const template = await readFile(templatePath, 'utf8');
  const source = template
    .replaceAll('"__LAUNCHER_ID__"', csharpString(LAUNCHER_ID))
    .replaceAll('"__POK_ROOT__"', csharpString(repoRoot))
    .replaceAll('"__ELECTRON_EXE__"', csharpString(options.electron))
    .replaceAll('"__USER_DATA_DIR__"', csharpString(localDirectory));
  await writeFile(generatedSource, source, { encoding: 'utf8', mode: 0o600 });

  const temporaryExe = resolve(releaseDirectory, `POK-Local-Test.${process.pid}.tmp.exe`);
  assertInside(releaseDirectory, temporaryExe, 'temporary launcher output');
  await rm(temporaryExe, { force: true });

  await execFile(options.csc, [
    '/nologo',
    '/target:winexe',
    '/optimize+',
    '/platform:anycpu',
    '/reference:System.Windows.Forms.dll',
    `/out:${temporaryExe}`,
    generatedSource,
  ], { cwd: repoRoot, windowsHide: true });

  const { stdout } = await execFile(temporaryExe, ['--launcher-id'], { windowsHide: true, timeout: 5000 });
  if (stdout.trim() !== LAUNCHER_ID) throw new Error('Compiled launcher identity check failed.');

  await copyFile(temporaryExe, outputExe);
  await rm(temporaryExe, { force: true });

  await execFile(outputExe, ['--check'], { windowsHide: true, timeout: 10000 });
  console.log(`Built ${outputExe}`);
  console.log(`Using Electron ${options.electron}`);
  console.log(`Local test profile ${localDirectory}`);
  console.log(seed.seeded ? `Seeded ${seed.statePath}` : `Preserved existing ${seed.statePath}`);
}

build().catch(error => {
  console.error(error.message || error);
  process.exit(1);
});
