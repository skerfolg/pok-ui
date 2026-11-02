import {useEffect,useState} from 'react';
import type {PobEquipment} from '../../shared/pob-equipment';
import {hashBuildXml} from '../../shared/calculation-context';
import {api} from '../services/api';
export function useEquipmentState(buildId:string|undefined,revision:number|undefined,xml:string|undefined,runtimeId:string|undefined){
  const [saved,setSaved]=useState<{xml:string;data:PobEquipment}>(),[pending,setPending]=useState(false),[error,setError]=useState('');
  useEffect(()=>{
    let cancelled=false;setError('');if(!buildId||revision===undefined||!xml||!runtimeId){setPending(false);return;}
    const requestId=crypto.randomUUID(),input={buildId,revision,xml,runtimeId,requestId};setPending(true);
    const timer=setTimeout(()=>{void Promise.all([api.equipment(input),hashBuildXml(xml)]).then(([data,hash])=>{if(cancelled)return;if(data.buildId!==buildId||data.revision!==revision||data.xmlSha256!==hash||data.runtimeId!==runtimeId)throw new Error('원본 장비 상태의 입력/버전이 현재 문서와 다릅니다.');setSaved({xml,data});setPending(false);}).catch(reason=>{if(!cancelled){setError(String(reason));setPending(false);}});},250);
    return()=>{cancelled=true;clearTimeout(timer);void api.cancelPobRequest(requestId).catch(()=>{});};
  },[buildId,revision,xml,runtimeId]);
  const data=saved&&saved.xml===xml&&saved.data.buildId===buildId&&saved.data.revision===revision&&saved.data.runtimeId===runtimeId?saved.data:undefined;
  return{data,pending,error};
}
