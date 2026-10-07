import { useEffect, useState } from 'react';
import type { BuildDocument, ParsedBuild } from '../../shared/contracts';
const groups: { title: string; rows: [string, string, number?, number?, string?][] }[] = [
  { title: '공격', rows: [['평균 적중', 'AverageHit', 1], ['시전 속도', 'Speed', 2], ['치명타 확률', 'CritChance', 2, 1, '%'], ['치명타 배율', 'CritMultiplier', 0, 100, '%'], ['적중 DPS', 'TotalDPS', 1], ['점화 포함 DPS', 'WithIgniteDPS', 1]] },
  { title: '자원', rows: [['총 생명력', 'Life'], ['미점유 생명력', 'LifeUnreserved'], ['마나', 'Mana'], ['마나 재생', 'ManaRegenRecovery', 1], ['총 정신력', 'Spirit'], ['미점유 정신력', 'SpiritUnreserved']] },
  { title: '방어', rows: [['유효 생명력', 'TotalEHP'], ['에너지 보호막', 'EnergyShield'], ['방어도', 'Armour'], ['회피', 'Evasion'], ['회피 확률', 'EvadeChance', 0, 1, '%'], ['물리 최대 피격', 'PhysicalMaximumHitTaken'], ['원소 최대 피격', 'FireMaximumHitTaken']] },
  { title: '저항', rows: [['화염', 'FireResist', 0, 1, '%'], ['냉기', 'ColdResist', 0, 1, '%'], ['번개', 'LightningResist', 0, 1, '%'], ['카오스', 'ChaosResist', 0, 1, '%']] },
  { title: '능력치', rows: [['힘', 'Str'], ['민첩', 'Dex'], ['지능', 'Int']] },
];
export function calculationStats(build: BuildDocument): Record<string, unknown> {
  return (build.calculation?.result.stats ?? {}) as Record<string, unknown>;
}
export function StatsRail({ build, parsed, onDetails }: { build: BuildDocument; parsed: ParsedBuild; onDetails: () => void }) {
  const [source, setSource] = useState(build.revision === 0 && !build.calculation ? 'original' : 'current');
  useEffect(() => { setSource(build.revision === 0 && !build.calculation ? 'original' : 'current'); }, [build.id, build.revision, build.calculation?.at]);
  const failed = build.calculation?.revision === build.revision && build.calculation.result.ok === false;
  const fresh = build.calculation?.revision === build.revision && !failed;
  const stats = source === 'original' ? parsed.stats : fresh ? calculationStats(build) : {};
  return <aside className="stats-rail" aria-label="빌드 능력치 요약">
    <header className="section-heading"><h2>능력치 요약</h2><span className="muted">PoB</span></header>
    <select aria-label="능력치 출처" value={source} onChange={e => setSource(e.target.value)}><option value="current">현재 편집본{fresh ? '' : ' · 재계산 필요'}</option><option value="original">XML 저장 시점 수치</option></select>
    <p className="stat-note">{source === 'original' ? '가져온 파일에 저장된 과거 계산값' : failed ? '계산이 완료되지 않았습니다. 진단을 확인하세요.' : fresh ? `리비전 ${build.revision} · ${new Date(build.calculation!.at).toLocaleTimeString()}` : '계산 버튼을 누르면 새 수치가 표시됩니다.'}</p>
    {groups.map(group => <details key={group.title} open><summary>{group.title}</summary>{group.rows.map(([label, key, digits = 0, scale = 1, suffix = '']) => {
      const n = Number(stats[key]); const present = stats[key] !== undefined && Number.isFinite(n);
      return <div className="stat-row" key={key}><span>{label}</span><strong className={key === 'SpiritUnreserved' && n < 0 ? 'warning' : ''}>{present ? (n * scale).toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits }) + suffix : '—'}</strong></div>;
    })}</details>)}
    <button className="text-button" onClick={onDetails}>전체 통계·계산 진단 →</button>
  </aside>;
}
