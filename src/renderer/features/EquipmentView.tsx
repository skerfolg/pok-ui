import { useEffect, useState } from 'react';
import type { BuildEdit, ParsedBuild } from '../../shared/contracts';
const names: Record<string, string> = { 'Weapon 1': '주 무기 I', 'Weapon 2': '보조 무기 I', Helmet: '투구', 'Body Armour': '갑옷', Gloves: '장갑', Boots: '신발', Amulet: '목걸이', 'Ring 1': '반지 1', 'Ring 2': '반지 2', Belt: '허리띠', 'Weapon 1 Swap': '주 무기 II', 'Weapon 2 Swap': '보조 무기 II', 'Charm 1': '호신부 1', 'Charm 2': '호신부 2', 'Charm 3': '호신부 3', 'Flask 1': '생명력 플라스크', 'Flask 2': '마나 플라스크' };
export function EquipmentView({ parsed, edit }: { parsed: ParsedBuild; edit: (edit: BuildEdit, label: string) => void }) {
  const set = parsed.itemSets.find(s => s.active) ?? parsed.itemSets[0];
  const [slot, setSlot] = useState('Weapon 1'); const [query, setQuery] = useState(''); const [draft, setDraft] = useState(''); const [rawOpen, setRawOpen] = useState(false);
  const item = parsed.items.find(i => i.id === set?.slots[slot]);
  const itemLines = item?.text.trim().split(/\r?\n/) ?? [];
  if (itemLines[0]?.startsWith('Rarity:')) itemLines.shift();
  if (itemLines[0] === item?.name) itemLines.shift();
  if (item?.base && itemLines[0] === item.base) itemLines.shift();
  useEffect(() => { setDraft(item?.text ?? ''); setRawOpen(false); }, [item?.id, item?.text, slot]);
  if (!set) return <p>장비 세트가 없습니다.</p>;
  const slots = [...new Set([...Object.keys(names), ...Object.keys(set.slots)])];
  return <section className="feature fill">
    <div className="page-heading"><h1>장비</h1><span className="muted">장착 목록 · 선택 장비 · 저장 아이템</span><select aria-label="장비 세트" value={set.id} onChange={e => edit({ type: 'active-set', kind: 'items', id: e.target.value }, '장비 세트 변경')}>{parsed.itemSets.map(s => <option key={s.id} value={s.id}>{s.title || `세트 ${s.id}`}</option>)}</select><span className="count">{parsed.items.length}개 아이템</span></div>
    <div className="equipment-layout">
      <div className="panel slot-panel"><header className="panel-heading"><h2>장착 슬롯</h2></header><div className="scroll">
        {slots.map(key => { const value = parsed.items.find(i => i.id === set.slots[key]); return <button key={key} className="slot-row" aria-pressed={slot === key} onClick={() => setSlot(key)}><span>{names[key] ?? key}</span><span className={`item-label rarity-${value?.rarity.toLowerCase()}`}>{value?.name || '없음'}</span></button>; })}
      </div></div>
      <div className="equipment-columns">
        <div className="panel item-detail"><header className="panel-heading"><h2>{names[slot] ?? slot}</h2><span className="muted">{item ? item.rarity : '비어 있음'}</span></header><div className="scroll">
          {item ? <article className="item-preview"><h3 className={`rarity-${item.rarity.toLowerCase()}`}>{item.name}</h3><p className="muted">{item.base}</p><div className="item-lines">{itemLines.filter(Boolean).map((line, index) => <div key={index}>{line}</div>)}</div></article> : <div className="empty-small">오른쪽 목록에서 아이템을 선택해 장착하세요.</div>}
          <details className="raw-editor" open={rawOpen} onToggle={e => setRawOpen(e.currentTarget.open)}><summary>아이템 원문 편집</summary><label>PoB 아이템 텍스트<textarea aria-label="아이템 원문" value={draft} rows={15} spellCheck={false} onChange={e => setDraft(e.target.value)} /></label><div className="actions"><button disabled={!item} onClick={() => edit({ type: 'slot', setId: set.id, slot, itemId: '0' }, '장착 해제')}>장착 해제</button><button className="primary" disabled={!draft.trim()} onClick={() => { const id = item?.id ?? String(Math.max(0, ...parsed.items.map(i => Number(i.id) || 0)) + 1); edit({ type: 'item', id, text: draft }, '아이템 편집'); if (!item) edit({ type: 'slot', setId: set.id, slot, itemId: id }, '아이템 장착'); }}>적용</button></div></details>
        </div></div>
        <div className="panel item-library"><header className="panel-heading"><h2>빌드에 저장된 아이템</h2><span className="muted">{parsed.items.length}개</span></header><div className="library-body"><input type="search" aria-label="저장 아이템 검색" placeholder="이름·옵션 검색" value={query} onChange={e => setQuery(e.target.value)} /><div className="scroll item-list">{parsed.items.filter(i => i.text.toLowerCase().includes(query.toLowerCase())).map(i => <div key={i.id} className="library-row"><div><span className={`rarity-${i.rarity.toLowerCase()}`}>{i.name}</span><small>{i.base}</small></div><button aria-label={`${i.name} 장착`} onClick={() => edit({ type: 'slot', setId: set.id, slot, itemId: i.id }, `${names[slot] ?? slot} 장착 변경`)}>장착</button></div>)}</div><p className="muted library-note">선택한 슬롯에 장착합니다. 재계산 시 검증 결과를 확인하세요.</p></div></div>
      </div>
    </div>
  </section>;
}
