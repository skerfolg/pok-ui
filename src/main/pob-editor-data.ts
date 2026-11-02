import {readFile,lstat,realpath} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join,relative,isAbsolute} from 'node:path';
import {sha256File} from '../../scripts/file-integrity.mjs';
import type {PobRuntime} from './pob-runtime';
import type {PobEditorCatalog} from '../shared/pob-editor';
import type {CatalogQuery,CatalogQueryResult,CatalogEntryType,CatalogEntry,DataBundleInfo} from '../shared/game-data';
import {PassiveTreeStore,TreeResourceError} from './passive-tree';
interface Manifest {schemaVersion:1;bundleId:string;runtimeId:string;commit:string;version:string;defaultTreeVersion:string;supportedTreeVersions:string[];files:{path:string;sha256:string}[]}
interface Loaded {manifest:Manifest;catalog:PobEditorCatalog;entries:Map<string,CatalogEntry>;tree:PassiveTreeStore}
const types=new Set(['base','unique','mod','gem','skill']);
export class PobEditorData {
  private pending?:Promise<Loaded>;
  constructor(private root:string,private runtime:Pick<PobRuntime,'getInfo'>){}
  private async inside(path:string):Promise<string>{
    if(typeof path!=='string'||!path||isAbsolute(path)||path.split(/[\\/]/).some(p=>!p||p==='.'||p==='..'))throw new Error('PoB 편집 데이터 경로가 올바르지 않습니다.');
    const target=resolve(this.root,path),canonical=await realpath(target),base=await realpath(this.root),rel=relative(base,canonical);
    if(!rel||isAbsolute(rel)||rel==='..'||rel.startsWith('..\\')||rel.startsWith('../')||(await lstat(target)).isSymbolicLink())throw new Error('PoB 편집 데이터가 준비된 폴더를 벗어납니다.');
    return canonical;
  }
  private load():Promise<Loaded>{
    if(!this.pending)this.pending=this.read().catch(error=>{this.pending=undefined;throw error;});
    return this.pending;
  }
  private async read():Promise<Loaded>{
    const text=await readFile(join(this.root,'manifest.json'),'utf8');if(Buffer.byteLength(text)>8*1024*1024)throw new Error('PoB 편집 manifest가 너무 큽니다.');
    const manifest=JSON.parse(text) as Manifest,{bundleId,...body}=manifest;
    if(manifest.schemaVersion!==1||bundleId!=='pob-editor-'+createHash('sha256').update(JSON.stringify(body)).digest('hex')||
      !Array.isArray(manifest.files)||manifest.files.length>30000||!Array.isArray(manifest.supportedTreeVersions)||!manifest.supportedTreeVersions.includes(manifest.defaultTreeVersion))throw new Error('PoB 편집 데이터 manifest가 올바르지 않습니다.');
    const info=await this.runtime.getInfo();
    if(info.status!=='ready'||info.runtimeId!==manifest.runtimeId||info.commit!==manifest.commit||info.version!==manifest.version)throw new Error('편집 데이터와 독립 PoB 런타임의 출처가 다릅니다.');
    const paths=new Set(manifest.files.map(f=>f.path));
    if(paths.size!==manifest.files.length||!paths.has('catalog.json'))throw new Error('PoB 편집 데이터 파일 목록이 올바르지 않습니다.');
    for(const version of manifest.supportedTreeVersions){
      if(!/^\d+_\d+(?:_\d+)?$/.test(version)||!paths.has(`trees/${version}/manifest.json`)||!paths.has(`trees/${version}/tree.json`))throw new Error('PoB 트리 데이터가 빠졌습니다.');
    }
    for(let i=0;i<manifest.files.length;i+=24)await Promise.all(manifest.files.slice(i,i+24).map(async file=>{
      if(typeof file.sha256!=='string'||!/^[a-f0-9]{64}$/.test(file.sha256)||await sha256File(await this.inside(file.path))!==file.sha256)throw new Error('PoB 편집 데이터 무결성 오류: '+file.path);
    }));
    const path=await this.inside('catalog.json');if((await lstat(path)).size>64*1024*1024)throw new Error('PoB 카탈로그가 너무 큽니다.');
    const catalog=JSON.parse(await readFile(path,'utf8')) as PobEditorCatalog;
    if(catalog.schemaVersion!==1||catalog.source?.runtimeId!==manifest.runtimeId||catalog.source.commit!==manifest.commit||catalog.source.version!==manifest.version||
      catalog.defaultTreeVersion!==manifest.defaultTreeVersion||JSON.stringify(catalog.supportedTreeVersions)!==JSON.stringify(manifest.supportedTreeVersions)||!Array.isArray(catalog.entries)||!Array.isArray(catalog.classes))throw new Error('PoB 카탈로그 출처가 다릅니다.');
    const entries=new Map<string,CatalogEntry>();
    for(const entry of catalog.entries){
      const key=entry.type+':'+entry.id;
      if(!types.has(entry.type)||typeof entry.id!=='string'||!entry.id||typeof entry.name!=='string'||!entry.raw||typeof entry.raw!=='object'||entries.has(key))throw new Error('PoB 카탈로그 항목이 올바르지 않습니다.');
      entries.set(key,entry);
    }
    if(!catalog.classes.length||catalog.classes.some(c=>!c.id||!c.name||!Number.isInteger(c.internalId)||!Number.isInteger(c.legacyId)||!Array.isArray(c.ascendancies)))throw new Error('PoB 직업 메타데이터가 올바르지 않습니다.');
    return{manifest,catalog,entries,tree:new PassiveTreeStore(join(this.root,'trees'),{bundleId,expectedCommit:manifest.commit})};
  }
  async getInfo():Promise<DataBundleInfo>{
    try{
      const {manifest,catalog}=await this.load();return{status:'ready',source:'pob',bundleId:manifest.bundleId,pobCommit:manifest.commit,pobVersion:manifest.version,runtimeId:manifest.runtimeId,
        defaultTreeVersion:catalog.defaultTreeVersion,supportedTreeVersions:catalog.supportedTreeVersions,classes:catalog.classes,
        catalog:{schemaVersion:1,extractorVersion:'1',entries:catalog.entries.length,classes:catalog.classes.length,digest:manifest.files.find(f=>f.path==='catalog.json')!.sha256,diagnostics:catalog.diagnostics.length}};
    }catch(error){return{status:(error as NodeJS.ErrnoException).code==='ENOENT'?'missing':'corrupt',source:'pob',error:'독립 PoB 편집 데이터를 준비해 주세요. '+((error as NodeJS.ErrnoException).code==='ENOENT'?'npm run pob:prepare-data 절차를 확인해 주세요.':error instanceof Error?error.message:String(error))};}
  }
  async query(request:CatalogQuery):Promise<CatalogQueryResult>{
    const {catalog}=await this.load();if(request.type!==undefined&&!types.has(request.type))throw new Error('지원하지 않는 카탈로그 유형입니다.');
    if(request.query!==undefined&&typeof request.query!=='string'||request.category!==undefined&&typeof request.category!=='string')throw new Error('카탈로그 검색 값이 올바르지 않습니다.');
    const query=(request.query||'').trim().toLowerCase(),category=(request.category||'').trim().toLowerCase();
    const limit=Math.max(1,Math.min(100,Number.isInteger(request.limit)?Number(request.limit):50)),offset=Math.max(0,Math.min(1_000_000,Number.isInteger(request.offset)?Number(request.offset):0));
    const entries=catalog.entries.filter(e=>(!request.type||e.type===request.type)&&(!category||e.category?.toLowerCase()===category)&&(!query||[e.name,e.id,e.category,e.subType,e.gemId,e.gameId].filter(Boolean).join(' ').toLowerCase().includes(query)));
    return{total:entries.length,offset,limit,entries:entries.slice(offset,offset+limit)};
  }
  async getEntry(type:CatalogEntryType,id:string):Promise<CatalogEntry>{
    if(!types.has(type)||typeof id!=='string')throw new Error('카탈로그 식별자가 올바르지 않습니다.');
    const entry=(await this.load()).entries.get(type+':'+id);if(!entry)throw new Error('원본 PoB 카탈로그 항목을 찾지 못했습니다.');return entry;
  }
  async loadTree(version:string){const loaded=await this.load();if(!loaded.manifest.supportedTreeVersions.includes(version))throw new TreeResourceError('이 원본 PoB의 트리 버전이 아닙니다.',404);return loaded.tree.load(version);}
  async asset(url:string){return(await this.load()).tree.asset(url);}
}
