import {useEffect,useState} from 'react';
import type {BuildDocument} from '../../shared/contracts';
import type {PobTreeResult,PobTreeRequest} from '../../shared/pob-tree';
import {hashBuildXml} from '../../shared/calculation-context';
import {api} from '../services/api';
export function useTreeOperation(build:BuildDocument,runtimeId:string|undefined,nodeId:number|undefined,allocated:boolean,allocMode:number,attributeIndex:number|undefined,action?:PobTreeRequest['action'],jewelItemId?:number,enabled=true){
  const [saved,setSaved]=useState<{snapshot:BuildDocument;data:PobTreeResult;nodeId:number;mode:number;attribute?:number;action?:PobTreeRequest['action'];jewelItemId?:number}>(),[pending,setPending]=useState(false),[error,setError]=useState('');
  useEffect(()=>{
    let cancelled=false;setError('');if(!enabled||!runtimeId||nodeId===undefined){setPending(false);return;}
    const snapshot=build,id=nodeId;setPending(true);
    const timer=setTimeout(()=>{void Promise.all([api.editTree({buildId:snapshot.id,revision:snapshot.revision,xml:snapshot.xml,runtimeId,nodeId:id,action:action||(allocated?'deallocate':'allocate'),allocMode,attributeIndex,jewelItemId}),hashBuildXml(snapshot.xml)]).then(([data,hash])=>{
      if(cancelled)return;if(data.buildId!==snapshot.id||data.revision!==snapshot.revision||data.xmlSha256!==hash||data.runtimeId!==runtimeId||data.node?.id!==id)throw new Error('트리 연산 결과의 입력·노드·PoB 버전이 현재 선택과 다릅니다.');
      setSaved({snapshot,data,nodeId:id,mode:allocMode,attribute:attributeIndex,action,jewelItemId});setPending(false);
    }).catch(reason=>{if(!cancelled){setError(String(reason));setPending(false);}});},250);
    return()=>{cancelled=true;clearTimeout(timer);};
  },[build.id,build.revision,build.xml,runtimeId,nodeId,allocated,allocMode,attributeIndex,action,jewelItemId,enabled]);
  const layout=saved&&saved.snapshot.id===build.id&&saved.snapshot.revision===build.revision&&saved.snapshot.xml===build.xml&&saved.nodeId===nodeId&&saved.data.runtimeId===runtimeId?saved:undefined;
  const current=layout&&layout.mode===allocMode&&layout.attribute===attributeIndex&&layout.action===action&&layout.jewelItemId===jewelItemId?layout:undefined;
  return{current,layout,pending,error};
}
