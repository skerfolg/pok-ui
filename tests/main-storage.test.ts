import {workspaceInputVersions} from '../src/shared/build-revision';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { StateStore, validateState,assertWorkspaceTransition,WorkspaceMutations } from '../src/main/storage';
import { createDefaultState, createBuildDocument } from '../src/shared/state';

test('atomic state writes serialize snapshots and preserve the previous valid state',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'pok-ui-state-'));
  try{
    const store=new StateStore(dir);
    const first=createDefaultState();first.settings.trade.league='First';
    await store.save(first);
    const next=createDefaultState();next.settings.trade.league='Second';
    const writing=store.save(next);next.settings.trade.league='Mutated later';
    await writing;await store.flush();
    assert.equal((await store.load()).settings.trade.league,'Second');
    assert.equal(JSON.parse(await readFile(store.backupPath,'utf8')).settings.trade.league,'First');
    assert.equal((await readdir(dir)).filter(n=>n.endsWith('.tmp')).length,0);
  }finally{await rm(dir,{recursive:true,force:true});}
});
test('corrupt primary is preserved and restored from a validated backup',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'pok-ui-recovery-'));
  try{
    const store=new StateStore(dir);const state=createDefaultState();
    state.settings.trade.league='recover';await store.save(state);
    state.settings.trade.league='latest';await store.save(state);
    await writeFile(store.path,'{broken','utf8');
    const recovered=await store.load();
    assert.equal(recovered.settings.trade.league,'recover');
    assert.match(store.recoveryMessage,/백업/);
    const preserved=(await readdir(dir)).find(n=>n.startsWith('workspace.corrupt-'));
    assert.ok(preserved);
    assert.equal(await readFile(join(dir,preserved),'utf8'),'{broken');
    assert.equal(JSON.parse(await readFile(store.path,'utf8')).schemaVersion,2);
  }finally{await rm(dir,{recursive:true,force:true});}
});
test('unknown schema never silently resets user data',()=>{
  assert.throws(()=>validateState({...createDefaultState(),schemaVersion:99}),/지원하지/);
});

test('v1 migration preserves source and backup bytes and creates a distinct v2 file',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'pok-v2-migrate-'));
 try{
  const legacy={...createDefaultState(),schemaVersion:1};
  const xml='<PathOfBuilding2><Build level="90"/><Unknown value="keep"/></PathOfBuilding2>';
  const b=createBuildDocument('legacy',xml);delete b.documentSchemaVersion;
  legacy.builds.push(b);
  const raw=JSON.stringify(legacy,null,3),backup=JSON.stringify({...legacy,activeChatId:'older'});
  await writeFile(join(dir,'workspace.v1.json'),raw);await writeFile(join(dir,'workspace.v1.json.bak'),backup);
  const store=new StateStore(dir),loaded=await store.load();
  assert.equal(loaded.schemaVersion,2);assert.equal(loaded.builds[0].documentSchemaVersion,2);
  assert.equal(loaded.builds[0].xml,xml);assert.equal(await readFile(join(dir,'workspace.v1.json'),'utf8'),raw);
  assert.equal(await readFile(join(dir,'workspace.v1.json.bak'),'utf8'),backup);
  assert.equal((await store.load()).builds[0].id,b.id);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('future v2-file version is preserved without restoring an older backup or v1',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'pok-future-'));
 try{
  const store=new StateStore(dir);await store.save(createDefaultState());await store.save(createDefaultState());
  const future=JSON.stringify({...createDefaultState(),schemaVersion:99,unknown:'future'});
  await writeFile(store.path,future);await writeFile(join(dir,'workspace.v1.json'),JSON.stringify({...createDefaultState(),schemaVersion:1}));
  await assert.rejects(store.load(),/지원하지/);assert.equal(await readFile(store.path,'utf8'),future);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('damaged v2 never silently promotes an existing v1',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'pok-v2-damaged-'));
 try{
  const store=new StateStore(dir);await writeFile(store.path,'{damaged');
  await writeFile(join(dir,'workspace.v1.json'),JSON.stringify({...createDefaultState(),schemaVersion:1}));
  await assert.rejects(store.load(),/백업/);assert.equal(await readFile(store.path,'utf8'),'{damaged');
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('host rejects a competing branch even when its UI revision is higher',async()=>{
 const base=createDefaultState(),xml='<PathOfBuilding2><Build level="90"/></PathOfBuilding2>';
 base.builds=[createBuildDocument('base',xml)];
 const manual=structuredClone(base);manual.builds[0].xml=xml.replace('90','91');manual.builds[0].revision=1;
 const ai=structuredClone(base);ai.builds[0].xml=xml.replace('90','92');ai.builds[0].revision=1;
 const second=structuredClone(manual);second.builds[0].xml=xml.replace('90','93');second.builds[0].revision=2;
 await assert.rejects(assertWorkspaceTransition(ai,second,await workspaceInputVersions(manual.builds)),/기준 빌드 입력/);
 await assert.rejects(assertWorkspaceTransition(ai,manual,await workspaceInputVersions(base.builds)),/리비전/);
 await assert.doesNotReject(assertWorkspaceTransition(ai,structuredClone(ai),{}));
});
test('host serializes state decisions with writes and keeps serving after a rejected mutation',async()=>{
 const queue=new WorkspaceMutations(),order:string[]=[];let release!:()=>void;
 const wait=new Promise<void>(resolve=>{release=resolve;});let value=0;
 const first=queue.run(async()=>{order.push('first-start');await wait;value=1;order.push('first-end');});
 const second=queue.run(async()=>{assert.equal(value,1);order.push('second');throw new Error('conflict');});
 const caught=assert.rejects(second,/conflict/);
 const third=queue.run(async()=>{assert.equal(value,1);order.push('third');});
 release();await Promise.all([first,caught,third]);
 assert.deepEqual(order,['first-start','first-end','second','third']);
});
