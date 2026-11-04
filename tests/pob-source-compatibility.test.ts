import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join,dirname,resolve,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {assertPobSourceFiles,assertBundledPobSource,assertCheckoutPobSource,type PobSourceProof} from '../src/main/pob-source-compatibility';
const commit='a'.repeat(40),hash=(text:string)=>createHash('sha256').update(text).digest('hex'),files=Object.fromEntries(['src/HeadlessWrapper.lua','src/GameVersions.lua','src/Modules/Calcs.lua','src/Data/Example.lua'].map(path=>[path,hash(path)])),proof:PobSourceProof={runtimeId:'pob-'+hash('synthetic adapter'),commit,files};
test('PoB source compatibility checks every independent source byte rather than version/commit alone',()=>{
  assert.doesNotThrow(()=>assertPobSourceFiles(proof,commit,{...files,'src/ExtraExport.lua':hash('not loaded')}));
  assert.throws(()=>assertPobSourceFiles(proof,'b'.repeat(40),files),/커밋/);
  assert.throws(()=>assertPobSourceFiles(proof,commit,{...files,'src/Data/Example.lua':hash('changed')}),/Example.lua/);
  const missing={...files};delete missing['src/Data/Example.lua'];assert.throws(()=>assertPobSourceFiles(proof,commit,missing),/Example.lua/);
});
test('prepared bundle source inventory accepts one pinned root and rejects absent or ambiguous origins',()=>{
  const bundled=Object.fromEntries(Object.entries(files).map(([path,value])=>['external/pob/'+commit.slice(0,7)+'/'+path,value]));assert.doesNotThrow(()=>assertBundledPobSource(proof,commit,bundled));assert.throws(()=>assertBundledPobSource(proof,commit,{}),/근거/);
  assert.throws(()=>assertBundledPobSource(proof,commit,{...bundled,...Object.fromEntries(Object.entries(files).map(([path,value])=>['pob/'+path,value]))}),/여러/);
});
test('checkout source proof verifies actual files, rejects later changes, and never rewrites source',async()=>{
  const root=await mkdtemp(join(tmpdir(),'pok-source-proof-')),base=join(root,'external/pob',commit.slice(0,7));
  try{for(const path of Object.keys(files)){await mkdir(join(base,path,'..'),{recursive:true});await writeFile(join(base,path),path);}await assertCheckoutPobSource(proof,commit,root);await writeFile(join(base,'src/Data/Example.lua'),'changed');await assert.rejects(assertCheckoutPobSource(proof,commit,root),/Example.lua/);}finally{assert.equal(dirname(resolve(root)),resolve(tmpdir()));assert(basename(root).startsWith('pok-source-proof-'));await rm(root,{recursive:true,force:true});}
});
test('invalid source proof paths cannot escape the selected source root',()=>{
  assert.throws(()=>assertPobSourceFiles({...proof,files:{...files,'src/../../private':hash('x')}},commit,files),/경로/);assert.throws(()=>assertPobSourceFiles({...proof,files:{}},commit,{}),/근거/);
});
