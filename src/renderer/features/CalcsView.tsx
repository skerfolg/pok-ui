import {useEffect,useRef,useState} from 'react';
import type {BuildDocument,BuildEdit,ParsedBuild} from '../../shared/contracts';
import type {PobCalcs,PobCalcCell,PobBreakdownSection} from '../../shared/pob-calcs';
import {hashBuildXml} from '../../shared/calculation-context';
import {calculationStats} from '../components/StatsRail';
import {api} from '../services/api';
import {PobSkillOptions} from './PobSkillOptions';
function Breakdown({section}:{section:PobBreakdownSection}){
  return <section className="spaced">{section.label&&<h3>{section.label}</h3>}{section.lines?.map((line,i)=><p className="calcs-line" key={i}>{line}</p>)}
    {section.columns&&<div className="comparison-table-wrap"><table className="comparison-table"><thead><tr>{section.columns.map(c=><th key={c.key}>{c.label}</th>)}</tr></thead><tbody>{section.rows?.map((row,i)=><tr key={i}>{section.columns!.map(c=><td key={c.key}>{row.values[c.key]}</td>)}</tr>)}</tbody></table></div>}
    {section.rows?.some(r=>r.source)&&<details><summary>원본 적용 출처</summary>{section.rows.filter(r=>r.source).map((row,i)=><p className="calcs-line" key={i}>{row.source}{row.sourceSlot?' · '+row.sourceSlot:''}</p>)}</details>}
    {section.type==='RADIUS'&&<p>원본 반경: {section.radius} · 반경 지도 시각화는 아직 지원하지 않습니다.</p>}{section.footer&&<p className="calcs-line muted">{section.footer}</p>}
  </section>;
}
export function CalcsView({build,parsed,runtimeId,edit}:{build:BuildDocument;parsed:ParsedBuild;runtimeId?:string;edit:(edit:BuildEdit,label:string)=>void}){
  const [saved,setSaved]=useState<{xml:string;data:PobCalcs}>(),[pending,setPending]=useState(false),[error,setError]=useState(''),[filter,setFilter]=useState(''),[retry,setRetry]=useState(0);
  const [detail,setDetail]=useState<{label:string;data:PobCalcs}>(),[detailBusy,setDetailBusy]=useState(false),[detailError,setDetailError]=useState('');
  const owner=useRef(0);
  useEffect(()=>{
    let cancelled=false;owner.current++;setDetail(undefined);setDetailError('');setDetailBusy(false);setError('');
    if(!runtimeId){setPending(false);return;}
    const request={buildId:build.id,revision:build.revision,xml:build.xml,runtimeId};setPending(true);
    const timer=setTimeout(()=>{void Promise.all([api.readCalcs(request),hashBuildXml(request.xml)]).then(([data,hash])=>{
      if(cancelled)return;
      if(data.buildId!==request.buildId||data.revision!==request.revision||data.xmlSha256!==hash||data.runtimeId!==runtimeId)throw new Error('계산 상세의 입력 또는 PoB 버전이 현재 문서와 다릅니다.');
      setSaved({xml:request.xml,data});setPending(false);
    }).catch(reason=>{if(!cancelled){setError(String(reason));setPending(false);}});},250);
    return()=>{cancelled=true;owner.current++;clearTimeout(timer);};
  },[build.id,build.revision,build.xml,runtimeId,retry]);
  const current=saved?.xml===build.xml&&saved.data.buildId===build.id&&saved.data.revision===build.revision&&saved.data.runtimeId===runtimeId?saved.data:undefined;
  const layout=current||saved?.data;
  const skillSet=parsed.skillSets.find(s=>s.active),skillGroup=skillSet?.groups.find(g=>g.id===layout?.selectors.skill?.groupId);
  async function inspect(cell:PobCalcCell,label:string){
    if(!current||detailBusy)return;
    const token=++owner.current,request={buildId:build.id,revision:build.revision,xml:build.xml,runtimeId,cellId:cell.id};setDetail(undefined);setDetailBusy(true);setDetailError('');
    try{
      const [data,hash]=await Promise.all([api.readCalcs(request),hashBuildXml(request.xml)]);if(token!==owner.current)return;
      if(data.buildId!==request.buildId||data.revision!==request.revision||data.xmlSha256!==hash||data.runtimeId!==runtimeId||data.breakdown?.cellId!==cell.id)throw new Error('상세 근거가 선택한 입력·셀과 일치하지 않습니다.');
      setDetail({label,data});
    }catch(reason){if(token===owner.current)setDetailError(String(reason));}finally{if(token===owner.current)setDetailBusy(false);}
  }
  return <section className="feature scroll"><div className="page-heading"><h1>계산 상세</h1><span className="muted">{pending?'현재 입력을 원본 PoB에서 계산 중…':current?`리비전 ${current.revision} · PoB ${current.pobCommit.slice(0,7)}`:'현재 입력 미확인'}</span><button disabled={pending||!runtimeId} onClick={()=>setRetry(n=>n+1)}>상세 다시 계산</button></div>
    <p className="muted note">이 표는 원본 Calcs 탭의 선택 모드에 따른 새 계산입니다. 사이드바 계산은 항상 Effective DPS 기준이며 별도 계산 기록으로 보존됩니다.</p>
    {error&&<p className="warning" role="alert">{error}</p>}{!runtimeId&&<p className="warning">독립 PoB 런타임을 준비해 주세요.</p>}
    {layout&&<><div className="field-grid calcs-selectors"><label>계산 그룹<select aria-label="계산 상세 그룹" disabled={!current||pending} value={layout.selectors.group} onChange={e=>edit({type:'calcs-input',key:'skill_number',value:Number(e.target.value)},'계산 상세 그룹 변경')}>{!layout.selectors.groups.some(g=>g.index===layout.selectors.group)&&<option value={layout.selectors.group}>저장값 {layout.selectors.group}</option>}{layout.selectors.groups.map(g=><option key={g.index} value={g.index}>{g.label}</option>)}</select></label>
      <label>계산 모드<select aria-label="계산 상세 모드" disabled={!current||pending} value={layout.selectors.mode} onChange={e=>edit({type:'calcs-input',key:'misc_buffMode',value:e.target.value},'계산 상세 모드 변경')}>{layout.selectors.modes.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}</select></label>
      <label className="check"><input type="checkbox" aria-label="계산 상세 미니언" checked={layout.selectors.showMinion} disabled={!current||pending||(!layout.selectors.minionAvailable&&!layout.selectors.showMinion)} onChange={e=>edit({type:'calcs-input',key:'showMinion',value:e.target.checked},'계산 상세 대상 변경')}/>미니언 계산</label><input aria-label="계산 상세 검색" type="search" placeholder="원본 분류·수치 이름 검색" value={filter} onChange={e=>setFilter(e.target.value)}/></div>
      {!current&&<p className="warning">이전 입력의 표입니다. 현재 입력 확인 전에는 근거 조회와 선택 변경이 잠깁니다.</p>}
      {layout.selectors.modeHelp&&<details className="spaced"><summary>원본 계산 모드 설명</summary><p className="calcs-line">{layout.selectors.modeHelp}</p></details>}
      {skillSet&&skillGroup&&<PobSkillOptions options={layout.selectors.skill} group={skillGroup} setId={skillSet.id} edit={edit} disabled={!current||pending} pending={pending} diagnostics={layout.diagnostics.filter(d=>d.field==='skill-selectors')} calcs/>}
      {layout.diagnostics.map((d,i)=><p role="alert" className="warning" key={i}>{d.code}{d.field?' · '+d.field:''}: {d.message}</p>)}
      <div className="calcs-sections spaced">{layout.sections.flatMap(section=>section.subsections.map(sub=>{
        const rows=sub.rows.filter(row=>!filter.trim()||`${sub.label} ${row.label} ${row.cells.map(c=>c.text).join(' ')}`.toLowerCase().includes(filter.trim().toLowerCase()));
        return rows.length?<details className="panel" key={section.id+':'+sub.id} open><summary className="panel-heading">{sub.label}{sub.extra&&<span className="muted">{sub.extra}</span>}</summary><div className="calcs-table-wrap"><table className="calcs-table"><tbody>{rows.map((row,i)=><tr key={i}><th>{row.label}</th>{row.cells.map((cell,j)=><td key={cell.id}>{cell.breakdown?<button aria-label={`${sub.label} ${row.label} ${j+1} 상세`} disabled={!current||pending||detailBusy} onClick={()=>void inspect(cell,`${sub.label} / ${row.label}`)}>{cell.text||'근거 보기'}</button>:cell.text}</td>)}</tr>)}</tbody></table></div></details>:null;
      }))}</div>
    </>}
    <details className="spaced"><summary>사이드바 계산 기록 · 리비전 {build.calculation?.revision??'없음'}</summary><pre>{JSON.stringify(calculationStats(build),null,2)}</pre><pre>{JSON.stringify(build.calculation?{provenance:build.calculation.provenance,restore:build.calculation.restoreNotes,...Object.fromEntries(Object.entries(build.calculation.result).filter(([k])=>k!=='stats'))}:{message:'사이드바 새 계산 전'},null,2)}</pre></details>
    <details className="spaced"><summary>원본 XML 저장값 · {Object.keys(parsed.stats).length}개</summary><dl className="stats-table">{Object.entries(parsed.stats).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></details>
    {current&&(detail||detailBusy||detailError)&&<div className="modal-backdrop"><section className="modal calcs-breakdown" role="dialog" aria-modal="true" aria-label="계산 분해 근거"><header className="panel-heading"><h2>{detail?.label||'원본 근거 조회 중…'}</h2><button onClick={()=>{owner.current++;setDetail(undefined);setDetailBusy(false);setDetailError('');}}>닫기</button></header><div className="panel-body scroll">{detailBusy&&<p role="status">선택한 XML·셀을 원본 PoB에서 다시 읽는 중…</p>}{detailError&&<p className="warning" role="alert">{detailError}</p>}{detail&&<><p className="muted note">리비전 {detail.data.revision} · PoB {detail.data.pobCommit.slice(0,7)} · {detail.data.xmlSha256.slice(0,12)}</p>{detail.data.diagnostics.map((d,i)=><p className="warning" key={i}>{d.code}: {d.message}</p>)}{detail.data.breakdown?.sections.map((section,i)=><Breakdown key={i} section={section}/>)}{!detail.data.breakdown?.sections.length&&<p>현재 입력에서 원본이 제공한 분해 항목이 없습니다.</p>}</>}</div></section></div>}
  </section>;
}
