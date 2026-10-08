import { contextBridge, ipcRenderer } from 'electron';
import type { AgentEvent, ConnectionInfo, DesktopApi } from '../shared/contracts';

const api:DesktopApi={
  platform:process.platform,
  windowChrome:true,
  loadState:()=>ipcRenderer.invoke('pok:load-state'),
  loadPassiveTree:version=>ipcRenderer.invoke('pok:load-passive-tree',version),
  saveState:state=>ipcRenderer.invoke('pok:save-state',state),
  importBuild:()=>ipcRenderer.invoke('pok:import-build'),
  exportBuild:(build,format)=>ipcRenderer.invoke('pok:export-build',build,format),
  connectPok:settings=>ipcRenderer.invoke('pok:connect',settings),
  getPokConnection:()=>ipcRenderer.invoke('pok:connection'),
  onPokConnection:listener=>{
    const handler=(_event:Electron.IpcRendererEvent,connection:ConnectionInfo)=>listener(connection);
    ipcRenderer.on('pok:connection',handler);
    return()=>ipcRenderer.removeListener('pok:connection',handler);
  },
  callPok:(name,args)=>ipcRenderer.invoke('pok:call',name,args),
  getDataBundleInfo:()=>ipcRenderer.invoke('pok:data-bundle-info'),
  queryPobCatalog:query=>ipcRenderer.invoke('pok:query-pob-catalog',query),
  getPobCatalogEntry:(type,id)=>ipcRenderer.invoke('pok:get-pob-catalog-entry',type,id),
  renderPobItem:request=>ipcRenderer.invoke('pok:render-pob-item',request),
  computeBuild:build=>ipcRenderer.invoke('pok:compute',build),
  applyBuildProposal:proposalId=>ipcRenderer.invoke('pok:apply-build-proposal',proposalId),
  sendChat:request=>ipcRenderer.invoke('pok:send-chat',request),
  listAgentModels:()=>ipcRenderer.invoke('pok:agent-models'),
  pickChatImages:()=>ipcRenderer.invoke('pok:pick-chat-images'),
  addChatImage:image=>ipcRenderer.invoke('pok:add-chat-image',image),
  chatImageUrl:id=>'pok-image://attachment/'+encodeURIComponent(id),
  answerAgentQuestion:(id,answers)=>ipcRenderer.invoke('pok:answer-agent-question',id,answers),
  cancelChat:chatId=>ipcRenderer.invoke('pok:cancel-chat',chatId),
  resolveApproval:(requestId,decision)=>ipcRenderer.invoke('pok:resolve-approval',requestId,decision),
  onAgentEvent:listener=>{
    const handler=(_event:Electron.IpcRendererEvent,event:AgentEvent)=>listener(event);
    ipcRenderer.on('pok:agent-event',handler);
    return()=>ipcRenderer.removeListener('pok:agent-event',handler);
  },
  openDataFolder:()=>ipcRenderer.invoke('pok:open-data'),
  selectPath:kind=>ipcRenderer.invoke('pok:select-path',kind)
};
contextBridge.exposeInMainWorld('pok',Object.freeze(api));
