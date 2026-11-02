import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import type { ItemRenderRequest, ItemRenderResult } from '../shared/game-data';
import type { PobWorkerIdentity, WorkerCalculation, WorkerProvenance, WorkerCatalog } from '../shared/pob-worker';

export interface WorkerLaunchDescriptor {
  root: string;
  command: string;
  args: string[];
  bundleId: string;
  identity: PobWorkerIdentity;
  allowDevelopment: boolean;
}

type RecordValue = Record<string, unknown>;
interface Pending {
  method: string;
  resolve(value: RecordValue): void;
  reject(reason: Error): void;
  timer: ReturnType<typeof setTimeout>;
  expired: boolean;
}
const frameLimit = 64 * 1024 * 1024;
const record = (value: unknown): value is RecordValue => !!value && typeof value === 'object' && !Array.isArray(value);
const asciiJson = (value: unknown): string => JSON.stringify(value).replace(/[\u007f-\uffff]/g, character => '\\u' + character.charCodeAt(0).toString(16).padStart(4, '0'));
const stable = (value: RecordValue): string => '{' + Object.keys(value).sort().map(key => asciiJson(key) + ':' + asciiJson(value[key])).join(',') + '}';

export function assertWorkerIdentity(value: unknown): asserts value is PobWorkerIdentity {
  if (!record(value) || value.format !== 'pok.pob-worker-identity.v1' || value.runtime_kind !== 'pob-worker' || value.protocol !== 'pok.pob-worker.v1' || value.algorithm !== 'relative-file-bytes-and-runtime-components.v1') throw new Error('지원하지 않는 PoB worker identity입니다.');
  for (const key of ['adapter_sources_sha256', 'adapter_lua_sha256', 'pob_source_sha256', 'pob_runtime_sha256', 'lua_executable_sha256', 'python_executable_sha256', 'sha256']) if (typeof value[key] !== 'string' || !/^[0-9a-f]{64}$/.test(value[key] as string)) throw new Error('PoB worker source digest가 손상됐습니다.');
  if (typeof value.pob_commit !== 'string' || !/^[0-9a-f]{40}$/.test(value.pob_commit) || Object.values(value).some(entry => typeof entry !== 'string')) throw new Error('PoB worker identity 필드가 올바르지 않습니다.');
  for (const key of ['python_version', 'platform', 'claim', 'loaded_native_modules', 'external_system_libraries']) if (typeof value[key] !== 'string' || !value[key]) throw new Error('PoB worker 실행 출처 필드가 없습니다.');
  if (value.claim !== 'content_fingerprints_not_deployment_or_game_certification' || value.loaded_native_modules !== 'not_verified' || value.external_system_libraries !== 'not_verified') throw new Error('지원하지 않는 PoB worker 검증 범위입니다.');
  const {sha256, ...body} = value;
  if (createHash('sha256').update(stable(body)).digest('hex') !== sha256) throw new Error('PoB worker identity 해시가 일치하지 않습니다.');
}

export function assertWorkerCatalog(value: unknown, identity: PobWorkerIdentity): asserts value is WorkerCatalog {
  if (!record(value) || value.schemaVersion !== 2 || value.extractorVersion !== '2' || !record(value.source)) throw new Error('지원하지 않는 독립 PoB 카탈로그입니다.');
  const source = value.source;
  assertWorkerIdentity(source.identity);
  if (source.format !== 'pok.pob-catalog-source.v2' || source.exporterVersion !== '2' || source.identitySha256 !== identity.sha256 || source.identity.sha256 !== identity.sha256 || source.pobCommit !== identity.pob_commit) throw new Error('카탈로그와 계산 worker의 실제 출처가 다릅니다.');
  const version = /^\d{1,3}_\d{1,3}(?:_\d{1,3})?$/;
  if (typeof value.defaultTreeVersion !== 'string' || !version.test(value.defaultTreeVersion) || !Array.isArray(value.supportedTreeVersions) || value.supportedTreeVersions.some(item => typeof item !== 'string' || !version.test(item)) || !value.supportedTreeVersions.includes(value.defaultTreeVersion)) throw new Error('카탈로그 트리 버전이 올바르지 않습니다.');
  if (!Array.isArray(value.classes) || !Array.isArray(value.entries) || !Array.isArray(value.diagnostics)) throw new Error('카탈로그 항목 배열이 없습니다.');
  for (const row of value.classes) {
    if (!record(row) || typeof row.id !== 'string' || typeof row.name !== 'string' || !Number.isSafeInteger(row.internalId) || !Number.isSafeInteger(row.legacyId) || !Array.isArray(row.ascendancies) || row.ascendancies.some(asc => !record(asc) || typeof asc.id !== 'string' || typeof asc.name !== 'string' || !Number.isSafeInteger(asc.legacyId))) throw new Error('카탈로그 직업 항목이 올바르지 않습니다.');
  }
  const seen = new Set<string>();
  for (const row of value.entries) {
    if (!record(row) || !['base', 'unique', 'mod', 'gem', 'skill'].includes(String(row.type)) || typeof row.id !== 'string' || !row.id || /[\0-\x1f\x7f]/.test(row.id) || typeof row.name !== 'string' || !record(row.raw)) throw new Error('카탈로그 원시 항목이 올바르지 않습니다.');
    const key = JSON.stringify([row.type,row.id]);
    if (seen.has(key)) throw new Error('카탈로그에 같은 유형과 ID가 중복됐습니다.');
    seen.add(key);
  }
  for (const row of value.diagnostics) {
    if (!record(row)) throw new Error('카탈로그 진단 형식이 올바르지 않습니다.');
    const delegated = row.kind === 'unsupported-lua-function' && row.handling === 'delegated-to-pob' && row.severity === 'info' && typeof row.path === 'string' && (row.source === 'mods' && /^\$\.data\.AffixData\.[^.]+\.apply$/.test(row.path) || row.source === 'skills' && /^\$\.data\.[^.]+\.preDamageFunc$/.test(row.path));
    const lossless = row.kind === 'typed-map-conversion' && row.handling === 'lossless' && row.lossless === true;
    if (!delegated && !lossless) throw new Error('카탈로그에 처리되지 않은 데이터 손실 진단이 있습니다.');
  }
}

export class PobWorkerConnection {
  onDisconnected?: (message: string) => void;
  private child?: ChildProcessWithoutNullStreams;
  private generation = 0;
  private instance?: string;
  private identity?: PobWorkerIdentity;
  private pending = new Map<string, Pending>();
  private hello?: {resolve(value: RecordValue): void; reject(error: Error): void};
  private bytes = Buffer.alloc(0);
  private errors = '';
  private closing = false;
  private connecting = false;
  private fault?: string;
  private cleanupConfirmed = true;
  private exited?: Promise<void>;
  constructor(private readonly startupTimeoutMs = 180_000) {
    if (!Number.isSafeInteger(startupTimeoutMs) || startupTimeoutMs <= 0 || startupTimeoutMs > 180_000) throw new RangeError('PoB worker 시작 기한이 올바르지 않습니다.');
  }
  get connected(): boolean { return !!this.child && !!this.identity && !this.closing; }

  connect(launch: WorkerLaunchDescriptor): Promise<{identity: PobWorkerIdentity; provenance: WorkerProvenance}> {
    if (this.connecting) return Promise.reject(new Error('PoB worker 연결이 이미 진행 중입니다.'));
    this.connecting = true;
    return this.connectOwned(launch).finally(() => { this.connecting = false; });
  }

  private async connectOwned(launch: WorkerLaunchDescriptor): Promise<{identity: PobWorkerIdentity; provenance: WorkerProvenance}> {
    await this.close();
    const deadline = performance.now() + this.startupTimeoutMs;
    assertWorkerIdentity(launch.identity);
    this.closing = false; this.instance = undefined; this.bytes = Buffer.alloc(0); this.errors = ''; this.fault = undefined; this.cleanupConfirmed = true;
    const generation = ++this.generation;
    const env = {...process.env};
    for (const key of ['PYTHONHOME', 'PYTHONPATH', 'VIRTUAL_ENV', 'LUA_INIT', 'LUA_INIT_5_1']) delete env[key];
    const child = spawn(launch.command, launch.args, {cwd: launch.root, env, stdio: 'pipe', windowsHide: true, shell: false});
    this.child = child;
    this.exited = new Promise(resolve => child.once('close', () => resolve()));
    const hello = new Promise<RecordValue>((resolve, reject) => { this.hello = {resolve, reject}; });
    const helloTimer = setTimeout(() => this.hello?.reject(new Error('PoB worker 초기 통신 시간이 초과됐습니다.')), this.startupTimeoutMs);
    child.stdout.on('data', (chunk: Buffer) => { if (this.child === child && generation === this.generation) this.read(chunk); });
    child.stderr.on('data', (chunk: Buffer) => { if (this.child === child) this.errors = (this.errors + chunk.toString('utf8')).slice(-16_384); });
    child.on('error', error => this.lost(child, error.message));
    child.stdin.on('error', error => this.lost(child, error.message));
    child.on('close', code => {
      this.lost(child, 'PoB worker 종료: ' + code + (this.errors ? '\n' + this.errors : ''));
      if (this.child === child) { this.child = undefined; this.instance = undefined; this.generation++; }
    });
    try {
      const greeting = await hello;
      if (greeting.protocol !== 'pok.pob-worker.v1' || typeof greeting.worker_instance !== 'string') throw new Error('PoB worker 통신 계약이 일치하지 않습니다.');
      this.instance = greeting.worker_instance;
      this.cleanupConfirmed = false;
      const remaining = Math.floor(deadline - performance.now());
      if (remaining <= 0) throw new Error('PoB worker 시작 시간이 초과됐습니다.');
      const initialized = await this.request('initialize', {}, Math.min(120_000, remaining));
      if (!record(initialized.result) || !record(initialized.result.provenance)) throw new Error('PoB worker 초기화 결과가 없습니다.');
      const actual = initialized.result.identity;
      assertWorkerIdentity(actual);
      if (stable(actual as unknown as RecordValue) !== stable(launch.identity as unknown as RecordValue)) throw new Error('표시 데이터와 계산 worker의 실제 출처가 다릅니다.');
      const provenance = initialized.result.provenance;
      if (!launch.allowDevelopment && (provenance.mode !== 'bundled' || provenance.bundle_manifest_verified !== true)) throw new Error('검증된 독립 PoB 번들이 필요합니다.');
      if (this.child !== child || generation !== this.generation) throw new Error('초기화 중 worker가 변경됐습니다.');
      this.identity = actual;
      return {identity: actual, provenance: provenance as unknown as WorkerProvenance};
    } catch (error) {
      await this.close().catch(() => {});
      throw error;
    } finally { clearTimeout(helloTimer); this.hello = undefined; }
  }

  private read(chunk: Buffer): void {
    this.bytes = Buffer.concat([this.bytes, chunk]);
    try {
      let index: number;
      while ((index = this.bytes.indexOf(10)) >= 0) {
        const line = this.bytes.subarray(0, index); this.bytes = this.bytes.subarray(index + 1);
        if (line.length > frameLimit) throw new Error('PoB worker 응답이 한도를 초과했습니다.');
        if (!line.toString('utf8').trim()) continue;
        const value: unknown = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(line));
        if (!record(value)) throw new Error('PoB worker 응답 형식이 올바르지 않습니다.');
        if (value.event === 'closed') {
          if (value.worker_instance !== this.instance || !record(value.cleanup) || value.cleanup.confirmed !== true) throw new Error('소유 worker의 Native 정리를 확인하지 못했습니다.');
          this.cleanupConfirmed = true;
          continue;
        }
        if (this.fault) continue;
        if (value.event === 'hello' && this.hello) { this.hello.resolve(value); continue; }
        if (typeof value.id !== 'string') throw new Error('PoB worker 응답 ID가 없습니다.');
        const waiting = this.pending.get(value.id);
        if (!waiting) throw new Error('현재 요청에 속하지 않는 worker 응답입니다.');
        if ((value.ok === true && !['shutdown', 'cancel', 'runtime_info'].includes(waiting.method) && !record(value.execution)) || (record(value.execution) && value.execution.owner !== this.instance)) {
          waiting.reject(new Error('다른 worker 인스턴스의 실행 응답입니다.'));
          throw new Error('다른 worker 인스턴스의 실행 응답입니다.');
        }
        this.pending.delete(value.id); clearTimeout(waiting.timer);
        if (waiting.expired) waiting.reject(new Error('PoB worker 요청 시간이 초과됐습니다.'));
        else if (value.ok !== true) waiting.reject(new Error(record(value.error) && typeof value.error.message === 'string' ? value.error.message : 'PoB worker 요청 실패'));
        else waiting.resolve(value);
      }
      if (this.bytes.length > frameLimit) throw new Error('PoB worker 응답 프레임이 너무 큽니다.');
    } catch (error) { if (this.child) this.lost(this.child, error instanceof Error ? error.message : String(error)); }
  }

  request(method: string, params: RecordValue = {}, timeout = 180_000): Promise<RecordValue> {
    const child = this.child;
    if (!child || this.fault || this.closing && method !== 'shutdown' && method !== 'cancel') return Promise.reject(new Error('PoB worker가 연결되지 않았습니다.'));
    const id = randomUUID();
    return new Promise((resolve, reject) => {
      const waiting: Pending = {method, resolve, reject, expired: false, timer: setTimeout(() => {
        waiting.expired = true;
        reject(new Error('PoB worker 요청 시간이 초과됐습니다. 정리 응답은 별도로 기다립니다.'));
        if (method !== 'cancel' && method !== 'shutdown') void this.request('cancel', {request_id: id}, 10_000).catch(() => {});
      }, timeout)};
      this.pending.set(id, waiting);
      child.stdin.write(JSON.stringify({id, method, params, timeout_ms: Math.min(timeout, 180_000)}) + '\n', error => {
        if (error) { clearTimeout(waiting.timer); this.pending.delete(id); reject(error); }
      });
    });
  }

  async compute(xml: string, stats?: string[]): Promise<WorkerCalculation> {
    if (!this.connected) throw new Error('PoB 계산 런타임을 먼저 준비해 주세요.');
    const revision = 'sha256:' + createHash('sha256').update(xml, 'utf8').digest('hex');
    const response = await this.request('compute_xml', {xml, expected_xml_revision: revision, ...(stats ? {stats} : {})});
    const result = response.result;
    if (!record(result) || result.xml_revision !== revision || !record(result.stats)) throw new Error('계산 결과의 실제 입력이 다릅니다.');
    assertWorkerIdentity(result.identity);
    if (result.identity.sha256 !== this.identity?.sha256) throw new Error('계산 중 런타임 출처가 변경됐습니다.');
    if (!Array.isArray(result.missing_stats) || result.missing_stats.some(value => typeof value !== 'string') || !Array.isArray(result.allocated_nodes) || result.allocated_nodes.some(value => !Number.isSafeInteger(value)) || !record(result.meta) || result.claim !== 'native_calculation_not_game_validation' || Object.values(result.stats).some(value => value !== null && (typeof value !== 'number' || !Number.isFinite(value))) || !record(response.execution)) throw new Error('PoB 계산 결과 필드가 올바르지 않습니다.');
    const changes = response.wire_normalizations;
    if (changes !== undefined && (!Array.isArray(changes) || changes.some(row => !record(row) || typeof row.path !== 'string' || typeof row.value !== 'string' || row.serialized_as !== 'null'))) throw new Error('PoB 수치 정규화 진단이 올바르지 않습니다.');
    return {...result, execution:response.execution, ...(changes === undefined ? {} : {wire_normalizations:changes})} as unknown as WorkerCalculation;
  }

  async exportCatalog(): Promise<WorkerCatalog> {
    if (!this.connected || !this.identity) throw new Error('PoB 계산 런타임을 먼저 준비해 주세요.');
    const response = await this.request('export_catalog');
    if (!record(response.result)) throw new Error('PoB 카탈로그 결과가 없습니다.');
    assertWorkerIdentity(response.result.identity);
    if (response.result.identity.sha256 !== this.identity.sha256) throw new Error('카탈로그 생성 중 런타임 출처가 변경됐습니다.');
    assertWorkerCatalog(response.result.catalog, this.identity);
    return response.result.catalog;
  }

  async renderItem(request: ItemRenderRequest): Promise<ItemRenderResult> {
    if (!this.connected || !this.identity) throw new Error('PoB 계산 런타임을 먼저 준비해 주세요.');
    const response = await this.request('render_item', {...request});
    const result = response.result;
    if (!record(result) || result.ok !== true || typeof result.text !== 'string' || !result.text) throw new Error('PoB 아이템 원문 결과가 없습니다.');
    assertWorkerIdentity(result.identity);
    if (result.identity.sha256 !== this.identity.sha256) throw new Error('아이템 생성 중 런타임 출처가 변경됐습니다.');
    return {ok:true,text:result.text};
  }

  private lost(child: ChildProcessWithoutNullStreams, message: string): void {
    if (this.child !== child || this.fault) return;
    this.fault = message; this.identity = undefined;
    this.hello?.reject(new Error(message)); this.hello = undefined;
    for (const waiting of this.pending.values()) { clearTimeout(waiting.timer); waiting.reject(new Error(message)); }
    this.pending.clear();
    child.stdin.end(); // Keep ownership until process exit and native cleanup evidence.
    if (!this.closing) this.onDisconnected?.(message);
  }

  async close(): Promise<void> {
    const child = this.child;
    if (!child) {
      if (!this.cleanupConfirmed) throw new Error('이전 Native PoB 종료가 확인되지 않아 새 worker를 시작할 수 없습니다.');
      return;
    }
    this.closing = true;
    let failure: unknown;
    if (!this.fault && this.instance) {
      try {
        const response = await this.request('shutdown', {}, 20_000);
        if (!record(response.cleanup) || response.cleanup.confirmed !== true) throw new Error('Native PoB 종료를 확인하지 못했습니다.');
        this.cleanupConfirmed = true;
      } catch (error) { failure = error; }
    }
    child.stdin.end();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([this.exited, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('PoB worker 프로세스 종료 시간이 초과됐습니다.')), 20_000); })]);
    } finally { if (timer) clearTimeout(timer); }
    if (!this.cleanupConfirmed) throw new Error('이전 Native PoB 종료를 확인하지 못했습니다.');
    if (failure) throw failure;
  }
}
