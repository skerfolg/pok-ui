import {useEffect,useRef,useState} from 'react';
import type {BuildDocument,BuildEdit,Calculation,Item} from '../../shared/contracts';
import type {PobItemControls,PobItemField,PobItemPopup,PobItemPopupState} from '../../shared/pob-item-controls';
import {NativeItemPopup} from './NativeItemPopup';
import {hashBuildXml} from '../../shared/calculation-context';
import {api} from '../services/api';
type Snapshot=Pick<BuildDocument,'id'|'revision'|'xml'>;
export function NativeItemEditor({build,item,slot,runtimeId,applyExpected,calculated}:{build:Snapshot;item:Item;slot:string;runtimeId?:string;applyExpected:(snapshot:Snapshot,edit:BuildEdit,label:string)=>BuildDocument;calculated:(build:BuildDocument,calculation:Calculation)=>boolean}){
  const [open,setOpen]=useState(false),[candidate,setCandidate]=useState(item.text),[saved,setSaved]=useState<{snapshot:Snapshot;candidate:string;data:PobItemControls}>(),[pending,setPending]=useState(false),[applying,setApplying]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState<{revision:number;text:string}>();
  const generation=useRef(0);
  const activeRequest=useRef<string|undefined>(undefined);
  const [popup,setPopup]=useState<{state:PobItemPopupState;data?:PobItemPopup;error?:string}>();
  function cancelCurrent(){const id=activeRequest.current;if(id){activeRequest.current=undefined;void api.cancelPobRequest(id).catch(()=>{});}}
  async function checked(snapshot:Snapshot,text:string,field?:string,value?:string|number,popupRequest?:(PobItemPopupState&{commit?:boolean})){
    const requestId=crypto.randomUUID();activeRequest.current=requestId;
    try{
    const [data,xmlHash,textHash]=await Promise.all([api.itemControls({buildId:snapshot.id,revision:snapshot.revision,xml:snapshot.xml,itemId:item.id,slot,runtimeId,draftText:text,field,value,popup:popupRequest,requestId}),hashBuildXml(snapshot.xml),hashBuildXml(text)]);
    if(data.buildId!==snapshot.id||data.revision!==snapshot.revision||data.xmlSha256!==xmlHash||data.runtimeId!==runtimeId||data.itemId!==item.id||data.validatedSlot!==slot||data.inputTextSha256!==textHash)throw new Error('아이템 옵션 응답의 입력·아이템·슬롯·PoB 버전이 일치하지 않습니다.');return data;
    }finally{if(activeRequest.current===requestId)activeRequest.current=undefined;}
  }
  useEffect(()=>{
    const token=++generation.current;setCandidate(item.text);setSaved(undefined);setPopup(undefined);setError('');setPending(false);
    if(!open||!runtimeId)return;setPending(true);const snapshot={...build};
    const timer=setTimeout(()=>{void checked(snapshot,item.text).then(data=>{if(generation.current!==token)return;setSaved({snapshot,candidate:item.text,data});setPending(false);}).catch(reason=>{if(generation.current===token){setError(String(reason));setPending(false);}});},250);
    return()=>{generation.current++;clearTimeout(timer);cancelCurrent();};
  },[open,build.id,build.revision,build.xml,item.id,item.text,slot,runtimeId]);
  const current=saved&&saved.snapshot.id===build.id&&saved.snapshot.revision===build.revision&&saved.snapshot.xml===build.xml&&saved.data.itemId===item.id&&saved.data.validatedSlot===slot&&saved.data.runtimeId===runtimeId&&saved.candidate===candidate?saved:undefined;
  async function runPopup(state:PobItemPopupState,commit=false){
    if(!current||!current.data.sourcePreserved||pending||applying||activeRequest.current)return;
    const token=++generation.current,snapshot={...build},text=candidate;setPending(true);setPopup({state,data:popup?.data});
    try{
      const data=await checked(snapshot,text,undefined,undefined,{...state,commit});if(generation.current!==token)return;
      if(commit){setCandidate(data.text);setSaved({snapshot,candidate:data.text,data});setPopup(undefined);}
      else{if(!data.popup||data.popup.kind!==state.kind||data.popup.slot!==(state.slot||1))throw new Error('팝업 응답의 종류 또는 위치가 다릅니다.');setPopup({state:data.popup.state,data:data.popup});}
    }catch(reason){if(generation.current===token)setPopup(previous=>previous?{...previous,error:String(reason)}:undefined);}finally{if(generation.current===token)setPending(false);}
  }
  function closePopup(){generation.current++;cancelCurrent();setPopup(undefined);setPending(false);}
  async function change(field:PobItemField,value:string|number){
    if(!current||!current.data.sourcePreserved||pending||applying||activeRequest.current)return;const token=++generation.current,snapshot={...build},text=candidate;setPending(true);setError('');
    try{const data=await checked(snapshot,text,field.id,value);if(generation.current!==token)return;setCandidate(data.text);setSaved({snapshot,candidate:data.text,data});}
    catch(reason){if(generation.current===token)setError(String(reason));}finally{if(generation.current===token)setPending(false);}
  }
  async function apply(){
    if(!current||!current.data.sourcePreserved||pending||applying||popup||candidate===item.text)return;setApplying(true);setError('');const submitted=current;
    try{
      const info=await api.getPobRuntimeInfo();if(info.status!=='ready'||info.runtimeId!==submitted.data.runtimeId)throw new Error('검토 후 PoB 버전이 바뀌었습니다. 다시 옵션을 읽어 주세요.');
      const next=applyExpected(submitted.snapshot,{type:'item-native',id:item.id,text:candidate,metadata:submitted.data.metadata},'원본 아이템 옵션 적용');const result=await api.computeBuild(next);
      const enriched={...result,result:{...result.result,editor_diagnostics:{kind:'item-controls',itemId:item.id,runtimeId:submitted.data.runtimeId,itemTextSha256:await hashBuildXml(candidate),diagnostics:submitted.data.diagnostics}}},attached=calculated(next,enriched);
      const partial=submitted.data.diagnostics.some(d=>d.code==='item-unparsed-lines');
      setNotice({revision:next.revision,text:`리비전 ${next.revision} ${result.result.ok===false?'계산 진단 확인 필요':partial?'부분 계산 수신 · 미해석 줄은 반영되지 않음':'새 계산 수신'}${attached?'':' · 현재 입력이 바뀌어 최신 결과에 반영하지 않음'}`});
    }catch(reason){setError(String(reason));}finally{setApplying(false);}
  }
  return <details className="native-item-editor panel spaced" open={open} onToggle={e=>setOpen(e.currentTarget.open)}><summary className="panel-heading">원본 아이템 옵션</summary><div className="panel-body">
    <p className="muted note">원본 PoB의 컨트롤과 선택지를 사용합니다. 변경은 검토 중이며 적용 전까지 현재 빌드를 바꾸지 않습니다.</p>{!runtimeId&&<p className="warning">독립 PoB 런타임을 준비해 주세요.</p>}
    <p role="status" className="muted">{pending?'원본 옵션 처리 중…':applying?'적용·새 계산 중…':notice?.revision===build.revision?notice.text:current?`리비전 ${build.revision} · PoB ${current.data.pobCommit.slice(0,7)}`:''}</p>{error&&<p className="warning" role="alert">{error}</p>}
    <div className="actions spaced">{current?.data.actions?.map(action=><button key={action.kind+':'+action.slot} disabled={pending||applying||Boolean(popup)||!action.enabled||!current.data.sourcePreserved} onClick={()=>void runPopup({kind:action.kind,slot:action.slot||1})}>{action.kind==='anoint'?`성유 ${action.slot||1} 편집`:'오염 편집'}</button>)}</div><div className="field-grid">{current?.data.fields.map(field=><label key={field.id}>{field.label}{field.kind==='select'?<select aria-label={`원본 ${field.label}`} value={field.value} disabled={pending||applying||Boolean(popup)||!field.enabled||!current.data.sourcePreserved} onChange={e=>void change(field,field.options?.find(o=>o.index===Number(e.target.value))?.key??field.options?.find(o=>o.index===Number(e.target.value))?.name??Number(e.target.value))}>{field.options?.map(option=><option key={option.index} value={option.index}>{option.name?option.name+' · ':''}{option.label}</option>)}</select>:field.kind==='slider'?<input aria-label={`원본 ${field.label}`} type="range" min={0} max={1} step={0.01} key={field.id+':'+field.value} defaultValue={Number(field.value)} disabled={pending||applying||Boolean(popup)||!field.enabled||!current.data.sourcePreserved} onPointerUp={e=>void change(field,Number(e.currentTarget.value))} onKeyUp={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key))void change(field,Number(e.currentTarget.value));}}/>:<input key={field.id+':'+field.value} aria-label={`원본 ${field.label}`} defaultValue={field.value} maxLength={field.limit} inputMode={field.filter==='%D'?'numeric':undefined} disabled={pending||applying||Boolean(popup)||!field.enabled||!current.data.sourcePreserved} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur();}}} onBlur={e=>{if(e.target.value!==String(field.value))void change(field,e.target.value);}}/>}</label>)}</div>
    {current?.data.fields.filter(field=>field.description?.length).map(field=><details key={field.id}><summary>{field.label} · 원본 수치</summary>{field.description?.map((line,i)=><p key={i}>{line}</p>)}</details>)}
    {current?.data.fields.filter(field=>field.kind==='select'&&field.options?.some(o=>o.index===field.value&&o.description?.length)).map(field=><details key={field.id}><summary>{field.label} · 원본 설명</summary>{field.options?.find(o=>o.index===field.value)?.description?.map((line,i)=><p key={i}>{line}</p>)}</details>)}
    {current?.data.diagnostics.map((d,i)=><div className="warning spaced" key={i}><p>{d.code}: {d.message}</p>{d.lines?.map((line,j)=><p className="calcs-line" key={j}>{line}</p>)}</div>)}
    {current&&!current.data.sourcePreserved&&<p className="warning">원본 줄 일부를 정확히 보존하지 못해 적용을 차단했습니다. 현재 아이템 원문은 변경되지 않았습니다.</p>}
    {candidate!==item.text&&<><details className="spaced" open><summary>아이템 원문 변경 검토 · 아직 적용 전</summary><div className="comparison-grid"><pre>{item.text}</pre><pre>{candidate}</pre></div></details><div className="actions"><button disabled={pending||applying} onClick={()=>{generation.current++;setCandidate(item.text);setSaved(undefined);setOpen(false);}}>검토 취소</button><button className="primary" disabled={!current||!current.data.sourcePreserved||pending||applying||Boolean(popup)} onClick={()=>void apply()}>아이템 옵션 적용·새 계산</button></div></>}
    <p className="muted note">원문 정규화도 변경 검토에 포함됩니다. 팝업 결과도 초안에 반영한 뒤 별도로 적용합니다. 모든 특수 제작 연산을 검증한 것은 아닙니다.</p>
    {popup&&<NativeItemPopup data={popup.data} state={popup.state} error={popup.error} pending={pending} change={state=>void runPopup(state)} commit={()=>void runPopup(popup.state,true)} close={closePopup}/>}
  </div></details>;
}
