import type {BuildDocument} from '../../shared/contracts';
import type {PobTreeResult} from '../../shared/pob-tree';
import {hashBuildXml} from '../../shared/calculation-context';
import {api} from '../services/api';
type Snapshot=Pick<BuildDocument,'id'|'revision'|'xml'>;
const reads=new Map<string,Promise<PobTreeResult>>();
let activeRuntime:string|undefined;
export async function readWorkspaceCharacter(build:Snapshot,runtimeId:string):Promise<PobTreeResult>{
  if(activeRuntime!==runtimeId){reads.clear();activeRuntime=runtimeId;}
  const hash=await hashBuildXml(build.xml),key=[runtimeId,build.id,build.revision,hash].join(':');
  const existing=reads.get(key);if(existing)return existing;
  const pending=api.editTree({buildId:build.id,revision:build.revision,xml:build.xml,runtimeId,action:'character'}).then(result=>{
    if(result.buildId!==build.id||result.revision!==build.revision||result.xmlSha256!==hash||result.runtimeId!==runtimeId)throw new Error('캐릭터 조회 입력·출처가 변경되었습니다.');return result;
  });reads.set(key,pending);if(reads.size>16)reads.delete(reads.keys().next().value!);
  void pending.catch(()=>{if(reads.get(key)===pending)reads.delete(key);});return pending;
}
