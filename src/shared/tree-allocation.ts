import type {TreeSpec} from './contracts';
/** Display persisted assignments; pathing and validity are delegated to PoB. */
export function treeAllocationModes(spec:TreeSpec|undefined):Map<number,number>{
  const result=new Map<number,number>();
  for(const [key,ids] of Object.entries(spec?.weaponSets||{}))for(const id of ids)result.set(id,key==='WeaponSet1'?1:2);
  return result;
}
