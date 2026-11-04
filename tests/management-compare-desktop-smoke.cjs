// Synthetic workspace only; no PoK server or personal data.
const {_electron:electron}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
require('tsx/cjs');const {createDefaultState,createBuildDocument}=require('../src/shared/state.ts');
const {createBlankXml,editBuild,parseBuild}=require('../src/shared/pob-document.ts');
const root=path.resolve('.'),directory=path.join(root,'.local','management-compare-native-'+Date.now());
fs.mkdirSync(path.join(directory,'resources'),{recursive:true});
for(const name of ['pob-runtime','pob-editor'])fs.symlinkSync(path.join(root,'resources',name),path.join(directory,'resources',name),'junction');
const env={...process.env,POK_UI_DATA_DIR:directory,POK_UI_RESOURCE_DIR:path.join(directory,'resources')};delete env.ELECTRON_RUN_AS_NODE;delete env.POK_RENDERER_URL;
let app,page;const report={at:new Date().toISOString(),passed:[]};
const state=()=>page.evaluate(()=>window.pok.loadState());
async function poll(read,test){const end=Date.now()+120000;let value;do{value=await read();if(test(value))return value;await page.waitForTimeout(200);}while(Date.now()<end);throw new Error('Poll timed out: '+JSON.stringify(value));}
async function openManagement(){const section=page.locator('.workspace-management');if(!await section.evaluate(e=>e.open))await section.locator('summary').click();await page.getByRole('button',{name:'빌드 관리',exact:true}).click();}
async function launch(){app=await electron.launch({executablePath:process.env.POK_SMOKE_EXECUTABLE||path.join(root,'node_modules','electron','dist','electron.exe'),args:process.env.POK_SMOKE_EXECUTABLE?[]:[root],cwd:directory,env,timeout:90000});page=await app.firstWindow();page.setDefaultTimeout(90000);await page.locator('.app-shell').waitFor();}
(async()=>{
  const initial=createDefaultState();initial.settings.pok.autoConnect=false;
  fs.mkdirSync(path.join(directory,'workspace'));fs.writeFileSync(path.join(directory,'workspace','workspace.v1.json'),JSON.stringify(initial));
  await launch();const info=await poll(()=>page.evaluate(()=>window.pok.getDataBundleInfo()),v=>v.status==='ready');
  await app.close();app=undefined;
  const klass=info.classes.find(c=>c.name==='Ranger');assert(klass);
  let xml=createBlankXml({defaultTreeVersion:info.defaultTreeVersion,characterClass:klass});
  xml=editBuild(xml,{type:'set-add',kind:'items',title:'Alternate',copyFrom:'1'});
  xml=editBuild(xml,{type:'active-set',kind:'items',id:'1'});
  const a=createBuildDocument('Synthetic A',xml),b=createBuildDocument('Synthetic B',xml.replace('level="1"','level="50"'));
  initial.builds=[a,b];initial.activeBuildId=a.id;
  fs.writeFileSync(path.join(directory,'workspace','workspace.v1.json'),JSON.stringify(initial));await launch();
  await openManagement();
  await page.getByLabel('Synthetic A 복사',{exact:true}).click();await page.getByLabel('관리 이름').fill('Synthetic Copy');await page.getByLabel('관리 폴더').fill('Tests/Nested');await page.getByRole('button',{name:'관리 적용',exact:true}).click();
  let saved=await poll(state,s=>s.builds.length===3),copy=saved.builds.find(x=>x.name==='Synthetic Copy');assert.equal(copy.xml,a.xml);assert.equal(copy.folder,'Tests/Nested');assert.equal(copy.revision,0);
  await page.getByLabel('Synthetic Copy 삭제',{exact:true}).click();await page.getByRole('button',{name:'관리 적용',exact:true}).click();await poll(state,s=>s.trash?.length===1);
  await page.getByRole('checkbox',{name:/삭제 보관함/}).check();await page.getByLabel('Synthetic Copy 복원',{exact:true}).click();await poll(state,s=>s.builds.length===3&&s.trash.length===0);
  report.passed.push('copy, nested workspace folders, trash and restore preserve canonical XML');
  await page.getByLabel('현재 빌드',{exact:true}).selectOption(a.id);await page.getByRole('button',{name:'노트',exact:true}).click();await page.getByLabel('PoB 노트').fill('Synthetic redo');
  await poll(state,s=>s.builds.find(x=>x.id===a.id).revision===1);await page.getByRole('button',{name:'되돌리기',exact:true}).click();await poll(state,s=>s.builds.find(x=>x.id===a.id).revision===2);
  await page.getByRole('button',{name:'다시 실행',exact:true}).click();await poll(state,s=>s.builds.find(x=>x.id===a.id).revision===3&&parseBuild(s.builds.find(x=>x.id===a.id).xml).notes==='Synthetic redo');
  report.passed.push('redo restores the exact edited XML at a new revision');
  await page.getByRole('button',{name:'비교',exact:true}).click();await page.getByLabel('원안 빌드',{exact:true}).selectOption(a.id);await page.getByLabel('수정안 빌드',{exact:true}).selectOption(b.id);
  await page.getByLabel('원안 장비 세트',{exact:true}).selectOption({label:'Alternate'});await page.getByRole('button',{name:'두 구성 새로 계산',exact:true}).click();
  saved=await poll(state,s=>s.comparisons?.length===1);const record=saved.comparisons[0];assert.notEqual(record.left.calculation.result.ok,false);assert.notEqual(record.right.calculation.result.ok,false);
  assert.equal(record.left.calculation.result.stats.Life,65);assert.equal(record.right.calculation.result.stats.Life,683);assert.equal(saved.builds.find(x=>x.id===a.id).xml.includes('activeItemSet="1"'),true);
  await page.getByLabel('비교 통계 검색',{exact:true}).fill('생명력');const lifeRow=page.locator('.comparison-table tbody tr').filter({has:page.getByRole('rowheader',{name:'총 생명력',exact:true})});assert.deepEqual((await lifeRow.locator('td').allTextContents()).slice(0,3),['65','683','618']);assert(!await page.locator('.comparison-table').innerText().then(text=>text.includes('TotalDPS')));await page.getByLabel('비교 통계 검색',{exact:true}).fill('');await page.getByRole('checkbox',{name:'고급 · 전체 원본 통계',exact:true}).check();assert(await page.locator('.comparison-table tbody tr').count()>0);await page.getByRole('checkbox',{name:'고급 · 전체 원본 통계',exact:true}).uncheck();report.passed.push('comparison uses human-readable summary names and units, supports label search, and retains full original statistics in an explicit advanced view');
  await page.getByRole('button',{name:'원안 선택 구성 적용·재계산',exact:true}).click();saved=await poll(state,s=>s.builds.find(x=>x.id===a.id).calculation?.revision===4);
  const applied=saved.builds.find(x=>x.id===a.id);assert.equal(applied.revision,4);assert.equal(applied.calculation.provenance.revision,4);assert.equal(parseBuild(applied.xml).itemSets.find(s=>s.active).title,'Alternate');assert.equal(applied.originalXml,a.originalXml);
  assert(await page.getByRole('button',{name:'원안 선택 구성 적용·재계산',exact:true}).isDisabled());
  report.passed.push('native two-build measurement preserves inputs; selected set applies as a new revision and is remeasured; stale receipt cannot reapply');
  for(const [width,height] of [[1920,1080],[1024,768]]){await app.evaluate(({BrowserWindow},size)=>BrowserWindow.getAllWindows()[0].setContentSize(...size),[width,height]);for(const view of ['비교','빌드 관리']){if(view==='빌드 관리')await openManagement();else await page.getByRole('button',{name:view,exact:true}).click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(directory,view+'-'+width+'.png')});if(view==='비교'){await page.locator('.comparison-table').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(directory,'비교-통계-'+width+'.png')});}}}
  await app.close();app=undefined;await launch();saved=await state();assert.equal(saved.comparisons.length,1);assert.equal(saved.builds.find(x=>x.id===a.id).xml,applied.xml);assert.equal(saved.builds.find(x=>x.id===copy.id).folder,'Tests/Nested');assert.equal((await page.evaluate(()=>window.pok.getPokConnection())).connected,false);
  await page.getByRole('button',{name:'비교',exact:true}).click();await page.getByLabel('비교 기록',{exact:true}).selectOption(record.id);await page.getByText('기준 리비전 3 · 현재 문서와 다름 또는 삭제됨',{exact:true}).waitFor();
  report.passed.push('comparison evidence, folders and applied revision survive restart; both screen sizes fit without PoK');
})().catch(async error=>{report.error=error.stack;process.exitCode=1;if(page)await page.screenshot({path:path.join(directory,'failure.png')}).catch(()=>{});}).finally(async()=>{if(app)await app.close();fs.writeFileSync(path.join(directory,'result.json'),JSON.stringify(report,null,2));console.log(directory);if(report.error)console.error(report.error);});
