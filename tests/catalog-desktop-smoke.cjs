// Synthetic, isolated smoke for the actual pinned catalog/runtime package.
const { _electron: electron } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
require('tsx/cjs');
const { parseBuild } = require('../src/shared/pob-document.ts');
const { createDefaultState } = require('../src/shared/state.ts');

const root = path.resolve(__dirname, '..');
const directory = path.join(root, '.local', 'catalog-qa-' + Date.now());
fs.mkdirSync(directory, { recursive: true });
if(process.env.POK_SMOKE_ENGINE_ROOT){
  const initial=createDefaultState();
  initial.settings.pok={mode:'checkout',root:process.env.POK_SMOKE_ENGINE_ROOT,python:process.env.POK_SMOKE_PYTHON||path.join(process.env.POK_SMOKE_ENGINE_ROOT,'.venv','Scripts','python.exe'),luajit:process.env.POK_SMOKE_LUAJIT||''};
  fs.mkdirSync(path.join(directory,'workspace'),{recursive:true});
  fs.writeFileSync(path.join(directory,'workspace','workspace.v1.json'),JSON.stringify(initial));
}
const env = { ...process.env, POK_UI_DATA_DIR: directory };
delete env.ELECTRON_RUN_AS_NODE; delete env.POK_RENDERER_URL;
const passed = [], skipped = [], failures = [], errors = [];
let application, page;
let resourceDirectory, resourceManifest;
const sha = text => createHash('sha256').update(text).digest('hex');
async function check(name, fn) {
  try { await fn(); passed.push(name); console.log('PASS: ' + name); }
  catch (e) { failures.push(name + ': ' + e.message); console.error('FAIL: ' + name + ': ' + e.message); }
}
const saved = () => page.waitForFunction(() => document.querySelector('.statusbar [role=status]')?.textContent === '저장됨');
const state = () => page.evaluate(() => window.pok.loadState());
const current = async () => { const s = await state(); return s.builds.find(b => b.id === s.activeBuildId); };
const skipEngine = process.env.POK_SMOKE_SKIP_ENGINE === '1';
function timeout(promise, ms, label) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(label + ' timed out after ' + ms + 'ms')), ms))]);
}

(async () => {
  const packagedExecutable = process.env.POK_SMOKE_EXECUTABLE;
  const electronExecutable = process.env.POK_SMOKE_ELECTRON_EXECUTABLE;
  application = await electron.launch({
    executablePath: packagedExecutable || electronExecutable || require('electron'),
    args: packagedExecutable ? [] : [root],
    cwd: directory,
    env,
    timeout: 120000
  });
  const electronVersion = await application.evaluate(() => process.versions.electron);
  console.log('Electron: ' + electronVersion);
  page = await application.firstWindow({ timeout: 120000 });
  page.setDefaultTimeout(30000);
  page.on('pageerror', error => errors.push(error.message));
  await page.locator('.app-shell').waitFor(); await saved();
  const location=await application.evaluate(({app})=>({packaged:app.isPackaged,root:app.getAppPath(),resources:process.resourcesPath}));
  resourceDirectory=location.packaged?location.resources:path.join(location.root,'resources');
  resourceManifest=JSON.parse(fs.readFileSync(path.join(resourceDirectory,'bundle-manifest.json'),'utf8'));
  let info;
  await check('prepared bundle has source identity and all original catalog types', async () => {
    info = await page.evaluate(() => window.pok.getDataBundleInfo());
    assert.equal(info.status, 'ready', info.error);
    assert.equal(info.identity.pob.commit.length, 40);
    for (const type of ['base','unique','mod','gem','skill']) {
      const result = await page.evaluate(type => window.pok.queryPobCatalog({ type, limit: 2 }), type);
      assert(result.total > 0, type + ' is empty');
      assert(result.entries.length > 0);
    }
    assert(info.classes.length > 0);
  });
  await check('new build uses pinned tree and original class metadata', async () => {
    await page.getByRole('button', { name: '새 빌드', exact: true }).first().click(); await saved();
    const build = await current(); const parsed = parseBuild(build.xml);
    assert.equal(parsed.trees[0].version, info.defaultTreeVersion);
    assert.equal(parsed.className, info.classes[0].name);
    assert.equal(parsed.stats.Life, undefined);
    assert.equal(build.originalXml, build.xml);
  });
  if(skipEngine) {
    skipped.push('engine-backed MCP checks skipped by POK_SMOKE_SKIP_ENGINE');
  } else {
    let engineReady = false;
    await check('native runtime identity agrees with the prepared UI bundle', async () => timeout((async () => {
      await page.getByRole('button', { name: 'pok 설정', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('.sidebar-bottom')?.textContent.includes('pok 연결됨'), null, { timeout: 90000 });
      const runtime = await timeout(page.evaluate(() => window.pok.callPok('server_info', {})), 30000, 'server_info');
      assert.equal(runtime.identity.pob.commit, info.identity.pob.commit);
      assert.equal(runtime.identity.kb.contentSha256, info.identity.kb.contentSha256);
      const knowledge=await timeout(page.evaluate(()=>window.pok.callPok('search_kb',{query:'Fireball',type:'Skill',limit:1})), 30000, 'search_kb');
      assert.match(JSON.stringify(knowledge),/fireball/i);
      engineReady = true;
    })(), 120000, 'native runtime identity'));
    if(!engineReady) {
      skipped.push('engine-dependent edit and calculation checks skipped after connection failure');
    } else {
    await check('original base rendering and atomic equip preserve original XML', async () => {
      const bases = await page.evaluate(() => window.pok.queryPobCatalog({type:'base',query:'Iron Ring',limit:10}));
      assert(bases.entries.length);
      const result = await page.evaluate(id => window.pok.renderPobItem({kind:'base',id}), bases.entries[0].id);
      assert.equal(result.ok, true, result.reason || result.error);
      const before = await current();
      await page.getByRole('button', {name:'장비',exact:true}).click();
      await page.locator('.slot-row').filter({hasText:'반지 1'}).click();
      await page.getByText('아이템 원문 편집',{exact:true}).click();
      await page.getByLabel('아이템 원문',{exact:true}).fill(result.text);
      await page.getByRole('button',{name:'적용',exact:true}).click(); await saved();
      const after = await current();
      assert.equal(after.revision, before.revision + 1);
      assert.equal(after.originalXml, before.originalXml);
      assert.equal(parseBuild(after.xml).items.length, 1);
      await page.getByRole('button',{name:'되돌리기',exact:true}).click(); await saved();
      assert.equal((await current()).xml, before.xml);
    });
    await check('direct XML calculation is tagged with source and input hash', async () => {
      const build = await current();
      await page.getByRole('button',{name:'계산',exact:true}).click();
      await page.waitForFunction(async()=>{const s=await window.pok.loadState();const b=s.builds.find(b=>b.id===s.activeBuildId);return b?.calculation?.revision===b?.revision;},null,{timeout:180000});
      const result = (await current()).calculation;
      assert.equal(result.result.ok, true, JSON.stringify(result.result));
      assert.equal(result.provenance.bundleId, info.bundleId);
      assert.equal(result.provenance.xmlSha256, sha(build.xml));
      assert.equal(result.provenance.mode, 'xml');
      assert(Object.keys(result.result.stats).length > 0);
    });
    await check('manual level changes reach the same PoB calculation',async()=>{
      const before=(await current()).calculation;
      await page.getByRole('button',{name:'설정',exact:true}).click();
      await page.getByLabel('캐릭터 레벨',{exact:true}).fill('50');await saved();
      await page.getByRole('button',{name:'계산',exact:true}).click();
      await page.waitForFunction(async()=>{const s=await window.pok.loadState();const b=s.builds.find(b=>b.id===s.activeBuildId);return b?.calculation?.revision===b?.revision;},null,{timeout:180000});
      const after=await current();assert.equal(parseBuild(after.xml).level,50);assert.equal(after.calculation.result.ok,true,JSON.stringify(after.calculation.result));
      assert(Number(after.calculation.result.stats.Life)>Number(before.result.stats.Life));
    });
    }
  }
  await check('pinned tree images load through verified bundle URLs',async()=>{
    await page.getByRole('button',{name:'패시브트리',exact:true}).click();
    await page.waitForFunction(()=>{const c=document.querySelector('canvas');return Number(c?.dataset.nodes)>1000&&Number(c?.dataset.requiredImages)>0&&c.dataset.readyImages===c.dataset.requiredImages&&Number(c.dataset.failedImages)===0;},null,{timeout:90000});
  });
  await check('class and original catalog panels fit both desktop sizes', async () => {
    for (const [width,height] of [[1920,1080],[1024,768]]) {
      await application.evaluate(({BrowserWindow}, size) => BrowserWindow.getAllWindows()[0].setContentSize(size[0],size[1]), [width,height]);
      for(const view of ['장비','스킬','설정','패시브트리']) {
        await page.getByRole('button',{name:view,exact:true}).click();
        if(view==='스킬' && await page.getByRole('button',{name:'스킬 그룹 추가'}).count()) {
          const b=await current();if(!parseBuild(b.xml).skillSets[0].groups.length){await page.getByRole('button',{name:'스킬 그룹 추가'}).click();await saved();}
        }
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'horizontal overflow '+view);
        await page.screenshot({path:path.join(directory,view+'-'+width+'.png')});
      }
    }
  });
  assert.deepEqual(errors, []);
})().catch(error => { failures.push(String(error.stack || error)); }).finally(async () => {
  if(application) await application.close();
  if(resourceDirectory&&resourceManifest) {
    try {
      const known=new Set(resourceManifest.files.map(file=>file.path));
      const {sha256File}=await import('../scripts/file-integrity.mjs');
      for(const file of resourceManifest.files)assert.equal(await sha256File(path.join(resourceDirectory,file.path)),file.sha256,'Resource modified: '+file.path);
      function scan(folder) {for(const e of fs.readdirSync(folder,{withFileTypes:true})){const full=path.join(folder,e.name);if(e.isDirectory())scan(full);else{const relative=path.relative(resourceDirectory,full).split(path.sep).join('/');assert(known.has(relative)||e.name==='.gitkeep','Unexpected resource write: '+relative);}}}
      for(const folder of ['passive-tree','pob-catalog',...(resourceManifest.runtime.mode==='checkout'?[]:['pok-runtime'])])scan(path.join(resourceDirectory,folder));
      passed.push('bundle files and directory contents remain immutable ('+(resourceManifest.runtime.mode||'bundled')+')');
    } catch(error) {failures.push('Resource immutability: '+error.message);}
  }
  fs.writeFileSync(path.join(directory,'result.json'), JSON.stringify({passed,skipped,failures,errors},null,2));
  console.log('Artifacts: '+directory);
  if(failures.length) { console.error(failures.join('\n')); process.exitCode=1; }
});
