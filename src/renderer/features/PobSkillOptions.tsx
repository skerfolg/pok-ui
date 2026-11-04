import type {BuildEdit,SkillGroup} from '../../shared/contracts';
import type {PobSkillOptions as Options} from '../../shared/pob-inspection';
export function PobSkillOptions({options,group,setId,edit,disabled,pending,diagnostics=[],calcs=false}:{options?:Options;group:SkillGroup;setId:string;edit:(edit:BuildEdit,label:string)=>void;disabled:boolean;pending:boolean;diagnostics?:{message:string}[];calcs?:boolean}){
  if(!options)return <p className="muted note">{pending?'원본 PoB의 스킬 모드·단계 선택지를 읽는 중…':'그룹을 적용하면 원본 스킬 선택지를 확인할 수 있습니다.'}</p>;
  const gem=options.sourceGemIndex;
  const partial=diagnostics.length>0;
  function value(key:'skillPart'|'skillStageCount'|'skillMineCount',value:string){if(gem)edit({type:'gem-option',setId,groupId:group.id,gemIndex:gem,key:calcs?`${key}Calcs` as 'skillPartCalcs'|'skillStageCountCalcs'|'skillMineCountCalcs':key,value:value.trim()?Number(value):undefined},'스킬 모드·단계 편집');}
  return <div className="panel spaced"><header className="panel-heading"><h3>{calcs?'계산 탭 스킬 선택':'PoB 스킬 선택'}</h3><span className="muted">{pending?'현재 입력 확인 중…':'적용된 그룹 기준'}</span></header><div className="panel-body">
    {disabled&&<p className="muted note">그룹 변경을 먼저 적용하고 현재 입력의 조회를 기다려 주세요.</p>}
    {diagnostics.map((d,i)=><p className="warning" key={i}>{d.message}</p>)}
    <div className="field-grid"><label>활성 효과<select aria-label="PoB 활성 효과" disabled={disabled||!options.skills.length} value={options.activeSkill} onChange={e=>edit({type:'skill-active',setId,groupId:group.id,index:Number(e.target.value),calcs},'활성 스킬 효과 변경')}>{options.skills.map(s=><option key={s.index} value={s.index}>{s.label}</option>)}</select></label>
      {options.modes.length>0&&<label>스킬 모드<select aria-label="PoB 스킬 모드" value={options.selectedMode} disabled={disabled||partial||!gem} onChange={e=>gem&&edit({type:'gem-stat-set',setId,groupId:group.id,gemIndex:gem,grantedEffectId:options.grantedEffectId!,index:Number(e.target.value),calcs},'스킬 모드 변경')}>{options.modes.map(m=><option key={m.index} value={m.index}>{m.label}</option>)}</select></label>}
      {options.parts.length>0&&<label>스킬 부분<select aria-label="PoB 스킬 부분" disabled={disabled||partial||!gem} value={options.selectedPart} onChange={e=>value('skillPart',e.target.value)}>{options.parts.map(p=><option key={p.index} value={p.index}>{p.label}</option>)}</select></label>}
      {options.stages!==undefined&&<label>단계 수<input key={options.stages} aria-label="PoB 단계 수" type="number" min={0} defaultValue={options.stages} disabled={disabled||partial||!gem} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur();}}} onBlur={e=>{if(e.target.value!==String(options.stages))value('skillStageCount',e.target.value);}}/></label>}
      {options.minesAvailable&&<label>활성 지뢰 수<input key={options.mines??'automatic'} aria-label="PoB 활성 지뢰 수" type="number" min={0} defaultValue={options.mines??''} disabled={disabled||partial||!gem} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur();}}} onBlur={e=>{if(e.target.value!==String(options.mines??''))value('skillMineCount',e.target.value);}}/></label>}
    </div>
    {!gem&&options.skills.length>0&&<p className="warning">이 효과는 원본에서 확인했으나 젬 외부에서 부여된 효과의 세부 편집은 아직 지원하지 않습니다.</p>}
    {!disabled&&options.gems.map(native=>{const input=group.gems[native.index-1];if(!input||input.name!==native.name)return null;return (['level','quality'] as const).filter(field=>native[field]!==undefined&&native[field]!==Number(input.attributes[field]??input[field])).map(field=><p className="warning" key={native.index+field}>젬 {native.index} {field==='level'?'레벨':'퀄리티'} · XML 입력 {input.attributes[field]??input[field]} / 원본 PoB 적용 {native[field]}</p>);})}
    {options.gems.filter(g=>g.error).map(g=><p className="warning" key={g.index}>젬 {g.index} · {g.name}: {g.error}</p>)}
  </div></div>;
}
