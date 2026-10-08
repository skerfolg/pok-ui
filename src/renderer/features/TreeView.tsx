import { useCallback, useEffect, useMemo, useState } from 'react';
import type { BuildEdit, ParsedBuild, PassiveTreeData } from '../../shared/contracts';
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
export function TreeView({ parsed, edit, editable = true }: { parsed: ParsedBuild; connected: boolean; edit: (edit: BuildEdit, label: string) => void; editable?: boolean }) {
  const spec = parsed.trees.find(t => t.active) ?? parsed.trees[0];
  const [loaded, setLoaded] = useState<LoadedTree>(); const [error, setError] = useState(''); const [elapsed, setElapsed] = useState(0); const [attempt, setAttempt] = useState(0);
  const [bundleId, setBundleId] = useState('');
  const [query, setQuery] = useState(''); const [selectedId, setSelectedId] = useState<number>(); const [ids, setIds] = useState('');
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, scale: 0.02 }); const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [initialFit, setInitialFit] = useState(false);
  const onSize = useCallback((width: number, height: number) => setViewport(current => current.width === width && current.height === height ? current : { width, height }), []);
  useEffect(() => { setIds(spec?.nodes.join(', ') ?? ''); }, [spec]);
  useEffect(() => { let alive = true; api.getDataBundleInfo().then(info => alive && setBundleId(info.status === 'ready' ? info.bundleId ?? '' : ''), () => alive && setBundleId('')); return () => { alive = false; }; }, [attempt]);
  useEffect(() => {
    let cancelled = false; const start = performance.now(); setLoaded(undefined); setError(''); setSelectedId(undefined); setInitialFit(false);
    if (!spec?.version) { setError('빌드에 트리 버전이 없습니다. 버전이 지정된 PoB XML을 가져오세요.'); return; }
    if (!bundleId) { setError('POK 고정 데이터 묶음을 확인하지 못했습니다.'); return; }
    void loadTree(bundleId, spec.version).then(result => { if (!cancelled) { setLoaded(result); setElapsed(performance.now() - start); } }, reason => { if (!cancelled) setError(String(reason)); });
    return () => { cancelled = true; };
  }, [spec?.version, bundleId, attempt]);
  useEffect(() => { if (loaded && viewport.width > 10 && viewport.height > 10 && !initialFit) { setCamera(fitCamera(loaded.graph.bounds, viewport.width, viewport.height, 24)); setInitialFit(true); } }, [loaded, viewport, initialFit]);
  const assigned = useMemo(() => new Set(spec?.nodes ?? []), [spec?.nodes]);
  const matches = useMemo(() => { const q = query.trim().toLocaleLowerCase(); if (!q || !loaded) return []; return [...loaded.graph.nodes.values()].filter(n => n.kind !== 'OnlyImage' && `${n.name} ${n.id} ${n.stats?.join(' ')}`.toLocaleLowerCase().includes(q)); }, [query, loaded]);
  const searched = useMemo(() => new Set(matches.map(n => n.id)), [matches]);
  const selected = selectedId === undefined ? undefined : loaded?.graph.nodes.get(selectedId);
  if (!spec) return <p>트리 정보가 없습니다.</p>;
  const minScale = loaded ? fitCamera(loaded.graph.bounds, viewport.width, viewport.height, 24).scale * 0.6 : 0.001;
  const baseScale = minScale / 0.6;
  const missing = loaded ? spec.nodes.filter(id => !loaded.graph.nodes.has(id)) : [];
  function fit(all: boolean) {
    if (!loaded) return; const nodes = all ? undefined : [...loaded.graph.nodes.values()].filter(n => assigned.has(n.id));
    setCamera(fitCamera(nodes?.length ? nodeBounds(nodes) : loaded.graph.bounds, viewport.width, viewport.height, all ? 24 : 65));
  }
  function focus(node: DisplayNode) { setSelectedId(node.id); setCamera({ x: node.x, y: node.y, scale: Math.max(camera.scale, 0.55) }); }
  function toggle(node: DisplayNode) { if (!editable) { setError('현재 트리 버전에서는 패시브 노드 편집이 비활성화됩니다.'); return; } edit({ type: 'tree-nodes', specId: spec!.id, nodes: assigned.has(node.id) ? spec!.nodes.filter(n => n !== node.id) : [...spec!.nodes, node.id] }, '패시브 노드 편집'); }
  return <section className="feature fill tree-feature">
    <div className="page-heading"><h1>패시브트리</h1><select aria-label="패시브 세트" value={spec.id} onChange={e => edit({ type: 'active-set', kind: 'tree', id: e.target.value }, '패시브 세트 변경')}>{parsed.trees.map(t => <option key={t.id} value={t.id}>{t.title || `트리 ${t.id}`}</option>)}</select><span className="muted">{spec.nodes.length}개 할당 · PoB {spec.version}</span></div>
    <div className="tree-toolbar actions"><input type="search" aria-label="패시브 검색" placeholder="노드 이름·효과·ID 검색" value={query} onChange={e => setQuery(e.target.value)} /><button disabled={!loaded} onClick={() => fit(false)}>할당 위치</button><button disabled={!loaded} onClick={() => fit(true)}>전체 트리</button><label>확대<input aria-label="트리 확대" type="range" min="-0.5" max="6" step="0.05" value={Math.max(-0.5, Math.min(6, Math.log2(camera.scale / baseScale)))} onChange={e => setCamera(zoomAt(camera, baseScale * 2 ** Number(e.target.value) / camera.scale, viewport.width / 2, viewport.height / 2, viewport.width, viewport.height, minScale))} /></label><span className="muted tree-zoom">{Math.round(camera.scale / baseScale * 100)}%</span><button disabled={!loaded} onClick={() => fit(true)}>화면 맞춤</button></div>
    {query.trim() && <div className="tree-search-results" aria-label="패시브 검색 결과"><span>{matches.length}개 일치</span>{matches.slice(0, 20).map(n => <button key={n.id} onClick={() => focus(n)}>{n.name}<small>#{n.id}</small></button>)}{matches.length > 20 && <span>검색어를 더 입력해 범위를 좁히세요.</span>}</div>}
    {loaded ? <PassiveTreeCanvas data={loaded.data} graph={loaded.graph} assigned={assigned} search={searched} selected={selectedId} className={parsed.className} ascendancy={parsed.ascendancy} camera={camera} setCamera={setCamera} onSize={onSize} onSelect={n => setSelectedId(n.id)} minScale={minScale} /> : <div className="tree-canvas pob-tree tree-loading"><p>{error || `PoB ${spec.version} 트리와 지도 리소스를 읽는 중…`}</p>{error && <button onClick={() => setAttempt(n => n + 1)}>다시 시도</button>}</div>}
    <div className="tree-status" role="status">{loaded ? `${loaded.graph.nodes.size.toLocaleString()}개 노드 · ${loaded.graph.edges.filter(e => e.draw).length.toLocaleString()}개 연결 · 로컬 데이터 ${elapsed < 10 ? '< 0.01' : (elapsed / 1000).toFixed(2)}초` : '엔진 연결 없이 로컬 PoB 리소스로 표시합니다.'}{missing.length > 0 && <span className="warning"> · 이 버전에 없는 할당 ID: {missing.join(', ')}</span>}</div>
    {selected && <div className="tree-selection"><div><strong>{selected.name}</strong><span className="muted"> #{selected.id}</span><p>{selected.stats?.join(' · ')}</p></div><button className="primary" disabled={!editable || selected.kind === 'ClassStart' || selected.kind === 'AscendClassStart'} onClick={() => toggle(selected)}>{assigned.has(selected.id) ? '할당 해제' : '할당'}</button></div>}
    <details className="node-editor"><summary>{editable ? '노드 ID 직접 편집' : '노드 ID 보기 전용'} · 주얼 {spec.sockets.length}개</summary><textarea aria-label="패시브 노드 ID" value={ids} onChange={e => setIds(e.target.value)} /><button disabled={!editable} onClick={() => { const list = ids.split(/[\s,]+/).filter(Boolean).map(Number); if (list.some(n => !Number.isSafeInteger(n) || n < 0)) { setError('노드 ID는 양의 정수로 입력하세요.'); return; } edit({ type: 'tree-nodes', specId: spec.id, nodes: [...new Set(list)] }, '패시브 노드 편집'); }}>노드 적용</button>{error && loaded && <p className="warning">{error}</p>}<div>{spec.sockets.map(socket => <p key={socket.nodeId}>#{socket.nodeId} · {parsed.items.find(i => i.id === socket.itemId)?.name ?? socket.itemId}</p>)}</div></details>
  </section>;
}
