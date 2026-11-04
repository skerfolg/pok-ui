import {Sword,Shield,Shirt,Crown,Hand,Footprints,Circle,Link2,FlaskConical,Gem} from 'lucide-react';
import {ItemSummary} from '../components/ItemSummary';
import {useSessionDraft} from '../state/useSessionDraft';
import {ItemHover} from './ItemHover';
import {CreationDraftEditor} from './CreationDraftEditor';
import type {PobTreeResult} from '../../shared/pob-tree';
import {readWorkspaceCharacter} from '../state/workspace-character';
import {HoverCard} from '../components/HoverCard';
import {JewelLocation} from '../components/JewelLocation';
import { SetControls } from '../components/SetControls';
import { useEffect, useRef, useState } from 'react';
import type { BuildDocument,BuildEdit, ParsedBuild } from '../../shared/contracts';
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


export function EquipmentView({ focus,build,getRuntimeId,parsed, edit, catalogEnabled = true, runtimeReady = false, buildId, buildRevision,buildXml,runtimeId,applyExpected }: { focus?:{itemId?:string;slot?:string};build:BuildDocument;getRuntimeId:()=>string|undefined;parsed: ParsedBuild; edit: (edit: BuildEdit, label: string) => void; catalogEnabled?: boolean; runtimeReady?: boolean; buildId?: string; buildRevision?: number;buildXml?:string;runtimeId?:string;applyExpected?:(snapshot:Pick<BuildDocument,'id'|'xml'|'revision'>,edit:BuildEdit,label:string)=>BuildDocument }) {
  const set = parsed.itemSets.find(s => s.active) ?? parsed.itemSets[0];
  const [showAllJewels,setShowAllJewels]=useState(false);
  const [jewelTree,setJewelTree]=useState<PobTreeResult>();
  const [jewelNode,setJewelNode]=useState<number>();
  const [jewelControls,setJewelControls]=useState<PobTreeResult>();
  const jewelGeneration=useRef(0);
  const [equipmentTab,setEquipmentTab]=useSessionDraft<'gear'|'jewels'>('equipment:'+build.id,'equipmentTab','gear');
  const [selectedItemId,setSelectedItemId]=useSessionDraft<string|undefined>('equipment:'+build.id,'selectedItemId',undefined);
  const [creating,setCreating]=useSessionDraft('equipment:'+build.id,'creating',false);
  const [creationKind,setCreationKind]=useSessionDraft<'normal'|'rare'|'unique'>('equipment:'+build.id,'creationKind','rare');
  const [creationName,setCreationName]=useSessionDraft('equipment:'+build.id,'creationName','');
  const creationEpoch=useRef(0);
  const [createdText,setCreatedText]=useSessionDraft('equipment:'+build.id,'createdText','');
  const [createdSignature,setCreatedSignature]=useSessionDraft('equipment:'+build.id,'createdSignature','');
  const [createdVersion,setCreatedVersion]=useSessionDraft('equipment:'+build.id,'createdVersion',0);
  const [deleting,setDeleting]=useState<string[]>([]);
  const [sortItems,setSortItems]=useState(false);
  const [slot, setSlot] = useSessionDraft('equipment:'+build.id,'slot','Weapon 1');
  const [query, setQuery] = useSessionDraft('equipment:'+build.id,'query','');
  const [draft, setDraft] = useSessionDraft('equipment:'+build.id,'draft','');
  const [rawOpen, setRawOpen] = useSessionDraft('equipment:'+build.id,'rawOpen',false);
  const [catalogStatus, setCatalogStatus] = useState('');
  const [renderDiagnostics,setRenderDiagnostics]=useState<unknown[]>([]);
  const [selectedUnique, setSelectedUnique] = useSessionDraft<CatalogEntry | undefined>('equipment:'+build.id,'selectedUnique',undefined);
  const [selectedBase, setSelectedBase] = useSessionDraft<CatalogEntry | undefined>('equipment:'+build.id,'selectedBase',undefined);
  const [uniqueVariant, setUniqueVariant] = useSessionDraft('equipment:'+build.id,'uniqueVariant','');
  const [rendering, setRendering] = useState<'base' | 'unique' | 'rare' | ''>('');
  const [equipping,setEquipping]=useState(false);
  const equippedItem=parsed.items.find(i=>i.id===set?.slots[slot]);
  const item=selectedItemId?parsed.items.find(i=>i.id===selectedItemId):equippedItem;
  const native=useEquipmentState(buildId,buildRevision,buildXml,runtimeId);
  const nativeSlot=native.data?.slots.find(s=>s.name===slot);

  const [draftSource,setDraftSource]=useSessionDraft('equipment:'+build.id,'raw-source','');
  useEffect(()=>{const source=JSON.stringify([item?.id,item?.text,slot]);if(source!==draftSource){setDraft(item?.text??'');setRawOpen(false);setDraftSource(source);}},[item?.id,item?.text,slot]);
  const previousUnique=useRef(selectedUnique?.id);
  useEffect(()=>{if(previousUnique.current!==selectedUnique?.id){previousUnique.current=selectedUnique?.id;setUniqueVariant('');}},[selectedUnique?.id]);
  useEffect(()=>{setCatalogStatus('');},[slot,buildId]);

  useEffect(()=>{if(!focus)return;if(focus?.slot)setSlot(focus.slot);if(focus?.itemId)setSelectedItemId(focus.itemId);setCreating(false);},[focus]);
  useEffect(()=>{let alive=true;if(equipmentTab!=='jewels'||!runtimeId||!buildId||buildRevision===undefined||!buildXml)return;void readWorkspaceCharacter({id:buildId,revision:buildRevision,xml:buildXml},runtimeId).then(data=>{if(alive)setJewelTree(data);}).catch(reason=>{if(alive)setCatalogStatus(String(reason));});return()=>{alive=false;};},[equipmentTab,buildId,buildRevision,buildXml,runtimeId]);
  useEffect(()=>{setJewelControls(undefined);if(jewelNode!==undefined)void chooseJewelSocket(jewelNode);return()=>{jewelGeneration.current++;};},[jewelNode,buildId,buildRevision,buildXml,runtimeId]);
  async function chooseJewelSocket(nodeId:number){
    if(!runtimeId||!buildId||buildRevision===undefined||!buildXml)return;const token=++jewelGeneration.current;
    try{const [data,hash]=await Promise.all([api.editTree({buildId,revision:buildRevision,xml:buildXml,runtimeId,nodeId,action:'jewel'}),hashBuildXml(buildXml)]);if(token!==jewelGeneration.current)return;if(data.buildId!==buildId||data.revision!==buildRevision||data.xmlSha256!==hash||data.runtimeId!==runtimeId||data.node?.id!==nodeId)throw new Error('주얼 소켓 응답의 입력·출처가 다릅니다.');setJewelControls(data);}
    catch(reason){if(token===jewelGeneration.current)setCatalogStatus(String(reason));}
  }
  async function assignJewel(itemId:number){
    const spec=parsed.trees.find(t=>t.active);if(jewelNode===undefined||!spec||!buildId||buildRevision===undefined||!buildXml||!runtimeId||!applyExpected)return;const token=++jewelGeneration.current,snapshot={id:buildId,revision:buildRevision,xml:buildXml};setEquipping(true);
    try{const [data,hash]=await Promise.all([api.editTree({buildId,revision:buildRevision,xml:buildXml,runtimeId,nodeId:jewelNode,action:'jewel',jewelItemId:itemId}),hashBuildXml(buildXml)]);if(token!==jewelGeneration.current)return;if(data.buildId!==buildId||data.revision!==buildRevision||data.xmlSha256!==hash||data.runtimeId!==runtimeId||data.node?.id!==jewelNode||data.diagnostics.length)throw new Error(data.diagnostics.map(d=>d.message).join(' · ')||'주얼 변경의 입력·출처가 다릅니다.');applyExpected(snapshot,{type:'tree-native-patch',specId:spec.id,patch:data.patch},'패시브 주얼 변경');setSelectedItemId(itemId?String(itemId):undefined);}
    catch(reason){if(token===jewelGeneration.current)setCatalogStatus(String(reason));}finally{setEquipping(false);}
  }
  const nextItemId = () => String(Math.max(0,...parsed.items.map(i=>Number(i.id)||0),...parsed.itemSets.flatMap(set=>Object.values(set.slots).map(id=>Number(id)||0)),...parsed.trees.flatMap(tree=>tree.sockets.map(socket=>Number(socket.itemId)||0)))+1);
  const slots = [...new Set([...Object.keys(names), ...Object.keys(set?.slots ?? {}),...(native.data?.slots.filter(s=>!s.parentSlot||s.visible||s.itemId!=='0').map(s=>s.name)||[])])];
  const canRenderCatalog = catalogEnabled && runtimeReady;
  const signature=JSON.stringify([runtimeId,buildId,buildRevision,creationKind,creationName,selectedUnique?.id,selectedBase?.id,uniqueVariant]);
  const renderContext = useRef({ runtimeReady, buildId, buildRevision, setId: set?.id, slot,creating,signature });
  renderContext.current = { runtimeReady, buildId, buildRevision, setId: set?.id, slot,creating,signature };

  if (!set) return <section className="feature scroll"><div className="page-heading"><h1>장비</h1><SetControls kind="items" sets={parsed.itemSets} edit={edit}/></div><p>장비 세트를 만들어 편집을 시작하세요.</p></section>;

  async function renderDraft(kind: 'base' | 'unique' | 'rare') {
    if (rendering) return;
    if (!catalogEnabled) { setCatalogStatus('카탈로그와 독립 PoB의 출처·지원 범위를 확인해 주세요.'); return; }
    if (!runtimeReady) { setCatalogStatus('독립 PoB 런타임을 준비한 뒤 장착할 수 있습니다.'); return; }
    const entry = kind === 'unique' ? selectedUnique : selectedBase;
    if (!entry) return;
    const submitted = { ...renderContext.current },epoch=++creationEpoch.current;
    const baseRequest: ItemRenderRequest = {
      kind,
      id: entry.id,
      ...(kind==='rare'&&creationName.trim()?{name:creationName.trim()}:{}),
      buildXml,
    };
    const request: ItemRenderRequest = kind === 'unique'
      ? { ...baseRequest, variants: uniqueVariant ? [uniqueVariant] : undefined }
      : baseRequest;

    setRendering(kind);
    setRenderDiagnostics([]);
    setCatalogStatus('선택한 카탈로그 항목을 아이템 원문으로 생성하는 중...');
    try {
      const rendered = await api.renderPobItem(request);
      const current = renderContext.current;
      if (epoch!==creationEpoch.current||!current.creating||current.signature!==submitted.signature||!current.runtimeReady || current.buildId !== submitted.buildId || current.buildRevision !== submitted.buildRevision || current.setId !== submitted.setId || current.slot !== submitted.slot) {
        setCatalogStatus('요청 중 빌드, 슬롯 또는 PoB 런타임 상태가 바뀌어 장착을 취소했습니다.');
        return;
      }
      setRenderDiagnostics(Array.isArray(rendered.diagnostics)?rendered.diagnostics:[]);
      if (!rendered.ok || !rendered.text) {
        setCatalogStatus(rendered.reason || '이 카탈로그 항목은 아직 아이템 원문으로 생성할 수 없습니다.');
        return;
      }
      setCreatedText(rendered.text);setCreatedSignature(submitted.signature);setCreatedVersion(value=>value+1);
      setCatalogStatus(`${entry.name} 생성 초안 · 아직 빌드에 추가되지 않았습니다.`);
    } catch (error) {
      setCatalogStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setRendering('');
    }
  }

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
      setCatalogStatus(`리비전 ${next.revision} 장착 · 자동 계산 대기 · 원본 변경 슬롯 ${Object.keys(result.patch.slots).join(', ')||'없음'}`);
    }catch(reason){if(active())setCatalogStatus(String(reason));}finally{setEquipping(false);}
  }
  async function switchWeapon(weaponSet:number){
    if(equipping||!native.data||!buildId||buildRevision===undefined||!buildXml||!applyExpected||!set)return;
    const snapshot={id:buildId,revision:buildRevision,xml:buildXml};setEquipping(true);setCatalogStatus('원본 무기 세트 전환 중…');
    try{const [result,hash]=await Promise.all([api.equipment({buildId,revision:buildRevision,xml:buildXml,runtimeId,action:'weapon',weaponSet}),hashBuildXml(buildXml)]);
      if(result.buildId!==snapshot.id||result.revision!==snapshot.revision||result.xmlSha256!==hash||result.runtimeId!==runtimeId)throw new Error('무기 전환 연산의 입력/버전이 다릅니다.');
      const next=applyExpected(snapshot,{type:'equipment-native-patch',setId:set.id,patch:result.patch},`원본 활성 무기 세트 ${weaponSet} 전환`);setCatalogStatus(`리비전 ${next.revision} 무기 ${weaponSet} · 원본 주력 그룹 ${result.mainSocketGroup} · 새 계산 수신`);
    }catch(reason){setCatalogStatus(String(reason));}finally{setEquipping(false);}
  }

  const second=native.data?.useSecondWeaponSet??set.useSecondWeaponSet;
  const visibleSlots=(native.data?native.data.slots.filter(s=>s.visible&&!s.parentSlot).map(s=>s.name):slots).filter(key=>!key.includes('Swap')||second).filter(key=>!second||!['Weapon 1','Weapon 2'].includes(key));
  const jewelLayout=jewelTree?.runtimeId===runtimeId?jewelTree:undefined;
  const storedJewels=new Map(parsed.trees.find(t=>t.active)?.sockets.map(s=>[s.nodeId,s.itemId])||[]);
  const jewelRows=jewelLayout?.jewelSockets?.filter(s=>showAllJewels||s.allocated||s.itemId!==0||Number(storedJewels.get(String(s.nodeId))||0)!==0).map(s=>({nodeId:String(s.nodeId),itemId:storedJewels.get(String(s.nodeId))??String(s.itemId),allocated:s.allocated}))||[];
  function gearSocket(s:NonNullable<typeof native.data>['slots'][number]){const value=parsed.items.find(item=>item.id===s.itemId),label=`${names[s.parentSlot!]||s.parentSlot} · ${s.label}`;return <HoverCard key={s.name} label={`${label} 옵션`} content={value?<ItemHover build={build} item={value} runtimeId={runtimeId} slot={s.name}/>:<p>{label} · 비어 있음</p>}><button aria-label={`${label} 슬롯`} aria-pressed={slot===s.name} onClick={()=>chooseSlot(s.name)}>{label}{value&&<span>{value.name}</span>}{!s.visible&&<small>비활성</small>}</button></HoverCard>;}

  function chooseSlot(key:string){setJewelNode(undefined);setSlot(key);setSelectedItemId(undefined);setCreating(false);}
  return <section className="feature fill equipment-workspace">
    <div className="page-heading"><h1>장비</h1><span className="muted">장착 · 보유 목록 · 아이템 생성</span><details className="equipment-set-management"><summary>비활성 세트 관리</summary><SetControls kind="items" sets={parsed.itemSets} edit={edit}/></details></div>
    <div className="equipment-workbench">
      <div className="equipment-left"><div className="panel equipment-slots"><header className="panel-heading"><div className="actions"><button aria-pressed={equipmentTab==='gear'} onClick={()=>setEquipmentTab('gear')}>장비</button><button aria-pressed={equipmentTab==='jewels'} onClick={()=>setEquipmentTab('jewels')}>패시브 주얼</button></div><div className="actions"><small>무기</small><button aria-label="무기 I 활성" aria-pressed={!second} disabled={!native.data||equipping||!second} onClick={()=>void switchWeapon(1)}>I</button><button aria-label="무기 II 활성" aria-pressed={Boolean(second)} disabled={!native.data||equipping||second} onClick={()=>void switchWeapon(2)}>II</button></div></header>
        {equipmentTab==='gear'?<div className="gear-slots scroll">{visibleSlots.map(key=>{const value=parsed.items.find(i=>i.id===set.slots[key]),descriptor=native.data?.slots.find(s=>s.name===key);if(descriptor?.parentSlot)return null;const label=names[key]??key,Icon=key.startsWith('Weapon 1')?Sword:key.startsWith('Weapon 2')?Shield:key==='Helmet'?Crown:key==='Body Armour'?Shirt:key==='Gloves'?Hand:key==='Boots'?Footprints:key==='Belt'?Link2:key.startsWith('Flask')?FlaskConical:key.startsWith('Charm')?Gem:Circle;return <HoverCard key={key} dataSlot={key.replace(' Swap','')} label={`${label} 옵션`} content={value?<ItemHover build={build} item={value} runtimeId={runtimeId} slot={key}/>:<pre>{`${label} · 비어 있음`}</pre>}><button className="gear-slot" data-filled={Boolean(value)} data-rarity={value?.rarity.toLowerCase()} data-slot={key.replace(' Swap','')} aria-label={`${label} 슬롯`} aria-pressed={slot===key&&(!selectedItemId||set.slots[key]===selectedItemId)} onClick={()=>chooseSlot(key)}><span className="slot-kind"><Icon aria-hidden="true" strokeWidth={1.3}/><small><span className="slot-label-full">{label}</span><span className="slot-label-compact">{key==='Flask 1'?'생명력':key==='Flask 2'?'마나':key.startsWith('Charm')?'호신 '+key.split(' ')[1]:label}</span></small></span>{value&&<span className={`slot-item-name rarity-${value.rarity.toLowerCase()}`}>{value.name}</span>}</button></HoverCard>;})}</div>:<div className="scroll panel-body"><div className="actions"><p className="muted">활성 패시브 트리의 주얼 소켓</p><label className="check"><input type="checkbox" checked={showAllJewels} onChange={e=>setShowAllJewels(e.target.checked)}/>미할당 소켓도 표시</label></div>{jewelRows.map(socket=>{const jewel=parsed.items.find(i=>i.id===socket.itemId);return <HoverCard key={socket.nodeId} label={`소켓 ${socket.nodeId} 위치와 옵션`} content={<>{runtimeId&&<JewelLocation runtimeId={runtimeId} version={parsed.trees.find(t=>t.active)!.version} nodeId={Number(socket.nodeId)}/>}{jewel?<ItemHover build={build} item={jewel} runtimeId={runtimeId} nodeId={Number(socket.nodeId)}/>:<pre>빈 주얼 소켓</pre>}</>}><button className="jewel-socket-row" onClick={()=>{setJewelNode(Number(socket.nodeId));setSelectedItemId(jewel?.id);setCreating(false);}}>소켓 {socket.nodeId}<span>{jewel?.name||'비어 있음'}</span></button></HoverCard>;})}{!jewelLayout&&<p className="muted" role="status">원본 소켓 목록 확인 중…</p>}</div>}
        {equipmentTab==='gear'&&<><div className="gear-sockets">{native.data?.slots.filter(s=>s.parentSlot&&(s.visible||s.itemId!=='0')).map(gearSocket)}</div><details className="inactive-gear-sockets"><summary>비활성 장비 소켓</summary><div className="gear-sockets scroll">{native.data?.slots.filter(s=>s.parentSlot&&!s.visible&&s.itemId==='0').map(gearSocket)}</div></details></>}
      </div>
      <div className="panel item-library"><header className="panel-heading"><h2>보유 아이템 {parsed.items.length}</h2></header><div className="library-body"><input type="search" aria-label="저장 아이템 검색" placeholder="이름·옵션 검색" value={query} onChange={e=>setQuery(e.target.value)}/><div className="actions inventory-tools"><button aria-pressed={sortItems} onClick={()=>setSortItems(v=>!v)}>Sort</button><button disabled={!parsed.items.length} onClick={()=>{const used=new Set([...parsed.itemSets.flatMap(s=>Object.values(s.slots)),...parsed.trees.flatMap(t=>t.sockets.map(s=>s.itemId))]);setDeleting(parsed.items.filter(i=>!used.has(i.id)).map(i=>i.id));}}>미사용 삭제</button><button disabled={!parsed.items.length} onClick={()=>setDeleting(parsed.items.map(i=>i.id))}>전체 삭제</button><button disabled={!item} onClick={()=>setDeleting(item?[item.id]:[])}>삭제</button></div><div className="scroll item-list">{[...parsed.items].sort((a,b)=>sortItems?a.name.localeCompare(b.name):0).filter(i=>i.text.toLowerCase().includes(query.toLowerCase())).map(i=><div className="library-row" key={i.id}><HoverCard label={`${i.name} 옵션`} content={<ItemHover build={build} item={i} runtimeId={runtimeId}/>}><button className="inventory-item" aria-pressed={item?.id===i.id} onClick={()=>{setJewelNode(undefined);setSelectedItemId(i.id);setCreating(false);}}><span className={`rarity-${i.rarity.toLowerCase()}`}>{i.name}</span><small>{i.base}</small></button></HoverCard><button aria-label={`${i.name} 장착`} disabled={equipping||!runtimeReady} onClick={()=>void equipStored(i.id)}>장착</button></div>)}</div></div></div></div>
      <div className="panel item-detail"><header className="panel-heading"><h2>아이템 생성 · 옵션</h2><button className="primary" onClick={()=>{creationEpoch.current++;setJewelNode(undefined);setCreating(true);setCatalogStatus('');}}>Create Item</button></header><div className="scroll panel-body">
        {native.pending&&<p className="muted" role="status">원본 장비 슬롯 확인 중…</p>}{native.error&&<p className="warning">{native.error}</p>}{native.data?.diagnostics.map((d,i)=><p className="warning" key={i}>{d.field}: {d.message}</p>)}
        {creating?<><div className="actions"><label>희귀도<select aria-label="생성 아이템 희귀도" value={creationKind} onChange={e=>{setCreationKind(e.target.value as 'normal'|'rare'|'unique');}}><option value="normal">일반 · 베이스 선택</option><option value="rare">희귀 · 베이스 선택</option><option value="unique">고유 · 검색</option></select></label><button onClick={()=>{creationEpoch.current++;setCreating(false);}}>보유 아이템 보기</button></div>          <div className="catalog-builder">
            {creationKind==='unique'&&<CatalogPicker type="unique" title="유니크 카탈로그" selectedId={selectedUnique?.id} disabled={!catalogEnabled} onSelect={setSelectedUnique} />}
            {creationKind==='unique'&&selectedUnique && <div className="catalog-apply-box">
              <label>유니크 변형
                <select aria-label="유니크 변형" value={uniqueVariant} onChange={event => setUniqueVariant(event.target.value)}>
                  <option value="">{selectedUnique.variants?.length ? '변형 선택 필요' : '기본 원문'}</option>
                  {selectedUnique.variants?.map(variant => <option key={variant.id} value={variant.id}>{variant.name || variant.id}</option>)}
                </select>
              </label>
              <button className="primary" disabled={!canRenderCatalog || rendering !== '' || Boolean(selectedUnique.variants?.length && !uniqueVariant)} onClick={() => void renderDraft('unique')}>{rendering === 'unique' ? '생성 중...' : '고유 초안 생성'}</button>
            </div>}
            {creationKind!=='unique'&&<CatalogPicker type="base" title="베이스 카탈로그" selectedId={selectedBase?.id} disabled={!catalogEnabled} onSelect={entry => setSelectedBase(entry)} />}
            {creationKind!=='unique'&&selectedBase && <div className="catalog-apply-box">
              <div className="field-grid compact">{creationKind==='normal'&&<button disabled={!canRenderCatalog || rendering !== ''} onClick={() => void renderDraft('base')}>{rendering === 'base' ? '생성 중...' : '일반 초안 생성'}</button>}</div>
              {creationKind==='rare'&&<><label>아이템 이름<input aria-label="생성 아이템 이름" value={creationName} onChange={e=>setCreationName(e.target.value)} placeholder="선택"/></label><p className="muted">초안을 생성한 뒤 원본 접두·접미·범위 옵션을 편집하세요.</p>
              <button className="primary" disabled={!canRenderCatalog || rendering !== ''} onClick={() => void renderDraft('rare')}>{rendering === 'rare' ? '생성 중...' : '희귀 초안 생성'}</button></>}
            </div>}
          </div>

        {createdText&&<button onClick={()=>{creationEpoch.current++;setCreatedText('');setCreating(false);setCatalogStatus('생성 초안을 취소했습니다.');}}>생성 초안 취소</button>}
        {createdText&&<CreationDraftEditor key={createdVersion} owner={'creation:'+build.id+':'+createdVersion} base={build} text={createdText} itemId={nextItemId()} runtimeId={runtimeId} current={createdSignature===signature} add={(draft,sourceId)=>{if(!applyExpected||createdSignature!==signature||getRuntimeId()!==runtimeId){setCatalogStatus('초안 기준이 변경되어 추가하지 않았습니다.');return;}try{const id=nextItemId();applyExpected(build,{type:'item-copy',sourceXml:draft.xml,sourceId,id},'생성 초안 보유 목록에 추가');setSelectedItemId(id);setCreating(false);setCreatedText('');}catch(reason){setCatalogStatus(String(reason));}}}/> }</>:<>
        {jewelNode!==undefined&&<label>패시브 주얼 · 소켓 {jewelNode}<select aria-label="패시브 주얼 선택" disabled={equipping||!jewelControls?.node?.allocated||!jewelControls?.node?.socket} value={jewelControls?.node?.socket?.itemId??0} onChange={e=>void assignJewel(Number(e.target.value))}>{jewelControls?.node?.socket?.choices.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select>{jewelControls&&!jewelControls.node?.allocated&&<small>패시브 작업에서 이 소켓을 할당하세요.</small>}</label>}{nativeSlot?.parentSlot&&jewelNode===undefined&&<label>원본 장비 주얼<select aria-label="원본 장비 주얼" value={nativeSlot.itemId} disabled={equipping||!nativeSlot.visible||!nativeSlot.enabled} onChange={e=>void equipStored(e.target.value)}>{nativeSlot.choices.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></label>}
        {item?<><ItemSummary item={item}/>{buildId&&buildRevision!==undefined&&buildXml&&applyExpected&&<NativeItemEditor key={item.id} build={{id:buildId,revision:buildRevision,xml:buildXml}} item={item} slot={selectedItemId?undefined:slot} runtimeId={runtimeId} getRuntimeId={getRuntimeId} applyExpected={applyExpected}/>}</>:<div className="empty-small">보유 아이템을 선택하거나 새 아이템을 만드세요.</div>}
        <details className="raw-editor" open={rawOpen} onToggle={e=>setRawOpen(e.currentTarget.open)}><summary>아이템 원문 편집</summary><label>PoB 아이템 텍스트<textarea aria-label="아이템 원문" value={draft} rows={15} spellCheck={false} onChange={e=>setDraft(e.target.value)}/></label><div className="actions"><button disabled={!equippedItem||equipping||!runtimeReady} onClick={()=>void equipStored('0')}>장착 해제</button><button className="primary" disabled={!draft.trim()} onClick={applyRawItem}>적용</button></div></details></>}
        <p className="muted library-note" role="status">{catalogStatus||'일반 옵션 변경은 자동 반영합니다. 생성 초안은 Add to build 전까지 분리됩니다.'}</p>{renderDiagnostics.length>0&&<details><summary>고급 · 생성 진단</summary><pre>{JSON.stringify(renderDiagnostics,null,2)}</pre></details>}
      </div></div>
    </div>
    {deleting.length>0&&<div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-label="아이템 삭제"><h2>아이템 삭제</h2><p>{deleting.length}개 아이템을 모든 세트와 소켓에서 제거합니다. 되돌릴 수 있습니다.</p><div className="actions"><button onClick={()=>setDeleting([])}>취소</button><button onClick={()=>{edit({type:'item-remove',ids:deleting},'보유 아이템 삭제');setDeleting([]);setSelectedItemId(undefined);}}>삭제</button></div></section></div>}
  </section>;
}
