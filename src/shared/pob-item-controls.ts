import type {PobInspectionRequest} from './pob-inspection';
export interface PobItemPopupState {kind:'anoint'|'corrupt'|'add';slot?:number;query?:string;nodeId?:number;mode?:'enchants'|'rolls';selections?:Record<string,string|number|boolean>}
export interface PobItemPopup {
  kind:'anoint'|'corrupt'|'add';slot:number;state:PobItemPopupState;saveLabel:string;canCommit:boolean;
  modes:{id:'enchants'|'rolls';label:string}[];comparison:string[];
  fields:{id:string;label:string;kind:'select'|'check'|'slider'|'edit';value:string|number|boolean;enabled:boolean;limit?:number;options?:{key:string;label:string;lines?:string[]}[]}[];
  notables?:{id:number;name:string;stats:string[];recipe:string[];allocated:boolean}[];
}
export interface PobItemControlsRequest extends PobInspectionRequest {itemId:string;runtimeId?:string;draftText?:string;field?:string;value?:string|number;slot?:string;requestId?:string;similar?:PobSimilarSearchState;popup?:(PobItemPopupState&{commit?:boolean})}
export interface PobItemMetadata {variants:Record<string,string>;modRanges:Record<string,string>}
export interface PobSimilarSearchState {league?:string;selections?:Record<string,string|number|boolean>}
export interface PobSimilarSearch {
  url:string;realm:string;league:string;state:PobSimilarSearchState;
  rows:{id:string;label:string;fields:{id:string;kind:'select'|'check'|'edit';enabled:boolean;value:string|number|boolean;limit?:number;filter?:string;options?:{index:number;label:string}[]}[]}[];
}
export interface PobItemField {id:string;label:string;kind:'edit'|'select'|'slider';value:string|number;enabled:boolean;limit?:number;filter?:string;min?:number;max?:number;step?:number;description?:string[];options?:{index:number;label:string;name?:string;key?:string;description?:string[]}[]}
export interface PobItemControls {
  buildId:string;revision:number;xmlSha256:string;runtimeId:string;pobCommit:string;itemId:string;inputTextSha256:string;
  text:string;sourcePreserved:boolean;validatedSlot?:string;fields:PobItemField[];diagnostics:{code:string;message:string;lines?:string[]}[];
  actions:{kind:'anoint'|'corrupt'|'add';slot?:number;label:string;enabled:boolean}[];popup?:PobItemPopup;
  metadata:PobItemMetadata;
  similar?:PobSimilarSearch;
}
