import {useSyncExternalStore} from 'react';
import type {BuildDocument} from '../../shared/contracts';
import type {PobCalcs,PobCalcsRequest} from '../../shared/pob-calcs';
import type {PobItemTooltip,PobItemTooltipRequest} from '../../shared/pob-item-tooltip';
import {hashBuildXml,isCalculationCurrent} from '../../shared/calculation-context';
import {api} from '../services/api';
type Context=Pick<BuildDocument,'id'|'revision'|'xml'>;
type Request={buildId:string;revision:number;xml:string;runtimeId?:string};
type Presentation=Pick<PobItemTooltip,'displayLines'|'requirements'>;
const entries=new Map<string,{xml:string;value:unknown;bytes:number}>(),pending=new Map<string,{xml:string;promise:Promise<unknown>}>(),listeners=new Set<()=>void>();
let epoch=0,version=0,bytes=0;
const notify=()=>{version++;for(const listener of listeners)listener();};
function freeze<T>(value:T):T{if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;}
export function detailEpoch(){return epoch;}
export function clearDetailReads(){epoch++;entries.clear();pending.clear();bytes=0;notify();}
export function useDetailReads(){useSyncExternalStore(listener=>{listeners.add(listener);return()=>listeners.delete(listener);},()=>version);}
const key=(kind:string,input:Request,extra:unknown)=>JSON.stringify([kind,input.buildId,input.revision,input.runtimeId,extra]);
function peek<T>(name:string,xml:string):T|undefined{const entry=entries.get(name);if(entry?.xml!==xml)return;entries.delete(name);entries.set(name,entry);return entry.value as T;}
function put(name:string,xml:string,value:unknown){
  const size=2*(xml.length+JSON.stringify(value).length);if(size>12*1024*1024)return;
  const old=entries.get(name);if(old)bytes-=old.bytes;entries.delete(name);entries.set(name,{xml,value:freeze(structuredClone(value)),bytes:size});bytes+=size;
  while(entries.size>256||bytes>12*1024*1024){const first=entries.keys().next().value!;bytes-=entries.get(first)!.bytes;entries.delete(first);}notify();
}
function load<T>(name:string,xml:string,read:()=>Promise<T>):Promise<T>{
  const cached=peek<T>(name,xml);if(cached)return Promise.resolve(cached);
  const existing=pending.get(name);if(existing?.xml===xml)return existing.promise as Promise<T>;
  const token=epoch,entry={xml,promise:undefined as unknown as Promise<T>};
  entry.promise=read().then(value=>{if(epoch!==token)throw new Error('PoB 출처가 변경되어 상세 결과를 폐기했습니다.');if(pending.get(name)===entry)put(name,xml,value);return peek<T>(name,xml)??freeze(value);}).finally(()=>{if(pending.get(name)===entry)pending.delete(name);});pending.set(name,entry);return entry.promise;
}
export function peekItemTooltip(input:PobItemTooltipRequest){return peek<PobItemTooltip>(key('item',input,[input.itemId,input.slot,input.nodeId]),input.xml);}
export function readItemTooltip(input:PobItemTooltipRequest){return load(key('item',input,[input.itemId,input.slot,input.nodeId]),input.xml,async()=>{
  const [value,hash]=await Promise.all([api.itemTooltip(input),hashBuildXml(input.xml)]);
  if(value.buildId!==input.buildId||value.revision!==input.revision||value.xmlSha256!==hash||value.runtimeId!==input.runtimeId||value.itemId!==input.itemId||value.slot!==input.slot||value.nodeId!==input.nodeId)throw new Error('아이템 비교의 입력·위치·PoB 출처가 다릅니다.');return value;
});}
export function peekCalcs(input:PobCalcsRequest){return peek<PobCalcs>(key('calcs',input,input.cellId),input.xml);}
export function readCalcs(input:PobCalcsRequest){return load(key('calcs',input,input.cellId),input.xml,async()=>{
  const [value,hash]=await Promise.all([api.readCalcs(input),hashBuildXml(input.xml)]);
  if(value.buildId!==input.buildId||value.revision!==input.revision||value.xmlSha256!==hash||value.runtimeId!==input.runtimeId||input.cellId&&value.breakdown?.cellId!==input.cellId)throw new Error('계산 근거의 입력·셀·PoB 출처가 다릅니다.');return value;
});}
const request=(build:Context,runtimeId:string):Request=>({buildId:build.id,revision:build.revision,xml:build.xml,runtimeId});
export function peekItemDisplay(build:Context,runtimeId:string|undefined,itemId:string){return runtimeId?peek<Presentation>(key('display',request(build,runtimeId),itemId),build.xml):undefined;}
export function seedItemDisplay(build:Context,runtimeId:string,itemId:string,value:Presentation){put(key('display',request(build,runtimeId),itemId),build.xml,value);}
export function seedCalculationDisplays(build:BuildDocument,runtimeId:string,hash:string){
  if(!isCalculationCurrent(build,runtimeId,hash)||build.calculation?.provenance?.runtime!=='pob')return;
  const displays=build.calculation.result.itemDisplays;if(!displays||typeof displays!=='object'||Array.isArray(displays))return;
  for(const [id,value]of Object.entries(displays)){const entry=value as Presentation;if(!entry||!Array.isArray(entry.displayLines)||!entry.displayLines.every(line=>typeof line==='string')||!Array.isArray(entry.requirements)||!entry.requirements.every(line=>typeof line==='string'))continue;seedItemDisplay(build,runtimeId,id,entry);}
}
/** One low-priority request at a time; interactive requests use the same results. */
export async function warmDetails(build:BuildDocument,runtimeId:string,alive:()=>boolean){
  const base=request(build,runtimeId),table=await readCalcs({...base,prefetch:true});if(!alive())return;
  const targets=build.calculation?.result.detailTargets;
  if(Array.isArray(targets))for(const target of targets.slice(0,12)){if(!alive())return;if(typeof target?.itemId!=='string'||target.slot!==undefined&&typeof target.slot!=='string')continue;try{await readItemTooltip({...base,runtimeId,itemId:target.itemId,slot:target.slot,prefetch:true});}catch{/* Foreground errors are reported by its own request. */}}
  const cells=table.sections.flatMap(section=>section.subsections.flatMap(sub=>sub.rows.filter(row=>/Total|DPS|Average/.test(row.label)).flatMap(row=>row.cells.filter(cell=>cell.breakdown))));
  for(const cell of cells.slice(0,3)){if(!alive())return;try{await readCalcs({...base,cellId:cell.id,prefetch:true});}catch{}}
}
