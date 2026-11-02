// Actual upstream metadata and item APIs; no PoK, KB, Python or legacy catalogue.
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
require('tsx/cjs');const {PobRuntime}=require('../src/main/pob-runtime.ts');
const runtime=new PobRuntime(path.resolve('resources/pob-runtime'));const report={at:new Date().toISOString(),passed:[]};
(async()=>{
  const catalog=await runtime.catalog();
  report.source=catalog.source;report.classes=catalog.classes.slice(0,2);
  report.counts=Object.fromEntries(['base','unique','mod','gem','skill'].map(type=>[type,catalog.entries.filter(e=>e.type===type).length]));
  for(const type of Object.keys(report.counts))assert(report.counts[type]>0,type);
  assert(catalog.classes.length>0);for(const c of catalog.classes){assert(Number.isInteger(c.internalId));assert(Number.isInteger(c.legacyId));assert(c.name);}
  report.passed.push('all original catalogue types and class identities are exported without PoK');
  const base=await runtime.renderItem({kind:'base',id:'Iron Ring'},catalog.source.runtimeId);assert(base.ok&&base.text.includes('Iron Ring'));
  const rare=await runtime.renderItem({kind:'rare',id:'Iron Ring',mods:['mod:Item:Strength1'],rolls:{'mod:Item:Strength1':1}},catalog.source.runtimeId);
  assert(rare.ok);assert.match(rare.text,/\+8 to Strength/);report.passed.push('original Item/Craft builds a normal base and applies a real affix roll');
  const unique=catalog.entries.find(e=>e.type==='unique'&&e.name==='The Anvil');assert(unique);
  const rendered=await runtime.renderItem({kind:'unique',id:unique.id,variants:[unique.variants.at(-1).id]},catalog.source.runtimeId);
  assert(rendered.ok&&rendered.text.includes('The Anvil'));report.passed.push('original unique database and explicit variant produce raw item text');
  await assert.rejects(runtime.renderItem({kind:'base',id:'not-a-base'},catalog.source.runtimeId));
  await assert.rejects(runtime.renderItem({kind:'base',id:'Iron Ring',slot:'Helmet'},catalog.source.runtimeId),/not valid for slot/);
  await assert.rejects(runtime.renderItem({kind:'base',id:'Iron Ring'},'pob-obsolete'));
  report.passed.push('unknown items and mismatched catalogue/runtime identities are rejected');
  fs.mkdirSync('.local/standalone-pob',{recursive:true});fs.writeFileSync('.local/standalone-pob/catalog-probe.json',JSON.stringify(catalog));
})().catch(error=>{report.error=error.stack;process.exitCode=1;}).finally(()=>{runtime.close();fs.mkdirSync('.local/standalone-pob',{recursive:true});fs.writeFileSync('.local/standalone-pob/editor-result.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));});
