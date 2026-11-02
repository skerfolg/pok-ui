import {useMemo,useState} from 'react';
import type {AppState} from '../../shared/contracts';
import {buildName,buildFolder,duplicateDocument,removeDocument,restoreDocument,workspaceFolders,renameWorkspaceFolder,removeWorkspaceFolder} from '../../shared/build-management';
type Dialog={action:'rename'|'copy'|'delete'|'purge'|'folder-create'|'folder-rename'|'folder-remove';id?:string;folder?:string};
export function BuildsView({state,update,open,create,importFile,lockedIds=[]}:{state:AppState;update:(fn:(state:AppState)=>AppState)=>void;open:(id:string)=>void;create:()=>void;importFile:()=>void;lockedIds?:string[]}){
  const [query,setQuery]=useState(''),[folder,setFolder]=useState('*'),[trash,setTrash]=useState(false),[dialog,setDialog]=useState<Dialog>(),[name,setName]=useState(''),[targetFolder,setTargetFolder]=useState(''),[error,setError]=useState('');
  const folders=useMemo(()=>workspaceFolders(state),[state.folders,state.builds]);
  const rows=state.builds.filter(b=>(folder==='*'||(b.folder||'')===folder||(folder&&b.folder?.startsWith(folder+'/')))&&(!query.trim()||`${b.name} ${b.folder||''} ${b.sourceName}`.toLowerCase().includes(query.trim().toLowerCase())));
  const selected=dialog?.id?state.builds.find(b=>b.id===dialog.id)||state.trash?.find(t=>t.build.id===dialog.id)?.build:undefined;
  function show(action:Dialog['action'],id?:string){
    const build=state.builds.find(b=>b.id===id)||state.trash?.find(t=>t.build.id===id)?.build;
    setDialog({action,id,folder:folder==='*'?'':folder});setName(action==='copy'?(build?.name||'빌드')+' 복사본':build?.name||(action==='folder-create'?'새 폴더':folder));setTargetFolder(build?.folder||(folder==='*'?'':folder));setError('');
  }
  function apply(){
    if(!dialog)return;try{
      const d=dialog;
      update(s=>{
        if(d.action==='delete'){if(lockedIds.includes(d.id!))throw new Error('실행 중인 대화를 먼저 중지해 주세요.');return removeDocument(s,d.id!);}
        if(d.action==='purge')return{...s,trash:s.trash?.filter(t=>t.build.id!==d.id)};
        if(d.action==='folder-create'){const path=buildFolder(name);if(!path)throw new Error('폴더 이름을 입력해 주세요.');return{...s,folders:[...new Set([...(s.folders||[]),path])]};}
        if(d.action==='folder-rename')return renameWorkspaceFolder(s,d.folder!,name);
        if(d.action==='folder-remove')return removeWorkspaceFolder(s,d.folder!);
        const build=s.builds.find(b=>b.id===d.id);if(!build)throw new Error('대상 빌드가 없어졌습니다.');
        if(d.action==='copy'){const copied={...duplicateDocument(build,name),folder:buildFolder(targetFolder)};return{...s,builds:[...s.builds,copied],activeBuildId:copied.id};}
        return{...s,builds:s.builds.map(b=>b.id===build.id?{...b,name:buildName(name),folder:buildFolder(targetFolder),updatedAt:new Date().toISOString()}:b)};
      });setDialog(undefined);
    }catch(reason){setError(String(reason));}
  }
  return <section className="feature scroll"><div className="page-heading"><h1>빌드 관리</h1><span className="muted">{state.builds.length}개 · 작업 공간 폴더</span><div className="actions"><button onClick={create}>새 빌드</button><button onClick={importFile}>가져오기</button></div></div>
    <div className="actions"><input type="search" aria-label="빌드 검색" placeholder="빌드 이름·폴더·원본 파일 검색" value={query} onChange={e=>setQuery(e.target.value)}/><label>폴더<select aria-label="빌드 폴더" value={folder} onChange={e=>setFolder(e.target.value)}><option value="*">모든 폴더</option><option value="">최상위</option>{folders.map(f=><option key={f} value={f}>{f}</option>)}</select></label><button onClick={()=>show('folder-create')}>폴더 만들기</button><button disabled={!folder||folder==='*'} onClick={()=>show('folder-rename')}>폴더 이름 변경</button><button disabled={!folder||folder==='*'} onClick={()=>show('folder-remove')}>폴더 정리</button><label className="check"><input type="checkbox" checked={trash} onChange={e=>setTrash(e.target.checked)}/>삭제 보관함 · {state.trash?.length||0}</label></div>
    <p className="muted note">폴더는 작업 공간의 분류입니다. 이름 변경·이동·삭제는 원본 PoB 파일을 변경하지 않습니다.</p>
    {error&&!dialog&&<p role="alert" className="warning">{error}</p>}
    {!trash?<div className="build-management-list">{rows.map(b=><article className="panel build-management-row" key={b.id}><div><h2>{b.name}</h2><p className="muted">{b.folder||'최상위'} · 리비전 {b.revision}{b.sourceName?' · '+b.sourceName:''}</p></div><div className="actions"><button aria-label={`${b.name} 열기`} onClick={()=>open(b.id)}>열기</button><button aria-label={`${b.name} 이름·폴더 변경`} onClick={()=>show('rename',b.id)}>이름·폴더</button><button aria-label={`${b.name} 복사`} onClick={()=>show('copy',b.id)}>복사</button><button aria-label={`${b.name} 삭제`} disabled={lockedIds.includes(b.id)} onClick={()=>show('delete',b.id)}>삭제</button></div></article>)}{!rows.length&&<p className="muted">일치하는 빌드가 없습니다.</p>}</div>:<div className="build-management-list">{state.trash?.map(record=><article className="panel build-management-row" key={record.build.id}><div><h2>{record.build.name}</h2><p className="muted">{new Date(record.deletedAt).toLocaleString()} · 리비전 {record.build.revision}</p></div><div className="actions"><button aria-label={`${record.build.name} 복원`} onClick={()=>{try{update(s=>restoreDocument(s,record.build.id));}catch(reason){setError(String(reason));}}}>복원</button><button aria-label={`${record.build.name} 영구 제거`} onClick={()=>show('purge',record.build.id)}>영구 제거</button></div></article>)}</div>}
    {dialog&&<div className="modal-backdrop"><form className="modal" role="dialog" aria-modal="true" aria-label="빌드 관리 작업" onSubmit={e=>{e.preventDefault();apply();}}><h2>{dialog.action.startsWith('folder-')?'폴더 관리':selected?.name}</h2>
      {['rename','copy','folder-create','folder-rename'].includes(dialog.action)?<><label>이름<input autoFocus required maxLength={dialog.action.startsWith('folder-')?400:200} aria-label="관리 이름" value={name} onChange={e=>setName(e.target.value)}/></label>{['rename','copy'].includes(dialog.action)&&<label>작업 공간 폴더<input aria-label="관리 폴더" value={targetFolder} onChange={e=>setTargetFolder(e.target.value)} list="build-folder-options"/><datalist id="build-folder-options">{folders.map(f=><option key={f} value={f}/>)}</datalist></label>}</>:<p>{dialog.action==='purge'?'보관 중인 XML과 편집 기록을 작업 공간에서 영구 제거합니다.':dialog.action==='folder-remove'?'이 폴더와 하위 분류를 정리하고 포함 빌드는 상위 폴더로 이동합니다.':'빌드를 삭제 보관함으로 이동합니다. 대화는 보존하고 연결을 해제하며 나중에 복원할 수 있습니다.'} 원본 파일은 변경하지 않습니다.</p>}
      {error&&<p className="warning" role="alert">{error}</p>}<div className="actions"><button type="button" onClick={()=>setDialog(undefined)}>취소</button><button className="primary" type="submit">{dialog.action==='purge'?'영구 제거 확인':'관리 적용'}</button></div>
    </form></div>}
  </section>;
}
