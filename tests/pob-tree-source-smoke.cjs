// Regression: stock PassiveTree reads tree.lua, whose frames can be absent from tree.json.
require('tsx/cjs');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {PobRuntime}=require('../src/main/pob-runtime.ts'),{normalizeTree}=require('../src/renderer/features/passive-tree-geometry.ts');
const runtime=new PobRuntime(path.resolve('resources/pob-runtime')),report={passed:[],trees:[]};
const stable=value=>Array.isArray(value)?'['+value.map(stable).join(',')+']':value&&typeof value==='object'?'{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+stable(value[key])).join(',')+'}':JSON.stringify(value);
const sha=value=>createHash('sha256').update(value).digest('hex');
(async()=>{
  const info=await runtime.getInfo();assert.equal(info.status,'ready');report.runtimeId=info.runtimeId;
  for(const version of info.supportedTreeVersions){
    const source=await runtime.treeSource(version),root=path.resolve('resources/pob-editor/trees',version),tree=JSON.parse(fs.readFileSync(path.join(root,'tree.json'))),manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));
    assert.equal(manifest.source.format,'pob-lua-raw-v1');
    assert.equal(manifest.source.exportSha256,sha(stable(source)+'\n'));
    assert.equal(manifest.source.files['tree.lua'],sha(fs.readFileSync(path.resolve('resources/pob-runtime/pob/src/TreeData',version,'tree.lua'))));
    assert.deepEqual(tree.nodeOverlay,source.nodeOverlay);
    for(const kind of ['Normal','Notable','Keystone','Socket'])for(const image of Object.values(source.nodeOverlay[kind]))assert(manifest.assets[image],`${version}: missing stock frame ${image}`);
    assert.equal(manifest.diagnostics.missingArtwork.length,0);
    const graph=normalizeTree(tree),nativeGraph=normalizeTree(source);
    assert(graph.nodes.size>1000);assert.equal(graph.nodes.size,nativeGraph.nodes.size);assert.deepEqual(graph.edges,nativeGraph.edges);
    for(const [id,node]of nativeGraph.nodes){assert.deepEqual(graph.nodes.get(id),node);assert(Number.isFinite(node.x)&&Number.isFinite(node.y));}
    report.trees.push({version,nodes:graph.nodes.size,edges:graph.edges.length,frames:Object.keys(tree.nodeOverlay),missingArtwork:0});
  }
  report.passed.push('all shipped tree versions retain original Lua frames, exact source provenance, positions and connectors');
  await assert.rejects(runtime.treeSource('../0_1'));report.passed.push('unsupported tree export never accepts a source path');
})().catch(error=>{report.error=error.stack;process.exitCode=1;}).finally(()=>{runtime.close();fs.mkdirSync('.local/standalone-pob',{recursive:true});fs.writeFileSync('.local/standalone-pob/tree-source-result.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));});
