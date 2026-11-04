import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import type {BuildDocument} from '../../shared/contracts';
import {useSessionDraft} from '../state/useSessionDraft';
type Snapshot=Pick<BuildDocument,'id'|'revision'|'xml'>;
export function ItemTextEditor({owner,build,text,label='편집',disabled=false,save,onEditingChange}:{owner:string;build:Snapshot;text:string;label?:string;disabled?:boolean;save:(snapshot:Snapshot,text:string)=>void|Promise<void>;onEditingChange?:(editing:boolean)=>void}){
  const [source,setSource]=useSessionDraft<{snapshot:Snapshot;text:string;initial:string}|undefined>('item-text:'+owner,'source',undefined),[error,setError]=useState(''),[saving,setSaving]=useState(false);
  const input=useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(()=>{onEditingChange?.(Boolean(source));},[Boolean(source),onEditingChange]);
  useEffect(()=>{if(!source)return;const opener=document.activeElement as HTMLElement|null;input.current?.focus();return()=>{if(opener?.isConnected)opener.focus();};},[Boolean(source)]);
  function close(){setSource(undefined);setError('');}
  async function submit(){if(!source||saving)return;if(source.text===source.initial){close();return;}setSaving(true);try{await save(source.snapshot,source.text);close();}catch(reason){setError(String(reason));}finally{setSaving(false);}}
  return <><button className="item-edit-button" disabled={disabled} onClick={()=>{setSource(previous=>previous||{snapshot:{...build},text,initial:text});setError('');}}>{label}</button>{source&&createPortal(<div className="modal-backdrop" onKeyDown={event=>{
    if(event.key==='Escape'){event.stopPropagation();if(!saving)close();}
    if(event.key==='Tab'){const controls=[...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),textarea:not(:disabled)')],first=controls[0],last=controls[controls.length-1];if(!first){event.preventDefault();return;}if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
  }}><section className="modal item-text-editor" role="dialog" aria-modal="true" aria-label="아이템 원문 편집"><header className="panel-heading"><h2>아이템 원문 편집</h2><button disabled={saving} onClick={close}>취소</button></header><div className="panel-body"><p className="muted note">적용하면 작업 중인 빌드와 계산에 즉시 반영합니다. 파일 저장은 상단 저장 버튼을 사용하세요.</p><label>PoB 아이템 텍스트<textarea ref={input} disabled={saving} aria-label="아이템 원문" spellCheck={false} value={source.text} onChange={event=>{setSource({...source,text:event.target.value});setError('');}}/></label>{error&&<p role="alert" className="warning">{error}</p>}</div><footer className="panel-heading"><button className="primary" disabled={saving||!source.text.trim()} onClick={()=>void submit()}>{saving?'적용 중…':'적용'}</button></footer></section></div>,document.body)}</>;
}
