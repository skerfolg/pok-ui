import {useEffect,useState} from 'react';
import {hashBuildXml as hashUtf8} from '../../shared/calculation-context';
// A completed digest belongs to exact bytes and document identity. Filtering in
// render closes the frame before effect cleanup runs after an input change.
export function useInputDigest(input:string|undefined,scope:string):{hash?:string;error?:string}{
 const [result,setResult]=useState<{input:string;scope:string;hash?:string;error?:string}>();
 useEffect(()=>{
  let active=true;
  if(input!==undefined)void hashUtf8(input).then(hash=>{if(active)setResult({input,scope,hash});}).catch(error=>{if(active)setResult({input,scope,error:String(error)});});
  return()=>{active=false;};
 },[input,scope]);
 return result?.scope===scope&&result?.input===input?{hash:result.hash,error:result.error}:{};
}
