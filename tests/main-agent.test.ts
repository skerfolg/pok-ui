import test from 'node:test';
import assert from 'node:assert/strict';
import { JsonLineRpc, agentAppServerArgs, agentRuntimeEnvironment } from '../src/main/agent';
import { dirname, delimiter, join } from 'node:path';

test('agent skill environment uses the selected Python and writable user paths without mutating the parent',()=>{
  const python=join(process.cwd(),'fixture-runtime','python','python.exe');
  const paths={dataHome:join(process.cwd(),'fixture-user','engine'),cacheHome:join(process.cwd(),'fixture-user','cache')};
  const inherited={Path:'existing-path',PYTHONHOME:'unrelated-python',POK_RESOURCE_ROOT:'old-root',POK_PYTHON:'old-python'};
  const env=agentRuntimeEnvironment('fixture-runtime',python,paths,inherited);
  assert.equal(env.Path,dirname(python)+delimiter+'existing-path');
  assert.equal(env.POK_PYTHON,python);
  assert.equal(env.POK_RESOURCE_ROOT,'fixture-runtime');
  assert.equal(env.POK_DATA_HOME,paths.dataHome);
  assert.equal(env.POK_CACHE_HOME,paths.cacheHome);
  assert.equal(env.PYTHONDONTWRITEBYTECODE,'1');
  assert.equal(env.PYTHONHOME,undefined);
  assert.equal(inherited.PYTHONHOME,'unrelated-python');
  const disconnected=agentRuntimeEnvironment('','',paths,inherited);
  assert.equal(disconnected.POK_RESOURCE_ROOT,undefined);
  assert.equal(disconnected.POK_PYTHON,undefined);
});

test('app-server startup disables inherited pok MCP before protocol initialization',()=>{
  assert.deepEqual(agentAppServerArgs(),['app-server','-c','mcp_servers.pok={command="pok-ui-managed-bridge",enabled=false}','--listen','stdio://']);
});

test('JSONL child receives the agent skill runtime environment',async()=>{
  const rpc=new JsonLineRpc();
  const code="process.stdin.setEncoding('utf8');let b='';process.stdin.on('data',c=>{b+=c;let i;while((i=b.indexOf('\\n'))>=0){const q=JSON.parse(b.slice(0,i));b=b.slice(i+1);process.stdout.write(JSON.stringify({id:q.id,result:{dataHome:process.env.POK_DATA_HOME,cacheHome:process.env.POK_CACHE_HOME}})+'\\n')}})";
  const env=agentRuntimeEnvironment('','',{dataHome:'synthetic-user-data',cacheHome:'synthetic-user-cache'});
  rpc.start(process.execPath,['-e',code],process.cwd(),env);
  try{assert.deepEqual(await rpc.request('environment',{}),{dataHome:'synthetic-user-data',cacheHome:'synthetic-user-cache'});}
  finally{rpc.stop();}
});
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
  const pok={tools:[],root:'',connected:false,call:async()=>({})} as unknown as PokConnection;
  const manager=new AgentManager(pok,event=>events.push(event),process.cwd());
  const internal=manager as any;
  internal.rpc={respond:(id:unknown,result:unknown)=>responses.push({id,result}),reject:(id:unknown,error:unknown)=>errors.push({id,error})};
  internal.threads.set('thread','chat');
  internal.turns.set('chat',{request:{chatId:'chat',prompt:'hello',history:[]},threadId:'thread',turnId:'turn',streamedItems:new Set(),completedItems:new Set()});
  return {manager,internal,events,responses,errors};
}

function contextKey(executable=process.execPath,resourceRoot='',python='') {
  return JSON.stringify({executable,resourceRoot,python});
}

test('model listing maps the actual app-server catalog shape to UI models',async()=>{
  const {manager,internal}=fixture();
  const requests:{method:string;params:unknown}[]=[];
  internal.executable=process.execPath;
  internal.executionContextKey=contextKey();
  internal.rpc={request:async(method:string,params:unknown)=>{
    requests.push({method,params});
    return {data:[
      {id:'default-id',model:'gpt-test',displayName:'GPT Test',description:'fast',hidden:false,isDefault:true,inputModalities:['text','image'],supportedReasoningEfforts:[{reasoningEffort:'medium',description:'Balanced'}],defaultReasoningEffort:'medium'},
      {id:'hidden-id',model:'hidden',displayName:'Hidden',description:'',hidden:true,isDefault:false,supportedReasoningEfforts:[],defaultReasoningEffort:'low'},
    ]};
  }};
  const models=await manager.listModels({provider:'codex',executable:process.execPath,model:''});
  assert.deepEqual(requests.map(r=>r.method),['model/list']);
  assert.deepEqual(models,[{id:'gpt-test',label:'GPT Test',description:'fast',isDefault:true,inputModalities:['text','image'],reasoningEfforts:[{effort:'medium',description:'Balanced'}]}]);
});

test('send starts threads with managed POK bridge instructions and starts turns with effort and local images',async()=>{
  const {manager,internal}=fixture();
  const requests:{method:string;params:any}[]=[];
  internal.executable=process.execPath;
  internal.executionContextKey=contextKey();
  internal.rpc={request:async(method:string,params:any)=>{
    requests.push({method,params});
    if(method==='thread/start')return {thread:{id:'new-thread'}};
    if(method==='turn/start')return {turn:{id:'new-turn'}};
    throw new Error('unexpected '+method);
  }};
  await manager.send({chatId:'new-chat',prompt:'inspect this',history:[]},{provider:'codex',executable:process.execPath,model:'gpt-test',reasoningEffort:'high'},['C:\\images\\one.png']);
  const threadStart=requests.find(r=>r.method==='thread/start')!.params;
  assert.deepEqual(threadStart.config,{mcp_servers:{pok:{command:'pok-ui-managed-bridge',enabled:false}}});
  assert.match(threadStart.developerInstructions,/Do not start, configure, or call an independent POK MCP server/);
  assert.ok(threadStart.dynamicTools.some((tool:any)=>tool.name==='pok_ui_call_tool'));
  const turnStart=requests.find(r=>r.method==='turn/start')!.params;
  assert.equal(turnStart.threadId,'new-thread');
  assert.equal(turnStart.model,'gpt-test');
  assert.equal(turnStart.effort,'high');
  assert.deepEqual(turnStart.input,[{type:'text',text:'inspect this',text_elements:[]},{type:'localImage',path:'C:\\images\\one.png'}]);
});

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

test('agent question requests stay pending until explicit answers are submitted',async()=>{
  const {manager,internal,events,responses}=fixture();
  await internal.receive({id:9,method:'tool/requestUserInput',params:{threadId:'thread',turnId:'turn',itemId:'item',isBlocking:true,questions:[{id:'q1',header:'Need input',question:'Pick one',options:[{label:'A',description:'Alpha'}],isOther:true}]}});
  assert.equal(responses.length,0);
  const question=events.find(e=>e.type==='question');
  assert.ok(question?.requestId);
  assert.deepEqual((question.details as any).questions,[{id:'q1',header:'Need input',question:'Pick one',options:[{label:'A',description:'Alpha'}],isOther:true}]);
  assert.deepEqual(await manager.answerQuestion(question.requestId,{q1:['A']}),{continuation:'answered',text:'사용자 답변:\n- Pick one: A'});
  assert.equal((responses[0] as any).id,9);
  assert.equal(Object.getPrototypeOf((responses[0] as any).result.answers),null);
  assert.deepEqual((responses[0] as any).result.answers.q1,{answers:['A']});
});

test('invalid or failed question answers keep the pending request available',async()=>{
  const {manager,internal,events,responses}=fixture();
  await internal.receive({id:10,method:'tool/requestUserInput',params:{threadId:'thread',turnId:'turn',itemId:'item',isBlocking:true,questions:[{id:'q1',header:'Need input',question:'Pick one'}]}});
  const blocking=events.find(e=>e.type==='question');
  assert.ok(blocking?.requestId);
  await assert.rejects(manager.answerQuestion(blocking.requestId,{q1:'bad' as any}),/문자열 배열/);
  assert.deepEqual(await manager.answerQuestion(blocking.requestId,{q1:['A']}),{continuation:'answered',text:'사용자 답변:\n- Pick one: A'});
  assert.equal(responses.length,1);

  const requests:{method:string;params:unknown}[]=[];
  internal.rpc={request:async(method:string,params:unknown)=>{requests.push({method,params});throw new Error('steer failed')},respond:(id:unknown,result:unknown)=>responses.push({id,result}),reject:()=>{}};
  await internal.receive({method:'item/completed',params:{threadId:'thread',turnId:'turn',item:{id:'async-retry',type:'agentMessage',text:'Need a choice',questions:[{title:'Choose'}]}}});
  await assert.rejects(manager.answerQuestion('async-retry',{'async-retry:0':['A']}),/steer failed/);
  internal.rpc.request=async(method:string,params:unknown)=>{requests.push({method,params});return {turnId:'turn'}};
  assert.deepEqual(await manager.answerQuestion('async-retry',{'async-retry:0':['A']}),{continuation:'steered',text:'사용자 답변:\n- Choose: A'});
});

test('async agent message questions steer active turns when answered before completion',async()=>{
  const {manager,internal,events}=fixture();
  const requests:{method:string;params:unknown}[]=[];
  internal.rpc={request:async(method:string,params:unknown)=>{requests.push({method,params});return {turnId:'turn'}},respond:()=>{},reject:()=>{}};
  await internal.receive({method:'item/completed',params:{threadId:'thread',turnId:'turn',item:{id:'async-item',type:'agentMessage',text:'Need a choice',questions:[{title:'Choose a route',options:['A','B']}]}}});
  const question=events.find(e=>e.type==='question');
  assert.ok(question?.requestId);
  assert.equal(question.requestId,'async-item');
  assert.deepEqual((question.details as any).questions,[{id:'async-item:0',header:'Choose a route',question:'Choose a route',options:[{label:'A',description:''},{label:'B',description:''}],isOther:true}]);
  assert.equal((question.details as any).mode,'async');
  assert.deepEqual(await manager.answerQuestion('async-item',{['async-item:0']:['A']}),{continuation:'steered',text:'사용자 답변:\n- Choose a route: A'});
  assert.deepEqual(requests,[{method:'turn/steer',params:{threadId:'thread',expectedTurnId:'turn',input:[{type:'text',text:'사용자 답변:\n- Choose a route: A',text_elements:[]}]}}]);
});

test('async question answers after turn completion return text for a new normal turn',async()=>{
  const {manager,internal,events}=fixture();
  await internal.receive({method:'item/completed',params:{threadId:'thread',turnId:'turn',item:{id:'async-done',type:'agentMessage',text:'Need a choice',questions:[{title:'Choose a route',options:['A','B']}]}}});
  await internal.receive({method:'turn/completed',params:{threadId:'thread',turn:{id:'turn',status:'completed'}}});
  const question=events.find(e=>e.type==='question');
  assert.ok(question?.requestId);
  assert.deepEqual(await manager.answerQuestion('async-done',{['async-done:0']:['B']}),{continuation:'new-turn',text:'사용자 답변:\n- Choose a route: B'});
});

test('late async questions after turn completion are emitted once and answered as new turns',async()=>{
  const {manager,internal,events}=fixture();
  await internal.receive({method:'turn/completed',params:{threadId:'thread',turn:{id:'turn',status:'completed'}}});
  await internal.receive({method:'item/completed',params:{threadId:'thread',turnId:'turn',item:{id:'late-question',type:'agentMessage',text:'Need a choice',questions:[{title:'Late choice',options:['A']}]}}});
  await internal.receive({method:'item/completed',params:{threadId:'thread',turnId:'turn',item:{id:'late-question',type:'agentMessage',text:'Need a choice',questions:[{title:'Late choice',options:['A']}]}}});
  assert.equal(events.filter(e=>e.type==='question'&&e.requestId==='late-question').length,1);
  assert.deepEqual(await manager.answerQuestion('late-question',{'late-question:0':['A']}),{continuation:'new-turn',text:'사용자 답변:\n- Late choice: A'});
});

test('new idle sends clear obsolete async questions',async()=>{
  const {manager,internal}=fixture();
  await internal.receive({method:'turn/completed',params:{threadId:'thread',turn:{id:'turn',status:'completed'}}});
  await internal.receive({method:'item/completed',params:{threadId:'thread',turnId:'turn',item:{id:'old-question',type:'agentMessage',text:'Need a choice',questions:[{title:'Old choice'}]}}});
  internal.executable=process.execPath;
  internal.executionContextKey=contextKey();
  internal.rpc={request:async(method:string)=>{
    if(method==='thread/start')return {thread:{id:'fresh-thread'}};
    if(method==='turn/start')return {turn:{id:'fresh-turn'}};
    return {};
  }};
  await manager.send({chatId:'chat',prompt:'fresh prompt',history:[]},{provider:'codex',executable:process.execPath,model:''});
  await assert.rejects(manager.answerQuestion('old-question',{'old-question:0':['A']}),/존재하지 않는 질문 요청/);
});

test('cancel interrupts active turns, emits cancelled completion and ignores late deltas',async()=>{
  const {manager,internal,events}=fixture();
  const requests:{method:string;params:unknown}[]=[];
  internal.rpc={request:async(method:string,params:unknown)=>{requests.push({method,params});return {}},respond:()=>{},reject:()=>{}};
  await manager.cancel('chat');
  await internal.receive({method:'item/agentMessage/delta',params:{threadId:'thread',turnId:'turn',itemId:'late',delta:'late'}});
  await internal.receive({method:'turn/completed',params:{threadId:'thread',turn:{id:'turn',status:'completed'}}});
  assert.deepEqual(requests,[{method:'turn/interrupt',params:{threadId:'thread',turnId:'turn'}}]);
  assert.deepEqual(events.filter(e=>e.type==='completed').map(e=>e.finishReason),['cancelled']);
  assert.equal(events.some(e=>e.type==='delta'&&e.text==='late'),false);
});

test('cancel interrupt failure keeps turn and questions for retry',async()=>{
  const {manager,internal,events}=fixture();
  await internal.receive({method:'item/completed',params:{threadId:'thread',turnId:'turn',item:{id:'async-keep',type:'agentMessage',text:'Need a choice',questions:[{title:'Choose'}]}}});
  internal.rpc={request:async()=>{throw new Error('interrupt unavailable')},respond:()=>{},reject:()=>{}};
  await assert.rejects(manager.cancel('chat'),/interrupt unavailable/);
  assert.ok(events.some(e=>e.type==='status'&&/interrupt unavailable/.test(String(e.text))));
  assert.equal(internal.turns.has('chat'),true);
  internal.rpc.request=async()=>({turnId:'turn'});
  assert.deepEqual(await manager.answerQuestion('async-keep',{'async-keep:0':['A']}),{continuation:'steered',text:'사용자 답변:\n- Choose: A'});
});

test('cancel while turn start is pending waits for interruptable turn and suppresses start rejection',async()=>{
  const {manager,internal,events}=fixture();
  let rejectTurn:(reason:Error)=>void=()=>{};
  const requests:{method:string;params:unknown}[]=[];
  internal.turns.clear();
  internal.executable=process.execPath;
  internal.executionContextKey=contextKey();
  internal.rpc={request:(method:string,params:unknown)=>{
    requests.push({method,params});
    if(method==='thread/start')return Promise.resolve({thread:{id:'pending-thread'}});
    if(method==='turn/start')return new Promise((_,reject)=>{rejectTurn=reject;});
    return Promise.resolve({});
  }};
  const send=manager.send({chatId:'pending-chat',prompt:'hello',history:[]},{provider:'codex',executable:process.execPath,model:''});
  await new Promise(resolve=>setImmediate(resolve));
  await manager.cancel('pending-chat');
  assert.equal(events.some(e=>e.chatId==='pending-chat'&&e.type==='completed'),false);
  rejectTurn(new Error('turn start closed after cancel'));
  await send;
  assert.deepEqual(events.filter(e=>e.chatId==='pending-chat'&&e.type==='completed').map(e=>e.finishReason),['cancelled']);
  assert.deepEqual(requests.map(r=>r.method),['thread/start','turn/start']);
});

test('interrupt failure after pending turn start resolves keeps the turn retryable',async()=>{
  const {manager,internal}=fixture();
  let releaseTurn:(value:unknown)=>void=()=>{};
  const requests:{method:string;params:unknown}[]=[];
  internal.turns.clear();
  internal.executable=process.execPath;
  internal.executionContextKey=contextKey();
  internal.rpc={request:(method:string,params:unknown)=>{
    requests.push({method,params});
    if(method==='thread/start')return Promise.resolve({thread:{id:'retry-thread'}});
    if(method==='turn/start')return new Promise(resolve=>{releaseTurn=resolve;});
    if(method==='turn/interrupt')return Promise.reject(new Error('interrupt unavailable'));
    return Promise.resolve({});
  }};
  const send=manager.send({chatId:'retry-chat',prompt:'hello',history:[]},{provider:'codex',executable:process.execPath,model:''});
  await new Promise(resolve=>setImmediate(resolve));
  await manager.cancel('retry-chat');
  releaseTurn({turn:{id:'retry-turn'}});
  await assert.rejects(send,/interrupt unavailable/);
  assert.equal(internal.turns.has('retry-chat'),true);
  assert.deepEqual(requests.map(r=>r.method),['thread/start','turn/start','turn/interrupt']);
});

test('cancel during thread bootstrap emits one cancelled completion and suppresses turn start',async()=>{
  const {manager,internal,events}=fixture();
  let releaseThread:(value:unknown)=>void=()=>{};
  const requests:{method:string;params:unknown}[]=[];
  internal.executable=process.execPath;
  internal.executionContextKey=contextKey();
  internal.rpc={request:(method:string,params:unknown)=>{
    requests.push({method,params});
    if(method==='thread/start')return new Promise(resolve=>{releaseThread=resolve;});
    if(method==='turn/start')throw new Error('turn should not start after bootstrap cancellation');
    return Promise.resolve({});
  }};
  const send=manager.send({chatId:'boot-chat',prompt:'hello',history:[]},{provider:'codex',executable:process.execPath,model:''});
  await new Promise(resolve=>setImmediate(resolve));
  await manager.cancel('boot-chat');
  releaseThread({thread:{id:'boot-thread'}});
  await send;
  assert.deepEqual(requests.map(r=>r.method),['thread/start']);
  assert.deepEqual(events.filter(e=>e.chatId==='boot-chat'&&e.type==='completed').map(e=>e.finishReason),['cancelled']);
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

test('resolved blocking questions produce an explicit UI removal signal',async()=>{
  const {internal,events}=fixture();
  await internal.receive({id:12,method:'tool/requestUserInput',params:{threadId:'thread',turnId:'turn',itemId:'item',isBlocking:true,questions:[{id:'q1',header:'Need input',question:'Pick one'}]}});
  const question=events.find(e=>e.type==='question');
  await internal.receive({method:'serverRequest/resolved',params:{threadId:'thread',requestId:12}});
  assert.ok(events.some(e=>e.requestId===question?.requestId&&(e.details as any)?.questionResolved));
});

test('completed turn question context is minimal and bounded',async()=>{
  const {internal}=fixture();
  for(let i=0;i<70;i++){
    internal.turns.set('chat',{request:{chatId:'chat',prompt:'hello',history:[],build:{id:'b',name:'Build',revision:1,xml:'x'.repeat(1000)}},threadId:'thread',turnId:'turn-'+i,streamedItems:new Set(),completedItems:new Set()});
    await internal.receive({method:'turn/completed',params:{threadId:'thread',turn:{id:'turn-'+i,status:'completed'}}});
  }
  assert.equal(internal.completedTurns.size,64);
  const retained=[...internal.completedTurns.values()];
  assert.ok(retained.every((turn:any)=>!('request' in turn)&&!('streamedItems' in turn)&&!('completedItems' in turn)));
});

test('resumed sessions can use the generic tool bridge for new UI catalog schemas',async()=>{
  const {internal,responses}=fixture();
  internal.pok.connected=true;
  internal.catalog={query:async(query:any)=>({total:1,offset:0,limit:1,entries:[{id:'gem-id',type:'gem',name:'Synthetic Gem',raw:{large:'details'},query}]}),getInfo:async()=>({status:'ready'})};
  await internal.dynamicCall(7,{threadId:'thread',tool:'pok_ui_call_tool',arguments:{name:'pok_ui_query_catalog',arguments:{type:'gem'}}});
  const response=(responses[0] as any).result;assert.equal(response.success,true);
  const output=JSON.parse(response.contentItems[0].text);assert.equal(output.entries[0].id,'gem-id');assert.equal(output.entries[0].raw,undefined);
  await internal.dynamicCall(8,{threadId:'thread',tool:'pok_ui_list_tools',arguments:{}});
  const listed=JSON.parse((responses[1] as any).result.contentItems[0].text);
  assert.equal(listed.connected,true);
  assert.ok(listed.uiTools.some((tool:any)=>tool.name==='pok_ui_query_catalog'));
});

test('managed POK tool calls emit readable start and completion status without arguments',async()=>{
  const {internal,events,responses}=fixture();
  const calls:{name:string;args:unknown}[]=[];
  internal.pok.call=async(name:string,args:unknown)=>{calls.push({name,args});return {ok:true}};
  await internal.dynamicCall(21,{threadId:'thread',tool:'pok_search_kb',arguments:{query:'secret-ish'}});
  await internal.dynamicCall(22,{threadId:'thread',tool:'pok_ui_call_tool',arguments:{name:'get_entry',arguments:{id:'hidden-id'}}});
  assert.deepEqual(calls.map(c=>c.name),['search_kb','get_entry']);
  assert.equal((responses[0] as any).result.success,true);
  assert.equal((responses[1] as any).result.success,true);
  const statuses=events.filter(e=>e.type==='status'&&(e.details as any)?.tool).map(e=>e.details as any);
  assert.deepEqual(statuses,[
    {tool:'search_kb',status:'started'},
    {tool:'search_kb',status:'completed'},
    {tool:'get_entry',status:'started'},
    {tool:'get_entry',status:'completed'},
  ]);
});

test('idle rpc restarts when POK execution context changes',async()=>{
  const {manager,internal}=fixture();
  const stopped:string[]=[];
  internal.executable=process.execPath;
  internal.executionContextKey=contextKey(process.execPath,'old-root','old-python');
  internal.rpc={stop:()=>stopped.push('old'),request:async()=>({data:[]})};
  internal.turns.clear();
  internal.threads.clear();
  internal.pok.root='new-root';
  internal.pok.python='new-python';
  await assert.rejects(manager.listModels({provider:'codex',executable:'Z:\\missing\\codex.exe',model:''}),/에이전트 실행 실패|ENOENT|spawn/i);
  assert.deepEqual(stopped,['old']);
});
