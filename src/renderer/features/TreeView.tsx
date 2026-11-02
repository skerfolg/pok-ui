import {NativeTreeSets} from '../components/NativeTreeSets';
import {NativeTreeWorkspace} from '../components/NativeTreeWorkspace';
import {NativeTreeCodes} from '../components/NativeTreeCodes';
import {hasLegacyPassiveSpec,LEGACY_TREE_WORKSPACE_MESSAGE} from '../../shared/pob-document';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { BuildDocument,BuildEdit,Calculation, ParsedBuild, PassiveTreeData } from '../../shared/contracts';
import {useTreeOperation} from '../state/useTreeOperation';
import {treeAllocationModes} from '../../shared/tree-allocation';
import { api } from '../services/api';
import { PassiveTreeCanvas } from './PassiveTreeCanvas';
import { fitCamera, nodeBounds, normalizeTree, zoomAt, type Camera, type DisplayNode, type DisplayTree } from './passive-tree-geometry';

interface LoadedTree { data: PassiveTreeData; graph: DisplayTree }
const trees = new Map<string, Promise<LoadedTree>>();
function loadTree(bundleId: string, version: string): Promise<LoadedTree> {
  const key = `${bundleId}:${version}`;
  if (!trees.has(key)) trees.set(key, api.loadPassiveTree(version).then(data => ({ data, graph: normalizeTree(data.tree) })).catch(error => { trees.delete(key); throw error; }));
  return trees.get(key)!;
}
export function TreeView({ build,runtimeId,applyExpected,calculated,parsed, edit, editable = true,canInitialize=false }: {build:BuildDocument;runtimeId?:string;applyExpected:(snapshot:BuildDocument,edit:BuildEdit,label:string)=>BuildDocument;calculated:(build:BuildDocument,result:Calculation)=>boolean; parsed: ParsedBuild; connected: boolean; edit: (edit: BuildEdit, label: string) => void; editable?: boolean;canInitialize?:boolean }) {
  const spec = parsed.trees.find(t => t.active) ?? parsed.trees[0];
  const [loaded, setLoaded] = useState<LoadedTree>(); const [error, setError] = useState(''); const [elapsed, setElapsed] = useState(0); const [attempt, setAttempt] = useState(0);
  const [bundleId, setBundleId] = useState<string|null>(),[resourceError,setResourceError]=useState('');
  const [query, setQuery] = useState(''); const [selectedId, setSelectedId] = useState<number>(); const [ids, setIds] = useState('');
  const [operationAction,setOperationAction]=useState<'attribute'|'jewel'>(),[jewelItemId,setJewelItemId]=useState<number>();
  const [allocMode,setAllocMode]=useState(0),[attributeIndex,setAttributeIndex]=useState<number>(),[applying,setApplying]=useState(false);
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, scale: 0.02 }); const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [initialFit, setInitialFit] = useState(false);
  const onSize = useCallback((width: number, height: number) => setViewport(current => current.width === width && current.height === height ? current : { width, height }), []);
  useEffect(() => { setIds(spec?.nodes.join(', ') ?? ''); }, [spec]);
  useEffect(() => { let alive = true;setBundleId(undefined);setResourceError('');api.getDataBundleInfo().then(info=>{if(!alive)return;setResourceError(info.error||'');setBundleId(info.status==='ready'&&info.bundleId?info.bundleId:null);},reason=>{if(alive){setResourceError(String(reason));setBundleId(null);}});return()=>{alive=false;};},[attempt]);
  useEffect(() => {
    let cancelled = false; const start = performance.now(); setLoaded(undefined); setError(''); setSelectedId(undefined); setInitialFit(false);
    if (!spec?.version) { setError('빌드에 트리 버전이 없습니다. 버전이 지정된 PoB XML을 가져오세요.'); return; }
    if (!bundleId) { if(bundleId===null)setError(resourceError||'독립 PoB 트리 데이터를 준비해 주세요.');return; }
    void loadTree(bundleId, spec.version).then(result => { if (!cancelled) { setLoaded(result); setElapsed(performance.now() - start); } }, reason => { if (!cancelled) setError(String(reason)); });
    return () => { cancelled = true; };
  }, [spec?.version, bundleId, resourceError, attempt]);
  useEffect(() => { if (loaded && viewport.width > 10 && viewport.height > 10 && !initialFit) { setCamera(fitCamera(loaded.graph.bounds, viewport.width, viewport.height, 24)); setInitialFit(true); } }, [loaded, viewport, initialFit]);
  const assigned = useMemo(() => new Set(spec?.nodes ?? []), [spec?.nodes]);
  const matches = useMemo(() => { const q = query.trim().toLocaleLowerCase(); if (!q || !loaded) return []; return [...loaded.graph.nodes.values()].filter(n => n.kind !== 'OnlyImage' && `${n.name} ${n.id} ${n.stats?.join(' ')}`.toLocaleLowerCase().includes(q)); }, [query, loaded]);
  const searched = useMemo(() => new Set(matches.map(n => n.id)), [matches]);
  const selected = selectedId === undefined ? undefined : loaded?.graph.nodes.get(selectedId);
  const operation=useTreeOperation(build,editable?runtimeId:undefined,selectedId,selectedId!==undefined&&assigned.has(selectedId),allocMode,attributeIndex,operationAction,jewelItemId);
  useEffect(()=>{setAttributeIndex(undefined);setOperationAction(undefined);setJewelItemId(undefined);},[selectedId,spec?.id]);
  const preview=useMemo(()=>new Set(operation.current?[...operation.current.data.added,...operation.current.data.removed,...(operation.current.data.modified||[])]:[]),[operation.current]);
  const allocationModes=useMemo(()=>treeAllocationModes(spec),[spec]);
  const nativeNode=operation.layout?.data.node;
  if (!spec) return <section className="tree-page"><h1>패시브트리</h1>{hasLegacyPassiveSpec(build.xml)?<><p className="warning" role="alert">{LEGACY_TREE_WORKSPACE_MESSAGE}</p><NativeTreeWorkspace build={build} parsed={parsed} runtimeId={runtimeId} enabled={canInitialize} applyExpected={applyExpected} calculated={calculated}/></>:<><p>저장된 트리가 없습니다. 버전·직업을 선택해 원본 PoB의 초기 트리를 검토하고 생성할 수 있습니다.</p><NativeTreeWorkspace build={build} parsed={parsed} runtimeId={runtimeId} enabled={canInitialize} applyExpected={applyExpected} calculated={calculated}/><NativeTreeCodes build={build} parsed={parsed} runtimeId={runtimeId} enabled={canInitialize} applyExpected={applyExpected} calculated={calculated}/></>}</section>;
  const minScale = loaded ? fitCamera(loaded.graph.bounds, viewport.width, viewport.height, 24).scale * 0.6 : 0.001;
  const baseScale = minScale / 0.6;
  const missing = loaded ? spec.nodes.filter(id => !loaded.graph.nodes.has(id)) : [];
  function fit(all: boolean) {
    if (!loaded) return; const nodes = all ? undefined : [...loaded.graph.nodes.values()].filter(n => assigned.has(n.id));
    setCamera(fitCamera(nodes?.length ? nodeBounds(nodes) : loaded.graph.bounds, viewport.width, viewport.height, all ? 24 : 65));
  }
  function focus(node: DisplayNode) { setSelectedId(node.id); setCamera({ x: node.x, y: node.y, scale: Math.max(camera.scale, 0.55) }); }
  async function toggle() {
    const result=operation.current;if(!editable||!result||applying||result.data.diagnostics.length)return;setApplying(true);setError('');
    try{const info=await api.getPobRuntimeInfo();if(info.status!=='ready'||info.runtimeId!==result.data.runtimeId)throw new Error('검토 후 PoB 버전이 바뀌었습니다. 다시 선택해 주세요.');applyExpected(result.snapshot,{type:'tree-native-patch',specId:spec!.id,patch:result.data.patch},`${operationAction==='attribute'?'원본 능력치 변경':operationAction==='jewel'?'원본 주얼 변경':'원본 트리 연산'} · 추가 ${result.data.added.length} / 제거 ${result.data.removed.length} / 변경 ${result.data.modified?.length||0}`);}catch(reason){setError(String(reason));}finally{setApplying(false);}
  }
  return <section className="feature fill tree-feature">
    <div className="page-heading"><h1>패시브트리</h1><NativeTreeSets build={build} parsed={parsed} runtimeId={runtimeId} enabled={editable} edit={edit} applyExpected={applyExpected} calculated={calculated}/><NativeTreeWorkspace build={build} parsed={parsed} runtimeId={runtimeId} enabled={editable} applyExpected={applyExpected} calculated={calculated}/><NativeTreeCodes build={build} parsed={parsed} runtimeId={runtimeId} enabled={editable} applyExpected={applyExpected} calculated={calculated}/><span className="muted">XML 할당 ID {spec.nodes.length}개 · PoB {spec.version}</span><label>할당 모드<select aria-label="트리 할당 모드" value={allocMode} onChange={e=>setAllocMode(Number(e.target.value))}><option value="0">공통</option><option value="1">무기 세트 1</option><option value="2">무기 세트 2</option></select></label></div>
    <div className="tree-toolbar actions"><input type="search" aria-label="패시브 검색" placeholder="노드 이름·효과·ID 검색" value={query} onChange={e => setQuery(e.target.value)} /><button disabled={!loaded} onClick={() => fit(false)}>할당 위치</button><button disabled={!loaded} onClick={() => fit(true)}>전체 트리</button><label>확대<input aria-label="트리 확대" type="range" min="-0.5" max="6" step="0.05" value={Math.max(-0.5, Math.min(6, Math.log2(camera.scale / baseScale)))} onChange={e => setCamera(zoomAt(camera, baseScale * 2 ** Number(e.target.value) / camera.scale, viewport.width / 2, viewport.height / 2, viewport.width, viewport.height, minScale))} /></label><span className="muted tree-zoom">{Math.round(camera.scale / baseScale * 100)}%</span><button disabled={!loaded} onClick={() => fit(true)}>화면 맞춤</button></div>
    {query.trim() && <div className="tree-search-results" aria-label="패시브 검색 결과"><span>{matches.length}개 일치</span>{matches.slice(0, 20).map(n => <button key={n.id} onClick={() => focus(n)}>{n.name}<small>#{n.id}</small></button>)}{matches.length > 20 && <span>검색어를 더 입력해 범위를 좁히세요.</span>}</div>}
    {loaded ? <PassiveTreeCanvas data={loaded.data} graph={loaded.graph} allocationModes={allocationModes} assigned={assigned} search={searched} preview={preview} previewRemoval={Boolean(operation.current?.data.removed.length)} selected={selectedId} className={parsed.className} ascendancy={parsed.ascendancy} camera={camera} setCamera={setCamera} onSize={onSize} onSelect={n => setSelectedId(n.id)} minScale={minScale} /> : <div className="tree-canvas pob-tree tree-loading"><p>{error || `PoB ${spec.version} 트리와 지도 리소스를 읽는 중…`}</p>{error && <button onClick={() => setAttempt(n => n + 1)}>다시 시도</button>}</div>}
    <div className="tree-status" role="status"><span className="weapon-set-legend">공통 · <span style={{color:'#de8874'}}>무기 1</span> · <span style={{color:'#8dbb79'}}>무기 2</span> · </span>{loaded ? `${loaded.graph.nodes.size.toLocaleString()}개 노드 · ${loaded.graph.edges.filter(e => e.draw).length.toLocaleString()}개 연결 · 로컬 데이터 ${elapsed < 10 ? '< 0.01' : (elapsed / 1000).toFixed(2)}초` : '엔진 연결 없이 로컬 PoB 리소스로 표시합니다.'}{missing.length > 0 && <span className="warning"> · 이 버전에 없는 할당 ID: {missing.join(', ')}</span>}</div>
    {selected && <div className="tree-selection"><div><strong>{nativeNode?.name||selected.name}</strong><span className="muted"> #{selected.id}</span><p>{(nativeNode?.stats||selected.stats)?.join(' · ')}</p><p role="status">{operation.pending?'원본 PoB 경로·종속 노드 확인 중…':operation.current?`원본 연산: 추가 ${operation.current.data.added.length} / 제거 ${operation.current.data.removed.length} / 변경 ${operation.current.data.modified?.length||0} · 예상 일반 ${operation.current.data.counts.normal} / 무기1 ${operation.current.data.counts.weapon1} / 무기2 ${operation.current.data.counts.weapon2}`:''}</p>{operation.error&&<p className="warning">{operation.error}</p>}{operation.current?.data.diagnostics.map((d,i)=><p className="warning" key={i}>{d.code}: {d.message}</p>)}{assigned.has(selected.id)&&(nativeNode?.isAttribute||nativeNode?.socket)&&<label>편집 작업<select aria-label="트리 편집 작업" value={operationAction||''} onChange={e=>setOperationAction(e.target.value as 'attribute'|'jewel'||undefined)}><option value="">할당 해제</option>{nativeNode?.isAttribute&&<option value="attribute">능력치 변경</option>}{nativeNode?.socket&&<option value="jewel">주얼 변경</option>}</select></label>}{(!assigned.has(selected.id)||operationAction==='attribute')&&Boolean(nativeNode?.attributeOptions.length)&&<label>능력치 선택<select aria-label="트리 능력치 선택" disabled={operation.pending} value={attributeIndex??''} onChange={e=>setAttributeIndex(e.target.value?Number(e.target.value):undefined)}><option value="">선택하세요</option>{nativeNode?.attributeOptions.map(o=><option key={o.index} value={o.index}>{o.label}</option>)}</select></label>}{operationAction==='jewel'&&nativeNode?.socket&&<label>주얼 선택<select aria-label="트리 주얼 선택" disabled={operation.pending} value={jewelItemId??''} onChange={e=>setJewelItemId(e.target.value===''?undefined:Number(e.target.value))}><option value="">현재 #{nativeNode.socket.itemId} · 선택하세요</option>{nativeNode.socket.choices.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>}</div><button className="primary" disabled={!editable||applying||operation.pending||!operation.current||Boolean(operation.current.data.diagnostics.length)||!preview.size} onClick={()=>void toggle()}>{operationAction==='attribute'?'능력치 변경 적용':operationAction==='jewel'?'주얼 변경 적용':assigned.has(selected.id) ? '종속 노드 포함 해제' : '경로 할당'}</button></div>}
    <details className="node-editor"><summary>{editable ? '노드 ID 직접 편집' : '노드 ID 보기 전용'} · 주얼 {spec.sockets.length}개</summary><textarea aria-label="패시브 노드 ID" value={ids} onChange={e => setIds(e.target.value)} /><button disabled={!editable} onClick={() => { const list = ids.split(/[\s,]+/).filter(Boolean).map(Number); if (list.some(n => !Number.isSafeInteger(n) || n < 0)) { setError('노드 ID는 양의 정수로 입력하세요.'); return; } edit({ type: 'tree-nodes', specId: spec.id, nodes: [...new Set(list)] }, '패시브 노드 편집'); }}>노드 적용</button>{error && loaded && <p className="warning">{error}</p>}<div>{spec.sockets.map(socket => <p key={socket.nodeId}>#{socket.nodeId} · {parsed.items.find(i => i.id === socket.itemId)?.name ?? socket.itemId}</p>)}</div></details>
  </section>;
}
