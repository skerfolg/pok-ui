import {summaryStatLabels} from '../design/stat-labels';
import {useEffect,useMemo,useState} from 'react';
import type {AppState,BuildDocument,BuildEdit,Calculation} from '../../shared/contracts';
import {activeSelection,projectComparisonSide,selectionEdit,comparisonNumbers,comparisonSnapshot,type BuildSelection,type BuildComparison,type ComparisonSide} from '../../shared/build-comparison';
import {resolveTreeSetEdit} from '../../shared/pob-tree-sets';
import {parseBuild} from '../../shared/pob-document';
import {api} from '../services/api';
import {hashBuildXml,isCalculationCurrent} from '../../shared/calculation-context';
import {describeActiveChanges} from '../../shared/build-changes';
function SidePicker({label,builds,id,choose,selection,change}:{label:string;builds:BuildDocument[];id:string;choose:(id:string)=>void;selection:BuildSelection;change:(next:BuildSelection)=>void}){
  const build=builds.find(b=>b.id===id),parsed=useMemo(()=>{try{return build?parseBuild(build.xml):undefined;}catch{return undefined;}},[build?.xml]);
  return <div className="panel"><header className="panel-heading"><h2>{label}</h2></header><div className="panel-body"><label>빌드<select aria-label={`${label} 빌드`} value={id} onChange={e=>choose(e.target.value)}>{builds.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>{parsed&&<div className="field-grid">{([['items','장비',parsed.itemSets],['skills','스킬',parsed.skillSets],['tree','트리',parsed.trees],['config','조건',parsed.configs]] as const).map(([kind,title,sets])=><label key={kind}>{title} 세트<select aria-label={`${label} ${title} 세트`} value={selection[kind]||''} onChange={e=>change({...selection,[kind]:e.target.value})}>{!sets.length&&<option value="">없음</option>}{sets.map(s=><option key={s.id} value={s.id}>{s.title||s.id}</option>)}</select></label>)}</div>}<p className="muted note">{build?`리비전 ${build.revision} · 선택은 원본을 바꾸지 않습니다.`:'비교할 빌드를 준비하세요.'}</p></div></div>;
}
function SideEvidence({side,label,builds}:{side:ComparisonSide;label:string;builds:BuildDocument[]}){
  const current=builds.find(b=>b.id===side.snapshot.id),source=side.calculation?.provenance,stale=!current||current.revision!==side.snapshot.revision||current.xml!==side.snapshot.xml;
  return <div className="panel"><header className="panel-heading"><h3>{label} · {side.snapshot.name}</h3></header><div className="panel-body"><p className={stale?'warning':'muted'}>기준 리비전 {side.snapshot.revision}{stale?' · 현재 문서와 다름 또는 삭제됨':''}</p><p className="note">PoB {source?.pobCommit?.slice(0,7)||'미측정'} · {side.calculation?.at?new Date(side.calculation.at).toLocaleString():''}</p>{side.error&&<p className="warning">{side.error}</p>}
    {side.calculation?.result.ok===false&&<p className="warning">부분 결과 · 계산 진단 확인 필요</p>}<details><summary>구성·원본 XML·계산 진단</summary><pre>{JSON.stringify({selection:side.selection,treeIdentity:side.treeIdentity,provenance:source,result:side.calculation?Object.fromEntries(Object.entries(side.calculation.result).filter(([k])=>k!=='stats')):undefined},null,2)}</pre><pre>{projectComparisonSide(side).xml}</pre></details></div></div>;
}
export function CompareView({state,update,runtimeId,applyExpected,changed}:{state:AppState;update:(fn:(s:AppState)=>AppState)=>void;runtimeId?:string;applyExpected:(snapshot:Pick<BuildDocument,'id'|'xml'|'revision'>,edit:BuildEdit,label:string)=>BuildDocument;changed:(build:BuildDocument,calculation:Calculation)=>boolean}){
  const [leftId,setLeftId]=useState(state.activeBuildId||state.builds[0]?.id||''),[rightId,setRightId]=useState(state.builds.find(b=>b.id!==state.activeBuildId)?.id||state.activeBuildId||state.builds[0]?.id||'');
  const [leftSet,setLeftSet]=useState<BuildSelection>({}),[rightSet,setRightSet]=useState<BuildSelection>({}),[result,setResult]=useState<BuildComparison|undefined>(state.comparisons?.at(-1)),[busy,setBusy]=useState(''),[error,setError]=useState(''),[filter,setFilter]=useState(''),[differences,setDifferences]=useState(true),[applied,setApplied]=useState<string>();
  const [allStats,setAllStats]=useState(false);
  const left=state.builds.find(b=>b.id===leftId),right=state.builds.find(b=>b.id===rightId);
  useEffect(()=>{if(left)setLeftSet(activeSelection(left));},[leftId,left?.xml]);useEffect(()=>{if(right)setRightSet(activeSelection(right));},[rightId,right?.xml]);
  const rows=result?comparisonNumbers(result).filter(r=>(allStats||summaryStatLabels.has(r.key))&&(!differences||r.delta!==0)&&(!filter.trim()||(r.key+' '+(summaryStatLabels.get(r.key)?.label||'')).toLowerCase().includes(filter.toLowerCase()))):[];
  const changes=useMemo(()=>result?describeActiveChanges(projectComparisonSide(result.left).xml,projectComparisonSide(result.right).xml):[],[result]);
  async function measure(){
    if(!left||!right)return;setBusy('두 구성 계산 중…');setError('');setApplied(undefined);
    const record:BuildComparison={id:crypto.randomUUID(),at:new Date().toISOString(),left:{snapshot:comparisonSnapshot(left),selection:{...leftSet}},right:{snapshot:comparisonSnapshot(right),selection:{...rightSet}}};
    try{
      if(!runtimeId)throw new Error('독립 PoB 런타임을 준비해 주세요.');
      for(const side of [record.left,record.right]){try{const resolved=await resolveTreeSetEdit(side.snapshot,selectionEdit(side.selection),runtimeId,request=>api.editTree(request));side.treeIdentity=resolved.identity;const projected=projectComparisonSide(side),calculation=await api.computeBuild(projected);if(calculation.provenance?.bundleId!==runtimeId||calculation.provenance.buildId!==projected.id||calculation.provenance.revision!==projected.revision||calculation.provenance.xmlSha256!==await hashBuildXml(projected.xml))throw new Error('비교 계산의 입력·PoB 출처가 변경되었습니다. 다시 비교해 주세요.');side.calculation=calculation;}catch(reason){side.error=String(reason);}}
      setResult(record);update(s=>({...s,comparisons:[...(s.comparisons||[]),record]}));
    }catch(reason){setError(String(reason));}finally{setBusy('');}
  }
  async function apply(side:ComparisonSide,label:string){
    setBusy('검토한 구성 적용·최종 재계산 중…');setError('');
    try{
      const info=await api.getPobRuntimeInfo();if(info.status!=='ready'||!side.calculation?.provenance||info.runtimeId!==side.calculation.provenance.bundleId||side.calculation.result.ok===false)throw new Error('현재 PoB에서 성공한 측정이 아닙니다. 다시 비교해 주세요.');
      const projected=projectComparisonSide(side);
      if(!isCalculationCurrent({...projected,calculation:side.calculation},info.runtimeId,await hashBuildXml(projected.xml)))throw new Error('측정한 입력과 적용할 구성이 일치하지 않습니다. 다시 비교해 주세요.');
      const resolved=await resolveTreeSetEdit(side.snapshot,selectionEdit(side.selection),info.runtimeId!,request=>api.editTree(request));
      if(resolved.xml!==projected.xml)throw new Error('원본이 확인한 선택 구성의 직업 정보가 측정 당시와 다릅니다. 다시 비교해 주세요.');
      const next=applyExpected(side.snapshot,resolved.edit,'비교에서 검토한 세트 구성 적용');
      const calculated=await api.computeBuild(next,'workspace');const attached=changed(next,calculated);setApplied(`${label} 적용 · 리비전 ${next.revision} 최종 계산 ${calculated.result.ok===false?'진단 확인 필요':'완료'}${attached?'':' · 현재 문서가 바뀌어 최신 결과에 반영하지 않음'}`);
    }catch(reason){setError(String(reason));}finally{setBusy('');}
  }
  const format=(n:number|undefined)=>n===undefined?'미측정':n.toLocaleString('en-US',{maximumFractionDigits:4});
  const formatStat=(key:string,n:number|undefined)=>{if(n===undefined)return '미측정';const info=summaryStatLabels.get(key);return format(n*(info?.scale??1))+(info?.suffix??'');};
  return <section className="feature scroll"><div className="page-heading"><h1>빌드 비교</h1><span className="muted">구성 선택 → 실제 계산 → 검토 → 적용·재계산</span></div><div className="comparison-grid"><SidePicker label="원안" builds={state.builds} id={leftId} choose={setLeftId} selection={leftSet} change={setLeftSet}/><SidePicker label="수정안" builds={state.builds} id={rightId} choose={setRightId} selection={rightSet} change={setRightSet}/></div>
    <div className="actions spaced"><button className="primary" disabled={!left||!right||!runtimeId||Boolean(busy)} onClick={()=>void measure()}>두 구성 새로 계산</button><span role="status">{busy||applied||'XML 저장값을 측정값으로 사용하지 않습니다.'}</span></div>{error&&<p className="warning" role="alert">{error}</p>}
    {(state.comparisons?.length||0)>0&&<label className="spaced">비교 기록<select aria-label="비교 기록" value={result?.id||''} onChange={e=>{setResult(state.comparisons?.find(c=>c.id===e.target.value));setApplied(undefined);}}><option value="">기록 선택</option>{state.comparisons?.map(c=><option key={c.id} value={c.id}>{new Date(c.at).toLocaleString()} · {c.left.snapshot.name} / {c.right.snapshot.name}</option>)}</select></label>}
    {result&&<><div className="comparison-grid spaced"><SideEvidence side={result.left} label="원안" builds={state.builds}/><SideEvidence side={result.right} label="수정안" builds={state.builds}/></div><p className="muted note">차이는 수정안−원안의 실제 수치입니다. 구성 간 전체 차이이며 개별 부품의 기여·성립·최종 추천을 인증하지 않습니다.</p>
      <div className="actions"><input type="search" aria-label="비교 통계 검색" placeholder="통계 이름 검색" value={filter} onChange={e=>setFilter(e.target.value)}/><label className="check"><input type="checkbox" checked={differences} onChange={e=>setDifferences(e.target.checked)}/>차이만 표시</label><label className="check"><input type="checkbox" checked={allStats} onChange={e=>setAllStats(e.target.checked)}/>고급 · 전체 원본 통계</label>{([['원안',result.left],['수정안',result.right]] as const).map(([label,side])=><button key={label} disabled={Boolean(busy)||!side.calculation||side.calculation.result.ok===false||side.snapshot.xml!==state.builds.find(b=>b.id===side.snapshot.id)?.xml||side.snapshot.revision!==state.builds.find(b=>b.id===side.snapshot.id)?.revision} onClick={()=>void apply(side,label)}>{label} 선택 구성 적용·재계산</button>)}</div>
      <details className="spaced" open><summary>구성 변경 · {changes.length}개</summary>{changes.length?<ul>{changes.map((change,i)=><li key={i}>{change}</li>)}</ul>:<p className="muted">표시 가능한 구성 변경이 없습니다.</p>}</details>
      {rows.length===0&&<p className="muted">표시할 수치가 없습니다. 차이 필터를 해제하거나 고급 전체 통계를 확인하세요.</p>}<div className="comparison-table-wrap"><table className="comparison-table"><thead><tr><th>통계</th><th>원안</th><th>수정안</th><th>차이</th><th>변화율</th></tr></thead><tbody>{rows.map(r=><tr key={r.key}><th scope="row">{summaryStatLabels.get(r.key)?.label||r.key}{allStats&&summaryStatLabels.has(r.key)&&<small className="muted"> · {r.key}</small>}</th><td>{formatStat(r.key,r.left)}</td><td>{formatStat(r.key,r.right)}</td><td>{formatStat(r.key,r.delta)}</td><td>{r.percent===undefined?'—':format(r.percent)+'%'}</td></tr>)}</tbody></table></div>
      <div className="actions spaced"><button onClick={()=>{update(s=>({...s,comparisons:s.comparisons?.filter(c=>c.id!==result.id)}));setResult(undefined);}}>선택 비교 기록 삭제</button></div>
    </>}
  </section>;
}
