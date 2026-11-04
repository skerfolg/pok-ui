import {useEffect,useRef,useState} from 'react';
import type {BuildDocument,BuildEdit} from '../../shared/contracts';
import {parseBuild} from '../../shared/pob-document';
import {hashBuildXml} from '../../shared/calculation-context';
import {api} from '../services/api';
type Change={buildId:string;specId:string;runtimeId:string;nodeId:number;mode:number;kind?:'attribute'|'jewel';value?:number};
export function useTreeChanges(build:BuildDocument,specId:string|undefined,runtimeId:string|undefined,enabled:boolean,applyExpected:(snapshot:BuildDocument,edit:BuildEdit,label:string)=>BuildDocument){
  const latest=useRef({build,specId,runtimeId,enabled,applyExpected});
  const currentBuild=latest.current.build.id!==build.id||build.revision>=latest.current.build.revision?build:latest.current.build;
  latest.current={build:currentBuild,specId,runtimeId,enabled,applyExpected};
  const queue=useRef<Change[]>([]),working=useRef(false),epoch=useRef(0);
  const [pending,setPending]=useState(false),[error,setError]=useState('');
  useEffect(()=>()=>{epoch.current++;queue.current=[];},[build.id,specId,runtimeId]);
  async function drain(){
    if(working.current)return;working.current=true;setPending(true);setError('');const token=epoch.current;
    try{while(queue.current.length){
      const change=queue.current.shift()!,context=latest.current,snapshot=context.build;
      if(token!==epoch.current||!context.enabled||snapshot.id!==change.buildId||context.specId!==change.specId||context.runtimeId!==change.runtimeId)throw new Error('빌드·패시브 세트·PoB가 변경되어 대기 중인 노드 변경을 취소했습니다.');
      const spec=parseBuild(snapshot.xml).trees.find(tree=>tree.id===change.specId);if(!spec)throw new Error('변경할 패시브 세트가 없습니다.');
      const allocated=spec.nodes.includes(change.nodeId),action=change.kind==='attribute'&&!allocated?'allocate':change.kind||(allocated?'deallocate':'allocate');
      const [data,hash]=await Promise.all([api.editTree({buildId:snapshot.id,revision:snapshot.revision,xml:snapshot.xml,runtimeId:change.runtimeId,nodeId:change.nodeId,action,allocMode:change.mode,attributeIndex:change.kind==='attribute'?change.value:undefined,jewelItemId:change.kind==='jewel'?change.value:undefined}),hashBuildXml(snapshot.xml)]);
      if(token!==epoch.current)return;
      if(data.buildId!==snapshot.id||data.revision!==snapshot.revision||data.xmlSha256!==hash||data.runtimeId!==change.runtimeId||data.node?.id!==change.nodeId)throw new Error('노드 변경 응답의 입력·대상·PoB 출처가 일치하지 않습니다.');
      if(data.diagnostics.length)throw new Error(data.diagnostics.map(row=>row.message).join(' · '));
      if(!data.added.length&&!data.removed.length&&!data.modified.length)continue;
      const next=context.applyExpected(snapshot,{type:'tree-native-patch',specId:change.specId,patch:data.patch},`패시브 노드 ${change.nodeId} 변경`);
      latest.current={...latest.current,build:next};
    }}catch(reason){if(token===epoch.current){queue.current=[];setError(String(reason));}}
    finally{working.current=false;setPending(false);if(queue.current.length)void drain();}
  }
  function change(nodeId:number,mode:number,kind?:Change['kind'],value?:number){
    const context=latest.current;if(!context.enabled||!context.runtimeId||!context.specId)return;
    queue.current.push({buildId:context.build.id,specId:context.specId,runtimeId:context.runtimeId,nodeId,mode,kind,value});void drain();
  }
  return{change,pending,error};
}
