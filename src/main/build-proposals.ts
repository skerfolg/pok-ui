import { createHash, randomUUID } from 'node:crypto';
import type { BuildDocument, BuildProposal, BuildProposalDraft } from '../shared/contracts';
import { parseBuild } from '../shared/pob-document';

export function xmlHash(xml: string): string { return createHash('sha256').update(xml, 'utf8').digest('hex'); }

export function assertProposalContext(proposal: BuildProposalDraft, build: BuildDocument | undefined, bundleId: string): asserts build is BuildDocument {
  if (!bundleId || proposal.bundleId !== bundleId) throw new Error('제안의 데이터 버전이 현재 묶음과 다릅니다. 다시 제안받으세요.');
  if (!build || build.id !== proposal.buildId || build.revision !== proposal.baseRevision
    || xmlHash(build.xml) !== proposal.baseXmlSha256) throw new Error('제안 이후 빌드가 변경됐습니다. 현재 문서로 다시 제안받으세요.');
}

export class BuildProposals {
  private proposals = new Map<string, BuildProposal>();
  clear(): void { this.proposals.clear(); }
  register(draft: BuildProposalDraft, build: BuildDocument | undefined, bundleId: string): BuildProposal {
    assertProposalContext(draft, build, bundleId);
    parseBuild(draft.xml);
    const before=parseBuild(build.xml), after=parseBuild(draft.xml);
    const changes:string[]=[];
    if(before.className!==after.className)changes.push('직업: '+before.className+' → '+after.className);
    if(before.ascendancy!==after.ascendancy)changes.push('어센던시: '+before.ascendancy+' → '+after.ascendancy);
    if(before.level!==after.level)changes.push('레벨: '+before.level+' → '+after.level);
    for(const [key,label] of [['items','아이템'],['itemSets','장착 세트'],['skillSets','스킬 그룹'],['trees','패시브 트리'],['configs','전투 조건']] as const){
      if(JSON.stringify(before[key])!==JSON.stringify(after[key]))changes.push(label+' 변경');
    }
    if(!changes.length&&build.xml!==draft.xml)changes.push('추가 XML 속성 또는 문서 형식 변경');
    const proposal = { ...draft, proposalId: randomUUID(), changes };
    // Keep only the newest proposal per build; bound memory when many chats are open.
    for (const [id, old] of this.proposals) if (old.buildId === draft.buildId) this.proposals.delete(id);
    if (this.proposals.size >= 30) this.proposals.delete(this.proposals.keys().next().value!);
    this.proposals.set(proposal.proposalId, proposal);
    return proposal;
  }
  prepare(id: string, build: BuildDocument | undefined, bundleId: string): BuildDocument {
    const proposal = this.proposals.get(id);
    if (!proposal) throw new Error('이 제안은 만료되었습니다. 다시 제안받으세요.');
    assertProposalContext(proposal, build, bundleId);
    parseBuild(proposal.xml);
    return { ...build, xml: proposal.xml, revision: build.revision + 1, updatedAt: new Date().toISOString(),
      undo: [...build.undo, { xml: build.xml, label: 'AI 빌드 제안 적용' }].slice(-30) };
  }
  get(id: string): BuildProposal | undefined { return this.proposals.get(id); }
  remove(id: string): void { this.proposals.delete(id); }
}
