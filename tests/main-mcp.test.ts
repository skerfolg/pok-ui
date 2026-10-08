import test from 'node:test';
import assert from 'node:assert/strict';
import { effectivePokSettings } from '../src/main/pok';

test('packaged startup always selects the bundled engine despite saved checkout settings',()=>{
  const saved={mode:'checkout' as const,root:'old-checkout',python:'custom-python',luajit:'custom-lua'};
  assert.deepEqual(effectivePokSettings(saved,true),{mode:'bundled',root:'',python:'',luajit:''});
  assert.equal(saved.mode,'checkout');
});
test('development startup preserves the selected engine settings',()=>{
  const saved={mode:'checkout' as const,root:'dev-checkout',python:'dev-python',luajit:'dev-lua'};
  assert.deepEqual(effectivePokSettings(saved,false),saved);
  assert.notEqual(effectivePokSettings(saved,false),saved);
});
import { unwrapMcp, PokToolError } from '../src/main/pok';
test('MCP unwrap handles object results, array envelopes and text-only servers',()=>{
  assert.deepEqual(unwrapMcp({structuredContent:{stats:{Life:100}}}),{stats:{Life:100}});
  assert.deepEqual(unwrapMcp({structuredContent:{result:[{id:'x'}]}}),[{id:'x'}]);
  assert.deepEqual(unwrapMcp({content:[{type:'text',text:'{"ok":false,"reason":"blocked"}'}]}),{ok:false,reason:'blocked'});
  assert.throws(()=>unwrapMcp({isError:true,content:[{type:'text',text:'failed'}]}),/failed/);
  assert.throws(()=>unwrapMcp({isError:true,content:[{type:'text',text:'tool rejected'}]}),PokToolError);
});

import { PokConnection } from '../src/main/pok';
import { createBuildDocument } from '../src/shared/state';
import { createBlankXml } from '../src/shared/pob-document';
test('calculation rejects stale engines before restoring or calculating a build',async()=>{
  const connection=new PokConnection();const calls:string[]=[];
  (connection as any).call=async(name:string)=>{calls.push(name);return {stale:true};};
  await assert.rejects(connection.compute(createBuildDocument('test',createBlankXml())),/소스가 변경/);
  assert.deepEqual(calls,['server_info']);
});
test('calculation cannot mix restore and compute across a reconnected engine',async()=>{
  const connection=new PokConnection();const calls:string[]=[];
  (connection as any).call=async(name:string)=>{
    calls.push(name);
    if(name==='server_info')return {stale:false};
    (connection as any).generation++;
    return {build_spec:{},notes:[],needs_decision:[]};
  };
  await assert.rejects(connection.compute(createBuildDocument('test',createBlankXml())),/연결이 변경/);
  assert.deepEqual(calls,['server_info','restore_pob_spec']);
});

test('domain calculation refusal preserves restoration notes, decisions and blockers',async()=>{
  const connection=new PokConnection();const build=createBuildDocument('test',createBlankXml());build.revision=7;
  (connection as any).call=async(name:string)=>{
    if(name==='server_info')return {stale:false,loaded_commit:'example'};
    if(name==='restore_pob_spec')return {build_spec:{},notes:['weapon set folded'],needs_decision:['select stages'],faithful:false,damage_comparable:false};
    return {ok:false,reason:'missing stages',blocking:['required source is unavailable']};
  };
  const calculation=await connection.compute(build);
  assert.equal(calculation.revision,7);
  assert.equal(calculation.result.ok,false);
  assert.equal(calculation.result.reason,'missing stages');
  assert.deepEqual(calculation.result.blocking,['required source is unavailable']);
  assert.deepEqual(calculation.result.pok_runtime,{stale:false,loaded_commit:'example'});
  assert.ok(calculation.restoreNotes.includes('weapon set folded'));
  assert.ok(calculation.restoreNotes.includes('select stages'));
  assert.equal(calculation.restoreNotes.length,4);
});
test('missing restored build spec returns a diagnostic without attempting computation',async()=>{
  const connection=new PokConnection();const calls:string[]=[];
  (connection as any).call=async(name:string)=>{
    calls.push(name);
    return name==='server_info'?{stale:false}:{ok:false,reason:'restore refused',notes:['original format unsupported'],needs_decision:['choose a skill set']};
  };
  const calculation=await connection.compute(createBuildDocument('test',createBlankXml()));
  assert.equal(calculation.result.ok,false);assert.equal(calculation.result.stage,'restore');
  assert.equal(calculation.result.reason,'restore refused');
  assert.deepEqual(calculation.restoreNotes,['original format unsupported','choose a skill set']);
  assert.deepEqual(calls,['server_info','restore_pob_spec']);
});
test('transport errors remain rejected promises',async()=>{
  const connection=new PokConnection();
  (connection as any).call=async(name:string)=>{
    if(name==='server_info')return {stale:false};
    if(name==='restore_pob_spec')return {build_spec:{},notes:['restored']};
    throw new Error('MCP connection closed');
  };
  await assert.rejects(connection.compute(createBuildDocument('test',createBlankXml())),/MCP connection closed/);
});

test('FastMCP engine validation errors retain restoration diagnostics while transport failures stay distinct',async()=>{
  const connection=new PokConnection();
  (connection as any).call=async(name:string)=>{
    if(name==='server_info')return {stale:false,loaded_commit:'runtime'};
    if(name==='restore_pob_spec')return {build_spec:{},notes:['weapon set folded'],needs_decision:['Arctic Armour stages missing'],faithful:false};
    return unwrapMcp({isError:true,content:[{type:'text',text:"Error calling tool 'compute_pob': Arctic Armour stages; Galvanic Field, Cast on Block, RaiseShield source unavailable"}]});
  };
  const calculation=await connection.compute(createBuildDocument('test',createBlankXml()));
  assert.equal(calculation.result.ok,false);
  assert.equal(calculation.result.stage,'compute');
  assert.match(String(calculation.result.reason),/Arctic Armour stages/);
  assert.match(String(calculation.result.reason),/RaiseShield/);
  assert.ok(calculation.restoreNotes.includes('weapon set folded'));
  assert.ok(calculation.restoreNotes.includes('Arctic Armour stages missing'));
  assert.deepEqual(calculation.result.pok_runtime,{stale:false,loaded_commit:'runtime'});
});

const identity = {
  apiVersion: 1 as const, pok: { version: 'test', sourceCommit: 'a'.repeat(40), sourceDigest: 'b'.repeat(64) },
  pob: { commit: 'c'.repeat(40), sourceDigest: 'd'.repeat(64) }, kb: { manifestSha256: 'e'.repeat(64), contentSha256: 'f'.repeat(64), patch: 'test' },
  capabilities: { computeXml: true, renderItem: true, catalogExport: true },
};
test('connection checks skip cold KB diagnostics and use short bounded deadlines',async()=>{
  const connection=new PokConnection();const requests:any[]=[];
  connection.tools=[{name:'server_info',inputSchema:{}},{name:'render_pob_item',inputSchema:{}}];
  (connection as any).client={callTool:async(request:any,_schema:any,options:any)=>{
    requests.push({request,options});return {structuredContent:{}};
  }};
  await connection.call('server_info',{});
  await connection.call('render_pob_item',{request:{kind:'base',id:'Iron Ring'}});
  assert.equal(requests[0].request.arguments.include_kb_diagnostics,false);
  assert.equal(requests[0].options.maxTotalTimeout,15_000);
  assert.equal(requests[1].options.maxTotalTimeout,45_000);
  assert.equal(requests[1].options.resetTimeoutOnProgress,false);
});
test('item requests require a completed verified connection',()=>{
  const connection=new PokConnection();
  assert.throws(()=>connection.requireReady(),/연결/);
  (connection as any).client={};connection.bindIdentity(identity);
  (connection as any).connectPromise=new Promise(()=>{});
  assert.throws(()=>connection.requireReady(),/진행 중/);
  (connection as any).connectPromise=undefined;
  assert.doesNotThrow(()=>connection.requireReady());
});
test('an item timeout returns a reconnect instruction rather than an indefinite busy state',async()=>{
  const connection=new PokConnection();connection.tools=[{name:'render_pob_item',inputSchema:{}}];
  let closed=false,disconnected='';connection.onDisconnected=message=>{disconnected=message;};
  (connection as any).client={close:async()=>{closed=true;},callTool:async()=>{throw Object.assign(new Error('Request timed out'),{code:-32001});}};
  await assert.rejects(connection.call('render_pob_item',{request:{kind:'base',id:'Iron Ring'}}),/아이템 생성 응답이 45초/);
  assert.equal(closed,true);assert.match(disconnected,/45초/);assert.equal(connection.connected,false);
});
test('a closed managed transport clears the connected state and live tool inventory',()=>{
  const connection=new PokConnection();const client={};let error='';
  (connection as any).client=client;connection.bindIdentity(identity);connection.tools=[{name:'server_info',inputSchema:{}}];
  connection.onDisconnected=message=>{error=message;};
  (connection as any).connectionLost(client,'closed');
  assert.equal(connection.connected,false);assert.deepEqual(connection.tools,[]);assert.equal(error,'closed');
});
test('concurrent identity checks coalesce without caching later source checks',async()=>{
  const connection=new PokConnection();let calls=0;
  connection.tools=[{name:'server_info',inputSchema:{}}];
  (connection as any).client={callTool:async()=>{calls++;await new Promise(resolve=>setTimeout(resolve,5));return{structuredContent:{identity}};}};
  await Promise.all([connection.call('server_info',{}),connection.call('server_info',{})]);assert.equal(calls,1);
  await connection.call('server_info',{});assert.equal(calls,2);
});
test('verified bundle calculations pass active XML directly and retain input provenance', async () => {
  const connection = new PokConnection();
  const build = createBuildDocument('synthetic', createBlankXml());
  const calls: {name:string;args:Record<string,unknown>}[] = [];
  (connection as any).call = async (name:string,args:Record<string,unknown>) => {
    calls.push({name,args});
    return name === 'server_info' ? {identity,stale:false} : {ok:true,stats:{Life:50},diagnostics:['checked']};
  };
  const result = await connection.compute(build,{bundleId:'bundle',identity});
  assert.deepEqual(calls.map(c=>c.name),['server_info','compute_pob_xml','server_info']);
  assert.match(String(calls[1].args.xml),/PathOfBuilding2/);
  assert.equal(result.provenance?.buildId,build.id);
  assert.equal(result.provenance?.bundleId,'bundle');
  assert.equal(result.provenance?.mode,'xml');
  assert.deepEqual(result.result.stats,{Life:50});
});
test('a changed KB or PoB identity rejects calculations before and after the engine call', async () => {
  const connection = new PokConnection(); const build=createBuildDocument('synthetic',createBlankXml());
  let calls=0;
  (connection as any).call=async()=>{calls++;return {identity:{...identity,pob:{...identity.pob,commit:'other'}}};};
  await assert.rejects(connection.compute(build,{bundleId:'bundle',identity}),/버전/);
  assert.equal(calls,1);
  let infoCount=0;
  (connection as any).call=async(name:string)=>{
    if(name!=='server_info')return {ok:true,stats:{Life:50}};
    return {identity:++infoCount===1?identity:{...identity,kb:{...identity.kb,contentSha256:'changed'}}};
  };
  await assert.rejects(connection.compute(build,{bundleId:'bundle',identity}),/버전/);
});
test('verified direct XML domain failure preserves diagnostics without restored fallback', async () => {
  const connection = new PokConnection(); const build=createBuildDocument('synthetic',createBlankXml());
  const calls:string[]=[];
  (connection as any).call=async(name:string)=>{
    calls.push(name);if(name==='server_info')return {identity};
    throw new PokToolError('Unsupported source');
  };
  const result=await connection.compute(build,{bundleId:'bundle',identity});
  assert.equal(result.result.ok,false);
  assert.match(String(result.result.reason),/Unsupported source/);
  assert.equal(calls.includes('restore_pob_spec'),false);
});

test('UI and AI calls cannot interleave the shared PoB request stream',async()=>{
  const connection=new PokConnection();let active=0,maximum=0;
  connection.tools=[{name:'render_pob_item',inputSchema:{}}];
  (connection as any).client={callTool:async({arguments:args}:any)=>{active++;maximum=Math.max(maximum,active);await new Promise(resolve=>setTimeout(resolve,10));active--;return {structuredContent:{id:args.id}};}};
  const results=await Promise.all([connection.call('render_pob_item',{id:'a'}),connection.call('render_pob_item',{id:'b'})]);
  assert.equal(maximum,1);assert.deepEqual(results,[{id:'a'},{id:'b'}]);
});
