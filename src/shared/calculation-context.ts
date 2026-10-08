import type { BuildDocument } from './contracts';

export interface CalculationProvenance {
  buildId: string;
  revision: number;
  xmlSha256: string;
  bundleId: string;
  pobCommit: string;
  kbDigest: string;
  pokSourceDigest: string;
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
