// Isolated native workflow: only the independent PoB resource directory is visible.
const {_electron:electron}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
require('tsx/cjs');
const {createDefaultState,createBuildDocument}=require('../src/shared/state.ts');
const {createBlankXml,parseBuild}=require('../src/shared/pob-document.ts');
const {isCalculationCurrent}=require('../src/shared/calculation-context.ts');
const root=path.resolve('.'),directory=path.join(root,'.local','standalone-native-'+Date.now());
fs.mkdirSync(path.join(directory,'resources'),{recursive:true});
fs.symlinkSync(path.join(root,'resources','pob-runtime'),path.join(directory,'resources','pob-runtime'),'junction');
const initial=createDefaultState();
initial.settings.pok={mode:'checkout',root:'not-installed',python:'not-installed',luajit:'',autoConnect:false};
const xml=createBlankXml({defaultTreeVersion:'0_5',characterClass:{id:'Ranger',name:'Ranger',internalId:2,legacyId:1,ascendancies:[]}});
const build=createBuildDocument('Synthetic native standalone',xml);initial.builds=[build];initial.activeBuildId=build.id;
fs.mkdirSync(path.join(directory,'workspace'),{recursive:true});
fs.writeFileSync(path.join(directory,'workspace','workspace.v1.json'),JSON.stringify(initial));
const env={...process.env,POK_UI_DATA_DIR:directory,POK_UI_RESOURCE_DIR:path.join(directory,'resources')};
delete env.ELECTRON_RUN_AS_NODE;delete env.POK_RENDERER_URL;
const report={at:new Date().toISOString(),passed:[]};let app,page;
async function launch(){
  app=await electron.launch({executablePath:process.env.POK_SMOKE_ELECTRON_EXECUTABLE||path.join(root,'node_modules','electron','dist','electron.exe'),args:[root],cwd:directory,env,timeout:90000});
  page=await app.firstWindow();page.setDefaultTimeout(30000);await page.locator('.app-shell').waitFor();
}
const current=()=>page.evaluate(async()=>{const s=await window.pok.loadState();return s.builds.find(b=>b.id===s.activeBuildId);});
async function poll(read,predicate){const until=Date.now()+120000;let value;do{value=await read();if(predicate(value))return value;await page.waitForTimeout(250);}while(Date.now()<until);throw new Error('Poll timed out: '+JSON.stringify(value));}
(async()=>{
  await launch();
  const info=await poll(()=>page.evaluate(()=>window.pok.getPobRuntimeInfo()),i=>i.status==='ready');report.runtime=info;
  assert.equal((await page.evaluate(()=>window.pok.getDataBundleInfo())).status,'missing');
  const disconnected=await page.evaluate(()=>window.pok.getPokConnection());
  assert.equal(disconnected.connected,false);assert.equal(disconnected.error,undefined);assert.notEqual(disconnected.connecting,true);
  await page.getByRole('button',{name:'설정',exact:true}).click();
  await page.getByLabel('캐릭터 레벨',{exact:true}).fill('50');
  await poll(current,b=>b.revision===1);
  await page.getByRole('button',{name:'계산',exact:true}).click();
  const calculated=await poll(current,b=>b.calculation?.revision===1);
  assert.equal(calculated.calculation.result.ok,true);assert.equal(calculated.calculation.result.stats.Life,683);
  assert.equal(calculated.calculation.provenance.runtime,'pob');assert.equal(calculated.originalXml,xml);
  assert(isCalculationCurrent(calculated,info.runtimeId,calculated.calculation.provenance.xmlSha256));
  report.passed.push('native UI edit and actual PoB calculation succeed without PoK, Python, KB or legacy data bundle');
  const failure=await page.evaluate(()=>window.pok.connectPok({mode:'checkout',root:'not-installed',python:'not-installed',luajit:''}));assert.equal(failure.connected,false);
  const stillCurrent=await current();assert(isCalculationCurrent(stillCurrent,info.runtimeId,stillCurrent.calculation.provenance.xmlSha256));
  report.passed.push('optional PoK connection failure does not invalidate independent calculation');
  for(const [width,height] of [[1920,1080],[1024,768]]){
    await app.evaluate(({BrowserWindow},size)=>BrowserWindow.getAllWindows()[0].setContentSize(...size),[width,height]);
    for(const view of ['장비','설정','pok 설정']){
      await page.getByRole('button',{name:view,exact:true}).click();
      if(view==='pok 설정')await page.getByText(/PoK 연결 없이 계산/).waitFor();
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      await page.screenshot({path:path.join(directory,view+'-'+width+'.png')});
    }
  }
  report.passed.push('standalone editor and runtime settings fit 1920x1080 and 1024x768');
  await app.close();app=undefined;await launch();
  const restored=await current();assert.equal(restored.revision,1);assert.equal(restored.xml,calculated.xml);assert.equal(restored.originalXml,xml);
  assert.equal(restored.calculation.result.stats.Life,683);assert.equal(parseBuild(restored.xml).level,50);
  assert.equal((await page.evaluate(()=>window.pok.getPokConnection())).connected,false);
  report.passed.push('restart restores original XML, edited revision and independent calculated output with PoK disconnected');
})().catch(error=>{report.error=error.stack;process.exitCode=1;}).finally(async()=>{
  if(app)await app.close();fs.writeFileSync(path.join(directory,'result.json'),JSON.stringify(report,null,2));console.log(directory);if(report.error)console.error(report.error);
});
