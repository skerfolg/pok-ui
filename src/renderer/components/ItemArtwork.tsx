import {useEffect,useState,type ReactNode} from 'react';
import type {Item} from '../../shared/contracts';
import {itemArtwork,type ItemArtIndex} from '../../shared/item-art';
import {api} from '../services/api';
let ready:ItemArtIndex|undefined,request:Promise<ItemArtIndex>|undefined;
export function ItemArtwork({item,fallback}:{item:Item;fallback:ReactNode}){
  const [index,setIndex]=useState(ready),[failed,setFailed]=useState(false);
  useEffect(()=>{let alive=true;if(ready){setIndex(ready);}else{request??=api.getItemArtIndex().then(value=>{ready=value;return value;});void request.then(value=>{if(alive)setIndex(value);}).catch(()=>{});}return()=>{alive=false;};},[]);
  const art=itemArtwork(index,item);useEffect(()=>setFailed(false),[art?.url]);
  return art&&!failed?<img className="item-artwork" src={art.url} alt={item.name} draggable={false} onError={()=>setFailed(true)}/>:<span className="item-artwork-fallback">{fallback}</span>;
}
