import { createHash, randomUUID } from 'node:crypto';
import type { BuildDocument, BuildProposal, BuildProposalDraft } from '../shared/contracts';
import { parseBuild } from '../shared/pob-document';
import {describeBuildChanges} from '../shared/build-changes';
import {commitBuildXml} from '../shared/build-history';

export function xmlHash(xml: string): string { return createHash('sha256').update(xml, 'utf8').digest('hex'); }

export function assertProposalContext(proposal: BuildProposalDraft, build: BuildDocument | undefined, bundleId: string): asserts build is BuildDocument {
  if (!bundleId || proposal.bundleId !== bundleId) throw new Error('제안의 데이터 버전이 현재 묶음과 다릅니다. 다시 제안받으세요.');
  if (!build || build.id !== proposal.buildId || build.revision !== proposal.baseRevision
    || xmlHash(build.xml) !== proposal.baseXmlSha256) throw new Error('제안 이후 빌드가 변경됐습니다. 현재 문서로 다시 제안받으세요.');
}

export class BuildProposals {
  private proposals = new Map<string, BuildProposal>();
  private owners = new Map<string, {chatId:string; pending:boolean}>();
  clear(): void { this.proposals.clear(); this.owners.clear(); }
  finishChat(chatId:string, success:boolean):void {
    for(const [id,owner] of this.owners)if(owner.chatId===chatId){
      if(success)owner.pending=false;else this.remove(id);
    }
  }
  register(draft: BuildProposalDraft, build: BuildDocument | undefined, bundleId: string, chatId?:string): BuildProposal {
    assertProposalContext(draft, build, bundleId);
    parseBuild(draft.xml);
    const changes=describeBuildChanges(build.xml,draft.xml);
    const proposal = { ...draft, proposalId: randomUUID(), changes };
    // Keep only the newest proposal per build; bound memory when many chats are open.
    for (const [id, old] of this.proposals) if (old.buildId === draft.buildId) this.remove(id);
    if (this.proposals.size >= 30) this.remove(this.proposals.keys().next().value!);
    this.proposals.set(proposal.proposalId, proposal);
    if(chatId)this.owners.set(proposal.proposalId,{chatId,pending:true});
    return proposal;
  }
  prepare(id: string, build: BuildDocument | undefined, bundleId: string): BuildDocument {
    const proposal = this.proposals.get(id);
    if (!proposal) throw new Error('이 제안은 만료되었습니다. 다시 제안받으세요.');
    if(this.owners.get(id)?.pending)throw new Error('응답이 아직 진행 중입니다. 완료 후 변경을 검토해 주세요.');
    assertProposalContext(proposal, build, bundleId);
    parseBuild(proposal.xml);
    return commitBuildXml(build,proposal.xml,'AI 빌드 제안 적용');
  }
  get(id: string): BuildProposal | undefined { return this.proposals.get(id); }
  remove(id: string): void { this.proposals.delete(id); this.owners.delete(id); }
}
