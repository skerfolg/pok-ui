import type {BuildEdit} from './contracts';
import {parseBuild} from './pob-document';
export interface PobSkillGroupOperation {action:'inspect'|'reorder'|'delete';setId:string;groupId?:string;position?:number}
export interface PobSkillGroups {
  operation:PobSkillGroupOperation;setId:string;
  groups:{id:string;label:string;source?:string;canDelete:boolean}[];
  order:string[];mainSocketGroup:number;calcsSkillNumber:number;confirmation?:string;
}
export function skillGroupEdit(xml:string,result:PobSkillGroups):BuildEdit{
  const operation=result.operation,parsed=parseBuild(xml),set=parsed.skillSets.find(value=>value.active);
  if(operation.action==='inspect')throw new Error('스킬 그룹 조회 결과는 적용할 수 없습니다.');
  if(!set||set.id!==operation.setId||result.setId!==set.id)throw new Error('원본 스킬 그룹의 활성 세트가 다릅니다.');
  const original=set.groups.map(group=>group.id),expected=[...original],index=expected.indexOf(operation.groupId||'');
  if(index<0)throw new Error('원본 스킬 그룹이 없습니다.');
  if(operation.action==='delete')expected.splice(index,1);
  else if(operation.action==='reorder'){
    if(!Number.isSafeInteger(operation.position)||operation.position!<1||operation.position!>expected.length||operation.position===index+1)throw new Error('스킬 그룹 이동 위치가 올바르지 않습니다.');
    expected.splice(operation.position!-1,0,...expected.splice(index,1));
  }else throw new Error('지원하지 않는 스킬 그룹 연산입니다.');
  if(JSON.stringify(expected)!==JSON.stringify(result.order))throw new Error('원본 스킬 그룹 순서가 요청과 다릅니다.');
  for(const value of [result.mainSocketGroup,result.calcsSkillNumber])if(!Number.isSafeInteger(value)||value<1||value>Math.max(1,expected.length))throw new Error('원본 스킬 그룹 선택값이 올바르지 않습니다.');
  return{type:'batch',edits:[{type:'skill-native-order',setId:set.id,order:result.order},{type:'main-skill-native',index:result.mainSocketGroup},{type:'calcs-input',key:'skill_number',value:result.calcsSkillNumber}]};
}
