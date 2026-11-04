import type {PassiveTreeData} from '../../shared/passive-tree';
import {normalizeTree,type DisplayTree} from '../features/passive-tree-geometry';
import {api} from '../services/api';
export interface LoadedTree {data:PassiveTreeData;graph:DisplayTree}
const trees=new Map<string,Promise<LoadedTree>>();
export function loadDisplayTree(runtimeId:string,version:string):Promise<LoadedTree>{
  const key=runtimeId+':'+version;
  if(!trees.has(key))trees.set(key,api.loadPassiveTree(version).then(data=>({data,graph:normalizeTree(data.tree)})).catch(error=>{trees.delete(key);throw error;}));
  return trees.get(key)!;
}
