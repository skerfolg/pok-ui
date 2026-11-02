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
import { assertDesktopContract } from '../src/main/pok';
import { createBuildDocument } from '../src/shared/state';
import { createBlankXml } from '../src/shared/pob-document';

test('current parameterless server_info receives no historical bundle-only arguments',async()=>{
  const connection=new PokConnection();let args:unknown;
  connection.tools=[{name:'server_info',inputSchema:{type:'object',properties:{}}}];
  (connection as any).client={callTool:async(request:any)=>{args=request.arguments;return{structuredContent:{stale:false}};}};
  await connection.call('server_info',{});assert.deepEqual(args,{});
});

test('desktop contract refusal identifies missing runtime support without bypassing identity',()=>{
  assert.throws(()=>assertDesktopContract({loaded_commit:'current'},[]),/runtime identity, compute_pob_xml, render_pob_item/);
  assert.doesNotThrow(()=>assertDesktopContract({identity:{}},['compute_pob_xml','render_pob_item'].map(name=>({name,inputSchema:{}}))));
});

test('live catalog refresh reads all pages and replaces obsolete schemas atomically',async()=>{
  const connection=new PokConnection();connection.tools=[{name:'obsolete',inputSchema:{}}];
  const calls:unknown[]=[];
  (connection as any).client={listTools:async(params:any)=>{
    calls.push(params);return params?{tools:[{name:'compute_pob',inputSchema:{properties:{new_input:{}}}}]}:{tools:[{name:'server_info',inputSchema:{}}],nextCursor:'next'};
  }};
  await connection.refreshTools();assert.deepEqual(calls,[undefined,{cursor:'next'}]);
  assert.deepEqual(connection.tools.map(t=>t.name),['server_info','compute_pob']);
  assert.ok((connection.tools[1].inputSchema.properties as any).new_input);
});

test('tool catalogs arriving from a previous connection cannot replace current schemas',async()=>{
  const connection=new PokConnection();let resolve!:(v:any)=>void;
  (connection as any).client={listTools:()=>new Promise(r=>{resolve=r;})};
  const pending=connection.refreshTools();
  (connection as any).generation++;connection.tools=[{name:'new',inputSchema:{}}];
  resolve({tools:[{name:'old',inputSchema:{}}]});
  await assert.rejects(pending,/연결이 변경/);assert.equal(connection.tools[0].name,'new');
});

test('structured error retains legality, upkeep and readiness evidence',()=>{
  const details={ok:false,blocking:['socket source'],item_editor:{unresolved:['line']},config_upkeep:{cost:2},readiness:'not_ready'};
  assert.throws(()=>unwrapMcp({isError:true,structuredContent:details}),error=>error instanceof PokToolError&&error.details===details);
});

test('restoration decisions block computation without mutating the input or assuming a mode',async()=>{
  const connection=new PokConnection(),build=createBuildDocument('synthetic',createBlankXml());
  const before=JSON.stringify(build);const calls:string[]=[];
  (connection as any).call=async(name:string,args:any)=>{
    calls.push(name);if(name==='server_info')return{};
    assert.equal(args.assume_first_stat_set,false);
    return{build_spec:{},needs_decision:['choose stages'],dropped_item_granted:[{skill:'source',lost_supports:2}]};
  };
  const output=await connection.compute(build);assert.equal(output.result.stage,'restore');
  assert.deepEqual((output.result.restoration as any).dropped_item_granted,[{skill:'source',lost_supports:2}]);
  assert.deepEqual(calls,['server_info','restore_pob_spec']);assert.equal(JSON.stringify(build),before);
});
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
    if(name==='restore_pob_spec')return {build_spec:{},notes:['weapon set folded'],needs_decision:[],faithful:false,damage_comparable:false};
    return {ok:false,reason:'missing stages',blocking:['required source is unavailable']};
  };
  const calculation=await connection.compute(build);
  assert.equal(calculation.revision,7);
  assert.equal(calculation.result.ok,false);
  assert.equal(calculation.result.reason,'missing stages');
  assert.deepEqual(calculation.result.blocking,['required source is unavailable']);
  assert.deepEqual(calculation.result.pok_runtime,{stale:false,loaded_commit:'example'});
  assert.ok(calculation.restoreNotes.includes('weapon set folded'));
  assert.equal(calculation.restoreNotes.length,3);
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
    if(name==='restore_pob_spec')return {build_spec:{},notes:['weapon set folded'],needs_decision:[],faithful:false};
    return unwrapMcp({isError:true,content:[{type:'text',text:"Error calling tool 'compute_pob': Arctic Armour stages; Galvanic Field, Cast on Block, RaiseShield source unavailable"}]});
  };
  const calculation=await connection.compute(createBuildDocument('test',createBlankXml()));
  assert.equal(calculation.result.ok,false);
  assert.equal(calculation.result.stage,'compute');
  assert.match(String(calculation.result.reason),/Arctic Armour stages/);
  assert.match(String(calculation.result.reason),/RaiseShield/);
  assert.ok(calculation.restoreNotes.includes('weapon set folded'));
  assert.ok(calculation.result.diagnostics);
  assert.deepEqual(calculation.result.pok_runtime,{stale:false,loaded_commit:'runtime'});
});


import { createHash } from 'node:crypto';

// A synthetic wire fixture follows PoK's mode=json contract. In particular,
// offsets count Unicode code points, not JavaScript UTF-16 code units.
function storedWire(value: unknown) {
  const json = JSON.stringify(value);
  const characters = Array.from(json);
  const sha = createHash('sha256').update(json, 'utf8').digest('hex');
  const id = createHash('sha256').update('synthetic payload:' + json).digest('hex');
  return {
    notice: { stored_tool_result: true, result_ref: { $pok_result: id, path: '/result' },
      payload_sha256: id, result_sha256: sha, result_bytes: Buffer.byteLength(json),
      read: { tool: 'get_tool_result', result_id: id, path: '/result' } },
    page(offset: number) {
      const end = Math.min(offset + 1_400, characters.length);
      return { result_id: id, payload_sha256: id, path: '/result', mode: 'json', kind: 'object',
        total: characters.length, offset, chunk: characters.slice(offset, end).join(''),
        next_offset: end < characters.length ? end : null };
    }
  };
}

function wireConnection(handler: (name: string, args: Record<string, unknown>, options?: Record<string, unknown>) => unknown | Promise<unknown>) {
  const connection = new PokConnection();
  connection.tools = ['server_info', 'restore_pob_spec', 'compute_pob', 'get_tool_result']
    .map(name => ({ name, inputSchema: {} }));
  (connection as any).client = { callTool: async (request: { name: string; arguments: Record<string, unknown> }, _schema?: unknown, options?: Record<string, unknown>) =>
    ({ structuredContent: await handler(request.name, request.arguments, options) }) };
  return connection;
}

test('automatic calculation resolves paged restore and calculation results without losing Unicode or diagnostics', async () => {
  const buildSpec = { character: { level: 100 }, config: { synthetic: true } };
  const restoreData = { build_spec: buildSpec, notes: ['원문 보존🙂'.repeat(900)], needs_decision: [], faithful: false };
  const restore = storedWire(restoreData);
  const computed = { ok: false, reason: 'measured domain refusal', blocking: ['미지원🙂'.repeat(900)], stats: { Life: 1187 } };
  const result = storedWire(computed);
  const pages = new Map([restore, result].map(wire => [wire.notice.payload_sha256, wire]));
  const calls: string[] = [];
  const connection = wireConnection((name, args) => {
    calls.push(name);
    if (name === 'server_info') return { stale: false };
    if (name === 'restore_pob_spec') return restore.notice;
    if (name === 'get_tool_result') {
      assert.equal(args.mode, 'json'); assert.equal(args.path, '/result');
      return pages.get(String(args.result_id))!.page(Number(args.offset));
    }
    assert.equal(name, 'compute_pob'); assert.deepEqual(args.build_spec, buildSpec);
    return result.notice;
  });
  const build = createBuildDocument('synthetic', createBlankXml()); build.revision = 9;
  const calculation = await connection.compute(build);
  assert.equal(calculation.revision, 9);
  assert.deepEqual(calculation.result, { ...computed, restoration:restoreData, pok_runtime: { stale: false } });
  assert.deepEqual(calculation.restoreNotes, ['원문 보존🙂'.repeat(900), '원본 전체를 완전히 복원하지 못한 계산입니다.']);
  assert.ok(calls.filter(name => name === 'get_tool_result').length > 2);
});

test('automatic calculation rejects a corrupted stored result before using its build spec', async () => {
  const stored = storedWire({ build_spec: {}, notes: ['synthetic'] });
  let computed = false;
  const connection = wireConnection(name => {
    if (name === 'server_info') return { stale: false };
    if (name === 'restore_pob_spec') return stored.notice;
    if (name === 'get_tool_result') return { ...stored.page(0), chunk: stored.page(0).chunk.replace('synthetic', 'corrupted') };
    computed = true; return {};
  });
  await assert.rejects(connection.compute(createBuildDocument('test', createBlankXml())));
  assert.equal(computed, false);
});

test('reconnection while reading stored pages cannot attach an old result to the new engine', async () => {
  const stored = storedWire({ build_spec: {}, notes: ['synthetic'] });
  let computed = false;
  const connection = wireConnection(name => {
    if (name === 'server_info') return { stale: false };
    if (name === 'restore_pob_spec') return stored.notice;
    if (name === 'get_tool_result') { (connection as any).generation++; return stored.page(0); }
    computed = true; return {};
  });
  await assert.rejects(connection.compute(createBuildDocument('test', createBlankXml())), /연결이 변경/);
  assert.equal(computed, false);
});

test('agent-facing tool calls retain the bounded reference without automatic expansion', async () => {
  const stored = storedWire({ stats: { Life: 1187 } });
  const calls: string[] = [];
  const connection = wireConnection(name => { calls.push(name); return stored.notice; });
  assert.deepEqual(await connection.call('compute_pob', {}), stored.notice);
  assert.deepEqual(calls, ['compute_pob']);
});


import { readFileSync } from 'node:fs';

test('automatic calculation reads actual Python PoK pages with float spelling and Unicode offsets', async () => {
  const fixture = JSON.parse(readFileSync(new URL('./fixtures/pok-stored-result.json', import.meta.url), 'utf8'));
  const connection = wireConnection((name, args) => {
    if (name === 'server_info') return { stale: false };
    if (name === 'restore_pob_spec') return { build_spec: {}, notes: [] };
    if (name === 'compute_pob') return fixture.notice;
    const page = fixture.pages.find((page: { offset: number }) => page.offset === args.offset);
    assert.ok(page); return page;
  });
  const calculation = await connection.compute(createBuildDocument('synthetic', createBlankXml()));
  assert.deepEqual(calculation.result, { ...fixture.expected, restoration:{build_spec:{},notes:[]}, pok_runtime: { stale: false } });
});

test('stored pages must advance and retain their payload identity before a spec can be used', async () => {
  for (const invalidPage of [
    { offset: 1 }, { next_offset: 0, chunk: '' }, { payload_sha256: '0'.repeat(64) }, { total: -1 }
  ]) {
    const stored = storedWire({ build_spec: {}, notes: [] }); let computed = false;
    const connection = wireConnection(name => {
      if (name === 'server_info') return { stale: false };
      if (name === 'restore_pob_spec') return stored.notice;
      if (name === 'get_tool_result') return { ...stored.page(0), ...invalidPage };
      computed = true; return {};
    });
    await assert.rejects(connection.compute(createBuildDocument('test', createBlankXml())), /저장 결과/);
    assert.equal(computed, false);
  }
});

test('oversized automatic results fail explicitly without reading pages or computing from a summary', async () => {
  const stored = storedWire({ build_spec: {} }); const calls: string[] = [];
  const connection = wireConnection(name => {
    calls.push(name);
    return name === 'server_info' ? { stale: false } : { ...stored.notice, result_bytes: 64 * 1024 * 1024 + 1 };
  });
  await assert.rejects(connection.compute(createBuildDocument('test', createBlankXml())), /64 MiB/);
  assert.deepEqual(calls, ['server_info', 'restore_pob_spec']);
});

test('a stored server identity is read before stale-engine rejection', async () => {
  const stored = storedWire({ stale: true }); const calls: string[] = [];
  const connection = wireConnection((name, args) => {
    calls.push(name);
    if (name === 'server_info') return stored.notice;
    assert.equal(name, 'get_tool_result'); return stored.page(Number(args.offset));
  });
  await assert.rejects(connection.compute(createBuildDocument('test', createBlankXml())), /소스가 변경/);
  assert.deepEqual(calls, ['server_info', 'get_tool_result']);
});


test('nonfinite-number normalization keeps the original text reference in calculation diagnostics', async () => {
  const stored = storedWire({ stats: { DPS: null } });
  const normalization = { nonfinite_numbers: 'null', original_text_ref: { $pok_result: stored.notice.payload_sha256, path: '/source/unstructured_json_text' } };
  const connection = wireConnection((name, args) => {
    if (name === 'server_info') return { stale: false };
    if (name === 'restore_pob_spec') return { build_spec: {}, notes: [] };
    if (name === 'compute_pob') return { ...stored.notice, normalization };
    return stored.page(Number(args.offset));
  });
  const calculation = await connection.compute(createBuildDocument('test', createBlankXml()));
  assert.equal((calculation.result.stats as { DPS: unknown }).DPS, null);
  assert.deepEqual(calculation.restoreNotes, [{ tool: 'compute_pob', transport_normalization: normalization, result_ref: stored.notice.result_ref }]);
});

test('an old engine without the page reader fails explicitly instead of using a notice as a build spec', async () => {
  const stored = storedWire({ build_spec: {} }); let computed = false;
  const connection = wireConnection(name => {
    if (name === 'server_info') return { stale: false };
    if (name === 'restore_pob_spec') return stored.notice;
    computed = true; return {};
  });
  connection.tools = connection.tools.filter(tool => tool.name !== 'get_tool_result');
  await assert.rejects(connection.compute(createBuildDocument('test', createBlankXml())), /get_tool_result/);
  assert.equal(computed, false);
});


test('stored pages share one declining request budget instead of restarting thirty minutes per page', async t => {
  let now = 0; t.mock.method(performance, 'now', () => now);
  const stored = storedWire({ build_spec: {}, notes: ['기록🙂'.repeat(1500)] });
  const budgets: number[] = [];
  const connection = wireConnection((name, args, options) => {
    assert.equal(options?.resetTimeoutOnProgress, false);
    assert.equal(options?.timeout, options?.maxTotalTimeout);
    if (name === 'server_info') return { stale: false };
    if (name === 'restore_pob_spec') { now += 100; return stored.notice; }
    if (name === 'get_tool_result') { budgets.push(Number(options?.maxTotalTimeout)); now += 100; return stored.page(Number(args.offset)); }
    return { stats: { Life: 1187 } };
  });
  await connection.compute(createBuildDocument('test', createBlankXml()));
  assert.ok(budgets.length > 2);
  assert.equal(budgets[0], 1_799_900);
  assert.ok(budgets.every((value, index) => !index || value < budgets[index - 1]));
});

test('a result arriving after the shared recovery deadline is not used for calculation', async t => {
  let now = 0; t.mock.method(performance, 'now', () => now);
  const stored = storedWire({ build_spec: {} }); let computed = false;
  const connection = wireConnection(name => {
    if (name === 'server_info') return { stale: false };
    if (name === 'restore_pob_spec') return stored.notice;
    if (name === 'get_tool_result') { now += 1_800_001; return stored.page(0); }
    computed = true; return {};
  });
  await assert.rejects(connection.compute(createBuildDocument('test', createBlankXml())), /시간이 초과/);
  assert.equal(computed, false);
});

const identity = {
  apiVersion: 1 as const, pok: { version: 'test', sourceCommit: 'a'.repeat(40), sourceDigest: 'b'.repeat(64) },
  pob: { commit: 'c'.repeat(40), sourceDigest: 'd'.repeat(64) }, kb: { manifestSha256: 'e'.repeat(64), contentSha256: 'f'.repeat(64), patch: 'test' },
  capabilities: { computeXml: true, renderItem: true, catalogExport: true },
};
test('connection checks skip cold KB diagnostics and use short bounded deadlines',async()=>{
  const connection=new PokConnection();const requests:any[]=[];
  connection.tools=[{name:'server_info',inputSchema:{properties:{include_kb_diagnostics:{type:'boolean'}}}},{name:'render_pob_item',inputSchema:{}}];
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
