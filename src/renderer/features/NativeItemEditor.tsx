import {parseBuild} from '../../shared/pob-document';
import {useRetainedPresentation} from '../state/useRetainedPresentation';
import {createPortal} from 'react-dom';
import {useDetailReads,peekItemDisplay,seedItemDisplay,detailEpoch} from '../state/native-detail-cache';
import {ItemSummary} from '../components/ItemSummary';
import {ItemTextEditor} from './ItemTextEditor';
import {ItemSimilarSearch} from './ItemSimilarSearch';
import {useSessionDraft} from '../state/useSessionDraft';
import {NumberField} from '../components/NumberField';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {BuildDocument,BuildEdit,Item} from '../../shared/contracts';
import type {PobItemControls,PobItemField,PobItemPopup,PobItemPopupState} from '../../shared/pob-item-controls';
import {NativeItemPopup} from './NativeItemPopup';
import {hashBuildXml} from '../../shared/calculation-context';
import {api} from '../services/api';
function displayFieldLabel(field:PobItemField,fields:PobItemField[]){
  const labels:Record<string,string>={Quality:'퀄리티','Augment Sockets':'증강 소켓','Jewel Sockets':'주얼 소켓',Catalyst:'촉매','Catalyst Quality':'촉매 퀄리티',Variant:'변형','Cluster Jewel Skill':'주얼 스킬'};
  if(labels[field.label])return labels[field.label];
  for(const [prefix,label]of [['Prefix:','접두'],['Suffix:','접미']])if(field.label.startsWith(prefix))return label+' '+(fields.filter(value=>value.label.startsWith(prefix)).findIndex(value=>value.id===field.id)+1);
  if(field.label.startsWith('Affix Tier / Roll'))return '등급 · 수치';
  if(field.label.startsWith('Modifier Range'))return field.label.split(' · ').slice(1).join(' · ')||'옵션 수치 범위';
  return field.label.replace(/^Rune (\d+)/,'룬 $1').replace(/^Additional Variant (\d+)/,'추가 변형 $1');
}
type Snapshot=Pick<BuildDocument,'id'|'revision'|'xml'>;
export function NativeItemEditor({build,item,slot,runtimeId,getRuntimeId,applyExpected,onBusyChange,searchActionsTarget}:{searchActionsTarget?:HTMLElement|null;build:Snapshot;item:Item;slot?:string;runtimeId?:string;getRuntimeId?:()=>string|undefined;applyExpected:(snapshot:Snapshot,edit:BuildEdit,label:string)=>BuildDocument;onBusyChange?:(busy:boolean)=>void}){
  useDetailReads();
  const [sourceEditing,setSourceEditing]=useState(false);
  const owner=JSON.stringify(['item-fields',build.id,item.id,slot,runtimeId]);
  const [numberDrafts,setNumberDrafts]=useSessionDraft<Record<string,string>>(owner,'fields',{});
  const [popupDraft,setPopupDraft]=useSessionDraft<{state:PobItemPopupState;sourceText:string}|undefined>(owner,'popup',undefined);
  const popupCommit=useRef<number|undefined>(undefined);
  const [open,setOpen]=useState(true),[saved,setSaved]=useState<{snapshot:Snapshot;candidate:string;data:PobItemControls;origin?:Snapshot}>(),[pending,setPending]=useState(false),[error,setError]=useState('');
  const generation=useRef(0);
  const [queued,setQueued]=useState<Record<string,string|number>>({});
  const [values,setValues]=useState<Record<string,string|number>>({});
  const [fieldErrors,setFieldErrors]=useState<Record<string,string>>({});
  const acknowledgements=useRef<{revision:number;field:string;value:string|number}[]>([]);
  const ownRevision=useRef<number|undefined>(undefined);
  useEffect(()=>{if(build.revision!==ownRevision.current){if(!mutationBusy.current){queuedValues.current={};setQueued({});}setValues({});setFieldErrors({});acknowledgements.current=[];}},[build.revision,build.id,runtimeId]);
  const queuedValues=useRef<Record<string,string|number>>({});
  const mutationBusy=useRef(false);
  const activeRequest=useRef<string|undefined>(undefined);
  const activeIsRead=useRef(false);
  const [popup,setPopup]=useState<{state:PobItemPopupState;data?:PobItemPopup;error?:string}>();
  function cancelCurrent(includeMutation=true){const id=activeRequest.current;if(id&&(includeMutation||activeIsRead.current)){activeRequest.current=undefined;if(!activeIsRead.current)void api.cancelPobRequest(id).catch(()=>{});}}
  async function checked(snapshot:Snapshot,text:string,field?:string,value?:string|number,popupRequest?:(PobItemPopupState&{commit?:boolean})){
    const cacheEpoch=detailEpoch();const requestId=crypto.randomUUID();activeRequest.current=requestId;activeIsRead.current=!field&&!popupRequest;
    try{
    const [data,xmlHash,textHash]=await Promise.all([api.itemControls({buildId:snapshot.id,revision:snapshot.revision,xml:snapshot.xml,itemId:item.id,slot,runtimeId,draftText:text,field,value,popup:popupRequest,requestId}),hashBuildXml(snapshot.xml),hashBuildXml(text)]);
    if(data.buildId!==snapshot.id||data.revision!==snapshot.revision||data.xmlSha256!==xmlHash||data.runtimeId!==runtimeId||data.itemId!==item.id||data.validatedSlot!==slot||data.inputTextSha256!==textHash)throw new Error('아이템 옵션 응답의 입력·아이템·슬롯·PoB 버전이 일치하지 않습니다.');if(!field&&!popupRequest&&text===item.text&&cacheEpoch===detailEpoch()&&runtimeId)seedItemDisplay(snapshot,runtimeId,item.id,{displayLines:data.displayLines,requirements:peekItemDisplay(snapshot,runtimeId,item.id)?.requirements||[]});return data;
    }finally{if(activeRequest.current===requestId)activeRequest.current=undefined;}
  }
  useEffect(()=>{
    const token=++generation.current;setPopup(undefined);setError('');setPending(mutationBusy.current);
    if(!open||!runtimeId)return;
    // A validated native edit already includes the resulting item and controls.
    // Bind those controls to the exact successful canonical patch; keep their
    // response provenance untouched. An unrelated edit still requires a read.
    if(saved?.origin&&saved.snapshot.id===build.id&&saved.snapshot.revision===build.revision&&saved.snapshot.xml===build.xml&&saved.candidate===item.text&&saved.data.itemId===item.id&&saved.data.validatedSlot===slot&&saved.data.runtimeId===runtimeId)return;
    setPending(true);const snapshot={...build};
    const timer=setTimeout(()=>{void checked(snapshot,item.text).then(data=>{if(generation.current!==token)return;setSaved({snapshot,candidate:item.text,data});setPending(false);}).catch(reason=>{if(generation.current===token){setError(String(reason));setPending(false);}});},0);
    return()=>{generation.current++;clearTimeout(timer);cancelCurrent(false);};
  },[open,build.id,build.revision,build.xml,item.id,item.text,slot,runtimeId]);
  const current=saved&&saved.snapshot.id===build.id&&saved.snapshot.revision===build.revision&&saved.snapshot.xml===build.xml&&saved.data.itemId===item.id&&saved.data.validatedSlot===slot&&saved.data.runtimeId===runtimeId&&saved.candidate===item.text?saved:undefined;
  const presentation=useRetainedPresentation(owner,current);
  const displayLines=useRetainedPresentation(owner,current?.data.displayLines??peekItemDisplay(build,runtimeId,item.id)?.displayLines);
  const incomplete=Object.entries(numberDrafts).some(([id,text])=>{const field=saved?.data.fields.find(field=>field.id===id);if(!field||field.kind!=='slider'&&field.filter!=='%D')return false;const value=Number(text),min=field.kind==='slider'?0:field.min,max=field.kind==='slider'?100:field.max;return text.trim()===''||!Number.isFinite(value)||field.filter==='%D'&&!Number.isInteger(value)||min!==undefined&&value<min||max!==undefined&&value>max;});
  const busy=sourceEditing||!current||pending||mutationBusy.current||Boolean(popup)||Object.keys(queued).length>0||incomplete||Object.keys(fieldErrors).length>0||Boolean(ownRevision.current!==undefined&&ownRevision.current>build.revision);
  useLayoutEffect(()=>{onBusyChange?.(busy);},[busy,onBusyChange]);
  async function runPopup(state:PobItemPopupState,commit=false){
    if(!current||!current.data.sourcePreserved||pending||activeRequest.current)return;
    const token=++generation.current,snapshot={...build},text=item.text;if(commit)popupCommit.current=token;else setPopupDraft({state,sourceText:text});setPending(true);setPopup({state,data:popup?.data});
    try{
      const data=await checked(snapshot,text,undefined,undefined,{...state,commit});if(commit?popupCommit.current!==token:generation.current!==token)return;if(getRuntimeId&&getRuntimeId()!==runtimeId)throw new Error('편집 중 PoB 버전이 변경되었습니다.');
      if(commit){if(!data.sourcePreserved)throw new Error('원문 보존을 확인하지 못해 변경하지 않았습니다.');const next=applyExpected(snapshot,{type:'item-native',id:item.id,text:data.text,metadata:data.metadata},state.kind==='add'?'아이템 옵션 추가':'성유·오염 옵션 변경');ownRevision.current=next.revision;setPopupDraft(undefined);setPopup(undefined);}
      else{if(!data.popup||data.popup.kind!==state.kind||data.popup.slot!==(state.slot||1))throw new Error('팝업 응답의 종류 또는 위치가 다릅니다.');setPopupDraft({state:data.popup.state,sourceText:text});setPopup({state:data.popup.state,data:data.popup});}
    }catch(reason){if(generation.current===token)setPopup(previous=>previous?{...previous,error:String(reason)}:undefined);}finally{if(generation.current===token)setPending(false);}
  }
  function closePopup(){popupCommit.current=undefined;setPopupDraft(undefined);generation.current++;cancelCurrent();setPopup(undefined);setPending(false);}
  async function drain(){
    if(!current||!current.data.sourcePreserved||mutationBusy.current||activeRequest.current||popup)return;
    mutationBusy.current=true;let snapshot={...build},text=item.text,data=current.data;setPending(true);setError('');
    try{
      while(Object.keys(queuedValues.current).length){
        const [fieldId,value]=Object.entries(queuedValues.current)[0];delete queuedValues.current[fieldId];setQueued({...queuedValues.current});
        const field=data.fields.find(field=>field.id===fieldId);if(!field?.enabled)throw new Error('현재 원본 컨트롤을 사용할 수 없습니다.');
        try{
          if(getRuntimeId&&getRuntimeId()!==runtimeId)throw new Error('편집 중 PoB 버전이 변경되었습니다.');
          data=await checked(snapshot,text,fieldId,value);
          if(getRuntimeId&&getRuntimeId()!==runtimeId)throw new Error('편집 중 PoB 버전이 변경되었습니다.');
          if(!data.sourcePreserved)throw new Error('원문 보존을 확인하지 못했습니다. 변경하지 않았습니다.');
          const next=applyExpected(snapshot,{type:'item-native',id:item.id,text:data.text,metadata:data.metadata},'아이템 옵션 변경');ownRevision.current=next.revision;
          if(runtimeId)seedItemDisplay(next,runtimeId,item.id,{displayLines:data.displayLines,requirements:[]});
          const appliedItem=parseBuild(next.xml).items.find(value=>value.id===item.id);
          if(appliedItem?.text===data.text)setSaved({snapshot:next,candidate:data.text,data,origin:snapshot});
          setNumberDrafts(previous=>{const draft=previous[fieldId],scale=field.kind==='slider'?100:1;if(draft!==undefined&&(typeof value==='number'?draft.trim()!==''&&Number(draft)===value*scale:draft===value)){const next={...previous};delete next[fieldId];return next;}return previous;});
          acknowledgements.current.push({revision:next.revision,field:fieldId,value});snapshot=next;text=data.text;
        }catch(reason){setFieldErrors(errors=>({...errors,[fieldId]:String(reason)}));throw reason;}
      }
    }catch(reason){setError(String(reason));queuedValues.current={};setQueued({});}
    finally{mutationBusy.current=false;setPending(false);}
  }
  useEffect(()=>{if(!current)return;const ready=acknowledgements.current.filter(a=>a.revision<=build.revision);acknowledgements.current=acknowledgements.current.filter(a=>a.revision>build.revision);if(ready.length)setValues(previous=>{const next={...previous};for(const ack of ready)if(next[ack.field]===ack.value)delete next[ack.field];return next;});},[current,build.revision]);
  useEffect(()=>{if(current&&!pending&&!popup&&!activeRequest.current&&Object.keys(queuedValues.current).length)void drain();},[current,pending,popup,queued]);
  useEffect(()=>{if(current&&!pending&&!popup&&popupDraft?.sourceText===item.text)void runPopup(popupDraft.state);},[current,pending]);
  function stage(field:PobItemField,value:string|number){setValues(values=>({...values,[field.id]:value}));setFieldErrors(errors=>{const next={...errors};delete next[field.id];return next;});queuedValues.current[field.id]=value;setQueued({...queuedValues.current});void drain();}
  const flushText=useRef(()=>{});flushText.current=()=>{for(const field of current?.data.fields||[])if(field.kind==='edit'&&field.filter!=='%D'&&numberDrafts[field.id]!==undefined&&numberDrafts[field.id]!==String(field.value))stage(field,numberDrafts[field.id]);};
  useEffect(()=>()=>flushText.current(),[]);
  const fields=presentation?.data.fields||[];
  // Pair only the controls explicitly identified by the original item editor.
  const pairedRanges=new Map(fields.filter(field=>/^displayItemAffixRange\d+$/.test(field.id)).map(field=>[field.id.replace('Range',''),field]));
  const rows=fields.filter(field=>!/^displayItemAffixRange\d+$/.test(field.id)||!fields.some(other=>other.id===field.id.replace('Range',''))).map(field=>({field,range:pairedRanges.get(field.id)}));
  const renderControl=(field:PobItemField)=>field.kind==='select'?<select aria-label={`${field.label}`} value={field.value} disabled={Boolean(popup)||!field.enabled||!saved?.data.sourcePreserved||saved?.data.runtimeId!==runtimeId} onChange={e=>stage(field,field.options?.find(o=>o.index===Number(e.target.value))?.key??field.options?.find(o=>o.index===Number(e.target.value))?.name??Number(e.target.value))}>{field.options?.map(option=><option key={option.index} value={option.index}>{option.name?option.name+' · ':''}{option.label==='None'?'없음':field.id==='displayItemCatalyst'&&option.label==='Catalyst'?'선택 안 함':option.label}</option>)}</select>:field.kind==='slider'?<span className="native-slider"><input aria-label={`${field.label}`} type="range" min={0} max={1} step={0.01} value={Number(values[field.id]??field.value)} onChange={event=>setValues(previous=>({...previous,[field.id]:Number(event.target.value)}))} disabled={Boolean(popup)||!field.enabled||!saved?.data.sourcePreserved||saved?.data.runtimeId!==runtimeId} onPointerUp={e=>stage(field,Number(e.currentTarget.value))} onKeyUp={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key))stage(field,Number(e.currentTarget.value));}}/><NumberField flushOnUnmount textValue={numberDrafts[field.id]} onDraftChange={text=>setNumberDrafts(previous=>({...previous,[field.id]:text}))} label={`${field.label} 범위 %`} value={Number(values[field.id]??field.value)*100} min={0} max={100} onCommit={value=>stage(field,value/100)} disabled={Boolean(popup)||!field.enabled||!saved?.data.sourcePreserved||saved?.data.runtimeId!==runtimeId}/></span>:field.filter==='%D'?<NumberField flushOnUnmount integer textValue={numberDrafts[field.id]} onDraftChange={text=>setNumberDrafts(previous=>({...previous,[field.id]:text}))} label={`${field.label}`} value={Number(values[field.id]??field.value)} min={field.min} max={field.max} step={field.step} disabled={Boolean(popup)||!field.enabled||!saved?.data.sourcePreserved||saved?.data.runtimeId!==runtimeId} onCommit={value=>stage(field,value)}/>:<input key={field.id} aria-label={`${field.label}`} value={numberDrafts[field.id]??values[field.id]??field.value} onChange={event=>setNumberDrafts(previous=>({...previous,[field.id]:event.target.value}))} maxLength={field.limit} inputMode={field.filter==='%D'?'numeric':undefined} disabled={Boolean(popup)||!field.enabled||!saved?.data.sourcePreserved||saved?.data.runtimeId!==runtimeId} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur();}}} onBlur={e=>{if(e.target.value!==String(field.value))stage(field,e.target.value);}}/>;
  return <>{searchActionsTarget&&createPortal(<ItemSimilarSearch build={build} item={item} slot={slot} runtimeId={runtimeId} disabled={busy||!current?.data.sourcePreserved}/>,searchActionsTarget)}<div className="native-item-workspace"><ItemSummary item={item} lines={displayLines} updating={!current&&Boolean(displayLines)} editAction={<ItemTextEditor disabled={Boolean(runtimeId)&&!current&&!error} owner={owner} build={build} text={current?.data.sourcePreserved?current.data.text:item.text} onEditingChange={setSourceEditing} save={async(snapshot,text)=>{if(runtimeId&&current?.data.sourcePreserved){const data=await checked(snapshot,text);if(getRuntimeId&&getRuntimeId()!==runtimeId)throw new Error('PoB 버전이 변경되었습니다.');applyExpected(snapshot,{type:'item-native',id:item.id,text,metadata:data.metadata},'아이템 원문 저장');}else applyExpected(snapshot,{type:'item',id:item.id,text},'아이템 원문 저장');}}/>}/><details className="native-item-editor panel spaced" aria-busy={busy} open={open} onToggle={e=>setOpen(e.currentTarget.open)}><summary className="panel-heading">아이템 옵션</summary><div className="panel-body">
    {!runtimeId&&<p className="warning">계산 기능을 준비하고 있습니다.</p>}
    {popupDraft&&popupDraft.sourceText!==item.text&&<p className="warning">이전 성유·오염 초안의 아이템 원문이 변경되어 자동 복원을 중단했습니다. <button onClick={()=>setPopupDraft(undefined)}>팝업 초안 지우기</button></p>}
    <p role="status" className="screen-reader-only editor-status">{pending?'옵션 갱신 중…':current?'자동 반영 준비됨':''}</p>
    <div className="actions">{presentation?.data.actions?.map(action=><button key={action.kind+':'+action.slot} disabled={pending||Boolean(popup)||!action.enabled||!current?.data.sourcePreserved} onClick={()=>void runPopup({kind:action.kind,slot:action.slot||1})}>{action.kind==='anoint'?`성유 ${action.slot||1} 편집`:action.kind==='add'?'옵션 추가…':'타락'}</button>)}</div><div className="native-option-list">{rows.map(({field,range})=><div className="native-option-row" data-field={field.id} data-paired={Boolean(range)} data-affix={/^displayItemAffix\d+$/.test(field.id)} key={runtimeId+':'+field.id}>
      <span className="native-option-label">{displayFieldLabel(field,fields)}</span>
      <div className="native-option-value">{renderControl(field)}{fieldErrors[field.id]&&<small className="warning" role="alert">{fieldErrors[field.id]}</small>}</div>
      {range&&<div className="native-option-range">{renderControl(range)}{fieldErrors[range.id]&&<small className="warning" role="alert">{fieldErrors[range.id]}</small>}</div>}
    </div>)}</div>
    {(incomplete||Object.keys(fieldErrors).length>0)&&<button className="spaced" onClick={()=>{setNumberDrafts({});setFieldErrors({});setValues({});}}>입력 초안 지우기</button>}
    {error&&<p className="warning" role="alert">{error}</p>}
    {current&&!current.data.sourcePreserved&&<p className="warning">원본 줄 일부를 정확히 보존하지 못해 적용을 차단했습니다. 현재 아이템 원문은 변경되지 않았습니다.</p>}
    {popup&&<NativeItemPopup data={popup.data} state={popup.state} error={popup.error} pending={pending} change={state=>void runPopup(state)} commit={state=>void runPopup(state||popup.state,true)} close={closePopup}/>}
  </div></details></div></>;
}
