// Stage unmodified upstream PoB and LuaJIT without Python, KB, MCP or PoK.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { dirname, join, resolve, isAbsolute } from 'node:path';
import { sha256File } from './file-integrity.mjs';
import { performAtomicSwap } from './bundle-swap.mjs';
import { DOMParser } from '@xmldom/xmldom';
const exec=promisify(execFile),workspace=resolve('.');
const arg=name=>{const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:undefined;};
const source=arg('--pob-root'),binary=arg('--luajit'),license=arg('--lua-license');
if(!source||!binary||!license)throw new Error('Usage: --pob-root <clean pinned Git checkout> --luajit <executable> --lua-license <LuaJIT copyright file>');
const root=resolve(source),luajit=resolve(binary);
const git=async args=>(await exec('git',['-c',`safe.directory=${root.replaceAll('\\','/')}`,'-C',root,...args],{maxBuffer:16*1024*1024})).stdout;
const commit=(await git(['rev-parse','HEAD'])).trim();
if(!/^[a-f0-9]{40}$/.test(commit))throw new Error('PoB commit is invalid');
if((await git(['status','--porcelain','--untracked-files=no'])).trim())throw new Error('PoB source must be a clean pinned checkout');
const sourceManifest=await readFile(join(root,'manifest.xml'),'utf8');
const document=new DOMParser().parseFromString(sourceManifest,'application/xml');
// Use upstream's release inventory, not development exports/templates or user files.
const declared=new Set(['manifest.xml','LICENSE.md','src/HeadlessWrapper.lua']);
for(const entry of Array.from(document.getElementsByTagName('File'))){
  const part=entry.getAttribute('part'),name=entry.getAttribute('name');
  if(part==='program'||part==='tree')declared.add('src/'+name);
  if(part==='runtime'&&(!entry.getAttribute('runtime')||entry.getAttribute('runtime')==='win32'))declared.add('runtime/'+name);
}
const paths=(await git(['ls-files','-z','--','src','runtime','manifest.xml','LICENSE.md'])).split('\0').filter(path=>declared.has(path));
if(!paths.includes('src/HeadlessWrapper.lua')||!paths.includes('LICENSE.md'))throw new Error('Not an upstream PoB source checkout');
const stage=join(workspace,'.local','pob-runtime-stage-'+randomUUID());
await mkdir(stage,{recursive:true});
const files=[];
async function copy(source,path){
  if(isAbsolute(path)||path.split(/[\\/]/).some(p=>!p||p==='..'||p==='.'))throw new Error('Invalid staged path');
  const target=join(stage,path);await mkdir(dirname(target),{recursive:true});await copyFile(source,target);
  try{files.push({path,sha256:await sha256File(target)});}
  catch(error){throw new Error(`Cannot verify PoB resource ${path}: ${error.message}`,{cause:error});}
}
for(const path of paths)await copy(join(root,path),'pob/'+path);
await copy(luajit,'bin/'+(process.platform==='win32'?'luajit.exe':'luajit'));
if(process.platform==='win32')await copy(join(dirname(luajit),'lua51.dll'),'bin/lua51.dll');
await copy(resolve(license),'LICENSE-LuaJIT.md');
await copy(join(workspace,'runtime','pob','worker.lua'),'worker.lua');
await copy(join(workspace,'runtime','pob','editor.lua'),'editor.lua');
await copy(join(workspace,'runtime','pob','inspect.lua'),'inspect.lua');
await copy(join(workspace,'runtime','pob','calcs.lua'),'calcs.lua');
await copy(join(workspace,'runtime','pob','party.lua'),'party.lua');
await copy(join(workspace,'runtime','pob','tree.lua'),'tree.lua');
await copy(join(workspace,'runtime','pob','tree-state.lua'),'tree-state.lua');
await copy(join(workspace,'runtime','pob','tree-workspace.lua'),'tree-workspace.lua');
await copy(join(workspace,'runtime','pob','item-controls.lua'),'item-controls.lua');
await copy(join(workspace,'runtime','pob','item-popups.lua'),'item-popups.lua');
await copy(join(workspace,'runtime','pob','equipment.lua'),'equipment.lua');
await copy(join(workspace,'runtime','pob','loadouts.lua'),'loadouts.lua');
await copy(join(workspace,'runtime','pob','loadout-management.lua'),'loadout-management.lua');
const version=(await readFile(join(root,'manifest.xml'),'utf8')).match(/<Version[^>]*number="([^"]+)"/)?.[1];
if(!version)throw new Error('PoB version is missing');
const gameVersions=await readFile(join(root,'src','GameVersions.lua'),'utf8');
const supportedTreeVersions=[...gameVersions.match(/treeVersionList\s*=\s*{([^}]+)}/)[1].matchAll(/"([\d_]+)"/g)].map(m=>m[1]);
files.sort((a,b)=>a.path.localeCompare(b.path));
const body={schemaVersion:1,protocolVersion:1,commit,version,supportedTreeVersions,platform:process.platform,executable:process.platform==='win32'?'bin/luajit.exe':'bin/luajit',files};
const runtimeId='pob-'+createHash('sha256').update(JSON.stringify(body)).digest('hex');
await writeFile(join(stage,'manifest.json'),JSON.stringify({...body,runtimeId},null,2)+'\n');
// Refuse source changes during staging; retain staging on failure for inspection.
if((await git(['rev-parse','HEAD'])).trim()!==commit||(await git(['status','--porcelain','--untracked-files=no'])).trim())throw new Error('PoB source changed during staging');
await performAtomicSwap({workspace,backupsRoot:join(workspace,'.local','bundle-backups'),entries:[{label:'standalone PoB runtime',target:join(workspace,'resources','pob-runtime'),staged:stage,backupName:'pob-runtime'}]});
console.log(`Prepared ${runtimeId}; PoB ${version} ${commit}; ${files.length} files; no PoK dependency`);
