import {hashBuildXml} from './calculation-context';
import type { AppState, BuildDocument } from './contracts';
import { parseBuild } from './pob-document';

export interface DesignRecordReference {
  format: 'pok.design-ref.v1'; artifact_id: string; revision: string;
  sha256: string; manifest_sha256: string;
}
export interface DesignRecordSnapshot {
  // Original JSON text is authoritative; never parse/stringify it for saving.
  recordJson: string; recordRef: DesignRecordReference; markdown: string;
  xmlSha256?: string; acquisitionSha256?:string; assessmentJson?: string;
}
export interface BuildInputs {
  xml: string; design?: DesignRecordSnapshot; acquisitionMetadataJson?: string;
}
export interface InputUndo extends BuildInputs { label: string }
export interface VersionedBuildDocument extends Omit<BuildDocument, 'undo'>, BuildInputs {
  documentSchemaVersion: 2; undo: InputUndo[];
}
export interface InputProposal {
  buildId: string; baseRevision: number; baseDesignRevision: string | null;
  inputs: BuildInputs; summary: string;
}

export function assertInputSnapshot(value: BuildInputs): void {
  parseBuild(value.xml);
  if(value.acquisitionMetadataJson!==undefined){const metadata=JSON.parse(value.acquisitionMetadataJson);if(!metadata||typeof metadata!=='object'||Array.isArray(metadata))throw new Error('획득 메타데이터는 JSON 객체여야 합니다.');}
  if(value.design)assertDesignSnapshot(value.design);
}
export function assertDesignSnapshot(design:DesignRecordSnapshot):void {
  const ref=design.recordRef;
  if(ref.format!=='pok.design-ref.v1'||!ref.artifact_id||
     ![ref.revision,ref.sha256,ref.manifest_sha256].every(x=>/^sha256:[a-f0-9]{64}$/.test(x)))throw new Error('설계 참조 형식이 올바르지 않습니다.');
  const record=JSON.parse(design.recordJson) as {format?:unknown;revision?:unknown};
  if(record.format!=='pok.design-record.v1'||record.revision!==ref.revision)throw new Error('설계 원문과 참조 리비전이 일치하지 않습니다.');
  if(design.assessmentJson!==undefined)JSON.parse(design.assessmentJson);
  for(const digest of [design.xmlSha256,design.acquisitionSha256])if(digest!==undefined&&!/^sha256:[a-f0-9]{64}$/.test(digest))throw new Error('설계 입력 해시가 올바르지 않습니다.');
  // Shape checks are not engine evidence verification or game validation.
}
export function snapshotInputs(build: BuildInputs): BuildInputs {
  return structuredClone({xml:build.xml,design:build.design,acquisitionMetadataJson:build.acquisitionMetadataJson});
}
function sameInputs(left:BuildInputs,right:BuildInputs):boolean {
  if(left.xml!==right.xml||left.acquisitionMetadataJson!==right.acquisitionMetadataJson)return false;
  if(!left.design||!right.design)return left.design===right.design;
  const a=left.design,b=right.design;
  return a.recordJson===b.recordJson&&a.markdown===b.markdown&&a.xmlSha256===b.xmlSha256&&a.acquisitionSha256===b.acquisitionSha256&&a.assessmentJson===b.assessmentJson&&
    (['format','artifact_id','revision','sha256','manifest_sha256'] as const).every(key=>a.recordRef[key]===b.recordRef[key]);
}
export function applyInputProposal(build:VersionedBuildDocument,proposal:InputProposal):VersionedBuildDocument {
  if(!Number.isSafeInteger(build.revision)||build.revision<0||build.revision>=Number.MAX_SAFE_INTEGER)throw new Error('문서 리비전을 안전하게 증가시킬 수 없습니다.');
  if(proposal.buildId!==build.id||proposal.baseRevision!==build.revision||
    proposal.baseDesignRevision!==(build.design?.recordRef.revision??null))throw new Error('제안의 기준 문서나 설계 리비전이 변경되었습니다.');
  assertInputSnapshot(proposal.inputs);
  if(sameInputs(build,proposal.inputs))return build;
  const previous:InputUndo={...snapshotInputs(build),label:proposal.summary};
  return {...build,...snapshotInputs(proposal.inputs),revision:build.revision+1,updatedAt:new Date().toISOString(),undo:[...build.undo,previous].slice(-30)};
}
export function undoInputSnapshot(build:VersionedBuildDocument):VersionedBuildDocument {
  const previous=build.undo.at(-1);if(!previous)return build;
  if(!Number.isSafeInteger(build.revision)||build.revision<0||build.revision>=Number.MAX_SAFE_INTEGER)throw new Error('문서 리비전을 안전하게 증가시킬 수 없습니다.');
  assertInputSnapshot(previous);
  return {...build,...snapshotInputs(previous),revision:build.revision+1,updatedAt:new Date().toISOString(),undo:build.undo.slice(0,-1)};
}
export function applyManualXml(build:VersionedBuildDocument,xml:string,label:string):VersionedBuildDocument {
  // Retain the older design verbatim. Its XML hash stays historical until the
  // engine produces a new bound record; do not fabricate provider review state.
  return applyInputProposal(build,{buildId:build.id,baseRevision:build.revision,baseDesignRevision:build.design?.recordRef.revision??null,inputs:{...snapshotInputs(build),xml},summary:label});
}

function versionParts(build:BuildDocument):unknown[]{
 const d=build.design,r=d?.recordRef;
 return [build.id,build.revision,build.xml,d?.recordJson??null,r?.format??null,r?.artifact_id??null,r?.revision??null,r?.sha256??null,r?.manifest_sha256??null,d?.markdown??null,d?.xmlSha256??null,d?.acquisitionSha256??null,d?.assessmentJson??null,build.acquisitionMetadataJson??null];
}
const inputVersions=new WeakMap<BuildDocument,{parts:unknown[];version:Promise<string>}>();
export function sameBuildInputVersion(a:BuildDocument,b:BuildDocument):boolean {
 const left=versionParts(a),right=versionParts(b);return left.every((value,index)=>value===right[index]);
}
export function buildInputVersion(build:BuildDocument):Promise<string>{
 const parts=versionParts(build),cached=inputVersions.get(build);
 if(cached&&parts.every((value,index)=>value===cached.parts[index]))return cached.version;
 const version=hashBuildXml(JSON.stringify(parts));inputVersions.set(build,{parts,version});return version;
}
export async function workspaceInputVersions(builds:BuildDocument[]):Promise<Record<string,string>>{
 return Object.fromEntries(await Promise.all(builds.map(async build=>[build.id,await buildInputVersion(build)])));
}

export function reconcileAppliedBuild(state:AppState,applied:BuildDocument,baseRevision:number):{state:AppState;forked?:BuildDocument}{
 const local=state.builds.find(build=>build.id===applied.id);
 const changed=local&&local.revision!==baseRevision&&!sameBuildInputVersion(local,applied);
 if(changed){
  const now=new Date().toISOString();
  const forked={...structuredClone(local),id:crypto.randomUUID(),name:local.name+' · 동시 편집 초안',revision:0,createdAt:now,updatedAt:now};
  return {state:{...state,builds:[...state.builds.map(build=>build.id===applied.id?applied:build),forked],activeBuildId:forked.id},forked};
 }
 return {state:{...state,builds:local?state.builds.map(build=>build.id===applied.id?applied:build):[...state.builds,applied]}};
}
