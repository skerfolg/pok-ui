import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Settings, ConnectionInfo, BuildDocument, Calculation } from '../shared/contracts';
import { projectActiveXml } from '../shared/pob-document';
import { encodePob } from './pob-files';

export interface PokTool { name: string; description?: string; inputSchema: Record<string, unknown> }
export class PokToolError extends Error {
  constructor(message: string) { super(message); this.name = 'PokToolError'; }
}
export function unwrapMcp(response: unknown): unknown {
  const r = response as { isError?: boolean; structuredContent?: unknown; content?: { type: string; text?: string }[] };
  const text = r.content?.filter(c => c.type === 'text').map(c => c.text || '').join('\n') || '';
  if (r.isError) throw new PokToolError(text || 'POK 도구 오류');
  let value = r.structuredContent;
  if (value === undefined) { try { value = JSON.parse(text); } catch { value = { text }; } }
  if (value && typeof value === 'object' && Object.keys(value).length === 1 && 'result' in value) return (value as {result: unknown}).result;
  return value;
}
export class PokConnection {
  private client?: Client;
  private transport?: StdioClientTransport;
  private connectPromise?: Promise<ConnectionInfo>;
  private generation = 0;
  tools: PokTool[] = [];
  root = '';
  async close(): Promise<void> {
    this.generation++;
    const client = this.client;
    this.client = undefined; this.tools = [];
    await client?.close().catch(() => undefined);
    this.transport = undefined;
  }
  connect(settings: Settings['pok'], bundledRoot: string, dataHome?: string, cacheHome?: string): Promise<ConnectionInfo> {
    if (this.connectPromise) return this.connectPromise;
    this.connectPromise = this.open(settings, bundledRoot, dataHome, cacheHome).finally(() => { this.connectPromise = undefined; });
    return this.connectPromise;
  }
  private async open(settings: Settings['pok'], bundledRoot: string, dataHome?: string, cacheHome?: string): Promise<ConnectionInfo> {
    await this.close();
    try {
      const root = resolve(settings.mode === 'bundled' ? bundledRoot : settings.root);
      if (!settings.root && settings.mode === 'checkout') throw new Error('POK 저장소 폴더를 선택해 주세요.');
      const bundled = settings.mode === 'bundled';
      if (!bundled && (!existsSync(join(root, 'knowledge')) || !existsSync(join(root, 'src', 'pok')))) throw new Error('POK 저장소에서 knowledge와 src/pok를 찾지 못했습니다.');
      const command = bundled ? join(root, process.platform === 'win32' ? 'pok.exe' : 'pok')
        : settings.python || join(root, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
      if (!existsSync(command)) throw new Error(bundled ? '번들 POK 실행 파일이 없습니다. 개발 중에는 checkout 연결을 사용해 주세요.' : 'Python 실행 파일을 찾지 못했습니다. POK 설정에서 선택해 주세요.');
      const env = Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string,string] => entry[1] !== undefined));
      Object.assign(env, { PYTHONPATH: join(root, 'src'), PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8', POK_AUTOFILL_BUDGET_S: '1200' });
      if (bundled) {
        for (const key of ['POK_RESOURCE_ROOT','POK_POB_ROOT','POK_LUAJIT','PYTHONPATH']) delete env[key];
      } else if (settings.luajit) env.POK_LUAJIT = settings.luajit;
      if (dataHome) env.POK_DATA_HOME = dataHome;
      if (cacheHome) env.POK_CACHE_HOME = cacheHome;
      const transport = new StdioClientTransport({ command, args: bundled ? ['serve'] : ['-m','pok.mcp'], cwd: root, env, stderr: 'pipe' });
      // Drain diagnostics; a full stderr pipe must never stall the MCP process.
      transport.stderr?.on('data', () => undefined);
      const client = new Client({ name: 'pok-ui', version: '0.1.0' });
      this.transport = transport; this.client = client; this.root = root;
      await client.connect(transport, { timeout: 60_000 });
      const listed = await client.listTools();
      this.tools = listed.tools.map(t => ({name:t.name, description:t.description, inputSchema:t.inputSchema as Record<string,unknown>}));
      const info = await this.call('server_info', {});
      return { connected: true, info, tools: this.tools.map(t => t.name) };
    } catch (error) {
      await this.close();
      return { connected: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
  async call(name: string, args: Record<string, unknown>): Promise<unknown> {
    if (!this.client) throw new Error('먼저 POK에 연결해 주세요.');
    if (!this.tools.some(t => t.name === name)) throw new Error('연결된 POK에 없는 도구입니다: ' + name);
    return unwrapMcp(await this.client.callTool({ name, arguments: args }, undefined, { timeout: 1_800_000, resetTimeoutOnProgress: true }));
  }
  async compute(build: BuildDocument): Promise<Calculation> {
    const generation = this.generation;
    const runtime = await this.call('server_info', {}) as Record<string, unknown>;
    if (runtime.stale === true) throw new Error('POK 소스가 변경되었습니다. POK 설정에서 다시 연결한 뒤 계산해 주세요.');
    const assertSameConnection = () => { if (generation !== this.generation) throw new Error('계산 도중 POK 연결이 변경되었습니다. 새 연결로 다시 계산해 주세요.'); };
    assertSameConnection();
    const restore = await this.call('restore_pob_spec', { build_code: encodePob(projectActiveXml(build.xml)), assume_first_stat_set: true }) as Record<string, unknown>;
    assertSameConnection();
    const restoreNotes = [...(Array.isArray(restore.notes) ? restore.notes : []), ...(Array.isArray(restore.needs_decision) ? restore.needs_decision : []),
      ...(restore.faithful === false ? ['원본 전체를 완전히 복원하지 못한 계산입니다.'] : []),
      ...(restore.damage_comparable === false ? ['원본의 피해 수치와 직접 비교할 수 없습니다.'] : [])];
    // A domain refusal is a diagnostic result, not a transport failure. Keep the
    // original refusal and restoration notes together so the user can repair it.
    let result: Record<string, unknown>;
    if (restore.ok === false || !restore.build_spec) {
      result = { ...restore, ok: false, stage: 'restore', reason: restore.reason || 'POK에서 계산 스펙을 복원하지 못했습니다.' };
    } else {
      try {
        result = await this.call('compute_pob', { build_spec: restore.build_spec, stats: ['*'] }) as Record<string,unknown>;
      } catch (error) {
        assertSameConnection();
        // FastMCP exposes engine validation exceptions as isError tool results.
        // Keep these diagnostics with the successful restoration; transport
        // exceptions still reject so a lost connection is not a calculation.
        if (!(error instanceof PokToolError)) throw error;
        result = { ok: false, stage: 'compute', reason: error.message };
      }
    }
    assertSameConnection();
    return { revision: build.revision, at: new Date().toISOString(), result: { ...result, pok_runtime: runtime },
      restoreNotes };
  }
}
