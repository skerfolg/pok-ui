import type {CatalogClass,CatalogEntry} from './game-data';
export interface PobEditorCatalog {
  schemaVersion:1;
  defaultTreeVersion:string;
  supportedTreeVersions:string[];
  classes:CatalogClass[];
  entries:CatalogEntry[];
  diagnostics:unknown[];
  source:{runtimeId:string;commit:string;version:string};
}
