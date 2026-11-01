import {createDefaultState} from '../src/shared/state';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createBuildDocument } from '../src/shared/state';
import { applyInputProposal,undoInputSnapshot,applyManualXml,reconcileAppliedBuild,type VersionedBuildDocument,type DesignRecordSnapshot } from '../src/shared/build-revision';
const xml='<PathOfBuilding2><Build level="90" className="Sorceress" ascendClassName="Stormweaver"/><Unknown value="retained"/></PathOfBuilding2>';
const hash='sha256:'+'a'.repeat(64),other='sha256:'+'b'.repeat(64);
function design(revision=hash):DesignRecordSnapshot{return {recordJson:'{"format":"pok.design-record.v1","revision":"'+revision+'","large":9007199254740993,"number":1e+01}',recordRef:{format:'pok.design-ref.v1',artifact_id:'fixture',revision,sha256:hash,manifest_sha256:hash},markdown:'fixture',xmlSha256:hash};}
function build():VersionedBuildDocument{return {...createBuildDocument('fixture',xml),documentSchemaVersion:2,undo:[],design:design(),acquisitionMetadataJson:'{"raw":9007199254740993}'};}
test('XML, design and acquisition metadata apply and undo together without numeric reserialization',()=>{
 const original=build(),nextXml=xml.replace('90','91');
 const updated=applyInputProposal(original,{buildId:original.id,baseRevision:0,baseDesignRevision:hash,inputs:{xml:nextXml,design:design(other),acquisitionMetadataJson:'{"raw":1e+01}'},summary:'package'});
 assert.equal(original.revision,0);assert.equal(original.xml,xml);
 assert.equal(updated.revision,1);assert.equal(updated.design?.recordRef.revision,other);
 const restored=undoInputSnapshot(updated);
 assert.equal(restored.revision,2);assert.equal(restored.xml,xml);
 assert.equal(restored.design?.recordJson,original.design?.recordJson);
 assert.equal(restored.acquisitionMetadataJson,original.acquisitionMetadataJson);
});
test('stale design or build revision rejects the whole proposal',()=>{
 const original=build();
 for(const proposal of [{buildId:original.id,baseRevision:1,baseDesignRevision:hash},{buildId:original.id,baseRevision:0,baseDesignRevision:other}]){
  assert.throws(()=>applyInputProposal(original,{...proposal,inputs:{xml:xml.replace('90','91'),design:design(other)},summary:'stale'}));
 }
 assert.equal(original.xml,xml);assert.equal(original.design?.recordRef.revision,hash);assert.equal(original.undo.length,0);
});
test('invalid record blocks XML half-application',()=>{
 const original=build(),bad=design(other);bad.recordJson='invalid';
 assert.throws(()=>applyInputProposal(original,{buildId:original.id,baseRevision:0,baseDesignRevision:hash,inputs:{xml:xml.replace('90','91'),design:bad},summary:'invalid'}));
 assert.equal(original.xml,xml);assert.equal(original.undo.length,0);
});
test('manual edit preserves historical design JSON and hash for later revalidation',()=>{
 const original=build(),edited=applyManualXml(original,xml.replace('90','92'),'manual');
 assert.deepEqual(edited.design,original.design);assert.equal(undoInputSnapshot(edited).xml,xml);
});

test('design replacement requires an explicit base and safe revision counter',()=>{
 const original=build();
 assert.throws(()=>applyInputProposal(original,{buildId:original.id,baseRevision:0,baseDesignRevision:null,inputs:{xml,design:design(other)},summary:'wrong base'}));
 const exhausted={...original,revision:Number.MAX_SAFE_INTEGER};
 assert.throws(()=>applyManualXml(exhausted,xml.replace('90','91'),'overflow'));
});

test('removing a design is atomic and undo restores its original bytes',()=>{
 const original=build();
 const changed=applyInputProposal(original,{buildId:original.id,baseRevision:0,baseDesignRevision:hash,inputs:{xml},summary:'detach'});
 assert.equal(changed.design,undefined);assert.equal(changed.acquisitionMetadataJson,undefined);
 const restored=undoInputSnapshot(changed);
 assert.equal(restored.design?.recordJson,original.design?.recordJson);
 assert.equal(restored.acquisitionMetadataJson,original.acquisitionMetadataJson);
});
test('an identical input proposal does not create a revision or undo entry',()=>{
 const original=build();
 const same=applyInputProposal(original,{buildId:original.id,baseRevision:0,baseDesignRevision:hash,inputs:{xml,design:structuredClone(original.design),acquisitionMetadataJson:original.acquisitionMetadataJson},summary:'same'});
 assert.equal(same,original);assert.equal(same.undo.length,0);
});

test('acquisition metadata accepts objects only and cannot half-apply XML',()=>{
 const original=build();
 for(const raw of ['null','[]','1','"string"'])assert.throws(()=>applyInputProposal(original,{buildId:original.id,baseRevision:0,baseDesignRevision:hash,inputs:{xml:xml.replace('90','91'),acquisitionMetadataJson:raw},summary:'invalid metadata'}),/JSON 객체/);
 assert.equal(original.revision,0);assert.equal(original.xml,xml);
});

test('a delayed applied proposal preserves simultaneous manual changes in a separate draft',()=>{
 const original=build(),local=applyManualXml(original,xml.replace('90','91'),'manual');
 const applied=applyManualXml(original,xml.replace('90','92'),'AI');
 const state={...createDefaultState(),builds:[local],activeBuildId:local.id};
 const result=reconcileAppliedBuild(state,applied,original.revision);
 assert.equal(result.state.builds.find(b=>b.id===applied.id)?.xml,applied.xml);
 assert.equal(result.forked?.xml,local.xml);assert.notEqual(result.forked?.id,local.id);
 assert.equal(result.forked?.design?.recordJson,local.design?.recordJson);
 assert.equal(result.state.activeBuildId,result.forked?.id);
 assert.equal(state.builds.length,1);assert.equal(state.builds[0].xml,local.xml);
 const normal=reconcileAppliedBuild({...state,builds:[original]},applied,original.revision);
 assert.equal(normal.forked,undefined);assert.equal(normal.state.builds.length,1);
});
