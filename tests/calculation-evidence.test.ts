import test from 'node:test';
import assert from 'node:assert/strict';
import {preserveWorkspaceEvidence} from '../src/shared/calculation-context';
import type {Calculation} from '../src/shared/contracts';
function measured(revision:number,value:number):Calculation{return{revision,at:'synthetic',restoreNotes:[],provenance:{buildId:'synthetic',revision,xmlSha256:'same-input',bundleId:'same-runtime',pobCommit:'pinned',mode:'xml',runtime:'pob'},result:{ok:true,stats:{Life:value}}};}
test('remeasurement preserves source edit evidence for identical XML while using only new measured values and revision',()=>{
  const previous=measured(2,100),next=measured(4,200);previous.result.workspace_operation={kind:'tree-code-import',treeCode:{missingNodes:[65535]}};const output=preserveWorkspaceEvidence(previous,next);assert.equal(output.revision,4);assert.equal(output.provenance?.revision,4);assert.deepEqual(output.result.stats,{Life:200});assert.equal(output.result.workspace_operation,undefined);assert.deepEqual(output.result.workspace_operation_source,{revision:2,operation:previous.result.workspace_operation});assert.equal(next.result.workspace_operation_source,undefined);assert.notEqual((output.result.workspace_operation_source as {operation:unknown}).operation,previous.result.workspace_operation);const again=preserveWorkspaceEvidence(output,measured(4,300));assert.deepEqual(again.result.workspace_operation_source,output.result.workspace_operation_source);assert.deepEqual(again.result.stats,{Life:300});
});
test('different input/runtime/owner or a new explicit operation never inherits the previous edit evidence',()=>{
  const previous=measured(2,100);previous.result.workspace_operation={kind:'tree-code-import'};
  for(const key of ['buildId','xmlSha256','bundleId','pobCommit','runtime','mode','kbDigest','pokSourceDigest'] as const){const next=measured(3,200);Object.assign(next.provenance!,{[key]:'different'});assert.equal(preserveWorkspaceEvidence(previous,next),next);}
  const explicit=measured(3,200);explicit.result.workspace_operation={kind:'new-operation'};assert.equal(preserveWorkspaceEvidence(previous,explicit),explicit);assert.equal(preserveWorkspaceEvidence(undefined,explicit),explicit);
});
