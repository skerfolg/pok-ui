export type CatalogEntryType = 'base' | 'unique' | 'mod' | 'gem' | 'skill';

export interface RuntimeIdentity {
  apiVersion: 1;
  pok: { version: string; sourceCommit: string; sourceDigest: string };
  pob: { commit: string; sourceDigest: string };
  kb: { manifestSha256: string; contentSha256: string; patch: string };
  capabilities: { computeXml: boolean; renderItem: boolean; catalogExport: boolean };
}

export type RuntimeMode = 'bundled' | 'checkout';

export interface CatalogClass {
  id: string;
  internalId: number;
  legacyId: number;
  name: string;
  startNodeId?: string;
  ascendancies: { id: string; name: string; legacyId: number }[];
}

export interface CatalogEntry {
  id: string;
  type: CatalogEntryType;
  name: string;
  category?: string;
  subType?: string;
  raw: Record<string, unknown>;
  variants?: { id: string; name: string }[];
  gemId?: string;
  gameId?: string;
  levels?: number[];
}

export interface CatalogExport {
  schemaVersion: 1;
  extractorVersion: '1';
  defaultTreeVersion: string;
  supportedTreeVersions: string[];
  classes: CatalogClass[];
  entries: CatalogEntry[];
  source: {
    pobCommit: string;
    pokSourceDigest: string;
    pobSourceDigest: string;
    kbManifestSha256: string;
    kbContentSha256: string;
    exporterVersion: '1';
  };
  diagnostics: unknown[];
}

export interface DataBundleInfo {
  status: 'ready' | 'missing' | 'corrupt';
  bundleId?: string;
  runtimeMode?: RuntimeMode;
  identity?: RuntimeIdentity;
  defaultTreeVersion?: string;
  supportedTreeVersions?: string[];
  classes?: CatalogClass[];
  catalog?: {
    schemaVersion: 1;
    extractorVersion: '1';
    entries: number;
    classes: number;
    digest: string;
    diagnostics?: number;
  };
  error?: string;
}

export interface CatalogQuery {
  type?: CatalogEntryType;
  query?: string;
  category?: string;
  offset?: number;
  limit?: number;
}

export interface CatalogQueryResult {
  total: number;
  offset: number;
  limit: number;
  entries: CatalogEntry[];
}

export interface ItemRenderRequest {
  kind: 'base' | 'unique' | 'rare';
  id: string;
  name?: string;
  variants?: string[];
  mods?: string[];
  rolls?: Record<string, number>;
  quality?: number;
}

export interface ItemRenderResult {
  ok: boolean;
  text?: string;
  reason?: string;
  diagnostics?: unknown[];
}

export interface EngineVerification {
  ok: boolean;
  reason?: string;
  expected: RuntimeIdentity;
  actual?: unknown;
}
