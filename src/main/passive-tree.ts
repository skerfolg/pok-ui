import { lstat, readFile, realpath } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';
import type { PassiveTreeData, PassiveTreeAsset } from '../shared/passive-tree';

interface ManifestAsset { file:string; mime:'image/png'|'image/webp'; width:number; height:number; x?:number; y?:number }
interface LoadedTree { data:PassiveTreeData; files:Map<string,ManifestAsset> }
export class TreeResourceError extends Error {
  constructor(message:string,readonly status=400){super(message);this.name='TreeResourceError';}
}
const versionPattern=/^\d{1,3}_\d{1,3}(?:_\d{1,3})?$/;
const assetPattern=/^[A-Za-z0-9][A-Za-z0-9._-]{0,180}\.(?:webp|png)$/;
function isRecord(value:unknown):value is Record<string,unknown>{return !!value&&typeof value==='object'&&!Array.isArray(value);}
function positiveInteger(value:unknown):value is number{return Number.isInteger(value)&&Number(value)>0&&Number(value)<=32_768;}
function cropOffset(value:unknown):value is number|undefined{return value===undefined||(Number.isInteger(value)&&Number(value)>=0&&Number(value)<=32_768);}
function version(value:unknown):asserts value is string {
  if(typeof value!=='string'||!versionPattern.test(value))throw new TreeResourceError('패시브 트리 버전 형식이 올바르지 않습니다.');
}

/** Static PoB resources are versioned app assets, independent of the calculation engine. */
export class PassiveTreeStore {
  private readonly root:string;
  private readonly versions=new Map<string,Promise<LoadedTree>>();
  constructor(root:string){this.root=resolve(root);}

  async load(requestedVersion:unknown):Promise<PassiveTreeData>{
    version(requestedVersion);
    return (await this.getVersion(requestedVersion)).data;
  }

  /** Accept only literal URLs emitted by load(); do not URL-normalize traversal away. */
  async asset(rawUrl:string):Promise<{body:Uint8Array<ArrayBuffer>;mime:string}>{
    const match=/^pok-tree:\/\/assets\/(\d{1,3}_\d{1,3}(?:_\d{1,3})?)\/([A-Za-z0-9][A-Za-z0-9._-]{0,180}\.(?:webp|png))$/.exec(rawUrl);
    if(!match)throw new TreeResourceError('허용되지 않은 트리 이미지 경로입니다.');
    const [,requestedVersion,file]=match;
    const loaded=await this.getVersion(requestedVersion);
    const entry=loaded.files.get(file);
    if(!entry)throw new TreeResourceError('트리 이미지가 없습니다.',404);
    const path=await this.safePath(requestedVersion,file);
    const info=await lstat(path);
    if(info.size>128*1024*1024)throw new TreeResourceError('트리 이미지 크기가 제한을 초과했습니다.');
    return {body:Uint8Array.from(await readFile(path)),mime:entry.mime};
  }

  private getVersion(requestedVersion:string):Promise<LoadedTree>{
    let pending=this.versions.get(requestedVersion);
    if(!pending){
      pending=this.readVersion(requestedVersion).catch(error=>{
        this.versions.delete(requestedVersion);
        if((error as NodeJS.ErrnoException).code==='ENOENT')throw new TreeResourceError(`이 앱에는 패시브 트리 ${requestedVersion} 데이터가 없습니다. 빌드와 같은 버전의 데이터가 필요합니다.`,404);
        throw error;
      });
      this.versions.set(requestedVersion,pending);
    }
    return pending;
  }

  private async readVersion(requestedVersion:string):Promise<LoadedTree>{
    const manifest=await this.readJson(requestedVersion,'manifest.json',4*1024*1024);
    if(!isRecord(manifest)||manifest.schemaVersion!==1||manifest.version!==requestedVersion||manifest.treeFile!=='tree.json'||!isRecord(manifest.assets)||!isRecord(manifest.source)){
      throw new TreeResourceError('패시브 트리 매니페스트 형식 또는 버전이 올바르지 않습니다.');
    }
    const source=manifest.source;
    if(typeof source.project!=='string'||typeof source.commit!=='string'||typeof source.treeSha256!=='string')throw new TreeResourceError('패시브 트리 출처 정보가 올바르지 않습니다.');
    const tree=await this.readJson(requestedVersion,'tree.json',64*1024*1024);
    if(!isRecord(tree)||!isRecord(tree.nodes)||!isRecord(tree.groups))throw new TreeResourceError('패시브 트리 데이터 형식이 올바르지 않습니다.');
    const assets:Record<string,PassiveTreeAsset>=Object.create(null);
    const files=new Map<string,ManifestAsset>();
    for(const [name,value] of Object.entries(manifest.assets)){
      if(!isRecord(value)||typeof value.file!=='string'||!assetPattern.test(value.file)||!positiveInteger(value.width)||!positiveInteger(value.height)||!cropOffset(value.x)||!cropOffset(value.y)||
        !(['image/png','image/webp'].includes(String(value.mime)))||!value.file.endsWith(value.mime==='image/png'?'.png':'.webp'))throw new TreeResourceError('패시브 트리 이미지 매니페스트가 올바르지 않습니다.');
      const entry=value as unknown as ManifestAsset;
      const duplicate=files.get(entry.file);
      if(duplicate&&duplicate.mime!==entry.mime)throw new TreeResourceError('패시브 트리 이미지 형식이 충돌합니다.');
      files.set(entry.file,entry);
      assets[name]={url:`pok-tree://assets/${requestedVersion}/${entry.file}`,mime:entry.mime,width:entry.width,height:entry.height,
        ...(entry.x===undefined?{}:{x:entry.x}),...(entry.y===undefined?{}:{y:entry.y})};
    }
    return {data:{version:requestedVersion,tree:tree as unknown as PassiveTreeData['tree'],assets,
      source:{project:source.project,commit:source.commit,treeSha256:source.treeSha256}},files};
  }

  private async readJson(requestedVersion:string,file:'manifest.json'|'tree.json',limit:number):Promise<unknown>{
    const path=await this.safePath(requestedVersion,file);
    if((await lstat(path)).size>limit)throw new TreeResourceError('패시브 트리 데이터 크기가 제한을 초과했습니다.');
    try{return JSON.parse(await readFile(path,'utf8'));}
    catch(error){if(error instanceof SyntaxError)throw new TreeResourceError('패시브 트리 데이터가 손상되었습니다.');throw error;}
  }

  private async safePath(requestedVersion:string,file:string):Promise<string>{
    const directory=join(this.root,requestedVersion);
    const path=join(directory,file);
    // Reject directory junctions/symlinks as well as file links. Static resources must stay inside the app resource root.
    for(const candidate of [this.root,directory,path]){
      const info=await lstat(candidate);
      if(info.isSymbolicLink())throw new TreeResourceError('트리 리소스의 심볼릭 링크는 허용되지 않습니다.');
      if(candidate===path?!info.isFile():!info.isDirectory())throw new TreeResourceError('트리 리소스 경로 형식이 올바르지 않습니다.');
    }
    const root=await realpath(this.root);
    const actual=await realpath(path);
    const inside=relative(root,actual);
    if(!inside||inside==='..'||inside.startsWith('..\\')||inside.startsWith('../')||isAbsolute(inside))throw new TreeResourceError('트리 리소스가 앱 리소스 경로를 벗어났습니다.');
    return actual;
  }
}
