import test from 'node:test';
import assert from 'node:assert/strict';
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
  const restore = storedWire({ build_spec: buildSpec, notes: ['원문 보존🙂'.repeat(900)], needs_decision: ['choose stages'], faithful: false });
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
  assert.deepEqual(calculation.result, { ...computed, pok_runtime: { stale: false } });
  assert.deepEqual(calculation.restoreNotes, ['원문 보존🙂'.repeat(900), 'choose stages', '원본 전체를 완전히 복원하지 못한 계산입니다.']);
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
  assert.deepEqual(calculation.result, { ...fixture.expected, pok_runtime: { stale: false } });
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
