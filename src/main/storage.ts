import {buildInputVersion,sameBuildInputVersion} from '../shared/build-revision';
import { assertLocalDesignIntegrity } from './design-records';
import { assertInputSnapshot } from '../shared/build-revision';
import { mkdir, readFile, writeFile, rename, copyFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { AppState } from '../shared/contracts';
import { createDefaultState, upgradeWorkspace } from '../shared/state';

export class UnsupportedWorkspaceVersion extends Error {}
const MAX_BYTES = 64 * 1024 * 1024;
export function validateState(value: unknown): asserts value is AppState {
  const s = value as AppState;
  if(s && typeof s==='object' && 'schemaVersion' in s && s.schemaVersion!==1 && s.schemaVersion!==2)throw new UnsupportedWorkspaceVersion('지원하지 않는 POK 저장 버전입니다. 원본을 보존했습니다.');
  if (!s || ![1,2].includes(s.schemaVersion) || !Array.isArray(s.chats) || !Array.isArray(s.builds) ||
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
  if(s.settings.agent.reasoningEffort!==undefined&&typeof s.settings.agent.reasoningEffort!=='string')throw new Error('추론 수준 설정이 올바르지 않습니다.');
  const ids = new Set<string>();
  for (const b of s.builds) {
    if (!b || typeof b.id !== 'string' || ids.has(b.id) || typeof b.name !== 'string' ||
        !Number.isSafeInteger(b.revision) || b.revision < 0 || typeof b.xml !== 'string' ||
        typeof b.originalXml !== 'string' || !Array.isArray(b.undo)) throw new Error('빌드 문서 형식이 올바르지 않습니다.');
    if(s.schemaVersion===1&&(b.design!==undefined||b.acquisitionMetadataJson!==undefined||b.documentSchemaVersion!==undefined))throw new Error('v1에 v2 입력을 저장할 수 없습니다.');
    if(s.schemaVersion===2){
      if(b.documentSchemaVersion!==2)throw new Error('v2 빌드 문서 버전이 필요합니다.');
      assertInputSnapshot(b);if(b.design)assertLocalDesignIntegrity(b.design);
    }
    for(const previous of b.undo){
      if(!previous||typeof previous.xml!=='string'||typeof previous.label!=='string')throw new Error('되돌리기 입력이 올바르지 않습니다.');
      if(s.schemaVersion===2){assertInputSnapshot(previous);if(previous.design)assertLocalDesignIntegrity(previous.design);}
      else if(previous.design!==undefined||previous.acquisitionMetadataJson!==undefined)throw new Error('v1 되돌리기에 v2 입력이 있습니다.');
    }
    ids.add(b.id);
  }
  const chats = new Set<string>();
  for (const c of s.chats) {
    if (!c || typeof c.id !== 'string' || chats.has(c.id) || typeof c.title !== 'string' ||
        !Array.isArray(c.messages)) throw new Error('대화 저장 형식이 올바르지 않습니다.');
    chats.add(c.id);
    for (const m of c.messages) {
      if (!m || typeof m.text !== 'string' || !['user','assistant','system'].includes(m.role)) throw new Error('메시지 형식이 올바르지 않습니다.');
      if(m.images!==undefined&&(!Array.isArray(m.images)||m.images.length>4||m.images.some(image=>!image||!/^[a-f0-9]{64}$/.test(image.id)||typeof image.name!=='string'||typeof image.mimeType!=='string'||!Number.isSafeInteger(image.size)||image.size<1||image.size>4*1024*1024)))throw new Error('이미지 첨부 정보가 올바르지 않습니다.');
      if(m.completedAt!==undefined&&(typeof m.completedAt!=='string'||!Number.isFinite(Date.parse(m.completedAt))))throw new Error('응답 완료 시각이 올바르지 않습니다.');
      if(m.durationMs!==undefined&&(!Number.isFinite(m.durationMs)||m.durationMs<0))throw new Error('응답 소요 시간이 올바르지 않습니다.');
    }
  }
}
export function migrateWorkspace(state:AppState):AppState {
  validateState(state);
  const result=upgradeWorkspace(state);
  validateState(result);
  return result;
}
export class StateStore {
  readonly path: string;
  readonly backupPath: string;
  recoveryMessage = '';
  private queue: Promise<void> = Promise.resolve();
  constructor(readonly directory: string, private defaults = createDefaultState) {
    this.path = join(directory, 'workspace.v2.json');
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
    try { const current=await this.read(this.path);if(current.schemaVersion!==2)throw new UnsupportedWorkspaceVersion('v2 경로의 저장 버전이 다릅니다.');return current; }
    catch (error) {
      if(error instanceof UnsupportedWorkspaceVersion)throw error;
      const absent = (error as NodeJS.ErrnoException).code === 'ENOENT';
      if (absent) {
        try { await access(this.backupPath); } catch (backupAccessError) {
          if((backupAccessError as NodeJS.ErrnoException).code!=='ENOENT')throw backupAccessError;
          const legacy=new StateStore(this.directory,this.defaults);
          // Read-only legacy recovery: never rewrite or rotate v1 files.
          const legacyPath=join(this.directory,'workspace.v1.json');
          let imported:AppState;
          try { imported=await legacy.read(legacyPath); }
          catch(legacyError){
            if(legacyError instanceof UnsupportedWorkspaceVersion)throw legacyError;
            if((legacyError as NodeJS.ErrnoException).code==='ENOENT'){
              try{imported=await legacy.read(legacyPath+'.bak');}
              catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return this.defaults();throw e;}
            }else{imported=await legacy.read(legacyPath+'.bak');}
          }
          if(imported.schemaVersion!==1)throw new UnsupportedWorkspaceVersion('v1 경로의 저장 버전이 다릅니다.');
          const migrated=migrateWorkspace(imported);
          await this.write(migrated,false);
          this.recoveryMessage='기존 v1 파일과 백업을 보존하고 v2 작업 공간으로 가져왔습니다.';
          return migrated;
        }
      }
      // Never overwrite a damaged primary before recovering or preserving it.
      if (!absent) await copyFile(this.path, join(this.directory, 'workspace.corrupt-' + Date.now() + '.json'));
      try {
        const recovered = await this.read(this.backupPath);
        if(recovered.schemaVersion!==2)throw new UnsupportedWorkspaceVersion('v2 백업의 저장 버전이 다릅니다.');
        this.recoveryMessage = '저장 파일 오류로 마지막 정상 백업을 불러왔습니다. 손상 파일은 데이터 폴더에 보존했습니다.';
        await this.write(recovered, false);
        return recovered;
      } catch (backupError) {
        throw new Error('저장 파일과 백업을 읽지 못했습니다. 데이터 폴더의 파일을 보존했습니다. ' + String(backupError));
      }
    }
  }
  save(state: AppState): Promise<void> {
    const snapshot = migrateWorkspace(state);
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

export async function assertWorkspaceTransition(current:AppState,incoming:AppState,expected:Record<string,string>):Promise<void>{
 if(!expected||typeof expected!=='object'||Array.isArray(expected)||Object.values(expected).some(value=>typeof value!=='string'||!(/^[a-f0-9]{64}$/).test(value)))throw new Error('저장 기준 입력 식별값이 필요합니다.');
 const before=new Map(current.builds.map(build=>[build.id,build])),after=new Map(incoming.builds.map(build=>[build.id,build]));
 for(const id of new Set([...before.keys(),...after.keys()])){
  const old=before.get(id),next=after.get(id);
  if(old&&next&&sameBuildInputVersion(old,next))continue;
  if(old&&next&&next.revision<=old.revision)throw new Error('저장할 입력의 리비전이 현재 문서보다 새롭지 않습니다.');
  const wanted=Object.hasOwn(expected,id)?expected[id]:undefined;
  if(old?await buildInputVersion(old)!==wanted:wanted!==undefined)throw new Error('저장 기준 빌드 입력이 변경되었습니다. 최신 문서를 다시 불러오세요.');
 }
}
export class WorkspaceMutations {
 private queue:Promise<void>=Promise.resolve();
 run<T>(operation:()=>Promise<T>):Promise<T>{
  const next=this.queue.then(operation);this.queue=next.then(()=>undefined,()=>undefined);return next;
 }
}
