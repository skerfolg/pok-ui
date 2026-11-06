import {useRetainedPresentation} from '../state/useRetainedPresentation';
import {EquipmentItemPicker} from './EquipmentItemPicker';
import {ItemArtwork} from '../components/ItemArtwork';
import {Sword,Shield,Shirt,Crown,Hand,Footprints,Circle,Link2,FlaskConical,Gem} from 'lucide-react';
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
  const [slotPickerError,setSlotPickerError]=useState('');
  const [slotPickerOpen,setSlotPickerOpen]=useState(false);
  const slotPickerTrigger=useRef<HTMLElement|null>(null);
  useEffect(()=>{setSlotPickerOpen(false);},[build.id,runtimeId]);
  const [searchActionsTarget,setSearchActionsTarget]=useState<HTMLDivElement|null>(null);
  const [showAllJewels,setShowAllJewels]=useState(false);
  const [jewelTree,setJewelTree]=useState<{xml:string;scope:string;data:PobTreeResult}>();
  const jewelScope=JSON.stringify([build.id,runtimeId,parsed.trees.find(t=>t.active)?.id,parsed.trees.find(t=>t.active)?.version]);
  const [jewelNode,setJewelNode]=useState<number>();
  const [jewelControls,setJewelControls]=useState<PobTreeResult>();
  const jewelPresentation=useRetainedPresentation(JSON.stringify([jewelScope,jewelNode]),jewelControls?.buildId===build.id&&jewelControls.runtimeId===runtimeId&&jewelControls.node?.id===jewelNode&&jewelControls.revision===build.revision?jewelControls:undefined);
  const jewelGeneration=useRef(0);
  const [equipmentTab,setEquipmentTab]=useSessionDraft<'gear'|'jewels'>('equipment:'+build.id,'equipmentTab','gear');
  const [selectedItemId,setSelectedItemId]=useSessionDraft<string|undefined>('equipment:'+build.id,'selectedItemId',undefined);
  const [creating,setCreating]=useSessionDraft('equipment:'+build.id,'creating',false);
  const [creationSlot,setCreationSlot]=useSessionDraft<string|undefined>('equipment:'+build.id,'creationSlot',undefined);
  const [creationStep,setCreationStep]=useSessionDraft<'choose'|'edit'>('equipment:'+build.id,'creationStep','choose');
  const [creationCategory,setCreationCategory]=useState<string>();
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
  const [catalogStatus, setCatalogStatus] = useState('');
  const [selectedUnique, setSelectedUnique] = useSessionDraft<CatalogEntry | undefined>('equipment:'+build.id,'selectedUnique',undefined);
  const [selectedBase, setSelectedBase] = useSessionDraft<CatalogEntry | undefined>('equipment:'+build.id,'selectedBase',undefined);
  const [uniqueVariant, setUniqueVariant] = useSessionDraft('equipment:'+build.id,'uniqueVariant','');
  const [rendering, setRendering] = useState<'base' | 'unique' | 'rare' | ''>('');
  const [equipping,setEquipping]=useState(false);
  const equippedItem=parsed.items.find(i=>i.id===set?.slots[slot]);
  const item=selectedItemId?parsed.items.find(i=>i.id===selectedItemId):equippedItem;
  const native=useEquipmentState(buildId,buildRevision,buildXml,runtimeId);
  const nativeSlot=native.layout?.slots.find(s=>s.name===slot);

  const previousUnique=useRef(selectedUnique?.id);
  useEffect(()=>{if(previousUnique.current!==selectedUnique?.id){previousUnique.current=selectedUnique?.id;setUniqueVariant('');}},[selectedUnique?.id]);
  useEffect(()=>{setCatalogStatus('');},[slot,buildId]);

  useEffect(()=>{if(!focus)return;if(focus?.slot)setSlot(focus.slot);if(focus?.itemId)setSelectedItemId(focus.itemId);setCreating(false);},[focus]);
  useEffect(()=>{let alive=true;if(!runtimeId||!buildId||buildRevision===undefined||!buildXml)return;void readWorkspaceCharacter({id:buildId,revision:buildRevision,xml:buildXml},runtimeId).then(data=>{if(alive)setJewelTree({xml:buildXml,scope:jewelScope,data});}).catch(reason=>{if(alive)setCatalogStatus(String(reason));});return()=>{alive=false;};},[equipmentTab,buildId,buildRevision,buildXml,runtimeId,jewelScope]);
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
    setCatalogStatus('선택한 카탈로그 항목을 아이템 원문으로 생성하는 중...');
    try {
      const rendered = await api.renderPobItem(request);
      const current = renderContext.current;
      if (epoch!==creationEpoch.current||!current.creating||current.signature!==submitted.signature||!current.runtimeReady || current.buildId !== submitted.buildId || current.buildRevision !== submitted.buildRevision || current.setId !== submitted.setId || current.slot !== submitted.slot) {
        setCatalogStatus('요청 중 빌드, 슬롯 또는 PoB 런타임 상태가 바뀌어 장착을 취소했습니다.');
        return;
      }
      if (!rendered.ok || !rendered.text) {
        setCatalogStatus(rendered.reason || '이 카탈로그 항목은 아직 아이템 원문으로 생성할 수 없습니다.');
        return;
      }
      setCreationStep('edit');setCreatedText(rendered.text);setCreatedSignature(submitted.signature);setCreatedVersion(value=>value+1);
      setCatalogStatus(`${entry.name} 생성 초안 · 아직 빌드에 추가되지 않았습니다.`);
    } catch (error) {
      setCatalogStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setRendering('');
    }
  }

  async function equipStored(itemId:string){
    setSlotPickerError('');
    if(equipping||!runtimeReady||!runtimeId||!buildId||buildRevision===undefined||!buildXml||!applyExpected)return;
    const snapshot={id:buildId,revision:buildRevision,xml:buildXml},submitted={...renderContext.current};setEquipping(true);setCatalogStatus('장착 중…');
    const active=()=>{const c=renderContext.current;return c.runtimeReady&&c.buildId===submitted.buildId&&c.buildRevision===submitted.buildRevision&&c.setId===submitted.setId&&c.slot===submitted.slot;};
    try{
      const [result,hash]=await Promise.all([api.equipment({buildId:snapshot.id,revision:snapshot.revision,xml:snapshot.xml,itemId,runtimeId,slot:submitted.slot,action:'equip'}),hashBuildXml(snapshot.xml)]);
      if(!active())return;
      if(result.buildId!==snapshot.id||result.revision!==snapshot.revision||result.xmlSha256!==hash||result.runtimeId!==runtimeId)throw new Error('장착 연산의 입력·버전이 현재 문서와 다릅니다.');
      applyExpected(snapshot,{type:'equipment-native-patch',setId:submitted.setId!,patch:result.patch},`${names[submitted.slot]??submitted.slot} 원본 장착 연산`);
      setCatalogStatus('장착 변경을 반영했습니다.');
      return true;
    }catch(reason){if(active()){setCatalogStatus(String(reason));setSlotPickerError(String(reason));}}finally{setEquipping(false);}
  }
  async function switchWeapon(weaponSet:number){
    if(equipping||!native.data||!buildId||buildRevision===undefined||!buildXml||!applyExpected||!set)return;
    const snapshot={id:buildId,revision:buildRevision,xml:buildXml};setEquipping(true);setCatalogStatus('원본 무기 세트 전환 중…');
    try{const [result,hash]=await Promise.all([api.equipment({buildId,revision:buildRevision,xml:buildXml,runtimeId,action:'weapon',weaponSet}),hashBuildXml(buildXml)]);
      if(result.buildId!==snapshot.id||result.revision!==snapshot.revision||result.xmlSha256!==hash||result.runtimeId!==runtimeId)throw new Error('무기 전환 연산의 입력/버전이 다릅니다.');
      applyExpected(snapshot,{type:'equipment-native-patch',setId:set.id,patch:result.patch},`원본 활성 무기 세트 ${weaponSet} 전환`);setCatalogStatus(`무기 ${weaponSet===1?'I':'II'}로 전환했습니다.`);
    }catch(reason){setCatalogStatus(String(reason));}finally{setEquipping(false);}
  }

  const second=native.layout?.useSecondWeaponSet??set.useSecondWeaponSet;
  const visibleSlots=(native.layout?native.layout.slots.filter(s=>s.visible&&!s.parentSlot).map(s=>s.name):slots).filter(key=>!key.includes('Swap')||second).filter(key=>!second||!['Weapon 1','Weapon 2'].includes(key));
  const jewelLayout=jewelTree&&jewelTree.scope===jewelScope&&jewelTree.data.buildId===buildId&&jewelTree.data.runtimeId===runtimeId?jewelTree.data:undefined;
  const storedJewels=new Map(parsed.trees.find(t=>t.active)?.sockets.map(s=>[s.nodeId,s.itemId])||[]);
  const jewelRows=jewelLayout?.jewelSockets?.filter(s=>showAllJewels||s.allocated||s.itemId!==0||Number(storedJewels.get(String(s.nodeId))||0)!==0).map(s=>({nodeId:String(s.nodeId),itemId:storedJewels.get(String(s.nodeId))??String(s.itemId),allocated:s.allocated}))||[];
  function gearSocket(s:NonNullable<typeof native.data>['slots'][number]){const value=parsed.items.find(item=>item.id===s.itemId),label=`${names[s.parentSlot!]||s.parentSlot} · ${s.label}`;return <HoverCard key={s.name} label={`${label} 옵션`} content={value?<ItemHover build={build} item={value} runtimeId={runtimeId} slot={s.name}/>:<p>{label} · 비어 있음</p>}><button aria-label={`${label} 슬롯`} aria-pressed={slot===s.name} onClick={event=>chooseSlot(s.name,event.currentTarget)}>{label}{value&&<span>{value.name}</span>}{!s.visible&&<small>비활성</small>}</button></HoverCard>;}

  function chooseSlot(key:string,anchor:HTMLElement){setJewelNode(undefined);setSlot(key);setSelectedItemId(undefined);setCreating(false);slotPickerTrigger.current=anchor;setSlotPickerError('');setSlotPickerOpen(true);}
  function renderGear(key:string,collection=false){
    const value=parsed.items.find(item=>item.id===set!.slots[key]),descriptor=native.layout?.slots.find(slot=>slot.name===key);if(descriptor?.parentSlot)return null;
    const label=names[key]||descriptor?.label||key,Icon=key.startsWith('Weapon 1')?Sword:key.startsWith('Weapon 2')?Shield:key==='Helmet'?Crown:key==='Body Armour'?Shirt:key==='Gloves'?Hand:key==='Boots'?Footprints:key==='Belt'?Link2:key.startsWith('Flask')?FlaskConical:key.startsWith('Charm')?Gem:Circle;
    const fallback=<span className="slot-kind"><Icon aria-hidden="true" strokeWidth={1.3}/></span>;
    return <div className={collection?'equipment-thumbnail':'equipment-position'} data-slot={key.replace(' Swap','')} key={key}><HoverCard dataSlot={key.replace(' Swap','')} label={`${label} 옵션`} content={value?<ItemHover build={build} item={value} runtimeId={runtimeId} slot={key}/>:<p>{label} · 비어 있음</p>}><button className="gear-slot" data-filled={Boolean(value)} data-rarity={value?.rarity.toLowerCase()} data-corrupted={value?/^Corrupted$/m.test(value.text):false} data-slot={key.replace(' Swap','')} aria-label={`${label} 슬롯`} aria-description={value?.name} aria-pressed={slot===key&&(!selectedItemId||set!.slots[key]===selectedItemId)} onClick={event=>chooseSlot(key,event.currentTarget)}>{value?<ItemArtwork item={value} fallback={fallback}/>:fallback}</button></HoverCard></div>;
  }
  function renderJewel(socket:typeof jewelRows[number]){const value=parsed.items.find(item=>item.id===socket.itemId);if(!value)return null;return <div className="equipment-thumbnail" key={socket.nodeId}><HoverCard label={`소켓 ${socket.nodeId} 위치와 옵션`} content={<>{runtimeId&&<JewelLocation runtimeId={runtimeId} version={parsed.trees.find(tree=>tree.active)!.version} nodeId={Number(socket.nodeId)}/>}<ItemHover build={build} item={value} runtimeId={runtimeId} nodeId={Number(socket.nodeId)}/></>}><button className="gear-slot" data-filled="true" data-rarity={value.rarity.toLowerCase()} data-corrupted={/^Corrupted$/m.test(value.text)} aria-label={`${value.name} · 소켓 ${socket.nodeId}`} aria-pressed={jewelNode===Number(socket.nodeId)} onClick={()=>{setJewelNode(Number(socket.nodeId));setSelectedItemId(value.id);setCreating(false);}}><ItemArtwork item={value} fallback={<span className="slot-kind"><Gem/></span>}/></button></HoverCard></div>;}
  function weaponSwitch(secondary=false){return <div className="weapon-switch"><button aria-label={secondary?'보조 무기 I 활성':'무기 I 활성'} aria-pressed={!second} disabled={!native.data||equipping||!second} onClick={()=>void switchWeapon(1)}>I</button><button aria-label={secondary?'보조 무기 II 활성':'무기 II 활성'} aria-pressed={Boolean(second)} disabled={!native.data||equipping||second} onClick={()=>void switchWeapon(2)}>II</button></div>;}
  const parts=visibleSlots.filter(key=>/^(Arm|Leg) \d+$/.test(key)),charms=visibleSlots.filter(key=>key.startsWith('Charm '));
  const mainSlots=new Set(['Weapon 1','Weapon 2','Helmet','Body Armour','Amulet','Ring 1','Ring 2','Gloves','Boots','Belt','Flask 1','Flask 2']);
  const otherSlots=visibleSlots.filter(key=>!mainSlots.has(key.replace(' Swap',''))&&!parts.includes(key)&&!charms.includes(key)&&!native.layout?.slots.find(slot=>slot.name===key)?.parentSlot);
  return <section className="feature fill equipment-workspace" onPaste={event=>{if(event.defaultPrevented||item||creating)return;const text=event.clipboardData.getData('text/plain'),target=event.target as HTMLElement;if(target.closest('input,textarea,select,[contenteditable=true]')&&!(target.closest('.equipment-picker')&&/(^|\n)Rarity:/i.test(text)))return;if(!text.trim()||!applyExpected)return;event.preventDefault();try{applyExpected(build,{type:'item-equip',setId:set.id,slot,id:nextItemId(),text},'아이템 붙여넣기');setSlotPickerOpen(false);}catch(reason){setCatalogStatus(String(reason));}}}>
    <div className="page-heading"><h1>장비</h1><span className="muted">장착 · 보유 목록 · 아이템 생성</span><details className="equipment-set-management"><summary>비활성 세트 관리</summary><SetControls kind="items" sets={parsed.itemSets} edit={edit}/></details></div>
    <div className="equipment-workbench">
      <div className="equipment-left"><div className="panel equipment-slots"><header className="panel-heading"><div className="actions"><button aria-pressed={equipmentTab==='gear'} onClick={()=>setEquipmentTab('gear')}>장비</button><button aria-pressed={equipmentTab==='jewels'} onClick={()=>setEquipmentTab('jewels')}>패시브 주얼</button></div></header>
        {equipmentTab==='gear'?<div className="equipment-overview scroll"><div className="equipment-figure"><div className="weapon-switches">{weaponSwitch()}{weaponSwitch(true)}</div><div className="gear-slots">{visibleSlots.filter(key=>mainSlots.has(key.replace(' Swap',''))).map(key=>renderGear(key))}<div className="charm-slots">{charms.map(key=>renderGear(key))}</div></div></div>
        {parts.length>0&&<section className="equipment-collection" aria-label="바알 신체 부위"><h3>바알 신체 부위</h3><div className="equipment-thumbnails">{parts.map(key=>renderGear(key,true))}</div></section>}
        <section className="equipment-collection" aria-label="장착 주얼"><h3>장착 주얼</h3><div className="equipment-thumbnails">{jewelRows.map(renderJewel)}</div>{!jewelRows.some(socket=>socket.itemId!=='0')&&<p className="muted note">장착된 패시브 주얼이 없습니다.</p>}</section>
        {otherSlots.length>0&&<section className="equipment-collection"><h3>추가 장착 부위</h3><div className="equipment-thumbnails">{otherSlots.map(key=>renderGear(key,true))}</div></section>}
        </div>:<div className="scroll panel-body"><div className="actions"><p className="muted">활성 패시브 트리의 주얼 소켓</p><label className="check"><input type="checkbox" checked={showAllJewels} onChange={e=>setShowAllJewels(e.target.checked)}/>미할당 소켓도 표시</label></div>{jewelRows.map(socket=>{const jewel=parsed.items.find(i=>i.id===socket.itemId);return <HoverCard key={socket.nodeId} label={`소켓 ${socket.nodeId} 위치와 옵션`} content={<>{runtimeId&&<JewelLocation runtimeId={runtimeId} version={parsed.trees.find(t=>t.active)!.version} nodeId={Number(socket.nodeId)}/>}{jewel?<ItemHover build={build} item={jewel} runtimeId={runtimeId} nodeId={Number(socket.nodeId)}/>:<pre>빈 주얼 소켓</pre>}</>}><button className="jewel-socket-row" onClick={()=>{setJewelNode(Number(socket.nodeId));setSelectedItemId(jewel?.id);setCreating(false);}}>소켓 {socket.nodeId}<span>{jewel?.name||'비어 있음'}</span></button></HoverCard>;})}{!jewelLayout&&<p className="muted" role="status">소켓 확인 중…</p>}</div>}
        {equipmentTab==='gear'&&<><div className="gear-sockets">{native.layout?.slots.filter(s=>s.parentSlot&&(s.visible||s.itemId!=='0')).map(gearSocket)}</div></>}
      </div>
      <div className="panel item-library"><header className="panel-heading"><h2>보유 아이템 {parsed.items.length}</h2></header><div className="library-body"><input type="search" aria-label="저장 아이템 검색" placeholder="이름·옵션 검색" value={query} onChange={e=>setQuery(e.target.value)}/><div className="actions inventory-tools"><button aria-pressed={sortItems} onClick={()=>setSortItems(v=>!v)}>Sort</button><button disabled={!parsed.items.length} onClick={()=>{const used=new Set([...parsed.itemSets.flatMap(s=>Object.values(s.slots)),...parsed.trees.flatMap(t=>t.sockets.map(s=>s.itemId))]);setDeleting(parsed.items.filter(i=>!used.has(i.id)).map(i=>i.id));}}>미사용 삭제</button><button disabled={!parsed.items.length} onClick={()=>setDeleting(parsed.items.map(i=>i.id))}>전체 삭제</button><button disabled={!item} onClick={()=>setDeleting(item?[item.id]:[])}>삭제</button></div><div className="scroll item-list">{[...parsed.items].sort((a,b)=>sortItems?a.name.localeCompare(b.name):0).filter(i=>i.text.toLowerCase().includes(query.toLowerCase())).map(i=><div className="library-row" key={i.id}><HoverCard label={`${i.name} 옵션`} content={<ItemHover build={build} item={i} runtimeId={runtimeId}/>}><button className="inventory-item" aria-pressed={item?.id===i.id} onClick={()=>{setJewelNode(undefined);setSelectedItemId(i.id);setCreating(false);}}><span className="inventory-item-text"><span className={`rarity-${i.rarity.toLowerCase()}`}>{i.name}</span><small>{i.base}</small></span></button></HoverCard></div>)}</div></div></div></div>
      <div className="panel item-detail"><header className="panel-heading"><h2>아이템 생성 · 옵션</h2><div className="actions item-detail-actions"><div ref={setSearchActionsTarget}/><button className="primary" onClick={()=>{creationEpoch.current++;setCreationCategory(({'Ring 1':'Ring','Ring 2':'Ring','Body Armour':'Body Armour',Helmet:'Helmet',Gloves:'Gloves',Boots:'Boots',Belt:'Belt',Amulet:'Amulet'} as Record<string,string>)[slot]);if(creationSlot!==slot){setSelectedBase(undefined);setSelectedUnique(undefined);setCreationSlot(slot);}setJewelNode(undefined);setCreationStep(createdText&&creationSlot===slot?'edit':'choose');setCreating(true);setCatalogStatus('');}}>Create Item</button></div></header><div className="scroll panel-body" data-creation-step={creating?creationStep:undefined}>
        {native.pending&&!native.layout&&<p className="muted" role="status">장비 확인 중…</p>}{native.error&&<p className="warning">{native.error}</p>}{native.data?.diagnostics.map((d,i)=><p className="warning" key={i}>{d.field}: {d.message}</p>)}
        {creating?<><div className="creation-choice" hidden={creationStep!=='choose'}><div className="creation-toolbar"><label>희귀도<select aria-label="생성 아이템 희귀도" value={creationKind} onChange={e=>setCreationKind(e.target.value as 'normal'|'rare'|'unique')}><option value="normal">일반 · 베이스 선택</option><option value="rare">희귀 · 베이스 선택</option><option value="unique">고유 · 검색</option></select></label>{creationKind==='rare'&&<label className="creation-name">아이템 이름<input aria-label="생성 아이템 이름" value={creationName} onChange={e=>setCreationName(e.target.value)} placeholder="선택"/></label>}{creationKind==='unique'&&selectedUnique&&<label>변형<select aria-label="유니크 변형" value={uniqueVariant} onChange={e=>setUniqueVariant(e.target.value)}><option value="">{selectedUnique.variants?.length?'변형 선택':'기본'}</option>{selectedUnique.variants?.map(v=><option key={v.id} value={v.id}>{v.name||v.id}</option>)}</select></label>}<button className="primary" disabled={!canRenderCatalog||Boolean(rendering)||(creationKind==='unique'?!selectedUnique||Boolean(selectedUnique.variants?.length&&!uniqueVariant):!selectedBase)} onClick={()=>void renderDraft(creationKind==='normal'?'base':creationKind)}>{rendering?'생성 중…':'생성'}</button></div><div className="catalog-builder">{creationKind==='unique'?<CatalogPicker hideDetail initialCategory={creationCategory} type="unique" title="유니크 카탈로그" selectedId={selectedUnique?.id} disabled={!catalogEnabled} onSelect={setSelectedUnique}/>:<CatalogPicker hideDetail initialCategory={creationCategory} type="base" title="베이스 카탈로그" selectedId={selectedBase?.id} disabled={!catalogEnabled} onSelect={setSelectedBase}/>}</div></div>{creationStep==='edit'&&<div className="creation-edit-actions"><button className="creation-back" onClick={()=>setCreationStep('choose')}>← 뒤로 · 베이스 선택</button><button aria-label="생성 초안 취소" onClick={()=>{creationEpoch.current++;setCreatedText('');setCreationStep('choose');setCatalogStatus('');}}>취소</button></div>}
        {creationStep==='edit'&&createdText&&<CreationDraftEditor key={createdVersion} owner={'creation:'+build.id+':'+createdVersion} base={build} text={createdText} itemId={nextItemId()} runtimeId={runtimeId} current={createdSignature===signature} add={(draft,sourceId)=>{if(!applyExpected||createdSignature!==signature||getRuntimeId()!==runtimeId){setCatalogStatus('초안 기준이 변경되어 추가하지 않았습니다.');return;}try{const id=nextItemId();applyExpected(build,{type:'item-copy',sourceXml:draft.xml,sourceId,id},'생성 초안 보유 목록에 추가');setSelectedItemId(id);setCreating(false);setCreatedText('');}catch(reason){setCatalogStatus(String(reason));}}}/> }</>:<>
        {jewelNode!==undefined&&<label>패시브 주얼 · 소켓 {jewelNode}<select aria-label="패시브 주얼 선택" disabled={equipping||!jewelControls?.node?.allocated||!jewelControls?.node?.socket} value={jewelPresentation?.node?.socket?.itemId??0} onChange={e=>void assignJewel(Number(e.target.value))}>{jewelPresentation?.node?.socket?.choices.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select>{jewelControls&&!jewelControls.node?.allocated&&<small>패시브 작업에서 이 소켓을 할당하세요.</small>}</label>}
        {item?<>{buildId&&buildRevision!==undefined&&buildXml&&applyExpected&&<NativeItemEditor searchActionsTarget={searchActionsTarget} key={item.id} build={{id:buildId,revision:buildRevision,xml:buildXml}} item={item} slot={selectedItemId?undefined:slot} runtimeId={runtimeId} getRuntimeId={getRuntimeId} applyExpected={applyExpected}/>}</>:null}
        {!item&&<div className="empty-item-slot" tabIndex={0} aria-label="빈 아이템 슬롯" onPaste={event=>{const text=event.clipboardData.getData('text/plain');if(!text.trim()||!applyExpected)return;event.preventDefault();try{applyExpected(build,{type:'item-equip',setId:set.id,slot,id:nextItemId(),text},'아이템 붙여넣기');setSlotPickerOpen(false);}catch(reason){setCatalogStatus(String(reason));}}}><span>{names[slot]||slot}</span><small>아이템을 복사해 붙여넣으세요</small></div>}
</>}
        {catalogStatus&&<p className="muted library-note" role="status">{catalogStatus}</p>}
      </div></div>
    </div>
    {slotPickerOpen&&<EquipmentItemPicker anchor={slotPickerTrigger.current} build={build} runtimeId={runtimeId} slot={slot} key={slot} label={names[slot]||nativeSlot?.label||slot} items={parsed.items} choices={nativeSlot?.choices||[]} currentId={nativeSlot?.itemId||set.slots[slot]||'0'} pending={equipping||native.pending} enabled={runtimeReady&&Boolean(native.data&&nativeSlot?.enabled)} error={slotPickerError||native.error} close={()=>{setSlotPickerOpen(false);slotPickerTrigger.current?.focus();}} select={async id=>{if(id===(nativeSlot?.itemId||'0')){setSlotPickerOpen(false);slotPickerTrigger.current?.focus();return;}if(await equipStored(id)){setSelectedItemId(undefined);setSlotPickerOpen(false);slotPickerTrigger.current?.focus();}}}/>}
    {deleting.length>0&&<div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-label="아이템 삭제"><h2>아이템 삭제</h2><p>{deleting.length}개 아이템을 모든 세트와 소켓에서 제거합니다. 되돌릴 수 있습니다.</p><div className="actions"><button onClick={()=>setDeleting([])}>취소</button><button onClick={()=>{edit({type:'item-remove',ids:deleting},'보유 아이템 삭제');setDeleting([]);setSelectedItemId(undefined);}}>삭제</button></div></section></div>}
  </section>;
}
