/** Immutable manual PoB data, separate from optional PoK/KB identities. */
import {lstat,readFile,realpath} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {isAbsolute,join,relative,resolve} from 'node:path';
import {sha256File} from '../../scripts/file-integrity.mjs';
import type {CatalogEntry,CatalogEntryType,CatalogQuery,CatalogQueryResult,DataBundleInfo} from '../shared/game-data';
import type {ManualBundleManifest,WorkerCatalog} from '../shared/pob-worker';
import {GameDataError,GameDataStore} from './game-data';
import {PassiveTreeStore} from './passive-tree';
import {assertWorkerCatalog,assertWorkerIdentity,type WorkerLaunchDescriptor} from './pob-worker';

type Row = Record<string,unknown>;
const record=(value:unknown):value is Row=>!!value&&typeof value==='object'&&!Array.isArray(value);
const digest=(value:unknown):value is string=>typeof value==='string'&&/^[0-9a-f]{64}$/.test(value);
const version=(value:unknown):value is string=>typeof value==='string'&&/^\d{1,3}_\d{1,3}(?:_\d{1,3})?$/.test(value);
const types=new Set<CatalogEntryType>(['base','unique','mod','gem','skill']);
function stable(value:unknown):string {
  if(Array.isArray(value))return '['+value.map(stable).join(',')+']';
  if(record(value))return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+stable(value[key])).join(',')+'}';
  return JSON.stringify(value);
}
export function manualBundleId(manifest:Omit<ManualBundleManifest,'bundleId'>|ManualBundleManifest):string {
  const {bundleId:_,...body}=manifest as ManualBundleManifest;
  return 'pokbundle-'+createHash('sha256').update(stable(body)).digest('hex').slice(0,32);
}
function portable(value:unknown):asserts value is string {
  if(typeof value!=='string'||!value||value.length>512||value.includes('\0')||value.includes('\\')||value.includes(':')||isAbsolute(value)||value.split('/').some(part=>!part||part==='.'||part==='..'))throw new GameDataError('수동 PoB 묶음 경로는 내부 상대 경로여야 합니다.');
}
interface Loaded {
  manifest:ManualBundleManifest;
  catalog:WorkerCatalog;
  worker:Row&{paths:Record<string,string>;files:Record<string,{sha256:string;bytes:number}>};
  trees:PassiveTreeStore;
}

export class ManualGameDataStore {
  private readonly root:string;
  private loaded?:Promise<Loaded>;
  constructor(root:string){this.root=resolve(root);}
  private async path(name:string):Promise<string>{
    portable(name);
    const root=await realpath(this.root),path=await realpath(join(root,...name.split('/')));
    const delta=relative(root,path);
    if(!delta||isAbsolute(delta)||delta.split(/[\\/]/).includes('..'))throw new GameDataError('묶음 경로가 루트를 벗어납니다.');
    return path;
  }
  private async json(name:string,limit=4*1024*1024):Promise<unknown>{
    const path=await this.path(name);
    if((await lstat(path)).size>limit)throw new GameDataError('수동 PoB 묶음 파일이 너무 큽니다.');
    return JSON.parse(await readFile(path,'utf8'));
  }
  private load():Promise<Loaded>{
    if(!this.loaded)this.loaded=this.read().catch(error=>{this.loaded=undefined;throw error;});
    return this.loaded;
  }
  private async read():Promise<Loaded>{
    const raw=await this.json('bundle-manifest.json');
    if(!record(raw)||raw.format!=='pok.ui-manual-bundle.v2'||raw.schemaVersion!==2||typeof raw.bundleId!=='string'||!/^pokbundle-[0-9a-f]{32}$/.test(raw.bundleId)||!record(raw.worker)||!record(raw.catalog)||!record(raw.trees)||!Array.isArray(raw.files))throw new GameDataError('독립 수동 PoB 묶음 형식이 올바르지 않습니다.');
    if(Object.keys(raw).sort().join(',')!==['format','schemaVersion','bundleId','identity','worker','catalog','trees','files'].sort().join(','))throw new GameDataError('알 수 없는 수동 묶음 필드입니다.');
    assertWorkerIdentity(raw.identity);
    const manifest=raw as unknown as ManualBundleManifest;
    if(manualBundleId(manifest)!==manifest.bundleId)throw new GameDataError('수동 PoB 묶음 ID가 내용과 다릅니다.');
    for(const part of [manifest.worker,manifest.catalog,manifest.trees])portable(part.path);
    portable(manifest.worker.manifest);
    if(manifest.worker.manifest.includes('/')||!digest(manifest.worker.sha256)||!digest(manifest.catalog.sha256)||!version(manifest.trees.defaultVersion)||!Array.isArray(manifest.trees.supportedVersions)||manifest.trees.supportedVersions.some(value=>!version(value))||!manifest.trees.supportedVersions.includes(manifest.trees.defaultVersion))throw new GameDataError('수동 PoB 묶음 구성 요소가 올바르지 않습니다.');
    const files=new Map<string,{size:number;sha256:string}>();
    for(const file of manifest.files){
      if(!record(file)||!Number.isSafeInteger(file.size)||Number(file.size)<0||!digest(file.sha256))throw new GameDataError('수동 묶음 파일 설명이 올바르지 않습니다.');
      portable(file.path);
      if(files.has(file.path))throw new GameDataError('수동 묶음 파일 경로가 중복됐습니다.');
      files.set(file.path,file as {size:number;sha256:string});
      const path=await this.path(file.path);
      if((await lstat(path)).size!==file.size||await sha256File(path)!==file.sha256)throw new GameDataError('수동 PoB 묶음 파일이 변경됐습니다.');
    }
    const workerName=manifest.worker.path+'/'+manifest.worker.manifest;
    if(files.get(workerName)?.sha256!==manifest.worker.sha256||files.get(manifest.catalog.path)?.sha256!==manifest.catalog.sha256)throw new GameDataError('계산기/카탈로그 파일이 묶음 목록에 없습니다.');
    const worker=await this.json(workerName);
    if(!record(worker)||worker.format!=='pok.pob-worker-bundle.v1'||worker.protocol!=='pok.pob-worker.v1'||worker.platform!==process.platform||worker.pob_commit!==manifest.identity.pob_commit||!record(worker.paths)||!record(worker.files))throw new GameDataError('독립 PoB worker manifest가 일치하지 않습니다.');
    assertWorkerIdentity(worker.identity);
    if(worker.identity.sha256!==manifest.identity.sha256)throw new GameDataError('데이터와 worker identity가 다릅니다.');
    for(const role of ['python','adapter','pob','luajit'])portable(worker.paths[role]);
    for(const [name,entry] of Object.entries(worker.files)){
      portable(name);
      if(!record(entry)||!digest(entry.sha256)||!Number.isSafeInteger(entry.bytes)||Number(entry.bytes)<0)throw new GameDataError('worker 파일 목록이 올바르지 않습니다.');
    }
    const catalog=await this.json(manifest.catalog.path,64*1024*1024);
    assertWorkerCatalog(catalog,manifest.identity);
    if(catalog.defaultTreeVersion!==manifest.trees.defaultVersion||manifest.trees.supportedVersions.some(value=>!catalog.supportedTreeVersions.includes(value)))throw new GameDataError('카탈로그와 표시 트리 버전이 다릅니다.');
    const trees=new PassiveTreeStore(await this.path(manifest.trees.path),{bundleId:manifest.bundleId,expectedCommit:manifest.identity.pob_commit});
    for(const treeVersion of manifest.trees.supportedVersions){
      const prefix=manifest.trees.path+'/'+treeVersion+'/';
      if(!files.has(prefix+'manifest.json')||!files.has(prefix+'tree.json'))throw new GameDataError('트리 파일이 묶음 목록에 없습니다.');
      const tree=await this.json(prefix+'manifest.json');
      const rawTree=worker.files[String(worker.paths.pob)+'/src/TreeData/'+treeVersion+'/tree.json'];
      if(!record(tree)||!record(tree.source)||!record(rawTree)||tree.source.treeSha256!==rawTree.sha256||!record(tree.assets))throw new GameDataError('표시 트리 원본이 실제 worker의 PoB와 다릅니다.');
      for(const asset of Object.values(tree.assets))if(!record(asset)||typeof asset.file!=='string'||!files.has(prefix+asset.file))throw new GameDataError('트리 이미지가 묶음 목록에 없습니다.');
      await trees.load(treeVersion);
    }
    return {manifest,catalog,worker:worker as Loaded['worker'],trees};
  }
  async getInfo():Promise<DataBundleInfo>{
    try {
      const {manifest,catalog}=await this.load();
      return {status:'ready',bundleId:manifest.bundleId,runtimeMode:'bundled',workerIdentity:manifest.identity,defaultTreeVersion:manifest.trees.defaultVersion,supportedTreeVersions:[...manifest.trees.supportedVersions],classes:catalog.classes,catalog:{schemaVersion:2,extractorVersion:'2',entries:catalog.entries.length,classes:catalog.classes.length,digest:manifest.catalog.sha256,diagnostics:catalog.diagnostics.length}};
    } catch(error){return {status:(error as NodeJS.ErrnoException)?.code==='ENOENT'?'missing':'corrupt',error:'독립 PoB 데이터 묶음이 없거나 손상되었습니다.'};}
  }
  async query(request:CatalogQuery):Promise<CatalogQueryResult>{
    if(request.type!==undefined&&!types.has(request.type))throw new GameDataError('지원하지 않는 카탈로그 유형입니다.');
    const query=(request.query??'').trim().toLocaleLowerCase('en-US');
    const category=(request.category??'').trim().toLocaleLowerCase('en-US');
    const entries=(await this.load()).catalog.entries.filter(row=>(!request.type||row.type===request.type)&&(!category||(row.category??'').toLocaleLowerCase('en-US')===category)&&(!query||[row.name,row.id,row.category,row.subType,row.gemId,row.gameId].filter(Boolean).join(' ').toLocaleLowerCase('en-US').includes(query)));
    const offset=Math.max(0,Math.min(1_000_000,Number.isInteger(request.offset)?Number(request.offset):0));
    const limit=Math.max(1,Math.min(100,Number.isInteger(request.limit)?Number(request.limit):50));
    return {total:entries.length,offset,limit,entries:entries.slice(offset,offset+limit)};
  }
  async getEntry(type:CatalogEntryType,id:string):Promise<CatalogEntry>{
    if(!types.has(type)||typeof id!=='string'||!id||/[\0-\x1f\x7f]/.test(id))throw new GameDataError('카탈로그 식별자가 올바르지 않습니다.');
    const entry=(await this.load()).catalog.entries.find(row=>row.type===type&&row.id===id);
    if(!entry)throw new GameDataError('카탈로그 항목을 찾지 못했습니다.',404);
    return entry;
  }
  async loadTree(version:string){
    const data=await this.load();
    if(!data.manifest.trees.supportedVersions.includes(version))throw new GameDataError('지원하지 않는 표시 트리 버전입니다.',404);
    return data.trees.load(version);
  }
  async asset(url:string){return (await this.load()).trees.asset(url);}
  async getWorkerLaunchDescriptor(cacheHome:string):Promise<WorkerLaunchDescriptor>{
    if(!isAbsolute(cacheHome))throw new GameDataError('worker 캐시 경로는 절대 경로여야 합니다.');
    const saved=await this.load(),fresh=await this.read();
    if(saved.manifest.bundleId!==fresh.manifest.bundleId)throw new GameDataError('게임 데이터가 바뀌었습니다. 앱을 다시 시작해 주세요.');
    const {manifest,worker}=fresh;
    const root=await this.path(manifest.worker.path);
    const command=await this.path(manifest.worker.path+'/'+worker.paths.python);
    const binary=worker.files[worker.paths.python!];
    if(!binary||(await lstat(command)).size!==binary.bytes||await sha256File(command)!==binary.sha256)throw new GameDataError('번들 Python이 변경됐습니다.');
    return {root,command,args:['-I','-B','-m','pok.pob.worker','--bundle-manifest',await this.path(manifest.worker.path+'/'+manifest.worker.manifest),'--cache-home',cacheHome],bundleId:manifest.bundleId,identity:manifest.identity,allowDevelopment:false};
  }
}


export async function createGameDataStore(root:string,options:{allowCheckout?:boolean}={}):Promise<GameDataStore|ManualGameDataStore>{
  try{
    const path=join(root,'bundle-manifest.json');
    if((await lstat(path)).size<=4*1024*1024){
      const value=JSON.parse(await readFile(path,'utf8'));
      if(record(value)&&value.format==='pok.ui-manual-bundle.v2')return new ManualGameDataStore(root);
    }
  } catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT'&&!(error instanceof SyntaxError))throw error;}
  return new GameDataStore(root,options);
}
