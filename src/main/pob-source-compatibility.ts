import {lstat,realpath} from 'node:fs/promises';
import {isAbsolute,join,relative} from 'node:path';
import {sha256File} from '../../scripts/file-integrity.mjs';
export interface PobSourceProof {runtimeId:string;commit:string;files:Record<string,string>}
const anchors=['src/HeadlessWrapper.lua','src/GameVersions.lua','src/Modules/Calcs.lua'];
export function validatePobSourceProof(proof:PobSourceProof):void{
  if(!/^[a-f0-9]{40}$/.test(proof.commit)||!/^pob-[a-f0-9]{64}$/.test(proof.runtimeId)||!anchors.every(path=>proof.files[path]))throw new Error('독립 PoB 원본 파일 근거가 부족합니다.');
  for(const [path,hash]of Object.entries(proof.files))if(!path.startsWith('src/')||path.split(/[\\/]/).some(part=>!part||part==='.'||part==='..')||path.includes('\\')||/[:\x00]/.test(path)||! /^[a-f0-9]{64}$/.test(hash))throw new Error('독립 PoB 원본 파일 근거의 경로·해시가 올바르지 않습니다.');
}
export function assertPobSourceFiles(proof:PobSourceProof,commit:string,files:Record<string,string>):void{
  validatePobSourceProof(proof);
  if(proof.commit!==commit)throw new Error('선택 PoK와 독립 편집기의 PoB 커밋이 다릅니다. 수동 PoB 작업은 계속 사용할 수 있습니다.');
  for(const [path,hash]of Object.entries(proof.files))if(files[path]!==hash)throw new Error('선택 PoK와 독립 PoB의 원본 파일이 다르거나 확인되지 않았습니다: '+path);
}
export function pobSourceCandidates(commit:string):string[]{return[`external/pob/${commit}`,`external/pob/${commit.slice(0,7)}`,'external/pob','external/PathOfBuilding-PoE2','pob','resources/pob','PathOfBuilding-PoE2'];}
/** Prepared engine files have already passed the bundle's full byte verification. */
export function assertBundledPobSource(proof:PobSourceProof,commit:string,files:Record<string,string>):void{
  validatePobSourceProof(proof);
  const candidates=pobSourceCandidates(commit).filter(prefix=>anchors.every(path=>files[prefix+'/'+path]));
  if(candidates.length!==1)throw new Error('PoK 묶음의 PoB 원본 위치 근거가 없거나 여러 개입니다. 같은 원본으로 묶음을 다시 준비해 주세요.');
  const prefix=candidates[0]+'/',source=Object.fromEntries(Object.entries(files).filter(([path])=>path.startsWith(prefix)).map(([path,hash])=>[path.slice(prefix.length),hash]));
  assertPobSourceFiles(proof,commit,source);
}
export async function assertCheckoutPobSource(proof:PobSourceProof,commit:string,root:string):Promise<void>{
  validatePobSourceProof(proof);if(proof.commit!==commit)assertPobSourceFiles(proof,commit,{});
  const candidates:string[]=[];
  for(const prefix of pobSourceCandidates(commit)){
    const candidate=join(root,prefix);let found=true;
    for(const path of anchors){try{if(!(await lstat(join(candidate,path))).isFile())found=false;}catch{found=false;}}
    if(found)candidates.push(candidate);
  }
  if(candidates.length!==1)throw new Error('선택 PoK의 PoB 원본 위치가 없거나 여러 개입니다. 원본을 하나로 준비해 주세요.');
  const base=await realpath(candidates[0]),actual:Record<string,string>={};
  const entries=Object.entries(proof.files);
  for(let start=0;start<entries.length;start+=24)await Promise.all(entries.slice(start,start+24).map(async([path])=>{
    const target=join(base,path),resolved=await realpath(target),part=relative(base,resolved),before=await lstat(target);
    if(isAbsolute(part)||part==='..'||part.startsWith('..\\')||part.startsWith('../')||!before.isFile()||before.isSymbolicLink())throw new Error('PoK 원본 파일이 확인된 폴더를 벗어나거나 일반 파일이 아닙니다: '+path);
    const hash=await sha256File(resolved),after=await lstat(target);
    if(before.size!==after.size||before.mtimeMs!==after.mtimeMs||before.ctimeMs!==after.ctimeMs)throw new Error('PoK 원본을 확인하는 동안 파일이 변경됐습니다: '+path);
    actual[path]=hash;
  }));
  assertPobSourceFiles(proof,commit,actual);
}
