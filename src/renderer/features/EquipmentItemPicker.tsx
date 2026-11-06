import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import type {BuildDocument,Item} from '../../shared/contracts';
import {HoverCard} from '../components/HoverCard';
import {ItemHover} from './ItemHover';

export function EquipmentItemPicker({label,items,choices,currentId,pending,enabled,error,close,select,anchor,build,runtimeId,slot}:{label:string;items:Item[];choices:{id:string;label:string}[];currentId:string;pending:boolean;enabled:boolean;error?:string;close:()=>void;select:(id:string)=>Promise<void>;anchor:HTMLElement|null;build:BuildDocument;runtimeId?:string;slot:string}){
  const [query,setQuery]=useState(''),[position,setPosition]=useState<{left:number;top:number;maxHeight:number;height?:number}>({left:8,top:8,maxHeight:360});
  const search=useRef<HTMLInputElement>(null),panel=useRef<HTMLElement>(null);
  useEffect(()=>{search.current?.focus();},[]);
  useLayoutEffect(()=>{
    if(!anchor)return;
    const place=()=>{const rect=anchor.getBoundingClientRect(),width=Math.min(320,innerWidth-16),below=innerHeight-rect.bottom-12,above=rect.top-12,down=below>=Math.min(300,above),space=Math.max(100,down?below:above),height=down?Math.min(panel.current?.scrollHeight||360,360,space):Math.min(360,space);setPosition({left:Math.max(8,Math.min(rect.left,innerWidth-width-8)),top:Math.max(8,down?rect.bottom+4:rect.top-height-4),maxHeight:Math.min(360,space),height:down?undefined:height});};
    place();const observer=new ResizeObserver(place);if(panel.current)observer.observe(panel.current);window.addEventListener('resize',place);window.addEventListener('scroll',place,true);
    return()=>{observer.disconnect();window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);};
  },[anchor]);
  useEffect(()=>{const outside=(event:PointerEvent)=>{const target=event.target as HTMLElement;if(!pending&&!panel.current?.contains(target)&&!anchor?.contains(target)&&!target.closest('.hover-card'))close();};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);},[anchor,pending,close]);
  return createPortal(<section ref={panel} className="equipment-picker" role="dialog" aria-modal="false" aria-label={`${label} 아이템 선택`} style={position} onKeyDown={event=>{
    if(event.key==='Escape'){event.stopPropagation();if(!pending)close();}
    const controls=[...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled)')];
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();const index=controls.indexOf(document.activeElement as HTMLElement),step=event.key==='ArrowDown'?1:-1;controls[(index+step+controls.length)%controls.length]?.focus();}
    if(event.key==='Tab'){if(event.shiftKey&&document.activeElement===controls[0]){event.preventDefault();controls.at(-1)?.focus();}else if(!event.shiftKey&&document.activeElement===controls.at(-1)){event.preventDefault();controls[0]?.focus();}}
  }}>
    <header className="panel-heading"><h2>{label}</h2><button disabled={pending} onClick={close} aria-label="닫기">×</button></header>
    <input ref={search} type="search" aria-label="장착 가능한 아이템 검색" placeholder="아이템 이름 검색" value={query} onChange={event=>setQuery(event.target.value)}/>
    {error&&<p role="alert" className="warning">{error}</p>}
    {pending&&<p role="status" className="screen-reader-only">아이템 목록 확인 중…</p>}
    <div className="equipment-picker-list scroll">
      <button className="equipment-picker-choice" aria-pressed={currentId==='0'} disabled={pending||!enabled} onClick={()=>void select('0')}><span>비우기</span>{currentId==='0'&&<small>현재 선택</small>}</button>
      {choices.filter(choice=>choice.id!=='0').filter(choice=>{const item=items.find(item=>item.id===choice.id);return `${item?.name||choice.label} ${item?.base||''}`.toLowerCase().includes(query.toLowerCase());}).map(choice=>{const item=items.find(item=>item.id===choice.id);const button=<button className="equipment-picker-choice" aria-pressed={currentId===choice.id} disabled={pending||!enabled} onClick={()=>void select(choice.id)}><span className={item?'rarity-'+item.rarity.toLowerCase():undefined}>{item?.name||choice.label}{item?.base&&item.base!==item.name?`, ${item.base}`:''}</span>{currentId===choice.id&&<small>✓</small>}</button>;return item?<HoverCard key={choice.id} label={`${item.name} 옵션`} content={<ItemHover build={build} item={item} runtimeId={runtimeId} slot={slot}/>}>{button}</HoverCard>:<div key={choice.id}>{button}</div>;})}
    </div>
  </section>,document.body);
}
