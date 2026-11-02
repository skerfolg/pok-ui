// Full native catalogue workflow with ONLY independent PoB resources installed.
const {_electron:electron}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
require('tsx/cjs');const {createDefaultState}=require('../src/shared/state.ts');const {parseBuild}=require('../src/shared/pob-document.ts');
const root=path.resolve('.'),directory=path.join(root,'.local','editor-native-'+Date.now());fs.mkdirSync(path.join(directory,'resources'),{recursive:true});
const packagedExecutable=process.env.POK_SMOKE_EXECUTABLE;
if(!packagedExecutable)for(const folder of ['pob-runtime','pob-editor'])fs.symlinkSync(path.join(root,'resources',folder),path.join(directory,'resources',folder),'junction');
const initial=createDefaultState();initial.settings.pok={mode:'checkout',root:'not-installed',python:'not-installed',luajit:'',autoConnect:false};
fs.mkdirSync(path.join(directory,'workspace'),{recursive:true});fs.writeFileSync(path.join(directory,'workspace','workspace.v1.json'),JSON.stringify(initial));
const env={...process.env,POK_UI_DATA_DIR:directory,POK_UI_RESOURCE_DIR:path.join(directory,'resources')};delete env.ELECTRON_RUN_AS_NODE;delete env.POK_RENDERER_URL;
let app,page;const report={at:new Date().toISOString(),passed:[]};
const current=()=>page.evaluate(async()=>{const s=await window.pok.loadState();return s.builds.find(b=>b.id===s.activeBuildId);});
async function poll(read,test){const deadline=Date.now()+120000;let result;do{result=await read();if(test(result))return result;await page.waitForTimeout(250);}while(Date.now()<deadline);throw new Error('Poll timed out: '+JSON.stringify(result));}
async function launch(){app=await electron.launch({executablePath:packagedExecutable||path.join(root,'node_modules','electron','dist','electron.exe'),args:packagedExecutable?[]:[root],cwd:directory,env,timeout:90000});page=await app.firstWindow();page.setDefaultTimeout(45000);await page.locator('.app-shell').waitFor();}
(async()=>{
  await launch();const info=await poll(()=>page.evaluate(()=>window.pok.getDataBundleInfo()),i=>i.status==='ready');assert.equal(info.source,'pob');assert.equal(info.identity,undefined);report.bundle=info.bundleId;
  report.packaged=await app.evaluate(({app})=>app.isPackaged);
  if(packagedExecutable){assert.equal(report.packaged,true);const resources=await app.evaluate(()=>process.resourcesPath);assert.equal(fs.existsSync(path.join(resources,'pok-runtime')),false);assert.equal(fs.existsSync(path.join(resources,'bundle-manifest.json')),false);report.passed.push('packaged resources contain only independent PoB bundles; no PoK or legacy bundle');}
  const connection=await page.evaluate(()=>window.pok.getPokConnection());assert.equal(connection.connected,false);assert.equal(connection.error,undefined);
  await page.getByRole('button',{name:'새 빌드',exact:true}).first().click();let build=await poll(current,b=>Boolean(b));
  assert.equal(parseBuild(build.xml).className,info.classes[0].name);assert.equal(build.originalXml,build.xml);report.passed.push('new build uses actual PoB class IDs and tree metadata without PoK');
  await page.locator('.slot-row').filter({hasText:'반지 1'}).click();await page.getByLabel('베이스 카탈로그 검색').fill('Iron Ring');
  const bases=page.locator('.catalog-picker').filter({hasText:'베이스 카탈로그'});await bases.locator('.catalog-results button').filter({hasText:'Iron Ring'}).first().click();
  await page.getByRole('button',{name:'베이스 장착',exact:true}).click();build=await poll(current,b=>b.revision===1);
  assert.equal(parseBuild(build.xml).items.length,1);assert.match(parseBuild(build.xml).items[0].text,/Iron Ring/);report.passed.push('native base selection renders and equips through original PoB');
  await page.getByLabel('레어 접사 카탈로그 검색').fill('mod:Item:Strength1');
  const mods=page.locator('.catalog-picker').filter({hasText:'레어 접사 카탈로그'});await mods.locator('.catalog-results button').filter({hasText:'of the Brute'}).first().click();
  await page.getByLabel('of the Brute roll').fill('1');await page.getByRole('button',{name:'레어 장착',exact:true}).click();build=await poll(current,b=>b.revision===2);
  const parsed=parseBuild(build.xml),set=parsed.itemSets.find(s=>s.active);assert.match(parsed.items.find(i=>i.id===set.slots['Ring 1']).text,/\+8 to Strength/);
  report.passed.push('native rare affix selection and roll use original Item.Craft and one revision');
  await page.getByRole('button',{name:'계산',exact:true}).click();build=await poll(current,b=>b.calculation?.revision===2);assert.equal(build.calculation.result.ok,true);report.stats={Life:build.calculation.result.stats.Life,Str:build.calculation.result.stats.Str};
  assert.equal(build.calculation.provenance.runtime,'pob');report.passed.push('equipped native item reaches a fresh independent calculation');
  await page.getByRole('button',{name:'패시브트리',exact:true}).click();
  await page.waitForFunction(()=>{const c=document.querySelector('canvas');return Number(c?.dataset.nodes)>1000&&Number(c.dataset.requiredImages)>0&&c.dataset.readyImages===c.dataset.requiredImages&&Number(c.dataset.failedImages)===0;},null,{timeout:90000});
  report.passed.push('original tree and verified image URLs load with no engine server');
  for(const [width,height] of [[1920,1080],[1024,768]]){await app.evaluate(({BrowserWindow},size)=>BrowserWindow.getAllWindows()[0].setContentSize(...size),[width,height]);for(const view of ['장비','스킬','패시브트리','pok 설정']){await page.getByRole('button',{name:view,exact:true}).click();if(view==='pok 설정')await page.getByText(/원본 PoB 0.23.1/).waitFor();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(directory,view+'-'+width+'.png')});}}
  report.passed.push('native catalogue, skills, tree and source settings fit both desktop sizes');
  const saved=await current();await app.close();app=undefined;await launch();const restored=await current();assert.equal(restored.xml,saved.xml);assert.equal(restored.revision,2);assert.equal(restored.originalXml,saved.originalXml);assert.equal(restored.calculation.result.stats.Str,saved.calculation.result.stats.Str);
  assert.equal((await page.evaluate(()=>window.pok.getPokConnection())).connected,false);report.passed.push('restart restores catalogue edits and calculated revision without PoK');
})().catch(error=>{report.error=error.stack;process.exitCode=1;}).finally(async()=>{if(app)await app.close();fs.writeFileSync(path.join(directory,'result.json'),JSON.stringify(report,null,2));console.log(directory);if(report.error)console.error(report.error);});
