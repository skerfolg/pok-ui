import { useEffect, useState, useRef } from 'react';
import type { CatalogEntry, CatalogEntryType } from '../../shared/contracts';
import { api } from '../services/api';

export function CatalogPicker({ type, title, onSelect, category, initialCategory, hideDetail=false, selectedId, disabled = false }: {
  type: CatalogEntryType;
  title: string;
  category?: string;
  initialCategory?: string;
  hideDetail?: boolean;
  selectedId?: string;
  disabled?: boolean;
  onSelect: (entry: CatalogEntry) => void;
}) {
  const [listTop,setListTop]=useState(0);
  const list=useRef<HTMLDivElement>(null);
  const [statFilter,setStatFilter]=useState('all');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(initialCategory||'');
  useEffect(()=>setCategoryFilter(initialCategory||''),[initialCategory]);
  const [entries, setEntries] = useState<CatalogEntry[]>([]);
  const [selected, setSelected] = useState<CatalogEntry | undefined>();
  const [status, setStatus] = useState('');
  const effectiveCategory = category ?? (categoryFilter.trim() || undefined);
  const [categories,setCategories]=useState<string[]>([]),[categoryQuery,setCategoryQuery]=useState('');

  useEffect(() => {
    let alive = true;
    setStatus('검색 중...');
    void (async()=>{try{let all:CatalogEntry[]=[],offset=0,total=0;do{const page=await api.queryPobCatalog({type,query,category:effectiveCategory,limit:100,offset});if(!alive)return;all.push(...page.entries);total=page.total;offset+=page.entries.length;setCategories(page.categories||[]);if(!page.entries.length)break;}while((type==='base'||type==='unique')&&offset<total);setEntries(all);setListTop(0);if(list.current)list.current.scrollTop=0;setStatus(all.length===total?`${total.toLocaleString()}개`:`${total.toLocaleString()}개 중 ${all.length}개`);}catch(error){if(alive)setStatus(error instanceof Error?error.message:String(error));}})();
    return () => { alive = false; };
  }, [type, query, effectiveCategory, disabled]);

  useEffect(() => {
    if (!selectedId) return;
    const match = entries.find(entry => entry.id === selectedId);
    if (match) setSelected(match);
  }, [entries, selectedId]);

  function requirement(entry:CatalogEntry){const req=(entry.raw.req||{}) as Record<string,number>;return ['str','dex','int'].filter(key=>Number(req[key])>0).join('+');}
  function preview(entry:CatalogEntry){const req=(entry.raw.req||{}) as Record<string,number>,armour=(entry.raw.armour||{}) as Record<string,number>,weapon=(entry.raw.weapon||{}) as Record<string,number>;return <span className="base-preview"><span>{[['level','Lv'],['str','STR'],['dex','DEX'],['int','INT']].filter(([key])=>Number(req[key])>0).map(([key,label])=>`${label} ${req[key]}`).join(' · ')||'요구 능력치 없음'}</span><span>{Object.entries(armour).filter(([key])=>['Armour','Evasion','EnergyShield','Ward'].includes(key)).map(([key,value])=>`${({Armour:'방어도',Evasion:'회피',EnergyShield:'에너지 보호막'} as Record<string,string>)[key]||key} ${value}`).join(' · ')}{[['Physical','물리'],['Fire','화염'],['Cold','냉기'],['Lightning','번개'],['Chaos','카오스']].filter(([key])=>weapon[key+'Min']!==undefined).map(([key,label])=>`${label} ${weapon[key+'Min']}–${weapon[key+'Max']}`).join(' · ')}{weapon.AttackRateBase!==undefined?` · 초당 공격 ${weapon.AttackRateBase} · 치명타 ${weapon.CritChanceBase}%`:''}</span></span>;}
  const filtered=entries.filter(entry=>type!=='base'||statFilter==='all'||requirement(entry)===statFilter);
  useEffect(()=>{setListTop(0);if(list.current)list.current.scrollTop=0;},[entries,statFilter]);
  const virtual=type==='base'&&filtered.length>150,start=virtual?Math.max(0,Math.min(filtered.length-1,Math.floor(listTop/72)-4)):0,end=virtual?Math.min(filtered.length,start+20):filtered.length;
  const visibleSelected = selectedId ? entries.find(entry => entry.id === selectedId) ?? selected : selected;

  return <div className="catalog-picker" data-kind={type}>
    <header className="section-heading"><strong>{title}</strong><span className="muted">{type==='base'&&/^[\d,]+개$/.test(status)?`${filtered.length.toLocaleString()}개`:status}</span></header>
    <div className="catalog-filters">
      <input type="search" aria-label={`${title} 검색`} placeholder="이름 검색" value={query} onChange={event => setQuery(event.target.value)} />
      <details className="category-dropdown" onToggle={event=>{if(event.currentTarget.open)event.currentTarget.querySelector('input')?.focus();}} onKeyDown={event=>{if(event.key==='Escape')event.currentTarget.removeAttribute('open');}}><summary aria-label={`${title} 분류 필터`}>{(category??categoryFilter)||'전체 분류'}</summary><input type="search" aria-label={`${title} 분류 검색`} value={categoryQuery} onChange={event=>setCategoryQuery(event.target.value)} placeholder="분류 검색" disabled={disabled||category!==undefined}/><div role="listbox" aria-label="분류"><button type="button" onClick={event=>{setCategoryFilter('');event.currentTarget.closest('details')?.removeAttribute('open');}}>전체 분류</button>{categories.filter(value=>value.toLowerCase().includes(categoryQuery.toLowerCase())).map(value=><button type="button" role="option" aria-selected={value===(category??categoryFilter)} key={value} disabled={disabled||category!==undefined} onClick={event=>{setCategoryFilter(value);event.currentTarget.closest('details')?.removeAttribute('open');}}>{value}</button>)}</div></details>
    </div>
    {type==='base'&&<div className="base-stat-filters" aria-label="요구 능력치 분류">{['all','str','dex','int','str+dex','str+int','dex+int','str+dex+int'].map(value=><button key={value} type="button" aria-pressed={statFilter===value} onClick={()=>{setListTop(0);if(list.current)list.current.scrollTop=0;setStatFilter(value);}}>{value==='all'?'전체':value.toUpperCase()}</button>)}</div>}
    <div className="catalog-results scroll" ref={list} onScroll={event=>setListTop(event.currentTarget.scrollTop)}>
      {virtual&&<div aria-hidden="true" style={{height:start*72,flexShrink:0}}/>}
      {filtered.slice(start,end).map(entry => <button key={`${entry.type}:${entry.id}`} type="button" aria-pressed={entry.id === selectedId} disabled={disabled} onClick={() => { if (disabled) return; setSelected(entry); onSelect(entry); }}>
        <span>{entry.name}</span>
        <small>{[entry.category,entry.subType].filter(Boolean).join(' · ')}</small>{type==='base'&&preview(entry)}
      </button>)}
      {virtual&&<div aria-hidden="true" style={{height:(filtered.length-end)*72,flexShrink:0}}/>}
      {!filtered.length&&<p className="muted">조건에 맞는 항목이 없습니다.</p>}
    </div>
    {!hideDetail&&visibleSelected && <div className="catalog-detail">
      <strong>{visibleSelected.name}</strong>{type==='base'&&preview(visibleSelected)}
      <small>{[visibleSelected.category, visibleSelected.subType].filter(Boolean).join(' | ')}</small>
      {visibleSelected.variants?.length ? <p>{visibleSelected.variants.length}개 변형: {visibleSelected.variants.map(variant => variant.name || variant.id).join(', ')}</p> : null}
      {visibleSelected.levels?.length ? <p>레벨: {Math.min(...visibleSelected.levels)}-{Math.max(...visibleSelected.levels)}</p> : null}
      {Array.isArray(visibleSelected.raw.stats)&&<ul>{visibleSelected.raw.stats.filter((line):line is string=>typeof line==='string').slice(0,8).map((line,index)=><li key={index}>{line}</li>)}</ul>}
    </div>}
  </div>;
}