import type {BuildDocument,BuildEdit} from './contracts';
import type {PobTreeRequest,PobTreeResult} from './pob-tree';
import {editBuild,parseBuild} from './pob-document';
import {hashBuildXml} from './calculation-context';

export function changesTreeSelection(edit:BuildEdit):boolean{
  return edit.type==='batch'?edit.edits.some(changesTreeSelection):['active-set','set-add','set-remove'].includes(edit.type)&&'kind'in edit&&edit.kind==='tree';
}
/** Resolve the selected spec through PoB before committing a canonical edit. */
export async function resolveTreeSetEdit(snapshot:Pick<BuildDocument,'id'|'revision'|'xml'>,edit:BuildEdit,runtimeId:string,read:(request:PobTreeRequest)=>Promise<PobTreeResult>){
  const prospective=editBuild(snapshot.xml,edit),active=parseBuild(prospective).trees.find(spec=>spec.active);
  if(!active)throw new Error('활성 패시브 세트가 필요합니다. 원본은 변경하지 않았습니다.');
  const [result,hash]=await Promise.all([read({buildId:snapshot.id,revision:snapshot.revision,xml:prospective,runtimeId,action:'character'}),hashBuildXml(prospective)]);
  if(result.buildId!==snapshot.id||result.revision!==snapshot.revision||result.xmlSha256!==hash||result.runtimeId!==runtimeId||result.treeVersion!==active.version)throw new Error('패시브 세트 조회의 입력·PoB 버전이 일치하지 않습니다.');
  const identity=result.patch.buildAttributes,character=result.character,selected=character?.classes.find(entry=>entry.id===character.classId);
  if(!identity||!selected||typeof identity.className!=='string'||typeof identity.ascendClassName!=='string'||identity.className!==selected.label||identity.ascendClassName!==selected.ascendancies.find(entry=>entry.id===character?.ascendancyId)?.label)throw new Error('원본 패시브 세트의 직업·전직 정보를 확인할 수 없습니다.');
  if(result.character?.decision||result.diagnostics.length||result.added.length||result.removed.length||Object.keys(result.patch.attributes).length)throw new Error('세트 조회가 추가 트리 변경을 요구합니다. 원본은 변경하지 않았습니다.');
  const resolved:BuildEdit={type:'batch',edits:[...(edit.type==='batch'?edit.edits:[edit]),{type:'tree-native-patch',specId:active.id,patch:{attributes:{},buildAttributes:{className:identity.className,ascendClassName:identity.ascendClassName}}}]};
  return{edit:resolved,xml:editBuild(snapshot.xml,resolved),identity:{className:identity.className,ascendClassName:identity.ascendClassName}};
}
