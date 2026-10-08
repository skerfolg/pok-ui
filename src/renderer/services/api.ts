import type { PassiveTreeData } from '../../shared/passive-tree';
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
async function previewJson<T>(path:string):Promise<T> {
  const response=await fetch('/__pok-data'+path);
  const data=await response.json();
  if(!response.ok)throw new Error(data.error||'게임 데이터 읽기 실패');
  return data as T;
}
// Browser mode is only a renderer development surface. Native capabilities stay in main.
const browserPreview: DesktopApi = {
  platform:'browser',windowChrome:false,
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
  async getPokConnection() { return {connected:false}; },
  onPokConnection() { return ()=>{}; },
  getDataBundleInfo: () => previewJson('/info'),
  queryPobCatalog: query => previewJson('/catalog?' + new URLSearchParams(Object.entries(query).filter(([,v])=>v!==undefined).map(([k,v])=>[k,String(v)]))),
  getPobCatalogEntry: (type,id) => previewJson('/entry?' + new URLSearchParams({type,id})),
  async renderPobItem() { return {ok:false,reason:'브라우저 미리보기에서는 POK 아이템 렌더링을 사용할 수 없습니다.'}; },
  async loadPassiveTree(version) {
    const data = await previewJson<PassiveTreeData>('/tree?' + new URLSearchParams({version}));
    return {...data,assets:Object.fromEntries(Object.entries(data.assets).map(([key,asset])=>[key,{...asset,url:'/__pok-data/asset?'+new URLSearchParams({url:asset.url})}]))};
  },
  callPok: unavailable, computeBuild: unavailable, applyBuildProposal: unavailable, sendChat: unavailable, cancelChat: unavailable, resolveApproval: unavailable,
  listAgentModels:async()=>[],pickChatImages:unavailable,addChatImage:unavailable,chatImageUrl:()=>'',answerAgentQuestion:unavailable,
  onAgentEvent() { return () => {}; }, openDataFolder: unavailable, selectPath: unavailable,
};
export const api = window.pok ?? browserPreview;
export const isDesktop = Boolean(window.pok);
