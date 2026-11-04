import {NativeBreakdown} from '../components/NativeBreakdown';
import {useEffect,useState} from 'react';
import type {BuildDocument} from '../../shared/contracts';
import type {PobCalcs} from '../../shared/pob-calcs';
import {hashBuildXml} from '../../shared/calculation-context';
import {api} from '../services/api';
import {type WorkspaceLocation} from '../state/workspace-location';
export function CalcHover({build,runtimeId,cellId,navigate,configKeys}:{build:BuildDocument;runtimeId?:string;cellId:string;configKeys?:string[];navigate?:(target:WorkspaceLocation)=>void}){
  const [data,setData]=useState<PobCalcs>(),[error,setError]=useState('');
  useEffect(()=>{let alive=true;const request={buildId:build.id,revision:build.revision,xml:build.xml,runtimeId,cellId};
    void Promise.all([api.readCalcs(request),hashBuildXml(build.xml)]).then(([result,hash])=>{
      if(!alive)return;if(result.buildId!==request.buildId||result.revision!==request.revision||result.xmlSha256!==hash||result.runtimeId!==runtimeId||result.breakdown?.cellId!==cellId)throw new Error('현재 입력의 근거가 아닙니다.');setData(result);
    }).catch(reason=>{if(alive)setError(String(reason));});return()=>{alive=false;};
  },[build.id,build.revision,build.xml,runtimeId,cellId]);
  return <div className="calc-hover"><strong>원본 PoB 계산 근거 · 리비전 {build.revision}</strong>{error&&<p role="alert">{error}</p>}{!data&&!error&&<p role="status">기여·배율·조건·출처 확인 중…</p>}{data?.breakdown?.sections.map((section,index)=><NativeBreakdown key={index} section={section} context={{groupId:data.selectors.skill?.groupId,grantedEffectId:data.selectors.skill?.grantedEffectId,configKeys}} navigate={navigate}/>)}{data&&!data.breakdown?.sections.length&&<p>현재 항목의 기여 근거를 원본이 제공하지 않았습니다.</p>}{data?.diagnostics.map((d,i)=><p key={i} className="warning">{d.message}</p>)}</div>;
}
