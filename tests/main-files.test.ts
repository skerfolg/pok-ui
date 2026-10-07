import test from 'node:test';
import assert from 'node:assert/strict';
import { decodePob, encodePob, importDocument, exportDocument } from '../src/main/pob-files';
import { createBlankXml } from '../src/shared/pob-document';

test('PoB compression preserves the exact XML including attribute whitespace and unknown elements',()=>{
  const xml=createBlankXml().replace('</PathOfBuilding2>','<Notes custom="a\nb\tc">원본 &amp; 텍스트</Notes></PathOfBuilding2>');
  assert.equal(decodePob(encodePob(xml)),xml);
  const doc=importDocument('example.xml',xml);
  assert.equal(doc.originalXml,xml);
  assert.equal(exportDocument(doc,'xml'),xml);
  assert.equal(decodePob(exportDocument(doc,'pob')),xml);
});
test('POK document import gets a new identity while retaining the original XML',()=>{
  const xml=createBlankXml();const first=importDocument('sample.xml',xml);
  const serialized=exportDocument(first,'json');
  const imported=importDocument('sample.json',serialized);
  assert.notEqual(imported.id,first.id);
  assert.equal(imported.xml,first.xml);assert.equal(imported.originalXml,first.originalXml);
});
test('invalid compressed data and foreign JSON are rejected',()=>{
  assert.throws(()=>decodePob('not a pob code'));
  assert.throws(()=>importDocument('bad.json','{"schemaVersion":5}'));
});
