export type PobValue=string|number|boolean;
export interface PobConfigField {
  id:string;key?:string;type:string;label:string;value?:PobValue;defaultValue?:PobValue;placeholder?:PobValue;
  available:boolean;showAll:boolean;enabled:boolean;checked?:boolean;tooltip?:string;
  options?:{label:string;value:PobValue}[];
}
export interface PobSkillOptions {
  groupId:string;activeSkill:number;sourceGemIndex?:number;grantedEffectId?:string;
  skills:{index:number;label:string}[];modes:{index:number;label:string;grantedEffectId:string}[];selectedMode:number;
  parts:{index:number;label:string}[];selectedPart:number;stages?:number;mines?:number;minesAvailable?:boolean;
  gems:{index:number;name:string;error?:string;level?:number;quality?:number}[];
}
export interface PobInspectionRequest {buildId:string;revision:number;xml:string}
export interface PobInspection {
  buildId:string;revision:number;xmlSha256:string;runtimeId:string;
  character:{className:string;ascendancy:string;level:number;levelAuto?:boolean};
  config:{name:string;fields:PobConfigField[]}[];
  skills:PobSkillOptions[];
  diagnostics:{code:string;field?:string;message:string}[];
}
