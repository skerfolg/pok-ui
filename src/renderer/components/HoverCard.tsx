import {cloneElement,isValidElement,useEffect,useId,useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import {useSyncExternalStore} from 'react';
import {createPortal} from 'react-dom';
let activeHover:string|undefined;
const hoverListeners=new Set<()=>void>();
let mountedCards=0;
const gearHovers=new Map<string,{anchor:HTMLSpanElement;show:()=>void}>();
function trackSlot(event:PointerEvent){if(event.buttons===0)dragEnd();if(gearHovers.size===0)return;if(document.querySelector('.equipment-picker,.modal-backdrop'))return;const slot=document.elementsFromPoint(event.clientX,event.clientY).map(element=>element.closest('.gear-slot')).find(Boolean);if(!slot)return;for(const [id,entry]of gearHovers)if(entry.anchor.contains(slot)&&activeHover!==id){entry.show();break;}}
function dragStart(){document.documentElement.dataset.hoverDrag='true';}
function dragEnd(){delete document.documentElement.dataset.hoverDrag;}
function subscribeHover(callback:()=>void){hoverListeners.add(callback);return()=>{hoverListeners.delete(callback);};}
function claimHover(id:string){if(activeHover===id)return;activeHover=id;for(const notify of hoverListeners)notify();}
/** Pointer and keyboard share one card. Delayed dismissal lets the pointer enter it. */
export function HoverCard({children,content,label,dataSlot,interactive=false}:{children:ReactNode;content:ReactNode;label:string;dataSlot?:string;interactive?:boolean}){
  const [open,setOpen]=useState(false),[position,setPosition]=useState({left:0,top:0});
  const anchor=useRef<HTMLSpanElement>(null),card=useRef<HTMLDivElement>(null),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),id=useId();
  const active=useSyncExternalStore(subscribeHover,()=>activeHover===id);
  function show(){clearTimeout(timer.current);claimHover(id);setOpen(true);}
  function hide(){clearTimeout(timer.current);if(!interactive){setOpen(false);return;}timer.current=setTimeout(()=>setOpen(false),180);}
  useEffect(()=>{if(anchor.current?.querySelector('.gear-slot'))gearHovers.set(id,{anchor:anchor.current,show});if(mountedCards++===0){document.addEventListener('pointermove',trackSlot,true);document.addEventListener('pointerdown',dragStart,true);document.addEventListener('pointerup',dragEnd,true);document.addEventListener('pointercancel',dragEnd,true);window.addEventListener('blur',dragEnd);}return()=>{clearTimeout(timer.current);gearHovers.delete(id);if(--mountedCards===0){document.removeEventListener('pointermove',trackSlot,true);document.removeEventListener('pointerdown',dragStart,true);document.removeEventListener('pointerup',dragEnd,true);document.removeEventListener('pointercancel',dragEnd,true);window.removeEventListener('blur',dragEnd);dragEnd();}};},[]);
  useLayoutEffect(()=>{if(!open||!active)return;const place=()=>{const a=anchor.current?.getBoundingClientRect(),b=card.current?.getBoundingClientRect();if(!a||!b)return;let left=a.right+(interactive?8:0);if(left+b.width>innerWidth-8)left=a.left-b.width-(interactive?8:0);setPosition({left:Math.max(8,Math.min(left,innerWidth-b.width-8)),top:Math.max(8,Math.min(a.top,innerHeight-b.height-8))});};place();const observer=new ResizeObserver(place);if(card.current)observer.observe(card.current);window.addEventListener('resize',place);window.addEventListener('scroll',place,true);return()=>{observer.disconnect();window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);};},[open,active,id,content,interactive]);
  const trigger=isValidElement<{'aria-describedby'?:string}>(children)?cloneElement(children,{'aria-describedby':open&&active?id:undefined}):children;
  return <span className="hover-anchor" data-slot={dataSlot} ref={anchor} onClick={()=>setOpen(false)} onPointerEnter={show} onPointerLeave={event=>{if(!(event.relatedTarget instanceof Node)||!card.current?.contains(event.relatedTarget))hide();}} onFocusCapture={show} onBlurCapture={e=>{if(!card.current?.contains(e.relatedTarget as Node))hide();}} onKeyDown={e=>{if(e.key==='Escape'){setOpen(false);e.stopPropagation();}}}>{trigger}{open&&active&&createPortal(<div ref={card} id={id} role={interactive?'dialog':'tooltip'} aria-modal={interactive?false:undefined} aria-label={label} className="hover-card scroll" style={position} onPointerEnter={show} onPointerLeave={hide} onFocusCapture={show} onBlurCapture={hide}>{content}</div>,document.body)}</span>;
}
