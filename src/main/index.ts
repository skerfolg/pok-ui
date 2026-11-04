import {tradeSearchUrl} from './trade-search';
import {BuildFileStore} from './build-file-store';
import { app, BrowserWindow, dialog, ipcMain, nativeTheme, shell, screen, protocol,clipboard } from 'electron';
import { readFile, writeFile, rename, mkdir, stat } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import type { AppState, AgentRequest, Settings, BuildDocument, ConnectionInfo } from '../shared/contracts';
import { createDefaultState } from '../shared/state';
import { StateStore, validateState } from './storage';
import { importDocument, exportDocument, validateBuild } from './pob-files';
import { PokConnection, assertDesktopContract, assertRuntimeIdentity, effectivePokSettings } from './pok';
import { GameDataStore, GameDataError } from './game-data';
import type { DataBundleInfo, ItemRenderRequest } from '../shared/game-data';
import type { BuildProposalDraft } from '../shared/contracts';
import { parseBuild } from '../shared/pob-document';
import { BuildProposals, xmlHash } from './build-proposals';
import { AgentManager } from './agent';
import { TreeResourceError } from './passive-tree';
import { ChatImageStore, MAX_CHAT_IMAGES, MAX_CHAT_IMAGE_BYTES } from './chat-images';
import { applyWindowChrome, windowChromeOptions } from './window-chrome';
import { PobRuntime } from './pob-runtime';
import { PobEditorData } from './pob-editor-data';

protocol.registerSchemesAsPrivileged(['pok-tree','pok-image'].map(scheme=>({scheme,privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true}})));

let window:BrowserWindow|undefined;
let store:StateStore;
let state:AppState;
const pok=new PokConnection();
let connectionInfo:ConnectionInfo={connected:false,managed:app.isPackaged};
let connectionTask:Promise<ConnectionInfo>|undefined;
let agent:AgentManager;
let gameData:GameDataStore;
let pobRuntime:PobRuntime;
let pobDetailRuntime:PobRuntime;
let pobSourceGeneration=0;
let editorData:PobEditorData;
let chatImages:ChatImageStore;
let bundleInfo:DataBundleInfo = {status:'missing'};
const proposals=new BuildProposals();
let quitting=false;
const dataOverride=process.env.POK_UI_DATA_DIR;
if(dataOverride){
  if(!isAbsolute(dataOverride))throw new Error('POK_UI_DATA_DIR는 절대 경로여야 합니다.');
  mkdirSync(dataOverride,{recursive:true});
  app.setPath('userData',dataOverride);
}
const writes=new Set<Promise<unknown>>();
const renderer=resolve(__dirname,'../renderer/index.html');
const preload=resolve(__dirname,'../preload/index.cjs');
const developmentUrl=!app.isPackaged?process.env.POK_RENDERER_URL:undefined;
if(developmentUrl){
  const url=new URL(developmentUrl);
  if(url.protocol!=='http:'||!['127.0.0.1','localhost'].includes(url.hostname))throw new Error('개발 렌더러는 로컬 HTTP 주소만 허용합니다.');
}
function track<T>(operation:Promise<T>):Promise<T>{
  writes.add(operation);void operation.finally(()=>writes.delete(operation)).catch(()=>undefined);return operation;
}
function senderAllowed(event:Electron.IpcMainInvokeEvent):boolean{
  if(!window||event.sender!==window.webContents||event.senderFrame!==window.webContents.mainFrame)return false;
  const url=event.senderFrame.url;
  if(developmentUrl)return new URL(url).origin===new URL(developmentUrl).origin;
  return url.split(/[?#]/)[0]===pathToFileURL(renderer).href;
}
function handle(channel:string,handler:(...args:any[])=>unknown):void{
  ipcMain.handle(channel,(event,...args)=>{
    if(!senderAllowed(event))throw new Error('허용되지 않은 창의 요청입니다.');
    return handler(...args);
  });
}
function text(value:unknown,limit:number,name:string):asserts value is string{
  if(typeof value!=='string'||value.length>limit)throw new Error(name+' 형식이 올바르지 않습니다.');
}
function record(value:unknown):asserts value is Record<string,unknown>{
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('객체 인자가 필요합니다.');
}
function settings(value:unknown):asserts value is Settings['pok']{
  record(value);
  if(!['checkout','bundled'].includes(String(value.mode)))throw new Error('POK 연결 방식이 올바르지 않습니다.');
  for(const key of ['root','python','luajit'])text(value[key],32_768,key);
  if(value.autoConnect!==undefined&&typeof value.autoConnect!=='boolean')throw new Error('PoK 자동 연결 설정이 올바르지 않습니다.');
}
function applyTheme():void{nativeTheme.themeSource=state.settings.theme;if(window&&!window.isDestroyed())applyWindowChrome(window,nativeTheme.shouldUseDarkColors);}
function bundledRuntimeRoot():string{return app.isPackaged?join(process.resourcesPath,'pok-runtime'):join(app.getAppPath(),'resources','pok-runtime');}
function dataRoot():string{
  if(!app.isPackaged&&process.env.POK_UI_RESOURCE_DIR){
    if(!isAbsolute(process.env.POK_UI_RESOURCE_DIR))throw new Error('개발 리소스 폴더는 절대 경로여야 합니다.');
    return process.env.POK_UI_RESOURCE_DIR;
  }
  return app.isPackaged?process.resourcesPath:join(app.getAppPath(),'resources');
}
async function verifiedContext() {
  bundleInfo = await gameData.getInfo();
  if (bundleInfo.status !== 'ready' || !bundleInfo.identity || !bundleInfo.bundleId) throw new Error(bundleInfo.error || '검증된 게임 데이터 묶음이 필요합니다.');
  return { bundleId: bundleInfo.bundleId, identity: bundleInfo.identity };
}
function assertBuildVersion(build:BuildDocument):void {
  const parsed=parseBuild(build.xml);
  const active=parsed.trees.find(t=>t.active)??parsed.trees[0];
  if(!active?.version || active.version!==bundleInfo.defaultTreeVersion) throw new Error('이 빌드의 트리 버전은 현재 계산 묶음에서 지원하지 않습니다. 원본은 보존됩니다.');
}
function publishConnection(info:ConnectionInfo):ConnectionInfo {
  connectionInfo={...info,managed:app.isPackaged};
  if(window&&!window.isDestroyed())window.webContents.send('pok:connection',connectionInfo);
  return connectionInfo;
}
function connectEngine(requested:Settings['pok']):Promise<ConnectionInfo> {
  if(quitting)return Promise.resolve({connected:false,managed:app.isPackaged});
  if(connectionTask)return connectionTask;
  const selected=effectivePokSettings(requested,app.isPackaged),sourceGeneration=pobSourceGeneration;
  publishConnection({connected:false,connecting:true});
  proposals.clear();agent?.invalidateContext();
  connectionTask=(async()=>{
    try {
      const context=await verifiedContext();
      const sourceProof=await pobRuntime.sourceProof();
      await gameData.verifyStandalonePob(sourceProof,selected.mode==='checkout'?selected.root:undefined);
      const launch=selected.mode==='bundled'?await gameData.getLaunchDescriptor():undefined;
      if(quitting)return {connected:false,managed:app.isPackaged};
      const result=await pok.connect(selected,bundledRuntimeRoot(),join(app.getPath('userData'),'engine'),join(app.getPath('userData'),'cache','pok'),launch);
      if(!result.connected)return publishConnection({...result,connecting:false,compatibility:result.compatibility??'engine-unavailable'});
      assertDesktopContract(result.info,pok.tools);
      assertRuntimeIdentity((result.info as Record<string,unknown>)?.identity,context.identity);
      const editor=await pobRuntime.getInfo();
      if(sourceGeneration!==pobSourceGeneration||editor.status!=='ready'||editor.runtimeId!==sourceProof.runtimeId||editor.commit!==context.identity.pob.commit)throw new Error('연결 확인 중 독립 PoB 출처 또는 준비 상태가 변경되었습니다. 다시 확인해 주세요.');
      pok.bindIdentity(context.identity);
      return publishConnection({...result,...context,connecting:false,compatibility:'ready'});
    } catch(error) {
      await pok.close();
      return publishConnection({connected:false,connecting:false,compatibility:'incompatible',error:String(error)});
    }
  })().finally(()=>{connectionTask=undefined;});
  return connectionTask;
}
pok.onDisconnected=error=>{if(!quitting)publishConnection({connected:false,connecting:false,compatibility:'engine-unavailable',error});};
function registerIpc():void{
  const buildFiles=new BuildFileStore(dirname(store.path));
  handle('pok:load-state',()=>state);
  handle('pok:load-passive-tree',(version:unknown)=>{text(version,30,'트리 버전');return editorData.loadTree(version);});
  handle('pok:save-state',async(value:unknown)=>{
    validateState(value);
    value.settings.pok=effectivePokSettings(value.settings.pok,app.isPackaged);
    await track(store.save(value));
    state=value;applyTheme();
  });
  handle('pok:import-build',async()=>{
    const selected=await dialog.showOpenDialog(window!,{title:'빌드 가져오기',properties:['openFile'],
      filters:[{name:'POK / Path of Building',extensions:['xml','pob','txt','json']}]});
    if(selected.canceled||!selected.filePaths[0])return null;
    const path=selected.filePaths[0];
    if((await stat(path)).size>64*1024*1024)throw new Error('가져오기 파일은 64 MB 이하여야 합니다.');
    const document=importDocument(path,await readFile(path,'utf8'));
    return document;
  });
  handle('pok:open-trade-search',async(value:unknown)=>{await shell.openExternal(tradeSearchUrl(value));});
  handle('pok:copy-text',async(value:unknown)=>{text(value,65536,'복사할 텍스트');await clipboard.writeText(value);});
  handle('pok:save-build',async(value:unknown,saveAs:unknown)=>{
    validateBuild(value);if(saveAs!==undefined&&typeof saveAs!=='boolean')throw new Error('저장 요청이 올바르지 않습니다.');
    return track(buildFiles.save(value,async()=>{
      const selected=await dialog.showSaveDialog(window!,{title:saveAs?'다른 이름으로 저장':'빌드 저장',defaultPath:value.name.replace(/[<>:"/\\|?*\x00-\x1F]/g,'-')+'.xml',filters:[{name:'Path of Building XML',extensions:['xml']}]});
      return selected.canceled?undefined:selected.filePath;
    },Boolean(saveAs)));
  });
  handle('pok:export-build',async(value:unknown,format:unknown)=>{
    validateBuild(value);
    if(!['xml','pob','json'].includes(String(format)))throw new Error('지원하지 않는 형식입니다.');
    const extension=format as 'xml'|'pob'|'json';
    const selected=await dialog.showSaveDialog(window!,{title:'빌드 내보내기',defaultPath:value.name.replace(/[<>:"/\\|?*\x00-\x1F]/g,'-')+'.'+extension,
      filters:[{name:extension==='json'?'POK 편집 문서':'Path of Building',extensions:[extension]}]});
    if(selected.canceled||!selected.filePath)return null;
    const path=selected.filePath;
    const temp=path+'.'+randomUUID()+'.tmp';
    await track((async()=>{await writeFile(temp,exportDocument(value,extension),{encoding:'utf8',flush:true});await rename(temp,path);})());
    return path;
  });
  handle('pok:connect',async(value:unknown)=>{
    settings(value);
    return connectEngine(value);
  });
  handle('pok:connection',()=>connectionInfo);
  handle('pok:call',async(name:unknown,args:unknown)=>{
    text(name,120,'도구 이름');record(args);
    if(Buffer.byteLength(JSON.stringify(args))>32*1024*1024)throw new Error('도구 인자가 너무 큽니다.');
    return pok.call(name,args);
  });
  handle('pok:data-bundle-info',()=>editorData.getInfo());
  handle('pok:pob-runtime-info',()=>pobRuntime.getInfo());
  handle('pok:cancel-pob-request',(id:unknown)=>{text(id,128,'PoB 요청 ID');return pobRuntime.cancel(id)||pobDetailRuntime.cancel(id);});
  handle('pok:equipment',(request:unknown)=>{
    record(request);text(request.buildId,128,'빌드 ID');text(request.xml,12*1024*1024,'빌드 XML');
    if(!Number.isSafeInteger(request.revision)||Number(request.revision)<0)throw new Error('장비 리비전이 올바르지 않습니다.');
    if(request.runtimeId!==undefined)text(request.runtimeId,128,'장비 런타임');if(request.requestId!==undefined)text(request.requestId,128,'PoB 요청 ID');
    if(request.action!==undefined&&!['equip','weapon'].includes(String(request.action)))throw new Error('장비 작업이 올바르지 않습니다.');
    if(request.weaponSet!==undefined&&![1,2].includes(request.weaponSet as number))throw new Error('활성 무기 세트가 올바르지 않습니다.');
    if(request.slot!==undefined)text(request.slot,128,'장비 슬롯');if(request.itemId!==undefined)text(request.itemId,128,'장비 아이템');
    return pobRuntime.equipment(request as unknown as import('../shared/pob-equipment').PobEquipmentRequest);
  });
  handle('pok:item-tooltip',(request:unknown)=>{
    record(request);text(request.buildId,128,'빌드 ID');text(request.xml,12*1024*1024,'빌드 XML');text(request.itemId,128,'아이템 ID');text(request.runtimeId,128,'아이템 비교 런타임');
    if(!Number.isSafeInteger(request.revision)||Number(request.revision)<0)throw new Error('아이템 비교 리비전이 올바르지 않습니다.');
    if(request.slot!==undefined)text(request.slot,128,'아이템 비교 슬롯');
    if(request.nodeId!==undefined&&(!Number.isSafeInteger(request.nodeId)||Number(request.nodeId)<0))throw new Error('주얼 비교 소켓이 올바르지 않습니다.');
    if(request.nodeId!==undefined&&request.slot!==undefined)throw new Error('비교 위치를 하나만 선택해 주세요.');
    if(request.prefetch!==undefined&&typeof request.prefetch!=='boolean')throw new Error('미리 읽기 요청이 올바르지 않습니다.');
    return pobDetailRuntime.itemTooltip(request as unknown as import('../shared/pob-item-tooltip').PobItemTooltipRequest);
  });
  handle('pok:item-controls',async(request:unknown)=>{
    record(request);text(request.buildId,128,'빌드 ID');text(request.xml,12*1024*1024,'빌드 XML');text(request.itemId,128,'아이템 ID');
    if(!Number.isSafeInteger(request.revision)||Number(request.revision)<0)throw new Error('아이템 편집 리비전이 올바르지 않습니다.');
    if(request.runtimeId!==undefined)text(request.runtimeId,128,'아이템 런타임');
    if(request.draftText!==undefined)text(request.draftText,1024*1024,'검토 아이템 원문');
    if(request.field!==undefined)text(request.field,100,'원본 아이템 컨트롤');
    if(request.slot!==undefined)text(request.slot,128,'장착 슬롯');
    if(request.requestId!==undefined)text(request.requestId,128,'PoB 요청 ID');
    if(request.similar!==undefined){
      record(request.similar);if(request.field!==undefined||request.popup!==undefined)throw new Error('검색과 아이템 변경을 함께 요청할 수 없습니다.');
      if(request.similar.league!==undefined){text(request.similar.league,256,'리그 이름');if(!String(request.similar.league).trim()||/[\r\n\x00]/.test(String(request.similar.league)))throw new Error('리그 이름이 올바르지 않습니다.');}
      if(request.similar.selections!==undefined){record(request.similar.selections);if(Object.keys(request.similar.selections).length>256)throw new Error('검색 조건이 너무 많습니다.');for(const [key,value]of Object.entries(request.similar.selections)){if(key.length>100||typeof value!=='boolean'&&!(typeof value==='string'&&value.length<=100)&&!(typeof value==='number'&&Number.isSafeInteger(value)))throw new Error('검색 조건 값이 올바르지 않습니다.');}}
    }
    if(request.popup!==undefined){
      record(request.popup);if(!['anoint','corrupt','add'].includes(String(request.popup.kind)))throw new Error('아이템 팝업 종류가 올바르지 않습니다.');
      if(request.popup.slot!==undefined&&(!Number.isSafeInteger(request.popup.slot)||Number(request.popup.slot)<1||Number(request.popup.slot)>4))throw new Error('성유 위치가 올바르지 않습니다.');
      if(request.popup.nodeId!==undefined&&(!Number.isSafeInteger(request.popup.nodeId)||Number(request.popup.nodeId)<0))throw new Error('성유 노드가 올바르지 않습니다.');
      if(request.popup.query!==undefined)text(request.popup.query,512,'성유 검색');
      if(request.popup.mode!==undefined&&!['enchants','rolls'].includes(String(request.popup.mode)))throw new Error('오염 모드가 올바르지 않습니다.');
      if(request.popup.commit!==undefined&&typeof request.popup.commit!=='boolean')throw new Error('팝업 적용 값이 올바르지 않습니다.');
      if(request.popup.selections!==undefined){record(request.popup.selections);if(Object.keys(request.popup.selections).length>128)throw new Error('팝업 선택이 너무 많습니다.');for(const [key,value] of Object.entries(request.popup.selections)){if(key.length>100||typeof value!=='boolean'&&!(typeof value==='string'&&value.length<=1024)&&!(typeof value==='number'&&Number.isFinite(value)))throw new Error('팝업 선택 값이 올바르지 않습니다.');}}
    }
    // Native affix series keys contain every tier ID and can exceed a text field's limit.
    // The original control applies its own text/option constraints after this transport bound.
    if(request.value!==undefined&&(typeof request.value!=='string'||request.value.length>16384)&&(typeof request.value!=='number'||!Number.isFinite(request.value)))throw new Error('아이템 컨트롤 값이 올바르지 않습니다.');
    return (request.similar?pobDetailRuntime:pobRuntime).itemControls({...request as unknown as import('../shared/pob-item-controls').PobItemControlsRequest,buildId:request.buildId,revision:Number(request.revision),xml:request.xml,itemId:request.itemId});
  });
  handle('pok:edit-tree',async(request:unknown)=>{
    record(request);text(request.buildId,128,'빌드 ID');text(request.xml,12*1024*1024,'빌드 XML');
    if(!Number.isSafeInteger(request.revision)||Number(request.revision)<0)throw new Error('트리 리비전이 올바르지 않습니다.');
    for(const key of ['nodeId','attributeIndex','jewelItemId','classId','ascendancyId'] as const)if(request[key]!==undefined&&(!Number.isSafeInteger(request[key])||Number(request[key])<0))throw new Error('트리 선택이 올바르지 않습니다.');
    if(request.allocMode!==undefined&&![0,1,2].includes(Number(request.allocMode)))throw new Error('트리 무기 모드가 올바르지 않습니다.');
    if(request.action!==undefined&&!['allocate','deallocate','attribute','jewel','character'].includes(String(request.action)))throw new Error('트리 연산이 올바르지 않습니다.');
    if(request.classChoice!==undefined&&!['reset','connect'].includes(String(request.classChoice)))throw new Error('직업 변경 선택이 올바르지 않습니다.');
    if(request.runtimeId!==undefined)text(request.runtimeId,128,'트리 런타임');
    return pobRuntime.tree({...request as unknown as import('../shared/pob-tree').PobTreeRequest,buildId:request.buildId,revision:Number(request.revision),xml:request.xml});
  });
  handle('pok:read-loadouts',async(request:unknown)=>{
    record(request);text(request.buildId,128,'빌드 ID');text(request.xml,12*1024*1024,'빌드 XML');
    if(!Number.isSafeInteger(request.revision)||Number(request.revision)<0)throw new Error('통합 구성 리비전이 올바르지 않습니다.');
    if(request.runtimeId!==undefined)text(request.runtimeId,128,'PoB 런타임');if(request.requestId!==undefined)text(request.requestId,128,'PoB 요청 ID');if(request.name!==undefined)text(request.name,4096,'원본 통합 구성 이름');
    if(request.treeWorkspace!==undefined){record(request.treeWorkspace);const operation=request.treeWorkspace;
      if(request.manage!==undefined||request.name!==undefined||!['inspect','initialize','convert','convert-all','adopt','import-code','export-code'].includes(String(operation.action)))throw new Error('원본 트리 작업이 올바르지 않습니다.');
      if(operation.code!==undefined)text(operation.code,65536,'트리 코드');
      if(operation.version!==undefined){text(operation.version,40,'트리 버전');if(!/^\d+_\d+$/.test(operation.version))throw new Error('트리 버전 형식이 올바르지 않습니다.');}
      if(operation.mode!==undefined&&!['replace','copy'].includes(String(operation.mode)))throw new Error('트리 변환 방식이 올바르지 않습니다.');
      for(const key of ['classId','ascendancyId'])if(operation[key]!==undefined&&(!Number.isSafeInteger(operation[key])||Number(operation[key])<0))throw new Error('원본 직업 선택이 올바르지 않습니다.');
      if(operation.title!==undefined)text(operation.title,4096,'초기 트리 이름');
    }
    if(request.manage!==undefined){record(request.manage);const operation=request.manage;
      if(!['new','copy','rename','delete','custom','reorder'].includes(String(operation.action)))throw new Error('통합 구성 관리 연산이 올바르지 않습니다.');
      if(operation.scope!==undefined&&!['tree','loadout'].includes(String(operation.scope)))throw new Error('원본 순서 변경 범위가 올바르지 않습니다.');
      for(const key of ['index','position'])if(operation[key]!==undefined&&(!Number.isSafeInteger(operation[key])||Number(operation[key])<1))throw new Error('원본 관리 목록 위치가 올바르지 않습니다.');
      if(operation.title!==undefined)text(operation.title,4096,'원본 구성 이름');
      if(operation.treeId!==undefined){text(operation.treeId,128,'원본 트리 ID');if(!/^[1-9]\d*$/.test(operation.treeId)||operation.scope!=='tree'||operation.index!==undefined||operation.sourceName!==undefined)throw new Error('원본 트리 관리 출처가 올바르지 않습니다.');}
      for(const key of ['sourceName','nextName'])if(operation[key]!==undefined)text(operation[key],4096,'원본 구성 이름');
      if(operation.sourceName!==undefined&&operation.index!==undefined)throw new Error('통합 구성 관리 대상의 출처가 둘 이상입니다.');
      if(operation.sources!==undefined){record(operation.sources);for(const key of ['tree','items','skills','config'])text(operation.sources[key],128,'원본 복사 세트');}
    }
    return pobRuntime.loadouts(request as unknown as import('../shared/pob-loadouts').PobLoadoutsRequest);
  });
  handle('pok:read-party',async(request:unknown)=>{
    record(request);text(request.buildId,128,'빌드 ID');text(request.xml,12*1024*1024,'빌드 XML');
    if(!Number.isSafeInteger(request.revision)||Number(request.revision)<0)throw new Error('파티 리비전이 올바르지 않습니다.');
    if(request.action!==undefined&&!['read','import','clear'].includes(String(request.action)))throw new Error('파티 작업이 올바르지 않습니다.');
    if(request.supportXml!==undefined)text(request.supportXml,12*1024*1024,'지원 XML');
    if(request.destination!==undefined)text(request.destination,80,'파티 대상');
    if(request.runtimeId!==undefined)text(request.runtimeId,128,'파티 런타임');
    if(request.append!==undefined&&typeof request.append!=='boolean')throw new Error('파티 추가 모드가 올바르지 않습니다.');
    return pobRuntime.party({buildId:request.buildId,revision:Number(request.revision),xml:request.xml,action:request.action as 'read'|'import'|'clear'|undefined,supportXml:request.supportXml as string|undefined,destination:request.destination as string|undefined,runtimeId:request.runtimeId as string|undefined,append:request.append as boolean|undefined});
  });
  handle('pok:read-calcs',async(request:unknown)=>{
    record(request);text(request.buildId,128,'빌드 ID');text(request.xml,12*1024*1024,'빌드 XML');
    if(!Number.isSafeInteger(request.revision)||Number(request.revision)<0)throw new Error('계산 상세 리비전이 올바르지 않습니다.');
    if(request.cellId!==undefined){text(request.cellId,80,'계산 셀');if(!/^\d+:\d+:\d+:\d+$/.test(String(request.cellId)))throw new Error('계산 셀 식별자가 올바르지 않습니다.');}
    if(request.runtimeId!==undefined)text(request.runtimeId,128,'계산 런타임');
    if(request.prefetch!==undefined&&typeof request.prefetch!=='boolean')throw new Error('미리 읽기 요청이 올바르지 않습니다.');
    return pobDetailRuntime.calcs({prefetch:request.prefetch as boolean|undefined,buildId:request.buildId,revision:Number(request.revision),xml:request.xml,cellId:request.cellId as string|undefined,runtimeId:request.runtimeId as string|undefined});
  });
  handle('pok:inspect-build',async(request:unknown)=>{
    record(request);text(request.buildId,128,'빌드 ID');text(request.xml,12*1024*1024,'빌드 XML');
    if(!Number.isSafeInteger(request.revision)||Number(request.revision)<0)throw new Error('조회 리비전이 올바르지 않습니다.');
    return pobRuntime.inspect({buildId:request.buildId,revision:Number(request.revision),xml:request.xml});
  });
  handle('pok:query-pob-catalog',async(query:unknown)=>{
    record(query);
    if(query.query!==undefined)text(query.query,512,'검색어');
    if(query.category!==undefined)text(query.category,128,'분류');
    if(query.type!==undefined)text(query.type,32,'카탈로그 유형');
    for(const key of ['offset','limit'] as const)
      if(query[key]!==undefined&&(!Number.isSafeInteger(query[key])||Number(query[key])<0))throw new Error(`${key} 값이 올바르지 않습니다.`);
    return editorData.query(query);
  });
  handle('pok:get-pob-catalog-entry',async(type:unknown,id:unknown)=>{text(type,32,'카탈로그 유형');text(id,512,'카탈로그 ID');return editorData.getEntry(type as never,id);});
  handle('pok:render-pob-item',async(request:unknown)=>{
    if(request&&typeof request==='object'&&'quality' in request)throw new Error('품질은 생성 후 원본 아이템 옵션에서 조절해 주세요.');
    record(request);text(request.kind,20,'아이템 종류');text(request.id,1000,'아이템 ID');
    if(!['base','unique','rare'].includes(String(request.kind)))throw new Error('지원하지 않는 아이템 종류입니다.');
    if(Buffer.byteLength(JSON.stringify(request))>24*1024*1024)throw new Error('아이템 요청이 너무 큽니다.');
    const context=await editorData.getInfo();if(context.status!=='ready'||!context.runtimeId)throw new Error(context.error||'독립 PoB 편집 데이터가 필요합니다.');
    await editorData.getEntry(request.kind==='unique'?'unique':'base',request.id);
    const result=await pobRuntime.renderItem(request as unknown as ItemRenderRequest,context.runtimeId);
    if(result.ok&&typeof result.text!=='string')throw new Error('아이템 원문이 누락되었습니다.');
    return result;
  });
  handle('pok:compute',async(value:unknown,scope:unknown)=>{validateBuild(value);if(scope!==undefined&&scope!=='workspace')throw new Error('계산 요청 범위가 올바르지 않습니다.');return pobRuntime.compute(value,scope as 'workspace'|undefined);});
  handle('pok:apply-build-proposal',async(id:unknown)=>{
    text(id,128,'제안 ID');
    const context=await verifiedContext();
    const proposal=proposals.get(id);
    const current=state.builds.find(b=>b.id===proposal?.buildId);
    const next=proposals.prepare(id,current,context.bundleId);
    assertBuildVersion(next);
    const nextState={...state,builds:state.builds.map(b=>b.id===next.id?next:b)};
    await track(store.save(nextState));
    state=nextState;proposals.remove(id);return next;
  });
  handle('pok:send-chat',async(value:unknown)=>{
    record(value);text(value.chatId,128,'대화 ID');text(value.prompt,2*1024*1024,'메시지');
    if(!Array.isArray(value.history))throw new Error('대화 맥락이 올바르지 않습니다.');
    const chat=state.chats.find(c=>c.id===value.chatId);
    if(!chat)throw new Error('저장된 대화를 찾지 못했습니다. 먼저 대화를 저장해 주세요.');
    if(value.providerThreadId!==undefined)text(value.providerThreadId,512,'에이전트 대화 ID');
    if(value.build){
      record(value.build);
      const requestedBuild=value.build;
      text(requestedBuild.id,128,'빌드 ID');text(requestedBuild.xml,24*1024*1024,'빌드 XML');
      const current=state.builds.find(b=>b.id===requestedBuild.id);
      if(!current||current.revision!==requestedBuild.revision||current.xml!==requestedBuild.xml)throw new Error('저장된 빌드와 요청한 빌드가 다릅니다. 먼저 변경을 저장해 주세요.');
    }
    const request=value as unknown as AgentRequest;
    if(request.build){
      const context=await verifiedContext();
      request.build={...request.build,xmlSha256:xmlHash(request.build.xml),bundleId:context.bundleId};
    }
    // Renderer cannot substitute another conversation's native thread ID.
    if(request.providerThreadId&&request.providerThreadId!==chat.providerThreadId)throw new Error('대화 ID가 저장 내용과 일치하지 않습니다.');
    if(request.images!==undefined&&(!Array.isArray(request.images)||request.images.length>MAX_CHAT_IMAGES))throw new Error('이미지는 최대 4장까지 첨부할 수 있습니다.');
    const attachments=await Promise.all((request.images??[]).map(async image=>{text(image?.id,64,'이미지 ID');return chatImages.get(image.id);}));
    request.images=attachments.map(attachment=>attachment.image);
    if(!request.prompt.trim()&&!attachments.length)throw new Error('메시지 또는 이미지를 입력해 주세요.');
    try{await agent.send(request,state.settings.agent,attachments.map(attachment=>attachment.path));}
    catch(error){proposals.finishChat(request.chatId,false);throw error;}
  });
  handle('pok:agent-models',()=>agent.listModels(state.settings.agent));
  handle('pok:pick-chat-images',async()=>{
    const picked=await dialog.showOpenDialog(window!,{title:'이미지 첨부',properties:['openFile','multiSelections'],filters:[{name:'이미지',extensions:['png','jpg','jpeg','webp','gif']}]});
    if(picked.canceled)return [];
    if(picked.filePaths.length>MAX_CHAT_IMAGES)throw new Error('이미지는 최대 4장까지 첨부할 수 있습니다.');
    return Promise.all(picked.filePaths.map(async path=>{
      if((await stat(path)).size>MAX_CHAT_IMAGE_BYTES)throw new Error('이미지는 한 장당 4 MB 이하여야 합니다.');
      return chatImages.add(path,await readFile(path));
    }));
  });
  handle('pok:add-chat-image',async(value:unknown)=>{record(value);text(value.name,1024,'이미지 이름');text(value.dataUrl,6*1024*1024,'이미지');return chatImages.addDataUrl(value.name,value.dataUrl);});
  handle('pok:answer-agent-question',async(id:unknown,answers:unknown)=>{text(id,512,'질문 ID');record(answers);return agent.answerQuestion(id,answers as Record<string,string[]>);});
  handle('pok:cancel-chat',async(chatId:unknown)=>{text(chatId,128,'대화 ID');await agent.cancel(chatId);});
  handle('pok:resolve-approval',async(id:unknown,decision:unknown)=>{
    text(id,128,'요청 ID');
    if(decision!=='accept'&&decision!=='decline')throw new Error('승인 결정이 올바르지 않습니다.');
    await agent.resolveApproval(id,decision);
  });
  handle('pok:open-data',async()=>{const error=await shell.openPath(store.directory);if(error)throw new Error(error);});
  handle('pok:select-path',async(kind:unknown)=>{
    if(kind!=='directory'&&kind!=='executable')throw new Error('선택 형식이 올바르지 않습니다.');
    const selected=await dialog.showOpenDialog(window!,{properties:kind==='directory'?['openDirectory']:['openFile'],
      ...(kind==='executable'&&process.platform==='win32'?{filters:[{name:'실행 파일',extensions:['exe']}]}:{})});
    return selected.canceled?null:selected.filePaths[0]||null;
  });
}
function createWindow():void{
  const workArea=screen.getPrimaryDisplay().workAreaSize;
  window=new BrowserWindow({width:Math.min(1920,workArea.width),height:Math.min(1080,workArea.height),minWidth:860,minHeight:620,title:'POK',backgroundColor:'#18191c',show:false,
    ...windowChromeOptions(nativeTheme.shouldUseDarkColors),
    webPreferences:{preload,contextIsolation:true,sandbox:true,nodeIntegration:false,webSecurity:true,
      allowRunningInsecureContent:false,webviewTag:false,devTools:!app.isPackaged}});
  applyWindowChrome(window,nativeTheme.shouldUseDarkColors);
  const contents=window.webContents;
  contents.setWindowOpenHandler(()=>({action:'deny'}));
  contents.on('will-navigate',event=>event.preventDefault());
  contents.on('will-redirect',event=>event.preventDefault());
  contents.on('will-attach-webview',event=>event.preventDefault());
  contents.session.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
  contents.session.setPermissionCheckHandler(()=>false);
  contents.session.on('will-download',event=>event.preventDefault());
  const csp=[
    "default-src 'self'",
    "script-src 'self'"+(developmentUrl?" 'unsafe-inline'":''),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: pok-tree: pok-image:",
    "font-src 'self' data:",
    developmentUrl?"connect-src 'self' ws://127.0.0.1:* ws://localhost:*":"connect-src 'none'",
    "object-src 'none'","base-uri 'none'","frame-ancestors 'none'","form-action 'none'"
  ].join('; ');
  contents.session.webRequest.onHeadersReceived((details,callback)=>callback({responseHeaders:{...details.responseHeaders,'Content-Security-Policy':[csp]}}));
  window.once('ready-to-show',()=>window?.show());
  window.on('closed',()=>{window=undefined;});
  void (developmentUrl?window.loadURL(developmentUrl):window.loadFile(renderer));
}
void app.whenReady().then(async()=>{
  chatImages=new ChatImageStore(join(app.getPath('userData'),'chat-images'));
  protocol.handle('pok-image',async request=>{
    if(request.method!=='GET')return new Response(null,{status:405});
    const match=/^pok-image:\/\/attachment\/([a-f0-9]{64})$/.exec(request.url);
    if(!match)return new Response('잘못된 이미지 경로입니다.',{status:400});
    try{const stored=await chatImages.get(match[1]);return new Response(new Uint8Array(stored.bytes),{headers:{'Content-Type':stored.image.mimeType,'Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff'}});}
    catch{return new Response('이미지를 읽을 수 없습니다.',{status:404});}
  });
  app.setAppUserModelId('dev.pok.desktop');
  gameData=new GameDataStore(dataRoot(),{allowCheckout:!app.isPackaged});
  pobRuntime=new PobRuntime(join(dataRoot(),'pob-runtime'),120_000,()=>{
    pobSourceGeneration++;pobDetailRuntime?.close();proposals.clear();agent?.invalidateContext();
    if(connectionInfo.connected||connectionInfo.connecting)void pok.close().finally(()=>{if(!quitting)publishConnection({connected:false,connecting:false,compatibility:'incompatible',error:'독립 PoB 출처가 변경되어 선택 PoK 연결을 해제했습니다. 출처를 확인한 뒤 다시 연결해 주세요.'});}).catch(()=>{});
    if(window&&!window.isDestroyed())window.webContents.send('pok:pob-runtime-invalidated');
  });
  pobDetailRuntime=new PobRuntime(join(dataRoot(),'pob-runtime'),120_000);
  editorData=new PobEditorData(join(dataRoot(),'pob-editor'),pobRuntime);
  // Show the workspace while the immutable bundle is checked; editing gates await getInfo().
  void gameData.getInfo().then(info=>{bundleInfo=info;});
  protocol.handle('pok-tree',async request=>{
    if(request.method!=='GET')return new Response(null,{status:405,headers:{Allow:'GET'}});
    try{
      const asset=await editorData.asset(request.url);
      return new Response(asset.body,{headers:{'Content-Type':asset.mime,'Cache-Control':'private, max-age=3600','Access-Control-Allow-Origin':'*','X-Content-Type-Options':'nosniff'}});
    }catch(error){
      return new Response((error instanceof TreeResourceError||error instanceof GameDataError)?error.message:'패시브 트리 이미지를 읽지 못했습니다.',{status:(error instanceof TreeResourceError||error instanceof GameDataError)?error.status:404});
    }
  });
  const dataDirectory=join(app.getPath('userData'),'workspace');
  store=new StateStore(dataDirectory,()=>{
    const fresh=createDefaultState();
    const sibling=resolve(dirname(app.getAppPath()),'poe2-ai-wiki');
    const hasBundle=existsSync(join(bundledRuntimeRoot(),'resources','runtime-manifest.json'));
    if(!app.isPackaged&&!hasBundle&&existsSync(join(sibling,'src','pok'))&&existsSync(join(sibling,'knowledge'))){
      fresh.settings.pok.root=sibling;
      fresh.settings.pok.mode='checkout';
      const python=join(sibling,'.venv',process.platform==='win32'?'Scripts/python.exe':'bin/python');
      if(existsSync(python))fresh.settings.pok.python=python;
    }
    return fresh;
  });
  try{state=await store.load();state.settings.pok=effectivePokSettings(state.settings.pok,app.isPackaged);}
  catch(error){
    const result=await dialog.showMessageBox({type:'error',title:'POK 저장 파일 오류',message:String(error),
      detail:'기존 데이터는 덮어쓰지 않습니다. 데이터 폴더를 확인한 후 앱을 다시 실행해 주세요.',
      buttons:['데이터 폴더 열기','닫기']});
    if(result.response===0)await shell.openPath(dataDirectory);
    app.quit();return;
  }
  await mkdir(join(dataDirectory,'agent-workspace'),{recursive:true});
  agent=new AgentManager(pok,event=>{
    if(event.type==='error'||event.type==='completed')proposals.finishChat(event.chatId,event.type==='completed'&&event.finishReason!=='cancelled'&&event.finishReason!=='error');
    if(event.type==='build-proposal'){
      const draft=event.details as BuildProposalDraft;
      event={...event,details:proposals.register(draft,state.builds.find(b=>b.id===draft.buildId),bundleInfo.bundleId||'',event.chatId)};
    }
    if(window&&!window.isDestroyed())window.webContents.send('pok:agent-event',event);
  },join(dataDirectory,'agent-workspace'),gameData,{dataHome:join(app.getPath('userData'),'engine'),cacheHome:join(app.getPath('userData'),'cache','pok')});
  applyTheme();registerIpc();createWindow();
  if(state.settings.pok.autoConnect===true)void connectEngine(state.settings.pok);
  if(store.recoveryMessage)await dialog.showMessageBox(window!,{type:'warning',title:'저장 파일 복구',message:store.recoveryMessage});
}).catch(error=>{dialog.showErrorBox('POK 시작 오류',String(error));app.quit();});
app.on('activate',()=>{if(!window&&state)createWindow();});
nativeTheme.on('updated',()=>{if(window&&!window.isDestroyed())applyWindowChrome(window,nativeTheme.shouldUseDarkColors);});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
app.on('before-quit',event=>{
  if(quitting)return;
  event.preventDefault();quitting=true;
  void(async()=>{
    try{await Promise.allSettled([...writes]);await store?.flush();}
    finally{pobRuntime?.close();pobDetailRuntime?.close();agent?.close();await pok.close();app.quit();}
  })();
});
