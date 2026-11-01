import { assertLocalDesignIntegrity } from './design-records';
import { assertInputSnapshot } from '../shared/build-revision';
import { deflateSync, inflateSync } from 'node:zlib';
import { extname, basename } from 'node:path';
import type { BuildDocument } from '../shared/contracts';
import { createBuildDocument } from '../shared/state';
import { parseBuild } from '../shared/pob-document';

const MAX_XML = 24 * 1024 * 1024;
export function decodePob(code: string): string {
  const normalized = code.trim().replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) throw new Error('PoB 공유 코드 형식이 올바르지 않습니다.');
  return inflateSync(Buffer.from(normalized, 'base64'), { maxOutputLength: MAX_XML }).toString('utf8');
}
export function encodePob(xml: string): string {
  return deflateSync(Buffer.from(xml, 'utf8'), { level: 9 }).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}
export function validateBuild(value: unknown): asserts value is BuildDocument {
  const b = value as BuildDocument;
  if (!b || typeof b.xml !== 'string' || typeof b.originalXml !== 'string' ||
      typeof b.id !== 'string' || typeof b.name !== 'string' ||
      !Number.isSafeInteger(b.revision) || b.revision < 0 || !Array.isArray(b.undo)) throw new Error('빌드 문서 형식이 올바르지 않습니다.');
  if (Buffer.byteLength(b.xml) > MAX_XML || Buffer.byteLength(b.originalXml) > MAX_XML) throw new Error('XML은 24 MB를 넘을 수 없습니다.');
  assertInputSnapshot(b);if(b.design)assertLocalDesignIntegrity(b.design);
  for(const previous of b.undo){if(!previous||typeof previous.label!=='string')throw new Error('되돌리기 형식이 올바르지 않습니다.');assertInputSnapshot(previous);if(previous.design)assertLocalDesignIntegrity(previous.design);}
}
export function importDocument(fileName: string, contents: string): BuildDocument {
  if (Buffer.byteLength(contents) > MAX_XML * 3) throw new Error('가져오기 파일이 너무 큽니다.');
  const extension = extname(fileName).toLowerCase();
  if (extension === '.json') {
    const value = JSON.parse(contents);
    if (![1,2].includes(value.schemaVersion) || !value.build) throw new Error('POK 편집 문서 v1 또는 v2 형식이 필요합니다.');
    if(value.schemaVersion===1&&(value.build.design!==undefined||value.build.acquisitionMetadataJson!==undefined))throw new Error('v1 문서에 v2 입력이 있습니다.');
    if(value.schemaVersion===2&&value.build.documentSchemaVersion!==2)throw new Error('v2 빌드 문서 버전이 필요합니다.');
    validateBuild(value.build);
    const result = createBuildDocument(value.build.name, value.build.xml, basename(fileName));
    return { ...value.build, id:result.id, sourceName:result.sourceName, documentSchemaVersion:2 };
  }
  const xml = extension === '.xml' || contents.trimStart().startsWith('<') ? contents : decodePob(contents);
  parseBuild(xml);
  return createBuildDocument(basename(fileName, extension), xml, basename(fileName));
}
export function exportDocument(build: BuildDocument, format: 'xml'|'pob'|'json'): string {
  validateBuild(build);
  if (format === 'xml') return build.xml;
  if (format === 'pob') return encodePob(build.xml);
  if (format === 'json') return JSON.stringify({ schemaVersion: 2, build:{...build,documentSchemaVersion:2} }, null, 2);
  throw new Error('지원하지 않는 내보내기 형식입니다.');
}
