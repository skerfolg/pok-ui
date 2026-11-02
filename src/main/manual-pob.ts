/** Manual calculation owns a native worker; optional PoK connections are unrelated. */
import {createHash} from 'node:crypto';
import type {BuildDocument,Calculation} from '../shared/contracts';
import type {DataBundleInfo,ItemRenderRequest,ItemRenderResult} from '../shared/game-data';
import {parseBuild,projectActiveXml} from '../shared/pob-document';
import {PobWorkerConnection,type WorkerLaunchDescriptor} from './pob-worker';
import type {ManualGameDataStore} from './manual-game-data';

type Data = Pick<ManualGameDataStore,'getInfo'|'getWorkerLaunchDescriptor'>;
type Worker = Pick<PobWorkerConnection,'connected'|'busy'|'workerInstance'|'connect'|'compute'|'renderItem'|'close'>;
const hash=(xml:string)=>createHash('sha256').update(xml,'utf8').digest('hex');

export class ManualPobBackend {
  private active?:Promise<unknown>;
  private stopped=false;
  private verified?:{identitySha256:string;workerInstance:string};
  constructor(private readonly data:Data,private readonly cacheHome:string,private readonly worker:Worker=new PobWorkerConnection(),private readonly timeoutMs=180_000){
    if(!Number.isSafeInteger(timeoutMs)||timeoutMs<=0||timeoutMs>180_000)throw new Error('수동 PoB 작업 기한이 올바르지 않습니다.');
  }
  private run<T>(action:(context:DataBundleInfo,remaining:()=>number)=>Promise<T>):Promise<T>{
    if(this.stopped)return Promise.reject(new Error('수동 PoB 계산기가 종료됐습니다.'));
    if(this.active||this.worker.busy)return Promise.reject(new Error('이전 PoB 작업과 정리가 진행 중입니다. 잠시 후 다시 시도해 주세요.'));
    const deadline=performance.now()+this.timeoutMs;
    const remaining=()=>{
      const value=Math.floor(deadline-performance.now());
      if(this.stopped)throw new Error('수동 PoB 계산기가 종료됐습니다.');
      if(value<=0)throw new Error('수동 PoB 작업의 전체 시간이 초과됐습니다.');
      return value;
    };
    const task=(async()=>{
      const info=await this.data.getInfo();remaining();
      if(info.status!=='ready'||!info.workerIdentity||!info.bundleId)throw new Error(info.error||'독립 PoB 묶음이 필요합니다.');
      if(!this.worker.connected){
        const launch:WorkerLaunchDescriptor=await this.data.getWorkerLaunchDescriptor(this.cacheHome);
        remaining();
        if(launch.identity.sha256!==info.workerIdentity.sha256||launch.bundleId!==info.bundleId)throw new Error('수동 데이터와 실행기 출처가 바뀌었습니다.');
        const connected=await this.worker.connect(launch,remaining());
        if(connected.identity.sha256!==info.workerIdentity.sha256)throw new Error('실제 worker 출처가 바뀌었습니다.');
      }
      if(!this.worker.workerInstance)throw new Error('실제 worker 세션이 없습니다.');
      this.verified={identitySha256:info.workerIdentity.sha256,workerInstance:this.worker.workerInstance};
      remaining();
      return action(info,remaining);
    })().catch(error=>{this.verified=undefined;throw error;});
    this.active=task;
    void task.finally(()=>{if(this.active===task)this.active=undefined;}).catch(()=>undefined);
    let timer:ReturnType<typeof setTimeout>|undefined;
    return Promise.race([task,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('수동 PoB 작업의 전체 시간이 초과됐습니다.')),this.timeoutMs);})]).finally(()=>{if(timer)clearTimeout(timer);});
  }
  compute(build:BuildDocument):Promise<Calculation>{
    return this.run(async(info,remaining)=>{
      // The stored document remains byte-for-byte intact. The existing UI
      // projection places explicitly active sets first for native PoB loading.
      const parsed=parseBuild(build.xml),tree=parsed.trees.find(value=>value.active)??parsed.trees[0];
      if(!tree?.version||tree.version!==info.defaultTreeVersion)throw new Error('이 문서의 트리 버전은 현재 계산 묶음에서 지원하지 않습니다.');
      const submitted=projectActiveXml(build.xml);
      const native=await this.worker.compute(submitted,undefined,remaining());
      remaining();
      if(typeof native.execution.owner!=='string'||native.execution.owner!==this.worker.workerInstance)throw new Error('계산 실행 세션이 바뀌었습니다.');
      return {revision:build.revision,at:new Date().toISOString(),result:{ok:true,...native},restoreNotes:[...(submitted===build.xml?[]:[{kind:'active-set-ordering',source_xml_sha256:hash(build.xml),submitted_xml_revision:native.xml_revision}]),...(native.wire_normalizations??[])],provenance:{format:'pob-worker-xml.v1',buildId:build.id,revision:build.revision,xmlSha256:hash(build.xml),submittedXmlSha256:hash(submitted),bundleId:info.bundleId!,pobCommit:info.workerIdentity!.pob_commit,workerIdentitySha256:info.workerIdentity!.sha256,workerInstance:native.execution.owner,mode:'xml'}};
    });
  }
  renderItem(request:ItemRenderRequest):Promise<ItemRenderResult>{return this.run(async(_info,remaining)=>{const result=await this.worker.renderItem(request,remaining());remaining();return result;});}
  getRuntimeVerification(){return !this.stopped&&this.worker.connected&&this.worker.workerInstance===this.verified?.workerInstance?this.verified:undefined;}
  async close():Promise<void>{this.stopped=true;await this.worker.close();}
}
