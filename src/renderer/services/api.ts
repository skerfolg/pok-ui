import type { DesktopApi } from '../../shared/contracts';
import { createDefaultState, createBuildDocument } from '../../shared/state';
import { parseBuild } from '../../shared/pob-document';
const unavailable = async (): Promise<never> => { throw new Error('이 기능은 POK 데스크톱 앱에서 사용할 수 있습니다.'); };
function chooseFile(): Promise<File | null> {
  return new Promise(resolve => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.xml';
    input.addEventListener('change', () => resolve(input.files?.[0] ?? null), { once: true });
    input.addEventListener('cancel', () => resolve(null), { once: true }); input.click();
  });
}
// Browser mode is only a renderer development surface. Native capabilities stay in main.
const browserPreview: DesktopApi = {
  async loadState() { const text = localStorage.getItem('pok-preview-v1'); return text ? JSON.parse(text) : createDefaultState(); },
  async saveState(state) { localStorage.setItem('pok-preview-v1', JSON.stringify(state)); },
  async importBuild() { const file = await chooseFile(); if (!file) return null; const xml = await file.text(); parseBuild(xml); return createBuildDocument(file.name.replace(/\.xml$/i, ''), xml, file.name); },
  async exportBuild(build, format) {
    if (format === 'pob') return unavailable();
    const content = format === 'xml' ? build.xml : JSON.stringify(build, null, 2);
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `${build.name}.${format}`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); return link.download;
  },
  async connectPok() { return { connected: false, error: '브라우저 미리보기입니다. 엔진 연결은 데스크톱 앱에서 가능합니다.' }; },
  async loadPassiveTree(version) {
    if (!/^\d+_\d+$/.test(version)) throw new Error('트리 버전이 올바르지 않습니다.');
    const base = `/__pok-tree/${version}/`;
    const response = await fetch(base + 'manifest.json');
    if (!response.ok) throw new Error(`${version} 트리 리소스를 준비하지 못했습니다. README의 트리 리소스 준비를 확인하세요.`);
    const manifest = await response.json();
    if (manifest.schemaVersion !== 1 || manifest.version !== version || manifest.treeFile !== 'tree.json') throw new Error('트리 리소스 버전이 다릅니다.');
    const treeResponse = await fetch(base + 'tree.json');
    if (!treeResponse.ok) throw new Error('트리 데이터를 읽지 못했습니다.');
    return { version, tree: await treeResponse.json(), source: manifest.source,
      assets: Object.fromEntries(Object.entries(manifest.assets).map(([name, value]) => { const asset = value as { file: string; width: number; height: number; x?: number; y?: number }; if (!/^[a-zA-Z0-9._-]+$/.test(asset.file)) throw new Error('잘못된 트리 이미지 경로'); return [name, { ...asset, url: base + asset.file }]; })) };
  },
  callPok: unavailable, computeBuild: unavailable, sendChat: unavailable, cancelChat: unavailable, resolveApproval: unavailable,
  onAgentEvent() { return () => {}; }, openDataFolder: unavailable, selectPath: unavailable,
};
export const api = window.pok ?? browserPreview;
export const isDesktop = Boolean(window.pok);
