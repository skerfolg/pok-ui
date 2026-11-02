import { sha256File } from '../../scripts/file-integrity.mjs';
import { lstat, readFile, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import type { PassiveTreeData } from '../shared/passive-tree';
import type {
  CatalogEntry,
  CatalogEntryType,
  CatalogExport,
  CatalogQuery,
  CatalogQueryResult,
  DataBundleInfo,
  EngineVerification,
  RuntimeMode,
  RuntimeIdentity
} from '../shared/game-data';
import { PassiveTreeStore } from './passive-tree';

export class GameDataError extends Error {
  constructor(message: string, readonly status = 400) { super(message); this.name = 'GameDataError'; }
}

interface BundleFile { path: string; size: number; sha256: string }
interface BundleManifest {
  schemaVersion: 1;
  apiVersion: 1;
  bundleId: string;
  identity: RuntimeIdentity;
  pok?: RuntimeIdentity['pok'];
  pob?: RuntimeIdentity['pob'];
  kb?: RuntimeIdentity['kb'];
  capabilities?: RuntimeIdentity['capabilities'];
  runtime: { mode?: RuntimeMode; path: string; manifest: string };
  catalog: { path: string; sha256?: string; digest?: string; schemaVersion: 1; extractorVersion: '1' };
  trees: { path: string; sha256: string; defaultVersion: string; supportedVersions: string[] };
  files: BundleFile[];
}

interface LoadedCatalog { catalog: CatalogExport; byType: Map<CatalogEntryType, Map<string, CatalogEntry>> }
interface RuntimeManifest {
  format_version: 1;
  version: string;
  platform: string;
  pob_commit: string;
  entrypoint: string[];
  identity: RuntimeIdentity;
  sha256: Record<string, string>;
}

export interface GameDataStoreOptions {
  allowCheckout?: boolean;
}

export interface GameDataLaunchDescriptor {
  root: string;
  command: string;
  args: string[];
  identity: RuntimeIdentity;
  bundleId: string;
}

const versionPattern = /^\d{1,3}_\d{1,3}(?:_\d{1,3})?$/;
const bundlePattern = /^pokbundle-[0-9a-f]{16,64}$/;
const digestPattern = /^[0-9a-f]{64}$/;
const idPattern = /^[^\0-\x1F\x7F]{1,180}$/u;
const entryTypes = new Set<CatalogEntryType>(['base', 'unique', 'mod', 'gem', 'skill']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  if (isRecord(value)) return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + stable(value[key])).join(',') + '}';
  return JSON.stringify(value);
}

function sha256Bytes(value: Uint8Array | string): string {
  return createHash('sha256').update(value).digest('hex');
}

function normalizeText(value: string): string {
  return value.trim().toLocaleLowerCase('en-US');
}

function assertDigest(value: unknown, name: string): asserts value is string {
  if (typeof value !== 'string' || !digestPattern.test(value)) throw new GameDataError(`${name} SHA-256 형식이 올바르지 않습니다.`);
}

function assertVersion(value: unknown, name: string): asserts value is string {
  if (typeof value !== 'string' || !versionPattern.test(value)) throw new GameDataError(`${name} 형식이 올바르지 않습니다.`);
}

function assertRelativePath(value: unknown, name: string): asserts value is string {
  if (typeof value !== 'string' || value.length > 240 || value.includes('\0') || isAbsolute(value) || value.split(/[\\/]/).some(part => !part || part === '.' || part === '..')) {
    throw new GameDataError(`${name} 경로는 번들 내부 상대 경로여야 합니다.`);
  }
}

function assertIdentity(value: unknown): asserts value is RuntimeIdentity {
  if (!isRecord(value) || value.apiVersion !== 1 || !isRecord(value.pok) || !isRecord(value.pob) || !isRecord(value.kb) || !isRecord(value.capabilities)) {
    throw new GameDataError('POK identity 형식이 올바르지 않습니다.');
  }
  for (const [label, text] of [['pok.version', value.pok.version], ['pok.sourceCommit', value.pok.sourceCommit], ['pob.commit', value.pob.commit], ['kb.patch', value.kb.patch]]) {
    if (typeof text !== 'string' || !text) throw new GameDataError(`${label} 값이 없습니다.`);
  }
  assertDigest(value.pok.sourceDigest, 'pok.sourceDigest');
  assertDigest(value.pob.sourceDigest, 'pob.sourceDigest');
  assertDigest(value.kb.manifestSha256, 'kb.manifestSha256');
  assertDigest(value.kb.contentSha256, 'kb.contentSha256');
  for (const key of ['computeXml', 'renderItem', 'catalogExport']) if (typeof value.capabilities[key] !== 'boolean') throw new GameDataError(`capabilities.${key} 값이 올바르지 않습니다.`);
}

function normalizeIdentity(value: Record<string, unknown>): RuntimeIdentity {
  if (isRecord(value.identity)) {
    assertIdentity(value.identity);
    return value.identity;
  }
  const identity = {
    apiVersion: 1,
    pok: value.pok,
    pob: value.pob,
    kb: value.kb,
    capabilities: value.capabilities
  };
  assertIdentity(identity);
  return identity;
}

function catalogDigest(manifest: BundleManifest): string {
  return manifest.catalog.sha256 ?? manifest.catalog.digest ?? '';
}

function diagnosticText(value: unknown): string {
  return typeof value === 'string' ? value : isRecord(value) ? String(value.code ?? value.kind ?? value.type ?? '') : '';
}

function diagnosticPath(value: unknown): string {
  if (!isRecord(value)) return '';
  const path = value.path ?? value.key ?? value.location;
  return Array.isArray(path) ? path.join('.') : typeof path === 'string' ? path : '';
}

function isAllowedCatalogDiagnostic(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const code = diagnosticText(value);
  const path = diagnosticPath(value);
  const source = typeof value.source === 'string' ? value.source : '';
  const handling = value.handling ?? value.resolution ?? value.mode;
  if (code === 'unsupported-lua-function') {
    return handling === 'delegated-to-pob' && ((source === 'mods' && /^(?:\$\.data\.)?AffixData\.[^.]+\.apply$/.test(path)) || (source === 'skills' && /^\$\.data\.[^.]+\.preDamageFunc$/.test(path)));
  }
  if (code === 'typed-map-conversion') return value.lossless === true || handling === 'lossless';
  return false;
}

function assertCatalogDiagnostics(diagnostics: unknown[]): void {
  for (const diagnostic of diagnostics) {
    const code = diagnosticText(diagnostic);
    if (isAllowedCatalogDiagnostic(diagnostic)) continue;
    if (/loss|cycle|nonfinite|error|unsupported|function/i.test(code) || isRecord(diagnostic)) {
      throw new GameDataError('카탈로그 export 진단에 처리되지 않은 손실 또는 위임되지 않은 항목이 있습니다.');
    }
  }
}

export function compareIdentity(expected: RuntimeIdentity, actual: unknown): string | undefined {
  if (!isRecord(actual)) return '엔진 identity가 없습니다.';
  const identity = isRecord(actual.identity) ? actual.identity : actual;
  if (!isRecord(identity)) return '엔진 identity 형식이 올바르지 않습니다.';
  try { assertIdentity(identity); } catch (error) { return error instanceof Error ? error.message : String(error); }
  const current = identity as RuntimeIdentity;
  if (current.apiVersion !== expected.apiVersion) return '엔진 API 버전이 번들과 다릅니다.';
  if (current.pok.version !== expected.pok.version || current.pok.sourceCommit !== expected.pok.sourceCommit || current.pok.sourceDigest !== expected.pok.sourceDigest) return '엔진 POK 버전이 번들과 다릅니다.';
  if (current.pob.commit !== expected.pob.commit || current.pob.sourceDigest !== expected.pob.sourceDigest) return '엔진 PoB 원본이 번들과 다릅니다.';
  if (current.kb.manifestSha256 !== expected.kb.manifestSha256 || current.kb.contentSha256 !== expected.kb.contentSha256 || current.kb.patch !== expected.kb.patch) return '엔진 KB가 번들과 다릅니다.';
  if (current.capabilities.computeXml !== expected.capabilities.computeXml || current.capabilities.renderItem !== expected.capabilities.renderItem || current.capabilities.catalogExport !== expected.capabilities.catalogExport) return '엔진 기능 계약이 번들과 다릅니다.';
  return undefined;
}

export class GameDataStore {
  private readonly root: string;
  private readonly allowCheckout: boolean;
  private manifest?: Promise<BundleManifest>;
  private catalog?: Promise<LoadedCatalog>;
  private treeStore?: PassiveTreeStore;

  constructor(root: string, options: GameDataStoreOptions = {}) { this.root = resolve(root); this.allowCheckout = options.allowCheckout === true; }

  async getInfo(): Promise<DataBundleInfo> {
    try {
      const manifest = await this.loadManifest();
      const catalog = await this.loadCatalog();
      return {
        status: 'ready',
        bundleId: manifest.bundleId,
        runtimeMode: this.runtimeMode(manifest),
        identity: manifest.identity,
        defaultTreeVersion: manifest.trees.defaultVersion,
        supportedTreeVersions: [...manifest.trees.supportedVersions],
        classes: catalog.catalog.classes,
        catalog: {
          schemaVersion: catalog.catalog.schemaVersion,
          extractorVersion: catalog.catalog.extractorVersion,
          entries: catalog.catalog.entries.length,
          classes: catalog.catalog.classes.length,
          digest: catalogDigest(manifest),
          diagnostics: catalog.catalog.diagnostics.length
        }
      };
    } catch (error) {
      const missing = (error as NodeJS.ErrnoException)?.code === 'ENOENT';
      return {
        status: missing ? 'missing' : 'corrupt',
        error: missing ? '게임 데이터 묶음이 준비되지 않았습니다.' : '게임 데이터 묶음이 손상되었거나 현재 POK 런타임과 일치하지 않습니다.'
      };
    }
  }

  async query(request: CatalogQuery): Promise<CatalogQueryResult> {
    const manifest = await this.loadManifest();
    const loaded = await this.loadCatalog();
    const limit = Math.max(1, Math.min(100, Number.isInteger(request.limit) ? Number(request.limit) : 50));
    const offset = Math.max(0, Math.min(1_000_000, Number.isInteger(request.offset) ? Number(request.offset) : 0));
    const type = request.type;
    if (type !== undefined && !entryTypes.has(type)) throw new GameDataError('지원하지 않는 카탈로그 유형입니다.');
    const query = request.query ? normalizeText(request.query) : '';
    const category = request.category ? normalizeText(request.category) : '';
    const entries = loaded.catalog.entries.filter(entry => {
      if (type && entry.type !== type) return false;
      if (category && normalizeText(entry.category ?? '') !== category) return false;
      if (!query) return true;
      return normalizeText([entry.name, entry.id, entry.category, entry.subType, entry.gemId, entry.gameId].filter(Boolean).join(' ')).includes(query);
    });
    return { total: entries.length, offset, limit, entries: entries.slice(offset, offset + limit) };
  }

  async getEntry(type: CatalogEntryType, id: string): Promise<CatalogEntry> {
    if (!entryTypes.has(type) || typeof id !== 'string' || !idPattern.test(id)) throw new GameDataError('카탈로그 항목 식별자가 올바르지 않습니다.');
    const entry = (await this.loadCatalog()).byType.get(type)?.get(id);
    if (!entry) throw new GameDataError('카탈로그 항목을 찾지 못했습니다.', 404);
    return entry;
  }

  async loadTree(version: string): Promise<PassiveTreeData> {
    const manifest = await this.loadManifest();
    assertVersion(version, '패시브 트리 버전');
    if (!manifest.trees.supportedVersions.includes(version)) throw new GameDataError(`이 번들은 패시브 트리 ${version} 데이터를 지원하지 않습니다.`, 404);
    return this.getTreeStore(manifest).load(version);
  }

  async asset(url: string): Promise<{ body: Uint8Array<ArrayBuffer>; mime: string }> {
    const manifest = await this.loadManifest();
    return this.getTreeStore(manifest).asset(url);
  }

  async verifyEngine(actual: unknown): Promise<EngineVerification> {
    const expected = (await this.loadManifest()).identity;
    const reason = compareIdentity(expected, actual);
    return { ok: !reason, ...(reason ? { reason, actual } : { actual }), expected };
  }

  async getLaunchDescriptor(): Promise<GameDataLaunchDescriptor> {
    const manifest = await this.loadManifest();
    if (this.runtimeMode(manifest) === 'checkout') throw new GameDataError('개발용 checkout 데이터 묶음은 실행 descriptor를 제공하지 않습니다.');
    await this.verifyBundleFiles(manifest);
    const runtime = await this.readRuntimeManifest(manifest);
    this.verifyRuntimeAnchors(manifest, runtime);
    const command = await this.safePath(join(manifest.runtime.path, runtime.entrypoint[0]).replace(/\\/g, '/'));
    return { root: await this.safePath(manifest.runtime.path), command, args: runtime.entrypoint.slice(1), identity: manifest.identity, bundleId: manifest.bundleId };
  }

  private getTreeStore(manifest: BundleManifest): PassiveTreeStore {
    if (!this.treeStore) this.treeStore = new PassiveTreeStore(join(this.root, manifest.trees.path), { bundleId: manifest.bundleId, expectedCommit: manifest.identity.pob.commit });
    return this.treeStore;
  }

  private loadManifest(): Promise<BundleManifest> {
    if (!this.manifest) this.manifest = this.readManifest().catch(error => { this.manifest = undefined; throw error; });
    return this.manifest;
  }

  private async readManifest(): Promise<BundleManifest> {
    const manifestPath = await this.safePath('bundle-manifest.json');
    const raw = await this.readJsonFile(manifestPath, 4 * 1024 * 1024);
    if (!isRecord(raw) || raw.schemaVersion !== 1 || raw.apiVersion !== 1 || typeof raw.bundleId !== 'string' || !bundlePattern.test(raw.bundleId)) throw new GameDataError('bundle-manifest.json 형식이 올바르지 않습니다.');
    const identity = normalizeIdentity(raw);
    const candidate = { ...raw, identity } as unknown as BundleManifest;
    if (!isRecord(candidate.runtime) || !isRecord(candidate.catalog) || !isRecord(candidate.trees) || !Array.isArray(candidate.files)) throw new GameDataError('bundle-manifest.json 구성 요소가 부족합니다.');
    const mode = this.runtimeMode(candidate);
    if (mode === 'checkout' && !this.allowCheckout) throw new GameDataError('개발용 checkout 데이터 묶음은 이 실행 모드에서 허용되지 않습니다.');
    assertRelativePath(candidate.runtime.path, 'runtime.path');
    assertRelativePath(candidate.runtime.manifest, 'runtime.manifest');
    assertRelativePath(candidate.catalog.path, 'catalog.path');
    assertDigest(catalogDigest(candidate), 'catalog.digest');
    if (candidate.catalog.schemaVersion !== 1 || candidate.catalog.extractorVersion !== '1') throw new GameDataError('카탈로그 계약 버전이 올바르지 않습니다.');
    assertRelativePath(candidate.trees.path, 'trees.path');
    assertDigest(candidate.trees.sha256, 'trees.sha256');
    assertVersion(candidate.trees.defaultVersion, 'trees.defaultVersion');
    if (!Array.isArray(candidate.trees.supportedVersions) || !candidate.trees.supportedVersions.length) throw new GameDataError('지원 트리 버전이 없습니다.');
    for (const version of candidate.trees.supportedVersions) assertVersion(version, 'trees.supportedVersions');
    if (!candidate.trees.supportedVersions.includes(candidate.trees.defaultVersion)) throw new GameDataError('기본 트리 버전이 지원 목록에 없습니다.');
    for (const file of candidate.files) {
      if (!isRecord(file)) throw new GameDataError('번들 파일 목록 형식이 올바르지 않습니다.');
      assertRelativePath(file.path, 'files.path');
      assertDigest(file.sha256, 'files.sha256');
      if (!Number.isInteger(file.size) || file.size < 0 || file.size > 2 * 1024 * 1024 * 1024) throw new GameDataError('files.size 값이 올바르지 않습니다.');
    }
    const computed = 'pokbundle-' + sha256Bytes(stable({ ...candidate, bundleId: undefined })).slice(0, 32);
    const legacyComputed = 'pokbundle-' + sha256Bytes(stable({ ...raw, bundleId: undefined })).slice(0, 32);
    if (candidate.bundleId !== computed && candidate.bundleId !== legacyComputed) throw new GameDataError('번들 식별자가 manifest 내용과 일치하지 않습니다.');
    await this.verifyBundleFiles(candidate);
    if (mode === 'checkout') {
      await this.readCheckoutIdentity(candidate);
      this.verifyCheckoutAnchors(candidate);
    } else {
      const runtime = await this.readRuntimeManifest(candidate);
      this.verifyRuntimeAnchors(candidate, runtime);
    }
    return candidate;
  }

  private loadCatalog(): Promise<LoadedCatalog> {
    if (!this.catalog) this.catalog = this.readCatalog().catch(error => { this.catalog = undefined; throw error; });
    return this.catalog;
  }

  private async readCatalog(): Promise<LoadedCatalog> {
    const manifest = await this.loadManifest();
    const path = await this.safePath(manifest.catalog.path);
    const rawText = await readFile(path, 'utf8');
    if (sha256Bytes(rawText) !== catalogDigest(manifest)) throw new GameDataError('카탈로그 파일 해시가 manifest와 다릅니다.');
    const raw = JSON.parse(rawText) as unknown;
    this.validateCatalog(raw, manifest);
    const catalog = raw as CatalogExport;
    const byType = new Map<CatalogEntryType, Map<string, CatalogEntry>>();
    for (const entry of catalog.entries) {
      let typed = byType.get(entry.type);
      if (!typed) { typed = new Map(); byType.set(entry.type, typed); }
      if (typed.has(entry.id)) throw new GameDataError(`중복 카탈로그 항목입니다: ${entry.type}:${entry.id}`);
      typed.set(entry.id, entry);
    }
    return { catalog, byType };
  }

  private validateCatalog(raw: unknown, manifest: BundleManifest): asserts raw is CatalogExport {
    if (!isRecord(raw) || !isRecord(raw.source) || raw.schemaVersion !== 1 || raw.extractorVersion !== '1' || raw.source.pobCommit !== manifest.identity.pob.commit ||
      !Array.isArray(raw.supportedTreeVersions) || !Array.isArray(raw.classes) || !Array.isArray(raw.entries) || !Array.isArray(raw.diagnostics)) throw new GameDataError('카탈로그 형식 또는 출처가 올바르지 않습니다.');
    if (raw.source.exporterVersion !== '1' || raw.source.pokSourceDigest !== manifest.identity.pok.sourceDigest ||
      raw.source.pobSourceDigest !== manifest.identity.pob.sourceDigest || raw.source.kbManifestSha256 !== manifest.identity.kb.manifestSha256 ||
      raw.source.kbContentSha256 !== manifest.identity.kb.contentSha256) throw new GameDataError('카탈로그 출처가 POK 런타임 identity와 다릅니다.');
    assertCatalogDiagnostics(raw.diagnostics);
    assertVersion(raw.defaultTreeVersion, 'catalog.defaultTreeVersion');
    for (const version of raw.supportedTreeVersions) assertVersion(version, 'catalog.supportedTreeVersions');
    if (raw.defaultTreeVersion !== manifest.trees.defaultVersion || stable(raw.supportedTreeVersions) !== stable(manifest.trees.supportedVersions)) throw new GameDataError('카탈로그 트리 버전이 번들 manifest와 다릅니다.');
    for (const klass of raw.classes) {
      if (!isRecord(klass) || typeof klass.id !== 'string' || typeof klass.name !== 'string' || !Number.isInteger(klass.internalId) || !Number.isInteger(klass.legacyId) || !Array.isArray(klass.ascendancies)) throw new GameDataError('직업 카탈로그 형식이 올바르지 않습니다.');
    }
    for (const entry of raw.entries) {
      if (!isRecord(entry) || typeof entry.id !== 'string' || !idPattern.test(entry.id) || !entryTypes.has(entry.type as CatalogEntryType) || typeof entry.name !== 'string' || !isRecord(entry.raw)) throw new GameDataError('카탈로그 항목 형식이 올바르지 않습니다.');
    }
  }

  private async verifyBundleFiles(manifest: BundleManifest): Promise<void> {
    const seen = new Set<string>();
    for (const file of manifest.files) {
      const path = await this.safePath(file.path);
      if (seen.has(path)) throw new GameDataError('번들 파일 목록에 중복 경로가 있습니다.');
      seen.add(path);
      const info = await lstat(path);
      if (!info.isFile() || info.size !== file.size) throw new GameDataError(`번들 파일 크기가 manifest와 다릅니다: ${file.path}`);
      const digest = await sha256File(path);
      if (digest !== file.sha256) throw new GameDataError(`번들 파일 해시가 manifest와 다릅니다: ${file.path}`);
    }
  }

  private async readRuntimeManifest(manifest: BundleManifest): Promise<RuntimeManifest> {
    const path = await this.safePath(manifest.runtime.manifest);
    const raw = await this.readJsonFile(path, 4 * 1024 * 1024);
    if (!isRecord(raw) || raw.format_version !== 1 || typeof raw.version !== 'string' || typeof raw.platform !== 'string' ||
      typeof raw.pob_commit !== 'string' || !Array.isArray(raw.entrypoint) || !raw.entrypoint.length || !isRecord(raw.sha256)) {
      throw new GameDataError('POK runtime manifest 형식이 올바르지 않습니다.');
    }
    for (const part of raw.entrypoint) if (typeof part !== 'string' || !part) throw new GameDataError('POK runtime entrypoint 형식이 올바르지 않습니다.');
    assertRelativePath(raw.entrypoint[0], 'runtime.entrypoint[0]');
    assertIdentity(raw.identity);
    const runtime = raw as unknown as RuntimeManifest;
    const reason = compareIdentity(manifest.identity, runtime.identity);
    if (reason) throw new GameDataError(reason);
    if (runtime.pob_commit !== manifest.identity.pob.commit) throw new GameDataError('POK runtime PoB commit이 bundle identity와 다릅니다.');
    for (const [file, digest] of Object.entries(runtime.sha256)) {
      assertRelativePath(file, `runtime.sha256.${file}`);
      assertDigest(digest, `runtime.sha256.${file}`);
    }
    return runtime;
  }

  private async readCheckoutIdentity(manifest: BundleManifest): Promise<RuntimeIdentity> {
    const raw = await this.readJsonFile(await this.safePath(manifest.runtime.manifest), 4 * 1024 * 1024);
    const identity = isRecord(raw) && isRecord(raw.identity) ? raw.identity : raw;
    assertIdentity(identity);
    const reason = compareIdentity(manifest.identity, identity);
    if (reason) throw new GameDataError(reason);
    return identity as RuntimeIdentity;
  }

  private runtimeMode(manifest: BundleManifest): RuntimeMode {
    const mode = manifest.runtime?.mode ?? 'bundled';
    if (mode !== 'bundled' && mode !== 'checkout') throw new GameDataError('runtime.mode 값이 올바르지 않습니다.');
    return mode;
  }

  private verifyCheckoutAnchors(manifest: BundleManifest): void {
    const files = new Set(manifest.files.map(file => file.path));
    for (const path of [manifest.runtime.manifest, manifest.catalog.path]) {
      if (!files.has(path)) throw new GameDataError(`번들 파일 목록에 필수 파일이 없습니다: ${path}`);
    }
  }

  private verifyRuntimeAnchors(manifest: BundleManifest, runtime: RuntimeManifest): void {
    const files = new Set(manifest.files.map(file => file.path));
    const required = [manifest.runtime.manifest, manifest.catalog.path, `${manifest.runtime.path}/${runtime.entrypoint[0]}`.replace(/\\/g, '/')];
    for (const path of required) if (!files.has(path)) throw new GameDataError(`번들 파일 목록에 필수 파일이 없습니다: ${path}`);
    for (const path of Object.keys(runtime.sha256)) {
      const bundled = `${manifest.runtime.path}/${path}`.replace(/\\/g, '/');
      if (!files.has(bundled)) throw new GameDataError(`번들 파일 목록에 runtime manifest 파일이 없습니다: ${bundled}`);
    }
  }

  private async readJsonFile(path: string, limit: number): Promise<unknown> {
    const info = await lstat(path);
    if (!info.isFile() || info.size > limit) throw new GameDataError('번들 manifest 크기가 제한을 초과했습니다.');
    try { return JSON.parse(await readFile(path, 'utf8')); }
    catch (error) { if (error instanceof SyntaxError) throw new GameDataError('번들 manifest JSON이 손상되었습니다.'); throw error; }
  }

  private async safePath(relativePath: string): Promise<string> {
    assertRelativePath(relativePath, 'bundle');
    const path = join(this.root, relativePath);
    const root = await realpath(this.root);
    for (let current = path; ; current = dirname(current)) {
      const info = await lstat(current);
      if (info.isSymbolicLink()) throw new GameDataError('번들 리소스의 심볼릭 링크는 허용되지 않습니다.');
      if (resolve(current) === resolve(this.root)) break;
    }
    const actual = await realpath(path);
    const inside = relative(root, actual);
    if (!inside || inside === '..' || inside.startsWith('..\\') || inside.startsWith('../') || isAbsolute(inside)) throw new GameDataError('번들 리소스가 앱 리소스 경로를 벗어났습니다.');
    return actual;
  }
}
