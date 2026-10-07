import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { StateStore, validateState } from '../src/main/storage';
import { createDefaultState } from '../src/shared/state';

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
    assert.equal(JSON.parse(await readFile(store.path,'utf8')).schemaVersion,1);
  }finally{await rm(dir,{recursive:true,force:true});}
});
test('unknown schema never silently resets user data',()=>{
  assert.throws(()=>validateState({...createDefaultState(),schemaVersion:2}),/지원하지/);
});
