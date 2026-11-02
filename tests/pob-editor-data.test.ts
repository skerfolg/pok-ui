import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {PobEditorData} from '../src/main/pob-editor-data';
const sha=(v:string|Uint8Array)=>createHash('sha256').update(v).digest('hex');
async function fixture(){
  const root=await mkdtemp(join(tmpdir(),'pob-editor-')),commit='a'.repeat(40),runtimeId='pob-'+'b'.repeat(64);
  const tree=JSON.stringify({nodes:{'1':{skill:1,name:'Synthetic'}},groups:{}});
  const catalog={schemaVersion:1,source:{runtimeId,commit,version:'test'},defaultTreeVersion:'0_5',supportedTreeVersions:['0_5'],classes:[{id:'Synthetic',name:'Synthetic',internalId:1,legacyId:1,ascendancies:[]}],entries:[{type:'base',id:'synthetic',name:'Synthetic Ring',category:'Ring',raw:{type:'Ring'}}],diagnostics:[]};
  const values:Record<string,string|Uint8Array>={
    'catalog.json':JSON.stringify(catalog),'trees/0_5/tree.json':tree,
    'trees/0_5/manifest.json':JSON.stringify({schemaVersion:1,version:'0_5',treeFile:'tree.json',treeFileSha256:sha(tree),source:{project:'PathOfBuilding-PoE2',commit,treeSha256:'fixture'},assets:{icon:{file:'icon.webp',mime:'image/webp',width:64,height:64}}}),
    'trees/0_5/icon.webp':new Uint8Array([82,73,70,70]),
  };
  for(const [path,value] of Object.entries(values)){await mkdir(dirname(join(root,path)),{recursive:true});await writeFile(join(root,path),value);}
  const body={schemaVersion:1,runtimeId,commit,version:'test',defaultTreeVersion:'0_5',supportedTreeVersions:['0_5'],files:Object.entries(values).map(([path,value])=>({path,sha256:sha(value)}))};
  const bundleId='pob-editor-'+sha(JSON.stringify(body));await writeFile(join(root,'manifest.json'),JSON.stringify({...body,bundleId}));
  return{root,runtimeId,commit,bundleId,runtime:{getInfo:async()=>({status:'ready' as const,runtimeId,commit,version:'test'})}};
}
test('standalone catalogue and scoped tree assets work with no PoK or KB identity',async()=>{
  const f=await fixture(),data=new PobEditorData(f.root,f.runtime);const info=await data.getInfo();
  assert.equal(info.status,'ready',info.error);assert.equal(info.source,'pob');assert.equal(info.identity,undefined);
  assert.equal((await data.query({type:'base',query:'synthetic',category:'Ring'})).total,1);
  assert.equal((await data.getEntry('base','synthetic')).name,'Synthetic Ring');
  const tree=await data.loadTree('0_5');assert.equal(tree.assets.icon.url,`pok-tree://assets/${f.bundleId}/0_5/icon.webp`);
  assert.equal((await data.asset(tree.assets.icon.url)).body.length,4);
  await assert.rejects(data.asset(tree.assets.icon.url.replace(f.bundleId,'pob-editor-'+'c'.repeat(64))),/묶음/);
  await assert.rejects(data.loadTree('0_4'),/버전/);
});
test('standalone editor refuses a changed source identity and corrupted display bytes',async()=>{
  const f=await fixture();
  const mismatched=new PobEditorData(f.root,{getInfo:async()=>({...await f.runtime.getInfo(),runtimeId:'pob-'+'c'.repeat(64)})});
  assert.equal((await mismatched.getInfo()).status,'corrupt');
  await writeFile(join(f.root,'trees/0_5/icon.webp'),'changed');
  const info=await new PobEditorData(f.root,f.runtime).getInfo();assert.equal(info.status,'corrupt');assert.match(info.error!,/무결성/);
});
