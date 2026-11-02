import type {BuildDocument,BuildEdit} from './contracts';
import {editBuild,parseBuild} from './pob-document';
const limit=30;
export function commitBuildXml(build:BuildDocument,xml:string,label:string):BuildDocument{
  if(xml===build.xml)return build;parseBuild(xml);
  return{...build,xml,revision:build.revision+1,updatedAt:new Date().toISOString(),undo:[...build.undo,{xml:build.xml,label}].slice(-limit),redo:[]};
}
export function applyDocumentEdit(build:BuildDocument,edit:BuildEdit,label:string):BuildDocument{return commitBuildXml(build,editBuild(build.xml,edit),label);}
export function undoDocument(build:BuildDocument):BuildDocument{
  const previous=build.undo.at(-1);if(!previous)return build;parseBuild(previous.xml);
  return{...build,xml:previous.xml,revision:build.revision+1,updatedAt:new Date().toISOString(),undo:build.undo.slice(0,-1),redo:[...(build.redo||[]),{xml:build.xml,label:previous.label}].slice(-limit)};
}
export function redoDocument(build:BuildDocument):BuildDocument{
  const next=build.redo?.at(-1);if(!next)return build;parseBuild(next.xml);
  return{...build,xml:next.xml,revision:build.revision+1,updatedAt:new Date().toISOString(),undo:[...build.undo,{xml:build.xml,label:next.label}].slice(-limit),redo:build.redo!.slice(0,-1)};
}
export function applyExpectedEdit(current:BuildDocument,snapshot:Pick<BuildDocument,'id'|'xml'|'revision'>,edit:BuildEdit,label:string):BuildDocument{
  if(current.id!==snapshot.id||current.revision!==snapshot.revision||current.xml!==snapshot.xml)throw new Error('검토한 뒤 빌드가 변경됐습니다. 현재 입력으로 다시 비교해 주세요.');
  return applyDocumentEdit(current,edit,label);
}
