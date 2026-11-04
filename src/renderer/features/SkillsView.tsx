import {SkillGroupEditor} from './SkillGroupEditor';
import { SetControls } from '../components/SetControls';
import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import type { BuildDocument, BuildEdit, Calculation, ParsedBuild } from '../../shared/contracts';
import type {PobInspection} from '../../shared/pob-inspection';

export function SkillsView({ focusGroupId,build,getBuild,getRuntimeId,runtimeId,applyExpected,calculated,parsed, edit, catalogEnabled = true,inspection,inspectionCurrent=false,inspectionPending=false,inspectionError='' }: {focusGroupId?:string;build:BuildDocument;getBuild:(id:string)=>BuildDocument|undefined;getRuntimeId:()=>string|undefined;runtimeId?:string;applyExpected:(snapshot:BuildDocument,edit:BuildEdit,label:string)=>BuildDocument;calculated:(build:BuildDocument,result:Calculation)=>boolean; parsed: ParsedBuild; edit: (edit: BuildEdit, label: string) => void; catalogEnabled?: boolean;inspection?:PobInspection;inspectionCurrent?:boolean;inspectionPending?:boolean;inspectionError?:string }) {
  const set = parsed.skillSets.find(s => s.active) ?? parsed.skillSets[0];
  const [activeId, setActiveId] = useState('');
  const group = set?.groups.find(g => g.id === activeId) ?? set?.groups[Math.max(0, parsed.mainSocketGroup - 1)] ?? set?.groups[0];
  useEffect(()=>{if(focusGroupId)setActiveId(focusGroupId);},[focusGroupId]);
  if (!set) return <section className="feature scroll"><div className="page-heading"><h1>스킬</h1><SetControls kind="skills" sets={parsed.skillSets} edit={edit}/></div><p>스킬 세트를 만들어 그룹을 추가하세요.</p></section>;


  return <section className="feature fill"><div className="page-heading"><h1>스킬</h1><SetControls kind="skills" sets={parsed.skillSets} edit={edit} /><span className="muted">{set.groups.length}그룹 · {set.groups.reduce((n, g) => n + g.gems.length, 0)}젬</span></div>
    {inspectionError&&<p className="warning" role="status">{inspectionError}</p>}<div className="skills-layout"><div className="panel"><header className="panel-heading"><h2>스킬 그룹</h2><button aria-label="스킬 그룹 추가" onClick={() => edit({ type: 'skill-add', setId: set.id }, '스킬 그룹 추가')}><Plus size={14} /></button></header><div className="scroll">{set.groups.map((g, index) => <button key={g.id} className="group-row" aria-pressed={g.id === group?.id} onClick={() => setActiveId(g.id)}><span>{g.label || g.gems[0]?.name || '빈 그룹'}</span><small>{index + 1 === parsed.mainSocketGroup ? '주력 · ' : ''}{g.enabled ? '활성' : '비활성'} · {g.gems.length}젬 {g.slot}</small></button>)}</div></div>
    {group?<SkillGroupEditor key={JSON.stringify([build.id,set.id,group.id,runtimeId])} owner={JSON.stringify([build.id,set.id,group.id,runtimeId])} build={build} getBuild={getBuild} getRuntimeId={getRuntimeId} set={set} group={group} parsed={parsed} edit={edit} runtimeId={runtimeId} catalogEnabled={catalogEnabled} inspection={inspection} inspectionCurrent={inspectionCurrent} inspectionPending={inspectionPending} select={setActiveId} applyExpected={applyExpected} calculated={calculated}/>:<div className="empty-small">그룹을 추가하세요.</div>}</div></section>;
}
