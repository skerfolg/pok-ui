import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogAccess} from '../src/shared/catalog-access';
import type {DataBundleInfo} from '../src/shared/game-data';
import type {PobRuntimeInfo} from '../src/shared/pob-runtime';
import {createBlankXml,editBuild,unsupportedTreeVersions} from '../src/shared/pob-document';
import {DOMParser,XMLSerializer} from '@xmldom/xmldom';
const data:DataBundleInfo={status:'ready',source:'pob',runtimeId:'pinned-runtime',pobCommit:'pinned-commit',defaultTreeVersion:'0_5',supportedTreeVersions:['0_1','0_2','0_3','0_4','0_5']},runtime:PobRuntimeInfo={status:'ready',runtimeId:'pinned-runtime',commit:'pinned-commit',supportedTreeVersions:['0_1','0_2','0_3','0_4','0_5']};
test('same original PoB catalogue supports every shipped tree rather than only its new-build default',()=>{
  for(const version of data.supportedTreeVersions!)assert.deepEqual(catalogAccess(data,runtime,version),{enabled:true});
  assert.deepEqual(catalogAccess({...data,defaultTreeVersion:'0_3'},runtime,'0_1'),{enabled:true});
});
test('missing/corrupt/mismatched sources and unsupported or unspecified trees stay blocked with their actual reason',()=>{
  for(const altered of [{...data,status:'missing' as const},{...data,status:'corrupt' as const},{...data,source:'pok' as const},{...data,runtimeId:undefined},{...data,pobCommit:undefined},{...data,runtimeId:'different'},{...data,pobCommit:'different'},{...data,supportedTreeVersions:['0_5']}])assert.equal(catalogAccess(altered,runtime,'0_1').enabled,false);
  for(const altered of [{...runtime,status:'missing' as const},{...runtime,status:'corrupt' as const},{...runtime,runtimeId:'different'},{...runtime,commit:'different'},{...runtime,supportedTreeVersions:['0_5']}])assert.equal(catalogAccess(data,altered,'0_1').enabled,false);
  assert.match(catalogAccess(data,runtime,'9_99').reason!,/9_99/);assert.match(catalogAccess(data,runtime).reason!,/트리 버전/);assert.match(catalogAccess({...data,runtimeId:'different'},runtime,'0_1').reason!,/출처/);
});

test('unsupported inactive trees are identified before native loading and source XML is not rewritten to the default',()=>{
  let xml=createBlankXml({defaultTreeVersion:'0_5'});xml=editBuild(xml,{type:'set-add',kind:'tree',title:'Unsupported inactive',copyFrom:'1'});xml=editBuild(xml,{type:'active-set',kind:'tree',id:'1'});const doc=new DOMParser().parseFromString(xml,'application/xml');doc.getElementsByTagName('Spec')[1].setAttribute('treeVersion','9_99');xml=new XMLSerializer().serializeToString(doc);
  assert.deepEqual(unsupportedTreeVersions(xml,['0_5']),[{id:'2',version:'9_99'}]);assert(xml.includes('9_99'));assert.equal(unsupportedTreeVersions(createBlankXml({defaultTreeVersion:'0_5'}),['0_5']).length,0);
  doc.getElementsByTagName('Spec')[1].removeAttribute('treeVersion');doc.getElementsByTagName('Build')[0].setAttribute('targetVersion','9_99');assert.deepEqual(unsupportedTreeVersions(new XMLSerializer().serializeToString(doc),['0_5']),[]);
});
