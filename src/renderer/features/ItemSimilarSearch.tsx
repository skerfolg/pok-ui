import {useEffect,useRef,useState} from 'react';
import type {BuildDocument,Item} from '../../shared/contracts';
import type {PobSimilarSearch,PobSimilarSearchState} from '../../shared/pob-item-controls';
import {hashBuildXml} from '../../shared/calculation-context';
import {api} from '../services/api';

export function ItemSimilarSearch({build,item,slot,runtimeId,disabled}:{build:Pick<BuildDocument,'id'|'revision'|'xml'>;item:Item;slot?:string;runtimeId?:string;disabled:boolean}){
  const [open,setOpen]=useState(false),[data,setData]=useState<PobSimilarSearch>(),[draft,setDraft]=useState<PobSimilarSearchState>({}),[pending,setPending]=useState(false),[error,setError]=useState('');
  const generation=useRef(0),request=useRef<string|undefined>(undefined),closeButton=useRef<HTMLButtonElement>(null),trigger=useRef<HTMLButtonElement>(null);
  const context=JSON.stringify([build.id,build.revision,build.xml,item.id,item.text,slot,runtimeId]);
  function cancel(){generation.current++;if(request.current)void api.cancelPobRequest(request.current).catch(()=>{});request.current=undefined;}
  useEffect(()=>{cancel();setOpen(false);setData(undefined);setPending(false);setError('');return cancel;},[context]);
  useEffect(()=>{if(open)closeButton.current?.focus();},[open]);
  function close(){cancel();setOpen(false);setPending(false);trigger.current?.focus();}
  async function read(state:PobSimilarSearchState){
    cancel();const token=generation.current,id=crypto.randomUUID();request.current=id;setOpen(true);setPending(true);setError('');
    try{
      const [result,xmlHash,textHash]=await Promise.all([api.itemControls({buildId:build.id,revision:build.revision,xml:build.xml,itemId:item.id,draftText:item.text,slot,runtimeId,similar:state,requestId:id}),hashBuildXml(build.xml),hashBuildXml(item.text)]);
      if(token!==generation.current)return;
      if(result.buildId!==build.id||result.revision!==build.revision||result.xmlSha256!==xmlHash||result.runtimeId!==runtimeId||result.itemId!==item.id||result.inputTextSha256!==textHash||result.validatedSlot!==slot||!result.similar)throw new Error('검색 조건의 입력·아이템·PoB 출처가 일치하지 않습니다.');
      setData(result.similar);setDraft(result.similar.state);
    }catch(reason){if(token===generation.current)setError(String(reason));}finally{if(token===generation.current){request.current=undefined;setPending(false);}}
  }
  const ready=data&&!disabled&&!pending&&!error&&JSON.stringify(draft)===JSON.stringify(data.state);
  function selection(id:string,value:string|number|boolean){setDraft(previous=>({...previous,selections:{...previous.selections,[id]:value}}));}
  async function openSearch(){if(!ready)return;try{await api.openTradeSearch(data.url);}catch(reason){setError(String(reason));}}
  return <><button ref={trigger} disabled={disabled} onClick={()=>void read({})}>비슷한 아이템 검색</button>{open&&<div className="modal-backdrop" onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();close();}if(event.key==='Tab'){const controls=[...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),summary')],first=controls[0],last=controls[controls.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}}}><section className="modal similar-search" role="dialog" aria-modal="true" aria-label="비슷한 아이템 검색">
    <header className="panel-heading"><h2>비슷한 아이템 검색 · {item.name}</h2><button ref={closeButton} onClick={close}>닫기</button></header>
    <div className="panel-body scroll"><p className="muted note">원본 PoB가 제공하는 옵션을 거래소 검색 조건으로 사용합니다. 빌드는 변경되지 않습니다.</p>
      <label className="spaced">리그 이름 · 직접 입력<input aria-label="비슷한 아이템 검색 리그" value={draft.league||''} placeholder="Standard" maxLength={256} disabled={pending} onChange={event=>setDraft(previous=>({...previous,league:event.target.value}))}/></label><p className="muted note">현재 리그 목록을 조회하지 않습니다. 검색할 리그의 정확한 이름을 입력하세요.</p>
      {pending&&<p role="status" className="screen-reader-only">원본 검색 조건을 준비하는 중…</p>}{error&&<p role="alert" className="warning">{error}</p>}
      {data&&<><div className="similar-search-heading"><span>검색 조건 · {data.realm}</span><span>최솟값</span><span>최댓값</span></div><div className="similar-search-rows">{data.rows.map(row=><div className="similar-search-row" key={row.id}>
        <span className="similar-search-check">{row.fields.filter(field=>field.kind==='check').map(field=><input key={field.id} type="checkbox" aria-label={`검색 ${row.label} 사용`} checked={Boolean(draft.selections?.[field.id])} disabled={pending||!field.enabled} onChange={event=>selection(field.id,event.target.checked)}/>)}</span><span className="similar-search-label">{row.label}</span>
        {row.fields.filter(field=>field.kind!=='check').map(field=>field.kind==='select'?<select className="similar-search-select" aria-label={`검색 ${row.label}`} key={field.id} value={Number(draft.selections?.[field.id]??field.value)} disabled={pending||!field.enabled} onChange={event=>selection(field.id,Number(event.target.value))}>{field.options?.map(option=><option key={option.index} value={option.index}>{option.label}</option>)}</select>:<input aria-label={`검색 ${row.label} ${field.id.endsWith('Min')?'최솟값':'최댓값'}`} key={field.id} value={String(draft.selections?.[field.id]??field.value)} maxLength={field.limit} inputMode="decimal" disabled={pending||!field.enabled} onChange={event=>selection(field.id,event.target.value)}/>)}</div>)}</div>
        <details className="spaced"><summary>고급 · 원본 검색 주소</summary><code className="similar-search-url">{data.url}</code></details></>}
      <div className="actions spaced"><button disabled={pending||disabled} onClick={()=>void read({...draft,league:draft.league?.trim()||undefined})}>검색 조건 갱신</button><button className="primary" disabled={!ready} onClick={()=>void openSearch()}>거래소에서 검색</button>{data&&!ready&&!pending&&!error&&<span className="muted">변경한 조건을 먼저 갱신하세요.</span>}</div>
    </div></section></div>}</>;
}
