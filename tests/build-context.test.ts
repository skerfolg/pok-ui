import test from 'node:test';
import assert from 'node:assert/strict';
import { BuildProposals, xmlHash } from '../src/main/build-proposals';
import { hashBuildXml, isCalculationCurrent } from '../src/shared/calculation-context';
import { createBuildDocument } from '../src/shared/state';
import { createBlankXml } from '../src/shared/pob-document';
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
