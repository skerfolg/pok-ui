import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';
import {PobWorker} from '../src/main/pob-worker';
async function fixture(timeout=15000){
  const root=await mkdtemp(join(tmpdir(),'pok-worker-test-'));await mkdir(join(root,'pob','src'),{recursive:true});
  await writeFile(join(root,'worker.lua'),`const readline=require('node:readline');
console.log(JSON.stringify({id:0,ok:true,result:{version:'synthetic'}}));
readline.createInterface({input:process.stdin}).on('line',line=>{
 const r=JSON.parse(line);
 if(r.op==='crash'){process.exit(7);return;}
 if(r.op==='hang')return;
 if(r.op==='invalid'){console.log('{broken');return;}
 if(r.op==='error'){console.log(JSON.stringify({id:r.id,ok:false,error:{code:'NATIVE_ERROR',message:'synthetic'}}));return;}
 console.log(JSON.stringify({id:r.id,ok:true,result:{pid:process.pid,id:r.id,xml:r.xml}}));
});`);
  const worker=new PobWorker(root,process.execPath,'synthetic',timeout,(code,message)=>Object.assign(new Error(message),{code}));
  return{worker,cleanup:async()=>{worker.close();const target=resolve(root);assert(target.startsWith(resolve(tmpdir())+sep)&&basename(target).startsWith('pok-worker-test-'));await rm(target,{recursive:true,force:true,maxRetries:10,retryDelay:100});}};
}
test('worker reuses its process and unique response ids across independent XML requests',async()=>{
  const {worker,cleanup}=await fixture();try{const a=await worker.run({op:'echo',xml:'A'}),b=await worker.run({op:'echo',xml:'B'});assert.equal(a.pid,b.pid);assert.notEqual(a.id,b.id);assert.equal(b.xml,'B');}finally{await cleanup();}
});
test('crash, malformed protocol and native error discard the worker; next request restarts',async()=>{
  const {worker,cleanup}=await fixture();try{let previous=await worker.run({op:'echo'});for(const [op,code]of [['crash','POB_EXIT'],['invalid','POB_PROTOCOL'],['error','NATIVE_ERROR']]){await assert.rejects(worker.run({op}),{code});const next=await worker.run({op:'echo'});assert.notEqual(previous.pid,next.pid);previous=next;}}finally{await cleanup();}
});
test('timeout and explicit cancellation reject distinctly and allow a clean restart',async()=>{
  const {worker,cleanup}=await fixture(10000);try{await assert.rejects(worker.run({op:'hang'}),{code:'POB_TIMEOUT'});assert(await worker.run({op:'echo'}));const pending=worker.run({op:'hang'});const rejected=assert.rejects(pending,{code:'POB_CANCELLED'});worker.close();await rejected;assert(await worker.run({op:'echo'}));}finally{await cleanup();}
});
