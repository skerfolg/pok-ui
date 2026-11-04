import {useEffect,useRef,useState} from 'react';
import type {BuildDocument,BuildEdit,Calculation,ParsedBuild} from '../../shared/contracts';
import type {PobLoadouts,PobLoadoutOperation} from '../../shared/pob-loadouts';
import {loadoutEdit} from '../../shared/pob-loadouts';
import {editBuild,parseBuild} from '../../shared/pob-document';
import {describeActiveChanges} from '../../shared/build-changes';
import {LoadoutManagement} from './LoadoutManagement';
import {hashBuildXml} from '../../shared/calculation-context';
import {api} from '../services/api';
export function LoadoutsView({build,parsed,runtimeId,applyExpected,calculated}:{build:BuildDocument;parsed:ParsedBuild;runtimeId?:string;applyExpected:(snapshot:BuildDocument,edit:BuildEdit,label:string)=>BuildDocument;calculated:(build:BuildDocument,result:Calculation)=>boolean}){
  const [data,setData]=useState<PobLoadouts>(),[name,setName]=useState(''),[preview,setPreview]=useState<{snapshot:BuildDocument;data:PobLoadouts;edit:BuildEdit;xml:string}>(),[pending,setPending]=useState(false),[applying,setApplying]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState<{revision:number;text:string}>();
  const generation=useRef(0),requestId=useRef<string|undefined>(undefined);
  function cancel(){generation.current++;const id=requestId.current;requestId.current=undefined;if(id)void api.cancelPobRequest(id).catch(()=>{});setPending(false);setPreview(undefined);}
  async function read(snapshot:BuildDocument,selected?:string,manage?:PobLoadoutOperation){
    const token=++generation.current,id=crypto.randomUUID();requestId.current=id;setPending(true);setPreview(undefined);setError('');
    try{const [result,hash]=await Promise.all([api.readLoadouts({buildId:snapshot.id,revision:snapshot.revision,xml:snapshot.xml,runtimeId,requestId:id,name:selected,manage}),hashBuildXml(snapshot.xml)]);if(token!==generation.current)return;
      if(result.buildId!==snapshot.id||result.revision!==snapshot.revision||result.xmlSha256!==hash||result.runtimeId!==runtimeId||result.requestedName!==selected)throw new Error('통합 구성 응답의 입력·PoB 버전·선택이 일치하지 않습니다.');
      if(JSON.stringify(result.operation)!==JSON.stringify(manage))throw new Error('통합 구성 관리 응답의 요청이 다릅니다.');
      if(selected||manage){const edit=loadoutEdit(snapshot,result);setPreview({snapshot,data:result,edit,xml:editBuild(snapshot.xml,edit)});}
      else{setData(result);setName(result.activeName||result.choices[0]?.name||'');}
    }catch(reason){if(token===generation.current)setError(String(reason));}finally{if(requestId.current===id)requestId.current=undefined;if(token===generation.current)setPending(false);}
  }
  useEffect(()=>{setData(undefined);setPreview(undefined);setError('');setPending(false);if(runtimeId)void read(build);return()=>{generation.current++;const id=requestId.current;requestId.current=undefined;if(id)void api.cancelPobRequest(id).catch(()=>{});};},[build.id,build.revision,build.xml,runtimeId]);
  const ready=data?.buildId===build.id&&data.revision===build.revision&&data.runtimeId===runtimeId;
  const current=preview&&preview.snapshot.id===build.id&&preview.snapshot.revision===build.revision&&preview.snapshot.xml===build.xml&&preview.data.runtimeId===runtimeId&&(preview.data.operation||preview.data.requestedName===name)?preview:undefined;
  const prospective=current?parseBuild(current.xml):undefined;
  const lineage=current?.data.sets&&prospective?([['tree','트리',parsed.trees,prospective.trees],['items','장비',parsed.itemSets,prospective.itemSets],['skills','스킬',parsed.skillSets,prospective.skillSets],['config','조건',parsed.configs,prospective.configs]] as const).flatMap(([kind,label,before,after])=>current.data.sets![kind].flatMap((entry,index)=>{
    const source=before.find(set=>set.id===(entry.sourceId??entry.copyFrom)),next=after.find(set=>set.id===entry.id),oldPosition=source?before.findIndex(set=>set.id===source.id)+1:0;
    if(entry.node)return[`${label} 세트 생성: ${next?.title||entry.id}`];
    if(entry.copyFrom)return[`${label} 세트 복사: ${source?.title||entry.copyFrom} → ${next?.title||entry.id}`];
    const rows:string[]=[];if(source?.title!==next?.title)rows.push(`${label} 세트 이름: ${source?.title||entry.sourceId} → ${next?.title||entry.id}`);if(oldPosition!==index+1)rows.push(`${label} 세트 순서: ${next?.title||entry.id} · ${oldPosition} → ${index+1}`);return rows;
  })):[];
  const changes=current?[...new Set([...describeActiveChanges(build.xml,current.xml).filter(line=>!(current.data.movement?.activePreserved&&line.startsWith('활성 트리 세트:'))),...lineage])]:[];
  const removed=current?.data.sets?([['tree','트리',parsed.trees],['items','장비',parsed.itemSets],['skills','스킬',parsed.skillSets],['config','조건',parsed.configs]] as const).flatMap(([kind,label,sets])=>sets.filter(set=>!current.data.sets![kind].some(entry=>entry.sourceId===set.id)).map(set=>`${label}: ${set.title||set.id}`)):[];
  const links=current?.data.loadoutChanges;
  async function apply(){if(!current||pending||applying||current.xml===build.xml)return;setApplying(true);setError('');
    try{const info=await api.getPobRuntimeInfo();if(info.status!=='ready'||info.runtimeId!==current.data.runtimeId)throw new Error('검토 후 PoB 버전이 바뀌었습니다. 다시 조회해 주세요.');const next=applyExpected(current.snapshot,current.edit,'원본 통합 구성 적용'),result=await api.computeBuild(next,'workspace');
      const receipt={kind:'loadouts',inputRevision:current.snapshot.revision,inputXmlSha256:current.data.xmlSha256,reviewRuntimeId:current.data.runtimeId,pobCommit:current.data.pobCommit,requestedName:current.data.requestedName,operation:current.data.operation,selection:current.data.selection,loadoutChanges:current.data.loadoutChanges,movement:current.data.movement};
      const attached=calculated(next,{...result,result:{...result.result,workspace_operation:receipt}});setNotice({revision:next.revision,text:`리비전 ${next.revision} ${result.result.ok===false?'계산 진단 확인 필요':'새 계산 수신'}${attached?'':' · 현재 입력이 바뀌어 최신 결과에 반영하지 않음'}`});}
    catch(reason){setError(String(reason));}finally{setApplying(false);}
  }
  function describe(selection:PobLoadouts['selection'],source=parsed){return[['트리',source.trees,selection.tree],['장비',source.itemSets,selection.items],['스킬',source.skillSets,selection.skills],['조건',source.configs,selection.config]].map(([label,sets,id])=>`${label}: ${(sets as {id:string;title:string}[]).find(s=>s.id===id)?.title||id}`).join(' · ');}
  return <section className="feature scroll"><div className="page-heading"><h1>통합 구성</h1><span className="muted">PoB Loadout · 장비·스킬·트리·조건 동시 선택</span></div><div className="panel"><header className="panel-heading"><h2>원본 구성 목록</h2></header><div className="panel-body">
    <p className="muted note">원본 PoB가 이름·연결 식별자로 묶은 구성입니다. 미리보기는 빌드를 바꾸지 않으며 적용하면 네 세트와 연동된 무기·주력 스킬 상태를 함께 바꿉니다.</p><p role="status">{pending?'원본 통합 구성 조회 중…':applying?'통합 구성 적용·새 계산 중…':notice?.revision===build.revision?notice.text:!runtimeId?'독립 PoB 런타임을 준비해 주세요.':data?`리비전 ${build.revision} · PoB ${data.pobCommit.slice(0,7)}`:''}</p>
    {ready&&<p>현재 선택: {describe(data.selection)}{!data.activeName?' · 일치하는 원본 통합 구성 없음':''}</p>}
    {error&&<p role="alert" className="warning">{error}</p>}
    <label>통합 구성<select aria-label="원본 통합 구성" value={name} disabled={!ready||pending||applying} onChange={e=>{setName(e.target.value);setPreview(undefined);}}>{data?.choices.map((choice,index)=><option key={index} value={choice.name}>{choice.label}</option>)}</select></label>
    {ready&&!data.choices.length&&<p className="warning">원본이 제공하는 완전한 통합 구성이 없습니다. 개별 세트 화면에서 계속 편집할 수 있습니다.</p>}
    <div className="actions spaced"><button disabled={!ready||!name||pending||applying} onClick={()=>void read(build,name)}>통합 구성 미리보기</button><button disabled={!runtimeId||pending||applying} onClick={()=>void read(build)}>원본 목록 새로 조회</button>{pending&&<button onClick={cancel}>통합 구성 조회 취소</button>}</div>
    {data?.diagnostics.map((d,index)=><p key={index} className="warning">{d.name&&`${d.name}: `}{d.message}</p>)}
  </div></div>{ready&&<LoadoutManagement key={build.id+':'+build.revision} data={data} parsed={parsed} disabled={pending||applying} change={()=>setPreview(undefined)} request={operation=>void read(build,undefined,operation)}/>}{current&&<div className="panel spaced"><header className="panel-heading"><h2>변경 검토 · 아직 적용 전</h2></header><div className="panel-body"><p>{describe(current.data.selection,parseBuild(current.xml))}</p>{current.data.movement&&<div><p>트리 순서 이동: {current.data.movement.sourceTree} → {current.data.movement.destinationTree}</p>{current.data.movement.activePreserved&&<p>원본 활성 구성은 유지됩니다.</p>}<p>함께 이동하는 연결 구성</p><ul>{current.data.movement.affectedNames.map(entry=><li key={entry.name}>{entry.label}</li>)}</ul></div>}{current.data.confirmation&&<p className="warning">{current.data.confirmation}</p>}{removed.length>0&&<div className="warning"><p>제거되는 세트</p><ul>{removed.map((line,index)=><li key={index}>{line}</li>)}</ul></div>}{links&&links.removed.length>0&&<div className="warning"><p>원본 목록에서 빠지는 연결 구성</p><ul>{links.removed.map(entry=><li key={entry.name}>{entry.label}</li>)}</ul></div>}{links&&links.added.length>0&&<div><p>원본 목록에 추가되는 연결 구성</p><ul>{links.added.map(entry=><li key={entry.name}>{entry.label}</li>)}</ul></div>}{links&&links.changed.length>0&&<div className="warning"><p>연결 대상이 바뀌는 구성</p><ul>{links.changed.map(entry=><li key={entry.name}>{entry.label}</li>)}</ul></div>}{changes.length?<ul>{changes.map((change,index)=><li key={index}>{change}</li>)}</ul>:<p>표시 가능한 구성 차이 없음</p>}<p className="muted note">표시된 변경은 측정 개선이나 완성 추천을 뜻하지 않습니다. 적용 후 최종 입력으로 새 계산합니다.</p><div className="actions"><button disabled={pending||applying} onClick={()=>setPreview(undefined)}>통합 구성 검토 취소</button><button className="primary" disabled={pending||applying||current.xml===build.xml} onClick={()=>void apply()}>통합 구성 적용·새 계산</button></div></div></div>}
  </section>;
}
