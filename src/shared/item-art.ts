import type {Item} from './contracts';
export interface ItemArtwork {hash:string;url:string;width:number;height:number}
export interface ItemArtIndex {bases:Record<string,string>;uniques:Record<string,string>;files:Record<string,ItemArtwork>}
export function itemArtwork(index:ItemArtIndex|undefined,item:Item):ItemArtwork|undefined{
  if(!index)return;
  const unique=['UNIQUE','RELIC'].includes(item.rarity.toUpperCase());
  const hash=unique?(index.uniques[item.name+'\n'+item.base]||index.uniques[item.name]||index.bases[item.base]):index.bases[item.base];
  return hash?index.files[hash]:undefined;
}
