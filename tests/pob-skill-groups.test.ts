import test from 'node:test';
import assert from 'node:assert/strict';
import {createBlankXml,editBuild,parseBuild} from '../src/shared/pob-document';
import {skillGroupEdit,type PobSkillGroups} from '../src/shared/pob-skill-groups';
import {DOMParser,XMLSerializer} from '@xmldom/xmldom';
function fixture(){let xml=createBlankXml();for(let i=0;i<3;i++)xml=editBuild(xml,{type:'skill-add',setId:'1'});const document=new DOMParser().parseFromString(xml,'application/xml'),groups=document.getElementsByTagName('Skill');for(let i=0;i<groups.length;i++){groups[i].setAttribute('future',String(i+1));const marker=document.createElement('Future');marker.appendChild(document.createTextNode('keep '+i));groups[i].appendChild(marker);}return new XMLSerializer().serializeToString(document);}
function result(xml:string):PobSkillGroups{const ids=parseBuild(xml).skillSets[0].groups.map(group=>group.id);return{operation:{action:'reorder',setId:'1',groupId:'1',position:ids.length},setId:'1',groups:ids.map(id=>({id,label:'same',canDelete:true})),order:[...ids.slice(1),ids[0]],mainSocketGroup:ids.length,calcsSkillNumber:1};}
test('native group projection moves exact deep source nodes and preserves inactive XML and unknown sibling positions',()=>{
  let xml=fixture();xml=editBuild(xml,{type:'set-add',kind:'skills',title:'Inactive',copyFrom:'1'});xml=editBuild(xml,{type:'active-set',kind:'skills',id:'1'});const document=new DOMParser().parseFromString(xml,'application/xml'),set=document.getElementsByTagName('SkillSet')[0],marker=document.createElement('FutureSibling');set.insertBefore(marker,set.getElementsByTagName('Skill')[1]);xml=new XMLSerializer().serializeToString(document);
  const before=new DOMParser().parseFromString(xml,'application/xml').getElementsByTagName('SkillSet')[1].toString(),data=result(xml),next=editBuild(xml,skillGroupEdit(xml,data)),parsed=parseBuild(next);
  assert.deepEqual(parsed.skillSets[0].groups.map(group=>group.attributes.future),data.order);assert.equal(parsed.mainSocketGroup,data.mainSocketGroup);
  const updated=new DOMParser().parseFromString(next,'application/xml');assert.equal(updated.getElementsByTagName('SkillSet')[1].toString(),before);assert.equal(updated.getElementsByTagName('SkillSet')[0].childNodes[1].nodeName,'FutureSibling');assert.equal(updated.getElementsByTagName('Future').length,parsed.skillSets[0].groups.length*2);assert.match(next,/name="skill_number"/);
});
test('native last-group deletion preserves an empty set and original fallback selectors',()=>{
  let xml=createBlankXml();if(!parseBuild(xml).skillSets[0].groups.length)xml=editBuild(xml,{type:'skill-add',setId:'1'});
  const data:PobSkillGroups={operation:{action:'delete',setId:'1',groupId:'1'},setId:'1',groups:[{id:'1',label:'',canDelete:true}],order:[],mainSocketGroup:1,calcsSkillNumber:1};
  const next=editBuild(xml,skillGroupEdit(xml,data));assert.equal(parseBuild(next).skillSets[0].groups.length,0);assert.equal(parseBuild(next).mainSocketGroup,1);
});
test('native group projection rejects stale set, mismatched order, invalid selectors and inspect-only responses',()=>{
  const xml=fixture(),data=result(xml);
  assert.throws(()=>skillGroupEdit(xml,{...data,setId:'2'}),/세트/);
  assert.throws(()=>skillGroupEdit(xml,{...data,order:['1','1']}),/순서/);
  assert.throws(()=>skillGroupEdit(xml,{...data,calcsSkillNumber:999}),/선택값/);
  assert.throws(()=>skillGroupEdit(xml,{...data,operation:{action:'inspect',setId:'1'}}),/조회/);
  assert.throws(()=>editBuild(xml,{type:'skill-native-order',setId:'1',order:['01']}),/출처/);
});
test('native copy and cross-set move preserve complete source XML with independent target objects',()=>{
  let xml=fixture();xml=editBuild(xml,{type:'set-add',kind:'skills',title:'Destination',copyFrom:'1'});xml=editBuild(xml,{type:'active-set',kind:'skills',id:'1'});
  const ids=parseBuild(xml).skillSets[0].groups.map(group=>group.id),base=result(xml),transfer={sourceSetId:'1',sourceGroupId:'1',targetSetId:'2',targetGroupId:String(ids.length+1),move:false};
  const data:PobSkillGroups={...base,operation:{action:'copy',setId:'1',groupId:'1',targetSetId:'2'},order:ids,mainSocketGroup:1,calcsSkillNumber:1,transfer};
  const copied=editBuild(xml,skillGroupEdit(xml,data)),doc=new DOMParser().parseFromString(copied,'application/xml'),sets=doc.getElementsByTagName('SkillSet');
  assert.equal(sets[0].getElementsByTagName('Skill')[0].toString(),sets[1].getElementsByTagName('Skill')[ids.length].toString());assert.equal(parseBuild(copied).skillSets[0].groups.length,ids.length);assert.equal(parseBuild(copied).skillSets[1].groups.length,ids.length+1);
  const moved=editBuild(xml,skillGroupEdit(xml,{...data,operation:{...data.operation,action:'move'},order:ids.slice(1),transfer:{...transfer,move:true}}));assert.equal(parseBuild(moved).skillSets[0].groups.length,ids.length-1);assert.equal(parseBuild(moved).skillSets[1].groups.at(-1)?.attributes.future,'1');
  const local=editBuild(xml,skillGroupEdit(xml,{...data,operation:{...data.operation,targetSetId:'1'},order:[...ids,'1'],transfer:{...transfer,targetSetId:'1'}}));assert.equal(parseBuild(local).skillSets[0].groups.at(-1)?.attributes.future,'1');assert.deepEqual(parseBuild(local).skillSets[1],parseBuild(xml).skillSets[1]);
});
test('native transfer refuses missing/forged lineage, wrong target position and movement within the same set',()=>{
  const xml=fixture(),base=result(xml),ids=parseBuild(xml).skillSets[0].groups.map(group=>group.id),data:PobSkillGroups={...base,operation:{action:'copy',setId:'1',groupId:'1',targetSetId:'1'},order:[...ids,'1'],mainSocketGroup:1,calcsSkillNumber:1,transfer:{sourceSetId:'1',sourceGroupId:'1',targetSetId:'1',targetGroupId:String(ids.length+1),move:false}};
  assert.throws(()=>skillGroupEdit(xml,{...data,transfer:undefined}),/출처/);assert.throws(()=>skillGroupEdit(xml,{...data,transfer:{...data.transfer!,sourceGroupId:'2'}}),/출처/);assert.throws(()=>skillGroupEdit(xml,{...data,transfer:{...data.transfer!,targetGroupId:'99'}}),/출처/);assert.throws(()=>skillGroupEdit(xml,{...data,operation:{...data.operation,action:'move'},transfer:{...data.transfer!,move:true}}),/출처/);
});
