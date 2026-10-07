import { contextBridge, ipcRenderer } from 'electron';
import type { DesktopApi, AgentEvent } from '../shared/contracts';

const api:DesktopApi={
  loadState:()=>ipcRenderer.invoke('pok:load-state'),
  loadPassiveTree:version=>ipcRenderer.invoke('pok:load-passive-tree',version),
  saveState:state=>ipcRenderer.invoke('pok:save-state',state),
  importBuild:()=>ipcRenderer.invoke('pok:import-build'),
  exportBuild:(build,format)=>ipcRenderer.invoke('pok:export-build',build,format),
  connectPok:settings=>ipcRenderer.invoke('pok:connect',settings),
  callPok:(name,args)=>ipcRenderer.invoke('pok:call',name,args),
  computeBuild:build=>ipcRenderer.invoke('pok:compute',build),
  sendChat:request=>ipcRenderer.invoke('pok:send-chat',request),
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
