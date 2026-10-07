import test from 'node:test';
import assert from 'node:assert/strict';
import type { RawPassiveTree, RawTreeNode } from '../src/shared/passive-tree';
import { connectionArc, fitCamera, normalizeTree, zoomAt } from '../src/renderer/features/passive-tree-geometry';

// Synthetic tree fragments exercise the PoB export format without shipping a user's build.
function node(id: number, extra: Partial<RawTreeNode> = {}): RawTreeNode {
  return { skill: id, name: `Synthetic ${id}`, group: 1, orbit: 0, orbitIndex: 0, connections: [], ...extra };
}
function tree(nodes: RawTreeNode[], extra: Partial<RawPassiveTree> = {}): RawPassiveTree {
  return {
    nodes: Object.fromEntries(nodes.map(n => [String(n.skill), n])),
    groups: { '1': { x: 100, y: 200 }, '2': { x: 200, y: 200 } },
    classes: [], nodeOverlay: {}, min_x: -1000, min_y: -1000, max_x: 1000, max_y: 1000,
    constants: { orbitRadii: [0, 100], orbitAnglesByOrbit: [[0], [0, Math.PI / 2, Math.PI, Math.PI * 3 / 2]] },
    ...extra,
  };
}
function near(actual: number, expected: number, message?: string): void { assert.ok(Math.abs(actual - expected) < 1e-8, message ?? `${actual} != ${expected}`); }

test('export array groups are one-based; orbit and orbitIndex are zero-based', () => {
  const result = normalizeTree(tree([node(10, { group: 2, orbit: 1, orbitIndex: 1 })], {
    groups: [{ x: -999, y: -999 }, { x: 250, y: 300 }],
  }));
  near(result.nodes.get(10)!.x, 350);
  near(result.nodes.get(10)!.y, 300);
});

test('positions use exported angles, including irregular orbit spacing', () => {
  const result = normalizeTree(tree([node(10, { orbit: 1, orbitIndex: 1 })], {
    constants: { orbitRadii: [0, 100], orbitAnglesByOrbit: [[0], [0, Math.PI / 6, Math.PI]] },
  }));
  near(result.nodes.get(10)!.x, 150);
  near(result.nodes.get(10)!.y, 200 - Math.sqrt(7500));
});

test('one-way high-to-low links survive and reciprocal records do not duplicate', () => {
  const result = normalizeTree(tree([
    node(90, { connections: [{ id: 10, orbit: 0 }, { id: 20, orbit: 0 }] }),
    node(10, { group: 2 }),
    node(20, { group: 2, connections: [{ id: 90, orbit: 0 }] }),
  ]));
  assert.deepEqual(result.edges.map(e => e.key).sort(), ['10:90', '20:90']);
  assert.equal(result.edges.find(e => e.key === '10:90')!.a.id, 90);
});

test('OnlyImage, self-links and missing targets never become logical edges', () => {
  const result = normalizeTree(tree([
    node(10, { connections: [{ id: 10, orbit: 0 }, { id: 20, orbit: 0 }, { id: 999, orbit: 0 }, { id: 30, orbit: 0 }] }),
    node(20, { group: 2, isOnlyImage: true, connections: [{ id: 30, orbit: 0 }] }),
    node(30, { group: 2 }),
  ]));
  assert.deepEqual(result.edges.map(e => e.key), ['10:30']);
});

test('class starts and cross-ascendancy links remain logical but are not drawn', () => {
  const result = normalizeTree(tree([
    node(10, { classesStart: ['SyntheticClass'], connections: [{ id: 20, orbit: 0 }] }),
    node(20, { group: 2, connections: [{ id: 30, orbit: 0 }] }),
    node(30, { group: 2, ascendancyName: 'SyntheticAscendancy', connections: [{ id: 40, orbit: 0 }] }),
    node(40, { ascendancyName: 'SyntheticAscendancy' }),
  ]));
  assert.equal(result.edges.length, 3);
  assert.deepEqual(result.edges.filter(e => e.draw).map(e => e.key), ['30:40']);
});

test('signed connector orbit follows original source direction, even for descending IDs', () => {
  const input = tree([node(90, { connections: [{ id: 10, orbit: 1 }] }), node(10, { group: 2 })]);
  const result = normalizeTree(input), edge = result.edges[0];
  assert.equal(edge.a.id, 90);
  near(edge.arc!.cx, 150);
  near(edge.arc!.cy, 200 - Math.sqrt(7500));
  const negative = connectionArc(input, edge.a, edge.b, -1)!;
  near(negative.cx, 150);
  near(negative.cy, 200 + Math.sqrt(7500));
  assert.notEqual(edge.arc!.anticlockwise, negative.anticlockwise);
  for (const arc of [edge.arc!, negative]) {
    near(arc.cx + arc.r * Math.cos(arc.start), edge.a.x);
    near(arc.cy + arc.r * Math.sin(arc.start), edge.a.y);
    near(arc.cx + arc.r * Math.cos(arc.end), edge.b.x);
    near(arc.cy + arc.r * Math.sin(arc.end), edge.b.y);
    assert.ok(Math.abs(arc.end - arc.start) <= Math.PI);
  }
});

test('same-group, same-orbit zero connections follow the short arc across angle wrap', () => {
  const result = normalizeTree(tree([
    node(10, { orbit: 1, orbitIndex: 0, connections: [{ id: 20, orbit: 0 }] }),
    node(20, { orbit: 1, orbitIndex: 3 }),
  ]));
  const arc = result.edges[0].arc!;
  near(arc.cx, 100); near(arc.cy, 200); near(arc.r, 100);
  near(Math.abs(arc.end - arc.start), Math.PI / 2);
});

test('half-circle same-orbit connections use the same side in either stored direction', () => {
  const input = tree([node(10, { orbit: 1, orbitIndex: 0 }), node(20, { orbit: 1, orbitIndex: 2 })]);
  const result = normalizeTree(input), a = result.nodes.get(10)!, b = result.nodes.get(20)!;
  const forward = connectionArc(input, a, b, 0)!, backward = connectionArc(input, b, a, 0)!;
  assert.deepEqual(forward, backward);
  near(forward.start, Math.PI / 2);
  near(forward.end, Math.PI * 3 / 2);
});

test('special orbit sentinel, invalid arc radius and diameter become straight lines', () => {
  const result = normalizeTree(tree([
    node(10, { connections: [{ id: 20, orbit: 2147483647 }, { id: 30, orbit: 1 }, { id: 40, orbit: 1 }, { id: 50, orbit: 999 }] }),
    node(20, { group: 2 }), node(30, { group: 3 }), node(40, { group: 4 }), node(50, { group: 2 }),
  ], { groups: { '1': { x: 0, y: 0 }, '2': { x: 100, y: 0 }, '3': { x: 200, y: 0 }, '4': { x: 300, y: 0 } } }));
  assert.equal(result.edges.length, 4);
  assert.ok(result.edges.every(e => e.arc === undefined));
});

test('zero distance and malformed coordinates cannot produce NaN paths', () => {
  const result = normalizeTree(tree([
    node(10, { connections: [{ id: 20, orbit: 1 }] }), node(20),
    node(30, { group: 3 }), node(40, { orbit: 1, orbitIndex: 100 }), node(50, { group: 999 }),
  ], { groups: { '1': { x: 0, y: 0 }, '3': { x: Number.NaN, y: 0 } } }));
  assert.deepEqual([...result.nodes.keys()], [10, 20]);
  assert.equal(result.edges[0].arc, undefined);
  assert.ok(Object.values(result.bounds).every(Number.isFinite));
});

test('empty tree has a usable camera and cursor anchored zoom preserves world position', () => {
  const result = normalizeTree(tree([]));
  const camera = fitCamera(result.bounds, 1000, 700);
  assert.ok(camera.scale > 0 && Number.isFinite(camera.scale));
  const point = { x: 720, y: 280 };
  const next = zoomAt(camera, 1.7, point.x, point.y, 1000, 700, 0.001);
  near(camera.x + (point.x - 500) / camera.scale, next.x + (point.x - 500) / next.scale);
  near(camera.y + (point.y - 350) / camera.scale, next.y + (point.y - 350) / next.scale);
});
