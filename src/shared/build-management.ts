import type {AppState,BuildDocument} from './contracts';
import {createBuildDocument} from './state';
export function buildName(value:string):string{const name=value.trim();if(!name||name.length>200)throw new Error('빌드 이름은 1~200자로 입력해 주세요.');return name;}
export function buildFolder(value:string):string{
  const folder=value.trim().replaceAll('\\','/').replace(/^\/+|\/+$/g,'').split('/').filter(Boolean).join('/');
  if(folder.length>400||folder.split('/').some(part=>part==='.'||part==='..'||/[\x00-\x1f]/.test(part)))throw new Error('폴더 이름이 올바르지 않습니다.');return folder;
}
export function workspaceFolders(state:AppState):string[]{
  const folders=new Set<string>();for(const raw of [...(state.folders||[]),...state.builds.map(b=>b.folder||'')]){
    const parts=raw.split('/').filter(Boolean);for(let i=1;i<=parts.length;i++)folders.add(parts.slice(0,i).join('/'));
  }return [...folders].sort((a,b)=>a.localeCompare(b));
}
export function renameWorkspaceFolder(state:AppState,from:string,to:string):AppState{
  const source=buildFolder(from),target=buildFolder(to);if(!source||!target)throw new Error('폴더 경로를 입력해 주세요.');if(source===target)return state;
  if(target.startsWith(source+'/'))throw new Error('폴더를 자기 하위로 이동할 수 없습니다.');if(workspaceFolders(state).includes(target))throw new Error('같은 경로의 폴더가 이미 있습니다.');
  const change=(path:string)=>path===source?target:path.startsWith(source+'/')?target+path.slice(source.length):path;
  return{...state,folders:workspaceFolders(state).map(change),builds:state.builds.map(b=>b.folder?{...b,folder:change(b.folder)}:b)};
}
export function removeWorkspaceFolder(state:AppState,folder:string):AppState{
  const source=buildFolder(folder),parent=source.split('/').slice(0,-1).join('/');if(!source)throw new Error('최상위 폴더는 삭제할 수 없습니다.');
  const within=(path:string)=>path===source||path.startsWith(source+'/');
  return{...state,folders:workspaceFolders(state).filter(f=>!within(f)),builds:state.builds.map(b=>within(b.folder||'')?{...b,folder:parent}:b)};
}
export function duplicateDocument(source:BuildDocument,name:string):BuildDocument{
  return{...createBuildDocument(buildName(name),source.xml),folder:source.folder||'',copiedFrom:{buildId:source.id,revision:source.revision},...(source.inputEvidence?{inputEvidence:structuredClone(source.inputEvidence)}:{})};
}
export function removeDocument(state:AppState,id:string):AppState{
  const index=state.builds.findIndex(b=>b.id===id);if(index<0)throw new Error('삭제할 빌드가 없습니다.');
  const build=state.builds[index],builds=state.builds.filter(b=>b.id!==id),chatIds=state.chats.filter(c=>c.buildId===id).map(c=>c.id);
  return{...state,builds,activeBuildId:state.activeBuildId===id?builds[Math.min(index,builds.length-1)]?.id:state.activeBuildId,
    chats:state.chats.map(c=>c.buildId===id?{...c,buildId:undefined}:c),trash:[...(state.trash||[]),{build,index,chatIds,deletedAt:new Date().toISOString()}]};
}
export function restoreDocument(state:AppState,id:string):AppState{
  const record=state.trash?.find(t=>t.build.id===id);if(!record)throw new Error('복원할 빌드가 없습니다.');
  if(state.builds.some(b=>b.id===id))throw new Error('같은 ID의 빌드가 이미 열려 있습니다.');
  const builds=[...state.builds];builds.splice(Math.min(record.index,builds.length),0,record.build);
  return{...state,builds,activeBuildId:id,trash:state.trash!.filter(t=>t.build.id!==id),chats:state.chats.map(c=>record.chatIds.includes(c.id)&&!c.buildId?{...c,buildId:id}:c)};
}
