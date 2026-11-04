import {summaryStatGroups as groups} from '../design/stat-labels';
import {isPobSummaryTarget,isPobInputDiagnostic} from '../../shared/pob-runtime';
import type {WorkspaceLocation} from '../state/workspace-location';
import {projectNote} from '../../shared/pob-notes';
import { isCalculationCurrent } from '../../shared/calculation-context';
import { useEffect, useState } from 'react';
import type { BuildDocument, ParsedBuild } from '../../shared/contracts';
export function calculationStats(build: BuildDocument): Record<string, unknown> {
  return (build.calculation?.result.stats ?? {}) as Record<string, unknown>;
}
export function StatsRail({ build, parsed, onDetails, bundleId, xmlSha256,status,navigate }: { build: BuildDocument; parsed: ParsedBuild; bundleId?: string; xmlSha256?: string;status?:string;navigate?:(target:WorkspaceLocation)=>void; onDetails: () => void }) {
  const [source, setSource] = useState('current');
  useEffect(() => { setSource('current'); }, [build.id, build.revision, build.calculation?.at]);
  const failed = build.calculation?.revision === build.revision && build.calculation.result.ok === false;
  const fresh = isCalculationCurrent(build,bundleId,xmlSha256);
  const rawWarnings=build.calculation?.result.warnings,warnings=Array.isArray(rawWarnings)?rawWarnings.filter((value:unknown):value is string=>typeof value==='string'):[];
  const rawTarget=build.calculation?.result.target,target=isPobSummaryTarget(rawTarget)?rawTarget:undefined;
  const rawDiagnostics=build.calculation?.result.inputDiagnostics,diagnostics=Array.isArray(rawDiagnostics)?rawDiagnostics.filter(isPobInputDiagnostic):[];
  const restoreNotes=build.calculation?.restoreNotes.filter((note):note is {message:string;field?:string}=>Boolean(note&&typeof note==='object'&&'message' in note&&typeof note.message==='string'))||[];
  const targetGroup=target?.group!==undefined?parsed.skillSets.find(set=>set.active)?.groups.find(group=>group.id===String(target.group)):undefined;
  const stats = source === 'original' ? parsed.stats : calculationStats(build);
  return <aside className="stats-rail" aria-label="빌드 능력치 요약">
    <header className="section-heading"><h2>능력치 요약</h2><span className="muted">PoB</span></header>
    <select aria-label="능력치 출처" value={source} onChange={e => setSource(e.target.value)}><option value="current">현재 편집본{fresh ? '' : ' · 재계산 필요'}</option><option value="original">XML 저장 시점 수치</option></select>
    {source==='current'&&target&&<p className="summary-target">주력 대상 · {fresh&&targetGroup&&navigate?<button className="text-button" onClick={()=>navigate({view:'skills',groupId:targetGroup.id})}>{target.effectName||target.groupLabel||'대상 없음'}</button>:<span>{target.effectName||target.groupLabel||'대상 없음'}</span>}</p>}
    <p className="stat-note">{source === 'original' ? '가져온 파일에 저장된 과거 계산값' : failed ? '계산이 완료되지 않았습니다. 진단을 확인하세요.' : fresh ? `리비전 ${build.revision} · ${new Date(build.calculation!.at).toLocaleTimeString()}` : build.calculation?`이전 계산 r${build.calculation.revision} · ${status||'갱신 대기'}`:status||'새 계산 대기'}</p>
    {source==='current'&&(diagnostics.length>0||restoreNotes.length>0)&&<p className="warning">{fresh?'현재 입력':'이전 계산'} · 해석/복원 확인 {diagnostics.length+restoreNotes.length}개</p>}
    {source==='current'&&fresh&&build.calculation?.result.inputDiagnosticsAvailable===false&&<p className="muted">현재 런타임은 입력 줄 해석 진단을 제공하지 않습니다.</p>}
    {groups.map(group => <details key={group.title} open><summary>{group.title}</summary>{group.rows.map(([label, key, digits = 0, scale = 1, suffix = '']) => {
      const n = Number(stats[key]); const present = stats[key] !== undefined && Number.isFinite(n);
      return <div className="stat-row" key={key}><span>{label}</span><button className="stat-value" onClick={onDetails} title="원본 PoB 계산 상세로 이동" aria-label={`${label} 계산 상세`}><strong className={key === 'SpiritUnreserved' && n < 0 ? 'warning' : ''}>{present ? (n * scale).toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits }) + suffix : '—'}</strong></button></div>;
    })}</details>)}
    {source==='current'&&diagnostics.length>0&&<section className="summary-warnings"><h3>원본 PoB가 해석하지 않은 줄</h3>{diagnostics.map((diagnostic,index)=><div key={index}>{fresh&&diagnostic.itemId&&parsed.items.some(item=>item.id===diagnostic.itemId)&&navigate?<button className="warning" onClick={()=>navigate({view:'equipment',itemId:diagnostic.itemId})}>{diagnostic.label||diagnostic.slot} · 확인</button>:<strong>{diagnostic.label||diagnostic.slot}</strong>}{diagnostic.lines.map((line,index)=><p key={index}>{line}</p>)}</div>)}</section>}
    {source==='current'&&restoreNotes.length>0&&<section className="summary-warnings"><h3>원본 복원 진단</h3>{restoreNotes.map((note,index)=><p key={index}>{note.message}</p>)}</section>}
    {source==='current'&&warnings.length>0&&<section className="summary-warnings"><h3>{fresh?'원본 PoB 경고':'이전 계산 경고'}</h3>{warnings.map((warning,index)=><button className="warning" key={index} onClick={onDetails}>{projectNote(warning,false).text}</button>)}</section>}
    <button className="text-button" onClick={onDetails}>전체 통계·계산 진단 →</button>
  </aside>;
}
