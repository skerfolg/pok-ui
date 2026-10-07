import { app, BrowserWindow, dialog, ipcMain, nativeTheme, shell, screen, protocol } from 'electron';
import { readFile, writeFile, rename, mkdir, stat } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import type { AppState, AgentRequest, Settings, BuildDocument } from '../shared/contracts';
import { createDefaultState } from '../shared/state';
import { StateStore, validateState } from './storage';
import { importDocument, exportDocument, validateBuild } from './pob-files';
import { PokConnection } from './pok';
import { AgentManager } from './agent';
import { PassiveTreeStore, TreeResourceError } from './passive-tree';

protocol.registerSchemesAsPrivileged([{scheme:'pok-tree',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true}}]);

let window:BrowserWindow|undefined;
let store:StateStore;
let state:AppState;
const pok=new PokConnection();
let agent:AgentManager;
let passiveTrees:PassiveTreeStore;
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
}
function applyTheme():void{nativeTheme.themeSource=state.settings.theme;}
function bundledRuntimeRoot():string{return app.isPackaged?join(process.resourcesPath,'pok-runtime'):join(app.getAppPath(),'resources','pok-runtime');}
function passiveTreeRoot():string{return app.isPackaged?join(process.resourcesPath,'passive-tree'):join(app.getAppPath(),'resources','passive-tree');}
function registerIpc():void{
  handle('pok:load-state',()=>state);
  handle('pok:load-passive-tree',(version:unknown)=>passiveTrees.load(version));
  handle('pok:save-state',async(value:unknown)=>{
    validateState(value);
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
    return pok.connect(value,bundledRuntimeRoot(),join(app.getPath('userData'),'engine'),join(app.getPath('userData'),'cache','pok'));
  });
  handle('pok:call',async(name:unknown,args:unknown)=>{
    text(name,120,'도구 이름');record(args);
    if(Buffer.byteLength(JSON.stringify(args))>32*1024*1024)throw new Error('도구 인자가 너무 큽니다.');
    return pok.call(name,args);
  });
  handle('pok:compute',async(value:unknown)=>{validateBuild(value);return pok.compute(value);});
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
    // Renderer cannot substitute another conversation's native thread ID.
    if(request.providerThreadId&&request.providerThreadId!==chat.providerThreadId)throw new Error('대화 ID가 저장 내용과 일치하지 않습니다.');
    await agent.send(request,state.settings.agent);
  });
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
    webPreferences:{preload,contextIsolation:true,sandbox:true,nodeIntegration:false,webSecurity:true,
      allowRunningInsecureContent:false,webviewTag:false,devTools:!app.isPackaged}});
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
    "img-src 'self' data: pok-tree:",
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
  app.setAppUserModelId('dev.pok.desktop');
  passiveTrees=new PassiveTreeStore(passiveTreeRoot());
  protocol.handle('pok-tree',async request=>{
    if(request.method!=='GET')return new Response(null,{status:405,headers:{Allow:'GET'}});
    try{
      const asset=await passiveTrees.asset(request.url);
      return new Response(asset.body,{headers:{'Content-Type':asset.mime,'Cache-Control':'private, max-age=3600','Access-Control-Allow-Origin':'*','X-Content-Type-Options':'nosniff'}});
    }catch(error){
      return new Response(error instanceof TreeResourceError?error.message:'패시브 트리 이미지를 읽지 못했습니다.',{status:error instanceof TreeResourceError?error.status:404});
    }
  });
  const dataDirectory=join(app.getPath('userData'),'workspace');
  store=new StateStore(dataDirectory,()=>{
    const fresh=createDefaultState();
    const sibling=resolve(dirname(app.getAppPath()),'poe2-ai-wiki');
    const hasBundle=existsSync(join(bundledRuntimeRoot(),process.platform==='win32'?'pok.exe':'pok'));
    if(!hasBundle&&existsSync(join(sibling,'src','pok'))&&existsSync(join(sibling,'knowledge'))){
      fresh.settings.pok.root=sibling;
      fresh.settings.pok.mode='checkout';
      const python=join(sibling,'.venv',process.platform==='win32'?'Scripts/python.exe':'bin/python');
      if(existsSync(python))fresh.settings.pok.python=python;
    }
    return fresh;
  });
  try{state=await store.load();}
  catch(error){
    const result=await dialog.showMessageBox({type:'error',title:'POK 저장 파일 오류',message:String(error),
      detail:'기존 데이터는 덮어쓰지 않습니다. 데이터 폴더를 확인한 후 앱을 다시 실행해 주세요.',
      buttons:['데이터 폴더 열기','닫기']});
    if(result.response===0)await shell.openPath(dataDirectory);
    app.quit();return;
  }
  await mkdir(join(dataDirectory,'agent-workspace'),{recursive:true});
  agent=new AgentManager(pok,event=>{if(window&&!window.isDestroyed())window.webContents.send('pok:agent-event',event);},
    join(dataDirectory,'agent-workspace'));
  applyTheme();registerIpc();createWindow();
  if(store.recoveryMessage)await dialog.showMessageBox(window!,{type:'warning',title:'저장 파일 복구',message:store.recoveryMessage});
}).catch(error=>{dialog.showErrorBox('POK 시작 오류',String(error));app.quit();});
app.on('activate',()=>{if(!window&&state)createWindow();});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
app.on('before-quit',event=>{
  if(quitting)return;
  event.preventDefault();quitting=true;
  void(async()=>{
    try{await Promise.allSettled([...writes]);await store?.flush();}
    finally{agent?.close();await pok.close();app.quit();}
  })();
});
