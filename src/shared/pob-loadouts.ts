import type {BuildDocument,BuildEdit} from './contracts';
import type {PobInspectionRequest} from './pob-inspection';
import type {PobTreePatch} from './pob-tree';
import {editBuild,parseBuild} from './pob-document';
export interface PobLoadoutSelection {tree:string;items:string;skills:string;config:string}
export interface PobLoadoutOperation {action:'new'|'copy'|'rename'|'delete'|'custom'|'reorder';scope?:'tree'|'loadout';treeId?:string;index?:number;sourceName?:string;nextName?:string;title?:string;position?:number;sources?:PobLoadoutSelection}
export interface PobSetNode {tag:string;attributes:Record<string,string>;children:(PobSetNode|string)[]}
export interface PobSetEntry {id:string;sourceId?:string;copyFrom?:string;title?:string;node?:PobSetNode}
export type PobLoadoutSets=Record<keyof PobLoadoutSelection,PobSetEntry[]>;
export interface PobTreeWorkspaceOperation {action:'inspect'|'initialize'|'convert'|'convert-all'|'adopt';version?:string;mode?:'replace'|'copy';title?:string;classId?:number;ascendancyId?:number}
export interface PobLoadoutsRequest extends PobInspectionRequest {runtimeId?:string;requestId?:string;name?:string;manage?:PobLoadoutOperation;treeWorkspace?:PobTreeWorkspaceOperation}
export interface PobLoadouts {
  buildId:string;revision:number;xmlSha256:string;runtimeId:string;pobCommit:string;
  choices:{name:string;label:string;selection:PobLoadoutSelection}[];selection:PobLoadoutSelection;activeName?:string;requestedName?:string;
  identity:{className:string;ascendClassName:string};equipment:{useSecondWeaponSet:boolean;mainSocketGroup:number};diagnostics:{code:string;message:string;name?:string}[];
  management?:{entries:{index?:number;sourceName?:string;tree:string;name:string;label:string;actions?:PobLoadoutOperation['action'][];namedActions?:PobLoadoutOperation['action'][];successors?:{name:string;label:string}[];reorderScope?:'tree'}[];nameLimit:number;treePositions?:{position:number;label:string}[];treeAssociations?:Record<string,{name:string;label:string}[]>;trees?:{id:string;title:string;label:string;active:boolean;actions:PobLoadoutOperation['action'][]}[];treeNameLimit?:number;canNewTree?:boolean;newTreeVersion?:string};sets?:PobLoadoutSets;operation?:PobLoadoutOperation;confirmation?:string;
  loadoutChanges?:Record<'added'|'removed'|'changed',{name:string;label:string}[]>;
  movement?:{scope:'tree';sourceTree:string;destinationTree:string;activePreserved?:boolean;affectedNames:{name:string;label:string}[]};
  treePatches?:{id:string;patch:PobTreePatch}[];
  treeWorkspace?:{operation:PobTreeWorkspaceOperation;initializationRequired:boolean;nonTreeSelectionPreserved?:boolean;versions:{id:string;label:string;classes:{id:number;label:string;ascendancies:{id:number;label:string}[]}[]}[];trees:{id:string;title:string;version:string;active:boolean}[];warning?:string;changes:{sourceId?:string;title:string;from:string;to:string;added:number[];removed:number[]}[]};
}
export function loadoutEdit(snapshot:Pick<BuildDocument,'xml'>,result:PobLoadouts):BuildEdit{
  const workspace=result.treeWorkspace?.operation;
  if(workspace?.action==='inspect')throw new Error('트리 조회 결과는 적용할 수 없습니다.');
  if((result.operation||workspace)&&!result.sets)throw new Error('원본 관리 연산의 XML 출처 정보가 없습니다.');
  const prefix:BuildEdit=result.sets?{type:'loadout-native-sets',sets:result.sets}:{type:'batch',edits:[]};
  const patches=(result.treePatches||[]).map(entry=>({type:'tree-native-patch' as const,specId:entry.id,patch:entry.patch}));
  if(patches.length&&!workspace)throw new Error('트리 버전 패치의 요청 근거가 없습니다.');
  if(new Set(patches.map(entry=>entry.specId)).size!==patches.length||patches.some(entry=>entry.patch.buildAttributes||!result.sets?.tree.some(set=>set.id===entry.specId&&(set.sourceId||set.copyFrom))))throw new Error('트리 변환 패치의 원본 출처가 올바르지 않습니다.');
  const prefixEdits=[...(workspace?.action==='adopt'?[{type:'tree-adopt-legacy' as const}]:[]),...(result.sets?[prefix as Extract<BuildEdit,{type:'loadout-native-sets'}>]:[]),...patches];
  const parsed=parseBuild(prefixEdits.length?editBuild(snapshot.xml,{type:'batch',edits:prefixEdits}):snapshot.xml),selection=result.selection;
  for(const [kind,sets]of [['tree',parsed.trees],['items',parsed.itemSets],['skills',parsed.skillSets],['config',parsed.configs]] as const)if(!sets.some(set=>set.id===selection[kind]))throw new Error('원본 통합 구성의 세트 ID가 현재 XML에 없습니다. 원본을 보존합니다.');
  if(!result.operation&&!workspace&&(!result.requestedName||!result.choices.some(choice=>choice.name===result.requestedName&&Object.keys(selection).every(key=>selection[key as keyof PobLoadoutSelection]===choice.selection[key as keyof PobLoadoutSelection]))))throw new Error('원본이 선택한 통합 구성이 요청과 일치하지 않습니다.');
  const treeOnly=Boolean(workspace&&result.treeWorkspace?.nonTreeSelectionPreserved!==false)||result.operation?.scope==='tree'&&(result.operation.treeId!==undefined||result.operation.action==='new');
  const equipment:Extract<BuildEdit,{type:'equipment-native-patch'}>={type:'equipment-native-patch',setId:selection.items,patch:treeOnly?{slots:{},...(parseBuild(snapshot.xml).mainSocketGroup!==result.equipment.mainSocketGroup?{mainSocketGroup:result.equipment.mainSocketGroup}:{})}:{slots:{},useSecondWeaponSet:result.equipment.useSecondWeaponSet,mainSocketGroup:result.equipment.mainSocketGroup}};
  return{type:'batch',edits:[...prefixEdits,...(treeOnly?['tree'] as const:['tree','items','skills','config'] as const).map(kind=>({type:'active-set' as const,kind,id:selection[kind]})),{type:'tree-native-patch',specId:selection.tree,patch:{attributes:{},buildAttributes:result.identity}},...(!treeOnly||Object.keys(equipment.patch).length>1?[equipment]:[])]};
}
