import type {PobInspectionRequest} from './pob-inspection';
export const partyNames=['PartyMemberStats','Aura','Curse','Warcry Skills','Link Skills','EnemyConditions','EnemyMods'] as const;
export type PartyName=typeof partyNames[number];
export interface PobPartyRequest extends PobInspectionRequest {runtimeId?:string;action?:'read'|'import'|'clear';supportXml?:string;destination?:string;append?:boolean}
export interface PobParty {
  buildId:string;revision:number;xmlSha256:string;runtimeId:string;pobCommit:string;supportSha256?:string;
  buffers:Record<PartyName,string>;exports:Partial<Record<PartyName,string>>;summaries:Partial<Record<PartyName,string>>;
  destinations:string[];exportEnabled:boolean;help:string;
  diagnostics:{code:string;field?:string;line?:number;message:string}[];
}
