// Run after npm run build and preparing tree resources. Does not read private builds or request an engine connection.
const { _electron: electron } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const output = path.join(root, '.local');
const env = { ...process.env, POK_UI_DATA_DIR: path.join(output, 'tree-native-qa-' + crypto.randomUUID()) };
delete env.ELECTRON_RUN_AS_NODE;
delete env.POK_RENDERER_URL;
let application;

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const executable = process.env.POK_SMOKE_EXECUTABLE;
  application = await electron.launch({ executablePath: executable || process.env.POK_SMOKE_ELECTRON || require('electron'), args: executable ? [] : ['.'], cwd: root, env, timeout: 60000 });
  const page = await application.firstWindow({ timeout: 60000 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.locator('.app-shell').waitFor();
  const result = await page.evaluate(async () => {
    const start = performance.now();
    const tree = await window.pok.loadPassiveTree('0_5');
    const coldIpcMs = performance.now() - start;
    const warmStart = performance.now();
    const warm = await window.pok.loadPassiveTree('0_5');
    const warmIpcMs = performance.now() - warmStart;
    let wrongVersion = '';
    try { await window.pok.loadPassiveTree('999_999'); }
    catch (error) { wrongVersion = String(error); }
    const byUrl = new Map();
    for (const [name, asset] of Object.entries(tree.assets)) {
      if (!byUrl.has(asset.url)) byUrl.set(asset.url, []);
      byUrl.get(asset.url).push({ name, ...asset });
    }
    const files = [...byUrl.entries()];
    const failures = [], dimensions = [];
    let next = 0;
    const imagesStart = performance.now();
    async function worker() {
      while (next < files.length) {
        const [url, entries] = files[next++];
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.src = url;
        try {
          await image.decode();
          for (const asset of entries) {
            if ((asset.x || 0) + asset.width > image.naturalWidth || (asset.y || 0) + asset.height > image.naturalHeight) failures.push(asset.name + ': crop exceeds image bounds');
          }
          dimensions.push({ url, width: image.naturalWidth, height: image.naturalHeight });
        } catch (error) { failures.push(url + ': ' + String(error)); }
        image.src = '';
      }
    }
    await Promise.all(Array.from({ length: 6 }, worker));
    const imageDecodeMs = performance.now() - imagesStart;
    const deniedImages = [];
    for (const url of ['pok-tree://assets/0_5/manifest.json', 'pok-tree://assets/0_5/not-listed.webp', 'pok-tree://other/0_5/Background2.webp']) {
      const image = new Image(); image.src = url;
      try { await image.decode(); deniedImages.push({ url, denied: false }); }
      catch { deniedImages.push({ url, denied: true }); }
      image.src = '';
    }
    return { version: tree.version, coldIpcMs, warmIpcMs, imageDecodeMs, nodeCount: Object.keys(tree.tree.nodes).length,
      warmNodeCount: Object.keys(warm.tree.nodes).length, logicalAssets: Object.keys(tree.assets).length, uniqueImages: files.length,
      decodedImages: dimensions.length, wrongVersion, failures, deniedImages, source: tree.source };
  });
  assert.equal(result.version, '0_5');
  assert(result.nodeCount > 1000);
  assert.equal(result.warmNodeCount, result.nodeCount);
  assert.equal(result.decodedImages, result.uniqueImages);
  assert.match(result.wrongVersion, /999_999/);
  assert.deepEqual(result.failures, []);
  assert(result.deniedImages.every(image => image.denied));
  assert.deepEqual(errors, []);
  fs.writeFileSync(path.join(output, 'tree-native-smoke-result.json'), JSON.stringify({ ...result, errors, privateBuildsRead: false, engineConnectionRequested: false }, null, 2));
  console.log(JSON.stringify(result, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (application) await application.close(); });
