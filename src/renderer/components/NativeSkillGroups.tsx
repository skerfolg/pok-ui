import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import type {BuildDocument,BuildEdit,Calculation} from '../../shared/contracts';
import type {PobLoadouts} from '../../shared/pob-loadouts';
import {skillGroupEdit,type PobSkillGroupOperation} from '../../shared/pob-skill-groups';
import {editBuild,parseBuild} from '../../shared/pob-document';
import {hashBuildXml} from '../../shared/calculation-context';
import {api} from '../services/api';
export function NativeSkillGroups({build,setId,groupId,runtimeId,enabled,applyExpected,calculated,select}:{build:BuildDocument;setId:string;groupId?:string;runtimeId?:string;enabled:boolean;applyExpected:(snapshot:BuildDocument,edit:BuildEdit,label:string)=>BuildDocument;calculated:(build:BuildDocument,result:Calculation)=>boolean;select:(id:string)=>void}){
  const [inventory,setInventory]=useState<PobLoadouts>(),[preview,setPreview]=useState<{snapshot:BuildDocument;data:PobLoadouts;edit:BuildEdit;xml:string;token:number}>(),[pending,setPending]=useState(false),[applying,setApplying]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState<{revision:number;text:string}>();
  const generation=useRef(0),requestId=useRef<string|undefined>(undefined),latest=useRef(build);latest.current=build;
  function cancel(){generation.current++;const id=requestId.current;requestId.current=undefined;if(id)void api.cancelPobRequest(id).catch(()=>{});setPending(false);setPreview(undefined);}
  async function read(operation:PobSkillGroupOperation){
    cancel();const token=generation.current,id=crypto.randomUUID(),snapshot=build;requestId.current=id;setPending(true);setError('');
    try{const [data,hash]=await Promise.all([api.readLoadouts({buildId:snapshot.id,revision:snapshot.revision,xml:snapshot.xml,runtimeId,requestId:id,skillGroups:operation}),hashBuildXml(snapshot.xml)]);
      if(token!==generation.current)return;
      if(data.buildId!==snapshot.id||data.revision!==snapshot.revision||data.xmlSha256!==hash||data.runtimeId!==runtimeId||JSON.stringify(data.skillGroups?.operation)!==JSON.stringify(operation))throw new Error('원본 스킬 그룹 응답의 입력·요청·PoB 버전이 다릅니다.');
      if(operation.action==='inspect')setInventory(data);
      else{const edit=skillGroupEdit(snapshot.xml,data.skillGroups!);setPreview({snapshot,data,edit,xml:editBuild(snapshot.xml,edit),token});}
    }catch(reason){if(token===generation.current)setError(String(reason));}finally{if(requestId.current===id)requestId.current=undefined;if(token===generation.current)setPending(false);}
  }
  useEffect(()=>{cancel();setInventory(undefined);setError('');if(enabled&&runtimeId)void read({action:'inspect',setId});return()=>{generation.current++;const id=requestId.current;requestId.current=undefined;if(id)void api.cancelPobRequest(id).catch(()=>{});};},[build.id,build.revision,build.xml,setId,runtimeId,enabled]);
  const data=inventory?.skillGroups,group=data?.groups.find(value=>value.id===groupId),index=data?.groups.findIndex(value=>value.id===groupId)??-1,ready=Boolean(enabled&&runtimeId&&inventory?.buildId===build.id&&inventory?.revision===build.revision&&inventory?.runtimeId===runtimeId&&group&&!pending&&!applying);
  const current=preview&&preview.token===generation.current&&preview.snapshot.id===build.id&&preview.snapshot.revision===build.revision&&preview.snapshot.xml===build.xml&&preview.data.runtimeId===runtimeId?preview:undefined;
  const result=current?.data.skillGroups;
  async function apply(){if(!current||!result||applying||pending)return;setApplying(true);setError('');let committed:BuildDocument|undefined;
    try{const info=await api.getPobRuntimeInfo();if(info.status!=='ready'||info.runtimeId!==current.data.runtimeId)throw new Error('검토 후 PoB 런타임이 바뀌었습니다. 다시 검토해 주세요.');
      const label=result.operation.action==='delete'?'원본 스킬 그룹 삭제':'원본 스킬 그룹 순서 변경';committed=applyExpected(current.snapshot,current.edit,label);setPreview(undefined);select(result.operation.action==='reorder'?String(result.order.indexOf(result.operation.groupId!)+1):'');
      const computed=await api.computeBuild(committed),attached=calculated(committed,{...computed,result:{...computed.result,workspace_operation:{kind:'skill-groups',operation:result.operation,inputRevision:current.snapshot.revision,inputXmlSha256:current.data.xmlSha256,reviewRuntimeId:current.data.runtimeId,pobCommit:current.data.pobCommit,order:result.order,mainSocketGroup:result.mainSocketGroup,calcsSkillNumber:result.calcsSkillNumber}}});
      if(latest.current.id===committed.id)setNotice({revision:committed.revision,text:`리비전 ${committed.revision} ${computed.result.ok===false?'계산 진단 확인 필요':'새 계산 수신'}${attached?'':' · 입력 변경으로 최신 결과에 반영하지 않음'}`});
    }catch(reason){const owner=committed||current.snapshot;if(latest.current.id===owner.id&&latest.current.revision===owner.revision&&latest.current.xml===owner.xml)setError(String(reason));}finally{setApplying(false);}
  }
  return <div className="native-skill-groups"><div className="actions">
    <button type="button" aria-label="스킬 그룹 위로" disabled={!ready||index<=0} onClick={()=>void read({action:'reorder',setId,groupId,position:index})}>위로</button>
    <button type="button" aria-label="스킬 그룹 아래로" disabled={!ready||index<0||index>=(data?.groups.length||0)-1} onClick={()=>void read({action:'reorder',setId,groupId,position:index+2})}>아래로</button>
    <button type="button" aria-label="스킬 그룹 삭제" disabled={!ready||!group?.canDelete} onClick={()=>void read({action:'delete',setId,groupId})}>삭제</button>
    {pending&&<button type="button" onClick={cancel}>그룹 요청 취소</button>}
  </div><small role="status">{pending?'원본 스킬 그룹 확인 중…':error||(!group?.canDelete&&group?.source?'아이템이 부여한 그룹은 원본 PoB에서 삭제할 수 없습니다.':notice?.revision===build.revision?notice.text:'')}</small>
    {current&&result&&createPortal(<div className="modal-backdrop"><form className="modal" role="dialog" aria-modal="true" aria-label="스킬 그룹 변경 검토" onSubmit={e=>{e.preventDefault();void apply();}} onKeyDown={e=>{if(e.key==='Escape'&&!applying)cancel();}}><h2>스킬 그룹 {result.operation.action==='delete'?'삭제':'순서 변경'} 검토</h2>
      <p>입력 리비전 {current.snapshot.revision} · PoB {current.data.pobCommit.slice(0,7)}</p>
      <p>원래 그룹 번호: {result.groups.map(value=>value.id).join(' → ')}<br/>변경 후 원래 그룹 번호: {result.order.join(' → ')||'빈 세트'}</p>
      <ol>{result.order.map(id=><li key={id}>{id} · {result.groups.find(value=>value.id===id)?.label||'빈 그룹'}</li>)}</ol>
      <p>주력 그룹 번호: {parseBuild(current.snapshot.xml).mainSocketGroup} → {result.mainSocketGroup}<br/>계산 탭 그룹 번호: {data?.calcsSkillNumber} → {result.calcsSkillNumber}</p>
      {result.confirmation&&<p className="warning">{result.confirmation}</p>}<p>적용한 구성으로 새로 계산합니다.</p>{error&&<p role="alert">{error}</p>}
      <div className="actions"><button type="button" disabled={applying} onClick={cancel}>취소</button><button className="primary" type="submit" disabled={applying}>그룹 변경 적용·재계산</button></div>
    </form></div>,document.body)}
  </div>;
}
