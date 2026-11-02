import { useEffect, useMemo, useState } from 'react';
import type { BuildEdit, ParsedBuild } from '../../shared/contracts';
import type { CatalogClass } from '../../shared/game-data';
import { api } from '../services/api';

export function CharacterEditor({ parsed, edit, catalogEnabled = true }: { parsed: ParsedBuild; edit: (edit: BuildEdit, label: string) => void; catalogEnabled?: boolean }) {
  const [classes, setClasses] = useState<CatalogClass[]>([]);
  const [error, setError] = useState('');
  const [classId, setClassId] = useState('');
  const [ascendancyId, setAscendancyId] = useState('');
  const [allowNodeKeep, setAllowNodeKeep] = useState(false);
  const activeTree = parsed.trees.find(tree => tree.active) ?? parsed.trees[0];
  useEffect(() => {
    let alive = true;
    api.getDataBundleInfo().then(info => {
      if (!alive) return;
      if (info.status !== 'ready' || !info.classes?.length) { setClasses([]); setError(info.error || '데이터 묶음이 준비되지 않았습니다.'); return; }
      setClasses(info.classes);
      const current = info.classes.find(entry => entry.name === parsed.className) ?? info.classes[0];
      setClassId(current?.id ?? '');
      setAscendancyId(current?.ascendancies.find(entry => entry.name === parsed.ascendancy)?.id ?? '');
    }).catch(reason => alive && setError(String(reason)));
    return () => { alive = false; };
  }, [parsed.className, parsed.ascendancy]);
  const selected = useMemo(() => classes.find(entry => entry.id === classId), [classes, classId]);
  const ascendancy = selected?.ascendancies.find(entry => entry.id === ascendancyId);
  const changesClass = Boolean(selected && (selected.name !== parsed.className || (ascendancy?.name ?? '') !== parsed.ascendancy));
  const hasAllocatedNodes = Boolean(activeTree?.nodes.length);
  const blocked = changesClass && hasAllocatedNodes && !allowNodeKeep;
  return <div className="panel"><header className="panel-heading"><h2>캐릭터</h2><span className="muted">{error || '고정 PoB 카탈로그'}</span></header>
    <div className="panel-body character-editor">
      <div className="field-grid">
        <label>레벨<input aria-label="캐릭터 레벨" type="number" min="1" max="100" value={parsed.level}
          onChange={event => edit({ type: 'character', level: Math.min(100, Math.max(1, Number(event.target.value))), className: parsed.className, ascendancy: parsed.ascendancy }, '캐릭터 레벨 변경')} /></label>
        <label>직업<select value={classId} disabled={!catalogEnabled || !classes.length} onChange={event => { setClassId(event.target.value); setAscendancyId(''); setAllowNodeKeep(false); }}>
          {classes.length ? classes.map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>) : <option value="">카탈로그 없음</option>}
        </select></label>
        <label>전직<select value={ascendancyId} disabled={!catalogEnabled || !selected} onChange={event => { setAscendancyId(event.target.value); setAllowNodeKeep(false); }}>
          <option value="">미전직</option>{(selected?.ascendancies ?? []).map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
        </select></label>
        <label>트리 버전<input readOnly value={activeTree?.version || '미지정'} /></label>
      </div>
      {changesClass && hasAllocatedNodes && <label className="check warning"><input type="checkbox" checked={allowNodeKeep} onChange={event => setAllowNodeKeep(event.target.checked)} />현재 활성 트리의 {activeTree?.nodes.length}개 할당 노드를 보존한 채 직업 정보만 바꿉니다.</label>}
      <div className="actions"><button className="primary" disabled={!catalogEnabled || !selected || blocked} onClick={() => selected && edit({
        type: 'character', level: parsed.level, className: selected.name, ascendancy: ascendancy?.name ?? '',
        classLegacyId: selected.legacyId, classInternalId: selected.internalId, ascendancyLegacyId: ascendancy?.legacyId ?? 0,
        ascendancyInternalId: ascendancy?.id ?? '', treeVersion: activeTree?.version, startNodeId: selected.startNodeId,
      }, '직업·전직 변경')}>직업 적용</button></div>
    </div>
  </div>;
}
