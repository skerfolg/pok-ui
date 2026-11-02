import test from 'node:test';
import assert from 'node:assert/strict';
import {createBlankXml,editBuild,parseBuild} from '../src/shared/pob-document';
import {loadoutEdit,type PobLoadouts} from '../src/shared/pob-loadouts';
import {describeActiveChanges} from '../src/shared/build-changes';
function fixture(){let xml=createBlankXml().replace('</Spec>','<FutureSpec keep="yes"/></Spec>');for(const kind of ['tree','items','skills','config'] as const){xml=editBuild(xml,{type:'set-add',kind,title:'Beta',copyFrom:'1'});xml=editBuild(xml,{type:'active-set',kind,id:'1'});}const selection={tree:'2',items:'2',skills:'2',config:'2'},result:PobLoadouts={buildId:'synthetic',revision:0,xmlSha256:'synthetic',runtimeId:'synthetic',pobCommit:'a'.repeat(40),choices:[{name:'Beta',label:'Beta',selection}],selection,requestedName:'Beta',identity:{className:'Native Class',ascendClassName:'Native Ascendancy'},equipment:{useSecondWeaponSet:true,mainSocketGroup:1},diagnostics:[]};return{xml,result};}
test('native loadout projection atomically selects all four sets and owned character/weapon state while preserving original XML metadata',()=>{
  const {xml,result}=fixture(),next=editBuild(xml,loadoutEdit({xml},result)),parsed=parseBuild(next);
  for(const sets of [parsed.trees,parsed.itemSets,parsed.skillSets,parsed.configs])assert.equal(sets.find(set=>set.active)?.id,'2');assert.equal(parsed.className,'Native Class');assert.equal(parsed.ascendancy,'Native Ascendancy');assert.equal(parsed.itemSets[1].useSecondWeaponSet,true);assert.match(next,/<FutureSpec keep="yes"\/>/);assert.equal(parseBuild(xml).trees.find(set=>set.active)?.id,'1');assert.deepEqual(parsed.trees[0].attributes,parseBuild(xml).trees[0].attributes);assert(describeActiveChanges(xml,next).some(line=>line==='활성 무기 세트: I → II'));
});
test('loadout projection rejects unavailable sets and a response that differs from the requested original choice',()=>{
  const {xml,result}=fixture();assert.throws(()=>loadoutEdit({xml},{...result,requestedName:'Unknown'}),/요청/);assert.throws(()=>loadoutEdit({xml},{...result,selection:{...result.selection,tree:'999'}}),/세트 ID/);assert.throws(()=>loadoutEdit({xml},{...result,selection:{...result.selection,items:'1'}}),/요청/);
});
