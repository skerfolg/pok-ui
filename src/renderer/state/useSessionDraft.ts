import {useSyncExternalStore,type SetStateAction} from 'react';
import {sessionDrafts} from './session-drafts';
export function useSessionDraft<T>(owner:string,field:string,initial:T|(()=>T)):[T,(next:SetStateAction<T>)=>void]{
  const create=()=>typeof initial==='function'?(initial as ()=>T)():initial;
  const value=useSyncExternalStore(sessionDrafts.subscribe,()=>sessionDrafts.get(owner,field,create));
  return[value,next=>{const previous=sessionDrafts.get(owner,field,create),value=typeof next==='function'?(next as (value:T)=>T)(previous):next;sessionDrafts.set(owner,field,value);}];
}
