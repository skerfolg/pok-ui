import {resolve,join} from 'node:path';
import {PobRuntime} from '../src/main/pob-runtime.ts';
import {PobEditorData} from '../src/main/pob-editor-data.ts';
import {createBlankXml} from '../src/shared/pob-document.ts';
import {createBuildDocument} from '../src/shared/state.ts';
const arg=name=>{const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:undefined;};
if(arg('--platform')&&arg('--platform')!==process.platform)throw new Error('Native PoB verification must run on the target platform.');
const resources=resolve(arg('--resources')||'resources');
const runtime=new PobRuntime(join(resources,'pob-runtime'));
try{
  const info=await runtime.getInfo();if(info.status!=='ready')throw new Error(info.error);
  const data=new PobEditorData(join(resources,'pob-editor'),runtime),catalog=await data.getInfo();
  if(catalog.status!=='ready')throw new Error(catalog.error);
  for(const version of catalog.supportedTreeVersions){const tree=await data.loadTree(version);if(Object.keys(tree.tree.nodes).length===0)throw new Error('Empty passive tree: '+version);}
  const calculated=await runtime.compute(createBuildDocument('Synthetic runtime verification',createBlankXml({defaultTreeVersion:catalog.defaultTreeVersion,characterClass:catalog.classes[0]})));
  if(calculated.result.ok!==true||!Number.isFinite(calculated.result.stats.Life))throw new Error('Native PoB calculation verification failed');
  console.log(`Independent PoB verified: ${info.version} ${info.commit}; ${catalog.catalog.entries} entries; ${catalog.supportedTreeVersions.length} trees; PoK not required`);
}finally{runtime.close();}
