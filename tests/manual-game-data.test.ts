import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,mkdtemp,readFile,realpath,rm,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {prepareManualBundle} from '../scripts/prepare-manual-bundle';
import {ManualGameDataStore,manualBundleId} from '../src/main/manual-game-data';
import type {ManualBundleManifest,PobWorkerIdentity} from '../src/shared/pob-worker';

const hash=(value:string|Uint8Array)=>createHash('sha256').update(value).digest('hex');
const json=async(path:string,value:unknown)=>writeFile(path,JSON.stringify(value),'utf8');
function workerIdentity():PobWorkerIdentity {
  const body={format:'pok.pob-worker-identity.v1',runtime_kind:'pob-worker',protocol:'pok.pob-worker.v1',algorithm:'relative-file-bytes-and-runtime-components.v1',pob_commit:'f'.repeat(40),adapter_sources_sha256:'1'.repeat(64),adapter_lua_sha256:'2'.repeat(64),pob_source_sha256:'3'.repeat(64),pob_runtime_sha256:'4'.repeat(64),lua_executable_sha256:'5'.repeat(64),python_executable_sha256:'6'.repeat(64),python_version:'transport fixture',platform:process.platform,claim:'content_fingerprints_not_deployment_or_game_certification',loaded_native_modules:'not_verified',external_system_libraries:'not_verified'};
  const stable='{'+Object.keys(body).sort().map(key=>JSON.stringify(key)+':'+JSON.stringify(body[key as keyof typeof body])).join(',')+'}';
  return {...body,sha256:hash(stable)} as PobWorkerIdentity;
}
async function fixture(){
  const root=await mkdtemp(join(tmpdir(),'pok-manual-data-'));
  await mkdir(join(root,'pob-worker','python'),{recursive:true});
  await mkdir(join(root,'pob-catalog'));
  await mkdir(join(root,'passive-tree','0_5'),{recursive:true});
  const identity=workerIdentity();
  const tree=JSON.stringify({nodes:{},groups:{},classes:[],constants:{orbitRadii:[],orbitAnglesByOrbit:[]},nodeOverlay:{},min_x:0,max_x:0,min_y:0,max_y:0});
  const treeManifest={schemaVersion:1,version:'0_5',treeFile:'tree.json',assets:{icon:{file:'icon.webp',mime:'image/webp',width:1,height:1}},source:{project:'fixture',commit:identity.pob_commit,treeSha256:'a'.repeat(64)},treeFileSha256:hash(tree),diagnostics:{missingArtwork:[]}};
  await writeFile(join(root,'passive-tree','0_5','tree.json'),tree);
  await json(join(root,'passive-tree','0_5','manifest.json'),treeManifest);
  await writeFile(join(root,'passive-tree','0_5','icon.webp'),'image fixture');
  await writeFile(join(root,'pob-worker','python','python.exe'),'binary fixture');
  await json(join(root,'pob-worker','worker-manifest.json'),{format:'pok.pob-worker-bundle.v1',protocol:'pok.pob-worker.v1',platform:process.platform,pob_commit:identity.pob_commit,identity,paths:{python:'python/python.exe',adapter:'adapter',pob:'pob',luajit:'luajit/luajit.exe'},files:{'python/python.exe':{bytes:14,sha256:hash('binary fixture')},'pob/src/TreeData/0_5/tree.json':{bytes:10,sha256:'a'.repeat(64)}},origin:{adapter_dirty:false}});
  await json(join(root,'pob-catalog','catalog.json'),{schemaVersion:2,extractorVersion:'2',defaultTreeVersion:'0_5',supportedTreeVersions:['0_5'],classes:[],entries:[{type:'base',id:'Iron Ring',name:'Iron Ring',raw:{}}],diagnostics:[],source:{format:'pok.pob-catalog-source.v2',identity,identitySha256:identity.sha256,pobCommit:identity.pob_commit,exporterVersion:'2'}});
  const paths=['pob-worker/worker-manifest.json','pob-catalog/catalog.json','passive-tree/0_5/tree.json','passive-tree/0_5/manifest.json','passive-tree/0_5/icon.webp'];
  async function seal(edit?:(manifest:ManualBundleManifest)=>void){
    const files=await Promise.all(paths.map(async path=>{const raw=await readFile(join(root,path));return {path,size:raw.length,sha256:hash(raw)};}));
    const manifest:ManualBundleManifest={format:'pok.ui-manual-bundle.v2',schemaVersion:2,bundleId:'',identity,worker:{path:'pob-worker',manifest:'worker-manifest.json',sha256:files.find(file=>file.path==='pob-worker/worker-manifest.json')!.sha256},catalog:{path:'pob-catalog/catalog.json',sha256:files.find(file=>file.path==='pob-catalog/catalog.json')!.sha256},trees:{path:'passive-tree',defaultVersion:'0_5',supportedVersions:['0_5']},files};
    edit?.(manifest);manifest.bundleId=manualBundleId(manifest);await json(join(root,'bundle-manifest.json'),manifest);return manifest;
  }
  const manifest=await seal();
  return {root,manifest,seal,treeManifest,async cleanup(){assert.ok(resolve(root).startsWith(resolve(tmpdir(),'pok-manual-data-')));await rm(root,{recursive:true,force:true});}};
}

test('manual catalog, tree and descriptor work without a KB or PoK identity',async()=>{
  const f=await fixture();
  try{
    const store=new ManualGameDataStore(f.root),info=await store.getInfo();
    assert.equal(info.status,'ready');assert.equal(info.identity,undefined);assert.equal(info.workerIdentity?.sha256,f.manifest.identity.sha256);
    assert.equal((await store.query({query:'Iron'})).total,1);
    assert.equal((await store.getEntry('base','Iron Ring')).name,'Iron Ring');
    const tree=await store.loadTree('0_5');
    assert.ok(tree.assets.icon!.url.includes(f.manifest.bundleId));
    assert.equal(Buffer.from((await store.asset(tree.assets.icon!.url)).body).toString(),'image fixture');
    const launch=await store.getWorkerLaunchDescriptor(join(f.root,'cache'));
    assert.equal(launch.command,await realpath(join(f.root,'pob-worker','python','python.exe')));
    assert.equal(launch.allowDevelopment,false);
    assert.equal(launch.identity.sha256,f.manifest.identity.sha256);
  } finally{await f.cleanup();}
});

test('descriptor refuses a changed catalog after initial data verification',async()=>{
  const f=await fixture();
  try{
    const store=new ManualGameDataStore(f.root);assert.equal((await store.getInfo()).status,'ready');
    await writeFile(join(f.root,'pob-catalog','catalog.json'),'{}');
    await assert.rejects(store.getWorkerLaunchDescriptor(join(f.root,'cache')),/변경/);
  } finally{await f.cleanup();}
});

test('matching PoB commit alone cannot authorize a different raw display tree',async()=>{
  const f=await fixture();
  try{
    f.treeManifest.source.treeSha256='b'.repeat(64);
    await json(join(f.root,'passive-tree','0_5','manifest.json'),f.treeManifest);await f.seal();
    assert.equal((await new ManualGameDataStore(f.root).getInfo()).status,'corrupt');
  } finally{await f.cleanup();}
});

test('relative traversal is rejected even with a freshly computed bundle ID',async()=>{
  const f=await fixture();
  try{
    await f.seal(manifest=>{manifest.worker.path='../outside';});
    assert.equal((await new ManualGameDataStore(f.root).getInfo()).status,'corrupt');
  } finally{await f.cleanup();}
});

test('descriptor refuses a changed interpreter before launching a process',async()=>{
  const f=await fixture();
  try{
    const store=new ManualGameDataStore(f.root);assert.equal((await store.getInfo()).status,'ready');
    await writeFile(join(f.root,'pob-worker','python','python.exe'),'tamper fixture');
    await assert.rejects(store.getWorkerLaunchDescriptor(join(f.root,'cache')),/Python.*변경/);
  } finally{await f.cleanup();}
});

test('a live data store refuses a newly sealed bundle rather than silently upgrading',async()=>{
  const f=await fixture();
  try{
    const store=new ManualGameDataStore(f.root);assert.equal((await store.getInfo()).status,'ready');
    const catalog=JSON.parse(await readFile(join(f.root,'pob-catalog','catalog.json'),'utf8'));
    catalog.entries.push({type:'base',id:'Other Ring',name:'Other Ring',raw:{}});
    await json(join(f.root,'pob-catalog','catalog.json'),catalog);await f.seal();
    await assert.rejects(store.getWorkerLaunchDescriptor(join(f.root,'cache')),/다시 시작/);
  } finally{await f.cleanup();}
});


test('manual bundle composition validates the copied assets and preserves its sources',async()=>{
  const f=await fixture();
  try{
    const before=await readFile(join(f.root,'pob-worker','worker-manifest.json'),'utf8');
    const result=await prepareManualBundle({workerRoot:join(f.root,'pob-worker'),catalog:join(f.root,'pob-catalog','catalog.json'),treesRoot:join(f.root,'passive-tree'),output:join(f.root,'prepared')});
    assert.equal(result.entries,1);assert.deepEqual(result.treeVersions,['0_5']);
    assert.equal((await new ManualGameDataStore(result.root).getInfo()).status,'ready');
    assert.equal(await readFile(join(f.root,'pob-worker','worker-manifest.json'),'utf8'),before);
    await assert.rejects(prepareManualBundle({workerRoot:join(f.root,'pob-worker'),catalog:join(f.root,'pob-catalog','catalog.json'),treesRoot:join(f.root,'passive-tree'),output:result.root}),/new directory/);
  } finally{await f.cleanup();}
});

test('manual bundle preparation refuses a dirty worker before creating output',async()=>{
  const f=await fixture();
  try{
    const path=join(f.root,'pob-worker','worker-manifest.json'),worker=JSON.parse(await readFile(path,'utf8'));
    worker.origin.adapter_dirty=true;await json(path,worker);
    await assert.rejects(prepareManualBundle({workerRoot:join(f.root,'pob-worker'),catalog:join(f.root,'pob-catalog','catalog.json'),treesRoot:join(f.root,'passive-tree'),output:join(f.root,'prepared')}),/clean committed worker/);
    await assert.rejects(readFile(join(f.root,'prepared','bundle-manifest.json')),/ENOENT/);
  } finally{await f.cleanup();}
});
