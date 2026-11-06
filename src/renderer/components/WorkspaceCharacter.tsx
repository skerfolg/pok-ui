import {useRetainedPresentation} from '../state/useRetainedPresentation';
import {readWorkspaceCharacter} from '../state/workspace-character';
import {useEffect,useRef,useState} from 'react';
import type {BuildDocument,BuildEdit,ParsedBuild} from '../../shared/contracts';
import type {PobTreeResult} from '../../shared/pob-tree';
import {hashBuildXml} from '../../shared/calculation-context';
import {api} from '../services/api';
import {NumberField} from './NumberField';
export function WorkspaceCharacter({build,parsed,runtimeId,applyExpected,openTree}:{build:BuildDocument;parsed:ParsedBuild;runtimeId?:string;applyExpected:(snapshot:BuildDocument,edit:BuildEdit,label:string)=>BuildDocument;openTree:()=>void}){
  const [saved,setData]=useState<PobTreeResult>(),[pending,setPending]=useState(false),[error,setError]=useState(''),[decision,setDecision]=useState<{snapshot:BuildDocument;classId:number;data:PobTreeResult}>();
  const generation=useRef(0),active=parsed.trees.find(t=>t.active);
  const current=saved?.buildId===build.id&&saved.revision===build.revision&&saved.runtimeId===runtimeId?saved:undefined;
  const data=useRetainedPresentation(JSON.stringify([build.id,runtimeId,active?.id,active?.version]),current);
  useEffect(()=>{const token=++generation.current;setDecision(undefined);setError('');setPending(false);if(!runtimeId||!active)return;
    const timer=setTimeout(()=>{void readWorkspaceCharacter(build,runtimeId).then(async result=>{
      const hash=await hashBuildXml(build.xml);if(token!==generation.current)return;
      if(result.buildId!==build.id||result.revision!==build.revision||result.xmlSha256!==hash||result.runtimeId!==runtimeId)throw new Error('캐릭터 조회 입력이 변경되었습니다.');setData(result);
    }).catch(reason=>{if(token===generation.current)setError(String(reason));});},16);
    return()=>{generation.current++;clearTimeout(timer);};
  },[build.id,build.revision,build.xml,runtimeId]);
  async function changeClass(classId:number,choice?:'reset'|'connect'){
    if(pending||!active||!runtimeId)return;const token=++generation.current,snapshot=build;setPending(true);setError('');
    try{const [result,hash]=await Promise.all([api.editTree({buildId:snapshot.id,revision:snapshot.revision,xml:snapshot.xml,runtimeId,action:'character',classId,ascendancyId:0,classChoice:choice}),hashBuildXml(snapshot.xml)]);
      if(token!==generation.current)return;
      if(result.buildId!==snapshot.id||result.revision!==snapshot.revision||result.xmlSha256!==hash||result.runtimeId!==runtimeId||!result.character)throw new Error('직업 변경 근거가 현재 입력과 다릅니다.');
      if(result.character.decision){setDecision({snapshot,classId,data:result});return;}
      applyExpected(snapshot,{type:'tree-native-patch',specId:active.id,patch:result.patch},'직업 변경');setDecision(undefined);
    }catch(reason){if(token===generation.current)setError(String(reason));}finally{if(token===generation.current)setPending(false);}
  }
  return <div className="workspace-character"><button className="passive-counts" aria-busy={!current} onClick={openTree} title={error||(!current&&data?'이전 패시브 현황 · 갱신 중':data?.pointDisplay?.help)||'패시브 현황'}>{(['일반','무기 I','무기 II','전직'] as const).map((label,index)=><span key={label}><small>{label}</small><b>{data?.pointDisplay?.text.match(/-?\d+\s*\/\s*-?\d+/g)?.[index]||(data?[data.counts.normal,data.counts.weapon1,data.counts.weapon2,data.counts.ascendancy][index]:'—')}</b></span>)}</button><label title={parsed.levelAuto?'원본 자동 레벨 · 직접 입력하면 수동 모드로 전환합니다.':undefined}>레벨<NumberField key={build.id} label="캐릭터 레벨" integer commitUnchanged value={parsed.level} min={1} max={100} onCommit={level=>applyExpected(build,{type:'character-level',level},'레벨 변경')}/></label><label>직업<select aria-label="캐릭터 직업" value={data?.character?.classId??''} disabled={!current?.character||pending} onChange={e=>void changeClass(Number(e.target.value))}>{!data?.character&&<option value="">{parsed.className}</option>}{data?.character?.classes.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></label>{decision&&<div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-label="직업 변경"><h2>{decision.data.character?.decision?.title}</h2><p>{decision.data.character?.decision?.message}</p><div className="actions"><button disabled={pending} onClick={()=>setDecision(undefined)}>취소</button><button disabled={pending} onClick={()=>void changeClass(decision.classId,'reset')}>{decision.data.character?.decision?.resetLabel}</button><button disabled={pending} onClick={()=>void changeClass(decision.classId,'connect')}>{decision.data.character?.decision?.connectLabel}</button></div>{error&&<p role="alert">{error}</p>}</section></div>}</div>;
}
