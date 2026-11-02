import { createHash } from 'node:crypto';
import { assertDesignSnapshot, type DesignRecordReference, type DesignRecordSnapshot } from '../shared/build-revision';

function object(value:unknown):Record<string,unknown> {
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('설계 조회 응답이 객체가 아닙니다.');
  return value as Record<string,unknown>;
}
// The engine checks the immutable manifest and evidence. This consumer verifies
// exact transported record bytes/reference and never promotes an assessment to
// game feasibility or a calculation of the currently open XML.
export function designSnapshotFromResult(value:unknown,expected:DesignRecordReference):DesignRecordSnapshot {
  const result=object(value),reference=object(result.record_ref);
  const keys=['format','artifact_id','revision','sha256','manifest_sha256'] as const;
  if(Object.keys(reference).length!==keys.length||keys.some(key=>reference[key]!==expected[key]))throw new Error('조회한 설계 참조가 요청과 다릅니다.');
  if(typeof result.record_json!=='string'||typeof result.design_md!=='string')throw new Error('설계 원문이나 문서가 없습니다.');
  const digest='sha256:'+createHash('sha256').update(result.record_json,'utf8').digest('hex');
  if(digest!==expected.sha256)throw new Error('설계 원문 해시가 참조와 다릅니다.');
  const record=object(JSON.parse(result.record_json)),assessment=object(result.current_assessment);
  if(assessment.revision!==record.revision||assessment.design_id!==record.design_id)throw new Error('검증 보고서가 다른 설계 리비전에 속합니다.');
  const snapshot:DesignRecordSnapshot={recordJson:result.record_json,recordRef:structuredClone(expected),markdown:result.design_md,assessmentJson:JSON.stringify(assessment)};
  const material=object(assessment.material_assessment);
  if(material.status==='verified_blobs'&&typeof material.xml_sha256==='string'){
    const declared=object(object(record.material).xml);
    if(declared.sha256!==material.xml_sha256)throw new Error('검증 보고서의 XML 입력이 설계와 다릅니다.');
    snapshot.xmlSha256=material.xml_sha256;
  }
  if(material.status==='verified_blobs'&&record.material&&object(record.material).metadata){snapshot.acquisitionSha256=String(object(object(record.material).metadata).sha256);}
  assertLocalDesignIntegrity(snapshot);
  return snapshot;
}

export function assertLocalDesignIntegrity(snapshot:DesignRecordSnapshot):void {
  assertDesignSnapshot(snapshot);
  const digest='sha256:'+createHash('sha256').update(snapshot.recordJson,'utf8').digest('hex');
  if(digest!==snapshot.recordRef.sha256)throw new Error('저장된 설계 원문 해시가 참조와 다릅니다.');
  const record=object(JSON.parse(snapshot.recordJson));
  for(const [field,component] of [['xmlSha256','xml'],['acquisitionSha256','metadata']] as const){
    if(snapshot[field]!==undefined&&snapshot[field]!==object(object(record.material)[component]).sha256)throw new Error('저장된 설계 입력 해시가 원문 선언과 다릅니다.');
  }
}
