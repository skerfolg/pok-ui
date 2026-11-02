// Native Calcs UI, synthetic build, no PoK installation or user data.
const {_electron:electron}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
require('tsx/cjs');const {createDefaultState,createBuildDocument}=require('../src/shared/state.ts'),{createBlankXml,editBuild,parseBuild}=require('../src/shared/pob-document.ts');
const root=path.resolve('.'),directory=path.join(root,'.local','calcs-native-'+Date.now()),executable=process.env.POK_SMOKE_EXECUTABLE;
fs.mkdirSync(path.join(directory,'resources'),{recursive:true});for(const name of ['pob-runtime','pob-editor'])fs.symlinkSync(path.join(root,'resources',name),path.join(directory,'resources',name),'junction');
let xml=createBlankXml({defaultTreeVersion:'0_5',characterClass:{id:'Ranger',name:'Ranger',internalId:2,legacyId:2,ascendancies:[]}});
for(const [i,name] of [[1,'Ice Nova'],[2,'Fireball']]){xml=editBuild(xml,{type:'skill-add',setId:'1'});xml=editBuild(xml,{type:'skill-group',setId:'1',groupId:String(i),group:{id:String(i),label:name,slot:'',enabled:true,includeInFullDPS:true,attributes:{mainActiveSkill:'1'},gems:[{name,level:1,quality:0,enabled:true,attributes:{}}]}});}
const initial=createDefaultState(),build=createBuildDocument('Synthetic Calcs',xml);initial.builds=[build];initial.activeBuildId=build.id;initial.settings.pok={mode:'checkout',root:'not-installed',python:'not-installed',luajit:'',autoConnect:false};
fs.mkdirSync(path.join(directory,'workspace'));fs.writeFileSync(path.join(directory,'workspace','workspace.v1.json'),JSON.stringify(initial));
const env={...process.env,POK_UI_DATA_DIR:directory,POK_UI_RESOURCE_DIR:path.join(directory,'resources')};delete env.ELECTRON_RUN_AS_NODE;delete env.POK_RENDERER_URL;
let app,page;const report={at:new Date().toISOString(),packaged:Boolean(executable),passed:[]};
const current=()=>page.evaluate(async()=>{const s=await window.pok.loadState();return s.builds.find(b=>b.id===s.activeBuildId);});
async function poll(read,test){const end=Date.now()+120000;let value;do{value=await read();if(test(value))return value;await page.waitForTimeout(200);}while(Date.now()<end);throw new Error('Poll timed out: '+JSON.stringify(value));}
async function launch(){app=await electron.launch({executablePath:executable||path.join(root,'node_modules','electron','dist','electron.exe'),args:executable?[]:[root],cwd:directory,env,timeout:90000});page=await app.firstWindow();page.setDefaultTimeout(90000);await page.locator('.app-shell').waitFor();}
async function ready(){await poll(()=>page.getByLabel('계산 상세 모드',{exact:true}).isEnabled(),Boolean);}
(async()=>{
  await launch();await page.getByRole('button',{name:'계산 상세',exact:true}).click();await ready();
  await page.getByLabel('계산 상세 검색',{exact:true}).fill('Life');await page.getByLabel('Life Total 1 상세',{exact:true}).click();
  const modal=page.getByRole('dialog',{name:'계산 분해 근거',exact:true});await modal.getByText('62 (base)',{exact:true}).waitFor();await modal.getByRole('button',{name:'닫기',exact:true}).click();
  assert.equal((await current()).xml,xml);report.passed.push('original Life cell opens native formatted breakdown without changing the build XML');
  await page.getByLabel('계산 상세 모드',{exact:true}).selectOption('UNBUFFED');await poll(current,b=>b.revision===1);await ready();assert.equal(await page.getByLabel('계산 상세 모드',{exact:true}).inputValue(),'UNBUFFED');
  await page.getByLabel('PoB 스킬 모드',{exact:true}).selectOption('2');const modeBuild=await poll(current,b=>b.revision===2);assert.match(modeBuild.xml,/<StatSetCalcsIndex[^>]*index="2"/);await ready();
  await page.getByRole('button',{name:'스킬',exact:true}).click();await poll(()=>page.getByLabel('PoB 스킬 모드',{exact:true}).isEnabled(),Boolean);assert.equal(await page.getByLabel('PoB 스킬 모드',{exact:true}).inputValue(),'1');
  report.passed.push('Calcs buff mode and Ice Nova mode are saved separately from main skill settings');
  await page.getByRole('button',{name:'계산 상세',exact:true}).click();await ready();assert.equal(await page.getByLabel('PoB 스킬 모드',{exact:true}).inputValue(),'2');
  await page.getByLabel('계산 상세 그룹',{exact:true}).selectOption('2');await poll(current,b=>b.revision===3);await ready();assert.equal(await page.getByLabel('계산 상세 그룹',{exact:true}).inputValue(),'2');
  await page.getByLabel('계산 상세 검색',{exact:true}).fill('Life');await page.getByLabel('Life Total 1 상세',{exact:true}).click();await modal.getByRole('button',{name:'닫기',exact:true}).click();
  await page.getByLabel('계산 상세 모드',{exact:true}).selectOption('EFFECTIVE');await poll(current,b=>b.revision===4);await ready();assert.equal(await modal.count(),0);
  await page.getByLabel('Life Total Increased 1 상세',{exact:true}).click();await modal.getByRole('columnheader',{name:'Value',exact:true}).waitFor();await modal.getByRole('button',{name:'닫기',exact:true}).click();
  report.passed.push('group selection and native modifier tables work; closing a pending breakdown prevents late modal resurrection');
  for(const [width,height] of [[1920,1080],[1024,768]]){await app.evaluate(({BrowserWindow},size)=>BrowserWindow.getAllWindows()[0].setContentSize(...size),[width,height]);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(directory,'calcs-'+width+'.png')});await page.getByLabel('Life Total 1 상세',{exact:true}).click();await modal.getByText('62 (base)',{exact:true}).waitFor();await page.screenshot({path:path.join(directory,'breakdown-'+width+'.png')});await modal.getByRole('button',{name:'닫기',exact:true}).click();}
  const saved=await current();assert.equal(saved.originalXml,xml);assert.equal(saved.calculation,undefined);await app.close();app=undefined;await launch();await page.getByRole('button',{name:'계산 상세',exact:true}).click();await ready();assert.equal((await current()).xml,saved.xml);assert.equal(await page.getByLabel('계산 상세 그룹',{exact:true}).inputValue(),'2');assert.equal(await page.getByLabel('계산 상세 모드',{exact:true}).inputValue(),'EFFECTIVE');assert.equal((await page.evaluate(()=>window.pok.getPokConnection())).connected,false);
  report.passed.push('Calcs settings survive restart; detail reads do not masquerade as sidebar calculations; both desktop sizes fit without PoK');
})().catch(async error=>{report.error=error.stack;process.exitCode=1;if(page)await page.screenshot({path:path.join(directory,'failure.png')}).catch(()=>{});}).finally(async()=>{if(app)await app.close();fs.writeFileSync(path.join(directory,'result.json'),JSON.stringify(report,null,2));console.log(directory);if(report.error)console.error(report.error);});
