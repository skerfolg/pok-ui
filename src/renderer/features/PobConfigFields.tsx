import {useEffect,useState} from 'react';
import type {BuildEdit,ConfigSet} from '../../shared/contracts';
import type {PobConfigField,PobInspection,PobValue} from '../../shared/pob-inspection';
function ConfigField({field,set,edit,disabled}:{field:PobConfigField;set:ConfigSet;edit:(edit:BuildEdit,label:string)=>void;disabled:boolean}){
  const explicit=field.key!==undefined&&Object.hasOwn(set.inputs,field.key),value=explicit?set.inputs[field.key!]:field.value??field.defaultValue;
  const [draft,setDraft]=useState(value===undefined?'':String(value));
  useEffect(()=>setDraft(value===undefined?'':String(value)),[value,set.id]);
  function apply(next:PobValue|undefined){if(!field.key)return;edit(next===undefined?{type:'config-remove',setId:set.id,key:field.key}:{type:'config',setId:set.id,key:field.key,value:next},next===undefined?'전투 조건 기본값 복원':'전투 조건 편집');}
  function commit(){
    if(draft===String(value??''))return;
    if(field.type==='text'){apply(draft);return;}
    if(!draft.trim()){apply(undefined);return;}
    const number=Number(draft);if(Number.isFinite(number))apply(number);
  }
  const label=field.label||field.key||'',off=disabled||!field.enabled||!field.key;
  const numeric=['count','integer','countAllowZero','float'].includes(field.type);
  let input;
  if(field.type==='check')input=<label className="check"><input aria-label={`PoB 조건 ${field.key}`} type="checkbox" disabled={off} checked={typeof value==='boolean'?value:field.checked===true} onChange={e=>apply(e.target.checked)}/><span>{label}</span></label>;
  else if(field.type==='list'){
    const index=field.options?.findIndex(o=>o.value===value)??-1;
    input=<label>{label}<select aria-label={`PoB 조건 ${field.key}`} disabled={off} value={index} onChange={e=>{const option=field.options?.[Number(e.target.value)];if(option)apply(option.value);}}>
      {index<0&&<option value={-1}>{value===undefined?'기본값':String(value)+' · 원문 값'}</option>}{field.options?.map((option,i)=><option key={i} value={i}>{option.label}</option>)}
    </select></label>;
  }else if(numeric)input=<label>{label}<input type="number" step={field.type==='float'?'any':1} aria-label={`PoB 조건 ${field.key}`} disabled={off} value={draft} placeholder={String(field.placeholder??field.defaultValue??'')} onChange={e=>setDraft(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();commit();e.currentTarget.blur();}}}/></label>;
  else if(field.type==='text')input=<label>{label}<textarea aria-label={`PoB 조건 ${field.key}`} disabled={off} rows={3} value={draft} onChange={e=>setDraft(e.target.value)} onBlur={commit}/></label>;
  else input=<p>{label}</p>;
  return <div data-config-key={field.key} className={`pob-config-field ${field.available?'':'muted'}`}>{input}<div className="actions"><small>{explicit?'XML 설정값':'원본 기본값'}</small>{field.key&&<button type="button" className="text-button" aria-label={`${field.key} 미설정`} disabled={off||!explicit} onClick={()=>apply(undefined)}>미설정</button>}</div>{field.tooltip&&<details><summary>설명</summary><p className="note">{field.tooltip}</p></details>}</div>;
}
export function PobConfigFields({inspection,current,set,edit,pending,error}:{inspection?:PobInspection;current:boolean;set:ConfigSet;edit:(edit:BuildEdit,label:string)=>void;pending:boolean;error:string}){
  const [query,setQuery]=useState(''),[showAll,setShowAll]=useState(false);
  const sections=inspection?.config.map(section=>({...section,fields:section.fields.filter(field=>(showAll?field.showAll:field.available)&&(!query.trim()||`${field.label} ${field.key||''} ${field.tooltip||''}`.toLowerCase().includes(query.trim().toLowerCase())))})).filter(section=>section.fields.length);
  return <div className="panel spaced"><header className="panel-heading"><h2>전투 조건</h2><span className="muted">{pending?'현재 입력의 조건을 확인 중…':current?'현재 설정':'조회 필요'}</span></header><div className="panel-body">
    <div className="actions"><input type="search" aria-label="전투 조건 검색" placeholder="조건 이름·설명 검색" value={query} onChange={e=>setQuery(e.target.value)}/><label className="check"><input type="checkbox" checked={showAll} onChange={e=>setShowAll(e.target.checked)}/>원본에서 표시 가능한 조건 모두</label></div>
    {error&&<p className="warning" role="status">{error}</p>}{!inspection&&!error&&<p className="muted">독립 PoB 런타임에서 입력에 맞는 조건·기본값·선택지를 읽습니다.</p>}
    {sections?.map(section=><details className="pob-config-section" key={section.name} open><summary>{section.name} · {section.fields.length}</summary><div className="pob-config-grid">{section.fields.map(field=><ConfigField key={field.id} field={field} set={set} edit={edit} disabled={!current}/>)}</div></details>)}
    {inspection?.diagnostics.length? <details className="spaced"><summary>원본 조회 진단 · {inspection.diagnostics.length}</summary><pre>{JSON.stringify(inspection.diagnostics,null,2)}</pre></details>:null}
  </div></div>;
}
