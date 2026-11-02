// Build-time only: original PoB metadata + original tree image conversion.
import {PobRuntime} from '../src/main/pob-runtime.ts';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir,readFile,readdir,copyFile,writeFile} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {resolve,join,dirname,relative} from 'node:path';
import {sha256File} from './file-integrity.mjs';
import {performAtomicSwap,ensureInside} from './bundle-swap.mjs';
const exec=promisify(execFile),workspace=resolve('.');
const arg=name=>{const index=process.argv.indexOf(name);return index>=0?process.argv[index+1]:undefined;};
const python=arg('--tree-python');if(!python)throw new Error('Usage: --tree-python <Pillow/zstandard Python> [--runtime <prepared PoB runtime>] [--reuse-tree-assets]');
const runtimeRoot=resolve(arg('--runtime')||'resources/pob-runtime'),runtime=new PobRuntime(runtimeRoot);
const info=await runtime.getInfo();if(info.status!=='ready')throw new Error(info.error);
const stage=join(workspace,'.local','pob-data-stage-'+randomUUID());await mkdir(stage,{recursive:true});
const stable=value=>Array.isArray(value)?'['+value.map(stable).join(',')+']':value&&typeof value==='object'?'{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+stable(value[key])).join(',')+'}':JSON.stringify(value);
const hash=value=>createHash('sha256').update(value).digest('hex');
try{
  const catalog=await runtime.catalog();
  await writeFile(join(stage,'catalog.json'),stable(catalog)+'\n');
  const converter=resolve('scripts/prepare-tree-assets.py'),converterSha256=await sha256File(converter);
  let completeTreeCache=false;
  if(process.argv.includes('--reuse-tree-assets')){
    const native=await readFile(resolve('resources/pob-editor/manifest.json'),'utf8').then(JSON.parse).catch(error=>{if(error.code==='ENOENT')return undefined;throw error;});
    if(native?.commit===info.commit&&native.converterSha256===converterSha256){
      for(const file of native.files){
        if(!file.path.startsWith('trees/'))continue;
        const source=resolve('resources/pob-editor',file.path),target=resolve(stage,file.path);
        ensureInside(resolve('resources/pob-editor/trees'),source,'native cached source');ensureInside(join(stage,'trees'),target,'native cached target');
        if(await sha256File(source)!==file.sha256)throw new Error('Native tree cache integrity failed: '+file.path);
        await mkdir(dirname(target),{recursive:true});await copyFile(source,target);
      }
      completeTreeCache=true;
      for(const version of catalog.supportedTreeVersions){
        const cached=JSON.parse(await readFile(join(stage,'trees',version,'manifest.json'),'utf8'));
        if(cached.source.commit!==info.commit){completeTreeCache=false;break;}
        const sourceRoot=resolve(runtimeRoot,'pob','src','TreeData',version);
        for(const [file,digest] of Object.entries(cached.source.files)){
          const source=resolve(sourceRoot,file);ensureInside(sourceRoot,source,'native raw tree input');
          if(await sha256File(source)!==digest){completeTreeCache=false;break;}
        }
      }
    }
    if(!completeTreeCache){
    const previous=await readFile(join(workspace,'resources','bundle-manifest.json'),'utf8').then(JSON.parse).catch(error=>{if(error.code==='ENOENT')return undefined;throw error;});
    if(previous?.identity?.pob?.commit===info.commit)for(const file of previous.files){
      if(!file.path.startsWith('passive-tree/'))continue;
      const source=resolve('resources',file.path),target=resolve(stage,'trees',file.path.slice('passive-tree/'.length));
      ensureInside(resolve('resources','passive-tree'),source,'cached source');ensureInside(join(stage,'trees'),target,'cached target');
      if(await sha256File(source)!==file.sha256)throw new Error('Cached tree integrity failed: '+file.path);
      await mkdir(dirname(target),{recursive:true});await copyFile(source,target);
    }
    }
  }
  if(!completeTreeCache){const converted=await exec(resolve(python),[converter,'--pob-root',join(runtimeRoot,'pob'),'--source-revision',info.commit,'--versions',...catalog.supportedTreeVersions,'--output',join(stage,'trees')],{maxBuffer:4*1024*1024});process.stdout.write(converted.stdout);}
  else console.log('Reused complete tree cache after checking conversion source, all output hashes and original PoB input hashes');
  async function walk(root){const files=[];for(const entry of await readdir(root,{withFileTypes:true})){const path=join(root,entry.name);if(entry.isDirectory())files.push(...await walk(path));else if(entry.isFile())files.push(path);else throw new Error('Unexpected resource link: '+path);}return files;}
  const files=[];for(const path of await walk(stage))files.push({path:relative(stage,path).replaceAll('\\','/'),sha256:await sha256File(path)});
  files.sort((a,b)=>a.path.localeCompare(b.path));
  const after=await runtime.getInfo();if(after.runtimeId!==info.runtimeId)throw new Error('PoB runtime changed during metadata preparation');
  const body={schemaVersion:1,runtimeId:info.runtimeId,commit:info.commit,version:info.version,converterSha256,defaultTreeVersion:catalog.defaultTreeVersion,supportedTreeVersions:catalog.supportedTreeVersions,files};
  const bundleId='pob-editor-'+hash(JSON.stringify(body));
  await writeFile(join(stage,'manifest.json'),JSON.stringify({...body,bundleId},null,2)+'\n');
  await performAtomicSwap({workspace,backupsRoot:join(workspace,'.local','bundle-backups'),entries:[{label:'standalone PoB editor data',target:join(workspace,'resources','pob-editor'),staged:stage,backupName:'pob-editor'}]});
  console.log(`Prepared ${bundleId}; ${catalog.entries.length} entries; ${files.length} files; no PoK dependency`);
}finally{runtime.close();}
