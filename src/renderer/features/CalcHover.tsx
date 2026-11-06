import {useRetainedPresentation} from '../state/useRetainedPresentation';
import {useDetailReads,peekCalcs,readCalcs} from '../state/native-detail-cache';
import {NativeBreakdown} from '../components/NativeBreakdown';
import {useEffect,useState} from 'react';
import type {BuildDocument} from '../../shared/contracts';
import {type WorkspaceLocation} from '../state/workspace-location';
export function CalcHover({build,runtimeId,cellId,navigate,configKeys}:{build:BuildDocument;runtimeId?:string;cellId:string;configKeys?:string[];navigate?:(target:WorkspaceLocation)=>void}){
  useDetailReads();const [error,setError]=useState(''),request={buildId:build.id,revision:build.revision,xml:build.xml,runtimeId,cellId},current=peekCalcs(request);
  const data=useRetainedPresentation(JSON.stringify([build.id,runtimeId,cellId]),current);
  useEffect(()=>{let alive=true;setError('');if(!runtimeId||current)return;void readCalcs(request).catch(reason=>{if(alive)setError(String(reason));});return()=>{alive=false;};},[build.id,build.revision,build.xml,runtimeId,cellId,Boolean(current)]);
  return <div className="calc-hover"><strong>계산 근거{!current&&data?' · 이전 결과 · 갱신 중':''}</strong>{error&&<p role="alert">{error}</p>}{!data&&!error&&<p role="status">기여·배율·조건·출처 확인 중…</p>}{data?.breakdown?.sections.map((section,index)=><NativeBreakdown key={index} section={section} context={{groupId:data.selectors.skill?.groupId,grantedEffectId:data.selectors.skill?.grantedEffectId,configKeys}} navigate={current?navigate:undefined}/>)}{data&&!data.breakdown?.sections.length&&<p>이 항목의 상세 근거가 없습니다.</p>}{data?.diagnostics.map((d,i)=><p key={i} className="warning">{d.message}</p>)}</div>;
}
