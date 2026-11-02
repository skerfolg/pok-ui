import {useEffect,useRef,useState} from 'react';
import type {BuildDocument,BuildEdit} from '../../shared/contracts';
import {changesTreeSelection,resolveTreeSetEdit} from '../../shared/pob-tree-sets';
import {api} from '../services/api';
export function useTreeSetEdits(build:BuildDocument|undefined,runtimeId:string|undefined,applyExpected:(snapshot:BuildDocument,edit:BuildEdit,label:string)=>BuildDocument,setError:(message:string)=>void){
  const generation=useRef(0),[pending,setPending]=useState(false);
  useEffect(()=>{generation.current++;setPending(false);return()=>{generation.current++;};},[build?.id,build?.revision,build?.xml,runtimeId]);
  function handle(edit:BuildEdit,label:string){
    if(!changesTreeSelection(edit))return false;
    if(!build||!runtimeId){setError('패시브 세트를 전환하려면 독립 PoB 런타임을 준비해 주세요.');return true;}
    const snapshot=build,token=++generation.current;setPending(true);setError('');
    void resolveTreeSetEdit(snapshot,edit,runtimeId,request=>api.editTree(request)).then(async resolved=>{
      if(token!==generation.current)return;
      const info=await api.getPobRuntimeInfo();if(token!==generation.current)return;
      if(info.status!=='ready'||info.runtimeId!==runtimeId)throw new Error('패시브 세트 조회 후 PoB 버전이 바뀌었습니다. 다시 선택해 주세요.');
      applyExpected(snapshot,resolved.edit,label);
    }).catch(reason=>{if(token===generation.current)setError(String(reason));}).finally(()=>{if(token===generation.current)setPending(false);});
    return true;
  }
  return{handle,pending,cancel:()=>{generation.current++;setPending(false);}};
}
