import test from 'node:test';
import assert from 'node:assert/strict';
import { BuildProposals, xmlHash } from '../src/main/build-proposals';
import { hashBuildXml, isCalculationCurrent } from '../src/shared/calculation-context';
import { createBuildDocument } from '../src/shared/state';
import { createBlankXml } from '../src/shared/pob-document';
import { editBuild, parseBuild } from '../src/shared/pob-document';
import type { BuildProposalDraft } from '../src/shared/contracts';

function fixture() {
  const build = createBuildDocument('Synthetic', createBlankXml());
  const draft: BuildProposalDraft = { buildId: build.id, baseRevision: build.revision,
    baseXmlSha256: xmlHash(build.xml), bundleId: 'bundle-a', xml: build.xml.replace('level="1"', 'level="2"'), summary: 'Level' };
  return { build, draft };
}
test('proposal host validates document hash and bundle even when revision is unchanged', () => {
  const {build,draft}=fixture(); const proposals=new BuildProposals();
  const proposal=proposals.register(draft,build,'bundle-a');
  assert.throws(()=>proposals.prepare(proposal.proposalId,build,'bundle-b'),/버전/);
  assert.throws(()=>proposals.prepare(proposal.proposalId,{...build,xml:draft.xml},'bundle-a'),/변경/);
  const next=proposals.prepare(proposal.proposalId,build,'bundle-a');
  assert.equal(next.revision,build.revision+1); assert.equal(next.undo.at(-1)?.xml,build.xml);
  assert.equal(next.originalXml,build.originalXml);
  proposals.remove(proposal.proposalId);
  assert.throws(()=>proposals.prepare(proposal.proposalId,build,'bundle-a'),/만료/);
});
test('reconnection invalidates all pending proposals', () => {
  const {build,draft}=fixture(); const proposals=new BuildProposals();
  const p=proposals.register(draft,build,'bundle-a'); proposals.clear();
  assert.throws(()=>proposals.prepare(p.proposalId,build,'bundle-a'),/만료/);
});

test('streaming, failed and cancelled proposals never mutate the original config or gems',()=>{
  const {build,draft}=fixture();const proposals=new BuildProposals();
  const original=JSON.stringify(build);
  let proposed=editBuild(build.xml,{type:'batch',edits:[{type:'skill-add',setId:'1'},{type:'config',setId:'1',key:'conditionSynthetic',value:true}]});
  proposed=editBuild(proposed,{type:'skill-group',setId:'1',groupId:'1',group:{id:'1',label:'trial',slot:'',enabled:true,includeInFullDPS:false,attributes:{},gems:[{name:'Synthetic Support',level:1,quality:0,enabled:true,attributes:{}}]}});
  const changed={...draft,xml:proposed};
  const pending=proposals.register(changed,build,'bundle-a','chat');
  assert.throws(()=>proposals.prepare(pending.proposalId,build,'bundle-a'),/진행 중/);
  proposals.finishChat('chat',false);
  assert.throws(()=>proposals.prepare(pending.proposalId,build,'bundle-a'),/만료/);
  assert.equal(JSON.stringify(build),original);
  const completed=proposals.register(changed,build,'bundle-a','chat');
  proposals.finishChat('other-chat',false);
  assert.throws(()=>proposals.prepare(completed.proposalId,build,'bundle-a'),/진행 중/);
  proposals.finishChat('chat',true);
  const next=proposals.prepare(completed.proposalId,build,'bundle-a');
  assert.equal(next.undo.at(-1)?.xml,build.xml);
  assert.equal(parseBuild(build.xml).configs[0].inputs.conditionSynthetic,undefined);
  assert.equal(parseBuild(build.xml).skillSets[0].groups.length,0);
  assert.equal(JSON.stringify(build),original);
});

test('review describes linked item, support, passive and unset condition changes without a measured gain claim',()=>{
  const {build,draft}=fixture();
  const xml=editBuild(build.xml,{type:'batch',edits:[
    {type:'item-equip',setId:'1',slot:'Ring 1',id:'1',text:'Rarity: NORMAL\nIron Ring\nIron Ring'},
    {type:'skill-add',setId:'1'},
    {type:'tree-nodes',specId:'1',nodes:[123]},
    {type:'config',setId:'1',key:'conditionSynthetic',value:true},
  ]});
  const proposal=new BuildProposals().register({...draft,xml},build,'bundle-a');
  const summary=proposal.changes.join('\n');
  assert.match(summary,/Ring 1: 없음 → Iron Ring/);assert.match(summary,/그룹 1/);
  assert.match(summary,/추가 \[123\]/);assert.match(summary,/conditionSynthetic: 미설정 → true/);
  assert.doesNotMatch(summary,/검증 완료|DPS 개선/);
});
test('unknown and malformed proposal XML never enters the proposal registry', () => {
  const {build,draft}=fixture(); const proposals=new BuildProposals();
  assert.throws(()=>proposals.register({...draft,xml:'<bad/>'},build,'bundle-a'));
  assert.throws(()=>proposals.register({...draft,baseRevision:1},build,'bundle-a'),/변경/);
});
test('calculation freshness requires source document, verified bundle and successful calculation', async () => {
  const {build}=fixture(); const hash=await hashBuildXml(build.xml); assert.equal(hash,xmlHash(build.xml));
  const b={...build,calculation:{revision:0,at:'2026-01-01',result:{ok:true,stats:{Life:10}},restoreNotes:[],
    provenance:{buildId:build.id,revision:0,xmlSha256:hash,bundleId:'a',pobCommit:'p',kbDigest:'k',pokSourceDigest:'s',mode:'xml' as const}}};
  assert.equal(isCalculationCurrent(b,'a',hash),true);
  assert.equal(isCalculationCurrent(b,'b',hash),false);
  assert.equal(isCalculationCurrent(b,'a','changed'),false);
  assert.equal(isCalculationCurrent({...b,revision:1},'a',hash),false);
  assert.equal(isCalculationCurrent({...b,calculation:{...b.calculation,provenance:undefined}},'a',hash),false);
  assert.equal(isCalculationCurrent({...b,calculation:{...b.calculation,result:{ok:false}}},'a',hash),false);
});
