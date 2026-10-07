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
  parseBuild(b.xml);
}
export function importDocument(fileName: string, contents: string): BuildDocument {
  if (Buffer.byteLength(contents) > MAX_XML * 3) throw new Error('가져오기 파일이 너무 큽니다.');
  const extension = extname(fileName).toLowerCase();
  if (extension === '.json') {
    const value = JSON.parse(contents);
    if (value.schemaVersion !== 1 || !value.build) throw new Error('POK 편집 문서 v1 형식이 필요합니다.');
    validateBuild(value.build);
    const result = createBuildDocument(value.build.name, value.build.xml, basename(fileName));
    return { ...result, originalXml: value.build.originalXml };
  }
  const xml = extension === '.xml' || contents.trimStart().startsWith('<') ? contents : decodePob(contents);
  parseBuild(xml);
  return createBuildDocument(basename(fileName, extension), xml, basename(fileName));
}
export function exportDocument(build: BuildDocument, format: 'xml'|'pob'|'json'): string {
  validateBuild(build);
  if (format === 'xml') return build.xml;
  if (format === 'pob') return encodePob(build.xml);
  if (format === 'json') return JSON.stringify({ schemaVersion: 1, build }, null, 2);
  throw new Error('지원하지 않는 내보내기 형식입니다.');
}
