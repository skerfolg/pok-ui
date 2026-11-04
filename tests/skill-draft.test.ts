import test from 'node:test';
import assert from 'node:assert/strict';
import {SkillDraft} from '../src/shared/skill-draft';
import type {SkillGroup} from '../src/shared/contracts';
const group=():SkillGroup=>({id:'1',label:'Synthetic',slot:'',enabled:true,includeInFullDPS:true,attributes:{future:'keep'},gems:[{name:'Fireball',level:1,quality:0,enabled:true,attributes:{future:'keep'}}]});
test('valid group edits commit once and adopt canonical attributes instead of resubmitting stale DTOs',()=>{
  const model=new SkillDraft(group());model.change({...model.value,gems:model.value.gems.map(g=>({...g,level:5}))});let calls=0;
  assert(model.flush(value=>{calls++;return{...value,gems:value.gems.map(g=>({...g,attributes:{...g.attributes,level:'5'}}))};}));assert(model.flush(()=>{throw Error('duplicate commit');}));assert.equal(calls,1);assert.equal(model.value.gems[0].attributes.level,'5');
});
test('incomplete drafts survive reconstruction without entering canonical XML',()=>{
  const model=new SkillDraft(group());model.change({...model.value,gems:[{...model.value.gems[0],name:''}]});assert.equal(model.flush(()=>{throw Error('must not commit');}),false);
  const restored=new SkillDraft(group(),{base:model.base,value:model.value});assert.equal(restored.value.gems[0].name,'');assert.equal(restored.valid,false);assert.equal(restored.base.gems[0].name,'Fireball');
});
test('external group edits retain the user draft and a conflicting commit never overwrites them',()=>{
  const model=new SkillDraft(group());model.change({...model.value,label:'Pending name'});const external={...group(),label:'External name'};model.receive(external);assert.match(model.error,/원본 그룹/);assert.equal(model.value.label,'Pending name');
  assert.equal(model.flush(()=>{throw Error('원본 그룹 충돌');}),false);assert.equal(external.label,'External name');model.reset(external);assert.equal(model.dirty,false);
});

test('raw incomplete numeric input survives restoration and follows its gem when a different row is removed',()=>{
  const value=group();value.gems[0].sourceIndex=1;value.gems.push({...structuredClone(value.gems[0]),sourceIndex:2,name:'Ice Nova'});
  const model=new SkillDraft(value);model.number(1,'quality','-');assert.equal(model.valid,false);assert.equal(model.value.gems[1].quality,0);
  model.change({...model.value,gems:model.value.gems.slice(1)});assert.equal(model.numbers['0:quality'],'-');assert.equal(model.numbers['1:quality'],undefined);
  const restored=new SkillDraft(value,{base:model.base,value:model.value,numbers:model.numbers});assert.equal(restored.numbers['0:quality'],'-');assert.equal(restored.valid,false);restored.number(0,'quality','5');assert(restored.valid);assert(restored.flush(next=>next));assert.equal(restored.value.gems[0].name,'Ice Nova');assert.equal(restored.value.gems[0].quality,5);
});


test('gem inputs have no invented game ceiling and reject numbers that cannot be represented exactly',()=>{
 const model=new SkillDraft(group());model.number(0,'quality','101');assert(model.valid);assert.equal(model.value.gems[0].quality,101);model.number(0,'level','200');assert(model.valid);assert.equal(model.value.gems[0].level,200);model.number(0,'quality',String(Number.MAX_SAFE_INTEGER+1));assert.equal(model.valid,false);assert.equal(model.value.gems[0].quality,101);
});
