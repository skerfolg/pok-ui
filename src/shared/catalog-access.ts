import type {DataBundleInfo} from './game-data';
import type {PobRuntimeInfo} from './pob-runtime';

/** A default tree is a creation default, not a separate item/gem data version. */
export function catalogAccess(data:DataBundleInfo,runtime:PobRuntimeInfo,treeVersion?:string):{enabled:boolean;reason?:string}{
  if(data.status!=='ready')return{enabled:false,reason:data.error||'고정 PoB 카탈로그를 준비해 주세요.'};
  if(runtime.status!=='ready')return{enabled:false,reason:runtime.error||'독립 PoB 런타임을 준비해 주세요.'};
  if(data.source!=='pob'||!data.runtimeId||!data.pobCommit||data.runtimeId!==runtime.runtimeId||data.pobCommit!==runtime.commit)return{enabled:false,reason:'카탈로그와 독립 PoB의 출처가 다릅니다. 같은 런타임으로 편집 데이터를 다시 준비해 주세요.'};
  if(!treeVersion)return{enabled:false,reason:'트리 버전을 지정한 뒤 카탈로그를 적용할 수 있습니다. 초기 생성·원문 편집은 별도로 사용할 수 있습니다.'};
  if(!data.supportedTreeVersions?.includes(treeVersion)||!runtime.supportedTreeVersions?.includes(treeVersion))return{enabled:false,reason:`현재 고정 PoB는 트리 ${treeVersion}의 카탈로그 작업을 지원하지 않습니다. 원문은 보존됩니다.`};
  return{enabled:true};
}
