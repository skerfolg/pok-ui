// Inspect original config/skill controls, preserving explicit false and source revision.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
require('tsx/cjs');const {PobRuntime}=require('../src/main/pob-runtime.ts');const {createBlankXml,editBuild}=require('../src/shared/pob-document.ts');
const runtime=new PobRuntime(path.resolve('resources/pob-runtime'));const report={at:new Date().toISOString(),passed:[]};
(async()=>{
  let xml=createBlankXml({defaultTreeVersion:'0_5',characterClass:{id:'Ranger',name:'Ranger',internalId:2,legacyId:2,ascendancies:[]}});
  xml=editBuild(xml,{type:'config',setId:'1',key:'conditionFullLife',value:false});
  const input={buildId:'synthetic-inspection',revision:1,xml};const [info,duplicate]=await Promise.all([runtime.inspect(input),runtime.inspect(input)]);
  assert.deepEqual(info,duplicate);assert.equal(info.revision,1);assert.equal(info.character.className,'Ranger');
  const fields=info.config.flatMap(s=>s.fields);assert(fields.length>100);report.sections=info.config.length;report.fields=fields.length;
  const fullLife=fields.find(f=>f.key==='conditionFullLife');assert(fullLife);assert.equal(fullLife.value,false);assert.equal(fullLife.checked,false);assert.equal(fullLife.showAll,true);
  const resistance=fields.find(f=>f.key==='resistancePenalty');assert(resistance.options.some(o=>o.value===-60));assert(resistance.options.some(o=>o.value===0));
  report.passed.push('native configuration sections, typed list values, explicit false and eligibility are preserved');
  xml=editBuild(xml,{type:'skill-add',setId:'1'});
  xml=editBuild(xml,{type:'skill-group',setId:'1',groupId:'1',group:{id:'1',label:'Ice Nova',slot:'',enabled:true,includeInFullDPS:true,attributes:{mainActiveSkill:'1'},gems:[{name:'Ice Nova',level:1,quality:0,enabled:true,attributes:{}}]}});
  const skill=await runtime.inspect({...input,revision:2,xml});report.skill=skill.skills[0];report.diagnostics=skill.diagnostics;
  assert(skill.skills[0].skills.length>0);assert.equal(skill.skills[0].sourceGemIndex,1);assert(skill.skills[0].modes.length>1);
  report.passed.push('original main skill/effect modes are read from the actual submitted group');
  const effect=skill.skills[0].grantedEffectId;
  const changed=editBuild(xml,{type:'gem-stat-set',setId:'1',groupId:'1',gemIndex:1,grantedEffectId:effect,index:2});
  const switched=await runtime.inspect({...input,revision:3,xml:changed});assert.equal(switched.skills[0].selectedMode,2);
  report.passed.push('XML stat-set child edits are recognised by the original PoB selector');
  const reset=editBuild(changed,{type:'config-remove',setId:'1',key:'conditionFullLife'});
  const cleared=await runtime.inspect({...input,revision:4,xml:reset});assert.equal(cleared.config.flatMap(s=>s.fields).find(f=>f.key==='conditionFullLife').checked,false);
  report.passed.push('resetting a condition removes the XML override without leaving a trial value behind');
  fs.mkdirSync('.local/standalone-pob',{recursive:true});fs.writeFileSync('.local/standalone-pob/inspection.json',JSON.stringify(skill,null,2));
})().catch(error=>{report.error=error.stack;process.exitCode=1;}).finally(()=>{runtime.close();fs.mkdirSync('.local/standalone-pob',{recursive:true});fs.writeFileSync('.local/standalone-pob/inspection-result.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));});
