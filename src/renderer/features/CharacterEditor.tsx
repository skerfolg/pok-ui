import {useEffect,useRef,useState} from 'react';
import type {BuildDocument,BuildEdit,Calculation,ParsedBuild} from '../../shared/contracts';
import type {PobTreeResult} from '../../shared/pob-tree';
import {hashBuildXml} from '../../shared/calculation-context';
import {api} from '../services/api';

export interface CharacterEditorProps {build:BuildDocument;parsed:ParsedBuild;runtimeId?:string;applyExpected:(snapshot:BuildDocument,edit:BuildEdit,label:string)=>BuildDocument;calculated:(build:BuildDocument,calculation:Calculation)=>boolean}
export function CharacterEditor({build,parsed,runtimeId,applyExpected,calculated}:CharacterEditorProps){
  const [data,setData]=useState<PobTreeResult>(),[preview,setPreview]=useState<{snapshot:BuildDocument;data:PobTreeResult}>(),[classId,setClassId]=useState(''),[ascendancyId,setAscendancyId]=useState('0'),[pending,setPending]=useState(false),[error,setError]=useState('');
  const generation=useRef(0),activeTree=parsed.trees.find(tree=>tree.active);
  async function read(snapshot:BuildDocument,choice?:'reset'|'connect',initial=false){
    const token=++generation.current;setPending(true);setError('');
    try{
      const [result,hash]=await Promise.all([api.editTree({buildId:snapshot.id,revision:snapshot.revision,xml:snapshot.xml,runtimeId,action:'character',...(initial?{}:{classId:Number(classId),ascendancyId:Number(ascendancyId),classChoice:choice})}),hashBuildXml(snapshot.xml)]);
      if(token!==generation.current)return;
      if(result.buildId!==snapshot.id||result.revision!==snapshot.revision||result.xmlSha256!==hash||result.runtimeId!==runtimeId||!result.character)throw new Error('직업 변경 응답의 입력·PoB 버전이 일치하지 않습니다.');
      if(!initial&&!result.character.decision&&(result.character.classId!==Number(classId)||result.character.ascendancyId!==Number(ascendancyId)))throw new Error('원본 직업 변경 결과가 요청한 직업·전직과 일치하지 않습니다.');
      if(initial){setData(result);setClassId(String(result.character.classId));setAscendancyId(String(result.character.ascendancyId));}
      else setPreview({snapshot,data:result});
    }catch(reason){if(token===generation.current)setError(String(reason));}finally{if(token===generation.current)setPending(false);}
  }
  useEffect(()=>{setData(undefined);setPreview(undefined);setError('');setPending(false);if(runtimeId&&activeTree)void read(build,undefined,true);return()=>{generation.current++;};},[build.id,build.revision,build.xml,runtimeId]);
  const ready=data?.runtimeId===runtimeId&&data?.revision===build.revision&&data?.buildId===build.id;
  const selected=data?.character?.classes.find(entry=>String(entry.id)===classId);
  const current=preview&&preview.snapshot.id===build.id&&preview.snapshot.revision===build.revision&&preview.snapshot.xml===build.xml&&preview.data.runtimeId===runtimeId?preview:undefined;
  const changed=Boolean(current&&!current.data.character?.decision&&(current.data.added.length||current.data.removed.length||Object.keys(current.data.patch.attributes).length||current.data.patch.buildAttributes?.className!==parsed.className||current.data.patch.buildAttributes?.ascendClassName!==parsed.ascendancy));
  function invalidate(){generation.current++;setPreview(undefined);setPending(false);setError('');}
  async function apply(){
    if(!current||!changed||pending||!activeTree)return;setPending(true);setError('');
    try{const info=await api.getPobRuntimeInfo();if(info.status!=='ready'||info.runtimeId!==current.data.runtimeId)throw new Error('검토 후 PoB 버전이 바뀌었습니다. 다시 조회해 주세요.');const next=applyExpected(current.snapshot,{type:'tree-native-patch',specId:activeTree.id,patch:current.data.patch},'원본 직업·전직 변경');calculated(next,await api.computeBuild(next,'workspace'));}
    catch(reason){setError(String(reason));}finally{setPending(false);}
  }
  return <div className="panel"><header className="panel-heading"><h2>전직·직업 변경 검토</h2><span className="muted">원본 PoB 직업·전직</span></header><div className="panel-body character-editor">
    <div className="field-grid">
      <label>직업<select aria-label="고급 캐릭터 직업" value={classId} disabled={!ready||pending} onChange={event=>{invalidate();setClassId(event.target.value);setAscendancyId('0');}}>{data?.character?.classes.map(entry=><option key={entry.id} value={entry.id}>{entry.label}</option>)}</select></label>
      <label>전직<select aria-label="고급 캐릭터 전직" value={ascendancyId} disabled={!ready||pending} onChange={event=>{invalidate();setAscendancyId(event.target.value);}}>{selected?.ascendancies.map(entry=><option key={entry.id} value={entry.id}>{entry.label}</option>)}</select></label><label>트리 버전<input readOnly value={activeTree?.version||'미지정'}/></label></div>
    <p className="muted" role="status">{pending?'원본 직업 연산 처리 중…':!runtimeId?'독립 PoB 런타임을 준비해 주세요.':!activeTree?'활성 트리가 필요합니다.':'원본이 시작점·연결 경로와 전직 할당을 처리합니다. 검토 전에는 현재 빌드가 바뀌지 않습니다.'}</p>{error&&<p role="alert" className="warning">{error}</p>}
    <div className="actions"><button disabled={!ready||pending} onClick={()=>{setPreview(undefined);void read(build);}}>직업 변경 미리보기</button></div>
    {current?.data.character?.decision&&<div className="warning spaced"><p>{current.data.character.decision.message}</p><div className="actions"><button disabled={pending} onClick={()=>void read(build,'reset')}>트리 재설정 미리보기</button><button disabled={pending} onClick={()=>void read(build,'connect')}>연결 경로 추가 미리보기</button><button disabled={pending} onClick={invalidate}>변경 취소</button></div></div>}
    {current&&!current.data.character?.decision&&<div className="spaced"><p>원본 변경: 추가 {current.data.added.length}개 · 제거 {current.data.removed.length}개 · 일반 {current.data.counts.normal} / 전직 {current.data.counts.ascendancy}</p><details><summary>변경 노드 ID</summary><p>추가: {current.data.added.join(', ')||'없음'}</p><p>제거: {current.data.removed.join(', ')||'없음'}</p></details>{current.data.diagnostics.map(d=><p key={d.code} className="warning">{d.message}</p>)}<div className="actions"><button disabled={pending} onClick={invalidate}>변경 취소</button><button className="primary" disabled={!changed||pending||Boolean(current.data.diagnostics.length)} onClick={()=>void apply()}>직업 적용·새 계산</button></div></div>}
  </div></div>;
}
