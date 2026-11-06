import {useRetainedPresentation} from '../state/useRetainedPresentation';
import {summaryStatGroups as groups} from '../design/stat-labels';
import {isPobSummaryTarget} from '../../shared/pob-runtime';
import type {WorkspaceLocation} from '../state/workspace-location';
import { isCalculationCurrent } from '../../shared/calculation-context';
import { useEffect, useState } from 'react';
import type { BuildDocument, ParsedBuild } from '../../shared/contracts';
export function calculationStats(build: BuildDocument): Record<string, unknown> {
  return (build.calculation?.result.stats ?? {}) as Record<string, unknown>;
}
export function StatsRail({ build, parsed, onDetails, bundleId, xmlSha256,navigate }: { build: BuildDocument; parsed: ParsedBuild; bundleId?: string; xmlSha256?: string;navigate?:(target:WorkspaceLocation)=>void; onDetails: () => void }) {
  const [source, setSource] = useState('current');
  useEffect(() => { setSource('current'); }, [build.id, build.revision, build.calculation?.at]);
  const failed = build.calculation?.revision === build.revision && build.calculation.result.ok === false;
  const fresh = isCalculationCurrent(build,bundleId,xmlSha256);
  const presentation=useRetainedPresentation(JSON.stringify([build.id,bundleId]),build.calculation?.result.ok!==false&&build.calculation?.provenance?.bundleId===bundleId?build.calculation:undefined);
  const rawTarget=presentation?.result.target,target=isPobSummaryTarget(rawTarget)?rawTarget:undefined;
  const targetGroup=target?.group!==undefined?parsed.skillSets.find(set=>set.active)?.groups.find(group=>group.id===String(target.group)):undefined;
  const stats = source === 'original' ? parsed.stats : (presentation?.result.stats??{}) as Record<string,unknown>;
  return <aside aria-busy={!fresh&&!failed} data-result-revision={presentation?.revision} className="stats-rail" aria-label="빌드 능력치 요약">
    <header className="section-heading"><h2>능력치 요약</h2>{failed&&<span className="warning" role="alert">계산 실패</span>}</header>
    <select aria-label="능력치 출처" value={source} onChange={e => setSource(e.target.value)}><option value="current">{fresh?'현재 수치':failed?'이전 수치 · 계산 실패':presentation?'이전 수치 · 갱신 중':'계산 준비 중'}</option><option value="original">XML 저장 시점 수치</option></select>
    {source==='current'&&target&&<p className="summary-target">주력 대상 · {targetGroup&&navigate?<button disabled={!fresh} className="text-button" onClick={()=>navigate({view:'skills',groupId:targetGroup.id})}>{target.effectName||target.groupLabel||'대상 없음'}</button>:<span>{target.effectName||target.groupLabel||'대상 없음'}</span>}</p>}
    {groups.map(group => <details key={group.title} open><summary>{group.title}</summary>{group.rows.map(([label, key, digits = 0, scale = 1, suffix = '']) => {
      const n = Number(stats[key]); const present = stats[key] !== undefined && Number.isFinite(n);
      return <div className="stat-row" key={key}><span>{label}</span><button className="stat-value" onClick={onDetails} title="계산 상세로 이동" aria-label={`${label} 계산 상세`}><strong className={key === 'SpiritUnreserved' && n < 0 ? 'warning' : ''}>{present ? (n * scale).toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits }) + suffix : '—'}</strong></button></div>;
    })}</details>)}
    <button className="text-button" onClick={onDetails}>전체 통계·계산 진단 →</button>
  </aside>;
}
