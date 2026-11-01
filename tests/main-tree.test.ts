import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { PassiveTreeStore, TreeResourceError } from '../src/main/passive-tree';

function manifest(version='0_5'){
  const treeText=JSON.stringify({nodes:{'1':{skill:1,name:'Fixture'}},groups:{}});
  return {schemaVersion:1,version,treeFile:'tree.json',assets:{'Art/2DArt/SkillIcons/passives/Life.dds':{file:'skills-a1.webp',mime:'image/webp',width:64,height:64,x:128,y:64}},
    source:{project:'PathOfBuilding-PoE2',commit:'fixture',treeSha256:'source-fixture'},treeFileSha256:createHash('sha256').update(treeText).digest('hex')};
}
async function fixture(){
  const directory=await mkdtemp(join(tmpdir(),'pok-ui-tree-'));
  const root=join(directory,'resources');await mkdir(root);
  async function addVersion(version='0_5'){
    const folder=join(root,version);await mkdir(folder,{recursive:true});
    await writeFile(join(folder,'manifest.json'),JSON.stringify(manifest(version)));
    await writeFile(join(folder,'tree.json'),JSON.stringify({nodes:{'1':{skill:1,name:'Fixture'}},groups:{}}));
    await writeFile(join(folder,'skills-a1.webp'),Buffer.from([82,73,70,70]));
    return folder;
  }
  return {directory,root,addVersion,async cleanup(){
    assert.ok(resolve(directory).startsWith(resolve(tmpdir(),'pok-ui-tree-')));
    await rm(directory,{recursive:true,force:true});
  }};
}

test('bulk loader deduplicates concurrent loads and preserves raw nodes, source and atlas crop metadata',async()=>{
  const f=await fixture();
  try{
    const folder=await f.addVersion();const store=new PassiveTreeStore(f.root);
    const values=await Promise.all(Array.from({length:12},()=>store.load('0_5')));
    for(const value of values)assert.equal(value,values[0]);
    assert.deepEqual(values[0].tree.nodes,{'1':{skill:1,name:'Fixture'}});
    assert.equal(values[0].source.commit,'fixture');
    const asset=values[0].assets['Art/2DArt/SkillIcons/passives/Life.dds'];
    assert.deepEqual(asset,{url:'pok-tree://assets/0_5/skills-a1.webp',mime:'image/webp',width:64,height:64,x:128,y:64});
    await writeFile(join(folder,'tree.json'),'corrupt-after-cache');
    assert.equal(await store.load('0_5'),values[0]);
    assert.deepEqual(await store.asset(asset.url),{body:Uint8Array.from([82,73,70,70]),mime:'image/webp'});
  }finally{await f.cleanup();}
});

test('missing or failed versions can retry; different versions never silently fall back',async()=>{
  const f=await fixture();
  try{
    await f.addVersion('0_5');const store=new PassiveTreeStore(f.root);
    await assert.rejects(store.load('0_4'),/0_4/);
    await f.addVersion('0_4');assert.equal((await store.load('0_4')).version,'0_4');
    const folder=await f.addVersion('0_3');
    await writeFile(join(folder,'tree.json'),'broken');
    await assert.rejects(store.load('0_3'),/손상|해시/);
    await f.addVersion('0_3');assert.equal((await store.load('0_3')).version,'0_3');
  }finally{await f.cleanup();}
});

test('image protocol accepts only manifest-listed images and rejects traversal, encoded paths and other origins',async()=>{
  const f=await fixture();
  try{
    await f.addVersion();const store=new PassiveTreeStore(f.root);
    for(const candidate of [null,42,'','latest','../0_5','0_5/..','0_5%2F..','C:\\secret','0_5?x'])await assert.rejects(store.load(candidate),/형식/);
    for(const candidate of [
      'pok-tree://assets/0_5/../skills-a1.webp','pok-tree://assets/0_5/%2e%2e/skills-a1.webp',
      'pok-tree://assets/0_5/skills-a1.webp?path=secret','pok-tree://assets/0_5/skills-a1.webp#secret',
      'pok-tree://assets/0_5/skills%2da1.webp','pok-tree://assets/0_5/manifest.json',
      'pok-tree://other/0_5/skills-a1.webp','file:///0_5/skills-a1.webp',
      'pok-tree://assets/0_5/folder\\skills-a1.webp','pok-tree://user@assets/0_5/skills-a1.webp'
    ])await assert.rejects(store.asset(candidate),error=>error instanceof TreeResourceError&&error.status===400);
    await assert.rejects(store.asset('pok-tree://assets/0_5/not-listed.png'),error=>error instanceof TreeResourceError&&error.status===404);
  }finally{await f.cleanup();}
});

test('manifest cannot select another version, arbitrary files, remote URLs or executable content',async()=>{
  const f=await fixture();
  try{
    const folder=await f.addVersion();
    const invalid=[
      {...manifest(),version:'0_4'}, {...manifest(),treeFile:'../secret.json'},
      {...manifest(),assets:{escape:{file:'../secret.png',mime:'image/png',width:64,height:64}}},
      {...manifest(),assets:{escape:{file:'https://example.com/x.png',mime:'image/png',width:64,height:64}}},
      {...manifest(),assets:{escape:{file:'x.png',mime:'text/html',width:64,height:64}}},
      {...manifest(),assets:{escape:{file:'x.png',mime:'image/webp',width:64,height:64}}},
      {...manifest(),assets:{escape:{file:'x.png',mime:'image/png',width:0,height:64}}},
      {...manifest(),assets:{escape:{file:'x.png',mime:'image/png',width:64,height:64,x:-1}}},
    ];
    for(const value of invalid){await writeFile(join(folder,'manifest.json'),JSON.stringify(value));await assert.rejects(new PassiveTreeStore(f.root).load('0_5'),/매니페스트|충돌/);}
  }finally{await f.cleanup();}
});

test('resource directory junctions and symbolic links cannot escape the resource root',async()=>{
  const f=await fixture();
  try{
    await f.addVersion();
    await symlink(join(f.root,'0_5'),join(f.root,'0_4'),process.platform==='win32'?'junction':'dir');
    await assert.rejects(new PassiveTreeStore(f.root).load('0_4'),/심볼릭 링크/);
    const rootAlias=join(f.directory,'root-alias');
    await symlink(f.root,rootAlias,process.platform==='win32'?'junction':'dir');
    await assert.rejects(new PassiveTreeStore(rootAlias).load('0_5'),/심볼릭 링크/);
  }finally{await f.cleanup();}
});
