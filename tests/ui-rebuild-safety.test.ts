import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {BuildFileStore} from '../src/main/build-file-store';
import {createBuildDocument} from '../src/shared/state';
import {createBlankXml,editBuild,parseBuild} from '../src/shared/pob-document';
import {applyDocumentEdit,undoDocument} from '../src/shared/build-history';
import {breakdownLocation} from '../src/renderer/state/workspace-location';
test('explicit file save preserves its target across restart, detects external changes and separates save as',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'pok-build-save-'));
  assert(resolve(directory).startsWith(resolve(tmpdir())+sep));
  try{
    const file=join(directory,'build.xml'),other=join(directory,'other.xml'),build=createBuildDocument('Synthetic save',createBlankXml());
    const files=new BuildFileStore(directory);assert.equal(await files.save(build,async()=>undefined),null);
    assert((await files.save(build,async()=>file))?.xmlSha256);assert.equal(await readFile(file,'utf8'),build.xml);
    const next=applyDocumentEdit(build,{type:'notes',text:'synthetic revision'},'note');
    await new BuildFileStore(directory).save(next,async()=>{throw new Error('An established target must survive restart');});assert.equal(await readFile(file,'utf8'),next.xml);
    await writeFile(file,'external change');await assert.rejects(files.save(build,async()=>file),/앱 밖에서 변경/);assert.equal(await readFile(file,'utf8'),'external change');
    assert.equal((await files.save(build,async()=>other,true))?.name,'other');assert.equal(await readFile(other,'utf8'),build.xml);assert.equal(await readFile(file,'utf8'),'external change');
    await new BuildFileStore(directory).save(next,async()=>{throw new Error('Save As target was lost');});assert.equal(await readFile(other,'utf8'),next.xml);assert.equal(await readFile(file,'utf8'),'external change');
  }finally{await rm(directory,{recursive:true,force:true,maxRetries:10,retryDelay:100});}
});
test('inventory removal clears known active/inactive references and sockets; undo restores unknown XML exactly',()=>{
  let xml=createBlankXml();xml=editBuild(xml,{type:'item-equip',id:'1',setId:'1',slot:'Ring 1',text:'Rarity: NORMAL\nIron Ring'});
  xml=editBuild(xml,{type:'set-add',kind:'items',title:'Inactive',copyFrom:'1'});xml=editBuild(xml,{type:'active-set',kind:'items',id:'1'});
  xml=xml.replace('<Item id="1">','<Item id="1" future="keep">').replace('<Sockets/>','<Sockets><Socket nodeId="12" itemId="1" future="keep"/><FutureSocket/></Sockets>').replace('</PathOfBuilding2>','<FutureRoot/></PathOfBuilding2>');
  const build=createBuildDocument('Synthetic inventory',xml),next=applyDocumentEdit(build,{type:'item-remove',ids:['1']},'remove');
  const parsed=parseBuild(next.xml);assert.equal(parsed.items.length,0);assert(parsed.itemSets.every(set=>set.slots['Ring 1']==='0'));assert.equal(parsed.trees[0].sockets[0].itemId,'0');assert.match(next.xml,/<FutureSocket/);assert.match(next.xml,/future="keep"/);assert.match(next.xml,/<FutureRoot/);assert.equal(undoDocument(next).xml,xml);assert.equal(next.originalXml,xml);
  assert.throws(()=>editBuild(xml,{type:'item-remove',ids:['999']}),/찾지 못/);
});
test('breakdown navigation uses actual source ids and leaves unlocated sources unavailable',()=>{
  assert.deepEqual(breakdownLocation('Item:17:Synthetic','Ring 1'),{view:'equipment',itemId:'17',slot:'Ring 1'});
  assert.deepEqual(breakdownLocation('Tree:123'),{view:'tree',nodeId:123});
  assert.deepEqual(breakdownLocation('Skill:NativeEffect',undefined,{groupId:'2',grantedEffectId:'NativeEffect'}),{view:'skills',groupId:'2'});assert.equal(breakdownLocation('Skill:OtherEffect',undefined,{groupId:'2',grantedEffectId:'NativeEffect'}),undefined);
  assert.deepEqual(breakdownLocation('Config:syntheticCondition',undefined,{configKeys:['syntheticCondition']}),{view:'config',field:'syntheticCondition'});assert.equal(breakdownLocation('Config:unknown',undefined,{configKeys:['syntheticCondition']}),undefined);
  assert.equal(breakdownLocation('Quest:Example'),undefined);assert.equal(breakdownLocation('Many Sources:Unknown'),undefined);
});

test('an explicit manual level edit disables source auto-level even when the stored number is unchanged',()=>{
  const xml=createBlankXml().replace('characterLevelAutoMode="false"','characterLevelAutoMode="true"').replace('<Build ','<Build future="keep" '),build=createBuildDocument('Synthetic auto level',xml);
  const edited=applyDocumentEdit(build,{type:'character-level',level:1},'manual level');
  assert.equal(edited.revision,1);assert.match(edited.xml,/characterLevelAutoMode="false"/);assert.match(edited.xml,/future="keep"/);assert.equal(parseBuild(edited.xml).className,parseBuild(xml).className);assert.equal(undoDocument(edited).xml,xml);assert.throws(()=>editBuild(xml,{type:'character-level',level:1.5}),/캐릭터 레벨/);
});

test('adding a generated draft copies the full item node and metadata without overwriting the source library',()=>{
  const source=editBuild(createBlankXml(),{type:'item',id:'9',text:'Rarity: RARE\nSynthetic Draft\nIron Ring'}).replace('<Item id="9">','<Item id="9" variant="2" future="keep">').replace('</Item>','<ModRange id="1" range="0.25"/><FutureItem/></Item>');
  const target=editBuild(createBlankXml(),{type:'item',id:'1',text:'Rarity: NORMAL\nIron Ring'}),copied=editBuild(target,{type:'item-copy',sourceXml:source,sourceId:'9',id:'2'});
  assert.equal(parseBuild(copied).items.length,2);assert.match(copied,/<Item id="2" variant="2" future="keep"/);assert.match(copied,/<ModRange id="1" range="0.25"/);assert.match(copied,/<FutureItem/);assert.equal(parseBuild(target).items.length,1);assert.throws(()=>editBuild(target,{type:'item-copy',sourceXml:source,sourceId:'9',id:'1'}),/덮어쓸/);
});
