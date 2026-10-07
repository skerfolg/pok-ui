// Production Electron renderer smoke. POK_SMOKE_XML supplies a read-only user file.
// Personal fixtures and screenshots stay in ignored .local/tree-view-qa.
const { _electron: electron } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash, randomUUID } = require('node:crypto');
const { performance } = require('node:perf_hooks');
require('tsx/cjs');
const { parseBuild } = require('../src/shared/pob-document.ts');
const { createDefaultState } = require('../src/shared/state.ts');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');
const root = path.resolve(__dirname, '..'), artifacts = path.join(root, '.local');
const dataDirectory = path.join(artifacts, 'tree-view-qa', randomUUID());
const sourcePath = process.env.POK_SMOKE_XML || process.argv[2];
if (!sourcePath) throw new Error('Provide POK_SMOKE_XML or a read-only XML path argument.');
const original = fs.readFileSync(sourcePath), expected = parseBuild(original.toString('utf8'));
const spec = expected.trees.find(t => t.active) || expected.trees[0];
const tree = JSON.parse(fs.readFileSync(path.join(root, 'resources', 'passive-tree', spec.version, 'tree.json'), 'utf8'));
const assigned = new Set(spec.nodes), seen = new Set(), expectedEdges = [];
for (const n of Object.values(tree.nodes)) for (const connection of n?.connections || []) {
  const other = tree.nodes[connection.id];
  if (!other || n.skill === other.skill || n.isOnlyImage || other.isOnlyImage || n.classesStart || other.classesStart || n.ascendancyName !== other.ascendancyName) continue;
  const key = [n.skill, other.skill].sort((a, b) => a - b).join(':');
  if (!seen.has(key)) { seen.add(key); expectedEdges.push([n.skill, other.skill]); }
}
const expectedCounts = { nodes: Object.keys(tree.nodes).length, edges: expectedEdges.length, allocatedEdges: expectedEdges.filter(([a, b]) => assigned.has(a) && assigned.has(b)).length };
const selectedId = Number(process.env.POK_SMOKE_NODE_ID || 20024);
assert(tree.nodes[selectedId] && !tree.nodes[selectedId].classesStart && !tree.nodes[selectedId].isAscendancyStart);
const hash = value => createHash('sha256').update(value).digest('hex');
const sourceHash = hash(original);
fs.mkdirSync(path.join(dataDirectory, 'workspace'), { recursive: true });
const initial = createDefaultState(); initial.settings.theme = 'dark';
// Tree loading must work while the calculation engine is unavailable.
initial.settings.pok = { mode: 'checkout', root: path.join(dataDirectory, 'offline-engine'), python: 'pok-engine-not-installed-for-tree-qa', luajit: '' };
fs.writeFileSync(path.join(dataDirectory, 'workspace', 'workspace.v1.json'), JSON.stringify(initial));
const env = { ...process.env, POK_UI_DATA_DIR: dataDirectory };
delete env.ELECTRON_RUN_AS_NODE; delete env.POK_RENDERER_URL;
const errors = [], failures = [], passed = [], metrics = {};
let application, page;
const state = () => page.evaluate(() => window.pok.loadState());
const current = state => state.builds.find(b => b.id === state.activeBuildId);
const nav = name => page.getByRole('navigation', { name: '주요 메뉴' }).getByRole('button', { name, exact: true }).click();
const saved = () => page.waitForFunction(() => document.querySelector('.statusbar [role=status]')?.textContent === '저장됨');
const canvas = () => page.getByRole('img', { name: 'PoB 패시브 트리 지도', exact: true });
async function settledImages() {
  await page.waitForFunction(() => { const c = document.querySelector('.pob-tree canvas'); return c && c.clientWidth > 200 && Number(c.dataset.requiredImages) > 0 && c.dataset.readyImages === c.dataset.requiredImages && c.dataset.failedImages === '0'; }, undefined, { timeout: 30000 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
function nonTreeXml(xml) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  for (const child of Array.from(doc.documentElement.childNodes)) if (child.nodeType === 1 && child.nodeName === 'Tree') doc.documentElement.removeChild(child);
  return new XMLSerializer().serializeToString(doc);
}
async function check(name, operation) {
  try { await operation(); passed.push(name); console.log('PASS: ' + name); }
  catch (error) { failures.push(name + ': ' + error.message); console.error('FAIL: ' + name + ': ' + error.message); }
}

(async () => {
  const launchTime = performance.now();
  const packaged = process.env.POK_SMOKE_EXECUTABLE;
  application = await electron.launch({ executablePath: packaged || process.env.POK_SMOKE_ELECTRON || require('electron'), args: packaged ? [] : [root], cwd: root, env, timeout: 60000 });
  page = await application.firstWindow({ timeout: 60000 });
  page.setDefaultTimeout(15000); page.on('pageerror', error => errors.push(error.message));
  await page.locator('.app-shell').waitFor();
  await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(1920, 1080));
  await check('native import leaves source XML unchanged', async () => {
    await application.evaluate(({ dialog }, source) => {
      globalThis.__treeOriginalDialog = dialog.showOpenDialog;
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [source] });
    }, sourcePath);
    await page.locator('.top-actions').getByRole('button', { name: '가져오기', exact: true }).click();
    await page.getByRole('heading', { name: '장비', exact: true }).waitFor(); await saved();
    const imported = current(await state());
    assert.equal(imported.originalXml, original.toString('utf8'));
    assert.equal(imported.xml, imported.originalXml);
    await application.evaluate(({ dialog }) => { dialog.showOpenDialog = globalThis.__treeOriginalDialog; delete globalThis.__treeOriginalDialog; });
  });
  // Test-only instrumentation wraps existing Electron invoke handlers without changing behavior.
  const instrumented = await application.evaluate(({ ipcMain }) => {
    const handlers = ipcMain._invokeHandlers;
    if (!(handlers instanceof Map)) return false;
    globalThis.__treeIpcCounts = {};
    for (const channel of ['pok:load-passive-tree', 'pok:call']) {
      const original = handlers.get(channel); if (!original) continue;
      handlers.set(channel, (...args) => { globalThis.__treeIpcCounts[channel] = (globalThis.__treeIpcCounts[channel] || 0) + 1; return original(...args); });
    }
    return true;
  });
  const navTime = performance.now();
  await nav('패시브트리');
  await check('first navigation loads full graph and image assets without MCP queries', async () => {
    await canvas().waitFor();
    await page.waitForFunction(expected => { const c = document.querySelector('.pob-tree canvas'); return c && Number(c.dataset.nodes) === expected.nodes && Number(c.dataset.edges) === expected.edges && Number(c.dataset.allocatedEdges) === expected.allocatedEdges; }, expectedCounts);
    metrics.geometryReadyMs = performance.now() - navTime;
    await settledImages(); metrics.imagesReadyMs = performance.now() - navTime; metrics.launchToTreeReadyMs = performance.now() - launchTime;
    metrics.full = await canvas().evaluate(c => ({ ...c.dataset, width: c.clientWidth, height: c.clientHeight }));
    assert(expectedCounts.nodes === 4914 && expectedCounts.edges === 5149, 'The prepared 0_5 source tree must remain complete.');
    const ipcCounts = await application.evaluate(() => globalThis.__treeIpcCounts);
    if (instrumented) { assert.equal(ipcCounts['pok:load-passive-tree'], 1); assert.equal(ipcCounts['pok:call'] || 0, 0); }
    metrics.ipcAfterFirst = ipcCounts;
    assert.equal(await page.locator('.connection-dot.online').count(), 0);
    await page.screenshot({ path: path.join(artifacts, 'tree-full.png') });
  });
  await check('allocated focus retains the surrounding full graph', async () => {
    const previous = Number(await canvas().getAttribute('data-scale'));
    await page.getByRole('button', { name: '할당 위치', exact: true }).click(); await settledImages();
    assert(Number(await canvas().getAttribute('data-scale')) > previous);
    assert.equal(Number(await canvas().getAttribute('data-nodes')), expectedCounts.nodes);
    assert.equal(Number(await canvas().getAttribute('data-allocated-edges')), expectedCounts.allocatedEdges);
    await page.screenshot({ path: path.join(artifacts, 'tree-assigned.png') });
  });
  await check('local ID search focuses actual node sprites', async () => {
    await page.getByRole('searchbox', { name: '패시브 검색' }).fill(String(selectedId));
    await page.getByLabel('패시브 검색 결과').getByRole('button').filter({ hasText: `#${selectedId}` }).click();
    await settledImages();
    assert((await page.locator('.tree-selection').textContent()).includes(`#${selectedId}`));
    assert(Number(await canvas().getAttribute('data-scale')) >= 0.55);
    metrics.close = await canvas().evaluate(c => ({ ...c.dataset }));
    await page.screenshot({ path: path.join(artifacts, 'tree-close.png') });
  });
  await check('node toggle edits only the tree and undo restores the exact document', async () => {
    const before = current(await state()), beforeParsed = parseBuild(before.xml);
    const beforeSpec = beforeParsed.trees.find(t => t.active) || beforeParsed.trees[0];
    const wasAllocated = beforeSpec.nodes.includes(selectedId);
    await page.locator('.tree-selection').getByRole('button', { name: wasAllocated ? '할당 해제' : '할당', exact: true }).click(); await saved();
    const changed = current(await state()), changedParsed = parseBuild(changed.xml);
    assert.equal(changed.revision, before.revision + 1);
    assert.equal((changedParsed.trees.find(t => t.active) || changedParsed.trees[0]).nodes.includes(selectedId), !wasAllocated);
    assert.equal(nonTreeXml(changed.xml), nonTreeXml(before.xml)); assert.equal(changed.originalXml, before.originalXml);
    await page.locator('.top-actions').getByRole('button', { name: '되돌리기', exact: true }).click(); await saved();
    assert.equal(current(await state()).xml, before.xml);
  });
  await check('wheel zoom and pointer pan update the drawn map', async () => {
    const box = await canvas().boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    const previous = Number(await canvas().getAttribute('data-scale'));
    await page.mouse.wheel(0, -240);
    await page.waitForFunction(scale => Number(document.querySelector('.pob-tree canvas')?.dataset.scale) > scale, previous);
    await page.mouse.move(box.x + 10, box.y + 10); await settledImages();
    const before = hash(await canvas().screenshot()), scale = await canvas().getAttribute('data-scale');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 150, box.y + box.height / 2 + 75, { steps: 8 }); await page.mouse.up();
    await page.mouse.move(box.x + 10, box.y + 10); await settledImages();
    assert.equal(await canvas().getAttribute('data-scale'), scale);
    assert.notEqual(hash(await canvas().screenshot()), before);
  });
  await check('return navigation reuses decoded textures and one tree IPC request', async () => {
    await nav('장비'); const start = performance.now(); await nav('패시브트리'); await settledImages();
    metrics.warmNavigationMs = performance.now() - start;
    const ipcCounts = await application.evaluate(() => globalThis.__treeIpcCounts);
    if (instrumented) { assert.equal(ipcCounts['pok:load-passive-tree'], 1); assert.equal(ipcCounts['pok:call'] || 0, 0); }
    metrics.ipcAfterReturn = ipcCounts;
  });
  await check('1920 and 1024 layouts keep the map and every stat row on screen', async () => {
    metrics.layouts = [];
    for (const [width, height] of [[1920, 1080], [1024, 768]]) {
      await application.evaluate(({ BrowserWindow }, dimensions) => BrowserWindow.getAllWindows()[0].setContentSize(...dimensions), [width, height]);
      await page.waitForFunction(dimensions => window.innerWidth === dimensions[0] && window.innerHeight === dimensions[1], [width, height]);
      await page.getByRole('button', { name: '전체 트리', exact: true }).click(); await settledImages();
      const layout = await page.evaluate(() => {
        const c = document.querySelector('.pob-tree canvas').getBoundingClientRect();
        const rail = document.querySelector('.stats-rail').getBoundingClientRect();
        const rows = [...document.querySelectorAll('.stat-row')].map(row => row.getBoundingClientRect());
        return { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight, canvas: { x: c.x, y: c.y, width: c.width, height: c.height, right: c.right, bottom: c.bottom }, rail: { x: rail.x, right: rail.right, bottom: rail.bottom }, rowsOnScreen: rows.every(row => row.top >= 0 && row.bottom <= innerHeight), rowCount: rows.length };
      });
      assert.equal(layout.width, width); assert.equal(layout.height, height);
      assert(layout.scrollWidth <= width && layout.scrollHeight <= height);
      assert(layout.canvas.width > 400 && layout.canvas.height > 400);
      assert(layout.canvas.right <= layout.rail.x && layout.rail.right <= width && layout.rowsOnScreen);
      assert.equal(layout.rowCount, 26); metrics.layouts.push(layout);
      await page.screenshot({ path: path.join(artifacts, `tree-${width}.png`) });
    }
  });
  assert.deepEqual(errors, []);
  assert.equal(hash(fs.readFileSync(sourcePath)), sourceHash);
  metrics.sourceHashUnchanged = true; metrics.ipcInstrumented = instrumented;
  if (failures.length) throw new Error(failures.join('\n'));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  fs.mkdirSync(artifacts, { recursive: true });
  fs.writeFileSync(path.join(artifacts, 'tree-view-smoke-result.json'), JSON.stringify({ passed, failures, errors, metrics, dataDirectory }, null, 2));
  if (application) await application.close();
});
