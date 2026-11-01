import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {designSnapshotFromResult,assertLocalDesignIntegrity} from '../src/main/design-records';
import type {DesignRecordReference} from '../src/shared/build-revision';
const hash='sha256:'+'a'.repeat(64);
function fixture(){
 const raw='{"format":"pok.design-record.v1","design_id":"fixture","revision":"'+hash+'","material":null,"extensions":{"unknown":9007199254740993,"n":1e+01}}';
 const ref:DesignRecordReference={format:'pok.design-ref.v1',artifact_id:'fixture',revision:hash,sha256:'sha256:'+createHash('sha256').update(raw).digest('hex'),manifest_sha256:hash};
 return {ref,result:{record_ref:ref,record_json:raw,design_md:'fixture',current_assessment:{design_id:'fixture',revision:hash,material_assessment:{status:'unbound'},game_feasibility:'not_checked'}}};
}
test('transport preserves exact design JSON while unbound remains unbound',()=>{
 const {ref,result}=fixture(),snapshot=designSnapshotFromResult(result,ref);
 assert.equal(snapshot.recordJson,result.record_json);assert.equal(snapshot.xmlSha256,undefined);
 assert.equal(JSON.parse(snapshot.assessmentJson!).game_feasibility,'not_checked');
});
test('changed bytes, reference and assessment revision reject before attachment',()=>{
 const {ref,result}=fixture();
 assert.throws(()=>designSnapshotFromResult({...result,record_json:result.record_json+' '},ref),/해시/);
 assert.throws(()=>designSnapshotFromResult({...result,record_ref:{...ref,artifact_id:'other'}},ref),/참조/);
 assert.throws(()=>designSnapshotFromResult({...result,current_assessment:{...result.current_assessment,revision:'other'}},ref),/리비전/);
});
test('unavailable material never acquires an XML binding from an unverified hash',()=>{
 const {ref,result}=fixture();result.current_assessment.material_assessment={status:'unavailable',xml_sha256:hash} as typeof result.current_assessment.material_assessment;
 assert.equal(designSnapshotFromResult(result,ref).xmlSha256,undefined);
});

test('local design integrity rejects changed raw JSON even if the revision label remains unchanged',()=>{
 const {ref,result}=fixture(),snapshot=designSnapshotFromResult(result,ref);
 assert.doesNotThrow(()=>assertLocalDesignIntegrity(snapshot));
 assert.throws(()=>assertLocalDesignIntegrity({...snapshot,recordJson:snapshot.recordJson+' '}),/원문 해시/);
 assert.throws(()=>assertLocalDesignIntegrity({...snapshot,xmlSha256:hash}));
});
