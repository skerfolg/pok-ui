const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
require('tsx/cjs');const {PobRuntime}=require('../src/main/pob-runtime.ts'),{createBlankXml,editBuild,parseBuild}=require('../src/shared/pob-document.ts'),{createBuildDocument}=require('../src/shared/state.ts');
const runtime=new PobRuntime(path.resolve('resources/pob-runtime')),report={at:new Date().toISOString(),passed:[]};
(async()=>{
  let original=createBlankXml({defaultTreeVersion:'0_5',characterClass:{id:'Ranger',name:'Ranger',internalId:2,legacyId:2,ascendancies:[]}});
  original=editBuild(original,{type:'skill-add',setId:'1'});original=editBuild(original,{type:'skill-group',setId:'1',groupId:'1',group:{id:'1',label:'Fireball',slot:'',enabled:true,includeInFullDPS:true,attributes:{},gems:[{name:'Fireball',level:1,quality:0,enabled:true,attributes:{}}]}});
  const input={buildId:'synthetic-tree',revision:0,xml:original},inventory=await runtime.tree(input);assert(inventory.nodes.length>1000);
  const candidate=inventory.nodes.find(n=>n.pathLength>=4&&n.pathLength<9&&n.type==='Normal');assert(candidate);report.candidate=candidate;
  const preview=await runtime.tree({...input,nodeId:candidate.id,action:'allocate',allocMode:0});report.preview=preview;
  assert.equal(preview.diagnostics.length,0);assert(preview.added.length>=4);assert(preview.added.includes(candidate.id));
  const xml=editBuild(original,{type:'tree-native-patch',specId:'1',patch:preview.patch}),parsed=parseBuild(xml);assert(preview.added.every(id=>parsed.trees[0].nodes.includes(id)));
  const loaded=await runtime.tree({...input,revision:1,xml});assert.equal(loaded.counts.normal,preview.counts.normal);
  report.passed.push('original path allocation adds every connector and survives canonical XML reload');
  const connector=preview.path.at(-1);assert(connector);
  const removal=await runtime.tree({...input,revision:1,xml,nodeId:connector,action:'deallocate'});report.removal={id:connector,removed:removal.removed};assert(removal.removed.length>1);assert(removal.removed.includes(candidate.id));
  const cleared=editBuild(xml,{type:'tree-native-patch',specId:'1',patch:removal.patch});assert(!parseBuild(cleared).trees[0].nodes.includes(candidate.id));
  report.passed.push('original dependency removal removes downstream nodes rather than only the clicked ID');
  const weapon=await runtime.tree({...input,nodeId:candidate.id,action:'allocate',allocMode:1});assert.equal(weapon.diagnostics.length,0);assert(weapon.counts.weapon1>0);
  const weaponXml=editBuild(original,{type:'tree-native-patch',specId:'1',patch:weapon.patch}),weaponReload=await runtime.tree({...input,revision:2,xml:weaponXml});assert.equal(weaponReload.counts.weapon1,weapon.counts.weapon1);
  report.passed.push('weapon-set allocation uses original modes and reloads with the same allocation counts');
  const secondWeapon=await runtime.tree({...input,nodeId:candidate.id,action:'allocate',allocMode:2});const secondXml=editBuild(original,{type:'tree-native-patch',specId:'1',patch:secondWeapon.patch});const secondReload=await runtime.tree({...input,revision:2,xml:secondXml});assert.equal(secondReload.counts.weapon2,secondWeapon.counts.weapon2);assert(secondWeapon.counts.weapon2>0);
  const attributeCandidate=inventory.nodes.find(n=>n.isAttribute&&n.pathLength>0);report.attributeCandidate=attributeCandidate;assert(attributeCandidate,'original attribute candidate');
  if(attributeCandidate){const choice=await runtime.tree({...input,nodeId:attributeCandidate.id,action:'allocate'});assert(choice.node.attributeOptions.length);assert(choice.diagnostics.some(d=>d.code==='tree-attribute-required'));const allocated=await runtime.tree({...input,nodeId:attributeCandidate.id,action:'allocate',attributeIndex:2});assert.equal(allocated.diagnostics.length,0);assert(allocated.patch.attributeOverrides.dexNodes);report.passed.push('attribute allocation requires an explicit original option and persists native override metadata');}
  const baseline=await runtime.compute(createBuildDocument('Synthetic Tree Baseline',original)),calculation=await runtime.compute(createBuildDocument('Synthetic Tree',xml));assert.notEqual(calculation.result.ok,false);assert(calculation.result.stats.TotalDPS>baseline.result.stats.TotalDPS);report.stats={Life:calculation.result.stats.Life,Dex:calculation.result.stats.Dex,baselineDps:baseline.result.stats.TotalDPS,allocatedDps:calculation.result.stats.TotalDPS};
  await assert.rejects(runtime.tree({...input,nodeId:99999999,action:'allocate'}),/not available/);const after=await runtime.tree(input);assert.equal(after.counts.normal,inventory.counts.normal);
  report.passed.push('allocated XML reaches real calculation; invalid-node failure leaves the next input unchanged');
})().catch(error=>{report.error=error.stack;process.exitCode=1;}).finally(()=>{runtime.close();fs.mkdirSync('.local/standalone-pob',{recursive:true});fs.writeFileSync('.local/standalone-pob/tree-result.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));});
