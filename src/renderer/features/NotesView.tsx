import {useEffect,useRef,useState} from 'react';
import type {BuildEdit,ParsedBuild} from '../../shared/contracts';
export function NotesView({parsed,edit}:{parsed:ParsedBuild;edit:(edit:BuildEdit,label:string)=>void}){
  const [draft,setDraft]=useState(parsed.notes),[color,setColor]=useState('#ffffff'),[size,setSize]=useState(15);
  const input=useRef<HTMLTextAreaElement>(null);
  useEffect(()=>setDraft(parsed.notes),[parsed.notes]);
  function insert(){
    const field=input.current;if(!field)return;
    const start=field.selectionStart,end=field.selectionEnd,selection=draft.slice(start,end);
    const text='^x'+color.slice(1).toUpperCase()+selection+(selection?'^7':'');
    setDraft(draft.slice(0,start)+text+draft.slice(end));
    requestAnimationFrame(()=>{field.focus();field.setSelectionRange(start+text.length,start+text.length);});
  }
  return <section className="feature notes-view fill"><div className="page-heading"><h1>노트</h1><span className="muted">원본 PoB 색상 코드와 텍스트를 보존합니다.</span></div>
    <div className="actions"><label>삽입 색상<input type="color" aria-label="노트 색상" value={color} onChange={e=>setColor(e.target.value)}/></label><button onClick={insert}>색상 코드 삽입</button><label>글자 크기<input type="number" aria-label="노트 글자 크기" min={10} max={36} value={size} onChange={e=>setSize(Math.max(10,Math.min(36,Number(e.target.value))))}/></label></div>
    <label className="notes-editor">PoB 노트<textarea ref={input} aria-label="PoB 노트" spellCheck={false} style={{fontSize:size}} value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.ctrlKey&&e.key==='Enter'){e.preventDefault();edit({type:'notes',text:draft},'빌드 노트 편집');}}}/></label>
    <div className="actions"><button disabled={draft===parsed.notes} onClick={()=>setDraft(parsed.notes)}>변경 취소</button><button className="primary" disabled={draft===parsed.notes} onClick={()=>edit({type:'notes',text:draft},'빌드 노트 편집')}>노트 적용</button><span className="muted">Ctrl+Enter · 적용 후 되돌릴 수 있습니다.</span></div>
  </section>;
}
