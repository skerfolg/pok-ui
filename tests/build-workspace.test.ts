import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createDefaultState,createBuildDocument,createChat} from '../src/shared/state';
import {createBlankXml,parseBuild} from '../src/shared/pob-document';
import {applyDocumentEdit,undoDocument,redoDocument,applyExpectedEdit} from '../src/shared/build-history';
import {duplicateDocument,removeDocument,restoreDocument,renameWorkspaceFolder,removeWorkspaceFolder} from '../src/shared/build-management';
import {comparisonSnapshot,comparisonNumbers,type BuildComparison} from '../src/shared/build-comparison';
import {StateStore,validateState} from '../src/main/storage';
import {describeActiveChanges} from '../src/shared/build-changes';
import {editBuild} from '../src/shared/pob-document';

test('undo and redo create new revisions; a branch edit invalidates redo and stale proposals',()=>{
  const original=createBuildDocument('Synthetic',createBlankXml());
  const edited=applyDocumentEdit(original,{type:'notes',text:'한글 <&>'},'노트');
  const undone=undoDocument(edited),redone=redoDocument(undone);
  assert.equal(undone.xml,original.xml);assert.equal(redone.xml,edited.xml);assert.equal(redone.revision,3);
  assert.equal(redone.originalXml,original.xml);
  assert.throws(()=>applyExpectedEdit(redone,edited,{type:'notes',text:'stale'},'stale'),/변경/);
  assert.throws(()=>applyExpectedEdit({...edited,xml:original.xml},edited,{type:'notes',text:'stale'},'stale'),/변경/);
  assert.equal(applyDocumentEdit(undone,{type:'notes',text:'branch'},'branch').redo?.length,0);
});

test('copy is independent and trash restores XML/history without stealing a rebound conversation',async()=>{
  let state=createDefaultState();const source=applyDocumentEdit(createBuildDocument('Synthetic',createBlankXml()),{type:'notes',text:'retained'},'note');
  const copy=duplicateDocument(source,'Copy'),chat=createChat(source.id);
  assert.notEqual(copy.id,source.id);assert.equal(copy.xml,source.xml);assert.equal(copy.revision,0);assert.equal(copy.undo.length,0);assert.equal(copy.calculation,undefined);
  state={...state,builds:[source,copy],activeBuildId:source.id,chats:[chat]};
  state=removeDocument(state,source.id);assert.equal(state.chats[0].buildId,undefined);
  const dir=await mkdtemp(join(tmpdir(),'pok-management-'));
  try{
    const store=new StateStore(dir);await store.save(state);state=await store.load();
    const restored=restoreDocument(state,source.id);assert.deepEqual(restored.builds[0],source);assert.equal(restored.chats[0].buildId,source.id);
    state.chats[0].buildId=copy.id;assert.equal(restoreDocument(state,source.id).chats[0].buildId,copy.id);
  }finally{await rm(dir,{recursive:true,force:true});}
});

test('nested folder operations preserve canonical XML and safely move contained documents',()=>{
  const build={...createBuildDocument('Synthetic',createBlankXml()),folder:'A/B/C'};
  const state={...createDefaultState(),builds:[build],folders:['A/B/Empty']};
  assert.throws(()=>renameWorkspaceFolder(state,'A','A/B'),/하위/);
  const renamed=renameWorkspaceFolder(state,'A/B','Other');assert.equal(renamed.builds[0].folder,'Other/C');
  const removed=removeWorkspaceFolder(renamed,'Other');assert.equal(removed.builds[0].folder,'');assert.equal(removed.builds[0].xml,build.xml);
});

test('comparison retains partial measured values, distinguishes missing from zero, and rejects malformed persisted inputs',()=>{
  const build=applyDocumentEdit(createBuildDocument('Synthetic',createBlankXml()),{type:'notes',text:'snapshot'},'note');
  const snapshot=comparisonSnapshot(build);assert.equal(snapshot.xml,build.xml);assert.equal(snapshot.undo.length,0);assert.equal(snapshot.calculation,undefined);
  const record:BuildComparison={id:'comparison',at:new Date().toISOString(),left:{snapshot,selection:{},calculation:{revision:1,at:new Date().toISOString(),restoreNotes:[],result:{ok:false,stats:{Life:0,OnlyLeft:2}}}},right:{snapshot,selection:{},calculation:{revision:1,at:new Date().toISOString(),restoreNotes:[],result:{ok:true,stats:{Life:10,OnlyRight:4}}}}};
  const values=comparisonNumbers(record);assert.deepEqual(values.find(r=>r.key==='Life'),{key:'Life',left:0,right:10,delta:10});
  assert.equal(values.find(r=>r.key==='OnlyRight')?.left,undefined);assert.equal(values.find(r=>r.key==='OnlyLeft')?.delta,undefined);
  const state={...createDefaultState(),comparisons:[record]};validateState(state);
  assert.throws(()=>validateState({...state,comparisons:[{...record,left:{...record.left,selection:{invalid:'x'}}}]}),/세트/);
  assert.equal(parseBuild(snapshot.xml).notes,'snapshot');
});

test('comparison explains selected config differences even when both sets already exist in the same XML',()=>{
  let xml=createBlankXml();xml=editBuild(xml,{type:'config',setId:'1',key:'testFlag',value:false});
  xml=editBuild(xml,{type:'set-add',kind:'config',title:'Alternative',copyFrom:'1'});
  const id=parseBuild(xml).configs.find(s=>s.active)!.id;
  xml=editBuild(xml,{type:'config',setId:id,key:'testFlag',value:true});
  const original=editBuild(xml,{type:'active-set',kind:'config',id:'1'});
  assert(describeActiveChanges(original,xml).some(line=>line==='활성 조건 testFlag: false → true'));
  assert.equal(parseBuild(original).configs.find(s=>s.active)?.id,'1');
});
