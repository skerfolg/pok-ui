import {useEffect,useState} from 'react';
import {loadDisplayTree,type LoadedTree} from '../state/passive-tree-resource';
export function JewelLocation({runtimeId,version,nodeId}:{runtimeId:string;version:string;nodeId:number}){
  const [loaded,setLoaded]=useState<LoadedTree>(),[error,setError]=useState('');
  useEffect(()=>{let alive=true;void loadDisplayTree(runtimeId,version).then(value=>{if(alive)setLoaded(value);}).catch(reason=>{if(alive)setError(String(reason));});return()=>{alive=false;};},[runtimeId,version]);
  const graph=loaded?.graph,node=graph?.nodes.get(nodeId),bounds=graph?.bounds;
  const radius=bounds?Math.max(bounds.maxX-bounds.minX,bounds.maxY-bounds.minY)*.035:300;
  return <div className="jewel-location"><strong>원본 트리 {version} · 소켓 {nodeId}</strong>{bounds&&node?<svg viewBox={`${bounds.minX-500} ${bounds.minY-500} ${bounds.maxX-bounds.minX+1000} ${bounds.maxY-bounds.minY+1000}`} role="img" aria-label={`소켓 ${nodeId} 트리 위치`}>{graph!.edges.filter(e=>e.draw).map(e=><line key={e.key} x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y} stroke="currentColor" strokeWidth={22} opacity={.2}/>)}{[...graph!.nodes.values()].filter(n=>n.kind==='Socket').map(n=><circle key={n.id} cx={n.x} cy={n.y} r={65} fill="currentColor" opacity={.5}/>)}<circle cx={node.x} cy={node.y} r={radius} fill="var(--color-positive)" fillOpacity={.12} stroke="var(--color-positive)" strokeWidth={radius*.18}/><circle cx={node.x} cy={node.y} r={radius*.25} fill="var(--color-positive)"/></svg>:<p>{error||(!loaded?'원본 트리 위치 확인 중…':'이 소켓의 위치를 찾지 못했습니다.')}</p>}</div>;
}
