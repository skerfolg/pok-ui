import type {BuildEdit} from './contracts';
import {parseBuild} from './pob-document';
export interface PobSkillGroupOperation {action:'inspect'|'reorder'|'delete'|'copy'|'move';setId:string;groupId?:string;position?:number;targetSetId?:string}
export interface PobSkillGroups {
  operation:PobSkillGroupOperation;setId:string;
  groups:{id:string;label:string;source?:string;canDelete:boolean;canCopy?:boolean}[];
  sets?:{id:string;label:string;count:number}[];
  transfer?:{sourceSetId:string;sourceGroupId:string;targetSetId:string;targetGroupId:string;move:boolean};
  order:string[];mainSocketGroup:number;calcsSkillNumber:number;confirmation?:string;
}
export function skillGroupEdit(xml:string,result:PobSkillGroups):BuildEdit{
  const operation=result.operation,parsed=parseBuild(xml),set=parsed.skillSets.find(value=>value.active);
  if(operation.action==='inspect')throw new Error('스킬 그룹 조회 결과는 적용할 수 없습니다.');
  if(!set||set.id!==operation.setId||result.setId!==set.id)throw new Error('원본 스킬 그룹의 활성 세트가 다릅니다.');
  const original=set.groups.map(group=>group.id),expected=[...original],index=expected.indexOf(operation.groupId||'');
  if(index<0)throw new Error('원본 스킬 그룹이 없습니다.');
  const edits:Extract<BuildEdit,{type:'batch'}>['edits']=[];
  if(operation.action==='copy'||operation.action==='move'){
    const destination=parsed.skillSets.find(value=>value.id===operation.targetSetId),transfer=result.transfer;
    if(!destination||!transfer||transfer.sourceSetId!==set.id||transfer.sourceGroupId!==operation.groupId||transfer.targetSetId!==destination.id||transfer.targetGroupId!==String(destination.groups.length+1)||transfer.move!==(operation.action==='move')||operation.action==='move'&&destination.id===set.id)throw new Error('원본 스킬 그룹 복사·이동의 출처가 요청과 다릅니다.');
    edits.push({type:'skill-copy-native',setId:set.id,groupId:operation.groupId!,targetSetId:destination.id});
    if(operation.action==='move'){expected.splice(index,1);edits.push({type:'skill-native-order',setId:set.id,order:expected});}
    else if(destination.id===set.id)expected.push(operation.groupId!);
  }else if(operation.action==='delete')expected.splice(index,1);
  else if(operation.action==='reorder'){
    if(!Number.isSafeInteger(operation.position)||operation.position!<1||operation.position!>expected.length||operation.position===index+1)throw new Error('스킬 그룹 이동 위치가 올바르지 않습니다.');
    expected.splice(operation.position!-1,0,...expected.splice(index,1));
  }else throw new Error('지원하지 않는 스킬 그룹 연산입니다.');
  if(JSON.stringify(expected)!==JSON.stringify(result.order))throw new Error('원본 스킬 그룹 순서가 요청과 다릅니다.');
  for(const value of [result.mainSocketGroup,result.calcsSkillNumber])if(!Number.isSafeInteger(value)||value<1||value>Math.max(1,expected.length))throw new Error('원본 스킬 그룹 선택값이 올바르지 않습니다.');
  if(operation.action==='reorder'||operation.action==='delete')edits.push({type:'skill-native-order',setId:set.id,order:result.order});
  return{type:'batch',edits:[...edits,{type:'main-skill-native',index:result.mainSocketGroup},{type:'calcs-input',key:'skill_number',value:result.calcsSkillNumber}]};
}
