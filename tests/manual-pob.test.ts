import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {ManualPobBackend} from '../src/main/manual-pob';
import {isCalculationCurrent} from '../src/shared/calculation-context';
import {createBlankXml} from '../src/shared/pob-document';
import type {BuildDocument} from '../src/shared/contracts';
import type {DataBundleInfo} from '../src/shared/game-data';
import type {PobWorkerIdentity,WorkerCalculation} from '../src/shared/pob-worker';
import type {WorkerLaunchDescriptor} from '../src/main/pob-worker';

// Controller transport fixture, never evidence for native game calculations.
const identity:PobWorkerIdentity={format:'pok.pob-worker-identity.v1',runtime_kind:'pob-worker',protocol:'pok.pob-worker.v1',algorithm:'relative-file-bytes-and-runtime-components.v1',pob_commit:'f'.repeat(40),adapter_sources_sha256:'1'.repeat(64),adapter_lua_sha256:'2'.repeat(64),pob_source_sha256:'3'.repeat(64),pob_runtime_sha256:'4'.repeat(64),lua_executable_sha256:'5'.repeat(64),python_executable_sha256:'6'.repeat(64),python_version:'controller fixture',platform:process.platform,claim:'content_fingerprints_not_deployment_or_game_certification',loaded_native_modules:'not_verified',external_system_libraries:'not_verified',sha256:'7'.repeat(64)};
const info:DataBundleInfo={status:'ready',bundleId:'pokbundle-'+'a'.repeat(32),workerIdentity:identity,defaultTreeVersion:'0_5'};
const launch:WorkerLaunchDescriptor={root:resolve('.'),command:process.execPath,args:[],bundleId:info.bundleId!,identity,allowDevelopment:false};
const hash=(xml:string)=>createHash('sha256').update(xml,'utf8').digest('hex');
class TransportWorker {
  connected=false;busy=false;workerInstance='controller fixture';starts=0;computes=0;seen='';budgets:number[]=[];
  async connect(value:WorkerLaunchDescriptor,timeoutMs?:number){this.starts++;this.connected=true;this.budgets.push(timeoutMs!);return {identity:value.identity,provenance:{mode:'bundled' as const,bundle_manifest_verified:true,pob_commit_origin:'controller fixture'}};}
  async compute(xml:string,_stats?:string[],timeoutMs?:number):Promise<WorkerCalculation>{this.computes++;this.seen=xml;this.budgets.push(timeoutMs!);return {xml_revision:'sha256:'+hash(xml),stats:{Life:null},missing_stats:[],meta:{},allocated_nodes:[],identity,claim:'native_calculation_not_game_validation',execution:{owner:'controller fixture'},wire_normalizations:[{path:'/result/stats/Life',value:'nan',serialized_as:'null'}]};}
  async renderItem(){return {ok:true,text:'controller item fixture'};}
  async close(){this.connected=false;}
}
function build():BuildDocument{
  const xml=createBlankXml({defaultTreeVersion:'0_5'}).replace('</PathOfBuilding2>','<Unknown amount="9007199254740993"><![CDATA[opaque]]></Unknown></PathOfBuilding2>');
  return {id:'fixture',name:'fixture',revision:4,createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:00Z',xml,originalXml:xml,sourceName:'fixture.xml',undo:[]};
}
const data={getInfo:async()=>info,getWorkerLaunchDescriptor:async()=>launch};

test('manual controller binds original and actual input without KB or PoK provenance',async()=>{
  const worker=new TransportWorker(),backend=new ManualPobBackend(data,resolve('cache'),worker),source=build(),original=JSON.stringify(source);
  try{
    const result=await backend.compute(source);
    assert.equal(JSON.stringify(source),original);
    assert.ok(worker.seen.includes('9007199254740993'));
    assert.equal(result.provenance?.xmlSha256,hash(source.xml));
    assert.ok(result.provenance&&'format' in result.provenance&&result.provenance.format==='pob-worker-xml.v1');
    assert.equal(result.provenance.submittedXmlSha256,hash(worker.seen));
    assert.equal('kbDigest' in result.provenance,false);
    assert.equal('pokSourceDigest' in result.provenance,false);
    assert.equal((result.result.stats as Record<string,unknown>).Life,null);
    assert.ok(result.restoreNotes.some(note=>(note as {value?:string}).value==='nan'));
    source.calculation=result;
    const context={expectedIdentitySha256:identity.sha256,observedIdentitySha256:backend.getRuntimeVerification()?.identitySha256,workerInstance:backend.getRuntimeVerification()?.workerInstance};
    assert.equal(isCalculationCurrent(source,info.bundleId,hash(source.xml)),false);
    assert.equal(isCalculationCurrent(source,info.bundleId,hash(source.xml),{expectedIdentitySha256:identity.sha256}),false);
    assert.equal(isCalculationCurrent(source,info.bundleId,hash(source.xml),context),true);
    assert.equal(isCalculationCurrent(source,info.bundleId,hash(source.xml),{...context,workerInstance:'previous worker'}),false);
    assert.equal(worker.starts,1);
    assert.ok(worker.budgets.every(value=>value>0&&value<=180_000));
  }finally{await backend.close();}
});

test('manual controller rejects mismatched data and execution sources before native startup',async()=>{
  const worker=new TransportWorker();
  const backend=new ManualPobBackend({...data,getWorkerLaunchDescriptor:async()=>({...launch,bundleId:'other'})},resolve('cache'),worker);
  try{await assert.rejects(backend.compute(build()),/출처/);assert.equal(worker.starts,0);}
  finally{await backend.close();}
});

test('expired data preparation cannot start a late native worker',async()=>{
  const worker=new TransportWorker();
  const backend=new ManualPobBackend({...data,getInfo:async()=>{await delay(80);return info;}},resolve('cache'),worker,20);
  try{await assert.rejects(backend.compute(build()),/초과/);await delay(100);assert.equal(worker.starts,0);}
  finally{await backend.close();}
});

test('manual controller refuses work while native cleanup is pending or after close',async()=>{
  const worker=new TransportWorker(),backend=new ManualPobBackend(data,resolve('cache'),worker);
  worker.busy=true;
  await assert.rejects(backend.compute(build()),/정리/);assert.equal(worker.computes,0);
  await backend.close();worker.busy=false;
  await assert.rejects(backend.compute(build()),/종료/);assert.equal(worker.starts,0);
});
