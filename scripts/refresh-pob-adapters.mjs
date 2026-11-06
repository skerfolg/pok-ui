// Rebuild only our adapters over an already verified, pinned PoB bundle.
import {mkdir,readFile,copyFile,writeFile,stat} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {PobRuntime} from '../src/main/pob-runtime.ts';
import {sha256File} from './file-integrity.mjs';
import {performAtomicSwap,ensureInside} from './bundle-swap.mjs';
const workspace=resolve('.'),root=join(workspace,'resources/pob-runtime'),runtime=new PobRuntime(root),stage=join(workspace,'.local','pob-adapter-stage-'+randomUUID());
const info=await runtime.getInfo();runtime.close();if(info.status!=='ready')throw new Error(info.error);
const before=await readFile(join(root,'manifest.json'),'utf8'),manifest=JSON.parse(before);await mkdir(stage,{recursive:true});
for(const file of manifest.files){const source=resolve(root,file.path),target=resolve(stage,file.path);ensureInside(root,source,'verified source');ensureInside(stage,target,'staged file');if(await sha256File(source)!==file.sha256)throw new Error('Source changed: '+file.path);const adapter=!file.path.includes('/')&&file.path.endsWith('.lua')?join(workspace,'runtime/pob',file.path):undefined;const replacement=adapter&&await stat(adapter).then(v=>v.isFile()).catch(()=>false);await mkdir(dirname(target),{recursive:true});await copyFile(replacement?adapter:source,target);const hash=await sha256File(target);if(!replacement&&hash!==file.sha256)throw new Error('Copied source changed: '+file.path);file.sha256=hash;}
if(await readFile(join(root,'manifest.json'),'utf8')!==before)throw new Error('Runtime changed during preparation');
const {runtimeId,...body}=manifest;manifest.runtimeId='pob-'+createHash('sha256').update(JSON.stringify(body)).digest('hex');await writeFile(join(stage,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
await performAtomicSwap({workspace,backupsRoot:join(workspace,'.local/bundle-backups'),entries:[{label:'verified PoB adapters',target:root,staged:stage,backupName:'pob-runtime'}]});console.log('Refreshed adapters: '+manifest.runtimeId+'; pinned upstream '+manifest.commit+' unchanged. Regenerate editor data before packaging.');
