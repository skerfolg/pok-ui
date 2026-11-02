import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {assertWorkerCatalog, assertWorkerIdentity, PobWorkerConnection, type WorkerLaunchDescriptor} from '../src/main/pob-worker';
import type {WorkerCatalog, PobWorkerIdentity} from '../src/shared/pob-worker';

function identity(): PobWorkerIdentity {
  const value = {
    format: 'pok.pob-worker-identity.v1', runtime_kind: 'pob-worker', protocol: 'pok.pob-worker.v1',
    algorithm: 'relative-file-bytes-and-runtime-components.v1', pob_commit: 'f'.repeat(40),
    adapter_sources_sha256: '1'.repeat(64), adapter_lua_sha256: '2'.repeat(64),
    pob_source_sha256: '3'.repeat(64), pob_runtime_sha256: '4'.repeat(64),
    lua_executable_sha256: '5'.repeat(64), python_executable_sha256: '6'.repeat(64),
    python_version: 'transport fixture', platform: process.platform,
    claim: 'content_fingerprints_not_deployment_or_game_certification',
    loaded_native_modules: 'not_verified', external_system_libraries: 'not_verified',
  };
  const canonical = '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + JSON.stringify(value[key as keyof typeof value])).join(',') + '}';
  return {...value, sha256: createHash('sha256').update(canonical).digest('hex')} as PobWorkerIdentity;
}

function catalog(): WorkerCatalog {
  const source = identity();
  return {schemaVersion:2,extractorVersion:'2',defaultTreeVersion:'0_5',supportedTreeVersions:['0_5'],classes:[],entries:[{type:'base',id:'Iron Ring',name:'Iron Ring',raw:{}}],diagnostics:[],source:{format:'pok.pob-catalog-source.v2',identity:source,identitySha256:source.sha256,pobCommit:source.pob_commit,exporterVersion:'2'}};
}

// Transport fixture only: no native calculation or game-correctness evidence.
function launch(mode = 'normal'): WorkerLaunchDescriptor {
  const value = identity();
  const script = `
    const readline=require('node:readline'),crypto=require('node:crypto');
    const identity=JSON.parse(process.argv[1]),mode=process.argv[2],catalog=JSON.parse(process.argv[3]);let initTimer;
    const emit=x=>console.log(JSON.stringify(x));
    const owner='transport-fixture';
    setTimeout(()=>emit({event:'hello',protocol:'pok.pob-worker.v1',worker_instance:owner}),mode==='delayed-startup'?1000:0);
    const input=readline.createInterface({input:process.stdin});
    input.on('line',line=>{
      const r=JSON.parse(line);
      if(r.method==='initialize')initTimer=setTimeout(()=>emit({id:r.id,ok:true,result:{identity,provenance:{mode:'bundled',bundle_manifest_verified:true}},execution:{owner}}),mode==='delayed-startup'?2000:0);
      else if(r.method==='runtime_info')emit({id:r.id,ok:true,identity});
      else if(r.method==='export_catalog')emit({id:r.id,ok:true,result:{identity,catalog},execution:{owner}});
      else if(r.method==='render_item')emit({id:r.id,ok:true,result:{identity,ok:true,text:'Transport item fixture'},execution:{owner}});
      else if(r.method==='compute_xml') {
        if(mode==='crash') {input.close(); process.exitCode=1;process.stdin.destroy();return;}
        emit({id:r.id,ok:true,result:{identity,xml_revision:mode==='wrong-revision'?'wrong':'sha256:'+crypto.createHash('sha256').update(r.params.xml).digest('hex'),stats:{Life:1}},execution:{owner}});
      } else if(r.method==='shutdown') {
        clearTimeout(initTimer);
        emit({id:r.id,ok:true,cleanup:{confirmed:true}});
        emit({event:'closed',worker_instance:owner,cleanup:{confirmed:true}});
        input.close();process.stdin.destroy();
      }
    });
  `;
  return {root: process.cwd(), command: process.execPath, args: ['-e',script,JSON.stringify(value),mode,JSON.stringify(catalog())], bundleId:'transport-fixture',identity:value,allowDevelopment:false};
}

test('worker identity rejects byte changes and the legacy KB contract', () => {
  const value = identity();
  assertWorkerIdentity(value);
  assert.throws(() => assertWorkerIdentity({...value,pob_source_sha256:'0'.repeat(64)}));
  assert.throws(() => assertWorkerIdentity({apiVersion:1,kbDigest:'0'.repeat(64)}));
});

test('worker transport binds exact XML revision and confirms shutdown', async () => {
  const worker = new PobWorkerConnection();
  try {
    const actual = await worker.connect(launch());
    assert.equal(actual.identity.sha256, identity().sha256);
    const runtime = await worker.request('runtime_info');
    assert.equal((runtime.identity as PobWorkerIdentity).sha256, actual.identity.sha256);
    const xml = '<PathOfBuilding>\r\n</PathOfBuilding>';
    const result = await worker.compute(xml);
    assert.equal(result.xml_revision, 'sha256:' + createHash('sha256').update(xml).digest('hex'));
    await worker.close();
    assert.equal(worker.connected,false);
    await worker.connect(launch());
  } finally {await worker.close();}
});

test('worker transport rejects a result for another XML revision', async () => {
  const worker = new PobWorkerConnection();
  try {
    await worker.connect(launch('wrong-revision'));
    await assert.rejects(worker.compute('<PathOfBuilding/>'),/입력이 다릅니다/);
  } finally {await worker.close();}
});

test('unconfirmed native cleanup blocks replacement after a worker crash', async () => {
  const worker = new PobWorkerConnection();
  await worker.connect(launch('crash'));
  await assert.rejects(worker.compute('<PathOfBuilding/>'),/종료/);
  await assert.rejects(worker.close(),/종료.*확인/);
  await assert.rejects(worker.connect(launch()),/종료.*확인/);
});


test('simultaneous connects cannot replace a worker being initialized', async () => {
  const worker = new PobWorkerConnection();
  const first = worker.connect(launch());
  await assert.rejects(worker.connect(launch()), /이미 진행 중/);
  try {await first; assert.equal(worker.connected,true);} finally {await worker.close();}
});


test('catalog consumer rejects stale identities, duplicate typed IDs and unknown losses', () => {
  assertWorkerCatalog(catalog(),identity());
  const stale = catalog(); stale.source.identitySha256 = '0'.repeat(64);
  assert.throws(() => assertWorkerCatalog(stale,identity()), /출처/);
  const duplicate = catalog(); duplicate.entries.push({...duplicate.entries[0]!});
  assert.throws(() => assertWorkerCatalog(duplicate,identity()), /중복/);
  const losses = catalog(); losses.diagnostics.push({kind:'unknown-loss',handling:'delegated-to-pob',severity:'info'});
  assert.throws(() => assertWorkerCatalog(losses,identity()), /손실/);
});

test('worker client consumes catalog v2 and native render envelopes without KB fields', async () => {
  const worker = new PobWorkerConnection();
  try {
    await worker.connect(launch());
    const actual = await worker.exportCatalog();
    assert.equal(actual.source.identitySha256,identity().sha256);
    assert.equal('kbManifestSha256' in actual.source,false);
    assert.equal((await worker.renderItem({kind:'base',id:'Iron Ring'})).text,'Transport item fixture');
  } finally {await worker.close();}
});

test('hello and initialization share one absolute startup budget', async () => {
  const worker = new PobWorkerConnection(2500);
  await assert.rejects(worker.connect(launch('delayed-startup')), /초과/);
  assert.equal(worker.connected,false);
  await worker.close();
});
