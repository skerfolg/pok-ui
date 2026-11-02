/** Compose native worker/catalog and rendered tree assets; never calculate game values. */
import {cp,lstat,mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import {isAbsolute,join,relative,resolve,dirname,basename} from 'node:path';
import {pathToFileURL} from 'node:url';
import {sha256File} from './file-integrity.mjs';
import {ManualGameDataStore,manualBundleId} from '../src/main/manual-game-data';
import {assertWorkerCatalog,assertWorkerIdentity} from '../src/main/pob-worker';
import type {ManualBundleManifest} from '../src/shared/pob-worker';

interface Options {workerRoot:string;catalog:string;treesRoot:string;output:string;allowDevelopment?:boolean}
function inside(parent:string,path:string):boolean {
  const delta=relative(parent,path);
  return !isAbsolute(delta)&&!delta.split(/[\\/]/).includes('..');
}
async function missing(path:string):Promise<boolean>{
  try{await lstat(path);return false;}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return true;throw error;}
}
async function inventory(root:string,directory:string):Promise<ManualBundleManifest['files']>{
  const result:ManualBundleManifest['files']=[];
  for(const item of (await readdir(directory,{withFileTypes:true})).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0)){
    const path=join(directory,item.name);
    if(item.isSymbolicLink())throw new Error('Manual bundle display assets must not be symlinks.');
    if(item.isDirectory())result.push(...await inventory(root,path));
    else if(item.isFile())result.push({path:relative(root,path).split('\\').join('/'),size:(await lstat(path)).size,sha256:await sha256File(path)});
    else throw new Error('Unsupported display asset file kind.');
  }
  return result;
}
export async function prepareManualBundle(options:Options):Promise<{root:string;bundleId:string;entries:number;treeVersions:string[]}>{
  const workerRoot=resolve(options.workerRoot),catalogPath=resolve(options.catalog),treesRoot=resolve(options.treesRoot),output=resolve(options.output);
  if(!await missing(output))throw new Error('Output must be a new directory; existing resources are preserved.');
  for(const source of [workerRoot,treesRoot,dirname(catalogPath)])if(inside(source,output)||inside(output,source))throw new Error('Output and source directories must be separate.');
  const worker=JSON.parse(await readFile(join(workerRoot,'worker-manifest.json'),'utf8'));
  if(worker.format!=='pok.pob-worker-bundle.v1'||worker.protocol!=='pok.pob-worker.v1'||worker.platform!==process.platform)throw new Error('Unsupported native worker bundle.');
  assertWorkerIdentity(worker.identity);
  if(!options.allowDevelopment&&worker.origin?.adapter_dirty!==false)throw new Error('A clean committed worker is required; allow development explicitly for local experiments.');
  const catalog=JSON.parse(await readFile(catalogPath,'utf8'));
  assertWorkerCatalog(catalog,worker.identity);
  const treeVersions:string[]=[];
  for(const entry of await readdir(treesRoot,{withFileTypes:true})){
    if(!entry.isDirectory())continue;
    if(!/^\d{1,3}_\d{1,3}(?:_\d{1,3})?$/.test(entry.name))throw new Error('Unsupported tree directory.');
    treeVersions.push(entry.name);
  }
  treeVersions.sort();
  if(!treeVersions.includes(catalog.defaultTreeVersion)||treeVersions.some(value=>!catalog.supportedTreeVersions.includes(value)))throw new Error('Rendered trees do not cover the native catalog default.');
  await mkdir(output,{recursive:true});
  await cp(workerRoot,join(output,'pob-worker'),{recursive:true,errorOnExist:true,force:false});
  await mkdir(join(output,'pob-catalog'));
  await cp(catalogPath,join(output,'pob-catalog','catalog.json'),{errorOnExist:true,force:false});
  await cp(treesRoot,join(output,'passive-tree'),{recursive:true,errorOnExist:true,force:false});
  const workerManifest='pob-worker/worker-manifest.json';
  const files=[
    {path:workerManifest,size:(await lstat(join(output,workerManifest))).size,sha256:await sha256File(join(output,workerManifest))},
    ...await inventory(output,join(output,'pob-catalog')),
    ...await inventory(output,join(output,'passive-tree')),
  ].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
  const manifest:ManualBundleManifest={format:'pok.ui-manual-bundle.v2',schemaVersion:2,bundleId:'',identity:worker.identity,worker:{path:'pob-worker',manifest:'worker-manifest.json',sha256:files.find(file=>file.path===workerManifest)!.sha256},catalog:{path:'pob-catalog/catalog.json',sha256:files.find(file=>file.path==='pob-catalog/catalog.json')!.sha256},trees:{path:'passive-tree',defaultVersion:catalog.defaultTreeVersion,supportedVersions:treeVersions},files};
  manifest.bundleId=manualBundleId(manifest);
  await writeFile(join(output,'bundle-manifest.json'),JSON.stringify(manifest,null,2)+'\n','utf8');
  const store=new ManualGameDataStore(output),info=await store.getInfo();
  if(info.status!=='ready')throw new Error(info.error||'Manual display bundle did not validate.');
  await store.getWorkerLaunchDescriptor(join(dirname(output),basename(output)+'-validation-cache'));
  return {root:output,bundleId:manifest.bundleId,entries:catalog.entries.length,treeVersions};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const allowed=new Set(['--worker-root','--catalog','--trees-root','--output','--allow-development']);
  const values=new Map<string,string>();let allowDevelopment=false;
  for(let index=2;index<process.argv.length;index++){
    const key=process.argv[index]!;
    if(!allowed.has(key))throw new Error('Unknown manual bundle option: '+key);
    if(key==='--allow-development'){allowDevelopment=true;continue;}
    const value=process.argv[++index];if(!value||value.startsWith('--'))throw new Error('Missing option value: '+key);
    if(values.has(key))throw new Error('Duplicate option: '+key);values.set(key,value);
  }
  for(const key of ['--worker-root','--catalog','--trees-root','--output'])if(!values.has(key))throw new Error('Missing option: '+key);
  void prepareManualBundle({workerRoot:values.get('--worker-root')!,catalog:values.get('--catalog')!,treesRoot:values.get('--trees-root')!,output:values.get('--output')!,allowDevelopment}).then(result=>console.log(JSON.stringify(result))).catch(error=>{console.error(error);process.exitCode=1;});
}
