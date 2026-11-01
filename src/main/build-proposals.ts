import { assertLocalDesignIntegrity } from './design-records';
import { applyManualXml, applyInputProposal, assertInputSnapshot } from '../shared/build-revision';
import { createHash, randomUUID } from 'node:crypto';
import type { BuildDocument, BuildProposal, BuildProposalDraft } from '../shared/contracts';
import { parseBuild } from '../shared/pob-document';

export function xmlHash(xml: string): string { return createHash('sha256').update(xml, 'utf8').digest('hex'); }

export function assertProposalContext(proposal: BuildProposalDraft, build: BuildDocument | undefined, bundleId: string): asserts build is BuildDocument {
  if(proposal.inputs){
    if(proposal.inputs.xml!==proposal.xml)throw new Error('제안 XML과 입력 묶음이 다릅니다.');
    if(proposal.baseDesignRevision!==(build?.design?.recordRef.revision??null))throw new Error('제안의 기준 설계 리비전이 변경되었습니다.');
    assertInputSnapshot(proposal.inputs);if(proposal.inputs.design)assertLocalDesignIntegrity(proposal.inputs.design);
  }
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
    const before=parseBuild(build.xml), after=parseBuild(draft.xml);
    const changes:string[]=[];
    if(before.className!==after.className)changes.push('직업: '+before.className+' → '+after.className);
    if(before.ascendancy!==after.ascendancy)changes.push('어센던시: '+before.ascendancy+' → '+after.ascendancy);
    if(before.level!==after.level)changes.push('레벨: '+before.level+' → '+after.level);
    for(const [key,label] of [['items','아이템'],['itemSets','장착 세트'],['skillSets','스킬 그룹'],['trees','패시브 트리'],['configs','전투 조건']] as const){
      if(JSON.stringify(before[key])!==JSON.stringify(after[key]))changes.push(label+' 변경');
    }
    const itemName=(parsed:typeof before,id:string)=>parsed.items.find(item=>item.id===id)?.name||id||'없음';
    for(const set of after.itemSets){
      const previous=before.itemSets.find(s=>s.id===set.id);
      for(const slot of new Set([...Object.keys(previous?.slots??{}),...Object.keys(set.slots)])){
        const oldId=previous?.slots[slot]??'',newId=set.slots[slot]??'';
        if(oldId!==newId)changes.push(`${set.title||set.id} / ${slot}: ${itemName(before,oldId)} → ${itemName(after,newId)}`);
      }
    }
    for(const item of after.items){
      const previous=before.items.find(old=>old.id===item.id);
      if(previous&&previous.text!==item.text)changes.push(`아이템 ${item.id}: ${previous.name} → ${item.name} · 원문 변경`);
    }
    for(const set of after.skillSets){
      const previous=before.skillSets.find(s=>s.id===set.id);
      for(const group of set.groups){
        const old=previous?.groups.find(g=>g.id===group.id);
        if(JSON.stringify(old)!==JSON.stringify(group)){
          const gems=(entry:typeof group|undefined)=>entry?.gems.map(g=>`${g.name} Lv.${g.level}/${g.quality}${g.enabled?'':' (비활성)'}`).join(', ')||'없음';
          changes.push(`${set.title||set.id} / 그룹 ${group.id}: ${gems(old)} → ${gems(group)}`);
        }
      }
      for(const group of previous?.groups??[])if(!set.groups.some(g=>g.id===group.id))changes.push(`${set.title||set.id} / 그룹 ${group.id} 삭제`);
    }
    for(const tree of after.trees){
      const old=before.trees.find(t=>t.id===tree.id);
      const added=tree.nodes.filter(id=>!old?.nodes.includes(id)),removed=old?.nodes.filter(id=>!tree.nodes.includes(id))??[];
      if(added.length||removed.length)changes.push(`트리 ${tree.title||tree.id}: 추가 [${added.join(', ')}] / 제거 [${removed.join(', ')}]`);
    }
    for(const set of after.configs){
      const old=before.configs.find(s=>s.id===set.id);
      for(const key of new Set([...Object.keys(old?.inputs??{}),...Object.keys(set.inputs)]))
        if(old?.inputs[key]!==set.inputs[key])changes.push(`조건 ${set.title||set.id} / ${key}: ${JSON.stringify(old?.inputs[key])??'미설정'} → ${JSON.stringify(set.inputs[key])??'미설정'}`);
    }
    if(before.mainSocketGroup!==after.mainSocketGroup)changes.push(`주력 그룹: ${before.mainSocketGroup} → ${after.mainSocketGroup}`);
    if(!changes.length&&build.xml!==draft.xml)changes.push('추가 XML 속성 또는 문서 형식 변경');
    if(draft.inputs){
      changes.push('설계·획득 메타데이터를 포함한 전체 입력 변경');
      const binding=draft.inputs.design?.acquisitionSha256,metadata=draft.inputs.acquisitionMetadataJson;
      if(binding&&(!metadata||binding!=='sha256:'+createHash('sha256').update(metadata,'utf8').digest('hex')))changes.push('획득 메타데이터가 설계 입력과 다름 · 재검토 필요');
      else if(metadata&&!binding)changes.push('획득 메타데이터의 설계 연결 미확인');
    }
    const proposal = { ...structuredClone(draft), proposalId: randomUUID(), changes };
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
    if(proposal.inputs)return applyInputProposal({...build,documentSchemaVersion:2},{buildId:build.id,baseRevision:proposal.baseRevision,baseDesignRevision:proposal.baseDesignRevision!,inputs:proposal.inputs,summary:proposal.summary});
    return applyManualXml({...build,documentSchemaVersion:2},proposal.xml,'AI 빌드 제안 적용');
  }
  get(id: string): BuildProposal | undefined { return this.proposals.get(id); }
  remove(id: string): void { this.proposals.delete(id); this.owners.delete(id); }
}
