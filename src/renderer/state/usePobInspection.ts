import {useEffect,useState} from 'react';
import type {BuildDocument} from '../../shared/contracts';
import type {PobInspection} from '../../shared/pob-inspection';
import {hashBuildXml} from '../../shared/calculation-context';
import {api} from '../services/api';
export function usePobInspection(build:BuildDocument|undefined,runtimeId:string|undefined){
  const [saved,setSaved]=useState<{data:PobInspection;xml:string}>(),[pending,setPending]=useState(false),[error,setError]=useState('');
  useEffect(()=>{
    let cancelled=false;setError('');
    if(!build||!runtimeId){setPending(false);return;}
    setPending(true);const request={buildId:build.id,revision:build.revision,xml:build.xml};
    const timer=setTimeout(()=>{void Promise.all([api.inspectBuild(request),hashBuildXml(request.xml)]).then(([result,hash])=>{
      if(cancelled)return;
      if(result.buildId!==request.buildId||result.revision!==request.revision||result.xmlSha256!==hash||result.runtimeId!==runtimeId)throw new Error('PoB 조회 결과의 입력 또는 버전이 현재 문서와 다릅니다.');
      setSaved({data:result,xml:request.xml});setPending(false);
    }).catch(reason=>{if(!cancelled){setError(String(reason));setPending(false);}});},250);
    return()=>{cancelled=true;clearTimeout(timer);};
  },[build?.id,build?.revision,build?.xml,runtimeId]);
  const data=saved?.data;
  const current=data&&build&&saved?.xml===build.xml&&data.buildId===build.id&&data.revision===build.revision&&data.runtimeId===runtimeId?data:undefined;
  return{data:current,layout:data?.buildId===build?.id&&data?.runtimeId===runtimeId?data:undefined,pending,error};
}
