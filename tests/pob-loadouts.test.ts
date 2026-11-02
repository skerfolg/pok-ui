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
test('native management lineage reorders and copies exact source nodes without rebuilding unknown fields or shared item storage',()=>{
  const {xml}=fixture(),base=parseBuild(xml),sets=Object.fromEntries((['tree','items','skills','config'] as const).map(kind=>[kind,[{id:'1',sourceId:'1'},{id:'2',sourceId:'2'},{id:'3',copyFrom:'2',title:'Copy'}]])) as import('../src/shared/pob-loadouts').PobLoadoutSets;
  sets.tree=[{id:'1',sourceId:'2'},{id:'2',sourceId:'1'},{id:'3',copyFrom:'2',title:'Copy'}];
  const next=editBuild(xml,{type:'loadout-native-sets',sets}),parsed=parseBuild(next);assert.equal(parsed.trees[0].title,base.trees[1].title);assert.equal(parsed.trees[2].title,'Copy');assert.equal((next.match(/<FutureSpec keep="yes"\/>/g)||[]).length,3);assert.deepEqual(parsed.items,base.items);
  const unsafe=structuredClone(sets);unsafe.tree[0].sourceId='missing';assert.throws(()=>editBuild(xml,{type:'loadout-native-sets',sets:unsafe}),/원본 XML 세트/);
  const duplicate=structuredClone(sets);duplicate.items[2]={id:'3',sourceId:'1'};assert.throws(()=>editBuild(xml,{type:'loadout-native-sets',sets:duplicate}),/중복/);
});
test('fresh native sets accept only the declared XML set type and cannot replace their parent section',()=>{
  const {xml}=fixture(),sets=Object.fromEntries((['tree','items','skills','config'] as const).map(kind=>[kind,[{id:'1',sourceId:'1'},{id:'2',sourceId:'2'}]])) as import('../src/shared/pob-loadouts').PobLoadoutSets;
  sets.skills.push({id:'3',node:{tag:'SkillSet',attributes:{id:'3',title:'Fresh'},children:[]}});assert.equal(parseBuild(editBuild(xml,{type:'loadout-native-sets',sets})).skillSets[2].title,'Fresh');
  sets.skills[2].node!.tag='Skills';assert.throws(()=>editBuild(xml,{type:'loadout-native-sets',sets}),/태그/);
});
