import type {BuildDocument,BuildEdit,BuildSetKind,Calculation} from './contracts';
import {editBuild,parseBuild} from './pob-document';
export interface BuildSelection {items?:string;skills?:string;tree?:string;config?:string}
export interface ComparisonSide {snapshot:BuildDocument;selection:BuildSelection;treeIdentity?:{className:string;ascendClassName:string};calculation?:Calculation;error?:string}
export interface BuildComparison {id:string;at:string;left:ComparisonSide;right:ComparisonSide}
export function comparisonSnapshot(build:BuildDocument):BuildDocument{
  const {id,name,revision,createdAt,updatedAt,xml,sourceName,folder}=build;
  return{id,name,revision,createdAt,updatedAt,xml,originalXml:xml,sourceName,folder,undo:[]};
}
export function activeSelection(build:BuildDocument):BuildSelection{
  const parsed=parseBuild(build.xml);return{items:parsed.itemSets.find(s=>s.active)?.id,skills:parsed.skillSets.find(s=>s.active)?.id,tree:parsed.trees.find(s=>s.active)?.id,config:parsed.configs.find(s=>s.active)?.id};
}
export function selectionEdit(selection:BuildSelection):BuildEdit{return{type:'batch',edits:(Object.entries(selection) as [BuildSetKind,string|undefined][]).filter((entry):entry is [BuildSetKind,string]=>Boolean(entry[1])).map(([kind,id])=>({type:'active-set',kind,id}))};}
export function projectSelection(build:BuildDocument,selection:BuildSelection):BuildDocument{return{...build,xml:editBuild(build.xml,selectionEdit(selection))};}
export function projectComparisonSide(side:ComparisonSide):BuildDocument{
  const projected=projectSelection(side.snapshot,side.selection);
  if(!side.treeIdentity)return projected;
  if(Object.keys(side.treeIdentity).some(key=>!['className','ascendClassName'].includes(key))||typeof side.treeIdentity.className!=='string'||typeof side.treeIdentity.ascendClassName!=='string'||side.treeIdentity.className.length>200||side.treeIdentity.ascendClassName.length>200)throw new Error('비교 직업 정보가 올바르지 않습니다.');
  const active=parseBuild(projected.xml).trees.find(tree=>tree.active);if(!active)throw new Error('비교할 활성 트리가 없습니다.');
  return{...projected,xml:editBuild(projected.xml,{type:'tree-native-patch',specId:active.id,patch:{attributes:{},buildAttributes:side.treeIdentity}})};
}
export function comparisonNumbers(comparison:BuildComparison):{key:string;left?:number;right?:number;delta?:number;percent?:number}[]{
  const numbers=(side:ComparisonSide)=>(side.calculation?.result.stats||{}) as Record<string,unknown>;
  const a=numbers(comparison.left),b=numbers(comparison.right);
  return[...new Set([...Object.keys(a),...Object.keys(b)])].sort().map(key=>{
    const left=typeof a[key]==='number'&&Number.isFinite(a[key])?a[key] as number:undefined,right=typeof b[key]==='number'&&Number.isFinite(b[key])?b[key] as number:undefined;
    return{key,left,right,...(left!==undefined&&right!==undefined?{delta:right-left,...(left!==0?{percent:(right-left)/Math.abs(left)*100}:{})}:{})};
  });
}
