import test from 'node:test';
import assert from 'node:assert/strict';
import { JsonLineRpc } from '../src/main/agent';
test('JSONL client matches responses, forwards notifications, rejects errors and survives split frames',async()=>{
  const rpc=new JsonLineRpc();const notices:unknown[]=[];
  rpc.onMessage=m=>notices.push(m);
  const code="process.stdin.setEncoding('utf8');let b='';process.stdin.on('data',c=>{b+=c;let i;while((i=b.indexOf('\\n'))>=0){let q=JSON.parse(b.slice(0,i));b=b.slice(i+1);if(q.method==='fail')process.stdout.write(JSON.stringify({id:q.id,error:{message:'denied'}})+'\\n');else{process.stdout.write('{\\\"method\\\":\\\"test/notice\\\",\\\"params\\\":{}');process.stdout.write('}\\n'+JSON.stringify({id:q.id,result:{echo:q.params}})+'\\n')}}})";
  rpc.start(process.execPath,['-e',code],process.cwd());
  try{
    assert.deepEqual(await rpc.request('echo',{hello:'한글'}),{echo:{hello:'한글'}});
    assert.equal(notices.length,1);
    await assert.rejects(rpc.request('fail',{}),/denied/);
  }finally{rpc.stop();}
});

import { AgentManager } from '../src/main/agent';
import type { AgentEvent } from '../src/shared/contracts';
import type { PokConnection } from '../src/main/pok';

function fixture() {
  const events:AgentEvent[]=[];const responses:unknown[]=[];const errors:unknown[]=[];
  const pok={tools:[],root:'',call:async()=>({})} as unknown as PokConnection;
  const manager=new AgentManager(pok,event=>events.push(event),process.cwd());
  const internal=manager as any;
  internal.rpc={respond:(id:unknown,result:unknown)=>responses.push({id,result}),reject:(id:unknown,error:unknown)=>errors.push({id,error})};
  internal.threads.set('thread','chat');
  internal.turns.set('chat',{request:{chatId:'chat',prompt:'hello',history:[]},threadId:'thread',turnId:'turn',streamedItems:new Set(),completedItems:new Set()});
  return {manager,internal,events,responses,errors};
}
test('agent lifecycle ignores replayed completion, old turns and retryable errors',async()=>{
  const {internal,events}=fixture();
  await internal.receive({method:'item/agentMessage/delta',params:{threadId:'thread',turnId:'turn',itemId:'a',delta:'hello'}});
  await internal.receive({method:'item/completed',params:{threadId:'thread',turnId:'turn',item:{id:'a',type:'agentMessage',text:'hello'}}});
  await internal.receive({method:'item/completed',params:{threadId:'thread',turnId:'turn',item:{id:'a',type:'agentMessage',text:'hello'}}});
  await internal.receive({method:'item/completed',params:{threadId:'thread',turnId:'turn',item:{id:'b',type:'agentMessage',text:' world'}}});
  await internal.receive({method:'item/agentMessage/delta',params:{threadId:'thread',turnId:'old-turn',itemId:'x',delta:'WRONG'}});
  await internal.receive({method:'error',params:{threadId:'thread',turnId:'turn',willRetry:true,error:{message:'temporary'}}});
  assert.deepEqual(events.filter(e=>e.type==='delta').map(e=>e.text),['hello',' world']);
  assert.equal(events.filter(e=>e.type==='error').length,0);
  await internal.receive({method:'turn/completed',params:{threadId:'thread',turn:{id:'turn',status:'completed'}}});
  await internal.receive({method:'turn/completed',params:{threadId:'thread',turn:{id:'turn',status:'completed'}}});
  assert.equal(events.filter(e=>e.type==='completed').length,1);
});
test('approvals remain unanswered until explicit UI resolution and unsupported requests are denied',async()=>{
  const {manager,internal,events,responses,errors}=fixture();
  await internal.receive({id:3,method:'item/commandExecution/requestApproval',params:{threadId:'thread',turnId:'turn',command:'example'}});
  assert.equal(responses.length,0);
  const approval=events.find(e=>e.type==='approval');assert.ok(approval?.requestId);
  await manager.resolveApproval(approval.requestId,'decline');
  assert.deepEqual(responses,[{id:3,result:{decision:'decline'}}]);
  await internal.receive({id:4,method:'unsupported/requestApproval',params:{threadId:'thread'}});
  assert.equal(errors.length,1);
  assert.equal(responses.length,1);
});
test('resolved server approval produces an explicit UI removal signal',async()=>{
  const {internal,events}=fixture();
  await internal.receive({id:5,method:'item/fileChange/requestApproval',params:{threadId:'thread',turnId:'turn'}});
  const approval=events.find(e=>e.type==='approval');
  await internal.receive({method:'serverRequest/resolved',params:{threadId:'thread',requestId:5}});
  assert.ok(events.some(e=>e.requestId===approval?.requestId&&(e.details as any)?.approvalResolved));
});
