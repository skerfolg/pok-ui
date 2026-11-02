import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import type {BuildEdit,BuildSetKind} from '../../shared/contracts';
const names:Record<BuildSetKind,string>={items:'장비',skills:'스킬',tree:'패시브',config:'전투 조건'};
export function SetControls({kind,sets,edit,disabled=false}:{kind:BuildSetKind;sets:{id:string;title:string;active:boolean}[];edit:(edit:BuildEdit,label:string)=>void;disabled?:boolean}){
  const active=sets.find(s=>s.active)??sets[0],name=names[kind];
  const [action,setAction]=useState<'create'|'copy'|'rename'|'delete'>(),[title,setTitle]=useState('');
  const menu=useRef<HTMLDetailsElement>(null);
  useEffect(()=>setAction(undefined),[active?.id,kind]);
  function open(next:typeof action){if(menu.current)menu.current.open=false;setTitle(next==='rename'?active?.title||'':next==='copy'?(active?.title||name)+' 복사본':`새 ${name} 세트`);setAction(next);}
  function apply(){
    if(action==='delete'&&active)edit({type:'set-remove',kind,id:active.id},`${name} 세트 삭제`);
    else if(action==='rename'&&active)edit({type:'set-rename',kind,id:active.id,title},`${name} 세트 이름 변경`);
    else if(action==='create'||action==='copy')edit({type:'set-add',kind,title,...(action==='copy'&&active?{copyFrom:active.id}:{})},`${name} 세트 ${action==='copy'?'복사':'생성'}`);
    setAction(undefined);
  }
  return <div className="set-controls">
    <select aria-label={`${name} 세트`} disabled={disabled} value={active?.id||''} onChange={e=>edit({type:'active-set',kind,id:e.target.value},`${name} 세트 변경`)}>
      {!sets.length&&<option value="">세트 없음</option>}{sets.map(s=><option key={s.id} value={s.id}>{s.title||`${name} ${s.id}`}</option>)}
    </select>
    <details ref={menu} className="set-menu"><summary aria-label={`${name} 세트 관리`} aria-disabled={disabled} onClick={e=>{if(disabled)e.preventDefault();}}>세트 관리</summary><div className="menu">
      <button type="button" disabled={kind==='tree'&&!sets.length} onClick={()=>open('create')}>새 {name} 세트</button>
      <button type="button" disabled={!active} onClick={()=>open('copy')}>{name} 세트 복사</button>
      <button type="button" disabled={!active} onClick={()=>open('rename')}>{name} 세트 이름 변경</button>
      <button type="button" disabled={sets.length<=1} onClick={()=>open('delete')}>{name} 세트 삭제</button>
    </div></details>
    {action&&createPortal(<div className="modal-backdrop"><form className="modal" role="dialog" aria-modal="true" aria-label={`${name} 세트 ${action}`} onSubmit={e=>{e.preventDefault();apply();}} onKeyDown={e=>{if(e.key==='Escape')setAction(undefined);}}>
      <h2>{name} 세트 {action==='create'?'생성':action==='copy'?'복사':action==='rename'?'이름 변경':'삭제'}</h2>
      {action==='delete'?<p>“{active?.title}” 세트를 삭제합니다. 다른 세트와 공유 아이템은 보존되며, 되돌리기로 복구할 수 있습니다.</p>:<label>세트 이름<input autoFocus required maxLength={200} aria-label={`${name} 세트 이름`} value={title} onChange={e=>setTitle(e.target.value)}/></label>}
      {action==='create'&&kind==='tree'&&<p className="muted note">현재 트리의 직업·전직·버전을 유지하고 할당이 없는 트리를 만듭니다.</p>}
      <div className="actions"><button type="button" onClick={()=>setAction(undefined)}>취소</button><button className="primary" type="submit" disabled={action!=='delete'&&!title.trim()}>{action==='delete'?'선택한 세트 삭제':'세트 적용'}</button></div>
    </form></div>,document.body)}
  </div>;
}
