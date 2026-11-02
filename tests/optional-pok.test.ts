import test from 'node:test';
import assert from 'node:assert/strict';
import {assertAgentContract,PokConnection,type PokTool} from '../src/main/pok';

const pin='f'.repeat(40);
const tools:PokTool[]=['server_info','get_server_capabilities','search_kb','read_design_record','capture_design_material','compute_pob_document'].map(name=>({name,inputSchema:{type:'object',properties:name==='read_design_record'?{record_ref:{type:'object'}}:name==='server_info'?{include_kb_diagnostics:{type:'boolean'}}:{}}}));
function info(){return {loaded_commit:'a'.repeat(40),source_commit:'a'.repeat(40),stale:false,identity_status:'verified',pob_runtime_declaration:{format:'pok.pob-runtime-declaration.v1',claim:'configured_pin_not_observed_execution',status:'declared',pob_commit:pin,snapshot_available:false},capabilities:{request_execution:{server_instance:'agent fixture'}}};}

test('agent profile accepts the current core without legacy desktop calculation aliases',()=>{
  const actual=info();actual.loaded_commit='abcdef1';actual.source_commit='abcdef1';
  const identity=assertAgentContract(actual,tools,pin);
  assert.equal(identity.format,'pok.agent-connection.v1');
  assert.equal(identity.declaredPobCommit,pin);
  assert.equal(identity.claim,'git_process_and_declared_pin_not_native_execution_identity');
  assert.equal(tools.some(tool=>tool.name==='compute_pob_xml'),false);
  assert.equal(tools.some(tool=>tool.name==='render_pob_item'),false);
});

test('agent compatibility refuses an unknown or different configured pin and stale source',()=>{
  assert.throws(()=>assertAgentContract(info(),tools,'b'.repeat(40)),/pin/);
  const unknown=info();unknown.pob_runtime_declaration.status='unavailable';
  assert.throws(()=>assertAgentContract(unknown,tools,pin),/pin/);
  assert.throws(()=>assertAgentContract({...info(),stale:true},tools,pin),/소스/);
  const broken=tools.map(tool=>({...tool,inputSchema:{properties:{}}}));
  assert.throws(()=>assertAgentContract(info(),broken,pin),/파라미터/);
});

test('agent calls verify their own process declaration before dispatch without a legacy identity',async()=>{
  const connection=new PokConnection(),expected=info(),seen:string[]=[];
  const client={async callTool(request:{name:string;arguments:Record<string,unknown>}){
    seen.push(request.name);
    if(request.name==='server_info'){assert.equal(request.arguments.include_kb_diagnostics,false);return {structuredContent:expected};}
    return {structuredContent:{ok:true}};
  }};
  Object.assign(connection,{client,tools,expectedAgent:assertAgentContract(expected,tools,pin)});
  assert.equal(connection.connected,true);
  assert.deepEqual(await connection.call('search_kb',{query:'transport fixture'}),{ok:true});
  assert.deepEqual(seen,['server_info','search_kb']);
});

test('a changed agent process cannot dispatch its queued tool call',async()=>{
  const connection=new PokConnection(),original=info(),changed=info(),seen:string[]=[];
  changed.capabilities.request_execution.server_instance='other process';
  const client={async callTool(request:{name:string}){seen.push(request.name);return {structuredContent:changed};}};
  Object.assign(connection,{client,tools,expectedAgent:assertAgentContract(original,tools,pin)});
  await assert.rejects(connection.call('search_kb',{query:'transport fixture'}),/실행 세션/);
  assert.deepEqual(seen,['server_info']);
});
