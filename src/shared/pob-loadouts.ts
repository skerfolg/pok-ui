import type {BuildDocument,BuildEdit} from './contracts';
import type {PobInspectionRequest} from './pob-inspection';
import {editBuild,parseBuild} from './pob-document';
export interface PobLoadoutSelection {tree:string;items:string;skills:string;config:string}
export interface PobLoadoutOperation {action:'new'|'copy'|'rename'|'delete'|'custom'|'reorder';index?:number;sourceName?:string;nextName?:string;title?:string;position?:number;sources?:PobLoadoutSelection}
export interface PobSetNode {tag:string;attributes:Record<string,string>;children:(PobSetNode|string)[]}
export interface PobSetEntry {id:string;sourceId?:string;copyFrom?:string;title?:string;node?:PobSetNode}
export type PobLoadoutSets=Record<keyof PobLoadoutSelection,PobSetEntry[]>;
export interface PobLoadoutsRequest extends PobInspectionRequest {runtimeId?:string;requestId?:string;name?:string;manage?:PobLoadoutOperation}
export interface PobLoadouts {
  buildId:string;revision:number;xmlSha256:string;runtimeId:string;pobCommit:string;
  choices:{name:string;label:string;selection:PobLoadoutSelection}[];selection:PobLoadoutSelection;activeName?:string;requestedName?:string;
  identity:{className:string;ascendClassName:string};equipment:{useSecondWeaponSet:boolean;mainSocketGroup:number};diagnostics:{code:string;message:string;name?:string}[];
  management?:{entries:{index?:number;sourceName?:string;tree:string;name:string;label:string;actions?:PobLoadoutOperation['action'][];namedActions?:PobLoadoutOperation['action'][];successors?:{name:string;label:string}[]}[];nameLimit:number};sets?:PobLoadoutSets;operation?:PobLoadoutOperation;confirmation?:string;
  loadoutChanges?:Record<'added'|'removed'|'changed',{name:string;label:string}[]>;
}
export function loadoutEdit(snapshot:Pick<BuildDocument,'xml'>,result:PobLoadouts):BuildEdit{
  if(result.operation&&!result.sets)throw new Error('원본 관리 연산의 XML 출처 정보가 없습니다.');
  const prefix:BuildEdit=result.sets?{type:'loadout-native-sets',sets:result.sets}:{type:'batch',edits:[]};
  const parsed=parseBuild(result.sets?editBuild(snapshot.xml,prefix):snapshot.xml),selection=result.selection;
  for(const [kind,sets]of [['tree',parsed.trees],['items',parsed.itemSets],['skills',parsed.skillSets],['config',parsed.configs]] as const)if(!sets.some(set=>set.id===selection[kind]))throw new Error('원본 통합 구성의 세트 ID가 현재 XML에 없습니다. 원본을 보존합니다.');
  if(!result.operation&&(!result.requestedName||!result.choices.some(choice=>choice.name===result.requestedName&&Object.keys(selection).every(key=>selection[key as keyof PobLoadoutSelection]===choice.selection[key as keyof PobLoadoutSelection]))))throw new Error('원본이 선택한 통합 구성이 요청과 일치하지 않습니다.');
  return{type:'batch',edits:[...(result.sets?[prefix as Extract<BuildEdit,{type:'loadout-native-sets'}>]:[]),...(['tree','items','skills','config'] as const).map(kind=>({type:'active-set' as const,kind,id:selection[kind]})),{type:'tree-native-patch',specId:selection.tree,patch:{attributes:{},buildAttributes:result.identity}},{type:'equipment-native-patch',setId:selection.items,patch:{slots:{},useSecondWeaponSet:result.equipment.useSecondWeaponSet,mainSocketGroup:result.equipment.mainSocketGroup}}]};
}
