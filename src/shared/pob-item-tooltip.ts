import type {PobInspectionRequest} from './pob-inspection';
export interface PobItemTooltipRequest extends PobInspectionRequest {runtimeId:string;itemId:string;slot?:string;nodeId?:number}
export interface PobItemTooltip {
  buildId:string;revision:number;xmlSha256:string;runtimeId:string;pobCommit:string;itemId:string;slot?:string;nodeId?:number;
  requirements:string[];
  comparisons:{header:string;lines:string[]}[];
}
