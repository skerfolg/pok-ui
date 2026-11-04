import {test} from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
test('detail cache binds XML/revision/runtime, coalesces requests and discards invalidated replies',async()=>{
  if(!globalThis.crypto)Object.defineProperty(globalThis,'crypto',{value:webcrypto,configurable:true});let calls=0,release:(()=>void)|undefined;
  const api={async itemTooltip(input:{buildId:string;revision:number;xml:string;runtimeId:string;itemId:string}){calls++;if(release===undefined&&input.itemId==='hold')await new Promise<void>(resolve=>{release=resolve;});const hash=await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode(input.xml));return{...input,xmlSha256:Buffer.from(hash).toString('hex'),displayLines:['actual original option'],requirements:[],comparisons:[]};}};
  Object.assign(globalThis,{window:{pok:api}});const cache=await import('../src/renderer/state/native-detail-cache');cache.clearDetailReads();
  const input={buildId:'synthetic-detail',revision:1,xml:'<synthetic/>',runtimeId:'runtime-a',itemId:'1'};
  const [first,second]=await Promise.all([cache.readItemTooltip(input),cache.readItemTooltip(input)]);assert.equal(calls,1);assert.deepEqual(first,second);assert(Object.isFrozen(first.displayLines));assert(cache.peekItemTooltip(input));
  assert.equal(cache.peekItemTooltip({...input,xml:'<different/>'}),undefined);assert.equal(cache.peekItemTooltip({...input,revision:2}),undefined);assert.equal(cache.peekItemTooltip({...input,runtimeId:'runtime-b'}),undefined);
  const held=cache.readItemTooltip({...input,itemId:'hold'});while(!release)await new Promise(resolve=>setTimeout(resolve,1));cache.clearDetailReads();release();await assert.rejects(held,/출처가 변경/);assert.equal(cache.peekItemTooltip(input),undefined);assert.equal(cache.peekItemTooltip({...input,itemId:'hold'}),undefined);
});
