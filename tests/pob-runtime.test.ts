import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {PobRuntime} from '../src/main/pob-runtime';
import {createDefaultState} from '../src/shared/state';
const sha=(value:string)=>createHash('sha256').update(value).digest('hex');

test('new workspaces do not implicitly require starting PoK',()=>{
  assert.equal(createDefaultState().settings.pok.autoConnect,false);
});
test('standalone runtime verifies its own source and rejects modified files without any PoK identity',async()=>{
  const root=await mkdtemp(join(tmpdir(),'pob-runtime-'));
  const paths=['worker.lua','editor.lua','inspect.lua','calcs.lua','party.lua','tree.lua','item-controls.lua','item-popups.lua','equipment.lua','loadouts.lua','loadout-management.lua','pob/src/HeadlessWrapper.lua','pob/LICENSE.md','LICENSE-LuaJIT.md','bin/luajit.exe'];
  for(const path of paths){const target=join(root,path);await mkdir(join(target,'..'),{recursive:true});await writeFile(target,'synthetic');}
  const body={schemaVersion:1,protocolVersion:1,commit:'a'.repeat(40),version:'test',platform:process.platform,supportedTreeVersions:['0_5'],executable:'bin/luajit.exe',files:paths.map(path=>({path,sha256:sha('synthetic')}))};
  const manifest={...body,runtimeId:'pob-'+sha(JSON.stringify(body))};await writeFile(join(root,'manifest.json'),JSON.stringify(manifest));
  const runtime=new PobRuntime(root);assert.equal((await runtime.getInfo()).status,'ready');
  await writeFile(join(root,'worker.lua'),'changed');assert.equal((await runtime.getInfo()).status,'corrupt');
  assert.equal(await readFile(join(root,'pob/LICENSE.md'),'utf8'),'synthetic');
});
test('a missing independent runtime reports preparation needs without Python or KB errors',async()=>{
  const root=await mkdtemp(join(tmpdir(),'pob-runtime-missing-'));
  const info=await new PobRuntime(root).getInfo();assert.equal(info.status,'missing');
  assert.match(info.error!,/독립 PoB 런타임/);assert.doesNotMatch(info.error!,/Python|KB/);
});
