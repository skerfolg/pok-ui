import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {join,isAbsolute,basename,extname} from 'node:path';
import {randomUUID} from 'node:crypto';
import type {BuildDocument} from '../shared/contracts';
import {xmlHash} from './build-proposals';
import {exportDocument,validateBuild} from './pob-files';
type Target={path:string;hash:string};
/** Only an explicit save dialog can establish a file target. Imports never do. */
export class BuildFileStore {
  private queue:Promise<void>=Promise.resolve();
  constructor(private directory:string){}
  save(build:BuildDocument,choose:()=>Promise<string|undefined>,saveAs=false):Promise<{path:string;xmlSha256:string;name:string}|null>{
    const snapshot=structuredClone(build);
    const pending=this.queue.then(async()=>{
      validateBuild(snapshot);await mkdir(this.directory,{recursive:true});
      const registry=join(this.directory,'build-file-targets.v1.json');
      let targets:Record<string,Target>={};
      try{const value=JSON.parse(await readFile(registry,'utf8'));if(!value||typeof value!=='object'||Array.isArray(value)||Object.values(value).some((t:unknown)=>{const v=t as Target;return !v||typeof v.path!=='string'||!isAbsolute(v.path)||typeof v.hash!=='string'||!/^[a-f0-9]{64}$/.test(v.hash);}))throw new Error('파일 저장 대상 기록이 손상되었습니다.');targets=value;}
      catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
      const previous=!saveAs?Object.hasOwn(targets,snapshot.id)?targets[snapshot.id]:undefined:undefined;
      if(previous){const contents=await readFile(previous.path,'utf8').catch(()=>undefined);if(contents===undefined||xmlHash(contents)!==previous.hash)throw new Error('저장 대상 파일이 앱 밖에서 변경되거나 삭제되었습니다. 다른 이름으로 저장해 주세요.');}
      const path=previous?.path??await choose();if(!path)return null;
      const temp=path+'.'+randomUUID()+'.tmp';
      await writeFile(temp,exportDocument(snapshot,'xml'),{encoding:'utf8',flush:true});await rename(temp,path);
      const xmlSha256=xmlHash(snapshot.xml);Object.defineProperty(targets,snapshot.id,{value:{path,hash:xmlSha256},enumerable:true,configurable:true,writable:true});
      const registryTemp=registry+'.'+randomUUID()+'.tmp';await writeFile(registryTemp,JSON.stringify(targets),{encoding:'utf8',flush:true});await rename(registryTemp,registry);
      return{path,xmlSha256,name:basename(path,extname(path))};
    });this.queue=pending.then(()=>undefined,()=>undefined);return pending;
  }
}
