import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { lstat, readFile, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { sha256File } from '../../scripts/file-integrity.mjs';
import type { PobRuntimeInfo } from '../shared/pob-runtime';
import type { BuildDocument, Calculation } from '../shared/contracts';
import { projectActiveXml,parseBuild,editBuild,hasLegacyPassiveSpec,LEGACY_TREE_WORKSPACE_MESSAGE,unsupportedTreeVersions } from '../shared/pob-document';
import {isDeepStrictEqual} from 'node:util';
import { xmlHash } from './build-proposals';
import type {PobEditorCatalog} from '../shared/pob-editor';
import type {ItemRenderRequest,ItemRenderResult} from '../shared/game-data';
import type {PobInspection,PobInspectionRequest} from '../shared/pob-inspection';
import type {PobCalcs,PobCalcsRequest} from '../shared/pob-calcs';
import type {PobParty,PobPartyRequest} from '../shared/pob-party';
import type {PobTreeRequest,PobTreeResult} from '../shared/pob-tree';
import type {PobItemControlsRequest,PobItemControls} from '../shared/pob-item-controls';
import type {PobEquipmentRequest,PobEquipment} from '../shared/pob-equipment';
import type {PobLoadoutsRequest,PobLoadouts,PobLoadoutSelection} from '../shared/pob-loadouts';

interface Manifest {
  schemaVersion:1;protocolVersion:1;runtimeId:string;commit:string;version:string;platform:string;
  supportedTreeVersions:string[];executable:string;files:{path:string;sha256:string}[];
}
export class PobRuntimeError extends Error {
  constructor(readonly code:string,message:string){super(message);this.name='PobRuntimeError';}
}
const sha=(value:string)=>createHash('sha256').update(value).digest('hex');
export class PobRuntime {
  private queue:Promise<void>=Promise.resolve();
  private active?:ChildProcessWithoutNullStreams;
  private activeRequestId?:string;
  private requestIds=new Set<string>();
  private cancelledIds=new Set<string>();
  private generation=0;
  private inspections=new Map<string,number>();
  private inspectionRequests=new Map<string,{key:string;pending:Promise<PobInspection>}>();
  private calcsVersions=new Map<string,number>();
  private calcsRequests=new Map<string,{key:string;pending:Promise<PobCalcs>}>();
  private treeRequests=new Map<string,{key:string;pending:Promise<PobTreeResult>}>();
  constructor(private root:string,private timeoutMs=120_000){}

  private async inside(path:string):Promise<string>{
    if(!path||isAbsolute(path)||path.split(/[\\/]/).some(p=>!p||p==='.'||p==='..'))throw new PobRuntimeError('POB_MANIFEST','PoB runtime 경로가 올바르지 않습니다.');
    const target=resolve(this.root,path),actual=await realpath(target),base=await realpath(this.root);
    const rel=relative(base,actual);
    if(!rel||rel==='..'||rel.startsWith('..\\')||rel.startsWith('../')||isAbsolute(rel)||(await lstat(target)).isSymbolicLink())
      throw new PobRuntimeError('POB_MANIFEST','PoB runtime 파일이 준비된 폴더를 벗어납니다.');
    return actual;
  }
  private async manifest():Promise<Manifest>{
    const bytes=await readFile(join(this.root,'manifest.json'),'utf8');
    if(Buffer.byteLength(bytes)>8*1024*1024)throw new PobRuntimeError('POB_MANIFEST','PoB runtime manifest가 너무 큽니다.');
    const value=JSON.parse(bytes) as Manifest;
    const {runtimeId,...body}=value;
    if(value.schemaVersion!==1||value.protocolVersion!==1||runtimeId!=='pob-'+sha(JSON.stringify(body))||!Array.isArray(value.files)||value.files.length>30000||
      !/^[a-f0-9]{40}$/.test(value.commit)||typeof value.version!=='string'||value.platform!==process.platform||
      !Array.isArray(value.supportedTreeVersions)||!value.supportedTreeVersions.length||value.supportedTreeVersions.some(v=>!/^\d+_\d+(?:_\d+)?$/.test(v)))
      throw new PobRuntimeError('POB_MANIFEST','PoB runtime의 형식·출처·플랫폼이 맞지 않습니다.');
    const paths=new Set(value.files.map(f=>f.path));
    if(paths.size!==value.files.length||!['worker.lua','editor.lua','inspect.lua','calcs.lua','party.lua','tree.lua','item-controls.lua','item-popups.lua','equipment.lua','loadouts.lua','loadout-management.lua','pob/src/HeadlessWrapper.lua','pob/LICENSE.md','LICENSE-LuaJIT.md',value.executable].every(p=>paths.has(p)))
      throw new PobRuntimeError('POB_MANIFEST','PoB runtime의 필수 파일 또는 라이선스가 없습니다.');
    for(let i=0;i<value.files.length;i+=24)await Promise.all(value.files.slice(i,i+24).map(async file=>{
      if(!/^[a-f0-9]{64}$/.test(file.sha256)||await sha256File(await this.inside(file.path))!==file.sha256)
        throw new PobRuntimeError('POB_INTEGRITY','PoB runtime 파일이 변경되었습니다: '+file.path);
    }));
    return value;
  }
  private info(value:Manifest):PobRuntimeInfo{
    return{status:'ready',runtimeId:value.runtimeId,commit:value.commit,version:value.version,supportedTreeVersions:value.supportedTreeVersions};
  }
  async getInfo():Promise<PobRuntimeInfo>{
    try{return this.info(await this.manifest());}
    catch(error){return{status:(error as NodeJS.ErrnoException).code==='ENOENT'?'missing':'corrupt',error:'독립 PoB 런타임을 준비해 주세요. '+(error instanceof PobRuntimeError?error.message:'npm run pob:prepare 절차를 확인해 주세요.')};}
  }
  close():void{this.generation++;this.inspectionRequests.clear();this.calcsRequests.clear();this.treeRequests.clear();this.active?.kill();this.active=undefined;}
  cancel(requestId:string):boolean{
    if(!this.requestIds.has(requestId))return false;
    this.cancelledIds.add(requestId);if(this.activeRequestId===requestId)this.active?.kill();return true;
  }
  async compute(build:BuildDocument):Promise<Calculation>{
    const snapshot=structuredClone(build);
    const {result,manifest}=await this.request({op:'compute',xml:projectActiveXml(snapshot.xml)});
    return{revision:snapshot.revision,at:new Date().toISOString(),result:{...result,pob_runtime:this.info(manifest)},restoreNotes:[],provenance:{
      buildId:snapshot.id,revision:snapshot.revision,xmlSha256:xmlHash(snapshot.xml),bundleId:manifest.runtimeId,pobCommit:manifest.commit,mode:'xml',runtime:'pob',
    }};
  }
  async catalog():Promise<PobEditorCatalog>{
    const {result,manifest}=await this.request({op:'catalog'});
    return{...result,source:{runtimeId:manifest.runtimeId,commit:manifest.commit,version:manifest.version}} as unknown as PobEditorCatalog;
  }
  async equipment(input:PobEquipmentRequest):Promise<PobEquipment>{
    const snapshot=structuredClone(input),parsed=parseBuild(snapshot.xml);
    const {result,manifest}=await this.request({op:'equipment',xml:projectActiveXml(snapshot.xml),action:snapshot.action,slot:snapshot.slot,itemId:snapshot.itemId,weaponSet:snapshot.weaponSet},snapshot.runtimeId,undefined,snapshot.requestId);
    if(!result.patch||!result.beforeSlots||!Array.isArray(result.slots)||!Array.isArray(result.diagnostics))throw new PobRuntimeError('POB_PROTOCOL','원본 장비 상태 응답이 올바르지 않습니다.');
    const before=result.beforeSlots as Record<string,string>,set=parsed.itemSets.find(s=>s.active);
    const diagnostics=[...result.diagnostics];for(const [name,id] of Object.entries(set?.slots||{}))if(id!=='0'&&before[name]!==id)diagnostics.push({code:'equipment-slot-restore',field:name,message:`XML 아이템 ${id} · 원본 복원 아이템 ${before[name]??'없음'}: 현재 원본 상태와 다릅니다.`});
    return{...result,diagnostics,buildId:snapshot.buildId,revision:snapshot.revision,xmlSha256:xmlHash(snapshot.xml),runtimeId:manifest.runtimeId,pobCommit:manifest.commit} as unknown as PobEquipment;
  }
  async party(input:PobPartyRequest):Promise<PobParty>{
    const snapshot=structuredClone(input);
    const {result,manifest}=await this.request({op:'party',xml:projectActiveXml(snapshot.xml),supportXml:snapshot.supportXml?projectActiveXml(snapshot.supportXml):undefined,action:snapshot.action,destination:snapshot.destination,append:snapshot.append},snapshot.runtimeId);
    if(!result.buffers||!result.exports||!Array.isArray(result.destinations)||!Array.isArray(result.diagnostics))throw new PobRuntimeError('POB_PROTOCOL','원본 파티 응답이 올바르지 않습니다.');
    return{...result,buildId:snapshot.buildId,revision:snapshot.revision,xmlSha256:xmlHash(snapshot.xml),runtimeId:manifest.runtimeId,pobCommit:manifest.commit,supportSha256:snapshot.supportXml?xmlHash(snapshot.supportXml):undefined} as unknown as PobParty;
  }
  async itemControls(input:PobItemControlsRequest):Promise<PobItemControls>{
    const snapshot=structuredClone(input),item=parseBuild(snapshot.xml).items.find(i=>i.id===snapshot.itemId);
    if(!item)throw new PobRuntimeError('POB_ITEM','편집할 원본 아이템을 찾지 못했습니다.');
    const text=snapshot.draftText??item.text;
    const {result,manifest}=await this.request({op:'item-controls',xml:projectActiveXml(snapshot.xml),itemId:snapshot.itemId,text,sourceText:item.text,field:snapshot.field,value:snapshot.value,slot:snapshot.slot,popup:snapshot.popup},snapshot.runtimeId,undefined,snapshot.requestId);
    if(snapshot.slot&&result.validatedSlot!==snapshot.slot)throw new PobRuntimeError('POB_PROTOCOL','원본 슬롯 검증이 누락되었습니다. 런타임을 다시 준비해 주세요.');
    if(typeof result.text!=='string'||typeof result.sourcePreserved!=='boolean'||!result.metadata||!Array.isArray(result.fields)||!Array.isArray(result.diagnostics))throw new PobRuntimeError('POB_PROTOCOL','원본 아이템 편집 응답이 올바르지 않습니다.');
    return{...result,buildId:snapshot.buildId,revision:snapshot.revision,xmlSha256:xmlHash(snapshot.xml),runtimeId:manifest.runtimeId,pobCommit:manifest.commit,itemId:snapshot.itemId,inputTextSha256:xmlHash(text)} as unknown as PobItemControls;
  }
  async tree(input:PobTreeRequest):Promise<PobTreeResult>{
    const snapshot=structuredClone(input),key=JSON.stringify(snapshot),existing=this.treeRequests.get(snapshot.buildId);
    if(existing?.key===key)return existing.pending;
    const pending:Promise<PobTreeResult>=this.request({op:'tree',xml:projectActiveXml(snapshot.xml),nodeId:snapshot.nodeId,action:snapshot.action,allocMode:snapshot.allocMode,attributeIndex:snapshot.attributeIndex,jewelItemId:snapshot.jewelItemId,classId:snapshot.classId,ascendancyId:snapshot.ascendancyId,classChoice:snapshot.classChoice},snapshot.runtimeId,()=>this.treeRequests.get(snapshot.buildId)?.pending!==pending).then(({result,manifest})=>{
      if(!result.patch||!Array.isArray(result.added)||!Array.isArray(result.removed)||!Array.isArray(result.path)||!Array.isArray(result.diagnostics))throw new PobRuntimeError('POB_PROTOCOL','원본 트리 편집 응답이 올바르지 않습니다.');
      return{...result,buildId:snapshot.buildId,revision:snapshot.revision,xmlSha256:xmlHash(snapshot.xml),runtimeId:manifest.runtimeId,pobCommit:manifest.commit} as unknown as PobTreeResult;
    });
    this.treeRequests.set(snapshot.buildId,{key,pending});const cleanup=()=>{if(this.treeRequests.get(snapshot.buildId)?.pending===pending)this.treeRequests.delete(snapshot.buildId);};void pending.then(cleanup,cleanup);return pending;
  }
  async loadouts(input:PobLoadoutsRequest):Promise<PobLoadouts>{
    const snapshot=structuredClone(input),parsed=parseBuild(snapshot.xml);projectActiveXml(snapshot.xml);
    const adopt=snapshot.treeWorkspace?.action==='adopt',legacy=hasLegacyPassiveSpec(snapshot.xml);
    if(snapshot.treeWorkspace&&legacy&&!adopt)throw new PobRuntimeError('POB_TREE_LEGACY',LEGACY_TREE_WORKSPACE_MESSAGE);
    if(adopt&&!legacy)throw new PobRuntimeError('POB_TREE_LEGACY','옮길 단일 Spec 원문이 없습니다.');
    const canonical=adopt?parseBuild(editBuild(snapshot.xml,{type:'tree-adopt-legacy'})):parsed;
    // Original Loadout management operates on canonical tree order, including filtered rows.
    if(snapshot.treeWorkspace&&(snapshot.manage||snapshot.name))throw new PobRuntimeError('POB_REQUEST','트리 작업의 요청 출처가 둘 이상입니다.');
    const canonicalSets=snapshot.treeWorkspace?{tree:canonical.trees.map(set=>set.id),items:canonical.itemSets.map(set=>set.id),skills:canonical.skillSets.map(set=>set.id),config:canonical.configs.map(set=>set.id)}:undefined;
    const {result,manifest}=await this.request({op:'loadouts',xml:snapshot.xml,name:snapshot.name,manage:snapshot.manage,treeWorkspace:snapshot.treeWorkspace,canonicalSets},snapshot.runtimeId,undefined,snapshot.requestId);
    if(!Array.isArray(result.choices)||!Array.isArray(result.diagnostics)||!result.identity||!result.equipment)throw new PobRuntimeError('POB_PROTOCOL','원본 통합 구성 응답이 올바르지 않습니다.');
    const map=(value:unknown):PobLoadoutSelection=>{
      const source=value as PobLoadoutSelection,index=Number(source?.tree),plan=result.sets as PobLoadouts['sets'];
      if(!Number.isSafeInteger(index)||index<1||index>(plan?.tree.length??parsed.trees.length))throw new PobRuntimeError('POB_PROTOCOL','원본 통합 구성의 트리 위치가 올바르지 않습니다.');
      const selection={tree:String(index),items:String(source.items),skills:String(source.skills),config:String(source.config)};
      for(const [key,sets]of [['items',parsed.itemSets],['skills',parsed.skillSets],['config',parsed.configs]] as const)if(!(plan?.[key]??sets).some(set=>set.id===selection[key]))throw new PobRuntimeError('POB_PROTOCOL','원본 통합 구성의 세트 ID가 XML과 다릅니다.');
      return selection;
    };
    if(snapshot.manage&&!result.sets)throw new PobRuntimeError('POB_PROTOCOL','원본 관리 연산의 세트 출처가 없습니다.');
    if(snapshot.treeWorkspace&&(!result.sets||!isDeepStrictEqual((result.treeWorkspace as PobLoadouts['treeWorkspace'])?.operation,snapshot.treeWorkspace)))throw new PobRuntimeError('POB_PROTOCOL','원본 트리 작업 응답이 요청과 다릅니다.');
    if(snapshot.treeWorkspace)result.treeWorkspace={...result.treeWorkspace as NonNullable<PobLoadouts['treeWorkspace']>,operation:snapshot.treeWorkspace};
    if(snapshot.treeWorkspace?.action==='export-code'){
      const data=(result.treeWorkspace as NonNullable<PobLoadouts['treeWorkspace']>).treeCode;
      if(!data||!Array.isArray(data.sourceNodes)||data.sourceNodes.some(id=>!Number.isSafeInteger(id)))throw new PobRuntimeError('POB_PROTOCOL','내보낸 원본 트리의 복원 ID 정보가 없습니다.');
      const actual=new Set(data.sourceNodes);data.inputMissingNodes=(parsed.trees.find(tree=>tree.active)?.nodes||[]).filter(id=>!actual.has(id));
    }
    return{...result,operation:snapshot.manage,choices:result.choices.map((value:unknown)=>{const choice=value as PobLoadouts['choices'][number];if(typeof choice.name!=='string'||typeof choice.label!=='string')throw new PobRuntimeError('POB_PROTOCOL','원본 통합 구성 이름이 올바르지 않습니다.');return{...choice,selection:map(choice.selection)};}),selection:map(result.selection),buildId:snapshot.buildId,revision:snapshot.revision,xmlSha256:xmlHash(snapshot.xml),runtimeId:manifest.runtimeId,pobCommit:manifest.commit} as PobLoadouts;
  }
  async calcs(input:PobCalcsRequest):Promise<PobCalcs>{
    const snapshot=structuredClone(input),hash=xmlHash(snapshot.xml),key=JSON.stringify([snapshot.revision,hash,snapshot.cellId,snapshot.runtimeId]);
    const existing=this.calcsRequests.get(snapshot.buildId);if(existing?.key===key)return existing.pending;
    const token=(this.calcsVersions.get(snapshot.buildId)||0)+1;this.calcsVersions.set(snapshot.buildId,token);
    if(this.calcsVersions.size>64)this.calcsVersions.delete(this.calcsVersions.keys().next().value!);
    const pending=this.request({op:'calcs',xml:projectActiveXml(snapshot.xml),cellId:snapshot.cellId},snapshot.runtimeId,()=>this.calcsVersions.get(snapshot.buildId)!==token).then(({result,manifest})=>{
      if(!Array.isArray(result.sections)||!Array.isArray(result.diagnostics)||!result.selectors)throw new PobRuntimeError('POB_PROTOCOL','원본 계산 상세 응답이 올바르지 않습니다.');
      return{...result,buildId:snapshot.buildId,revision:snapshot.revision,xmlSha256:hash,runtimeId:manifest.runtimeId,pobCommit:manifest.commit,at:new Date().toISOString()} as unknown as PobCalcs;
    });
    this.calcsRequests.set(snapshot.buildId,{key,pending});
    const cleanup=()=>{if(this.calcsRequests.get(snapshot.buildId)?.pending===pending)this.calcsRequests.delete(snapshot.buildId);};void pending.then(cleanup,cleanup);return pending;
  }
  async renderItem(args:ItemRenderRequest,expectedRuntimeId?:string):Promise<ItemRenderResult>{
    const submitted={...args,...(args.buildXml?{buildXml:projectActiveXml(args.buildXml)}:{})};
    const {result}=await this.request({op:'item',args:submitted},expectedRuntimeId);
    return result as unknown as ItemRenderResult;
  }
  async treeSource(version:string):Promise<Record<string,unknown>>{
    const info=await this.getInfo();if(info.status!=='ready'||!info.supportedTreeVersions?.includes(version))throw new PobRuntimeError('POB_TREE_SOURCE','지원하는 원본 트리 버전이 아닙니다.');
    const {result}=await this.request({op:'tree-source',version},info.runtimeId);
    if(result.version!==version||!result.tree||typeof result.tree!=='object'||Array.isArray(result.tree))throw new PobRuntimeError('POB_PROTOCOL','원본 Lua 트리 export 형식이 올바르지 않습니다.');
    return result.tree as Record<string,unknown>;
  }
  async inspect(input:PobInspectionRequest):Promise<PobInspection>{
    const snapshot=structuredClone(input),hash=xmlHash(snapshot.xml),key=snapshot.revision+':'+hash;
    const existing=this.inspectionRequests.get(snapshot.buildId);if(existing?.key===key)return existing.pending;
    const token=(this.inspections.get(input.buildId)||0)+1;
    this.inspections.set(input.buildId,token);if(this.inspections.size>64)this.inspections.delete(this.inspections.keys().next().value!);
    const obsolete=()=>this.inspections.get(snapshot.buildId)!==token;
    const pending=this.request({op:'inspect',xml:projectActiveXml(snapshot.xml)},undefined,obsolete).then(({result,manifest})=>{
      if(!result.character||typeof result.character!=='object'||!Array.isArray(result.config)||!Array.isArray(result.skills)||!Array.isArray(result.diagnostics))throw new PobRuntimeError('POB_PROTOCOL','원본 PoB 조회 응답의 형식이 올바르지 않습니다.');
      return{...result,buildId:snapshot.buildId,revision:snapshot.revision,xmlSha256:hash,runtimeId:manifest.runtimeId} as unknown as PobInspection;
    });
    this.inspectionRequests.set(snapshot.buildId,{key,pending});
    const cleanup=()=>{if(this.inspectionRequests.get(snapshot.buildId)?.pending===pending)this.inspectionRequests.delete(snapshot.buildId);};
    void pending.then(cleanup,cleanup);return pending;
  }
  private request(payload:Record<string,unknown>,expectedRuntimeId?:string,obsolete?:()=>boolean,requestId?:string):Promise<{result:Record<string,unknown>;manifest:Manifest}>{
    if(requestId){if(this.requestIds.has(requestId))return Promise.reject(new PobRuntimeError('POB_PROTOCOL','같은 PoB 요청 ID가 이미 실행 중입니다.'));this.requestIds.add(requestId);}
    const generation=this.generation,submitted=structuredClone(payload);
    const pending=this.queue.then(async()=>{
      const requireCurrent=()=>{if(requestId&&this.cancelledIds.has(requestId))throw new PobRuntimeError('POB_CANCELLED','PoB 요청이 취소되었습니다.');if(obsolete?.())throw new PobRuntimeError('POB_SUPERSEDED','더 최신 입력의 조회로 대체되었습니다.');};
      requireCurrent();
      if(generation!==this.generation)throw new PobRuntimeError('POB_CANCELLED','대기 중 PoB 계산이 취소되었습니다.');
      const manifest=await this.manifest();
      requireCurrent();
      if(expectedRuntimeId&&expectedRuntimeId!==manifest.runtimeId)throw new PobRuntimeError('POB_CHANGED','카탈로그와 실행 중인 PoB의 출처가 다릅니다. 데이터를 다시 준비해 주세요.');
      const args=submitted.args as Record<string,unknown>|undefined;
      for(const [label,xml]of [['빌드 XML',submitted.xml],['지원 빌드 XML',submitted.supportXml],['아이템 문맥 XML',args?.buildXml]] as const){
        if(typeof xml!=='string')continue;const unsupported=unsupportedTreeVersions(xml,manifest.supportedTreeVersions);
        if(unsupported.length)throw new PobRuntimeError('POB_TREE_VERSION',`${label}의 미지원 트리 ${unsupported.map(tree=>`${tree.id}:${tree.version}`).join(', ')}를 현재 고정 PoB에 로드할 수 없습니다. 원문을 보존합니다.`);
      }
      if(generation!==this.generation)throw new PobRuntimeError('POB_CANCELLED','PoB 계산이 취소되었습니다.');
      const result=await this.run(manifest,submitted,generation,requestId);
      const after=await this.manifest();
      requireCurrent();
      if(generation!==this.generation)throw new PobRuntimeError('POB_CANCELLED','PoB 계산이 취소되었습니다.');
      if(after.runtimeId!==manifest.runtimeId)throw new PobRuntimeError('POB_CHANGED','계산 도중 PoB 버전이 변경되었습니다. 다시 계산해 주세요.');
      return{result,manifest};
    });
    const cleanup=()=>{if(requestId){this.requestIds.delete(requestId);this.cancelledIds.delete(requestId);}};void pending.then(cleanup,cleanup);
    this.queue=pending.then(()=>undefined,()=>undefined);return pending;
  }
  private run(manifest:Manifest,payload:Record<string,unknown>,generation:number,requestId?:string):Promise<Record<string,unknown>>{
    return new Promise((resolvePromise,reject)=>{
      const env={...process.env};delete env.LUA_PATH;delete env.LUA_CPATH;delete env.LUA_INIT;
      const child=spawn(join(this.root,manifest.executable),[join(this.root,'worker.lua')],{cwd:join(this.root,'pob','src'),env,stdio:['pipe','pipe','pipe'],windowsHide:true});
      this.active=child;this.activeRequestId=requestId;let buffer='',stderr='',settled=false,ready=false;
      const finish=(error?:Error,result?:Record<string,unknown>)=>{
        if(settled)return;settled=true;clearTimeout(timer);if(this.active===child){this.active=undefined;this.activeRequestId=undefined;}
        if(generation!==this.generation||requestId&&this.cancelledIds.has(requestId))error=new PobRuntimeError('POB_CANCELLED','PoB 요청이 취소되었습니다.');
        child.stdin.end();child.kill();if(error)reject(error);else resolvePromise(result!);
      };
      const timer=setTimeout(()=>finish(new PobRuntimeError('POB_TIMEOUT','원본 PoB 계산 응답 시간이 초과되었습니다.')),this.timeoutMs);
      child.stderr.setEncoding('utf8');child.stderr.on('data',(chunk:string)=>{stderr=(stderr+chunk).slice(-6000);});
      child.stdout.setEncoding('utf8');child.stdout.on('data',(chunk:string)=>{
        buffer+=chunk;if(Buffer.byteLength(buffer)>32*1024*1024){finish(new PobRuntimeError('POB_PROTOCOL','PoB 응답 크기 제한을 넘었습니다.'));return;}
        let end:number;
        while((end=buffer.indexOf('\n'))>=0&&!settled){
          const line=buffer.slice(0,end).trim();buffer=buffer.slice(end+1);if(!line)continue;
          try{
            const message=JSON.parse(line);
            if(generation!==this.generation){finish(new PobRuntimeError('POB_CANCELLED','PoB 계산이 취소되었습니다.'));return;}
            if(message.ok!==true){finish(new PobRuntimeError(String(message.error?.code||'POB_ERROR'),String(message.error?.message||'PoB 작업에 실패했습니다.')));return;}
            if(message.id===0&&!ready){
              if(message.result?.version!==manifest.version)throw new Error('PoB 실행 버전이 manifest와 다릅니다.');
              ready=true;child.stdin.write(JSON.stringify({id:1,...payload})+'\n');
            }else if(message.id===1&&ready){
              if(!message.result||typeof message.result!=='object'||payload.op==='compute'&&(!message.result.stats||typeof message.result.stats!=='object'))throw new Error('PoB 응답 결과가 올바르지 않습니다.');
              finish(undefined,message.result);
            }else throw new Error('PoB 응답 순서가 올바르지 않습니다.');
          }catch(error){finish(new PobRuntimeError('POB_PROTOCOL',error instanceof Error?error.message:String(error)));}
        }
      });
      child.on('error',()=>finish(new PobRuntimeError('POB_START','독립 PoB 프로세스를 시작하지 못했습니다.')));
      child.stdin.on('error',()=>finish(new PobRuntimeError('POB_PROCESS','PoB 입력 연결이 종료되었습니다.')));
      child.on('exit',code=>finish(new PobRuntimeError(generation!==this.generation?'POB_CANCELLED':'POB_EXIT',generation!==this.generation?'PoB 계산이 취소되었습니다.':`PoB 프로세스가 종료되었습니다 (${code}). ${stderr}`)));
    });
  }
}
