import type {PobInspectionRequest,PobSkillOptions} from './pob-inspection';
export interface PobCalcsRequest extends PobInspectionRequest {cellId?:string;runtimeId?:string}
export interface PobCalcCell {id:string;text:string;breakdown:boolean}
export interface PobBreakdownSection {
  type:string;label?:string;footer?:string;lines?:string[];radius?:number;
  columns?:{key:string;label:string}[];
  rows?:{values:Record<string,string>;source?:string;sourceSlot?:string}[];
}
export interface PobCalcs {
  buildId:string;revision:number;xmlSha256:string;runtimeId:string;pobCommit:string;at:string;
  selectors:{group:number;mode:string;modeHelp?:string;showMinion:boolean;minionAvailable:boolean;groups:{index:number;label:string}[];modes:{value:string;label:string}[];skill?:PobSkillOptions};
  sections:{id:string;group:number;width?:number;subsections:{id:string;label:string;extra?:string;rows:{label:string;cells:PobCalcCell[]}[]}[]}[];
  diagnostics:{code:string;field?:string;message:string}[];
  breakdown?:{cellId:string;sections:PobBreakdownSection[]};
}
