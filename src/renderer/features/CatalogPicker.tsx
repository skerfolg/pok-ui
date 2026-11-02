import { useEffect, useMemo, useState } from 'react';
import type { CatalogEntry, CatalogEntryType } from '../../shared/contracts';
import { api } from '../services/api';

function compactRaw(raw: CatalogEntry['raw']) {
  const stats = raw.stats;
  const text = raw.text;
  return {
    ...(Array.isArray(stats) ? { stats: stats.slice(0, 8) } : {}),
    ...(typeof text === 'string' ? { text: text.split(/\r?\n/).slice(0, 8).join('\n') } : {}),
  };
}

export function CatalogPicker({ type, title, onSelect, category, selectedId, disabled = false }: {
  type: CatalogEntryType;
  title: string;
  category?: string;
  selectedId?: string;
  disabled?: boolean;
  onSelect: (entry: CatalogEntry) => void;
}) {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [entries, setEntries] = useState<CatalogEntry[]>([]);
  const [selected, setSelected] = useState<CatalogEntry | undefined>();
  const [status, setStatus] = useState('');
  const effectiveCategory = category ?? (categoryFilter.trim() || undefined);
  const categories = useMemo(() => Array.from(new Set(entries.map(entry => entry.category).filter(Boolean) as string[])).sort(), [entries]);

  useEffect(() => {
    let alive = true;
    setStatus('검색 중...');
    api.queryPobCatalog({ type, query, category: effectiveCategory, limit: 30 }).then(page => {
      if (!alive) return;
      setEntries(page.entries);
      setStatus(page.total ? `${page.total.toLocaleString()}개 중 ${page.entries.length}개 표시` : '일치 항목 없음');
    }).catch(error => {
      if (alive) { setEntries([]); setStatus(error instanceof Error ? error.message : String(error)); }
    });
    return () => { alive = false; };
  }, [type, query, effectiveCategory, disabled]);

  useEffect(() => {
    if (!selectedId) return;
    const match = entries.find(entry => entry.id === selectedId);
    if (match) setSelected(match);
  }, [entries, selectedId]);

  const visibleSelected = selectedId ? entries.find(entry => entry.id === selectedId) ?? selected : selected;

  return <div className="catalog-picker">
    <header className="section-heading"><strong>{title}</strong><span className="muted">{status}</span></header>
    <div className="catalog-filters">
      <input type="search" aria-label={`${title} 검색`} placeholder="고정된 PoB 카탈로그 검색" value={query} onChange={event => setQuery(event.target.value)} />
      <label>분류 필터
        <input list={`${title}-categories`} aria-label={`${title} 분류 필터`} value={category ?? categoryFilter} disabled={disabled || category !== undefined} onChange={event => setCategoryFilter(event.target.value)} placeholder={category ? '선택한 항목 분류 사용' : '예: Ring, Amulet, Skill'} />
      </label>
      <datalist id={`${title}-categories`}>{categories.map(value => <option key={value} value={value} />)}</datalist>
    </div>
    <div className="catalog-results scroll">
      {entries.map(entry => <button key={`${entry.type}:${entry.id}`} type="button" aria-pressed={entry.id === selectedId} disabled={disabled} onClick={() => { if (disabled) return; setSelected(entry); onSelect(entry); }}>
        <span>{entry.name}</span>
        <small>{[entry.category, entry.subType, entry.variants?.length ? `${entry.variants.length}개 변형` : ''].filter(Boolean).join(' | ') || entry.id}</small>
      </button>)}
    </div>
    {visibleSelected && <div className="catalog-detail">
      <strong>{visibleSelected.name}</strong>
      <small>{[visibleSelected.type, visibleSelected.category, visibleSelected.subType, visibleSelected.id].filter(Boolean).join(' | ')}</small>
      {visibleSelected.variants?.length ? <p>{visibleSelected.variants.length}개 변형: {visibleSelected.variants.map(variant => variant.name || variant.id).join(', ')}</p> : null}
      {visibleSelected.levels?.length ? <p>레벨: {Math.min(...visibleSelected.levels)}-{Math.max(...visibleSelected.levels)}</p> : null}
      {Object.keys(compactRaw(visibleSelected.raw)).length ? <pre>{JSON.stringify(compactRaw(visibleSelected.raw), null, 2)}</pre> : null}
      <details><summary>원본 세부 정보</summary><pre>{JSON.stringify(visibleSelected.raw, null, 2)}</pre></details>
    </div>}
  </div>;
}