import type {PobInspectionRequest} from './pob-inspection';
export interface PobEquipmentPatch {slots:Record<string,string>;useSecondWeaponSet?:boolean;mainSocketGroup?:number}
export interface PobEquipmentRequest extends PobInspectionRequest {runtimeId?:string;requestId?:string;action?:'equip'|'weapon';slot?:string;itemId?:string;weaponSet?:number}
export interface PobEquipment {
  buildId:string;revision:number;xmlSha256:string;runtimeId:string;pobCommit:string;
  useSecondWeaponSet:boolean;mainSocketGroup:number;beforeSlots:Record<string,string>;patch:PobEquipmentPatch;
  slots:{name:string;label:string;parentSlot?:string;weaponSet?:number;itemId:string;visible:boolean;enabled:boolean;choices:{id:string;label:string}[]}[];
  diagnostics:{code:string;field?:string;message:string}[];
}
