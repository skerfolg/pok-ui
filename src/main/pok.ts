import { designSnapshotFromResult } from './design-records';
import type { DesignRecordReference, DesignRecordSnapshot } from '../shared/build-revision';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { xmlHash } from './build-proposals';
import type { RuntimeIdentity } from '../shared/game-data';
import { join, resolve } from 'node:path';
import { compareIdentity, type GameDataLaunchDescriptor } from './game-data';
import type { Settings, ConnectionInfo, BuildDocument, Calculation } from '../shared/contracts';
import { projectActiveXml } from '../shared/pob-document';
import { encodePob } from './pob-files';

export interface ComputeContext { bundleId: string; identity: RuntimeIdentity }

export function effectivePokSettings(settings:Settings['pok'], packaged:boolean):Settings['pok'] {
  return packaged ? {mode:'bundled',root:'',python:'',luajit:''} : {...settings};
}

export function assertRuntimeIdentity(actual: unknown, expected: RuntimeIdentity): void {
  const mismatch = compareIdentity(expected, actual);
  if (mismatch) throw new Error('POK와 화면 데이터의 버전 불일치: ' + mismatch);
}

export interface PokTool { name: string; description?: string; inputSchema: Record<string, unknown> }
export class PokCompatibilityError extends Error {}
function assertDesktopTools(tools:PokTool[]):void {
  const missing=['compute_pob_xml','render_pob_item'].filter(name=>!tools.some(t=>t.name===name));
  if(missing.length)throw new PokCompatibilityError('연결된 POK의 데스크톱 계약이 부족합니다: '+missing.join(', ')+'. 이 엔진 커밋의 desktop runtime·카탈로그 지원이 필요합니다.');
}
export function assertDesktopContract(info:unknown, tools:PokTool[]):void {
  const missing=['compute_pob_xml','render_pob_item'].filter(name=>!tools.some(t=>t.name===name));
  if(!info||typeof info!=='object'||!('identity' in info))missing.unshift('runtime identity');
  if(missing.length)throw new PokCompatibilityError('연결된 POK의 데스크톱 계약이 부족합니다: '+missing.join(', ')+'. 이 엔진 커밋의 desktop runtime·카탈로그 지원이 필요합니다. 기존 번들로 계산하거나 버전 검증을 생략할 수 없습니다.');
}
export class PokToolError extends Error {
  constructor(message: string, readonly details?: unknown) { super(message); this.name = 'PokToolError'; }
}
export function unwrapMcp(response: unknown): unknown {
  const r = response as { isError?: boolean; structuredContent?: unknown; content?: { type: string; text?: string }[] };
  const text = r.content?.filter(c => c.type === 'text').map(c => c.text || '').join('\n') || '';
  let value = r.structuredContent;
  if (value === undefined) { try { value = JSON.parse(text); } catch { value = { text }; } }
  if (r.isError) throw new PokToolError(text || 'POK 도구 오류', value);
  if (value && typeof value === 'object' && Object.keys(value).length === 1 && 'result' in value) return (value as {result: unknown}).result;
  return value;
}
export class PokConnection {
  onDisconnected?:(message:string)=>void;
  private client?: Client;
  private transport?: StdioClientTransport;
  private connectPromise?: Promise<ConnectionInfo>;
  private generation = 0;
  private expectedIdentity?: RuntimeIdentity;
  private operationQueue: Promise<void> = Promise.resolve();
  private infoRequest?:Promise<unknown>;
  private toolsRequest?:Promise<void>;
  async refreshTools():Promise<void> {
    if(this.toolsRequest)return this.toolsRequest;
    const client=this.client,generation=this.generation;
    if(!client)throw new Error('먼저 POK에 연결해 주세요.');
    const pending=(async()=>{
      const tools:PokTool[]=[];let cursor:string|undefined;
      const cursors=new Set<string>();
      do {
        const listed=await client.listTools(cursor?{cursor}:undefined,{timeout:10_000});
        tools.push(...listed.tools.map(t=>({name:t.name,description:t.description,inputSchema:t.inputSchema as Record<string,unknown>})));
        cursor=listed.nextCursor;
        if(cursor){if(cursors.has(cursor))throw new Error('POK 도구 목록의 페이지 커서가 반복됩니다.');cursors.add(cursor);}
      }while(cursor);
      if(client!==this.client||generation!==this.generation)throw new Error('도구 조회 도중 POK 연결이 변경되었습니다.');
      this.tools=tools;
    })().finally(()=>{if(this.toolsRequest===pending)this.toolsRequest=undefined;});
    this.toolsRequest=pending;return pending;
  }
  bindIdentity(identity: RuntimeIdentity): void { this.expectedIdentity = identity; }
  tools: PokTool[] = [];
  root = '';
  python = '';
  get connected():boolean{return Boolean(this.client&&this.expectedIdentity&&!this.connectPromise);}
  private connectionLost(client:Client,message:string):void {
    if(this.client!==client)return;
    this.generation++;this.client=undefined;this.transport=undefined;this.expectedIdentity=undefined;this.tools=[];
    this.infoRequest=undefined;this.operationQueue=Promise.resolve();
    this.toolsRequest=undefined;
    this.onDisconnected?.(message);
  }
  requireReady():void {
    if(this.connectPromise)throw new Error('POK 연결 확인이 진행 중입니다. 연결된 뒤 다시 시도해 주세요.');
    if(!this.client||!this.expectedIdentity)throw new Error('POK 연결을 먼저 확인해 주세요.');
  }
  async close(): Promise<void> {
    this.generation++;
    this.expectedIdentity = undefined;
    this.operationQueue = Promise.resolve();
    this.infoRequest=undefined;
    this.toolsRequest=undefined;
    const client = this.client;
    this.client = undefined; this.tools = [];
    await client?.close().catch(() => undefined);
    this.transport = undefined;
  }
  connect(settings: Settings['pok'], bundledRoot: string, dataHome?: string, cacheHome?: string, launch?: GameDataLaunchDescriptor): Promise<ConnectionInfo> {
    if (this.connectPromise) return this.connectPromise;
    this.connectPromise = this.open(settings, bundledRoot, dataHome, cacheHome, launch).finally(() => { this.connectPromise = undefined; });
    return this.connectPromise;
  }
  private async open(settings: Settings['pok'], bundledRoot: string, dataHome?: string, cacheHome?: string, launch?: GameDataLaunchDescriptor): Promise<ConnectionInfo> {
    await this.close();
    try {
      const root = resolve(settings.mode === 'bundled' ? launch?.root || bundledRoot : settings.root);
      if (!settings.root && settings.mode === 'checkout') throw new Error('POK 저장소 폴더를 선택해 주세요.');
      const bundled = settings.mode === 'bundled';
      if (!bundled && (!existsSync(join(root, 'knowledge')) || !existsSync(join(root, 'src', 'pok')))) throw new Error('POK 저장소에서 knowledge와 src/pok를 찾지 못했습니다.');
      if(bundled&&!launch)throw new Error('검증된 런타임 실행 정보가 필요합니다.');
      const command = bundled ? launch!.command
        : settings.python || join(root, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
      if (!existsSync(command)) throw new Error(bundled ? '번들 POK 실행 파일이 없습니다. 개발 중에는 checkout 연결을 사용해 주세요.' : 'Python 실행 파일을 찾지 못했습니다. POK 설정에서 선택해 주세요.');
      this.python = bundled ? (existsSync(join(root,'python',process.platform==='win32'?'python.exe':'python'))?join(root,'python',process.platform==='win32'?'python.exe':'python'):'') : command;
      const env = Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string,string] => entry[1] !== undefined));
      delete env.PYTHONHOME;delete env.POK_POB_ROOT;
      Object.assign(env, { POK_RESOURCE_ROOT: root, PYTHONPATH: join(root, 'src'), PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8', POK_AUTOFILL_BUDGET_S: '1200' });
      if (bundled) {
        for (const key of ['POK_POB_ROOT','POK_LUAJIT']) delete env[key];
        env.POK_RESOURCE_ROOT = root;
      } else if (settings.luajit) env.POK_LUAJIT = settings.luajit;
      if (dataHome) env.POK_DATA_HOME = dataHome;
      if (cacheHome) env.POK_CACHE_HOME = cacheHome;
      const transport = new StdioClientTransport({ command, args: bundled ? launch!.args : ['-m','pok.mcp'], cwd: root, env, stderr: 'pipe' });
      // Drain diagnostics; a full stderr pipe must never stall the MCP process.
      transport.stderr?.on('data', () => undefined);
      const client = new Client({ name: 'pok-ui', version: '0.1.0' });
      client.onclose=()=>this.connectionLost(client,'POK 엔진 연결이 종료되었습니다. 다시 연결해 주세요.');
      this.transport = transport; this.client = client; this.root = root;
      await client.connect(transport, { timeout: 60_000 });
      await this.refreshTools();
      assertDesktopTools(this.tools);
      const info = await this.callResult('server_info', {});
      return { connected: true, info, tools: this.tools.map(t => t.name) };
    } catch (error) {
      const tools=this.tools.map(t=>t.name);
      await this.close();
      return { connected: false, tools, ...(error instanceof PokCompatibilityError?{compatibility:'incompatible' as const}:{}), error: error instanceof Error ? error.message : String(error) };
    }
  }
  call(name: string, args: Record<string, unknown>, budgetMs?: number): Promise<unknown> {
    const deadline=budgetMs===undefined?undefined:performance.now()+budgetMs;
    const remaining=()=>{if(deadline===undefined)return undefined;const value=deadline-performance.now();if(value<=0)throw new Error('POK 요청의 전체 기한이 초과되었습니다.');return value;};
    if(name==='server_info'){
      if(budgetMs!==undefined||args.include_kb_diagnostics===true)return this.performCall(name,args,remaining());
      if(this.infoRequest)return this.infoRequest;
      const pending=this.performCall(name,args).finally(()=>{if(this.infoRequest===pending)this.infoRequest=undefined;});
      this.infoRequest=pending;return pending;
    }
    const generation=this.generation;
    const request=this.operationQueue.then(()=>{
      if(generation!==this.generation)throw new Error('대기 중 POK 연결이 변경되었습니다.');
      return this.performCall(name,args,remaining());
    });
    this.operationQueue=request.then(()=>undefined,()=>undefined);
    if(deadline===undefined)return request;
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('POK 요청의 전체 기한이 초과되었습니다.')),Math.max(0,deadline-performance.now()));
      request.then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});
    });
  }
  // Automatic UI operations need complete values; agent-facing call() keeps
  // bounded references so large payloads are not copied into every model turn.
  private async callResult(name: string, args: Record<string, unknown>, diagnostics?: unknown[]): Promise<unknown> {
    const generation = this.generation;
    const assertSameConnection = () => {
      if (generation !== this.generation) throw new Error('결과를 읽는 도중 POK 연결이 변경되었습니다. 새 연결로 다시 계산해 주세요.');
    };
    const deadline = performance.now() + 1_800_000;
    const remainingBudget = () => {
      const remaining = deadline - performance.now();
      if (remaining <= 0) throw new Error('POK 결과의 자동 회수 시간이 초과되었습니다. 다시 계산해 주세요.');
      return remaining;
    };
    const value = await this.call(name, args, remainingBudget());
    assertSameConnection(); remainingBudget();
    if (!value || typeof value !== 'object' || !('stored_tool_result' in value) || value.stored_tool_result !== true) return value;
    const notice = value as Record<string, unknown>;
    const reference = notice.result_ref as { $pok_result?: unknown; path?: unknown } | undefined;
    const id = reference?.$pok_result;
    const expectedHash = notice.result_sha256;
    const expectedBytes = notice.result_bytes;
    const maxBytes = 64 * 1024 * 1024;
    const invalid = () => new Error('POK 저장 결과의 참조·페이지 또는 해시가 올바르지 않습니다. 다시 계산해 주세요.');
    if (typeof id !== 'string' || !/^[0-9a-f]{64}$/.test(id) || reference?.path !== '/result'
      || notice.payload_sha256 !== id || typeof expectedHash !== 'string' || !/^[0-9a-f]{64}$/.test(expectedHash)
      || typeof expectedBytes !== 'number' || !Number.isSafeInteger(expectedBytes) || expectedBytes < 0) throw invalid();
    if (expectedBytes > maxBytes) throw new Error('POK 결과가 자동 표시 한도(64 MiB)를 넘었습니다. 필요한 능력치 범위를 줄여 다시 계산해 주세요.');
    const chunks: string[] = [];
    const hash = createHash('sha256');
    let offset = 0; let total: number | undefined; let bytes = 0;
    for (let pageIndex = 0; pageIndex < 25_000; pageIndex++) {
      assertSameConnection();
      const response = await this.call('get_tool_result', { result_id: id, path: '/result', mode: 'json', offset }, remainingBudget());
      assertSameConnection(); remainingBudget();
      if (!response || typeof response !== 'object') throw invalid();
      const page = response as Record<string, unknown>;
      if (page.result_id !== id || page.payload_sha256 !== id || page.path !== '/result' || page.mode !== 'json'
        || page.offset !== offset || typeof page.total !== 'number' || !Number.isSafeInteger(page.total)
        || page.total < offset || page.total > expectedBytes || typeof page.chunk !== 'string') throw invalid();
      if (total !== undefined && total !== page.total) throw invalid();
      total = page.total;
      bytes += Buffer.byteLength(page.chunk, 'utf8');
      if (bytes > expectedBytes || bytes > maxBytes) throw invalid();
      // Python's offsets count code points. Never advance with JS string.length.
      const end = offset + Array.from(page.chunk).length;
      if (end > total || (page.next_offset === null ? end !== total : page.next_offset !== end || end <= offset || end >= total)) throw invalid();
      chunks.push(page.chunk); hash.update(page.chunk, 'utf8');
      if (page.next_offset === null) {
        if (bytes !== expectedBytes || hash.digest('hex') !== expectedHash) throw invalid();
        let decoded: unknown;
        try { decoded = JSON.parse(chunks.join('')); } catch { throw invalid(); }
        if (notice.normalization !== undefined) diagnostics?.push({
          tool: name, transport_normalization: notice.normalization, result_ref: reference
        });
        return decoded;
      }
      offset = end;
    }
    throw new Error('POK 결과의 페이지 수가 자동 회수 한도를 넘었습니다. 필요한 결과 범위를 줄여 다시 계산해 주세요.');
  }
  private async performCall(name: string, args: Record<string, unknown>, budgetMs?: number): Promise<unknown> {
    const client=this.client;const generation=this.generation;const expected=this.expectedIdentity;const deadline=budgetMs===undefined?undefined:performance.now()+budgetMs;
    if (!client) throw new Error('먼저 POK에 연결해 주세요.');
    if (!this.tools.some(t => t.name === name)) throw new Error('연결된 POK에 없는 도구입니다: ' + name);
    const sameConnection=()=>{if(client!==this.client||generation!==this.generation)throw new Error('요청 도중 POK 연결이 변경되었습니다.');};
    if (name !== 'server_info' && expected) {
      const info = await this.callResult('server_info', {}) as Record<string, unknown>;
      sameConnection();
      if (info.stale === true) throw new Error('POK 소스가 변경되었습니다. 데이터 묶음을 다시 준비해 주세요.');
      assertRuntimeIdentity(info.identity, expected);
    }
    sameConnection();
    const defaultTimeout=name==='server_info'?15_000:name==='render_pob_item'?45_000:1_800_000;
    const timeout=deadline===undefined?defaultTimeout:Math.min(defaultTimeout,deadline-performance.now());
    if(timeout<=0)throw new Error('POK 요청의 전체 기한이 초과되었습니다.');
    const infoProperties=this.tools.find(t=>t.name==='server_info')?.inputSchema.properties as Record<string,unknown>|undefined;
    const arguments_=name==='server_info'&&infoProperties&&'include_kb_diagnostics' in infoProperties?{include_kb_diagnostics:false,...args}:args;
    let response:unknown;
    try {
      response=await client.callTool({ name, arguments: arguments_ }, undefined,
        {timeout,maxTotalTimeout:timeout,resetTimeoutOnProgress:budgetMs===undefined&&timeout===1_800_000});
    } catch(error) {
      if((error as {code?:number})?.code===-32001){
        const message=`${name==='server_info'?'POK 연결 확인':name==='render_pob_item'?'아이템 생성':'POK 작업'} 응답이 ${timeout/1000}초 안에 오지 않았습니다. POK 설정에서 연결을 다시 확인해 주세요.`;
        await this.close();this.onDisconnected?.(message);throw new Error(message);
      }
      throw error;
    }
    sameConnection();
    return unwrapMcp(response);
  }
  async readDesign(reference:DesignRecordReference):Promise<DesignRecordSnapshot> {
    const generation=this.generation;
    const result=await this.callResult('read_design_record',{record_ref:reference});
    if(generation!==this.generation)throw new Error('설계 조회 도중 연결이 변경되었습니다.');
    return designSnapshotFromResult(result,reference);
  }
  async compute(build: BuildDocument, context?: ComputeContext): Promise<Calculation> {
    const generation = this.generation;
    const transportNotes: unknown[] = [];
    const runtime = await this.callResult('server_info', {}, transportNotes) as Record<string, unknown>;
    if (runtime.stale === true) throw new Error('POK 소스가 변경되었습니다. POK 설정에서 다시 연결한 뒤 계산해 주세요.');
    const assertSameConnection = () => { if (generation !== this.generation) throw new Error('계산 도중 POK 연결이 변경되었습니다. 새 연결로 다시 계산해 주세요.'); };
    assertSameConnection();
    if (context) {
      assertRuntimeIdentity(runtime.identity, context.identity);
      if (!context.identity.capabilities.computeXml) throw new Error('이 POK는 원본 XML 계산을 지원하지 않습니다.');
      let result: Record<string, unknown>;
      try {
        result = await this.callResult('compute_pob_xml', { xml: projectActiveXml(build.xml), stats: ['*'] }) as Record<string, unknown>;
      } catch (error) {
        assertSameConnection();
        if (!(error instanceof PokToolError)) throw error;
        result = { ok: false, stage: 'compute', reason: error.message, diagnostics: error.details };
      }
      assertSameConnection();
      const after = await this.call('server_info', {}) as Record<string, unknown>;
      assertSameConnection();
      if (after.stale === true) throw new Error('계산 도중 POK 소스가 변경되었습니다.');
      assertRuntimeIdentity(after.identity, context.identity);
      return { revision: build.revision, at: new Date().toISOString(), result: { ...result, pok_runtime: runtime }, restoreNotes: [],
        provenance: { buildId: build.id, revision: build.revision, xmlSha256: xmlHash(build.xml), bundleId: context.bundleId,
          pobCommit: context.identity.pob.commit, kbDigest: context.identity.kb.contentSha256, pokSourceDigest: context.identity.pok.sourceDigest, mode: 'xml' } };
    }
    let restore:Record<string,unknown>;
    try {
      restore = await this.callResult('restore_pob_spec', { build_code: encodePob(projectActiveXml(build.xml)), assume_first_stat_set: false }) as Record<string, unknown>;
    }catch(error){
      assertSameConnection();
      if(!(error instanceof PokToolError))throw error;
      restore={ok:false,reason:error.message,diagnostics:error.details};
    }
    assertSameConnection();
    const restoreNotes = [...transportNotes, ...(Array.isArray(restore.notes) ? restore.notes : []), ...(Array.isArray(restore.needs_decision) ? restore.needs_decision : []),
      ...(restore.faithful === false ? ['원본 전체를 완전히 복원하지 못한 계산입니다.'] : []),
      ...(restore.damage_comparable === false ? ['원본의 피해 수치와 직접 비교할 수 없습니다.'] : [])];
    // A domain refusal is a diagnostic result, not a transport failure. Keep the
    // original refusal and restoration notes together so the user can repair it.
    let result: Record<string, unknown>;
    if (restore.ok === false || !restore.build_spec || (Array.isArray(restore.needs_decision) && restore.needs_decision.length > 0)) {
      result = { ...restore, ok: false, stage: 'restore', reason: restore.reason || (Array.isArray(restore.needs_decision)&&restore.needs_decision.length?'계산 전에 복원 선택을 확인해 주세요.':'POK에서 계산 스펙을 복원하지 못했습니다.') };
    } else {
      try {
        result = await this.callResult('compute_pob', { build_spec: restore.build_spec, stats: ['*'] }, restoreNotes) as Record<string,unknown>;
      } catch (error) {
        assertSameConnection();
        // FastMCP exposes engine validation exceptions as isError tool results.
        // Keep these diagnostics with the successful restoration; transport
        // exceptions still reject so a lost connection is not a calculation.
        if (!(error instanceof PokToolError)) throw error;
        result = { ok: false, stage: 'compute', reason: error.message, diagnostics: error.details };
      }
    }
    assertSameConnection();
    return { revision: build.revision, at: new Date().toISOString(), result: { ...result, restoration: restore, pok_runtime: runtime },
      restoreNotes };
  }
}
