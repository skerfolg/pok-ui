import type { RawPassiveTree, RawTreeNode } from '../../shared/passive-tree';

export type NodeKind = 'ClassStart' | 'AscendClassStart' | 'OnlyImage' | 'Socket' | 'Keystone' | 'Notable' | 'Normal';
export interface DisplayNode extends RawTreeNode { id: number; x: number; y: number; angle: number; kind: NodeKind; iconSize: number; frameSize: number }
export interface TreeArc { cx: number; cy: number; r: number; start: number; end: number; anticlockwise: boolean }
export interface TreeEdge { key: string; a: DisplayNode; b: DisplayNode; draw: boolean; arc?: TreeArc }
export interface Bounds { minX: number; minY: number; maxX: number; maxY: number }
export interface DisplayTree { nodes: Map<number, DisplayNode>; edges: TreeEdge[]; bounds: Bounds }
export function getTreeGroup(tree: RawPassiveTree, id: number | undefined) {
  if (id === undefined) return undefined;
  return Array.isArray(tree.groups) ? tree.groups[id - 1] : tree.groups[String(id)];
}

export function nodeKind(node: RawTreeNode): NodeKind {
  if (node.classesStart?.length) return 'ClassStart';
  if (node.isAscendancyStart) return 'AscendClassStart';
  if (node.isOnlyImage) return 'OnlyImage';
  if (node.isJewelSocket) return 'Socket';
  if (node.ks || node.isKeystone) return 'Keystone';
  if (node.not || node.isNotable) return 'Notable';
  return 'Normal';
}
function sizes(kind: NodeKind, ascendancy: boolean): [number, number] {
  switch (kind) {
    case 'OnlyImage': return [380, 0];
    case 'Socket': return [76, 76];
    case 'Keystone': return [82, 120];
    case 'Notable': return [54, ascendancy ? 100 : 80];
    case 'AscendClassStart': return [37, 50];
    case 'ClassStart': return [0, 0];
    default: return [37, ascendancy ? 80 : 54];
  }
}
function shortArc(cx: number, cy: number, r: number, a: DisplayNode, b: DisplayNode): TreeArc {
  const start = Math.atan2(a.y - cy, a.x - cx);
  const finish = Math.atan2(b.y - cy, b.x - cx);
  const delta = ((finish - start + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  return { cx, cy, r, start, end: start + delta, anticlockwise: delta < 0 };
}
/** Mirrors PassiveTree.lua:BuildConnector; an orbit sign is relative to its source endpoint. */
export function connectionArc(tree: RawPassiveTree, a: DisplayNode, b: DisplayNode, orbit: number): TreeArc | undefined {
  const radius = tree.constants.orbitRadii[Math.abs(orbit)];
  if (orbit !== 0 && Number.isFinite(radius) && radius > 0) {
    const dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy);
    if (distance > 0 && distance < radius * 2) {
      const offset = Math.sqrt(radius * radius - distance * distance / 4) * Math.sign(orbit);
      return shortArc(a.x + dx / 2 + offset * dy / distance, a.y + dy / 2 - offset * dx / distance, radius, a, b);
    }
  } else if (orbit === 0 && a.group === b.group && a.orbit === b.orbit && a.orbit > 0) {
    const group = getTreeGroup(tree, a.group);
    const groupRadius = tree.constants.orbitRadii[a.orbit];
    if (group && Number.isFinite(groupRadius) && groupRadius > 0) {
      // PoB orders orbit angles before selecting the smaller arc. The order matters
      // for diametrically opposite nodes: reversing a stored edge must not flip it.
      let first = a.angle, last = b.angle;
      if (first > last) [first, last] = [last, first];
      let delta = last - first;
      if (delta >= Math.PI) { [first, last] = [last, first]; delta = Math.PI * 2 - delta; }
      return { cx: group.x, cy: group.y, r: groupRadius, start: first - Math.PI / 2, end: first - Math.PI / 2 + delta, anticlockwise: false };
    }
  }
  return undefined;
}
export function nodeBounds(nodes: Iterable<DisplayNode>): Bounds {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const n of nodes) { minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x); minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y); }
  return Number.isFinite(minX) ? { minX, maxX, minY, maxY } : { minX: -1000, maxX: 1000, minY: -1000, maxY: 1000 };
}
/** Connections in PoB are one-way records. Canonicalise pairs without dropping either orientation. */
export function normalizeTree(tree: RawPassiveTree): DisplayTree {
  const nodes = new Map<number, DisplayNode>();
  for (const raw of Object.values(tree.nodes)) {
    if (!raw || raw.group === undefined || !Number.isSafeInteger(raw.skill)) continue;
    const group = getTreeGroup(tree, raw.group);
    const angle = tree.constants.orbitAnglesByOrbit[raw.orbit]?.[raw.orbitIndex];
    const radius = tree.constants.orbitRadii[raw.orbit];
    if (!group || !Number.isFinite(group.x) || !Number.isFinite(group.y) || !Number.isFinite(angle) || !Number.isFinite(radius) || radius < 0) continue;
    const kind = nodeKind(raw), [iconSize, frameSize] = raw.containJewelSocket ? [80, 80] : sizes(kind, Boolean(raw.ascendancyName));
    nodes.set(raw.skill, { ...raw, id: raw.skill, x: group.x + Math.sin(angle) * radius, y: group.y - Math.cos(angle) * radius, angle, kind, iconSize, frameSize });
  }
  const edges: TreeEdge[] = [], seen = new Set<string>();
  for (const a of nodes.values()) for (const connection of a.connections ?? []) {
    const b = nodes.get(connection.id);
    if (!b || a.id === b.id || a.kind === 'OnlyImage' || b.kind === 'OnlyImage') continue;
    const key = `${Math.min(a.id, b.id)}:${Math.max(a.id, b.id)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({ key, a, b, draw: a.kind !== 'ClassStart' && b.kind !== 'ClassStart' && a.ascendancyName === b.ascendancyName,
      arc: connectionArc(tree, a, b, connection.orbit ?? 0) });
  }
  return { nodes, edges, bounds: nodeBounds([...nodes.values()].filter(n => n.kind !== 'OnlyImage')) };
}

export interface Camera { x: number; y: number; scale: number }
export function fitCamera(bounds: Bounds, width: number, height: number, padding = 48): Camera {
  return { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2,
    scale: Math.max(0.001, Math.min(Math.max(100, width - padding * 2) / Math.max(1000, bounds.maxX - bounds.minX), Math.max(100, height - padding * 2) / Math.max(1000, bounds.maxY - bounds.minY))) };
}
export function zoomAt(camera: Camera, multiplier: number, px: number, py: number, width: number, height: number, minScale: number, maxScale = 3): Camera {
  const scale = Math.max(minScale, Math.min(maxScale, camera.scale * multiplier));
  return { x: camera.x + (px - width / 2) * (1 / camera.scale - 1 / scale), y: camera.y + (py - height / 2) * (1 / camera.scale - 1 / scale), scale };
}
