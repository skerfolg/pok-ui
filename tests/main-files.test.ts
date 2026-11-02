import { createHash } from 'node:crypto';
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

test('v2 JSON export and import preserve design and acquisition raw JSON including undo',()=>{
 const xml=createBlankXml(),doc=importDocument('source.xml',xml),hash='sha256:'+'a'.repeat(64);
 const raw='{"format":"pok.design-record.v1","revision":"'+hash+'","unknown":9007199254740993,"n":1e+01}';
 doc.design={recordJson:raw,recordRef:{format:'pok.design-ref.v1',artifact_id:'fixture',revision:hash,sha256:'sha256:'+createHash('sha256').update(raw,'utf8').digest('hex'),manifest_sha256:hash},markdown:'fixture'};
 doc.acquisitionMetadataJson='{"unknown":9007199254740993}';
 doc.undo=[{xml,label:'previous',design:structuredClone(doc.design),acquisitionMetadataJson:'{"n":1e+01}'}];
 const serialized=exportDocument(doc,'json');assert.equal(JSON.parse(serialized).schemaVersion,2);
 const restored=importDocument('export.json',serialized);
 assert.notEqual(restored.id,doc.id);assert.equal(restored.design?.recordJson,raw);
 assert.equal(restored.acquisitionMetadataJson,doc.acquisitionMetadataJson);
 assert.deepEqual(restored.undo,doc.undo);assert.equal(restored.originalXml,doc.originalXml);
});

test('JSON import rejects a changed design record instead of silently accepting its old reference',()=>{
 const doc=importDocument('fixture.xml',createBlankXml()),hash='sha256:'+'a'.repeat(64);
 const raw='{"format":"pok.design-record.v1","revision":"'+hash+'"}';
 doc.design={recordJson:raw,recordRef:{format:'pok.design-ref.v1',artifact_id:'fixture',revision:hash,sha256:'sha256:'+createHash('sha256').update(raw).digest('hex'),manifest_sha256:hash},markdown:'fixture'};
 const exported=JSON.parse(exportDocument(doc,'json'));exported.build.design.recordJson+=' ';
 assert.throws(()=>importDocument('changed.json',JSON.stringify(exported)),/원문 해시/);
});
