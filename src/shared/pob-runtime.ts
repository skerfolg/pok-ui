export interface PobRuntimeInfo {
  status:'ready'|'missing'|'corrupt';
  runtimeId?:string;
  commit?:string;
  version?:string;
  supportedTreeVersions?:string[];
  error?:string;
}

export interface PobSummaryTarget {mode:'MAIN';group?:number;groupLabel:string;effectId?:string;effectName?:string;slot?:string}
export interface PobInputDiagnostic {code:'item-unparsed-lines';kind:'item';itemId?:string;slot:string;label:string;lines:string[];message:string}
export function isPobSummaryTarget(value:unknown):value is PobSummaryTarget {
  const target=value as PobSummaryTarget|undefined;
  return Boolean(target&&target.mode==='MAIN'&&typeof target.groupLabel==='string'&&(target.group===undefined||Number.isSafeInteger(target.group)&&target.group>=0)&&[target.effectId,target.effectName,target.slot].every(value=>value===undefined||typeof value==='string'));
}
export function isPobInputDiagnostic(value:unknown):value is PobInputDiagnostic {
  const diagnostic=value as PobInputDiagnostic|undefined;
  return Boolean(diagnostic&&diagnostic.code==='item-unparsed-lines'&&diagnostic.kind==='item'&&(diagnostic.itemId===undefined||typeof diagnostic.itemId==='string'&&/^\d+$/.test(diagnostic.itemId))&&typeof diagnostic.slot==='string'&&typeof diagnostic.label==='string'&&typeof diagnostic.message==='string'&&Array.isArray(diagnostic.lines)&&diagnostic.lines.every(line=>typeof line==='string'));
}
