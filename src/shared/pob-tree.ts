import type {PobInspectionRequest} from './pob-inspection';
export interface PobTreePatch {attributes:Record<string,string>;buildAttributes?:Record<string,string>;weaponSets?:Record<string,string>;attributeOverrides?:Record<string,string>;sockets?:Record<string,string>;url?:string}
export interface PobTreeRequest extends PobInspectionRequest {runtimeId?:string;nodeId?:number;action?:'allocate'|'deallocate'|'attribute'|'jewel'|'character';allocMode?:number;attributeIndex?:number;jewelItemId?:number;classId?:number;ascendancyId?:number;classChoice?:'reset'|'connect'}
export interface PobTreeResult {
  buildId:string;revision:number;xmlSha256:string;runtimeId:string;pobCommit:string;treeVersion:string;
  patch:PobTreePatch;added:number[];removed:number[];modified:number[];path:number[];
  counts:{normal:number;ascendancy:number;secondaryAscendancy:number;sockets:number;weapon1:number;weapon2:number};
  node?:{id:number;name:string;stats:string[];allocated:boolean;mode:number;isAttribute:boolean;attributeOptions:{index:number;label:string}[];socket?:{itemId:number;choices:{id:number;label:string}[]}};
  nodes?:{id:number;name:string;allocated:boolean;mode:number;pathLength:number;type:string;isAttribute:boolean}[];
  diagnostics:{code:string;message:string}[];
  character?:{classId:number;ascendancyId:number;classes:{id:number;label:string;ascendancies:{id:number;label:string}[]}[];decision?:{title:string;message:string;resetLabel:string;connectLabel:string}};
}
