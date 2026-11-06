import type {PobItemTooltipRequest,PobItemTooltip} from '../shared/pob-item-tooltip';
import {isPobSummaryTarget,isPobInputDiagnostic} from '../shared/pob-runtime';
import {PobWorker} from './pob-worker';
import { lstat, readFile, realpath } from 'node:fs/promises';
import {watch,type FSWatcher} from 'node:fs';
import {setImmediate as nextIoTurn} from 'node:timers/promises';
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
import {skillGroupEdit,validateSkillTextInput,type PobSkillGroups} from '../shared/pob-skill-groups';

interface Manifest {
  schemaVersion:1;protocolVersion:1;runtimeId:string;commit:string;version:string;platform:string;
  supportedTreeVersions:string[];executable:string;files:{path:string;sha256:string}[];
}
interface ReadCacheContext {buildId:string;revision:number;xmlSha256:string;kind:'inspection'|'equipment'|'character'}
interface WorkspaceReads {revision:number;xmlSha256:string;runtimeId:string;inspection:PobInspection;equipment:PobEquipment;character:PobTreeResult}
export class PobRuntimeError extends Error {
  constructor(readonly code:string,message:string){super(message);this.name='PobRuntimeError';}
}
const sha=(value:string)=>createHash('sha256').update(value).digest('hex');
export class PobRuntime {
  private tasks:{priority:number;run:()=>Promise<void>}[]=[];
  private pumping=false;
  private schedule<T>(op:string,run:()=>Promise<T>):Promise<T>{
    const priority=op==='prefetch'?4:op==='compute'?0:['equipment','item-controls','loadouts','party'].includes(op)?1:op==='tree'?2:3;
    const result=new Promise<T>((resolve,reject)=>{this.tasks.push({priority,run:async()=>{try{resolve(await run());}catch(error){reject(error);}}});});
    if(!this.pumping){this.pumping=true;queueMicrotask(()=>{void this.drain();});}
    return result;
  }
  private async drain():Promise<void>{
    while(this.tasks.length){let index=0;for(let i=1;i<this.tasks.length;i++)if(this.tasks[i].priority<this.tasks[index].priority)index=i;await this.tasks.splice(index,1)[0].run();}
    this.pumping=false;
  }
  private worker?:PobWorker;
  private workerRuntimeId?:string;
  private verifiedFiles=new Map<string,{stamp:string;sha256:string}>();
  private watcher?:FSWatcher;
  private watchedRoot?:string;
  private watchedIdentity?:string;
  private fileEpoch=0;
  private validationEpoch=0;
  private lastByteVerification=0;
  private knownDirectories=new Set<string>();
  private verifiedManifest?:{key:string;epoch:number;at:number};
  private manifestPending?:Promise<Manifest>;
  private invalidateSource():void{
    this.fileEpoch++;this.verifiedManifest=undefined;this.workspaceReads.clear();this.readonlyReads.clear();this.calcsContexts.clear();
    this.worker?.close(new PobRuntimeError('POB_CHANGED','PoB runtime 파일 변경을 감지했습니다. 다시 계산해 주세요.'));
    this.worker=undefined;this.workerRuntimeId=undefined;this.onInvalidated?.();
  }
  private watchRoot(base:string,identity:string):void{
    if(this.watcher&&this.watchedRoot===base&&this.watchedIdentity===identity)return;
    if(this.watchedRoot&&(this.watchedRoot!==base||this.watchedIdentity!==identity)){this.worker?.close(new PobRuntimeError('POB_CHANGED','PoB runtime 폴더가 교체되었습니다.'));this.worker=undefined;this.workerRuntimeId=undefined;this.verifiedFiles.clear();this.workspaceReads.clear();this.readonlyReads.clear();this.calcsContexts.clear();this.onInvalidated?.();}
    this.watcher?.close();this.watcher=undefined;this.watchedRoot=base;this.watchedIdentity=identity;this.verifiedManifest=undefined;
    const invalidate=(event?:string,name?:string|Buffer|null)=>{
      this.validationEpoch++;this.verifiedManifest=undefined;
      // Windows can report directory metadata changes when a process traverses
      // the installation. Recheck its files without treating that hint as a crash.
      const path=name?.toString().replaceAll('\\','/').toLowerCase();
      if(event==='change'&&path&&this.knownDirectories.has(path))return;
      this.invalidateSource();
    };
    try{
      const watcher=watch(base,{recursive:true},invalidate);this.watcher=watcher;watcher.unref();
      watcher.on('error',()=>{if(this.watcher===watcher){watcher.close();this.watcher=undefined;invalidate();}});
    }catch{this.watcher=undefined;} // Unsupported watchers use the metadata/hash scan below.
  }
  private activeRequestId?:string;
  private requestIds=new Set<string>();
  private cancelledIds=new Set<string>();
  private generation=0;
  private computes=new Map<string,{key:string;pending:Promise<Calculation>}>();
  private workspaceReads=new Map<string,WorkspaceReads>();
  private readonlyReads=new Map<string,{runtimeId:string;result:Record<string,unknown>}>();
  private invalidResponse(message:string):never{const error=new PobRuntimeError('POB_PROTOCOL',message);this.worker?.close(error);this.worker=undefined;this.workerRuntimeId=undefined;this.workspaceReads.clear();this.readonlyReads.clear();this.calcsContexts.clear();throw error;}
  private async cachedWorkspace(input:PobInspectionRequest,runtimeId?:string,requestId?:string):Promise<WorkspaceReads|undefined>{
    const saved=this.workspaceReads.get(input.buildId);
    if(!saved||saved.revision!==input.revision||saved.xmlSha256!==xmlHash(input.xml)||runtimeId&&saved.runtimeId!==runtimeId)return;
    if(requestId){if(this.requestIds.has(requestId))throw new PobRuntimeError('POB_PROTOCOL','같은 PoB 요청 ID가 이미 실행 중입니다.');this.requestIds.add(requestId);}
    const generation=this.generation;
    try{
      const manifest=await this.manifest();
      if(generation!==this.generation||requestId&&this.cancelledIds.has(requestId))throw new PobRuntimeError('POB_CANCELLED','PoB 조회가 취소되었습니다.');
      if(this.workspaceReads.get(input.buildId)===saved&&manifest.runtimeId===saved.runtimeId)return structuredClone(saved);
    }finally{if(requestId){this.requestIds.delete(requestId);this.cancelledIds.delete(requestId);}}
  }
  private equipmentReadKeys=new Map<string,string>();
  private loadoutReadKeys=new Map<string,string>();
  private itemReadKeys=new Map<string,string>();
  private inspections=new Map<string,number>();
  private inspectionRequests=new Map<string,{key:string;pending:Promise<PobInspection>}>();
  private calcsVersions=new Map<string,number>();
  private calcsContexts=new Map<string,{key:string;revision:number}>();
  private calcsRequests=new Map<string,{key:string;pending:Promise<PobCalcs>}>();
  private treeRequests=new Map<string,{key:string;pending:Promise<PobTreeResult>}>();
  constructor(private root:string,private timeoutMs=120_000,private onInvalidated?:()=>void){}

  private async inside(path:string,base:string):Promise<string>{
    if(!path||isAbsolute(path)||path.split(/[\\/]/).some(p=>!p||p==='.'||p==='..'))throw new PobRuntimeError('POB_MANIFEST','PoB runtime 경로가 올바르지 않습니다.');
    const target=resolve(this.root,path),actual=await realpath(target);
    const rel=relative(base,actual);
    if(!rel||rel==='..'||rel.startsWith('..\\')||rel.startsWith('../')||isAbsolute(rel)||(await lstat(target)).isSymbolicLink())
      throw new PobRuntimeError('POB_MANIFEST','PoB runtime 파일이 준비된 폴더를 벗어납니다.');
    return actual;
  }
  private manifest():Promise<Manifest>{
    if(this.manifestPending)return this.manifestPending;
    const pending=this.verifyManifest();this.manifestPending=pending;
    const cleanup=()=>{if(this.manifestPending===pending)this.manifestPending=undefined;};void pending.then(cleanup,cleanup);return pending;
  }
  private async verifyManifest(attempt=0):Promise<Manifest>{
    const base=await realpath(this.root),rootStat=await lstat(base,{bigint:true});this.watchRoot(base,[rootStat.dev,rootStat.ino].join(':'));
    // Deliver pending file events before deciding whether verified bytes can be reused.
    await nextIoTurn();
    const bytes=await readFile(join(this.root,'manifest.json'),'utf8');
    if(Buffer.byteLength(bytes)>8*1024*1024)throw new PobRuntimeError('POB_MANIFEST','PoB runtime manifest가 너무 큽니다.');
    const value=JSON.parse(bytes) as Manifest;
    const {runtimeId,...body}=value;
    if(value.schemaVersion!==1||value.protocolVersion!==1||runtimeId!=='pob-'+sha(JSON.stringify(body))||!Array.isArray(value.files)||value.files.length>30000||
      !/^[a-f0-9]{40}$/.test(value.commit)||typeof value.version!=='string'||value.platform!==process.platform||
      !Array.isArray(value.supportedTreeVersions)||!value.supportedTreeVersions.length||value.supportedTreeVersions.some(v=>!/^\d+_\d+(?:_\d+)?$/.test(v)))
      throw new PobRuntimeError('POB_MANIFEST','PoB runtime의 형식·출처·플랫폼이 맞지 않습니다.');
    const paths=new Set(value.files.map(f=>f.path));
    if(paths.size!==value.files.length||!['worker.lua','editor.lua','inspect.lua','calcs.lua','party.lua','tree.lua','item-controls.lua','item-tooltip.lua','item-popups.lua','equipment.lua','loadouts.lua','loadout-management.lua','tree-state.lua','tree-workspace.lua','skill-groups.lua','skill-text.lua','pob/src/HeadlessWrapper.lua','pob/LICENSE.md','LICENSE-LuaJIT.md',value.executable,...(process.platform==='win32'?['bin/lua51.dll']:[])].every(p=>paths.has(p)))
      throw new PobRuntimeError('POB_MANIFEST','PoB runtime의 필수 파일 또는 라이선스가 없습니다.');
    this.knownDirectories=new Set(value.files.flatMap(file=>{const parts=file.path.replaceAll('\\','/').toLowerCase().split('/');return parts.slice(0,-1).map((_,index)=>parts.slice(0,index+1).join('/'));}));
    const key=sha(bytes)+':'+base+':'+[rootStat.dev,rootStat.ino,rootStat.ctimeNs].join(':');
    const epoch=this.validationEpoch,now=Date.now();
    const fullBytesDue=now-this.lastByteVerification>=30_000;
    if(this.watcher&&this.verifiedManifest?.key===key&&this.verifiedManifest.epoch===epoch&&!fullBytesDue)return value;
    // Periodic full byte verification also bounds a missed filesystem notification.
    if(fullBytesDue)this.verifiedFiles.clear();
    for(let i=0;i<value.files.length;i+=24)await Promise.all(value.files.slice(i,i+24).map(async file=>{
      const path=await this.inside(file.path,base),before=await lstat(path,{bigint:true});
      const stamp=[before.dev,before.ino,before.size,before.mtimeNs,before.ctimeNs,before.mode].join(':');
      const cached=this.verifiedFiles.get(path);
      if(!/^[a-f0-9]{64}$/.test(file.sha256)||!before.isFile())
        throw new PobRuntimeError('POB_INTEGRITY','PoB runtime 파일이 변경되었습니다: '+file.path);
      if(cached?.stamp===stamp&&cached.sha256===file.sha256)return;
      if(cached&&cached.stamp!==stamp)this.invalidateSource();
      if(await sha256File(path)!==file.sha256)throw new PobRuntimeError('POB_INTEGRITY','PoB runtime 파일이 변경되었습니다: '+file.path);
      const after=await lstat(path,{bigint:true});
      if([after.dev,after.ino,after.size,after.mtimeNs,after.ctimeNs,after.mode].join(':')!==stamp)
        throw new PobRuntimeError('POB_INTEGRITY','검증 도중 PoB runtime 파일이 변경되었습니다: '+file.path);
      this.verifiedFiles.set(path,{stamp,sha256:file.sha256});
    }));
    if(epoch!==this.validationEpoch){
      if(attempt<2)return this.verifyManifest(attempt+1);
      throw new PobRuntimeError('POB_CHANGED','검증 중 PoB runtime 파일이 계속 변경되었습니다. 다시 준비해 주세요.');
    }
    this.verifiedManifest={key,epoch,at:now};
    if(fullBytesDue)this.lastByteVerification=now;
    return value;
  }
  private info(value:Manifest):PobRuntimeInfo{
    return{status:'ready',runtimeId:value.runtimeId,commit:value.commit,version:value.version,supportedTreeVersions:value.supportedTreeVersions};
  }
  async sourceProof():Promise<import('./pob-source-compatibility').PobSourceProof>{const manifest=await this.manifest();return{runtimeId:manifest.runtimeId,commit:manifest.commit,files:Object.fromEntries(manifest.files.filter(file=>file.path.startsWith('pob/src/')).map(file=>[file.path.slice(4),file.sha256]))};}
  async getInfo():Promise<PobRuntimeInfo>{
    try{return this.info(await this.manifest());}
    catch(error){this.worker?.close();this.worker=undefined;this.workerRuntimeId=undefined;this.verifiedFiles.clear();this.workspaceReads.clear();this.readonlyReads.clear();this.calcsContexts.clear();return{status:(error as NodeJS.ErrnoException).code==='ENOENT'?'missing':'corrupt',error:'독립 PoB 런타임을 준비해 주세요. '+(error instanceof PobRuntimeError?error.message:'npm run pob:prepare 절차를 확인해 주세요.')};}
  }
  close():void{this.generation++;this.tooltipKey='';this.tooltipPending=undefined;this.computes.clear();this.workspaceReads.clear();this.readonlyReads.clear();this.calcsContexts.clear();this.equipmentReadKeys.clear();this.itemReadKeys.clear();this.inspectionRequests.clear();this.calcsRequests.clear();this.treeRequests.clear();this.worker?.close();this.worker=undefined;this.workerRuntimeId=undefined;this.verifiedFiles.clear();this.verifiedManifest=undefined;this.watcher?.close();this.watcher=undefined;}
  cancel(requestId:string):boolean{
    if(!this.requestIds.has(requestId))return false;
    this.cancelledIds.add(requestId);if(this.activeRequestId===requestId){this.worker?.close();this.worker=undefined;this.workerRuntimeId=undefined;}return true;
  }
  async compute(build:BuildDocument,scope?:'workspace'):Promise<Calculation>{
    const snapshot=structuredClone(build),key=JSON.stringify([snapshot.id,snapshot.revision,snapshot.xml]),owner=scope==='workspace'?'workspace:':'build:'+snapshot.id;
    const existing=this.computes.get(owner);if(existing?.key===key)return existing.pending;
    const pending:Promise<Calculation>=this.request({op:'compute',xml:projectActiveXml(snapshot.xml)},undefined,()=>this.computes.get(owner)?.pending!==pending).then(({result,manifest})=>{
      const {workspaceSnapshot,...output}=result;
      if(output.target!==undefined&&!isPobSummaryTarget(output.target))this.invalidResponse('원본 계산 대상 응답의 형식이 올바르지 않습니다.');
      if(output.inputDiagnostics!==undefined&&(!Array.isArray(output.inputDiagnostics)||!output.inputDiagnostics.every(isPobInputDiagnostic)))this.invalidResponse('원본 입력 해석 진단 형식이 올바르지 않습니다.');
      const context={buildId:snapshot.id,revision:snapshot.revision,xml:snapshot.xml};
      let restoreNotes:unknown[]=[];
      if(workspaceSnapshot&&typeof workspaceSnapshot==='object'){
        const reads=workspaceSnapshot as Record<string,Record<string,unknown>>;
        const equipment=this.equipmentResult(context,reads.equipment,manifest);restoreNotes=structuredClone(equipment.diagnostics);
        const inspection=this.inspectionResult(context,reads.inspection,manifest),inputGroups=parseBuild(snapshot.xml).skillSets.find(set=>set.active)?.groups||[];
        if(inputGroups.length===inspection.skills.length)for(const observed of inspection.skills){const input=inputGroups.find(group=>group.id===observed.groupId);if(!input)continue;for(const nativeGem of observed.gems){const gem=input.gems[nativeGem.index-1];if(!gem||gem.name!==nativeGem.name)continue;for(const field of ['level','quality'] as const)if(typeof nativeGem[field]==='number'&&Number.isFinite(nativeGem[field])&&nativeGem[field]!==Number(gem.attributes[field]??gem[field]))restoreNotes.push({code:'gem-source-normalization',field:`${observed.groupId}:${nativeGem.index}:${field}`,message:`원본 PoB가 ${gem.name} ${field==='level'?'레벨':'퀄리티'} 입력 ${gem.attributes[field]??gem[field]}을 ${nativeGem[field]}으로 복원했습니다. XML 입력은 유지합니다.`});}}

        this.workspaceReads.set(snapshot.id,{revision:snapshot.revision,xmlSha256:xmlHash(snapshot.xml),runtimeId:manifest.runtimeId,inspection,equipment,character:this.treeResult(context,reads.character,manifest)});
        if(this.workspaceReads.size>16)this.workspaceReads.delete(this.workspaceReads.keys().next().value!);
      }
      return{revision:snapshot.revision,at:new Date().toISOString(),result:{...output,inputDiagnosticsAvailable:Array.isArray(output.inputDiagnostics),pob_runtime:this.info(manifest)},restoreNotes,provenance:{
        buildId:snapshot.id,revision:snapshot.revision,xmlSha256:xmlHash(snapshot.xml),bundleId:manifest.runtimeId,pobCommit:manifest.commit,mode:'xml',runtime:'pob',
      }};
    });
    this.computes.set(owner,{key,pending});
    const cleanup=()=>{if(this.computes.get(owner)?.pending===pending)this.computes.delete(owner);};void pending.then(cleanup,cleanup);return pending;
  }
  async catalog():Promise<PobEditorCatalog>{
    const {result,manifest}=await this.request({op:'catalog'});
    return{...result,source:{runtimeId:manifest.runtimeId,commit:manifest.commit,version:manifest.version}} as unknown as PobEditorCatalog;
  }
  async equipment(input:PobEquipmentRequest):Promise<PobEquipment>{
    const snapshot=structuredClone(input),key=JSON.stringify([snapshot.revision,xmlHash(snapshot.xml),snapshot.runtimeId]);
    if(!snapshot.action){const cached=await this.cachedWorkspace(snapshot,snapshot.runtimeId,snapshot.requestId);if(cached)return cached.equipment;this.equipmentReadKeys.set(snapshot.buildId,key);if(this.equipmentReadKeys.size>64)this.equipmentReadKeys.delete(this.equipmentReadKeys.keys().next().value!);}
    const {result,manifest,fromCache}=await this.request({op:'equipment',xml:projectActiveXml(snapshot.xml),action:snapshot.action,slot:snapshot.slot,itemId:snapshot.itemId,weaponSet:snapshot.weaponSet},snapshot.runtimeId,!snapshot.action?()=>this.equipmentReadKeys.get(snapshot.buildId)!==key:undefined,snapshot.requestId,!snapshot.action?{buildId:snapshot.buildId,revision:snapshot.revision,xmlSha256:xmlHash(snapshot.xml),kind:'equipment'}:undefined);
    return fromCache?result as unknown as PobEquipment:this.equipmentResult(snapshot,result,manifest);
  }
  private equipmentResult(snapshot:PobInspectionRequest,result:Record<string,unknown>,manifest:Manifest):PobEquipment{
    if(!result||!result.patch||!result.beforeSlots||!Array.isArray(result.slots)||!Array.isArray(result.diagnostics))this.invalidResponse('원본 장비 상태 응답이 올바르지 않습니다.');
    const before=result.beforeSlots as Record<string,string>,set=parseBuild(snapshot.xml).itemSets.find(s=>s.active);
    const diagnostics=[...result.diagnostics];for(const [name,id] of Object.entries(set?.slots||{}))if(id!=='0'&&before[name]!==id)diagnostics.push({code:'equipment-slot-restore',field:name,message:`XML 아이템 ${id} · 원본 복원 아이템 ${before[name]??'없음'}: 현재 원본 상태와 다릅니다.`});
    return{...result,diagnostics,buildId:snapshot.buildId,revision:snapshot.revision,xmlSha256:xmlHash(snapshot.xml),runtimeId:manifest.runtimeId,pobCommit:manifest.commit} as unknown as PobEquipment;
  }
  async party(input:PobPartyRequest):Promise<PobParty>{
    const snapshot=structuredClone(input);
    const {result,manifest}=await this.request({op:'party',xml:projectActiveXml(snapshot.xml),supportXml:snapshot.supportXml?projectActiveXml(snapshot.supportXml):undefined,action:snapshot.action,destination:snapshot.destination,append:snapshot.append},snapshot.runtimeId);
    if(!result.buffers||!result.exports||!Array.isArray(result.destinations)||!Array.isArray(result.diagnostics))throw new PobRuntimeError('POB_PROTOCOL','원본 파티 응답이 올바르지 않습니다.');
    return{...result,buildId:snapshot.buildId,revision:snapshot.revision,xmlSha256:xmlHash(snapshot.xml),runtimeId:manifest.runtimeId,pobCommit:manifest.commit,supportSha256:snapshot.supportXml?xmlHash(snapshot.supportXml):undefined} as unknown as PobParty;
  }
  private tooltipKey='';
  private tooltipPending?:{key:string;promise:Promise<PobItemTooltip>};
  itemTooltip(input:PobItemTooltipRequest):Promise<PobItemTooltip>{
    const snapshot=structuredClone(input),key=JSON.stringify({...snapshot,prefetch:undefined});
    if(this.tooltipPending?.key===key)return this.tooltipPending.promise;
    if(!snapshot.prefetch)this.tooltipKey=key;
    const promise=(async()=>{
      if(!parseBuild(snapshot.xml).items.some(item=>item.id===snapshot.itemId))throw new PobRuntimeError('POB_ITEM','비교할 보유 아이템을 찾지 못했습니다.');
      const {result,manifest}=await this.request({op:'item-tooltip',xml:projectActiveXml(snapshot.xml),itemId:snapshot.itemId,slot:snapshot.slot,nodeId:snapshot.nodeId,prefetch:snapshot.prefetch},snapshot.runtimeId,snapshot.prefetch?undefined:()=>this.tooltipKey!==key);
      if(!Array.isArray(result.displayLines)||result.displayLines.some(line=>typeof line!=='string')||!Array.isArray(result.requirements)||result.requirements.some(line=>typeof line!=='string')||!Array.isArray(result.comparisons)||result.comparisons.some(section=>!section||typeof section!=='object'||typeof section.header!=='string'||!Array.isArray(section.lines)||section.lines.some((line:unknown)=>typeof line!=='string')))this.invalidResponse('원본 아이템 비교 응답이 올바르지 않습니다.');
      return{...result,buildId:snapshot.buildId,revision:snapshot.revision,xmlSha256:xmlHash(snapshot.xml),runtimeId:manifest.runtimeId,pobCommit:manifest.commit,itemId:snapshot.itemId,slot:snapshot.slot,nodeId:snapshot.nodeId} as unknown as PobItemTooltip;
    })();
    this.tooltipPending={key,promise};void promise.finally(()=>{if(this.tooltipPending?.promise===promise)this.tooltipPending=undefined;}).catch(()=>{});return promise;
  }
  async itemControls(input:PobItemControlsRequest):Promise<PobItemControls>{
    const snapshot=structuredClone(input),item=parseBuild(snapshot.xml).items.find(i=>i.id===snapshot.itemId);
    if(!item)throw new PobRuntimeError('POB_ITEM','편집할 원본 아이템을 찾지 못했습니다.');
    if(snapshot.similar&&(snapshot.field||snapshot.popup))throw new PobRuntimeError('POB_REQUEST','검색과 아이템 변경을 함께 요청할 수 없습니다.');
    const text=snapshot.draftText??item.text,key=JSON.stringify([snapshot.revision,xmlHash(snapshot.xml),snapshot.runtimeId,snapshot.itemId,snapshot.slot]),reading=!snapshot.field&&!snapshot.popup&&!snapshot.similar;
    if(reading){this.itemReadKeys.set(snapshot.buildId,key);if(this.itemReadKeys.size>64)this.itemReadKeys.delete(this.itemReadKeys.keys().next().value!);}
    const {result,manifest}=await this.request({op:'item-controls',xml:projectActiveXml(snapshot.xml),itemId:snapshot.itemId,text,sourceText:item.text,field:snapshot.field,value:snapshot.value,slot:snapshot.slot,popup:snapshot.popup,similar:snapshot.similar},snapshot.runtimeId,reading?()=>this.itemReadKeys.get(snapshot.buildId)!==key:undefined,snapshot.requestId);
    if(snapshot.slot&&result.validatedSlot!==snapshot.slot)this.invalidResponse('원본 슬롯 검증이 누락되었습니다. 런타임을 다시 준비해 주세요.');
    if(!Array.isArray(result.displayLines)||result.displayLines.some(line=>typeof line!=='string')||typeof result.text!=='string'||typeof result.sourcePreserved!=='boolean'||!result.metadata||!Array.isArray(result.fields)||!Array.isArray(result.diagnostics))this.invalidResponse('원본 아이템 편집 응답이 올바르지 않습니다.');
    if(snapshot.similar&&(!result.similar||typeof result.similar!=='object'||typeof (result.similar as Record<string,unknown>).url!=='string'||!Array.isArray((result.similar as Record<string,unknown>).rows)))this.invalidResponse('원본 검색 조건 응답이 올바르지 않습니다.');
    return{...result,buildId:snapshot.buildId,revision:snapshot.revision,xmlSha256:xmlHash(snapshot.xml),runtimeId:manifest.runtimeId,pobCommit:manifest.commit,itemId:snapshot.itemId,inputTextSha256:xmlHash(text)} as unknown as PobItemControls;
  }
  async tree(input:PobTreeRequest):Promise<PobTreeResult>{
    const snapshot=structuredClone(input),metadata=snapshot.action==='character'&&snapshot.classId===undefined&&snapshot.ascendancyId===undefined,owner=(metadata?'metadata:'+xmlHash(snapshot.xml):snapshot.nodeId!==undefined?'node':snapshot.action==='character'?'character':'inventory')+':'+snapshot.buildId,key=JSON.stringify(snapshot),existing=this.treeRequests.get(owner);
    if(existing?.key===key)return existing.pending;
    if(metadata&&snapshot.nodeId===undefined&&snapshot.allocMode===undefined){const cached=await this.cachedWorkspace(snapshot,snapshot.runtimeId);if(cached)return cached.character;}
    const latest=this.treeRequests.get(owner);if(latest?.key===key)return latest.pending;
    const pending:Promise<PobTreeResult>=this.request({op:'tree',xml:projectActiveXml(snapshot.xml),nodeId:snapshot.nodeId,action:snapshot.action,allocMode:snapshot.allocMode,attributeIndex:snapshot.attributeIndex,jewelItemId:snapshot.jewelItemId,classId:snapshot.classId,ascendancyId:snapshot.ascendancyId,classChoice:snapshot.classChoice},snapshot.runtimeId,()=>this.treeRequests.get(owner)?.pending!==pending,undefined,metadata&&snapshot.nodeId===undefined&&snapshot.allocMode===undefined?{buildId:snapshot.buildId,revision:snapshot.revision,xmlSha256:xmlHash(snapshot.xml),kind:'character'}:undefined).then(({result,manifest,fromCache})=>{
      if(fromCache)return result as unknown as PobTreeResult;
      if(!result||!result.patch||!Array.isArray(result.added)||!Array.isArray(result.removed)||!Array.isArray(result.path)||!Array.isArray(result.diagnostics))this.invalidResponse('원본 트리 편집 응답이 올바르지 않습니다.');
      return{...result,buildId:snapshot.buildId,revision:snapshot.revision,xmlSha256:xmlHash(snapshot.xml),runtimeId:manifest.runtimeId,pobCommit:manifest.commit} as unknown as PobTreeResult;
    });
    this.treeRequests.set(owner,{key,pending});const cleanup=()=>{if(this.treeRequests.get(owner)?.pending===pending)this.treeRequests.delete(owner);};void pending.then(cleanup,cleanup);return pending;
  }
  async loadouts(input:PobLoadoutsRequest):Promise<PobLoadouts>{
    const snapshot=structuredClone(input),parsed=parseBuild(snapshot.xml);projectActiveXml(snapshot.xml);
    if(snapshot.skillGroups&&(snapshot.manage||snapshot.name||snapshot.treeWorkspace))throw new PobRuntimeError('POB_REQUEST','스킬 그룹 작업의 요청 출처가 둘 이상입니다.');
    const skillSet=parsed.skillSets.find(set=>set.active);
    if(snapshot.skillGroups&&(!skillSet||skillSet.id!==snapshot.skillGroups.setId))throw new PobRuntimeError('POB_REQUEST','현재 활성 스킬 세트를 선택해 주세요.');
    const adopt=snapshot.treeWorkspace?.action==='adopt',legacy=hasLegacyPassiveSpec(snapshot.xml);
    if(snapshot.treeWorkspace&&legacy&&!adopt)throw new PobRuntimeError('POB_TREE_LEGACY',LEGACY_TREE_WORKSPACE_MESSAGE);
    if(adopt&&!legacy)throw new PobRuntimeError('POB_TREE_LEGACY','옮길 단일 Spec 원문이 없습니다.');
    const canonical=adopt?parseBuild(editBuild(snapshot.xml,{type:'tree-adopt-legacy'})):parsed;
    // Original Loadout management operates on canonical tree order, including filtered rows.
    if(snapshot.treeWorkspace&&(snapshot.manage||snapshot.name))throw new PobRuntimeError('POB_REQUEST','트리 작업의 요청 출처가 둘 이상입니다.');
    const canonicalSets=snapshot.treeWorkspace?{tree:canonical.trees.map(set=>set.id),items:canonical.itemSets.map(set=>set.id),skills:canonical.skillSets.map(set=>set.id),config:canonical.configs.map(set=>set.id)}:undefined;
    const readOnly=!snapshot.manage&&!snapshot.name&&(!snapshot.skillGroups||snapshot.skillGroups.action==='inspect'||snapshot.skillGroups.action==='export-text')&&(!snapshot.treeWorkspace||snapshot.treeWorkspace.action==='inspect'||snapshot.treeWorkspace.action==='export-code');
    const readOwner=JSON.stringify([snapshot.buildId,snapshot.skillGroups?.action,snapshot.skillGroups?.setId,snapshot.skillGroups?.groupId,snapshot.treeWorkspace?.action]),readKey=sha(JSON.stringify({...snapshot,requestId:undefined}));
    if(readOnly){this.loadoutReadKeys.set(readOwner,readKey);if(this.loadoutReadKeys.size>64)this.loadoutReadKeys.delete(this.loadoutReadKeys.keys().next().value!);}
    const {result,manifest}=await this.request({op:'loadouts',prefetch:readOnly,xml:snapshot.xml,name:snapshot.name,manage:snapshot.manage,treeWorkspace:snapshot.treeWorkspace,canonicalSets,skillGroups:snapshot.skillGroups,canonicalSkillGroups:snapshot.skillGroups?skillSet!.groups.map(group=>group.id):undefined,canonicalSkillSets:snapshot.skillGroups?Object.fromEntries(parsed.skillSets.map(set=>[set.id,set.groups.map(group=>group.id)])):undefined},snapshot.runtimeId,readOnly?()=>this.loadoutReadKeys.get(readOwner)!==readKey:undefined,snapshot.requestId);
    if(snapshot.skillGroups){
      const data=result.skillGroups as PobSkillGroups|undefined;
      if(!data||!isDeepStrictEqual(data.operation,snapshot.skillGroups)||data.setId!==skillSet!.id||!Array.isArray(data.groups)||!Array.isArray(data.order)||data.groups.length!==skillSet!.groups.length||data.groups.some((group,index)=>group.id!==skillSet!.groups[index].id||typeof group.canDelete!=='boolean'||typeof group.label!=='string'))throw new PobRuntimeError('POB_PROTOCOL','원본 스킬 그룹 응답의 요청·출처가 다릅니다.');
      data.operation=snapshot.skillGroups;
      if(snapshot.skillGroups.action==='import-text'||snapshot.skillGroups.action==='export-text'){
        if(!data.text||typeof data.text.raw!=='string'||!Array.isArray(data.text.lines)||!Array.isArray(data.text.warnings)||typeof data.text.canApply!=='boolean'||typeof data.text.partial!=='boolean'||snapshot.skillGroups.action==='import-text'&&data.text.raw!==snapshot.skillGroups.text)throw new PobRuntimeError('POB_PROTOCOL','원본 텍스트 복원 응답이 요청과 다릅니다.');
        if(data.text.warnings.some(value=>typeof value!=='string'))throw new PobRuntimeError('POB_PROTOCOL','원본 텍스트 진단 형식이 올바르지 않습니다.');
        if(snapshot.skillGroups.action==='import-text')try{validateSkillTextInput({inputRevision:snapshot.revision,inputXmlSha256:xmlHash(snapshot.xml),runtimeId:manifest.runtimeId,pobCommit:manifest.commit,raw:data.text.raw,lines:data.text.lines,warnings:data.text.warnings,partial:data.text.partial,...(data.text.stats!==undefined||data.text.canApply?{trial:{stats:data.text.stats!,warnings:data.text.calcWarnings!}}:{})});}catch(reason){throw new PobRuntimeError('POB_PROTOCOL',String(reason));}
        if(data.text.canApply)editBuild(snapshot.xml,skillGroupEdit(snapshot.xml,data));
      }else if(snapshot.skillGroups.action!=='inspect')skillGroupEdit(snapshot.xml,data);
      else if(!isDeepStrictEqual(data.order,skillSet!.groups.map(group=>group.id)))throw new PobRuntimeError('POB_PROTOCOL','원본 스킬 그룹 조회가 순서를 바꿨습니다.');
    }
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
    const owner=snapshot.buildId+':'+(snapshot.cellId||'table'),context=JSON.stringify([snapshot.revision,hash,snapshot.runtimeId]),prior=this.calcsContexts.get(snapshot.buildId);
    if(snapshot.prefetch&&prior&&(prior.revision>snapshot.revision||prior.revision===snapshot.revision&&prior.key!==context))throw new PobRuntimeError('POB_SUPERSEDED','더 최신 입력이 상세 읽기를 대체했습니다.');
    this.calcsContexts.set(snapshot.buildId,{key:context,revision:snapshot.revision});if(this.calcsContexts.size>64)this.calcsContexts.delete(this.calcsContexts.keys().next().value!);
    const existing=this.calcsRequests.get(owner);if(existing?.key===key)return existing.pending;
    const token=(this.calcsVersions.get(owner)||0)+1;this.calcsVersions.set(owner,token);
    if(this.calcsVersions.size>64)this.calcsVersions.delete(this.calcsVersions.keys().next().value!);
    const pending=this.request({op:'calcs',xml:projectActiveXml(snapshot.xml),cellId:snapshot.cellId,prefetch:snapshot.prefetch},snapshot.runtimeId,()=>this.calcsVersions.get(owner)!==token||this.calcsContexts.get(snapshot.buildId)?.key!==context).then(({result,manifest})=>{
      if(!Array.isArray(result.sections)||!Array.isArray(result.diagnostics)||!result.selectors)this.invalidResponse('원본 계산 상세 응답이 올바르지 않습니다.');
      return{...result,buildId:snapshot.buildId,revision:snapshot.revision,xmlSha256:hash,runtimeId:manifest.runtimeId,pobCommit:manifest.commit,at:new Date().toISOString()} as unknown as PobCalcs;
    });
    this.calcsRequests.set(owner,{key,pending});
    const cleanup=()=>{if(this.calcsRequests.get(owner)?.pending===pending)this.calcsRequests.delete(owner);};void pending.then(cleanup,cleanup);return pending;
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
    const cached=await this.cachedWorkspace(snapshot);if(cached)return cached.inspection;
    const existing=this.inspectionRequests.get(snapshot.buildId);if(existing?.key===key)return existing.pending;
    const token=(this.inspections.get(input.buildId)||0)+1;
    this.inspections.set(input.buildId,token);if(this.inspections.size>64)this.inspections.delete(this.inspections.keys().next().value!);
    const obsolete=()=>this.inspections.get(snapshot.buildId)!==token;
    const pending=this.request({op:'inspect',xml:projectActiveXml(snapshot.xml)},undefined,obsolete,undefined,{buildId:snapshot.buildId,revision:snapshot.revision,xmlSha256:hash,kind:'inspection'}).then(({result,manifest,fromCache})=>{
      return fromCache?result as unknown as PobInspection:this.inspectionResult(snapshot,result,manifest);
    });
    this.inspectionRequests.set(snapshot.buildId,{key,pending});
    const cleanup=()=>{if(this.inspectionRequests.get(snapshot.buildId)?.pending===pending)this.inspectionRequests.delete(snapshot.buildId);};
    void pending.then(cleanup,cleanup);return pending;
  }
  private inspectionResult(snapshot:PobInspectionRequest,result:Record<string,unknown>,manifest:Manifest):PobInspection{
      if(!result||!result.character||typeof result.character!=='object'||!Array.isArray(result.config)||!Array.isArray(result.skills)||!Array.isArray(result.diagnostics))this.invalidResponse('원본 PoB 조회 응답의 형식이 올바르지 않습니다.');
      return{...result,buildId:snapshot.buildId,revision:snapshot.revision,xmlSha256:xmlHash(snapshot.xml),runtimeId:manifest.runtimeId} as unknown as PobInspection;
  }
  private treeResult(snapshot:PobInspectionRequest,result:Record<string,unknown>,manifest:Manifest):PobTreeResult{
    if(!result||!result.patch||!Array.isArray(result.added)||!Array.isArray(result.removed)||!Array.isArray(result.path)||!Array.isArray(result.diagnostics))this.invalidResponse('원본 트리 편집 응답이 올바르지 않습니다.');
    return{...result,buildId:snapshot.buildId,revision:snapshot.revision,xmlSha256:xmlHash(snapshot.xml),runtimeId:manifest.runtimeId,pobCommit:manifest.commit} as unknown as PobTreeResult;
  }
  private request(payload:Record<string,unknown>,expectedRuntimeId?:string,obsolete?:()=>boolean,requestId?:string,readCache?:ReadCacheContext):Promise<{result:Record<string,unknown>;manifest:Manifest;fromCache?:true}>{
    if(requestId){if(this.requestIds.has(requestId))return Promise.reject(new PobRuntimeError('POB_PROTOCOL','같은 PoB 요청 ID가 이미 실행 중입니다.'));this.requestIds.add(requestId);}
    const generation=this.generation,submitted=structuredClone(payload);
    const pending=this.schedule(submitted.prefetch?'prefetch':String(submitted.op),async()=>{
      const requireCurrent=()=>{if(generation!==this.generation||requestId&&this.cancelledIds.has(requestId))throw new PobRuntimeError('POB_CANCELLED','PoB 요청이 취소되었습니다.');if(obsolete?.())throw new PobRuntimeError('POB_SUPERSEDED','더 최신 입력의 조회로 대체되었습니다.');};
      requireCurrent();
      if(generation!==this.generation)throw new PobRuntimeError('POB_CANCELLED','대기 중 PoB 계산이 취소되었습니다.');
      const manifest=await this.manifest();
      requireCurrent();
      if(expectedRuntimeId&&expectedRuntimeId!==manifest.runtimeId)throw new PobRuntimeError('POB_CHANGED','카탈로그와 실행 중인 PoB의 출처가 다릅니다. 데이터를 다시 준비해 주세요.');
      if(readCache){const cached=this.workspaceReads.get(readCache.buildId);if(cached&&cached.revision===readCache.revision&&cached.xmlSha256===readCache.xmlSha256&&cached.runtimeId===manifest.runtimeId)return{result:structuredClone(cached[readCache.kind]) as unknown as Record<string,unknown>,manifest,fromCache:true as const};}
      const args=submitted.args as Record<string,unknown>|undefined;
      for(const [label,xml]of [['빌드 XML',submitted.xml],['지원 빌드 XML',submitted.supportXml],['아이템 문맥 XML',args?.buildXml]] as const){
        if(typeof xml!=='string')continue;const unsupported=unsupportedTreeVersions(xml,manifest.supportedTreeVersions);
        if(unsupported.length)throw new PobRuntimeError('POB_TREE_VERSION',`${label}의 미지원 트리 ${unsupported.map(tree=>`${tree.id}:${tree.version}`).join(', ')}를 현재 고정 PoB에 로드할 수 없습니다. 원문을 보존합니다.`);
      }
      if(generation!==this.generation)throw new PobRuntimeError('POB_CANCELLED','PoB 계산이 취소되었습니다.');
      const memo= submitted.op==='calcs'||submitted.op==='item-tooltip'||submitted.op==='item-controls'&&!submitted.field&&!submitted.popup&&!submitted.similar;
      const {prefetch:_,...identity}=submitted;const readKey=memo?sha(JSON.stringify(identity)):undefined,cached=readKey?this.readonlyReads.get(readKey):undefined;
      if(cached?.runtimeId===manifest.runtimeId){this.readonlyReads.delete(readKey!);this.readonlyReads.set(readKey!,cached);return{result:structuredClone(cached.result),manifest};}
      const sourceEpoch=this.fileEpoch,result=await this.run(manifest,submitted,requestId);
      const after=await this.manifest();
      requireCurrent();
      if(generation!==this.generation)throw new PobRuntimeError('POB_CANCELLED','PoB 계산이 취소되었습니다.');
      if(after.runtimeId!==manifest.runtimeId||sourceEpoch!==this.fileEpoch)throw new PobRuntimeError('POB_CHANGED','계산 도중 PoB 출처가 변경되었습니다. 다시 계산해 주세요.');
      if(readKey){this.readonlyReads.set(readKey,{runtimeId:manifest.runtimeId,result:structuredClone(result)});if(this.readonlyReads.size>64)this.readonlyReads.delete(this.readonlyReads.keys().next().value!);}
      return{result,manifest};
    });
    const discardOnFailure=()=>{this.workspaceReads.clear();this.readonlyReads.clear();this.calcsContexts.clear();this.worker?.close();this.worker=undefined;this.workerRuntimeId=undefined;};
    void pending.catch(error=>{if(error instanceof PobRuntimeError&&['POB_INTEGRITY','POB_MANIFEST','POB_CHANGED'].includes(error.code))discardOnFailure();});
    const cleanup=()=>{if(requestId){this.requestIds.delete(requestId);this.cancelledIds.delete(requestId);}};void pending.then(cleanup,cleanup);
    return pending;
  }
  private async run(manifest:Manifest,payload:Record<string,unknown>,requestId?:string):Promise<Record<string,unknown>>{
    if(this.workerRuntimeId!==manifest.runtimeId){
      this.worker?.close(new PobRuntimeError('POB_CHANGED','PoB runtime 출처가 변경되었습니다.'));
      this.worker=new PobWorker(this.root,manifest.executable,manifest.version,this.timeoutMs,(code,message)=>new PobRuntimeError(code,message));
      this.workerRuntimeId=manifest.runtimeId;
    }
    this.activeRequestId=requestId;
    try{return await this.worker!.run(payload);}
    finally{this.activeRequestId=undefined;}
  }
}
