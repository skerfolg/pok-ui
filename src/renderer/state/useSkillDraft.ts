import {useEffect,useRef,useState} from 'react';
import type {SkillGroup} from '../../shared/contracts';
import {SkillDraft} from '../../shared/skill-draft';

const drafts=new Map<string,{base:SkillGroup;value:SkillGroup;numbers:Record<string,string>}>();
/** Key the editor by owner. Cached drafts never cross build/group/runtime owners. */
export function useSkillDraft(owner:string,group:SkillGroup,commit:(value:SkillGroup,base:SkillGroup)=>SkillGroup){
  const [model]=useState(()=>new SkillDraft(group,drafts.get(owner)));
  const [,redraw]=useState(0),latest=useRef({group,commit}),mounted=useRef(true);latest.current={group,commit};
  function persist(){if(model.dirty)drafts.set(owner,{base:structuredClone(model.base),value:structuredClone(model.value),numbers:{...model.numbers}});else drafts.delete(owner);while(drafts.size>64)drafts.delete(drafts.keys().next().value!);}
  function refresh(){persist();if(mounted.current)redraw(value=>value+1);}
  function flush(){const result=model.flush((value,base)=>latest.current.commit(value,base));refresh();return result;}
  function change(next:SkillGroup|((current:SkillGroup)=>SkillGroup|undefined)|undefined){if(!next)return;const value=typeof next==='function'?next(model.value):next;if(value){model.change(value);refresh();}}
  useEffect(()=>{if(model.receive(group))refresh();},[group]);
  useEffect(()=>{if(!model.dirty||!model.valid||model.error)return;const timer=setTimeout(flush,350);return()=>clearTimeout(timer);},[model.value,model.numbers,model.error]);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;model.flush((value,base)=>latest.current.commit(value,base));persist();};},[]);
  return{draft:model.value,change,flush,error:model.error,dirty:model.dirty,number:(index:number,field:'level'|'quality',text:string)=>{model.number(index,field,text);refresh();},numberText:(index:number,field:'level'|'quality')=>model.numbers[index+':'+field]??String(model.value.gems[index][field]),discard:()=>{model.reset(latest.current.group);refresh();}};
}
