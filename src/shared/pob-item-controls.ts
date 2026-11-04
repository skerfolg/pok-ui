import type {PobInspectionRequest} from './pob-inspection';
export interface PobItemPopupState {kind:'anoint'|'corrupt';slot?:number;query?:string;nodeId?:number;mode?:'enchants'|'rolls';selections?:Record<string,string|number|boolean>}
export interface PobItemPopup {
  kind:'anoint'|'corrupt';slot:number;state:PobItemPopupState;saveLabel:string;canCommit:boolean;
  modes:{id:'enchants'|'rolls';label:string}[];comparison:string[];
  fields:{id:string;label:string;kind:'select'|'check'|'slider';value:string|number|boolean;enabled:boolean;options?:{key:string;label:string;lines?:string[]}[]}[];
  notables?:{id:number;name:string;stats:string[];recipe:string[];allocated:boolean}[];
}
export interface PobItemControlsRequest extends PobInspectionRequest {itemId:string;runtimeId?:string;draftText?:string;field?:string;value?:string|number;slot?:string;requestId?:string;popup?:(PobItemPopupState&{commit?:boolean})}
export interface PobItemMetadata {variants:Record<string,string>;modRanges:Record<string,string>}
export interface PobItemField {id:string;label:string;kind:'edit'|'select'|'slider';value:string|number;enabled:boolean;limit?:number;filter?:string;min?:number;max?:number;step?:number;description?:string[];options?:{index:number;label:string;name?:string;key?:string;description?:string[]}[]}
export interface PobItemControls {
  buildId:string;revision:number;xmlSha256:string;runtimeId:string;pobCommit:string;itemId:string;inputTextSha256:string;
  text:string;sourcePreserved:boolean;validatedSlot?:string;fields:PobItemField[];diagnostics:{code:string;message:string;lines?:string[]}[];
  actions:{kind:'anoint'|'corrupt';slot?:number;label:string;enabled:boolean}[];popup?:PobItemPopup;
  metadata:PobItemMetadata;
}
