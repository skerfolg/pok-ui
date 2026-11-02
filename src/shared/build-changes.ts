import {parseBuild} from './pob-document';
/** Compare the selected configurations, even when the set IDs belong to different builds. */
export function describeActiveChanges(beforeXml:string,afterXml:string):string[]{
  const before=parseBuild(beforeXml),after=parseBuild(afterXml),changes:string[]=[];
  const slotsBefore=before.itemSets.find(s=>s.active)?.slots||{},slotsAfter=after.itemSets.find(s=>s.active)?.slots||{};
  const oldWeapon=before.itemSets.find(s=>s.active)?.useSecondWeaponSet,newWeapon=after.itemSets.find(s=>s.active)?.useSecondWeaponSet;
  const weapon=(value:boolean|undefined)=>value===undefined?'XML 미지정':value?'II':'I';
  if(oldWeapon!==newWeapon)changes.push(`활성 무기 세트: ${weapon(oldWeapon)} → ${weapon(newWeapon)}`);
  for(const slot of new Set([...Object.keys(slotsBefore),...Object.keys(slotsAfter)])){
    const old=before.items.find(i=>i.id===slotsBefore[slot]),next=after.items.find(i=>i.id===slotsAfter[slot]);
    if(old?.text!==next?.text)changes.push(`장비 ${slot}: ${old?.name||'없음'} → ${next?.name||'없음'}${old?.name===next?.name?' · 원문 변경':''}`);
  }
  const oldGroups=before.skillSets.find(s=>s.active)?.groups||[],newGroups=after.skillSets.find(s=>s.active)?.groups||[];
  const gems=(group:typeof oldGroups[number]|undefined)=>group?`${group.label||group.id} · ${group.gems.map(g=>`${g.name} Lv.${g.level}/${g.quality}${g.enabled?'':' (비활성)'}`).join(', ')}`:'없음';
  for(let i=0;i<Math.max(oldGroups.length,newGroups.length);i++)if(JSON.stringify(oldGroups[i])!==JSON.stringify(newGroups[i]))changes.push(`스킬 그룹 ${i+1}: ${gems(oldGroups[i])} → ${gems(newGroups[i])} · 그룹/모드 metadata 포함`);
  const oldTree=before.trees.find(s=>s.active),newTree=after.trees.find(s=>s.active);
  if(oldTree?.version!==newTree?.version)changes.push(`트리 버전: ${oldTree?.version||'없음'} → ${newTree?.version||'없음'}`);
  const added=newTree?.nodes.filter(n=>!oldTree?.nodes.includes(n))||[],removed=oldTree?.nodes.filter(n=>!newTree?.nodes.includes(n))||[];
  if(added.length||removed.length)changes.push(`활성 패시브: 추가 [${added.join(', ')}] / 제거 [${removed.join(', ')}]`);
  if(JSON.stringify(oldTree?.sockets)!==JSON.stringify(newTree?.sockets))changes.push('활성 트리 주얼 소켓 변경');
  const oldConfig=before.configs.find(s=>s.active)?.inputs||{},newConfig=after.configs.find(s=>s.active)?.inputs||{};
  for(const key of new Set([...Object.keys(oldConfig),...Object.keys(newConfig)]))if(oldConfig[key]!==newConfig[key])changes.push(`활성 조건 ${key}: ${JSON.stringify(oldConfig[key])??'미설정'} → ${JSON.stringify(newConfig[key])??'미설정'}`);
  return [...new Set([...describeBuildChanges(beforeXml,afterXml).filter(c=>/^(직업:|어센던시:|레벨:|주력 그룹:|활성 .* 세트:)/.test(c)),...changes])];
}
export function describeBuildChanges(beforeXml:string,afterXml:string):string[]{
    const before=parseBuild(beforeXml), after=parseBuild(afterXml);
    const changes:string[]=[];
    if(before.className!==after.className)changes.push('직업: '+before.className+' → '+after.className);
    if(before.ascendancy!==after.ascendancy)changes.push('어센던시: '+before.ascendancy+' → '+after.ascendancy);
    if(before.level!==after.level)changes.push('레벨: '+before.level+' → '+after.level);
    if(before.notes!==after.notes)changes.push('노트 변경');
    for(const [key,label] of [['itemSets','장비'],['skillSets','스킬'],['trees','트리'],['configs','조건']] as const){
      const old=before[key].find(s=>s.active),next=after[key].find(s=>s.active);
      if(old?.id!==next?.id||old?.title!==next?.title)changes.push(`활성 ${label} 세트: ${old?.title||old?.id||'없음'} → ${next?.title||next?.id||'없음'}`);
    }
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
    if(!changes.length&&beforeXml!==afterXml)changes.push('추가 XML 속성 또는 문서 형식 변경');
    return changes;
}
