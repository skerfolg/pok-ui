/** Display-only PoB export. These types do not implement build calculations. */
export interface TreeOverlay { alloc: string; path: string; unalloc: string }
export interface RawTreeNode {
  skill: number; name: string; icon?: string; stats?: string[];
  group?: number; orbit: number; orbitIndex: number;
  connections?: { id: number; orbit: number }[];
  classesStart?: string[]; isAscendancyStart?: boolean; ascendancyName?: string;
  isKeystone?: boolean; ks?: boolean; isNotable?: boolean; not?: boolean;
  isJewelSocket?: boolean; containJewelSocket?: boolean; isOnlyImage?: boolean; isMastery?: boolean;
  activeEffectImage?: string; nodeOverlay?: TreeOverlay; connectionArt?: string;
}
export interface RawTreeGroup {
  x: number; y: number; nodes?: number[]; orbits?: number[]; isProxy?: boolean;
  background?: { image: string; offsetX?: number; offsetY?: number; isHalfImage?: boolean };
}
export interface TreeBackground { image: string; x: number; y: number; width: number; height: number; bg?: { width: number; height: number }; active?: { width: number; height: number } }
export interface RawTreeClass {
  name: string; integerId: number; background?: TreeBackground;
  ascendancies?: { name: string; id: string; background?: TreeBackground }[];
}
export interface RawPassiveTree {
  nodes: Record<string, RawTreeNode | null>;
  groups: Record<string, RawTreeGroup | null> | (RawTreeGroup | null)[];
  classes: RawTreeClass[];
  constants: { orbitRadii: number[]; orbitAnglesByOrbit: number[][]; skillsPerOrbit?: number[] };
  nodeOverlay: Record<string, TreeOverlay>;
  connectionArt?: Record<string, string>;
  min_x: number; max_x: number; min_y: number; max_y: number;
}
export interface PassiveTreeAsset { url: string; width: number; height: number; x?: number; y?: number; mime?: string }
export interface PassiveTreeData {
  version: string; tree: RawPassiveTree; assets: Record<string, PassiveTreeAsset>;
  source: { project: string; commit: string; treeSha256: string };
}
