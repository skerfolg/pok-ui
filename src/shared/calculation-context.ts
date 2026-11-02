import type { BuildDocument } from './contracts';

export interface LegacyCalculationProvenance {
  buildId: string;
  revision: number;
  xmlSha256: string;
  bundleId: string;
  pobCommit: string;
  kbDigest: string;
  pokSourceDigest: string;
  mode: 'xml' | 'restored-spec';
}

export interface ManualCalculationProvenance {
  format: 'pob-worker-xml.v1';
  buildId: string;
  revision: number;
  xmlSha256: string;
  submittedXmlSha256: string;
  bundleId: string;
  pobCommit: string;
  workerIdentitySha256: string;
  workerInstance: string;
  mode: 'xml';
}
export type CalculationProvenance = LegacyCalculationProvenance | ManualCalculationProvenance;

/** A saved number is current only for this document and the verified runtime bundle. */
export function isCalculationCurrent(build: BuildDocument, bundleId?: string, xmlSha256?: string, worker?:{expectedIdentitySha256:string;observedIdentitySha256?:string;workerInstance?:string}): boolean {
  const calculation = build.calculation;
  const source = calculation?.provenance;
  const manual=source&&'format' in source&&source.format==='pob-worker-xml.v1'?source:undefined;
  if(worker){
    if(!manual||!worker.workerInstance||worker.expectedIdentitySha256!==worker.observedIdentitySha256||manual.workerIdentitySha256!==worker.expectedIdentitySha256||manual.workerInstance!==worker.workerInstance)return false;
  }else if(manual)return false;
  if(source&&'format' in source&&!manual)return false;
  return Boolean(calculation && calculation.result.ok !== false && source && bundleId && xmlSha256
    && source.buildId === build.id && source.revision === build.revision
    && calculation.revision === build.revision && source.bundleId === bundleId
    && source.xmlSha256 === xmlSha256);
}

export async function hashBuildXml(xml: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(xml));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
