// Original config/mode controls + set CRUD + notes, with only independent PoB assets.
const {_electron:electron}=require('playwright');const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
require('tsx/cjs');const {createDefaultState}=require('../src/shared/state.ts');const {parseBuild}=require('../src/shared/pob-document.ts');
const root=path.resolve('.'),directory=path.join(root,'.local','sets-config-native-'+Date.now());fs.mkdirSync(path.join(directory,'resources'),{recursive:true});
for(const folder of ['pob-runtime','pob-editor'])fs.symlinkSync(path.join(root,'resources',folder),path.join(directory,'resources',folder),'junction');
const initial=createDefaultState();initial.settings.pok={mode:'checkout',root:'not-installed',python:'not-installed',luajit:'',autoConnect:false};fs.mkdirSync(path.join(directory,'workspace'),{recursive:true});fs.writeFileSync(path.join(directory,'workspace','workspace.v1.json'),JSON.stringify(initial));
const env={...process.env,POK_UI_DATA_DIR:directory,POK_UI_RESOURCE_DIR:path.join(directory,'resources')};delete env.ELECTRON_RUN_AS_NODE;delete env.POK_RENDERER_URL;
let app,page;const report={at:new Date().toISOString(),passed:[]};
const current=()=>page.evaluate(async()=>{const s=await window.pok.loadState();return s.builds.find(b=>b.id===s.activeBuildId);});
async function poll(read,test){const end=Date.now()+120000;let value;do{value=await read();if(test(value))return value;await page.waitForTimeout(250);}while(Date.now()<end);throw new Error('Poll timed out: '+JSON.stringify(value));}
async function launch(){app=await electron.launch({executablePath:process.env.POK_SMOKE_EXECUTABLE||path.join(root,'node_modules','electron','dist','electron.exe'),args:process.env.POK_SMOKE_EXECUTABLE?[]:[root],cwd:directory,env,timeout:90000});page=await app.firstWindow();page.setDefaultTimeout(90000);await page.locator('.app-shell').waitFor();report.packaged=await app.evaluate(({app})=>app.isPackaged);if(process.env.POK_SMOKE_EXECUTABLE)assert(report.packaged);}
async function manage(name,action,title){
  const trigger=page.getByLabel(name+' 세트 관리',{exact:true});if(!await trigger.isVisible()){const wrapper=page.locator('.equipment-set-management');if(await wrapper.count()&&!await wrapper.evaluate(e=>e.open))await wrapper.locator('summary').first().click();}await trigger.click();await page.getByRole('button',{name:name+' 세트 '+action,exact:true}).click();
  if(title!==undefined){await page.getByLabel(name+' 세트 이름',{exact:true}).fill(title);await page.getByRole('button',{name:'세트 적용',exact:true}).click();}
  else if(name==='패시브'){await poll(()=>page.getByRole('button',{name:'세트 적용',exact:true}).isEnabled(),Boolean);await page.getByRole('button',{name:'세트 적용',exact:true}).click();}
  else await page.getByRole('button',{name:'선택한 세트 삭제',exact:true}).click();
}
(async()=>{
  await launch();await poll(()=>page.evaluate(()=>window.pok.getDataBundleInfo()),v=>v.status==='ready');await page.getByRole('button',{name:'새 빌드',exact:true}).first().click();await poll(current,Boolean);
  await page.getByRole('button',{name:'스킬',exact:true}).click();await page.getByRole('button',{name:'스킬 그룹 추가',exact:true}).click();await poll(current,b=>b.revision===1);
  await page.getByLabel('젬 카탈로그 검색').fill('Ice Nova');await page.locator('.catalog-results button').filter({hasText:'Ice Nova'}).first().click();
  await page.getByLabel('젬 1 레벨',{exact:true}).fill('1');await page.getByLabel('젬 1 레벨',{exact:true}).press('Tab');await poll(current,b=>b.revision===2);
  await page.getByLabel('PoB 스킬 모드').selectOption('2');let build=await poll(current,b=>b.revision===3);
  const inspected=await page.evaluate(b=>window.pok.inspectBuild({buildId:b.id,revision:b.revision,xml:b.xml}),build);assert.equal(inspected.skills[0].selectedMode,2);
  report.passed.push('catalogue gem and native Ice Nova mode update the canonical XML and original PoB selector');
  await page.getByRole('button',{name:'전투 조건',exact:true}).click();await page.getByLabel('PoB 전투 조건 검색').fill('resistancePenalty');
  await page.getByLabel('PoB 조건 resistancePenalty',{exact:true}).selectOption('0');build=await poll(current,b=>parseBuild(b.xml).configs.find(c=>c.active)?.inputs.resistancePenalty===0);
  await page.getByLabel('resistancePenalty 미설정',{exact:true}).click();build=await poll(current,b=>!Object.hasOwn(parseBuild(b.xml).configs.find(c=>c.active).inputs,'resistancePenalty'));
  await page.getByLabel('PoB 전투 조건 검색').fill('conditionFullLife');await page.getByText('원본에서 표시 가능한 조건 모두',{exact:true}).click();
  await page.getByLabel('PoB 조건 conditionFullLife',{exact:true}).check();await poll(current,b=>parseBuild(b.xml).configs.find(c=>c.active)?.inputs.conditionFullLife===true);
  await page.getByLabel('PoB 조건 conditionFullLife',{exact:true}).uncheck();await poll(current,b=>parseBuild(b.xml).configs.find(c=>c.active)?.inputs.conditionFullLife===false);
  await page.getByLabel('conditionFullLife 미설정',{exact:true}).click();await poll(current,b=>!Object.hasOwn(parseBuild(b.xml).configs.find(c=>c.active).inputs,'conditionFullLife'));
  report.passed.push('native config lists preserve numeric zero, explicit false and unset as distinct XML states');
  await page.getByRole('button',{name:'스킬',exact:true}).click();await manage('스킬','복사','Copied modes');await poll(current,b=>parseBuild(b.xml).skillSets.length===2);
  await manage('스킬','이름 변경','Renamed modes');build=await poll(current,b=>parseBuild(b.xml).skillSets.find(s=>s.active)?.title==='Renamed modes');
  const copy=await page.evaluate(b=>window.pok.inspectBuild({buildId:b.id,revision:b.revision,xml:b.xml}),build);assert.equal(copy.skills[0].selectedMode,2);
  await manage('스킬','삭제');await poll(current,b=>parseBuild(b.xml).skillSets.length===1);
  report.passed.push('skill set copy, rename and deletion preserve copied native mode metadata and original set');
  for(const [view,name,key] of [['장비','장비','itemSets'],['패시브','패시브','trees'],['전투 조건','전투 조건','configs']]){
    await page.getByRole('button',{name:view,exact:true}).click();await manage(name,'복사',name+' copy');await poll(current,b=>parseBuild(b.xml)[key].length===2);
    if(key==='trees'){await page.getByLabel('패시브 세트',{exact:true}).selectOption('2');await poll(current,b=>parseBuild(b.xml).trees.find(tree=>tree.active)?.id==='2');}
    await manage(name,'삭제');await poll(current,b=>parseBuild(b.xml)[key].length===1);
  }
  report.passed.push('item, tree and config set controls edit and remove independent copies with stable active selection');
  await page.getByRole('button',{name:'노트',exact:true}).click();const note='^xFF0000Synthetic 한글 <&>\n\tline2';await page.getByLabel('PoB 노트',{exact:true}).fill(note);build=await poll(current,b=>parseBuild(b.xml).notes===note);
  await page.getByRole('button',{name:'되돌리기',exact:true}).click();await poll(current,b=>parseBuild(b.xml).notes==='');
  await page.getByLabel('PoB 노트',{exact:true}).fill(note);const saved=await poll(current,b=>parseBuild(b.xml).notes===note&&b.calculation?.revision===b.revision);
  report.passed.push('notes preserve literal colour codes, Korean and XML-special characters, with undo');
  for(const [width,height] of [[1920,1080],[1024,768]]){await app.evaluate(({BrowserWindow},size)=>BrowserWindow.getAllWindows()[0].setContentSize(...size),[width,height]);for(const view of ['스킬','전투 조건','노트']){await page.getByRole('button',{name:view,exact:true}).click();if(view==='전투 조건')await page.getByText('현재 리비전의 원본 컨트롤',{exact:true}).waitFor();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(directory,view+'-'+width+'.png')});}}
  await app.close();app=undefined;await launch();build=await current();assert.equal(build.xml,saved.xml);assert.equal(build.originalXml,saved.originalXml);assert.equal(build.revision,saved.revision);assert.equal((await page.evaluate(()=>window.pok.getPokConnection())).connected,false);
  report.passed.push('sets, native options and notes survive restart; all new screens fit both desktop sizes');
  await page.getByRole('button',{name:'새 빌드',exact:true}).first().click();const second=await poll(current,b=>b.id!==saved.id);
  await page.getByRole('button',{name:'새 빌드',exact:true}).first().click();const third=await poll(current,b=>b.id!==second.id);
  await page.getByRole('button',{name:'노트',exact:true}).click();await page.getByLabel('PoB 노트',{exact:true}).fill('FAST OWNER TRIAL');
  await page.getByLabel('현재 빌드',{exact:true}).selectOption(second.id);await poll(()=>page.getByLabel('PoB 노트',{exact:true}).inputValue(),value=>value==='');
  assert.equal(parseBuild((await current()).xml).notes,'');report.passed.push('automatic note edits remain scoped to their original owner with identical saved notes');
  await page.getByRole('button',{name:'장비',exact:true}).click();await page.getByRole('button',{name:'원문으로 추가',exact:true}).click();await page.getByLabel('아이템 원문',{exact:true}).fill('UNAPPLIED ITEM');
  await page.getByLabel('현재 빌드',{exact:true}).selectOption(third.id);assert.equal(await page.getByRole('dialog',{name:'아이템 원문 편집',exact:true}).count(),0);
  await page.getByRole('button',{name:'스킬',exact:true}).click();await page.getByRole('button',{name:'스킬 그룹 추가',exact:true}).click();await poll(current,b=>parseBuild(b.xml).skillSets.find(s=>s.active).groups.length===1);
  await page.getByLabel('현재 빌드',{exact:true}).selectOption(second.id);await page.getByRole('button',{name:'스킬 그룹 추가',exact:true}).click();await poll(current,b=>b.revision===1);
  await page.getByLabel('그룹 이름',{exact:true}).fill('UNAPPLIED GROUP');await page.getByLabel('현재 빌드',{exact:true}).selectOption(third.id);assert.equal(await page.getByLabel('그룹 이름',{exact:true}).inputValue(),'새 스킬 그룹');
  await page.getByRole('button',{name:'전투 조건',exact:true}).click();await page.getByLabel('캐릭터 직업',{exact:true}).selectOption({label:'Ranger'});await page.getByLabel('현재 빌드',{exact:true}).selectOption(second.id);await poll(()=>page.getByLabel('캐릭터 직업',{exact:true}).evaluate(select=>select.selectedOptions[0]?.textContent),value=>value==='Witch');
  await page.getByRole('button',{name:'패시브',exact:true}).click();const advanced=page.locator('details').filter({has:page.getByLabel('패시브 노드 ID',{exact:true})});await advanced.locator('summary').click();await page.getByLabel('패시브 노드 ID',{exact:true}).fill('123456');await page.getByLabel('현재 빌드',{exact:true}).selectOption(third.id);const otherAdvanced=page.locator('details').filter({has:page.getByLabel('패시브 노드 ID',{exact:true})});if(!await otherAdvanced.evaluate(e=>e.open))await otherAdvanced.locator('summary').first().click();assert.equal(await page.getByLabel('패시브 노드 ID',{exact:true}).inputValue(),'');
  report.passed.push('unapplied item, group, character and tree drafts remain scoped to the document when XML is identical');
})().catch(async error=>{report.error=error.stack;process.exitCode=1;if(page)await page.screenshot({path:path.join(directory,'failure.png')}).catch(()=>{});}).finally(async()=>{if(app)await app.close();fs.writeFileSync(path.join(directory,'result.json'),JSON.stringify(report,null,2));console.log(directory);if(report.error)console.error(report.error);});
