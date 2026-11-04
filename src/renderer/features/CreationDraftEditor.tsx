import {ItemSummary} from '../components/ItemSummary';
import {useSessionDraft} from '../state/useSessionDraft';
import {useRef,useState} from 'react';
import type {BuildDocument,BuildEdit} from '../../shared/contracts';
import {createBuildDocument} from '../../shared/state';
import {editBuild,parseBuild} from '../../shared/pob-document';
import {applyExpectedEdit} from '../../shared/build-history';
import {NativeItemEditor} from './NativeItemEditor';

export function CreationDraftEditor({owner,base,text,itemId,runtimeId,current,add}:{owner:string;base:BuildDocument;text:string;itemId:string;runtimeId?:string;current:boolean;add:(draft:BuildDocument,itemId:string)=>void}){
  const [draftItemId]=useSessionDraft(owner,'item-id',itemId);
  const [draft,setDraft]=useSessionDraft(owner,'document',()=>createBuildDocument('아이템 생성 초안',editBuild(base.xml,{type:'item',id:itemId,text})));
  const [busy,setBusy]=useState(true);
  const latest=useRef(draft);latest.current=draft;
  const item=parseBuild(draft.xml).items.find(item=>item.id===draftItemId)!;
  function apply(snapshot:Pick<BuildDocument,'id'|'revision'|'xml'>,operation:BuildEdit,label:string){const next=applyExpectedEdit(latest.current,snapshot,operation,label);latest.current=next;setDraft(next);return next;}
  return <div className="creation-draft"><p className="muted">생성 초안 · 아래 옵션은 이 초안에만 반영됩니다. 아직 보유·장착 목록에 추가하지 않았습니다.</p><ItemSummary item={item}/><NativeItemEditor build={draft} item={item} runtimeId={current?runtimeId:undefined} applyExpected={apply} onBusyChange={setBusy}/><button className="primary" disabled={!current||busy} onClick={()=>add(latest.current,draftItemId)}>Add to build</button>{!current&&<p className="warning">기준 입력 또는 PoB가 변경되었습니다. 초안을 유지했으며 현재 입력에서 다시 생성한 뒤 추가할 수 있습니다.</p>}</div>;
}
