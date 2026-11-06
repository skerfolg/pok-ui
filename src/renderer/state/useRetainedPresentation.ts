import {useState} from 'react';

/** Display only. Never use retained results to authorize edits or label a calculation current.
 * Ownership excludes revision, but includes build/runtime and the selected entity/context.
 */
export function useRetainedPresentation<T>(owner:string,current:T|undefined):T|undefined{
  const [saved,setSaved]=useState({owner,value:current});
  if(saved.owner!==owner||(current!==undefined&&current!==saved.value)){
    setSaved({owner,value:current});
  }
  return current??(saved.owner===owner?saved.value:undefined);
}
