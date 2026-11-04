import {cloneElement,isValidElement,useEffect,useId,useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
/** Pointer and keyboard share one card. Delayed dismissal lets the pointer enter it. */
export function HoverCard({children,content,label,dataSlot,interactive=false}:{children:ReactNode;content:ReactNode;label:string;dataSlot?:string;interactive?:boolean}){
  const [open,setOpen]=useState(false),[position,setPosition]=useState({left:0,top:0});
  const anchor=useRef<HTMLSpanElement>(null),card=useRef<HTMLDivElement>(null),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),id=useId();
  function show(){clearTimeout(timer.current);setOpen(true);}
  function hide(){clearTimeout(timer.current);timer.current=setTimeout(()=>setOpen(false),180);}
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  useLayoutEffect(()=>{if(!open)return;const place=()=>{const a=anchor.current?.getBoundingClientRect(),b=card.current?.getBoundingClientRect();if(!a||!b)return;let left=a.right+8;if(left+b.width>innerWidth-8)left=a.left-b.width-8;setPosition({left:Math.max(8,Math.min(left,innerWidth-b.width-8)),top:Math.max(8,Math.min(a.top,innerHeight-b.height-8))});};place();const observer=new ResizeObserver(place);if(card.current)observer.observe(card.current);window.addEventListener('resize',place);window.addEventListener('scroll',place,true);return()=>{observer.disconnect();window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);};},[open,content]);
  const trigger=isValidElement<{'aria-describedby'?:string}>(children)?cloneElement(children,{'aria-describedby':open?id:undefined}):children;
  return <span className="hover-anchor" data-slot={dataSlot} ref={anchor} onClick={()=>setOpen(false)} onPointerEnter={show} onPointerLeave={hide} onFocusCapture={show} onBlurCapture={e=>{if(!card.current?.contains(e.relatedTarget as Node))hide();}} onKeyDown={e=>{if(e.key==='Escape'){setOpen(false);e.stopPropagation();}}}>{trigger}{open&&createPortal(<div ref={card} id={id} role={interactive?'dialog':'tooltip'} aria-modal={interactive?false:undefined} aria-label={label} className="hover-card scroll" style={position} onPointerEnter={show} onPointerLeave={hide} onFocusCapture={show} onBlurCapture={hide}>{content}</div>,document.body)}</span>;
}
