import {spawn,type ChildProcessWithoutNullStreams} from 'node:child_process';
import {join,resolve} from 'node:path';

/** One serial protocol channel. XML is still restored by every adapter request. */
export class PobWorker {
  private child?:ChildProcessWithoutNullStreams;
  private pending?:{id:number;resolve:(value:Record<string,unknown>)=>void;reject:(error:Error)=>void;timer:ReturnType<typeof setTimeout>;payload:Record<string,unknown>;sent:boolean};
  private sequence=0;
  private ready=false;
  private buffer='';
  private stderr='';
  constructor(private root:string,private executable:string,private version:string,private timeoutMs:number,private error:(code:string,message:string)=>Error){}
  close(reason=this.error('POB_CANCELLED','PoB 요청이 취소되었습니다.')):void{
    const child=this.child;this.child=undefined;this.ready=false;this.buffer='';
    const pending=this.pending;this.pending=undefined;
    if(pending){clearTimeout(pending.timer);pending.reject(reason);}
    child?.kill();
  }
  run(payload:Record<string,unknown>):Promise<Record<string,unknown>>{
    if(this.pending)return Promise.reject(this.error('POB_PROTOCOL','PoB 작업은 순서대로 실행해야 합니다.'));
    return new Promise((resolve,reject)=>{
      this.pending={id:++this.sequence,resolve,reject,payload,sent:false,timer:setTimeout(()=>this.close(this.error('POB_TIMEOUT','원본 PoB 응답 시간이 초과되었습니다.')),this.timeoutMs)};
      if(!this.child)this.start();
      this.send();
    });
  }
  private send():void{
    const pending=this.pending;
    if(!this.ready||!this.child||!pending||pending.sent)return;
    pending.sent=true;this.child.stdin.write(JSON.stringify({...pending.payload,id:pending.id})+'\n');
  }
  private start():void{
    const env={...process.env};delete env.LUA_PATH;delete env.LUA_CPATH;delete env.LUA_INIT;
    const child=spawn(resolve(this.root,this.executable),[join(this.root,'worker.lua')],{cwd:join(this.root,'pob','src'),env,stdio:['pipe','pipe','pipe'],windowsHide:true});
    this.child=child;this.stderr='';
    child.stderr.setEncoding('utf8');child.stderr.on('data',(chunk:string)=>{if(this.child===child)this.stderr=(this.stderr+chunk).slice(-6000);});
    child.stdout.setEncoding('utf8');child.stdout.on('data',(chunk:string)=>{
      if(this.child!==child)return;
      this.buffer+=chunk;
      if(Buffer.byteLength(this.buffer)>32*1024*1024){this.close(this.error('POB_PROTOCOL','PoB 응답 크기 제한을 넘었습니다.'));return;}
      let end:number;
      while(this.child===child&&(end=this.buffer.indexOf('\n'))>=0){
        const line=this.buffer.slice(0,end).trim();this.buffer=this.buffer.slice(end+1);if(!line)continue;
        try{
          const message=JSON.parse(line);
          if(message.ok!==true){this.close(this.error(String(message.error?.code||'POB_ERROR'),String(message.error?.message||'PoB 작업에 실패했습니다.')));return;}
          if(message.id===0&&!this.ready){
            if(message.result?.version!==this.version)throw new Error('PoB 실행 버전이 manifest와 다릅니다.');
            this.ready=true;this.send();continue;
          }
          const pending=this.pending;
          if(!this.ready||!pending?.sent||message.id!==pending.id)throw new Error('PoB 응답 순서가 올바르지 않습니다.');
          if(!message.result||typeof message.result!=='object'||Array.isArray(message.result)||pending.payload.op==='compute'&&(!message.result.stats||typeof message.result.stats!=='object'))throw new Error('PoB 응답 결과가 올바르지 않습니다.');
          clearTimeout(pending.timer);this.pending=undefined;pending.resolve(message.result);
        }catch(error){this.close(this.error('POB_PROTOCOL',error instanceof Error?error.message:String(error)));return;}
      }
    });
    child.on('error',()=>{if(this.child===child)this.close(this.error('POB_START','독립 PoB 프로세스를 시작하지 못했습니다.'));});
    child.stdin.on('error',()=>{if(this.child===child)this.close(this.error('POB_PROCESS','PoB 입력 연결이 종료되었습니다.'));});
    child.on('exit',code=>{if(this.child===child)this.close(this.error('POB_EXIT',`PoB 프로세스가 종료되었습니다 (${code}). ${this.stderr}`));});
  }
}
