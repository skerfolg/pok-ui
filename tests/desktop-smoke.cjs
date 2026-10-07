// Run after npm run build. Supply a read-only PoB XML via POK_SMOKE_XML or argv[2].
// Fixture needs an equipped Weapon 1; native state is isolated under .local/desktop-qa.
// POK_SMOKE_EXECUTABLE can target a packaged app instead of the project's Electron binary.
const { _electron: electron } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
require('tsx/cjs');
const { parseBuild } = require('../src/shared/pob-document.ts');

const root = path.resolve(__dirname, '..');
const artifacts = path.join(root, '.local');
const dataDirectory = path.join(artifacts, 'desktop-qa');
const storePath = path.join(dataDirectory, 'workspace', 'workspace.v1.json');
const sourcePath = process.env.POK_SMOKE_XML || process.argv[2];
if (!sourcePath) throw new Error('Set POK_SMOKE_XML or pass a read-only PoB XML path as the first argument.');
const originalBytes = fs.readFileSync(sourcePath);
const expected = parseBuild(originalBytes.toString('utf8'));
const sourceDigest = createHash('sha256').update(originalBytes).digest('hex');
const env = { ...process.env, POK_UI_DATA_DIR: dataDirectory };
delete env.ELECTRON_RUN_AS_NODE;
delete env.POK_RENDERER_URL;
const errors = [], failures = [], passed = [];
let application, page;

async function launch() {
  const packagedExecutable = process.env.POK_SMOKE_EXECUTABLE;
  application = await electron.launch({ executablePath: packagedExecutable || require('electron'), args: packagedExecutable ? [] : ['.'], cwd: root, env, timeout: 60000 });
  page = await application.firstWindow({ timeout: 60000 });
  page.setDefaultTimeout(15000);
  page.on('pageerror', error => errors.push(error.message));
  await page.locator('.app-shell').waitFor();
  await page.waitForFunction(() => document.querySelector('.statusbar [role=status]')?.textContent === '저장됨');
  await page.emulateMedia({ colorScheme: 'dark' });
}
const state = () => page.evaluate(() => window.pok.loadState());
const saved = () => page.waitForFunction(() => document.querySelector('.statusbar [role=status]')?.textContent === '저장됨');
const current = state => state.builds.find(build => build.id === state.activeBuildId);
async function check(name, operation) {
  try { await operation(); passed.push(name); console.log('PASS: ' + name); }
  catch (error) { failures.push(name + ': ' + error.message); console.error('FAIL: ' + name + ': ' + error.message); }
}

(async () => {
  fs.mkdirSync(artifacts, { recursive: true });
  await launch();
  await check('production renderer, sandboxed preload and dedicated user data', async () => {
    assert(page.url().startsWith('file:///'));
    const isolation = await page.evaluate(() => ({
      require: typeof require, process: typeof process, Buffer: typeof Buffer,
      api: typeof window.pok, loadState: typeof window.pok?.loadState,
      frozen: Object.isFrozen(window.pok), arbitraryExec: typeof window.pok?.exec,
    }));
    assert.deepEqual(isolation, { require: 'undefined', process: 'undefined', Buffer: 'undefined', api: 'object', loadState: 'function', frozen: true, arbitraryExec: 'undefined' });
    const main = await application.evaluate(({ app, BrowserWindow }) => {
      const preferences = BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences();
      return { data: app.getPath('userData'), contextIsolation: preferences.contextIsolation, sandbox: preferences.sandbox, nodeIntegration: preferences.nodeIntegration };
    });
    assert.equal(path.resolve(main.data), path.resolve(dataDirectory));
    assert.equal(main.contextIsolation, true);
    assert.equal(main.sandbox, true);
    assert.equal(main.nodeIntegration, false);
  });
  await check('native dialog import traverses main IPC and reads original XML', async () => {
    await application.evaluate(({ dialog }, source) => {
      globalThis.__pokQaOriginalOpenDialog = dialog.showOpenDialog;
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [source] });
    }, sourcePath);
    await page.locator('.top-actions').getByRole('button', { name: '가져오기', exact: true }).click();
    await page.getByRole('heading', { name: '장비', exact: true }).waitFor();
    await page.waitForFunction(count => document.querySelectorAll('.library-row').length === count, expected.items.length);
    await saved();
    const build = current(await state());
    assert.equal(build.originalXml, originalBytes.toString('utf8'));
    assert.equal(build.xml, build.originalXml);
    assert.equal(build.sourceName, path.basename(sourcePath));
    assert.deepEqual(parseBuild(build.xml), expected);
    await application.evaluate(({ dialog }) => { dialog.showOpenDialog = globalThis.__pokQaOriginalOpenDialog; delete globalThis.__pokQaOriginalOpenDialog; });
  });
  await check('desktop item apply and undo use durable native state', async () => {
    const before = current(await state());
    await page.locator('.raw-editor summary').click();
    const input = page.getByRole('textbox', { name: '아이템 원문', exact: true });
    const text = await input.inputValue();
    await input.fill(text + '\nDesktop QA temporary text');
    await page.locator('.raw-editor').getByRole('button', { name: '적용', exact: true }).click();
    await saved();
    const edited = current(await state());
    assert(edited.xml.includes('Desktop QA temporary text'));
    assert.equal(edited.revision, before.revision + 1);
    assert.equal(edited.originalXml, before.originalXml);
    assert.equal(current(JSON.parse(fs.readFileSync(storePath, 'utf8'))).xml, edited.xml);
    assert.equal(await page.getByRole('combobox', { name: '능력치 출처' }).inputValue(), 'current');
    assert((await page.locator('.stat-row strong').allTextContents()).every(value => value === '—'));
    await page.locator('.top-actions').getByRole('button', { name: '되돌리기', exact: true }).click();
    await saved();
    const undone = current(await state());
    assert.equal(undone.xml, before.xml);
    assert.equal(undone.originalXml, before.originalXml);
    assert.equal(current(JSON.parse(fs.readFileSync(storePath, 'utf8'))).xml, before.xml);
  });
  const beforeRestart = await state();
  await page.getByRole('combobox', { name: '능력치 출처' }).selectOption('original');
  await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(1440, 900));
  await page.locator('.app-shell').evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({ path: path.join(artifacts, 'desktop-ui.png') });
  await application.close(); application = undefined;
  await launch();
  await check('Electron process restart restores imported document and undo revision', async () => {
    assert.deepEqual(await state(), beforeRestart);
    assert.equal(await page.locator('.library-row').count(), expected.items.length);
    assert.equal(current(await state()).revision, 2);
    assert.equal(current(await state()).originalXml, originalBytes.toString('utf8'));
    assert.equal(current(JSON.parse(fs.readFileSync(storePath, 'utf8'))).xml, current(beforeRestart).xml);
  });
  assert.deepEqual(errors, []);
  assert.equal(createHash('sha256').update(fs.readFileSync(sourcePath)).digest('hex'), sourceDigest);
  fs.writeFileSync(path.join(artifacts, 'desktop-smoke-result.json'), JSON.stringify({ passed, failures, errors, sourceHashUnchanged: true, dataDirectory }, null, 2));
  if (failures.length) throw new Error(failures.join('\n'));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (application) await application.close(); });
