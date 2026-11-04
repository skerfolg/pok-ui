import test from 'node:test';
import assert from 'node:assert/strict';
import {createBlankXml,editBuild,parseBuild} from '../src/shared/pob-document';
import {createBuildDocument,createDefaultState} from '../src/shared/state';
import {applyDocumentEdit,undoDocument,redoDocument} from '../src/shared/build-history';
import {skillGroupEdit,type PobSkillGroups,type SkillTextInput} from '../src/shared/pob-skill-groups';
import {validateState} from '../src/main/storage';
import {exportDocument,importDocument} from '../src/main/pob-files';
import {duplicateDocument} from '../src/shared/build-management';
function fixture(){const xml=createBlankXml().replace('<Build ','<Build future="keep" '),input:SkillTextInput={inputRevision:0,inputXmlSha256:'b'.repeat(64),runtimeId:'pob-'+ 'c'.repeat(64),pobCommit:'a'.repeat(40),raw:'Fireball 1/0 1\n한국어 미해석 줄',lines:[{index:1,text:'Fireball 1/0 1',status:'gem',gems:[{name:'Fireball',level:1,quality:0,enabled:true}]},{index:2,text:'한국어 미해석 줄',status:'other',gems:[]}],warnings:['partial'],partial:true};const result:PobSkillGroups={operation:{action:'import-text',setId:'1',text:input.raw},setId:'1',groups:[],order:['new'],mainSocketGroup:1,calcsSkillNumber:1,text:{...input,canApply:true,groupId:'1',node:{tag:'Skill',attributes:{label:'Native',enabled:'true'},children:[{tag:'Gem',attributes:{nameSpec:'Fireball',level:'1',quality:'0',enabled:'true'},children:[]}]},companions:[{tag:'Spectre',id:'native-spectre'}]}};return{xml,input,result,build:createBuildDocument('Synthetic Text',xml)};}
test('native text appends only its original Skill and companion additions, retaining existing XML and inactive sets',()=>{
  const {xml,result}=fixture();let source=editBuild(xml,{type:'set-add',kind:'skills',title:'Inactive',copyFrom:'1'});source=editBuild(source,{type:'active-set',kind:'skills',id:'1'});const next=editBuild(source,skillGroupEdit(source,result));assert.equal(parseBuild(next).skillSets[0].groups[0].gems[0].name,'Fireball');assert.deepEqual(parseBuild(next).skillSets[1],parseBuild(source).skillSets[1]);assert.match(next,/future="keep"/);assert.match(next,/<Spectre id="native-spectre"\/>/);
  const repeated=editBuild(next,{type:'skill-import-native',setId:'1',node:result.text!.node!,companions:result.text!.companions!});assert.equal((repeated.match(/<Spectre /g)||[]).length,1);
});
test('raw input records do not change XML/revision/undo; applied evidence survives edits, undo/redo and restart independently of calculations',()=>{
  const {xml,input,result,build}=fixture(),recorded=applyDocumentEdit(build,{type:'input-record',input},'Record');assert.equal(recorded.xml,xml);assert.equal(recorded.revision,0);assert.equal(recorded.undo.length,0);assert.equal(recorded.inputEvidence?.[0].appliedRevision,undefined);
  const edit=skillGroupEdit(xml,result);assert.equal(edit.type,'batch');if(edit.type!=='batch')return;edit.edits=edit.edits.map(value=>value.type==='skill-import-native'?{...value,input}:value);const applied=applyDocumentEdit(recorded,edit,'Import');assert.equal(applied.revision,1);assert.equal(applied.inputEvidence?.length,2);assert.equal(applied.inputEvidence?.[1].appliedRevision,1);const changed=applyDocumentEdit(applied,{type:'notes',text:'later'},'Notes'),undone=undoDocument(changed),redone=redoDocument(undone);assert.deepEqual(redone.inputEvidence,applied.inputEvidence);assert.equal(redone.originalXml,xml);
  const state=createDefaultState();state.builds=[redone];state.activeBuildId=redone.id;const loaded=JSON.parse(JSON.stringify(state));validateState(loaded);assert.equal(loaded.builds[0].inputEvidence?.[0]?.raw,input.raw);
});
test('JSON document export/import and duplication keep historical source identity; malformed evidence is rejected',()=>{
  const {build,input}=fixture(),recorded=applyDocumentEdit(build,{type:'input-record',input},'Record'),imported=importDocument('synthetic.json',exportDocument(recorded,'json')),copy=duplicateDocument(recorded,'Copy');assert.notEqual(imported.id,build.id);assert.equal(imported.inputEvidence?.[0].buildId,build.id);assert.deepEqual(copy.inputEvidence,recorded.inputEvidence);
  const state=createDefaultState();state.builds=[structuredClone(recorded)];state.builds[0].inputEvidence![0].lines[0].status='forged' as never;assert.throws(()=>validateState(state),/줄 근거/);assert.throws(()=>applyDocumentEdit(build,{type:'input-record',input:{...input,inputRevision:1}},'Stale'),/revision/);
  const invalid=structuredClone(recorded);invalid.inputEvidence![0].trial={stats:{ReqInt:NaN},warnings:[]};assert.throws(()=>exportDocument(invalid,'json'),/시험 계산/);
});
test('readonly/blocked imports and mismatched text/node/order cannot be applied',()=>{
  const {xml,result}=fixture();assert.throws(()=>skillGroupEdit(xml,{...result,operation:{action:'export-text',setId:'1',groupId:'1'}}),/조회/);assert.throws(()=>skillGroupEdit(xml,{...result,text:{...result.text!,canApply:false}}),/출처/);assert.throws(()=>skillGroupEdit(xml,{...result,text:{...result.text!,raw:'different'}}),/출처/);assert.throws(()=>skillGroupEdit(xml,{...result,text:{...result.text!,node:{tag:'Tree',attributes:{},children:[]}}}),/출처/);assert.throws(()=>skillGroupEdit(xml,{...result,order:[]}),/출처/);
});
test('recording a blocked input alongside another edit never claims the text was applied',()=>{
  const {build,input}=fixture(),changed=applyDocumentEdit(build,{type:'batch',edits:[{type:'input-record',input},{type:'notes',text:'unrelated edit'}]},'Record and notes');assert.equal(changed.revision,1);assert.equal(changed.inputEvidence?.[0].appliedRevision,undefined);assert.equal(parseBuild(changed.xml).skillSets[0].groups.length,0);
  const unchanged=applyDocumentEdit(build,{type:'batch',edits:[{type:'input-record',input},{type:'main-skill-native',index:1}]},'Record only');assert.equal(unchanged.revision,0);assert.equal(unchanged.inputEvidence?.length,1);
});
