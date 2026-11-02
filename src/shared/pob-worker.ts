import type { CatalogExport } from './game-data';

/** Standalone PoB producer identity. It is deliberately not the legacy PoK/KB identity. */
export interface PobWorkerIdentity {
  format: 'pok.pob-worker-identity.v1';
  runtime_kind: 'pob-worker';
  protocol: 'pok.pob-worker.v1';
  algorithm: 'relative-file-bytes-and-runtime-components.v1';
  pob_commit: string;
  adapter_sources_sha256: string;
  adapter_lua_sha256: string;
  pob_source_sha256: string;
  pob_runtime_sha256: string;
  lua_executable_sha256: string;
  python_executable_sha256: string;
  python_version: string;
  platform: string;
  claim: string;
  loaded_native_modules: 'not_verified';
  external_system_libraries: 'not_verified';
  sha256: string;
}

export interface WorkerProvenance {
  mode: 'development' | 'bundled';
  bundle_manifest_verified: boolean;
  bundle_manifest_sha256?: string | null;
  pob_commit_origin: string;
}

export interface WorkerCalculation {
  xml_revision: string;
  stats: Record<string, number | null>;
  missing_stats: string[];
  meta: Record<string, unknown>;
  allocated_nodes: number[];
  identity: PobWorkerIdentity;
  claim: 'native_calculation_not_game_validation';
  execution: Record<string, unknown>;
  wire_normalizations?: {path: string; value: string; serialized_as: 'null'}[];
}

export type WorkerCatalog = Omit<CatalogExport, 'schemaVersion' | 'extractorVersion' | 'source'> & {
  schemaVersion: 2;
  extractorVersion: '2';
  source: {
    format: 'pok.pob-catalog-source.v2';
    identity: PobWorkerIdentity;
    identitySha256: string;
    pobCommit: string;
    exporterVersion: '2';
  };
};
