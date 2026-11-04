import type {BuildEdit} from './contracts';
import {parseBuild} from './pob-document';
import type {PobSetNode} from './pob-loadouts';
export interface PobSkillTextLine {index:number;text:string;status:'blank'|'metadata'|'gem'|'unsupported'|'other'|'error';error?:string;gems:{name:string;error?:string;level:number;quality:number;enabled:boolean;count?:number}[]}
export interface PobSkillText {raw:string;lines:PobSkillTextLine[];warnings:string[];canApply:boolean;partial:boolean;node?:PobSetNode;groupId?:string;companions?:{tag:'Spectre'|'BeastCompanion';id:string}[];stats?:Record<string,number>;calcWarnings?:string[]}
export interface SkillTextInput {inputRevision:number;inputXmlSha256:string;runtimeId:string;pobCommit:string;raw:string;lines:PobSkillTextLine[];warnings:string[];partial:boolean;trial?:{stats:Record<string,number>;warnings:string[]}}
export interface SkillTextEvidence extends SkillTextInput {id:string;at:string;buildId:string;appliedRevision?:number}
export function validateSkillTextInput(value:SkillTextInput):void{
  if(!value||!Number.isSafeInteger(value.inputRevision)||value.inputRevision<0||typeof value.inputXmlSha256!=='string'||!/^[a-f0-9]{64}$/.test(value.inputXmlSha256)||typeof value.runtimeId!=='string'||!value.runtimeId||typeof value.pobCommit!=='string'||!/^[a-f0-9]{40}$/.test(value.pobCommit)||typeof value.raw!=='string'||new TextEncoder().encode(value.raw).length>65536||typeof value.partial!=='boolean'||!Array.isArray(value.warnings)||value.warnings.some(text=>typeof text!=='string')||!Array.isArray(value.lines)||value.lines.length>128)throw new Error('텍스트 가져오기 원문 근거가 올바르지 않습니다.');
  for(const [index,line]of value.lines.entries())if(!line||line.index!==index+1||typeof line.text!=='string'||!['blank','metadata','gem','unsupported','other','error'].includes(line.status)||line.error!==undefined&&typeof line.error!=='string'||!Array.isArray(line.gems)||line.gems.some(gem=>!gem||typeof gem.name!=='string'||!Number.isFinite(gem.level)||!Number.isFinite(gem.quality)||typeof gem.enabled!=='boolean'||gem.error!==undefined&&typeof gem.error!=='string'))throw new Error('텍스트 가져오기 줄 근거가 올바르지 않습니다.');
  if(value.trial&&(!value.trial.stats||typeof value.trial.stats!=='object'||Array.isArray(value.trial.stats)||Object.values(value.trial.stats).some(number=>typeof number!=='number'||!Number.isFinite(number))||!Array.isArray(value.trial.warnings)||value.trial.warnings.some(text=>typeof text!=='string')))throw new Error('텍스트 시험 계산 근거가 올바르지 않습니다.');
}
export function validateSkillTextEvidence(value:SkillTextEvidence):void{
  validateSkillTextInput(value);if(typeof value.id!=='string'||!value.id||typeof value.buildId!=='string'||!value.buildId||typeof value.at!=='string'||!Number.isFinite(Date.parse(value.at))||value.appliedRevision!==undefined&&(!Number.isSafeInteger(value.appliedRevision)||value.appliedRevision<=value.inputRevision))throw new Error('텍스트 가져오기 revision 근거가 올바르지 않습니다.');
}
export interface PobSkillGroupOperation {action:'inspect'|'reorder'|'delete'|'copy'|'move'|'import-text'|'export-text';setId:string;groupId?:string;position?:number;targetSetId?:string;text?:string}
export interface PobSkillGroups {
  operation:PobSkillGroupOperation;setId:string;
  groups:{id:string;label:string;source?:string;canDelete:boolean;canCopy?:boolean}[];
  sets?:{id:string;label:string;count:number}[];
  transfer?:{sourceSetId:string;sourceGroupId:string;targetSetId:string;targetGroupId:string;move:boolean};
  text?:PobSkillText;
  order:string[];mainSocketGroup:number;calcsSkillNumber:number;confirmation?:string;
}
export function skillGroupEdit(xml:string,result:PobSkillGroups):BuildEdit{
  const operation=result.operation,parsed=parseBuild(xml),set=parsed.skillSets.find(value=>value.active);
  if(operation.action==='inspect'||operation.action==='export-text')throw new Error('스킬 그룹 조회/내보내기 결과는 적용할 수 없습니다.');
  if(!set||set.id!==operation.setId||result.setId!==set.id)throw new Error('원본 스킬 그룹의 활성 세트가 다릅니다.');
  const original=set.groups.map(group=>group.id),expected=[...original],index=expected.indexOf(operation.groupId||'');
  if(operation.action==='import-text'){
    const text=result.text;
    if(!text||!text.canApply||text.raw!==operation.text||text.node?.tag!=='Skill'||text.groupId!==String(original.length+1)||JSON.stringify(result.order)!==JSON.stringify([...original,'new']))throw new Error('원본 텍스트 복원 결과의 입력·그룹 출처가 올바르지 않습니다.');
    for(const value of [result.mainSocketGroup,result.calcsSkillNumber])if(!Number.isSafeInteger(value)||value<1||value>Math.max(1,original.length+1))throw new Error('원본 텍스트 복원의 선택값이 올바르지 않습니다.');
    return{type:'batch',edits:[{type:'skill-import-native',setId:set.id,node:text.node,companions:text.companions||[]},{type:'main-skill-native',index:result.mainSocketGroup},{type:'calcs-input',key:'skill_number',value:result.calcsSkillNumber}]};
  }
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
