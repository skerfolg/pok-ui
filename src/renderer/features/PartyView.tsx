import {useEffect,useRef,useState} from 'react';
import type {BuildDocument,BuildEdit,Calculation,ParsedBuild} from '../../shared/contracts';
import {partyNames,type PartyName,type PobParty} from '../../shared/pob-party';
import {hashBuildXml} from '../../shared/calculation-context';
import {api} from '../services/api';
const labels:Record<PartyName,string>={PartyMemberStats:'파티 능력치',Aura:'오라',Curse:'저주','Warcry Skills':'함성','Link Skills':'연결 스킬',EnemyConditions:'적 조건',EnemyMods:'적 modifier'};
export function PartyView({build,builds,parsed,runtimeId,edit,applyExpected,changed}:{build:BuildDocument;builds:BuildDocument[];parsed:ParsedBuild;runtimeId?:string;edit:(edit:BuildEdit,label:string)=>void;applyExpected:(snapshot:BuildDocument,edit:BuildEdit,label:string)=>BuildDocument;changed:(build:BuildDocument,calculation:Calculation)=>boolean}){
  const [draft,setDraft]=useState(parsed.party?.buffers||{}),[field,setField]=useState<PartyName>('Aura'),[saved,setSaved]=useState<{xml:string;data:PobParty}>(),[busy,setBusy]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState<{revision:number;text:string}>();
  const [sourceId,setSourceId]=useState(builds.find(b=>b.id!==build.id)?.id||''),[destination,setDestination]=useState('All'),[append,setAppend]=useState(false);
  const [preview,setPreview]=useState<{snapshot:BuildDocument;data:PobParty;description:string}>();const owner=useRef(0);
  useEffect(()=>{setDraft(parsed.party?.buffers||{});setPreview(undefined);},[build.xml]);
  useEffect(()=>{
    let cancelled=false;setError('');if(!runtimeId)return;setBusy('원본 파티 정보 조회 중…');
    const snapshot=build,timer=setTimeout(()=>{void Promise.all([api.readParty({buildId:build.id,revision:build.revision,xml:build.xml,runtimeId}),hashBuildXml(build.xml)]).then(([data,hash])=>{
      if(cancelled)return;if(data.buildId!==snapshot.id||data.revision!==snapshot.revision||data.xmlSha256!==hash||data.runtimeId!==runtimeId)throw new Error('파티 조회가 현재 입력·PoB 버전과 다릅니다.');setSaved({xml:snapshot.xml,data});setBusy('');
    }).catch(reason=>{if(!cancelled){setError(String(reason));setBusy('');}});},250);
    return()=>{cancelled=true;owner.current++;clearTimeout(timer);};
  },[build.id,build.revision,build.xml,runtimeId]);
  const current=saved?.xml===build.xml&&saved.data.revision===build.revision&&saved.data.runtimeId===runtimeId?saved.data:undefined;
  const dirty=partyNames.some(name=>(draft[name]||'')!==(parsed.party?.buffers[name]||''));
  async function prepare(action:'import'|'clear'){
    if(!runtimeId||busy||dirty)return;const token=++owner.current,snapshot=build,source=builds.find(b=>b.id===sourceId);setError('');setBusy('원본 파티 작업 검토 중…');setPreview(undefined);
    try{
      if(action==='import'&&!source)throw new Error('지원 빌드를 선택해 주세요.');
      const data=await api.readParty({buildId:snapshot.id,revision:snapshot.revision,xml:snapshot.xml,runtimeId,action,supportXml:action==='import'?source?.xml:undefined,destination,append});
      if(token!==owner.current)return;
      if(data.buildId!==snapshot.id||data.revision!==snapshot.revision||data.xmlSha256!==await hashBuildXml(snapshot.xml)||data.runtimeId!==runtimeId||action==='import'&&data.supportSha256!==await hashBuildXml(source!.xml))throw new Error('파티 검토 결과의 입력이 일치하지 않습니다.');
      setPreview({snapshot,data,description:action==='clear'?`${destination} 비우기`:`${source!.name} · 리비전 ${source!.revision} → ${destination} · ${append?'추가':'교체'}`});
    }catch(reason){if(token===owner.current)setError(String(reason));}finally{if(token===owner.current)setBusy('');}
  }
  async function apply(){
    if(!preview||busy)return;const token=++owner.current;setError('');setBusy('파티 적용·새 계산 중…');
    try{
      const info=await api.getPobRuntimeInfo();if(info.status!=='ready'||info.runtimeId!==preview.data.runtimeId)throw new Error('파티 검토 후 PoB 버전이 바뀌었습니다. 다시 검토해 주세요.');
      const next=applyExpected(preview.snapshot,{type:'batch',edits:partyNames.map(name=>({type:'party-buffer',name,text:preview.data.buffers[name]||''}))},'검토한 파티 구성 적용');
      // Updating XML invalidates the current preview, but this submitted calculation still owns its revision.
      const calculation=await api.computeBuild(next),attached=changed(next,calculation);
      setNotice({revision:next.revision,text:`리비전 ${next.revision} 계산 ${calculation.result.ok===false?'진단 확인 필요':'완료'}${attached?'':' · 현재 문서가 바뀌어 최신 결과에 반영하지 않음'}`});
    }catch(reason){setError(String(reason));}finally{if(token===owner.current)setBusy('');}
  }
  return <section className="feature scroll"><div className="page-heading"><h1>파티</h1><span role="status" className="muted">{busy||(notice?.revision===build.revision?notice.text:`리비전 ${build.revision}`)}</span></div>
    <p className="muted note">지원 빌드를 작업 공간에 가져온 뒤 선택하세요. 지원 출력 생성과 교체/추가는 원본 PoB가 처리하며, 검토 전에는 현재 빌드를 바꾸지 않습니다.</p>{error&&<p className="warning" role="alert">{error}</p>}
    <div className="panel"><header className="panel-heading"><h2>지원 빌드 가져오기</h2></header><div className="panel-body field-grid"><label>지원 빌드<select aria-label="지원 빌드" value={sourceId} onChange={e=>setSourceId(e.target.value)}><option value="">선택하세요</option>{builds.filter(b=>b.id!==build.id).map(b=><option key={b.id} value={b.id}>{b.name} · 리비전 {b.revision}</option>)}</select></label><label>대상<select aria-label="파티 가져오기 대상" value={destination} onChange={e=>setDestination(e.target.value)}>{(current?.destinations||['All']).map(name=><option key={name} value={name}>{name}</option>)}</select></label><label className="check"><input aria-label="파티 추가 모드" type="checkbox" checked={append} onChange={e=>setAppend(e.target.checked)}/>기존 효과에 추가</label><div className="actions"><button disabled={!current||Boolean(busy)||dirty||!sourceId} onClick={()=>void prepare('import')}>파티 가져오기 검토</button><button disabled={!current||Boolean(busy)||dirty} onClick={()=>void prepare('clear')}>선택 대상 비우기 검토</button></div></div></div>
    {preview&&<div className="panel spaced"><header className="panel-heading"><h2>파티 변경 검토</h2><span>{preview.description}</span></header><div className="panel-body">{partyNames.filter(name=>(preview.data.buffers[name]||'')!==(parsed.party?.buffers[name]||'')).map(name=><details key={name} open><summary>{labels[name]}</summary><div className="comparison-grid"><pre>{parsed.party?.buffers[name]||'미설정'}</pre><pre>{preview.data.buffers[name]||'미설정'}</pre></div></details>)}{preview.data.diagnostics.map((d,i)=><p className="warning" key={i}>{d.field} · 줄 {d.line}: {d.message}</p>)}<div className="actions"><button onClick={()=>setPreview(undefined)}>검토 취소</button><button className="primary" disabled={Boolean(busy)||build.revision!==preview.snapshot.revision||build.xml!==preview.snapshot.xml} onClick={()=>void apply()}>파티 적용·새 계산</button></div></div></div>}
    <div className="panel spaced"><header className="panel-heading"><h2>파티 원문 편집</h2><select aria-label="파티 버퍼 종류" value={field} onChange={e=>setField(e.target.value as PartyName)}>{partyNames.map(name=><option key={name} value={name}>{labels[name]}</option>)}</select></header><div className="panel-body"><label>{labels[field]}<textarea className="party-buffer" aria-label="파티 버퍼 원문" value={draft[field]||''} onChange={e=>setDraft({...draft,[field]:e.target.value})}/></label><p className="muted note">원본 지원 출력 형식입니다. 변환되지 않는 줄도 원문에 보존합니다. 일반 아이템 설명을 자동 번역하지 않습니다.</p><div className="actions"><button disabled={!dirty||Boolean(busy)} onClick={()=>edit({type:'batch',edits:partyNames.filter(name=>(draft[name]||'')!==(parsed.party?.buffers[name]||'')).map(name=>({type:'party-buffer',name,text:draft[name]||''}))},'파티 원문 편집')}>파티 원문 적용</button><button disabled={!dirty} onClick={()=>setDraft(parsed.party?.buffers||{})}>초안 취소</button></div>{current?.summaries[field]&&<pre>{current.summaries[field]}</pre>}{current?.diagnostics.map((d,i)=><p className="warning" key={i}>{d.code} · {d.field} 줄 {d.line}: {d.message}</p>)}</div></div>
    {current&&<details className="spaced"><summary>현재 빌드의 원본 지원 출력</summary><p className="calcs-line">{current.help}</p><pre>{JSON.stringify(current.exports,null,2)}</pre><button disabled={Boolean(busy)||dirty} onClick={()=>edit({type:'batch',edits:[{type:'party-export-enabled',enabled:true},...partyNames.map(name=>({type:'party-buffer' as const,name,text:current.exports[name]||'',exported:true}))]},'현재 파티 지원 출력 기록')}>지원 출력 XML에 기록</button></details>}
    <p className="muted note">일시적 효과 비활성화/재구성, URL 직접 가져오기와 전체 지원 조합 검증은 아직 제공하지 않습니다. 새 계산의 진단을 함께 확인하세요.</p>
  </section>;
}
