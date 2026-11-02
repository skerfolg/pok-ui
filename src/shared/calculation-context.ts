import type { BuildDocument,Calculation } from './contracts';

export interface CalculationProvenance {
  buildId: string;
  revision: number;
  xmlSha256: string;
  bundleId: string;
  pobCommit: string;
  kbDigest?: string;
  pokSourceDigest?: string;
  runtime?: 'pob' | 'pok';
  mode: 'xml' | 'restored-spec';
}

/** A saved number is current only for this document and the verified runtime bundle. */
export function isCalculationCurrent(build: BuildDocument, bundleId?: string, xmlSha256?: string): boolean {
  const calculation = build.calculation;
  const source = calculation?.provenance;
  return Boolean(calculation && calculation.result.ok !== false && source && bundleId && xmlSha256
    && source.buildId === build.id && source.revision === build.revision
    && calculation.revision === build.revision && source.bundleId === bundleId
    && source.xmlSha256 === xmlSha256);
}

export async function hashBuildXml(xml: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(xml));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

/** Keep edit evidence for identical inputs without reusing any prior measured values. */
export function preserveWorkspaceEvidence(previous:Calculation|undefined,next:Calculation):Calculation{
  if(!previous||next.result.workspace_operation!==undefined||next.result.workspace_operation_source!==undefined)return next;
  const a=previous.provenance,b=next.provenance;
  if(!a||!b||!a.buildId||!a.xmlSha256||!a.bundleId||!a.pobCommit||(['buildId','xmlSha256','bundleId','pobCommit','runtime','mode','kbDigest','pokSourceDigest'] as const).some(key=>a[key]!==b[key]))return next;
  const source=previous.result.workspace_operation_source??(previous.result.workspace_operation!==undefined?{revision:previous.revision,operation:previous.result.workspace_operation}:undefined);
  return source===undefined?next:{...next,result:{...next.result,workspace_operation_source:structuredClone(source)}};
}
