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
