import { useEffect, useRef, useState } from 'react';
import type { PassiveTreeData, TreeBackground } from '../../shared/passive-tree';
import type { Camera, DisplayNode, DisplayTree } from './passive-tree-geometry';
import { zoomAt } from './passive-tree-geometry';

// Atlas images are shared across remounts and node states. Limit parallel decodes.
const textures = new Map<string, HTMLImageElement>();
const pending = new Set<string>(), failed = new Set<string>();
const queue: string[] = [], listeners = new Set<() => void>();
let loading = 0;
function requestTexture(url: string) {
  if (textures.has(url) || pending.has(url) || failed.has(url)) return;
  pending.add(url); queue.push(url); pump();
}
function pump() {
  while (loading < 4 && queue.length) {
    const url = queue.shift()!; loading++;
    const img = new Image(); img.decoding = 'async';
    img.src = url;
    void img.decode().then(() => textures.set(url, img), () => failed.add(url)).finally(() => {
      pending.delete(url); loading--; for (const listener of listeners) listener(); pump();
    });
  }
}
function resetFailedTextures() { failed.clear(); }
interface Props {
  data: PassiveTreeData; graph: DisplayTree; assigned: Set<number>; search: Set<number>; selected?: number;
  className: string; ascendancy: string; camera: Camera; setCamera: (camera: Camera) => void;
  onSize: (width: number, height: number) => void; onSelect: (node: DisplayNode) => void; minScale: number;
}
export function PassiveTreeCanvas({ data, graph, assigned, search, selected, className, ascendancy, camera, setCamera, onSize, onSelect, minScale }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null), host = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 1, height: 1 });
  const [hover, setHover] = useState<{ node: DisplayNode; x: number; y: number }>();
  const [imageTick, setImageTick] = useState(0);
  const drag = useRef<{ x: number; y: number; camera: Camera; moved: boolean } | null>(null);
  const current = useRef({ camera, setCamera, minScale, size }); current.current = { camera, setCamera, minScale, size };
  useEffect(() => { let frame = 0; const changed = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; setImageTick(t => t + 1); }); }; listeners.add(changed); return () => { listeners.delete(changed); cancelAnimationFrame(frame); }; }, []);
  useEffect(() => {
    const element = host.current!;
    const observer = new ResizeObserver(([entry]) => { const { width, height } = entry.contentRect; setSize({ width, height }); onSize(width, height); });
    observer.observe(element); return () => observer.disconnect();
  }, [onSize]);
  useEffect(() => {
    const element = canvas.current!;
    const wheel = (event: WheelEvent) => { event.preventDefault(); const rect = element.getBoundingClientRect(); const c = current.current;
      c.setCamera(zoomAt(c.camera, Math.exp(-event.deltaY * 0.0015), event.clientX - rect.left, event.clientY - rect.top, c.size.width, c.size.height, c.minScale)); };
    element.addEventListener('wheel', wheel, { passive: false }); return () => element.removeEventListener('wheel', wheel);
  }, []);
  useEffect(() => {
    const element = canvas.current!; const ctx = element.getContext('2d'); if (!ctx) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    element.width = Math.round(size.width * ratio); element.height = Math.round(size.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.fillStyle = '#090d12'; ctx.fillRect(0, 0, size.width, size.height);
    const used = new Set<string>();
    const image = (name: string | undefined, x: number, y: number, width?: number, height?: number, opacity = 1, rotation = 0, flipY = false): boolean => {
      if (!name) return false; const asset = data.assets[name]; if (!asset) return false;
      const w = width ?? asset.width, h = height ?? asset.height;
      const screenX = (x - camera.x) * camera.scale + size.width / 2, screenY = (y - camera.y) * camera.scale + size.height / 2;
      if (screenX + w * camera.scale < -4 || screenX - w * camera.scale > size.width + 4 || screenY + h * camera.scale < -4 || screenY - h * camera.scale > size.height + 4) return true;
      used.add(asset.url); const texture = textures.get(asset.url);
      if (!texture) { requestTexture(asset.url); return false; }
      ctx.save(); ctx.globalAlpha = opacity; ctx.translate(x, y); if (rotation) ctx.rotate(rotation); if (flipY) ctx.scale(1, -1);
      ctx.drawImage(texture, asset.x ?? 0, asset.y ?? 0, asset.width, asset.height, -w, -h, w * 2, h * 2); ctx.restore(); return true;
    };
    const tiled = data.assets.Background2;
    if (tiled) {
      used.add(tiled.url); const texture = textures.get(tiled.url);
      if (texture) {
        // PoB tiles Background2 in screen space, independent of tree panning.
        ctx.globalAlpha = 0.7;
        for (let x = 0; x < size.width; x += 256) for (let y = 0; y < size.height; y += 256) ctx.drawImage(texture, tiled.x ?? 0, tiled.y ?? 0, tiled.width, tiled.height, x, y, 256, 256);
        ctx.globalAlpha = 1;
      } else requestTexture(tiled.url);
    }
    ctx.translate(size.width / 2, size.height / 2); ctx.scale(camera.scale, camera.scale); ctx.translate(-camera.x, -camera.y);
    const drawBackground = (background: TreeBackground, opacity = 1) => image(background.image, background.x, background.y, background.width, background.height, opacity);
    const character = Object.values(data.tree.classes).find(c => c?.name === className);
    if (character?.background) {
      const bg = character.background;
      const chosen = character.ascendancies?.find(a => a.name === ascendancy);
      drawBackground({ ...bg, image: chosen?.background?.image ?? bg.image });
      const start = [...graph.nodes.values()].find(n => n.classesStart?.includes(className));
      if (start) image('BGTreeActive', bg.x, bg.y, bg.active?.width ?? 2000, bg.active?.height ?? 2000, 1, Math.PI / 2 + Math.atan2(start.y - bg.y, start.x - bg.x));
      image('BGTree', bg.x, bg.y, bg.bg?.width ?? 2000, bg.bg?.height ?? 2000);
    }
    for (const c of Object.values(data.tree.classes)) for (const a of c?.ascendancies ?? []) if (a.background) drawBackground(a.background, a.name === ascendancy ? 0.95 : 0.4);
    for (const group of Object.values(data.tree.groups)) {
      if (!group || group.isProxy || !group.background) continue;
      const bg = group.background, asset = data.assets[bg.image]; if (!asset) continue;
      const x = group.x + (bg.offsetX ?? 0), y = group.y + (bg.offsetY ?? 0);
      if (bg.isHalfImage !== undefined) { image(bg.image, x, y - asset.height, asset.width, asset.height, 0.85); image(bg.image, x, y + asset.height, asset.width, asset.height, 0.85, 0, true); }
      else image(bg.image, x, y, undefined, undefined, 0.85);
    }
    const drawEdge = (edge: DisplayTree['edges'][number]) => {
      if (edge.arc) { const { cx, cy, r, start, end, anticlockwise } = edge.arc; ctx.moveTo(cx + r * Math.cos(start), cy + r * Math.sin(start)); ctx.arc(cx, cy, r, start, end, anticlockwise); }
      else { ctx.moveTo(edge.a.x, edge.a.y); ctx.lineTo(edge.b.x, edge.b.y); }
    };
    // Inactive context remains visible when focusing on allocated nodes.
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); for (const edge of graph.edges) if (edge.draw) drawEdge(edge);
    ctx.strokeStyle = '#3d3c36'; ctx.lineWidth = Math.max(6, 0.75 / camera.scale); ctx.stroke();
    ctx.beginPath(); let activeEdges = 0;
    for (const edge of graph.edges) if (edge.draw && assigned.has(edge.a.id) && assigned.has(edge.b.id)) { drawEdge(edge); activeEdges++; }
    ctx.strokeStyle = '#d9b66c'; ctx.lineWidth = Math.max(11, 1.5 / camera.scale); ctx.stroke();
    let drawnNodes = 0;
    for (const node of graph.nodes.values()) {
      if (node.kind === 'ClassStart') continue;
      const sx = (node.x - camera.x) * camera.scale + size.width / 2, sy = (node.y - camera.y) * camera.scale + size.height / 2;
      const reach = Math.max(node.frameSize, node.iconSize) * camera.scale;
      if (sx + reach < 0 || sy + reach < 0 || sx - reach > size.width || sy - reach > size.height) continue;
      drawnNodes++;
      const allocated = assigned.has(node.id), matched = search.has(node.id), highlighted = selected === node.id || hover?.node.id === node.id;
      const state = allocated ? 'alloc' : highlighted ? 'path' : 'unalloc';
      const overlay = node.nodeOverlay ?? data.tree.nodeOverlay[node.kind];
      const socket = node.kind === 'Socket' || node.containJewelSocket;
      if (node.activeEffectImage && node.kind !== 'OnlyImage') image(node.activeEffectImage, node.x, node.y, 380, 380, allocated || highlighted ? 0.8 : 0.1);
      const icon = node.kind === 'OnlyImage' ? node.activeEffectImage : node.kind === 'AscendClassStart' ? 'AscendancyMiddle' : socket ? overlay?.[state] : node.icon;
      const iconSize = node.kind === 'AscendClassStart' ? 50 : node.iconSize;
      if (!image(icon, node.x, node.y, iconSize, iconSize, node.kind === 'OnlyImage' ? 0.18 : allocated || highlighted ? 1 : 0.48) && node.kind !== 'OnlyImage') {
        ctx.beginPath(); ctx.arc(node.x, node.y, node.frameSize * 0.55, 0, Math.PI * 2); ctx.fillStyle = allocated ? '#b69653' : '#232831'; ctx.fill();
      }
      if (!socket && node.kind !== 'AscendClassStart' && overlay) image(overlay[state], node.x, node.y, node.frameSize, node.frameSize, allocated || highlighted ? 1 : 0.65);
      if (matched || highlighted) { ctx.beginPath(); ctx.arc(node.x, node.y, Math.max(node.frameSize + 14, 5 / camera.scale), 0, Math.PI * 2); ctx.strokeStyle = highlighted ? '#fff1bb' : '#80c8dd'; ctx.lineWidth = 2 / camera.scale; ctx.stroke(); }
    }
    element.dataset.nodes = String(graph.nodes.size); element.dataset.edges = String(graph.edges.filter(e => e.draw).length); element.dataset.allocatedEdges = String(activeEdges);
    element.dataset.visibleNodes = String(drawnNodes); element.dataset.readyImages = String([...used].filter(url => textures.has(url)).length); element.dataset.requiredImages = String(used.size);
    element.dataset.failedImages = String([...used].filter(url => failed.has(url)).length);
    element.dataset.scale = String(camera.scale);
  }, [data, graph, assigned, search, selected, className, ascendancy, camera, size, imageTick, hover?.node.id]);
  function point(event: React.PointerEvent<HTMLCanvasElement>) { const rect = event.currentTarget.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; }
  function hit(x: number, y: number) {
    const wx = camera.x + (x - size.width / 2) / camera.scale, wy = camera.y + (y - size.height / 2) / camera.scale;
    let nearest: DisplayNode | undefined, best = Infinity;
    for (const n of graph.nodes.values()) {
      if (n.kind === 'OnlyImage' || n.kind === 'ClassStart') continue;
      const distance = Math.hypot(wx - n.x, wy - n.y);
      if (distance < Math.max(n.frameSize, 6 / camera.scale) && distance < best) { best = distance; nearest = n; }
    }
    return nearest;
  }
  return <div className="tree-canvas pob-tree" ref={host}>
    <canvas ref={canvas} role="img" aria-label="PoB 패시브 트리 지도" tabIndex={0}
      onPointerDown={event => { if (event.button !== 0) return; const p = point(event); drag.current = { ...p, camera, moved: false }; event.currentTarget.setPointerCapture(event.pointerId); }}
      onPointerMove={event => { const p = point(event), d = drag.current; if (d) { const dx = p.x - d.x, dy = p.y - d.y; if (Math.hypot(dx, dy) > 3) d.moved = true; if (d.moved) { setHover(undefined); setCamera({ ...d.camera, x: d.camera.x - dx / d.camera.scale, y: d.camera.y - dy / d.camera.scale }); } } else { const node = hit(p.x, p.y); setHover(node ? { node, ...p } : undefined); } }}
      onPointerUp={event => { const d = drag.current; if (d && !d.moved) { const p = point(event), node = hit(p.x, p.y); if (node) onSelect(node); } drag.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
      onPointerCancel={() => { drag.current = null; }} onPointerLeave={() => { if (!drag.current) setHover(undefined); }}
      onKeyDown={event => { const move = 100 / camera.scale; if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) { event.preventDefault(); setCamera({ ...camera, x: camera.x + (event.key === 'ArrowRight' ? move : event.key === 'ArrowLeft' ? -move : 0), y: camera.y + (event.key === 'ArrowDown' ? move : event.key === 'ArrowUp' ? -move : 0) }); } else if (event.key === '+' || event.key === '-') { event.preventDefault(); setCamera(zoomAt(camera, event.key === '+' ? 1.3 : 1 / 1.3, size.width / 2, size.height / 2, size.width, size.height, minScale)); } }} />
    <div className="tree-map-help">휠 확대 · 드래그 이동 · 클릭 선택</div>
    {hover && <div className="tree-tooltip" style={{ left: Math.min(Math.max(8, hover.x + 18), Math.max(8, size.width - 330)), top: Math.min(hover.y + 16, Math.max(8, size.height - 170)) }}><strong>{hover.node.name}</strong><small>#{hover.node.id}{assigned.has(hover.node.id) ? ' · 할당됨' : ''}</small>{hover.node.stats?.map((s, i) => <p key={i}>{s}</p>)}</div>}
    {failed.size > 0 && <button className="tree-image-retry" onClick={() => { resetFailedTextures(); setImageTick(t => t + 1); }}>이미지 다시 읽기</button>}
  </div>;
}
