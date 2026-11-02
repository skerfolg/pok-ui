import test from 'node:test';
import assert from 'node:assert/strict';
import {createBlankXml,editBuild,parseBuild} from '../src/shared/pob-document';
import {createBuildDocument,createDefaultState} from '../src/shared/state';
import {changesTreeSelection,resolveTreeSetEdit} from '../src/shared/pob-tree-sets';
import {hashBuildXml} from '../src/shared/calculation-context';
import type {PobTreeRequest,PobTreeResult} from '../src/shared/pob-tree';
import {projectComparisonSide} from '../src/shared/build-comparison';
import {validateState} from '../src/main/storage';

async function response(request:PobTreeRequest):Promise<PobTreeResult>{
  return{buildId:request.buildId,revision:request.revision,xmlSha256:await hashBuildXml(request.xml),runtimeId:'synthetic-runtime',pobCommit:'a'.repeat(40),treeVersion:parseBuild(request.xml).trees.find(t=>t.active)!.version,patch:{attributes:{},buildAttributes:{className:'Native Class',ascendClassName:'Native Ascendancy'}},added:[],removed:[],modified:[],path:[],diagnostics:[],counts:{normal:0,ascendancy:0,secondaryAscendancy:0,sockets:0,weapon1:0,weapon2:0},character:{classId:3,ascendancyId:1,classes:[{id:3,label:'Native Class',ascendancies:[{id:1,label:'Native Ascendancy'}]}]}};
}
function build(){return createBuildDocument('Synthetic',editBuild(createBlankXml().replace('</Spec>','<FutureTree keep="yes"/></Spec>'),{type:'set-add',kind:'tree',title:'Second',copyFrom:'1'}));}
test('tree selection resolution uses native identity, preserves inactive XML and remains an unapplied atomic edit',async()=>{
  const snapshot=build(),original=snapshot.xml,operation={type:'active-set' as const,kind:'tree' as const,id:'1'};
  const result=await resolveTreeSetEdit(snapshot,operation,'synthetic-runtime',response),parsed=parseBuild(result.xml);
  assert.equal(snapshot.xml,original);assert.equal(snapshot.revision,0);assert.equal(parsed.className,'Native Class');assert.equal(parsed.ascendancy,'Native Ascendancy');assert.deepEqual(parsed.trees[1],{...parseBuild(original).trees[1],active:false});assert.match(result.xml,/<FutureTree keep="yes"\/>/);assert.equal(editBuild(original,result.edit),result.xml);
  assert(changesTreeSelection({type:'batch',edits:[operation]}));assert(!changesTreeSelection({type:'notes',text:'unchanged'}));
});
test('tree selection rejects wrong response ownership, identity and unexpected tree mutations',async()=>{
  const snapshot=build(),operation={type:'active-set' as const,kind:'tree' as const,id:'1'};
  for(const corrupt of [(r:PobTreeResult)=>({...r,revision:r.revision+1}),(r:PobTreeResult)=>({...r,runtimeId:'stale'}),(r:PobTreeResult)=>({...r,xmlSha256:'wrong'}),(r:PobTreeResult)=>({...r,patch:{...r.patch,buildAttributes:{className:'Wrong',ascendClassName:'Native Ascendancy'}}}),(r:PobTreeResult)=>({...r,added:[123]})]){
    await assert.rejects(resolveTreeSetEdit(snapshot,operation,'synthetic-runtime',async request=>corrupt(await response(request))));
  }
  assert.equal(snapshot.revision,0);
});
test('comparison native identity projects exact evidence, survives validation, and cannot change arbitrary build attributes',()=>{
  const snapshot=build(),side={snapshot,selection:{tree:'1'},treeIdentity:{className:'Native Class',ascendClassName:'Native Ascendancy'}},projected=projectComparisonSide(side),state=createDefaultState();
  assert.equal(parseBuild(projected.xml).className,'Native Class');assert.equal(snapshot.xml,side.snapshot.xml);state.comparisons=[{id:'synthetic-comparison',at:new Date().toISOString(),left:side,right:side}];assert.doesNotThrow(()=>validateState(state));
  (side.treeIdentity as Record<string,string>).level='100';assert.throws(()=>validateState(state),/직업 정보/);
});
