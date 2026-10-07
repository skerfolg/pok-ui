import { mkdir, readFile, writeFile, rename, copyFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { AppState } from '../shared/contracts';
import { createDefaultState } from '../shared/state';

const MAX_BYTES = 64 * 1024 * 1024;
export function validateState(value: unknown): asserts value is AppState {
  const s = value as AppState;
  if (!s || s.schemaVersion !== 1 || !Array.isArray(s.chats) || !Array.isArray(s.builds) ||
      !s.settings || !s.settings.agent || !s.settings.pok || !s.settings.trade) {
    throw new Error('지원하지 않거나 손상된 POK 저장 형식입니다.');
  }
  if (!['codex', 'claude'].includes(s.settings.agent.provider) ||
      !['checkout', 'bundled'].includes(s.settings.pok.mode) ||
      !['system', 'dark', 'light'].includes(s.settings.theme) ||
      !['compact', 'comfortable'].includes(s.settings.density)) throw new Error('설정 형식이 올바르지 않습니다.');
  for (const value of [s.settings.agent.executable, s.settings.agent.model, s.settings.pok.root,
    s.settings.pok.python, s.settings.pok.luajit, s.settings.trade.league]) {
    if (typeof value !== 'string') throw new Error('설정 값은 문자열이어야 합니다.');
  }
  const ids = new Set<string>();
  for (const b of s.builds) {
    if (!b || typeof b.id !== 'string' || ids.has(b.id) || typeof b.name !== 'string' ||
        !Number.isSafeInteger(b.revision) || b.revision < 0 || typeof b.xml !== 'string' ||
        typeof b.originalXml !== 'string' || !Array.isArray(b.undo)) throw new Error('빌드 문서 형식이 올바르지 않습니다.');
    ids.add(b.id);
  }
  const chats = new Set<string>();
  for (const c of s.chats) {
    if (!c || typeof c.id !== 'string' || chats.has(c.id) || typeof c.title !== 'string' ||
        !Array.isArray(c.messages)) throw new Error('대화 저장 형식이 올바르지 않습니다.');
    chats.add(c.id);
    for (const m of c.messages) if (!m || typeof m.text !== 'string' ||
      !['user','assistant','system'].includes(m.role)) throw new Error('메시지 형식이 올바르지 않습니다.');
  }
}
export class StateStore {
  readonly path: string;
  readonly backupPath: string;
  recoveryMessage = '';
  private queue: Promise<void> = Promise.resolve();
  constructor(readonly directory: string, private defaults = createDefaultState) {
    this.path = join(directory, 'workspace.v1.json');
    this.backupPath = this.path + '.bak';
  }
  private async read(path: string): Promise<AppState> {
    const data = await readFile(path);
    if (data.byteLength > MAX_BYTES) throw new Error('저장 파일이 64 MB 제한을 넘습니다.');
    const result: unknown = JSON.parse(data.toString('utf8'));
    validateState(result);
    return result;
  }
  async load(): Promise<AppState> {
    await this.queue;
    await mkdir(this.directory, { recursive: true });
    try { return await this.read(this.path); }
    catch (error) {
      const absent = (error as NodeJS.ErrnoException).code === 'ENOENT';
      if (absent) {
        try { await access(this.backupPath); } catch { return this.defaults(); }
      }
      // Never overwrite a damaged primary before recovering or preserving it.
      if (!absent) await copyFile(this.path, join(this.directory, 'workspace.corrupt-' + Date.now() + '.json'));
      try {
        const recovered = await this.read(this.backupPath);
        this.recoveryMessage = '저장 파일 오류로 마지막 정상 백업을 불러왔습니다. 손상 파일은 데이터 폴더에 보존했습니다.';
        await this.write(recovered, false);
        return recovered;
      } catch (backupError) {
        throw new Error('저장 파일과 백업을 읽지 못했습니다. 데이터 폴더의 파일을 보존했습니다. ' + String(backupError));
      }
    }
  }
  save(state: AppState): Promise<void> {
    validateState(state);
    const snapshot = JSON.parse(JSON.stringify(state)) as AppState;
    const next = this.queue.then(() => this.write(snapshot, true));
    this.queue = next.catch(() => undefined);
    return next;
  }
  async flush(): Promise<void> { await this.queue; }
  private async write(state: AppState, backup: boolean): Promise<void> {
    await mkdir(this.directory, { recursive: true });
    const json = JSON.stringify(state, null, 2);
    if (Buffer.byteLength(json) > MAX_BYTES) throw new Error('저장 내용이 64 MB 제한을 넘습니다.');
    const temporary = this.path + '.' + randomUUID() + '.tmp';
    // flush=true syncs before rename, so a crash cannot leave half a JSON document.
    await writeFile(temporary, json, { encoding: 'utf8', flush: true, mode: 0o600 });
    if (backup) {
      try { await this.read(this.path); await copyFile(this.path, this.backupPath); }
      catch (e) { if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e; }
    }
    await rename(temporary, this.path);
  }
}
