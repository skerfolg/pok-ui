import {useRef,useState} from 'react';
import {Plus,Trash2} from 'lucide-react';
import type {BuildDocument,BuildEdit,Calculation,ParsedBuild,SkillGroup} from '../../shared/contracts';
import type {PobInspection} from '../../shared/pob-inspection';
import type {CatalogEntry} from '../../shared/game-data';
import {parseBuild} from '../../shared/pob-document';
import {useSkillDraft} from '../state/useSkillDraft';
import {NumberField} from '../components/NumberField';
import {NativeSkillGroups} from '../components/NativeSkillGroups';
import {NativeSkillText} from '../components/NativeSkillText';
import {CatalogPicker} from './CatalogPicker';
import {PobSkillOptions} from './PobSkillOptions';
interface Props {owner:string;build:BuildDocument;getBuild:(id:string)=>BuildDocument|undefined;getRuntimeId:()=>string|undefined;set:ParsedBuild['skillSets'][number];group:SkillGroup;parsed:ParsedBuild;edit:(edit:BuildEdit,label:string)=>void;runtimeId?:string;catalogEnabled:boolean;inspection?:PobInspection;inspectionCurrent:boolean;inspectionPending:boolean;select:(id:string)=>void;applyExpected:(snapshot:BuildDocument,edit:BuildEdit,label:string)=>BuildDocument;calculated:(build:BuildDocument,result:Calculation)=>boolean}
export function SkillGroupEditor({owner,build,getBuild,getRuntimeId,set,group,parsed,edit,runtimeId,catalogEnabled,inspection,inspectionCurrent,inspectionPending,select,applyExpected,calculated}:Props){
  const current=useRef({build,set,group,applyExpected,getBuild,getRuntimeId});current.current={build,set,group,applyExpected,getBuild,getRuntimeId};
  const {draft,change:setDraft,flush,error:draftError,dirty,discard,number,numberText}=useSkillDraft(owner,group,(value,base)=>{
    const c=current.current;if(runtimeId&&c.getRuntimeId()!==runtimeId)throw new Error('PoB 출처가 변경되어 이전 초안을 유지했습니다.');const snapshot=c.getBuild(c.build.id);if(!snapshot)throw new Error('원본 빌드가 없어 초안을 유지했습니다.');
    const active=parseBuild(snapshot.xml).skillSets.find(s=>s.id===c.set.id)?.groups.find(g=>g.id===base.id);
    if(!active||JSON.stringify(active)!==JSON.stringify(base))throw new Error('원본 그룹이 변경되어 초안을 유지했습니다.');
    const next=c.applyExpected(snapshot,{type:'skill-group',setId:c.set.id,groupId:base.id,group:value},'스킬 그룹 편집');
    return parseBuild(next.xml).skillSets.find(s=>s.id===c.set.id)!.groups.find(g=>g.id===base.id)!;
  });
  const [catalogNote,setCatalogNote]=useState('');
  function addCatalogGem(entry: CatalogEntry) {
    if (!draft || !catalogEnabled) {
      if (!catalogEnabled) setCatalogNote('카탈로그와 독립 PoB의 출처·지원 범위를 확인해 주세요.');
      return;
    }
    const naturalMaxLevel = Number(entry.raw.naturalMaxLevel);
    const level = Number.isFinite(naturalMaxLevel) && naturalMaxLevel >= 1 ? naturalMaxLevel : 1;
    setDraft({ ...draft, gems: [...draft.gems, {
      name: entry.name,
      level,
      quality: 0,
      enabled: true,
      attributes: { nameSpec: entry.name, ...(entry.gemId ? { gemId: entry.gemId } : {}) },
    }] });
    setCatalogNote(`${entry.name} 레벨 ${level}로 추가`);
  }

  return <form className="panel scroll" onSubmit={e=>{e.preventDefault();flush();}} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))flush();}}><header className="panel-heading"><h2>선택한 그룹</h2><div className="actions"><button type="button" onClick={() => edit({ type: 'main-skill', index: set.groups.indexOf(group) + 1 }, '주력 스킬 변경')}>주력으로</button></div></header><div className="panel-body"><NativeSkillText build={build} setId={set.id} groupId={group.id} runtimeId={runtimeId} enabled={catalogEnabled&&!dirty} select={select} applyExpected={applyExpected} calculated={calculated}/>{draftError&&<p className="warning" role="alert">{draftError}<button type="button" onClick={discard}>초안 취소</button></p>}<NativeSkillGroups select={select} build={build} setId={set.id} groupId={group.id} runtimeId={runtimeId} enabled={catalogEnabled&&JSON.stringify(draft)===JSON.stringify(group)} applyExpected={applyExpected} calculated={calculated}/><div className="field-grid"><label>그룹 이름<input value={draft.label} onChange={e => setDraft({ ...draft, label: e.target.value })} /></label><label>장착 위치<input value={draft.slot} onChange={e => setDraft({ ...draft, slot: e.target.value })} placeholder="예: Weapon 1" /></label></div><div className="actions"><label className="check"><input type="checkbox" checked={draft.enabled} onChange={e => setDraft({ ...draft, enabled: e.target.checked })} />그룹 활성</label><label className="check"><input type="checkbox" checked={draft.includeInFullDPS} onChange={e => setDraft({ ...draft, includeInFullDPS: e.target.checked })} />전체 DPS 포함</label></div>
    <div className="gem-table"><div className="gem-row table-label"><span>활성</span><span>젬 이름</span><span>레벨</span><span>퀄리티</span><span /></div>{draft.gems.map((gem, index) => <div key={index} className="gem-row"><input aria-label={`젬 ${index + 1} 활성`} type="checkbox" checked={gem.enabled} onChange={e => setDraft({ ...draft, gems: draft.gems.map((g, i) => i === index ? { ...g, enabled: e.target.checked } : g) })} /><span className="gem-name-field"><input aria-invalid={!gem.name.trim()} aria-label={`젬 ${index + 1} 이름`} value={gem.name} onChange={e => setDraft({ ...draft, gems: draft.gems.map((g, i) => i === index ? { ...g, name: e.target.value } : g) })} />{!gem.name.trim()&&<small className="warning" role="status">젬 이름을 선택하거나 입력하세요.</small>}</span><NumberField integer label={`젬 ${index + 1} 레벨`} value={gem.level} textValue={numberText(index,'level')} onDraftChange={text=>number(index,'level',text)} min={1} onCommit={level=>setDraft(current=>current?{...current,gems:current.gems.map((g,i)=>i===index?{...g,level}:g)}:current)}/><NumberField integer label={`젬 ${index + 1} 퀄리티`} value={gem.quality} textValue={numberText(index,'quality')} onDraftChange={text=>number(index,'quality',text)} min={0} onCommit={quality=>setDraft(current=>current?{...current,gems:current.gems.map((g,i)=>i===index?{...g,quality}:g)}:current)}/><button type="button" aria-label={`젬 ${index + 1} 삭제`} onClick={() => setDraft({ ...draft, gems: draft.gems.filter((_, i) => i !== index) })}><Trash2 size={14} /></button></div>)}</div>
    <PobSkillOptions options={inspection?.skills.find(s=>s.groupId===group.id)} diagnostics={inspection?.diagnostics.filter(d=>d.field===`skill-group:${group.id}`)} group={group} setId={set.id} edit={edit} disabled={!inspectionCurrent||JSON.stringify(draft)!==JSON.stringify(group)} pending={inspectionPending}/>
    <CatalogPicker type="gem" title="젬 카탈로그" disabled={!catalogEnabled} onSelect={addCatalogGem} />
    <div className="actions justify-between"><button type="button" onClick={() => setDraft({ ...draft, gems: [...draft.gems, { name: '', level: 1, quality: 0, enabled: true, attributes: {} }] })}><Plus size={14} />원문 젬 추가</button><span className="muted" role="status">유효한 변경은 자동 반영</span></div><p className="muted note">{catalogNote || (catalogEnabled ? '카탈로그 젬은 PoB 내부 젬 ID를 보존합니다. 레벨 정보가 없는 항목은 레벨 1로 시작합니다.' : '카탈로그 출처/지원 범위를 확인하는 동안 카탈로그 젬 적용이 비활성화됩니다.')}</p></div></form>;
}
