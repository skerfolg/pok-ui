import {useInputDigest} from '../state/useInputDigest';
import {useState} from 'react';
import type {BuildDocument} from '../../shared/contracts';
import type {DesignRecordReference,DesignRecordSnapshot,InputProposal} from '../../shared/build-revision';
import {snapshotInputs} from '../../shared/build-revision';
import {api} from '../services/api';
import '../design/design-record.css';
const roles:Record<string,string>={user_fixed:'사용자 고정',mechanism_required:'메커니즘 필수',provisional:'잠정 구현',power_candidate:'성능 후보'};
const adoption:Record<string,string>={adopted:'채택',candidate:'후보',rejected:'제외',deferred:'보류'};
function rows(value:unknown):Record<string,unknown>[] {return Array.isArray(value)?value.filter(x=>x&&typeof x==='object'&&!Array.isArray(x)):[];}
export function DesignView({build,connected,xmlSha256,apply}:{build:BuildDocument;connected:boolean;xmlSha256?:string;apply:(proposal:InputProposal)=>void}){
 const [reference,setReference]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [pending,setPending]=useState<{snapshot:DesignRecordSnapshot;baseRevision:number;baseDesignRevision:string|null}>();
 const snapshot=build.design;
 const metadataDigest=useInputDigest(build.acquisitionMetadataJson,build.id);
 const metadataHash=metadataDigest.hash?'sha256:'+metadataDigest.hash:undefined;
 let record:Record<string,unknown>={},assessment:Record<string,unknown>={},readError='';
 try{if(snapshot){record=JSON.parse(snapshot.recordJson);assessment=JSON.parse(snapshot.assessmentJson||'{}');}}catch{readError='저장된 설계 내용을 읽을 수 없습니다.';}
 const review=new Set(Array.isArray(assessment.review_required_ids)?assessment.review_required_ids:[]);
 async function load(){setError('');setPending(undefined);setBusy(true);const baseRevision=build.revision,baseDesignRevision=build.design?.recordRef.revision??null;
  try{const snapshot=await api.readDesignRecord(JSON.parse(reference) as DesignRecordReference);setPending({snapshot,baseRevision,baseDesignRevision});}catch(e){setError(String(e));}finally{setBusy(false);}}
 function attach(){if(!pending)return;try{apply({buildId:build.id,baseRevision:pending.baseRevision,baseDesignRevision:pending.baseDesignRevision,inputs:{...snapshotInputs(build),design:pending.snapshot},summary:'설계 기록 연결'});setPending(undefined);setError('');}catch(e){setError(String(e));}}
 return <section className="feature scroll design-record"><div className="page-heading"><h1>빌드 설계</h1><span className="muted">문서 리비전 {build.revision}</span></div>
 {(error||readError||metadataDigest.error)&&<p className="error-banner" role="alert">{error||readError||metadataDigest.error}</p>}
 {!snapshot?<p className="muted">연결된 설계가 없습니다. 수동 편집과 문서 저장은 계속할 수 있습니다.</p>:<>
 <div className="panel"><header className="panel-heading"><h2>{String((record.goal as {summary?:unknown}|undefined)?.summary||'빌드 설계')}</h2></header><p>{String(record.mechanism_summary||'')}</p><p className="muted">{!snapshot.xmlSha256?'XML 구성과 연결되지 않은 설계':!xmlSha256?'현재 XML 입력 확인 중':snapshot.xmlSha256==='sha256:'+xmlSha256?'설계와 현재 XML 입력이 일치합니다.':'현재 XML이 설계 입력과 다릅니다. 재검토가 필요합니다.'} · 입력 일치는 인게임 성립이나 성능 검증을 뜻하지 않습니다.</p>{(snapshot.acquisitionSha256||build.acquisitionMetadataJson!==undefined)&&<p className="muted">{!snapshot.acquisitionSha256?'획득 메타데이터의 설계 연결 미확인':build.acquisitionMetadataJson===undefined?'설계에 연결된 획득 메타데이터가 없습니다. 재검토가 필요합니다.':!metadataHash?'획득 메타데이터 입력 확인 중':metadataHash===snapshot.acquisitionSha256?'설계와 획득 메타데이터 입력이 일치합니다.':'획득 메타데이터가 설계 입력과 다릅니다. 재검토가 필요합니다.'}</p>}</div>
 <h2>앵커와 후보</h2><div className="design-decisions">{rows(record.decisions).map((d,i)=><article className="panel" key={String(d.id||i)}><header className="panel-heading"><h3>{String(d.title||d.id)}</h3><span>{roles[String(d.role)]||String(d.role)} · {adoption[String(d.adoption)]||String(d.adoption)}</span></header><p>{String((d.condition as {statement?:unknown}|undefined)?.statement||'')}</p><p className="muted">근거 상태: {String(d.belief)} · 확신: {String(d.confidence)}{review.has(d.id)?' · 재검토 필요':''}</p><ul>{rows(d.providers).map((provider,j)=><li key={j}>{String(provider.label||provider.id)}</li>)}</ul></article>)}</div>
 <details><summary>미해결 질문 · {rows(record.questions).length}개</summary><pre>{JSON.stringify(record.questions,null,2)}</pre></details>
 <details><summary>근거와 재검토 보고서</summary><p className="muted">저장된 설계 리비전의 보고서입니다. 현재 문서에 대한 새 검증 결과가 아닙니다.</p><pre>{JSON.stringify({evidence:record.evidence,assessment},null,2)}</pre></details>
 <details><summary>설계 문서</summary><pre>{snapshot.markdown}</pre></details>
 </>}
 <details className="spaced"><summary>PoK 설계 기록 연결</summary><label>설계 참조 JSON<textarea value={reference} onChange={e=>setReference(e.target.value)} placeholder="PoK에서 받은 설계 참조를 붙여 넣으세요."/></label><div className="actions"><button disabled={!connected||busy||!reference.trim()} onClick={()=>void load()}>{busy?'조회 중…':'조회'}</button>{pending&&<button className="primary" onClick={attach}>조회한 설계 적용</button>}</div>{!connected&&<p className="muted">설계를 조회하려면 PoK에 연결하세요.</p>}{pending&&<pre>{pending.snapshot.markdown}</pre>}</details>
 </section>;
}
