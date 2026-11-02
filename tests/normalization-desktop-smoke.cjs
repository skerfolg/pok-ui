// Synthetic native workspace QA. This does not certify engine calculation or AI success.
const { _electron: electron } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
require('tsx/cjs');
const { createDefaultState, createBuildDocument } = require('../src/shared/state.ts');
const { createBlankXml, parseBuild } = require('../src/shared/pob-document.ts');

const root = path.resolve(__dirname, '..');
const directory = path.join(root, '.local', 'normalization', 'desktop-' + Date.now());
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'resources/bundle-manifest.json')));
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'resources', manifest.catalog.path)));
const state = createDefaultState();
state.settings.pok = { mode: 'checkout', root: process.env.POK_SMOKE_ENGINE_ROOT || '', python: process.env.POK_SMOKE_PYTHON || '', luajit: '' };
if (!state.settings.pok.root || !state.settings.pok.python) throw new Error('Set isolated POK_SMOKE_ENGINE_ROOT and POK_SMOKE_PYTHON');
const xml = createBlankXml({ defaultTreeVersion: catalog.defaultTreeVersion, characterClass: catalog.classes[0] })
  .replace('</PathOfBuilding2>', '<SyntheticUnknown retained="true"/></PathOfBuilding2>');
const build = createBuildDocument('합성 정상화 검사', xml);
state.builds = [build]; state.activeBuildId = build.id;
fs.mkdirSync(path.join(directory, 'workspace'), { recursive: true });
fs.writeFileSync(path.join(directory, 'workspace/workspace.v1.json'), JSON.stringify(state));
const env = { ...process.env, POK_UI_DATA_DIR: directory, PYTHONDONTWRITEBYTECODE: '1' };
delete env.ELECTRON_RUN_AS_NODE; delete env.POK_RENDERER_URL;
const report = { at: new Date().toISOString(), passed: [], skipped: ['actual model inference', 'successful engine calculation', 'portable runtime', 'PoB GUI export/edit'], offlineDisplayBundle: manifest.bundleId };
let application, page;
async function launch() {
  application = await electron.launch({ executablePath: process.env.POK_SMOKE_ELECTRON_EXECUTABLE || require('electron'), args: [root], cwd: directory, env, timeout: 90000 });
  page = await application.firstWindow(); page.setDefaultTimeout(30000);
  await page.locator('.app-shell').waitFor();
}
const saved = () => page.waitForFunction(() => document.querySelector('.statusbar [role=status]')?.textContent === '저장됨');
const current = () => page.evaluate(async () => { const s = await window.pok.loadState(); return s.builds.find(b => b.id === s.activeBuildId); });
(async () => {
  await launch();
  report.electron = await application.evaluate(() => process.versions.electron);
  report.native = await application.evaluate(({app})=>({appPath:app.getAppPath(),packaged:app.isPackaged}));
  report.bridge = await page.evaluate(()=>({platform:window.pok.platform,url:location.href}));
  // Poll RPC from Node; the installed waitForFunction implementation returns an
  // async predicate's Promise before its boolean has resolved.
  let connection;
  const deadline=Date.now()+90000;
  do {
    connection=await page.evaluate(async()=>await window.pok.getPokConnection());
    if(!connection.connecting&&(connection.compatibility||connection.error))break;
    await page.waitForTimeout(250);
  }while(Date.now()<deadline);
  report.connection = { connected: connection.connected, compatibility: connection.compatibility, error: connection.error, tools: connection.tools };
  if(connection.connected===false&&connection.compatibility==='incompatible'&&/compute_pob_xml, render_pob_item/.test(connection.error))
    report.passed.push('automatic startup identifies actual latest-engine desktop contract gaps');
  else throw new Error('Unexpected connection state: '+JSON.stringify(connection));
  await page.getByRole('button', { name: '설정', exact: true }).click();
  await page.getByLabel('캐릭터 레벨', { exact: true }).fill('50'); await saved();
  const changed = await current();
  assert.equal(parseBuild(changed.xml).level, 50); assert.equal(changed.revision, 1);
  assert.equal(changed.originalXml, xml); assert.match(changed.xml, /SyntheticUnknown/);
  assert.equal(changed.calculation, undefined);
  report.passed.push('offline UI editing preserves original, unknown XML, revision and unmeasured state');
  for (const [width, height] of [[1920,1080],[1024,768]]) {
    await application.evaluate(({ BrowserWindow }, size) => BrowserWindow.getAllWindows()[0].setContentSize(...size), [width,height]);
    for (const view of ['장비','스킬','설정','pok 설정']) {
      await page.getByRole('button', { name: view, exact: true }).click();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.screenshot({ path: path.join(directory, `${view}-${width}.png`) });
    }
  }
  report.passed.push('1920x1080 and 1024x768 screens have no horizontal document overflow');
  await application.close(); application = undefined;
  await launch(); await saved();
  const restored = await current();
  assert.equal(restored.xml, changed.xml); assert.equal(restored.originalXml, xml); assert.equal(restored.revision, 1);
  report.passed.push('native process restart restores the same edited workspace');
  await page.getByRole('button', { name: '되돌리기', exact: true }).click(); await saved();
  const undone = await current(); assert.equal(undone.xml, xml); assert.equal(undone.revision, 2);
  report.passed.push('undo after restart restores exact XML and advances revision');
})().catch(error => { report.error = error.stack; process.exitCode = 1; }).finally(async () => {
  if (application) await application.close();
  fs.writeFileSync(path.join(directory, 'result.json'), JSON.stringify(report, null, 2));
  console.log(directory); if (report.error) console.error(report.error);
});
