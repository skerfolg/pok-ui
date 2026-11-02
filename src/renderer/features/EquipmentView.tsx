import { SetControls } from '../components/SetControls';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { BuildDocument,Calculation,BuildEdit, ParsedBuild } from '../../shared/contracts';
import type { CatalogEntry, ItemRenderRequest } from '../../shared/game-data';
import { api } from '../services/api';
import { CatalogPicker } from './CatalogPicker';
import {NativeItemEditor} from './NativeItemEditor';
import {hashBuildXml} from '../../shared/calculation-context';
import {useEquipmentState} from '../state/useEquipmentState';

const names: Record<string, string> = {
  'Weapon 1': '주 무기 I',
  'Weapon 2': '보조 무기 I',
  Helmet: '투구',
  'Body Armour': '갑옷',
  Gloves: '장갑',
  Boots: '신발',
  Amulet: '목걸이',
  'Ring 1': '반지 1',
  'Ring 2': '반지 2',
  Belt: '허리띠',
  'Weapon 1 Swap': '주 무기 II',
  'Weapon 2 Swap': '보조 무기 II',
  'Charm 1': '호신부 1',
  'Charm 2': '호신부 2',
  'Charm 3': '호신부 3',
  'Flask 1': '생명력 플라스크',
  'Flask 2': '마나 플라스크',
};

const modDeclaration = (entry: CatalogEntry) => entry.id;

export function EquipmentView({ parsed, edit, catalogEnabled = true, runtimeReady = false, buildId, buildRevision,buildXml,runtimeId,applyExpected,calculated }: { parsed: ParsedBuild; edit: (edit: BuildEdit, label: string) => void; catalogEnabled?: boolean; runtimeReady?: boolean; buildId?: string; buildRevision?: number;buildXml?:string;runtimeId?:string;applyExpected?:(snapshot:Pick<BuildDocument,'id'|'xml'|'revision'>,edit:BuildEdit,label:string)=>BuildDocument;calculated?:(build:BuildDocument,calculation:Calculation)=>boolean }) {
  const set = parsed.itemSets.find(s => s.active) ?? parsed.itemSets[0];
  const [slot, setSlot] = useState('Weapon 1');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [rawOpen, setRawOpen] = useState(false);
  const [catalogStatus, setCatalogStatus] = useState('');
  const [renderDiagnostics,setRenderDiagnostics]=useState<unknown[]>([]);
  const [selectedUnique, setSelectedUnique] = useState<CatalogEntry | undefined>();
  const [selectedBase, setSelectedBase] = useState<CatalogEntry | undefined>();
  const [selectedMods, setSelectedMods] = useState<CatalogEntry[]>([]);
  const [uniqueVariant, setUniqueVariant] = useState('');
  const [quality, setQuality] = useState('');
  const [rolls, setRolls] = useState<Record<string, string>>({});
  const [rendering, setRendering] = useState<'base' | 'unique' | 'rare' | ''>('');
  const [equipping,setEquipping]=useState(false);
  const item = parsed.items.find(i => i.id === set?.slots[slot]);
  const native=useEquipmentState(buildId,buildRevision,buildXml,runtimeId);
  const nativeSlot=native.data?.slots.find(s=>s.name===slot);
  const itemLines = item?.text.trim().split(/\r?\n/) ?? [];
  if (itemLines[0]?.startsWith('Rarity:')) itemLines.shift();
  if (itemLines[0] === item?.name) itemLines.shift();
  if (item?.base && itemLines[0] === item.base) itemLines.shift();

  useEffect(() => { setDraft(item?.text ?? ''); setRawOpen(false); }, [item?.id, item?.text, slot]);
  useEffect(() => { setUniqueVariant(''); }, [selectedUnique?.id]);
  useEffect(()=>{setCatalogStatus('');},[slot,buildId]);

  const nextItemId = () => String(Math.max(0, ...parsed.items.map(i => Number(i.id) || 0)) + 1);
  const slots = [...new Set([...Object.keys(names), ...Object.keys(set?.slots ?? {}),...(native.data?.slots.filter(s=>!s.parentSlot||s.visible||s.itemId!=='0').map(s=>s.name)||[])])];
  const rareMods = useMemo(() => selectedMods.map(entry => ({ entry, declaration: modDeclaration(entry) })), [selectedMods]);
  const canRenderCatalog = catalogEnabled && runtimeReady;
  const renderContext = useRef({ runtimeReady, buildId, buildRevision, setId: set?.id, slot });
  renderContext.current = { runtimeReady, buildId, buildRevision, setId: set?.id, slot };

  if (!set) return <section className="feature scroll"><div className="page-heading"><h1>장비</h1><SetControls kind="items" sets={parsed.itemSets} edit={edit}/></div><p>장비 세트를 만들어 편집을 시작하세요.</p></section>;

  async function renderAndEquip(kind: 'base' | 'unique' | 'rare') {
    if (rendering) return;
    if (!catalogEnabled) { setCatalogStatus('현재 트리 버전에서는 카탈로그 아이템을 적용할 수 없습니다.'); return; }
    if (!runtimeReady) { setCatalogStatus('독립 PoB 런타임을 준비한 뒤 장착할 수 있습니다.'); return; }
    const entry = kind === 'unique' ? selectedUnique : selectedBase;
    if (!entry) return;
    const submitted = { ...renderContext.current };
    const requestQuality = Number(quality);
    const baseRequest: ItemRenderRequest = {
      kind,
      id: entry.id,
      slot,buildXml,
      ...(Number.isFinite(requestQuality) && quality.trim() ? { quality: requestQuality } : {}),
    };
    const request: ItemRenderRequest = kind === 'unique'
      ? { ...baseRequest, variants: uniqueVariant ? [uniqueVariant] : undefined }
      : kind === 'rare'
        ? {
            ...baseRequest,
            mods: rareMods.map(mod => mod.declaration),
            rolls: Object.fromEntries(
              rareMods
                .filter(({declaration})=>Boolean(rolls[declaration]?.trim()))
                .map(({ declaration }) => [declaration, Number(rolls[declaration])] as const)
                .filter(([, value]) => Number.isFinite(value)),
            ),
          }
        : baseRequest;

    setRendering(kind);
    setRenderDiagnostics([]);
    setCatalogStatus('선택한 카탈로그 항목을 아이템 원문으로 생성하는 중...');
    try {
      const rendered = await api.renderPobItem(request);
      const current = renderContext.current;
      if (!current.runtimeReady || current.buildId !== submitted.buildId || current.buildRevision !== submitted.buildRevision || current.setId !== submitted.setId || current.slot !== submitted.slot) {
        setCatalogStatus('요청 중 빌드, 슬롯 또는 PoB 런타임 상태가 바뀌어 장착을 취소했습니다.');
        return;
      }
      setRenderDiagnostics(Array.isArray(rendered.diagnostics)?rendered.diagnostics:[]);
      if (!rendered.ok || !rendered.text) {
        setCatalogStatus(rendered.reason || '이 카탈로그 항목은 아직 아이템 원문으로 생성할 수 없습니다.');
        return;
      }
      edit({ type: 'item-equip', setId: set.id, slot, id: nextItemId(), text: rendered.text }, `${names[slot] ?? slot} 카탈로그 아이템 장착`);
      setCatalogStatus(`${entry.name} 장착`);
    } catch (error) {
      setCatalogStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setRendering('');
    }
  }

  const toggleMod = (entry: CatalogEntry) => {
    setSelectedMods(current => current.some(mod => mod.id === entry.id)
      ? current.filter(mod => mod.id !== entry.id)
      : [...current, entry]);
  };

  const applyRawItem = () => {
    const id = item?.id ?? nextItemId();
    if (item) {
      edit({ type: 'item', id, text: draft }, '아이템 편집');
      return;
    }
    edit({ type: 'item-equip', setId: set.id, slot, id, text: draft }, '아이템 생성 및 장착');
  };
  async function equipStored(itemId:string){
    if(equipping||!runtimeReady||!runtimeId||!buildId||buildRevision===undefined||!buildXml||!applyExpected)return;
    const snapshot={id:buildId,revision:buildRevision,xml:buildXml},submitted={...renderContext.current};setEquipping(true);setCatalogStatus('원본 슬롯 장착 가능 여부 확인 중…');
    const active=()=>{const c=renderContext.current;return c.runtimeReady&&c.buildId===submitted.buildId&&c.buildRevision===submitted.buildRevision&&c.setId===submitted.setId&&c.slot===submitted.slot;};
    try{
      const [result,hash]=await Promise.all([api.equipment({buildId:snapshot.id,revision:snapshot.revision,xml:snapshot.xml,itemId,runtimeId,slot:submitted.slot,action:'equip'}),hashBuildXml(snapshot.xml)]);
      if(!active())return;
      if(result.buildId!==snapshot.id||result.revision!==snapshot.revision||result.xmlSha256!==hash||result.runtimeId!==runtimeId)throw new Error('장착 연산의 입력·버전이 현재 문서와 다릅니다.');
      const next=applyExpected(snapshot,{type:'equipment-native-patch',setId:submitted.setId!,patch:result.patch},`${names[submitted.slot]??submitted.slot} 원본 장착 연산`);
      const calculation=await api.computeBuild(next);calculated?.(next,calculation);setCatalogStatus(`리비전 ${next.revision} 장착·계산 수신 · 원본 변경 슬롯 ${Object.keys(result.patch.slots).join(', ')||'없음'}`);
    }catch(reason){if(active())setCatalogStatus(String(reason));}finally{setEquipping(false);}
  }
  async function switchWeapon(weaponSet:number){
    if(equipping||!native.data||!buildId||buildRevision===undefined||!buildXml||!applyExpected||!set)return;
    const snapshot={id:buildId,revision:buildRevision,xml:buildXml};setEquipping(true);setCatalogStatus('원본 무기 세트 전환 중…');
    try{const [result,hash]=await Promise.all([api.equipment({buildId,revision:buildRevision,xml:buildXml,runtimeId,action:'weapon',weaponSet}),hashBuildXml(buildXml)]);
      if(result.buildId!==snapshot.id||result.revision!==snapshot.revision||result.xmlSha256!==hash||result.runtimeId!==runtimeId)throw new Error('무기 전환 연산의 입력/버전이 다릅니다.');
      const next=applyExpected(snapshot,{type:'equipment-native-patch',setId:set.id,patch:result.patch},`원본 활성 무기 세트 ${weaponSet} 전환`),calculation=await api.computeBuild(next);calculated?.(next,calculation);setCatalogStatus(`리비전 ${next.revision} 무기 ${weaponSet} · 원본 주력 그룹 ${result.mainSocketGroup} · 새 계산 수신`);
    }catch(reason){setCatalogStatus(String(reason));}finally{setEquipping(false);}
  }

  return <section className="feature fill">
    <div className="page-heading"><h1>장비</h1><span className="muted">장착 목록 · 선택 장비 · 저장 아이템</span><SetControls kind="items" sets={parsed.itemSets} edit={edit} /><div className="actions"><button aria-pressed={native.data?!native.data.useSecondWeaponSet:!set.useSecondWeaponSet} disabled={!native.data||equipping||!native.data.useSecondWeaponSet} onClick={()=>void switchWeapon(1)}>무기 I 활성</button><button aria-pressed={native.data?.useSecondWeaponSet??set.useSecondWeaponSet} disabled={!native.data||equipping||native.data.useSecondWeaponSet} onClick={()=>void switchWeapon(2)}>무기 II 활성</button></div><span className="count">{parsed.items.length}개 아이템</span></div>
    <div className="equipment-layout">
      <div className="panel slot-panel"><header className="panel-heading"><h2>장착 슬롯</h2></header><div className="scroll">
        {slots.map(key => { const value = parsed.items.find(i => i.id === set.slots[key]),descriptor=native.data?.slots.find(s=>s.name===key),label=descriptor?.parentSlot?`${names[descriptor.parentSlot]||descriptor.parentSlot} · ${descriptor.label}`:names[key]??key; return <button key={key} className="slot-row" aria-label={`${label} 슬롯`} aria-pressed={slot === key} onClick={() => setSlot(key)}><span>{label}{descriptor&&!descriptor.visible&&<small className="muted"> · 비활성</small>}</span><span className={`item-label rarity-${value?.rarity.toLowerCase()}`}>{value?.name || '없음'}</span></button>; })}
      </div></div>
      <div className="equipment-columns">
        <div className="panel item-detail"><header className="panel-heading"><h2>{names[slot] ?? slot}</h2><span className="muted">{item ? item.rarity : '없음'}</span></header><div className="scroll">
          {native.pending&&<p className="muted note">원본 장비 슬롯 확인 중…</p>}{native.error&&<p className="warning">{native.error}</p>}{native.data?.diagnostics.map((d,i)=><p className="warning" key={i}>{d.code} · {d.field}: {d.message}</p>)}
          {nativeSlot?.parentSlot&&<div className="panel-body"><label>원본 장비 주얼<select aria-label="원본 장비 주얼" value={nativeSlot.itemId} disabled={equipping||!nativeSlot.visible||!nativeSlot.enabled} onChange={e=>void equipStored(e.target.value)}>{nativeSlot.choices.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></label></div>}
          {item ? <article className="item-preview"><h3 className={`rarity-${item.rarity.toLowerCase()}`}>{item.name}</h3><p className="muted">{item.base}</p><div className="item-lines">{itemLines.filter(Boolean).map((line, index) => <div key={index}>{line}</div>)}</div></article> : <div className="empty-small">오른쪽 목록에서 아이템을 선택하거나 생성하세요.</div>}
          {item&&buildId&&buildRevision!==undefined&&buildXml&&applyExpected&&calculated&&<NativeItemEditor key={item.id} build={{id:buildId,revision:buildRevision,xml:buildXml}} item={item} slot={slot} runtimeId={runtimeId} applyExpected={applyExpected} calculated={calculated}/>}
          <details className="raw-editor" open={rawOpen} onToggle={e => setRawOpen(e.currentTarget.open)}><summary>아이템 원문 편집</summary><label>PoB 아이템 텍스트<textarea aria-label="아이템 원문" value={draft} rows={15} spellCheck={false} onChange={e => setDraft(e.target.value)} /></label><div className="actions"><button disabled={!item||equipping||!runtimeReady} onClick={() => void equipStored('0')}>장착 해제</button><button className="primary" disabled={!draft.trim()} onClick={applyRawItem}>적용</button></div></details>
        </div></div>
        <div className="panel item-library"><header className="panel-heading"><h2>아이템</h2><span className="muted">{parsed.items.length}개 저장됨</span></header><div className="library-body"><input type="search" aria-label="저장 아이템 검색" placeholder="이름·옵션 검색" value={query} onChange={e => setQuery(e.target.value)} /><div className="scroll item-list">{parsed.items.filter(i => i.text.toLowerCase().includes(query.toLowerCase())).map(i => <div key={i.id} className="library-row"><div><span className={`rarity-${i.rarity.toLowerCase()}`}>{i.name}</span><small>{i.base}</small></div><button aria-label={`${i.name} 장착`} disabled={equipping||!runtimeReady} onClick={() => void equipStored(i.id)}>장착</button></div>)}</div>
          <div className="catalog-builder">
            <CatalogPicker type="unique" title="유니크 카탈로그" selectedId={selectedUnique?.id} disabled={!catalogEnabled} onSelect={setSelectedUnique} />
            {selectedUnique && <div className="catalog-apply-box">
              <label>유니크 변형
                <select aria-label="유니크 변형" value={uniqueVariant} onChange={event => setUniqueVariant(event.target.value)}>
                  <option value="">{selectedUnique.variants?.length ? '변형 선택 필요' : '기본 원문'}</option>
                  {selectedUnique.variants?.map(variant => <option key={variant.id} value={variant.id}>{variant.name || variant.id}</option>)}
                </select>
              </label>
              <button className="primary" disabled={!canRenderCatalog || rendering !== '' || Boolean(selectedUnique.variants?.length && !uniqueVariant)} onClick={() => void renderAndEquip('unique')}>{rendering === 'unique' ? '생성 중...' : '유니크 장착'}</button>
            </div>}
            <CatalogPicker type="base" title="베이스 카탈로그" selectedId={selectedBase?.id} disabled={!catalogEnabled} onSelect={entry => { setSelectedBase(entry); setSelectedMods([]); setRolls({}); }} />
            {selectedBase && <div className="catalog-apply-box">
              <div className="field-grid compact"><label>퀄리티<input aria-label="아이템 퀄리티" type="number" min="0" max="100" value={quality} onChange={event => setQuality(event.target.value)} placeholder="선택" /></label><button disabled={!canRenderCatalog || rendering !== ''} onClick={() => void renderAndEquip('base')}>{rendering === 'base' ? '생성 중...' : '베이스 장착'}</button></div>
              <CatalogPicker type="mod" title="레어 접사 카탈로그" selectedId="" disabled={!catalogEnabled} onSelect={toggleMod} />
              <div className="selected-mods">
                <strong>선택한 접사</strong>
                {rareMods.length ? rareMods.map(({ entry, declaration }) => <div key={entry.id} className="selected-mod-row"><span>{entry.name}</span><small>{declaration}</small><label>Roll 0..1<input aria-label={`${entry.name} roll`} type="number" min="0" max="1" step="0.01" value={rolls[declaration] ?? ''} onChange={event => setRolls(current => ({ ...current, [declaration]: event.target.value }))} placeholder="기본" /></label><button type="button" onClick={() => toggleMod(entry)}>제거</button></div>) : <p className="muted">레어 아이템에 넣을 접사를 선택하세요.</p>}
              </div>
              <button className="primary" disabled={!canRenderCatalog || rendering !== '' || !rareMods.length} onClick={() => void renderAndEquip('rare')}>{rendering === 'rare' ? '생성 중...' : '레어 장착'}</button>
            </div>}
          </div>
          <p className="muted library-note">{catalogStatus || (runtimeReady ? '카탈로그 항목은 고정된 PoB 데이터에서 아이템 텍스트를 생성한 뒤에만 적용합니다.' : '카탈로그 장착은 독립 PoB 런타임을 사용합니다. PoK 연결은 필요하지 않습니다.')}</p>{renderDiagnostics.length>0&&<details className="spaced"><summary>아이템 생성·파싱 진단</summary><pre>{JSON.stringify(renderDiagnostics,null,2)}</pre></details>}</div></div>
      </div>
    </div>
  </section>;
}
