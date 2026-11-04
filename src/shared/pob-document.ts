import { DOMParser, XMLSerializer, type Document, type Element, type Node } from '@xmldom/xmldom';
import type { Attributes, BuildEdit, Gem, ParsedBuild, SkillGroup } from './contracts';
import type { CatalogClass } from './game-data';
import {partyNames,type PartyName} from './pob-party';

/** Also enforced on edited output; documents remain small enough to parse in the renderer. */
export const MAX_XML_BYTES = 10 * 1024 * 1024;
export const LEGACY_TREE_WORKSPACE_MESSAGE='기존 단일 Spec 트리가 있습니다. 초기 생성 대신 원본 PoB의 복원 결과를 검토해 편집 형식으로 옮겨 주세요. 적용 전에는 원문이 바뀌지 않습니다.';
export function hasLegacyPassiveSpec(xml:string):boolean{return children(readXml(xml).documentElement!,'Spec').length>0;}
export function unsupportedTreeVersions(xml:string,supported:readonly string[]):{id:string;version:string}[]{
  const root=readXml(xml).documentElement!;return children(child(root,'Tree'),'Spec').flatMap((spec,index)=>{const version=attr(spec,'treeVersion');return version&&!supported.includes(version)?[{id:String(index+1),version}]:[];});
}

// PoB's XML reader expects literal attribute whitespace, unlike a standard XML parser.
// Only touch quoted attributes, never text, comments, CDATA or processing instructions.
function mapAttributes(xml: string, transform: (value: string) => string): string {
  const output: string[] = [];
  let cursor = 0;
  while (cursor < xml.length) {
    const start = xml.indexOf('<', cursor);
    if (start < 0) { output.push(xml.slice(cursor)); break; }
    output.push(xml.slice(cursor, start));
    const terminator = xml.startsWith('<!--', start) ? '-->'
      : xml.startsWith('<![CDATA[', start) ? ']]>' : xml.startsWith('<?', start) ? '?>' : '';
    if (terminator) {
      const end = xml.indexOf(terminator, start + 2);
      if (end < 0) { output.push(xml.slice(start)); break; }
      cursor = end + terminator.length;
      output.push(xml.slice(start, cursor));
      continue;
    }
    let part = start;
    let index = start + 1;
    for (; index < xml.length && xml[index] !== '>'; index++) {
      const quote = xml[index];
      if (quote !== '"' && quote !== "'") continue;
      const end = xml.indexOf(quote, index + 1);
      if (end < 0) break; // The strict XML parser will report the malformed attribute.
      output.push(xml.slice(part, index + 1), transform(xml.slice(index + 1, end)), quote);
      part = end + 1;
      index = end;
    }
    cursor = Math.min(index + 1, xml.length);
    output.push(xml.slice(part, cursor));
  }
  return output.join('');
}

function validateCharacters(xml: string): void {
  if (xml.length > MAX_XML_BYTES || new TextEncoder().encode(xml).length > MAX_XML_BYTES)
    throw new Error('PoB XML 파일은 10 MiB 이하여야 합니다.');
  for (const char of xml) {
    const code = char.codePointAt(0)!;
    if ((code < 32 && code !== 9 && code !== 10 && code !== 13)
      || (code >= 0xd800 && code <= 0xdfff) || code === 0xfffe || code === 0xffff)
      throw new Error('XML에 허용되지 않는 문자가 있습니다.');
  }
}

function readXml(xml: string): Document {
  if (typeof xml !== 'string') throw new Error('PoB XML 문자열이 필요합니다.');
  validateCharacters(xml);
  const markup = xml.replace(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>/g, ' ');
  if (/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(markup)) throw new Error('DOCTYPE 및 ENTITY 선언은 허용하지 않습니다.');
  // xmldom accepts a bare ampersand in some contexts; PoB documents must be well formed.
  if (/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[\da-fA-F]+;)/.test(markup))
    throw new Error('XML 엔티티 표기가 올바르지 않습니다.');
  const protectedXml = mapAttributes(xml, value => value.replace(/[\r\n\t]/g, char => `&#${char.charCodeAt(0)};`));
  const document = new DOMParser({
    normalizeLineEndings: source => source,
    onError: (_level, message) => { throw new Error(`잘못된 XML: ${message}`); },
  }).parseFromString(protectedXml, 'application/xml');
  if (document.documentElement?.tagName !== 'PathOfBuilding2' || !child(document.documentElement, 'Build'))
    throw new Error('Path of Building 2 빌드 XML이 필요합니다.');
  // Avoid recursive serializer exhaustion from untrusted, deeply nested documents.
  const pending: [Node, number][] = [[document.documentElement, 1]];
  while (pending.length) {
    const [node, depth] = pending.pop()!;
    if (depth > 256) throw new Error('XML 중첩 깊이가 너무 큽니다.');
    if (node.nodeValue) validateCharacters(node.nodeValue);
    if (node.nodeType === 1) for (const value of Object.values(attributes(node as Element))) validateCharacters(value);
    for (let entry = node.firstChild; entry; entry = entry.nextSibling) pending.push([entry, depth + 1]);
  }
  return document;
}

function writeXml(document: Document): string {
  const xml = mapAttributes(new XMLSerializer().serializeToString(document), value => value
    .replace(/&#(?:10|x0*a);/gi, '\n').replace(/&#(?:13|x0*d);/gi, '\r').replace(/&#(?:9|x0*9);/gi, '\t'));
  validateCharacters(xml);
  return xml;
}

function children(parent: Node | null | undefined, tag?: string): Element[] {
  const result: Element[] = [];
  if (parent) for (let node = parent.firstChild; node; node = node.nextSibling)
    if (node.nodeType === 1 && (!tag || (node as Element).tagName === tag)) result.push(node as Element);
  return result;
}
function child(parent: Node | null | undefined, tag: string): Element | undefined { return children(parent, tag)[0]; }
function attr(node: Element | undefined, key: string, fallback = ''): string { return node?.getAttribute(key) ?? fallback; }
function attributes(node: Element): Attributes {
  return Object.fromEntries(Array.from({ length: node.attributes.length }, (_, index) => {
    const entry = node.attributes.item(index)!;
    return [entry.name, entry.value];
  }));
}
function bool(node: Element, key: string, fallback = true): boolean { return attr(node, key, String(fallback)) !== 'false'; }
function number(value: string, fallback: number): number { const parsed = Number(value); return value.trim() && Number.isFinite(parsed) ? parsed : fallback; }
function directText(node: Element): string {
  let text = '';
  for (let entry = node.firstChild; entry; entry = entry.nextSibling)
    if (entry.nodeType === 3 || entry.nodeType === 4) text += entry.nodeValue ?? '';
  return text;
}
function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/\r/g, '&#13;').replace(/\n/g, '&#10;').replace(/\t/g, '&#9;');
}

const setKinds = {
  items: ['Items', 'ItemSet', 'activeItemSet'], skills: ['Skills', 'SkillSet', 'activeSkillSet'],
  tree: ['Tree', 'Spec', 'activeSpec'], config: ['Config', 'ConfigSet', 'activeConfigSet'],
} as const;
type SetKind = keyof typeof setKinds;
function sets(root: Element, kind: SetKind): Element[] {
  const [section, tag] = setKinds[kind];
  const parent = child(root, section);
  const all = children(parent, tag);
  // Old PoB exports can keep Skills/Slots/Inputs directly under their section.
  return all.length || kind === 'tree' || !parent ? all : [parent];
}
function setId(node: Element, index: number, kind: SetKind): string {
  return kind === 'tree' ? String(index + 1) : attr(node, 'id', String(index + 1));
}
function activeId(root: Element, kind: SetKind): string {
  const all = sets(root, kind);
  const selected = attr(child(root, setKinds[kind][0]), setKinds[kind][2]);
  return all.some((node, index) => setId(node, index, kind) === selected)
    ? selected : all[0] ? setId(all[0], 0, kind) : '';
}
function getSet(root: Element, kind: SetKind, id: string): Element {
  const result = sets(root, kind).find((node, index) => setId(node, index, kind) === id);
  if (!result) throw new Error(`존재하지 않는 ${kind} 세트: ${id}`);
  return result;
}
function explicitSets(root:Element,kind:SetKind):Element {
  const [section,tag,key]=setKinds[kind];let parent=child(root,section);
  if(!parent){parent=root.ownerDocument!.createElement(section);root.appendChild(parent);return parent;}
  if(kind==='tree'||children(parent,tag).length)return parent;
  const first=root.ownerDocument!.createElement(tag);
  const id=attr(parent,'id','1');if(!/^\d+$/.test(id))throw new Error('기존 세트 ID를 확인해 주세요.');
  putAttributes(first,{id,title:attr(parent,'title','기본')});
  if(kind==='items')first.setAttribute('useSecondWeaponSet',attr(parent,'useSecondWeaponSet','false'));
  const owned=kind==='items'?['Slot']:kind==='skills'?['Skill']:['Input','Placeholder'];
  for(const node of children(parent))if(owned.includes(node.tagName))first.appendChild(node);
  parent.appendChild(first);parent.setAttribute(key,id);return parent;
}
function selectElement(root:Element,kind:SetKind,selected:Element):void {
  const [section,,key]=setKinds[kind],parent=child(root,section)!;
  parent.setAttribute(key,kind==='tree'?String(sets(root,kind).indexOf(selected)+1):attr(selected,'id','1'));
  if(kind==='items')parent.setAttribute('useSecondWeaponSet',attr(selected,'useSecondWeaponSet','false'));
  if(kind==='skills')clampMain(root);
}
function skillGroup(node: Element, index: number): SkillGroup {
  return {
    id: String(index + 1), label: attr(node, 'label'), slot: attr(node, 'slot'), enabled: bool(node, 'enabled'),
    includeInFullDPS: bool(node, 'includeInFullDPS', false), attributes: attributes(node),
    gems: children(node, 'Gem').map((gem, gemIndex) => ({
      name: attr(gem, 'nameSpec'), level: number(attr(gem, 'level'), 1), quality: number(attr(gem, 'quality'), 0),
      enabled: bool(gem, 'enabled'), attributes: attributes(gem), sourceIndex: gemIndex + 1,
    })),
  };
}

export function parseBuild(xml: string): ParsedBuild {
  const root = readXml(xml).documentElement!;
  const build = child(root, 'Build')!;
  return {
    className: attr(build, 'className'), ascendancy: attr(build, 'ascendClassName'),
    level: number(attr(build, 'level'), 1), mainSocketGroup: number(attr(build, 'mainSocketGroup'), 1),
    items: children(child(root, 'Items'), 'Item').map(item => {
      const text = directText(item);
      const lines = text.trim().split(/\r?\n/);
      const rarity = lines[0]?.replace(/^Rarity:\s*/i, '') ?? '';
      const name = lines[1] ?? '';
      // Magic exports may have only a full item name, immediately followed by metadata.
      const candidate = lines[2] ?? '';
      const base = rarity.toLowerCase() === 'normal' ? name : candidate && !/:|^-{2,}|^\{/.test(candidate) ? candidate : '';
      return { id: attr(item, 'id'), name, rarity, base, text };
    }),
    itemSets: sets(root, 'items').map((set, index) => ({
      id: setId(set, index, 'items'), title: attr(set, 'title', '기본'), active: setId(set, index, 'items') === activeId(root, 'items'),
      useSecondWeaponSet:attr(set,'useSecondWeaponSet','false')==='true',
      slots: Object.fromEntries(children(set, 'Slot').map(slot => [attr(slot, 'name'), attr(slot, 'itemId', '0')])),
    })),
    skillSets: sets(root, 'skills').map((set, index) => ({
      id: setId(set, index, 'skills'), title: attr(set, 'title', '기본'), active: setId(set, index, 'skills') === activeId(root, 'skills'),
      groups: children(set, 'Skill').map(skillGroup),
    })),
    trees: sets(root, 'tree').map((set, index) => ({
      id: String(index + 1), title: attr(set, 'title', `트리 ${index + 1}`), version: attr(set, 'treeVersion', attr(build, 'targetVersion')),
      active: String(index + 1) === activeId(root, 'tree'), attributes: attributes(set),
      weaponSets:Object.fromEntries(children(set).filter(n=>/^WeaponSet[12]$/.test(n.tagName)).map(n=>[n.tagName,attr(n,'nodes').split(',').filter(Boolean).map(Number).filter(Number.isSafeInteger)])),
      nodes: attr(set, 'nodes').split(',').filter(value => value.trim() !== '').map(Number).filter(Number.isFinite),
      sockets: children(child(set, 'Sockets'), 'Socket').map(socket => ({ nodeId: attr(socket, 'nodeId'), itemId: attr(socket, 'itemId') })),
    })),
    configs: sets(root, 'config').map((set, index) => ({
      id: setId(set, index, 'config'), title: attr(set, 'title', '기본'), active: setId(set, index, 'config') === activeId(root, 'config'),
      inputs: Object.fromEntries(children(set, 'Input').map(input => [attr(input, 'name'),
        input.hasAttribute('boolean') ? attr(input, 'boolean') === 'true'
          : input.hasAttribute('number') ? number(attr(input, 'number'), 0) : attr(input, 'string')])),
      placeholders: children(set, 'Placeholder').map(attributes),
    })),
    stats: Object.fromEntries(children(build, 'PlayerStat').map(stat => [attr(stat, 'stat'), attr(stat, 'value')])),
    notes:child(root,'Notes')?directText(child(root,'Notes')!):'',
    party:{buffers:Object.fromEntries(children(child(root,'Party'),'ImportedBuffs').filter(node=>partyNames.includes(attr(node,'name') as PartyName)).map(node=>[attr(node,'name'),directText(node)])),exportEnabled:attr(child(root,'Import'),'exportParty')==='true'},
  };
}

function requireInteger(value: number, label: string, minimum = 0, maximum = Number.MAX_SAFE_INTEGER): void {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) throw new Error(`${label} 값이 올바르지 않습니다.`);
}
function putAttributes(element: Element, values: Attributes): void {
  for (const [key, value] of Object.entries(values)) element.setAttribute(key, value);
}
function replaceDirectText(element: Element, text: string): void {
  const old = Array.from(element.childNodes).filter(node => node.nodeType === 3 || node.nodeType === 4);
  element.insertBefore(element.ownerDocument!.createTextNode(text), old[0] ?? element.firstChild);
  for (const node of old) element.removeChild(node);
}
function getGroup(set: Element, id: string): Element {
  const index = Number(id);
  requireInteger(index, '스킬 그룹', 1, children(set, 'Skill').length);
  return children(set, 'Skill')[index - 1];
}
function clampMain(root: Element): void {
  const build = child(root, 'Build')!;
  const selected = activeId(root, 'skills');
  const count = selected ? children(getSet(root, 'skills', selected), 'Skill').length : 0;
  build.setAttribute('mainSocketGroup', String(Math.max(1, Math.min(number(attr(build, 'mainSocketGroup'), 1), count))));
}
function editGems(group: Element, gems: Gem[]): void {
  const old = children(group, 'Gem');
  const used = new Set<Element>();
  const updated = gems.map(gem => {
    requireInteger(gem.level, '젬 레벨', 1, 100);
    requireInteger(gem.quality, '젬 퀄리티', 0, 100);
    const sourceIndex = gem.sourceIndex;
    let source = sourceIndex === undefined ? undefined : old[sourceIndex - 1];
    if (source && used.has(source)) source = undefined;
    if (!source) source = old.find(node => !used.has(node) && ['gemId', 'skillId', 'nameSpec'].every(key =>
      attr(node, key) === (gem.attributes[key] ?? (key === 'nameSpec' ? gem.name : ''))));
    if (source) used.add(source);
    const node = source ? source.cloneNode(true) as Element : group.ownerDocument!.createElement('Gem');
    putAttributes(node, gem.attributes);
    if (source && attr(source, 'nameSpec') !== gem.name) {
      node.removeAttribute('gemId'); node.removeAttribute('skillId'); node.removeAttribute('variantId');
    }
    putAttributes(node, { nameSpec: gem.name, level: String(gem.level), quality: String(gem.quality), enabled: String(gem.enabled) });
    return node;
  });
  for (const node of updated) group.insertBefore(node, old[0] ?? null);
  for (const node of old) group.removeChild(node);
}

export function editBuild(xml: string, edit: BuildEdit): string {
  if(edit.type==='input-record')return xml;
  if (edit.type === 'batch') return edit.edits.reduce((current, next) => editBuild(current, next), xml);
  const document = readXml(xml);
  const root = document.documentElement!;
  const build = child(root, 'Build')!;
  let created=0;
  function fresh(value:import('./pob-loadouts').PobSetNode,depth=0):Element{
    if(depth>64||++created>100000||!value||typeof value.tag!=='string'||!/^[A-Za-z_][\w:.-]*$/.test(value.tag)||!Array.isArray(value.children))throw new Error('원본 새 세트 XML 구조가 올바르지 않습니다.');
    const node=document.createElement(value.tag);
    for(const [key,text]of Object.entries(value.attributes||{})){if(!/^[A-Za-z_][\w:.-]*$/.test(key)||typeof text!=='string')throw new Error('원본 새 세트 속성이 올바르지 않습니다.');node.setAttribute(key,text);}
    for(const entry of value.children)node.appendChild(typeof entry==='string'?document.createTextNode(entry):fresh(entry,depth+1));return node;
  }
  switch (edit.type) {
    case 'tree-adopt-legacy': {
      const legacy=children(root,'Spec');if(legacy.length!==1||children(root,'Tree').length)throw new Error('단일 root Spec만 옮길 수 있습니다. 여러 Spec 또는 Tree와의 혼합 입력은 원본을 보존합니다.');
      const tree=document.createElement('Tree');tree.setAttribute('activeSpec','1');root.replaceChild(tree,legacy[0]);tree.appendChild(legacy[0]);break;
    }
    case 'item-native': {
      const item=children(child(root,'Items'),'Item').find(node=>attr(node,'id')===edit.id);if(!item)throw new Error('원본 아이템을 찾지 못했습니다.');
      const variantKeys=['variant','variantAlt','variantAlt2','variantAlt3','variantAlt4','variantAlt5'];
      for(const key of Object.keys(edit.metadata.variants))if(!variantKeys.includes(key))throw new Error('원본 아이템 variant metadata가 올바르지 않습니다.');
      for(const key of variantKeys){const value=edit.metadata.variants[key];if(value===undefined)item.removeAttribute(key);else{if(!/^\d+$/.test(value))throw new Error('원본 variant 값이 올바르지 않습니다.');item.setAttribute(key,value);}}
      const ranges=edit.metadata.modRanges;
      for(const node of children(item,'ModRange'))if(ranges[attr(node,'id')]===undefined){
        if(children(node).length||Object.keys(attributes(node)).some(key=>!['id','range'].includes(key)))throw new Error('삭제될 legacy range에 알 수 없는 metadata가 있습니다. 원문을 보존하며 적용을 중지했습니다.');item.removeChild(node);
      }
      for(const [id,range]of Object.entries(ranges)){if(!/^\d+$/.test(id)||!Number.isFinite(Number(range)))throw new Error('원본 mod range metadata가 올바르지 않습니다.');let node=children(item,'ModRange').find(node=>attr(node,'id')===id);if(!node){node=document.createElement('ModRange');node.setAttribute('id',id);item.appendChild(node);}node.setAttribute('range',range);}
      replaceDirectText(item,edit.text);break;
    }
    case 'equipment-native-patch': {
      const set=getSet(root,'items',edit.setId);
      for(const [name,id] of Object.entries(edit.patch.slots)){
        if(!name||name.length>200||!/^\d+$/.test(id))throw new Error('원본 장비 슬롯 패치가 올바르지 않습니다.');
        let slot=children(set,'Slot').find(s=>attr(s,'name')===name);if(!slot){slot=document.createElement('Slot');slot.setAttribute('name',name);set.appendChild(slot);}slot.setAttribute('itemId',id);
      }
      if(edit.patch.useSecondWeaponSet!==undefined){if(typeof edit.patch.useSecondWeaponSet!=='boolean')throw new Error('원본 무기 세트 패치가 올바르지 않습니다.');set.setAttribute('useSecondWeaponSet',String(edit.patch.useSecondWeaponSet));if(activeId(root,'items')===edit.setId)child(root,'Items')!.setAttribute('useSecondWeaponSet',String(edit.patch.useSecondWeaponSet));}
      if(edit.patch.mainSocketGroup!==undefined){requireInteger(edit.patch.mainSocketGroup,'원본 주력 스킬 그룹',1);build.setAttribute('mainSocketGroup',String(edit.patch.mainSocketGroup));}
      break;
    }
    case 'tree-native-patch': {
      const spec=getSet(root,'tree',edit.specId),patch=edit.patch;
      for(const [key,value]of Object.entries(patch.buildAttributes||{})){
        if(!['className','ascendClassName'].includes(key)||typeof value!=='string')throw new Error('원본 캐릭터 속성 패치가 올바르지 않습니다.');
        build.setAttribute(key,value);
      }
      for(const [key,value] of Object.entries(patch.attributes)){
        if(!['nodes','masteryEffects','classId','ascendClassId','classInternalId','ascendancyInternalId','secondaryAscendClassId','treeVersion','title'].includes(key)||typeof value!=='string')throw new Error('원본 트리 속성 패치가 올바르지 않습니다.');
        spec.setAttribute(key,value);
      }
      for(const [tag,nodes] of Object.entries(patch.weaponSets||{})){
        if(!/^WeaponSet[12]$/.test(tag)||typeof nodes!=='string')throw new Error('원본 무기 세트 패치가 올바르지 않습니다.');
        let node=child(spec,tag);if(!node){node=document.createElement(tag);spec.appendChild(node);}node.setAttribute('nodes',nodes);
      }
      if(Object.keys(patch.attributeOverrides||{}).length){
        let overrides=child(spec,'Overrides');if(!overrides){overrides=document.createElement('Overrides');spec.appendChild(overrides);}
        let node=child(overrides,'AttributeOverride');if(!node){if(['strNodes','dexNodes','intNodes'].some(key=>typeof patch.attributeOverrides?.[key]!=='string'))throw new Error('새 원본 능력치 override에는 모든 기본 필드가 필요합니다.');node=document.createElement('AttributeOverride');overrides.appendChild(node);}
        for(const [key,value] of Object.entries(patch.attributeOverrides!)){if(!['strNodes','dexNodes','intNodes'].includes(key)||typeof value!=='string')throw new Error('원본 능력치 노드 패치가 올바르지 않습니다.');node.setAttribute(key,value);}
      }
      if(patch.url!==undefined){let node=child(spec,'URL');if(!node){node=document.createElement('URL');spec.appendChild(node);}replaceDirectText(node,patch.url);}
      if(patch.replaceState&&patch.sockets){for(const socket of children(child(spec,'Sockets'),'Socket')){const id=attr(socket,'nodeId');if(!/^\d+$/.test(id))throw new Error('변환할 원본 주얼 소켓 ID를 해석할 수 없습니다.');if(!(id in patch.sockets))socket.setAttribute('itemId','0');}}
      if(Object.keys(patch.sockets||{}).length){
        let sockets=child(spec,'Sockets');if(!sockets){sockets=document.createElement('Sockets');spec.appendChild(sockets);}
        for(const [nodeId,itemId] of Object.entries(patch.sockets!)){
          if(!/^\d+$/.test(nodeId)||typeof itemId!=='string'||itemId!==''&&!/^\d+$/.test(itemId))throw new Error('원본 주얼 소켓 패치가 올바르지 않습니다.');
          let node=children(sockets,'Socket').find(n=>attr(n,'nodeId')===nodeId);if(!node){node=document.createElement('Socket');node.setAttribute('nodeId',nodeId);sockets.appendChild(node);}node.setAttribute('itemId',itemId||'0');
        }
      }
      break;
    }
    case 'party-buffer': {
      if(!partyNames.includes(edit.name))throw new Error('지원하지 않는 파티 버퍼입니다.');
      let party=child(root,'Party');if(!party){party=document.createElement('Party');root.appendChild(party);}
      const matches=children(party,edit.exported?'ExportedBuffs':'ImportedBuffs').filter(node=>attr(node,'name')===edit.name);
      // PoB reads node[1] as buffer text; keep it textual before unknown child nodes.
      for(const node of matches)replaceDirectText(node,children(node).length?'\n':'');
      let node=matches.at(-1);if(!node){node=document.createElement(edit.exported?'ExportedBuffs':'ImportedBuffs');node.setAttribute('name',edit.name);party.appendChild(node);}
      replaceDirectText(node,edit.text|| (children(node).length?'\n':''));break;
    }
    case 'party-export-enabled': {
      let section=child(root,'Import');if(!section){section=document.createElement('Import');root.appendChild(section);}section.setAttribute('exportParty',String(edit.enabled));break;
    }
    case 'calcs-input': {
      if(!['skill_number','misc_buffMode','showMinion'].includes(edit.key))throw new Error('지원하지 않는 계산 선택입니다.');
      if(edit.value!==undefined){
        if(edit.key==='skill_number')requireInteger(edit.value as number,'계산 스킬 그룹',1);
        if(edit.key==='showMinion'&&typeof edit.value!=='boolean')throw new Error('계산 대상 선택이 올바르지 않습니다.');
        if(edit.key==='misc_buffMode'&&(typeof edit.value!=='string'||!edit.value||edit.value.length>40))throw new Error('계산 모드가 올바르지 않습니다.');
      }
      let calcs=child(root,'Calcs');if(!calcs){calcs=document.createElement('Calcs');root.appendChild(calcs);}
      const matches=children(calcs,'Input').filter(node=>attr(node,'name')===edit.key);
      if(edit.value===undefined){for(const node of matches)calcs.removeChild(node);break;}
      let input=matches.at(-1);if(!input){input=document.createElement('Input');input.setAttribute('name',edit.key);calcs.appendChild(input);}
      for(const type of ['boolean','number','string'])input.removeAttribute(type);
      input.setAttribute(typeof edit.value,String(edit.value));break;
    }
    case 'notes': {
      let notes=child(root,'Notes');if(!notes){notes=document.createElement('Notes');root.appendChild(notes);}replaceDirectText(notes,edit.text);break;
    }
    case 'loadout-native-sets': {
      for(const kind of Object.keys(setKinds) as SetKind[]){
        const entries=edit.sets[kind];if(!Array.isArray(entries)||!entries.length)throw new Error('원본 관리 연산에는 모든 종류의 세트가 필요합니다.');
        const plannedIds=new Set<string>();for(const [index,entry]of entries.entries()){if(!entry||typeof entry.id!=='string'||!/^\d+$/.test(entry.id)||plannedIds.has(entry.id)||kind==='tree'&&entry.id!==String(index+1))throw new Error('원본 관리 세트 ID/순서가 올바르지 않습니다.');plannedIds.add(entry.id);}
        const existing=sets(root,kind);if(entries.length===existing.length&&entries.every((entry,index)=>entry.sourceId===setId(existing[index],index,kind)&&entry.id===setId(existing[index],index,kind)&&entry.copyFrom===undefined&&entry.node===undefined&&(entry.title===undefined||entry.title===attr(existing[index],'title'))))continue;
        const parent=explicitSets(root,kind),all=sets(root,kind).filter(node=>node!==parent),sources=new Map(all.map((node,index)=>[setId(node,index,kind),node])),ids=new Set<string>(),retained=new Set<string>();
        const next=entries.map((entry,index)=>{
          if(!entry||typeof entry.id!=='string'||!/^\d+$/.test(entry.id)||ids.has(entry.id)||kind==='tree'&&entry.id!==String(index+1))throw new Error('원본 관리 세트 ID/순서가 올바르지 않습니다.');ids.add(entry.id);
          if([entry.sourceId!==undefined,entry.copyFrom!==undefined,entry.node!==undefined].filter(Boolean).length!==1)throw new Error('원본 세트의 출처가 명확하지 않습니다.');
          let node:Element;
          if(entry.node){node=fresh(entry.node);if(node.tagName!==setKinds[kind][1])throw new Error('원본 새 세트 태그가 올바르지 않습니다.');}
          else{const source=entry.sourceId??entry.copyFrom!,original=sources.get(source);if(!original)throw new Error('관리 연산의 원본 XML 세트가 없습니다.');if(entry.sourceId){if(retained.has(source))throw new Error('기존 세트를 중복해서 유지할 수 없습니다.');retained.add(source);}node=original.cloneNode(true) as Element;}
          if(kind!=='tree')node.setAttribute('id',entry.id);
          if(entry.title!==undefined){if(typeof entry.title!=='string')throw new Error('원본 세트 이름이 올바르지 않습니다.');node.setAttribute('title',entry.title);}return node;
        });
        const anchor=all.at(-1)?.nextSibling||null;for(let index=0;index<Math.max(all.length,next.length);index++){if(all[index]&&next[index])parent.replaceChild(next[index],all[index]);else if(all[index])parent.removeChild(all[index]);else parent.insertBefore(next[index],anchor);}
      }
      break;
    }
    case 'set-add': {
      const title=edit.title.trim();if(!title||title.length>200)throw new Error('세트 이름은 1~200자로 입력해 주세요.');
      const parent=explicitSets(root,edit.kind),all=sets(root,edit.kind).filter(node=>node!==parent);
      const source=edit.copyFrom?getSet(root,edit.kind,edit.copyFrom):undefined;
      if(source&&!all.includes(source))throw new Error('복사할 기존 세트를 찾지 못했습니다.');
      let next:Element;
      if(source)next=source.cloneNode(true) as Element;
      else{
        next=document.createElement(setKinds[edit.kind][1]);
        if(edit.kind==='items')next.setAttribute('useSecondWeaponSet','false');
        if(edit.kind==='tree'){
          const template=all.length?getSet(root,'tree',activeId(root,'tree')):undefined;
          if(!template)throw new Error('트리 기준이 없습니다. 직업·버전이 지정된 빌드를 먼저 준비해 주세요.');
          for(const key of ['treeVersion','classId','classInternalId','ascendClassId','ascendancyInternalId','secondaryAscendClassId','startNodeId'])
            if(template.hasAttribute(key))next.setAttribute(key,attr(template,key));
          next.setAttribute('nodes','');next.appendChild(document.createElement('Sockets'));
        }
      }
      next.setAttribute('title',title);
      if(edit.kind!=='tree'){
        const ids=all.map(node=>Number(attr(node,'id')));if(ids.some(id=>!Number.isSafeInteger(id)||id<0))throw new Error('기존 세트 ID가 올바르지 않습니다.');
        const id=ids.reduce((maximum,id)=>Math.max(maximum,id),0)+1;requireInteger(id,'새 세트 ID',1);next.setAttribute('id',String(id));
      }
      parent.appendChild(next);selectElement(root,edit.kind,next);break;
    }
    case 'set-rename': {
      const title=edit.title.trim();if(!title||title.length>200)throw new Error('세트 이름은 1~200자로 입력해 주세요.');
      getSet(root,edit.kind,edit.id).setAttribute('title',title);break;
    }
    case 'set-remove': {
      const parent=explicitSets(root,edit.kind),all=sets(root,edit.kind);
      if(all.length<=1)throw new Error('마지막 세트는 삭제할 수 없습니다.');
      const selected=getSet(root,edit.kind,activeId(root,edit.kind)),removed=getSet(root,edit.kind,edit.id),index=all.indexOf(removed);
      parent.removeChild(removed);const remaining=sets(root,edit.kind);
      selectElement(root,edit.kind,removed===selected?remaining[Math.min(index,remaining.length-1)]:selected);break;
    }
    case 'item': {
      if (!/^\d+$/.test(edit.id)) throw new Error('아이템 ID는 음수가 아닌 정수여야 합니다.');
      requireInteger(Number(edit.id), '아이템 ID');
      let items = child(root, 'Items');
      if (!items) { items = document.createElement('Items'); root.appendChild(items); }
      let item = children(items, 'Item').find(node => attr(node, 'id') === edit.id);
      if (!item) {
        item = document.createElement('Item'); item.setAttribute('id', edit.id);
        items.insertBefore(item, child(items, 'ItemSet') ?? null);
      }
      replaceDirectText(item, edit.text);
      break;
    }
    case 'item-equip': {
      const output = editBuild(writeXml(document), { type: 'item', id: edit.id, text: edit.text });
      return editBuild(output, { type: 'slot', setId: edit.setId, slot: edit.slot, itemId: edit.id });
    }
    case 'slot': {
      const set = getSet(root, 'items', edit.setId);
      if (edit.itemId !== '0' && !children(child(root, 'Items'), 'Item').some(node => attr(node, 'id') === edit.itemId))
        throw new Error(`존재하지 않는 아이템: ${edit.itemId}`);
      let slot = children(set, 'Slot').find(node => attr(node, 'name') === edit.slot);
      if (!slot) { slot = document.createElement('Slot'); slot.setAttribute('name', edit.slot); set.appendChild(slot); }
      slot.setAttribute('itemId', edit.itemId);
      break;
    }
    case 'skill-group': {
      const group = getGroup(getSet(root, 'skills', edit.setId), edit.groupId);
      putAttributes(group, edit.group.attributes);
      putAttributes(group, { label: edit.group.label, slot: edit.group.slot, enabled: String(edit.group.enabled), includeInFullDPS: String(edit.group.includeInFullDPS) });
      editGems(group, edit.group.gems);
      break;
    }
    case 'skill-active': {
      requireInteger(edit.index,'스킬 효과',1);getGroup(getSet(root,'skills',edit.setId),edit.groupId).setAttribute(edit.calcs?'mainActiveSkillCalcs':'mainActiveSkill',String(edit.index));break;
    }
    case 'gem-stat-set': {
      requireInteger(edit.index,'스킬 모드',1);if(!edit.grantedEffectId)throw new Error('원본 스킬 효과 ID가 필요합니다.');
      const group=getGroup(getSet(root,'skills',edit.setId),edit.groupId),gems=children(group,'Gem');requireInteger(edit.gemIndex,'젬',1,gems.length);
      const gem=gems[edit.gemIndex-1],tag=edit.calcs?'StatSetCalcsIndex':'StatSetIndex';
      let setting=children(gem,tag).filter(node=>attr(node,'grantedEffect')===edit.grantedEffectId).at(-1);
      if(!setting){setting=document.createElement(tag);gem.appendChild(setting);}
      putAttributes(setting,{grantedEffect:edit.grantedEffectId,index:String(edit.index)});break;
    }
    case 'gem-option': {
      const group=getGroup(getSet(root,'skills',edit.setId),edit.groupId),gems=children(group,'Gem');requireInteger(edit.gemIndex,'젬',1,gems.length);
      if(edit.value===undefined)gems[edit.gemIndex-1].removeAttribute(edit.key);
      else{requireInteger(edit.value,'스킬 선택값',edit.key.startsWith('skillPart')?1:0);gems[edit.gemIndex-1].setAttribute(edit.key,String(edit.value));}break;
    }
    case 'skill-import-native': {
      if(edit.setId!==activeId(root,'skills')||edit.node.tag!=='Skill')throw new Error('텍스트 복원의 스킬 세트/태그가 올바르지 않습니다.');
      const group=fresh(edit.node);getSet(root,'skills',edit.setId).appendChild(group);
      for(const entry of edit.companions){if(!['Spectre','BeastCompanion'].includes(entry.tag)||typeof entry.id!=='string'||!entry.id)throw new Error('원본 미니언 목록 변경이 올바르지 않습니다.');if(!children(build,entry.tag).some(node=>attr(node,'id')===entry.id)){const node=document.createElement(entry.tag);node.setAttribute('id',entry.id);build.appendChild(node);}}break;
    }
    case 'skill-copy-native': {
      if(edit.setId!==activeId(root,'skills'))throw new Error('현재 활성 스킬 세트에서만 복사할 수 있습니다.');
      const source=getGroup(getSet(root,'skills',edit.setId),edit.groupId),target=getSet(root,'skills',edit.targetSetId);
      target.appendChild(source.cloneNode(true));break;
    }
    case 'skill-native-order': {
      if(edit.setId!==activeId(root,'skills'))throw new Error('현재 활성 스킬 세트만 관리할 수 있습니다.');
      const set=getSet(root,'skills',edit.setId),groups=children(set,'Skill');
      if(new Set(edit.order).size!==edit.order.length||edit.order.some(id=>!/^\d+$/.test(id)||String(Number(id))!==id||Number(id)<1||Number(id)>groups.length))throw new Error('원본 스킬 그룹 순서의 출처가 올바르지 않습니다.');
      const copies=edit.order.map(id=>groups[Number(id)-1].cloneNode(true));
      groups.forEach((group,index)=>{if(index<copies.length)set.replaceChild(copies[index],group);else set.removeChild(group);});
      break;
    }
    case 'main-skill-native': {
      const selected=activeId(root,'skills'),count=selected?children(getSet(root,'skills',selected),'Skill').length:0;
      requireInteger(edit.index,'원본 주력 스킬 그룹',1,Math.max(1,count));build.setAttribute('mainSocketGroup',String(edit.index));break;
    }
    case 'skill-add': {
      const set = getSet(root, 'skills', edit.setId);
      const group = document.createElement('Skill');
      putAttributes(group, { label: '새 스킬 그룹', enabled: 'true', includeInFullDPS: 'false', mainActiveSkill: '1', mainActiveSkillCalcs: '1' });
      set.appendChild(group);
      break;
    }
    case 'skill-remove': {
      const set = getSet(root, 'skills', edit.setId);
      const group = getGroup(set, edit.groupId);
      set.removeChild(group);
      if (edit.setId === activeId(root, 'skills')) {
        const main = number(attr(build, 'mainSocketGroup'), 1);
        if (Number(edit.groupId) < main) build.setAttribute('mainSocketGroup', String(main - 1));
        clampMain(root);
      }
      break;
    }
    case 'main-skill': {
      const selected = activeId(root, 'skills');
      const count = selected ? children(getSet(root, 'skills', selected), 'Skill').length : 0;
      requireInteger(edit.index, '주력 스킬 그룹', 1, count);
      build.setAttribute('mainSocketGroup', String(edit.index));
      break;
    }
    case 'tree-nodes': {
      for (const node of edit.nodes) requireInteger(node, '패시브 노드');
      getSet(root, 'tree', edit.specId).setAttribute('nodes', [...new Set(edit.nodes)].join(','));
      break;
    }
    case 'config': {
      if (!edit.key) throw new Error('설정 이름이 필요합니다.');
      if (typeof edit.value === 'number' && !Number.isFinite(edit.value)) throw new Error('설정 수치가 올바르지 않습니다.');
      const set = getSet(root, 'config', edit.setId);
      let input = children(set, 'Input').filter(node => attr(node, 'name') === edit.key).at(-1);
      if (!input) { input = document.createElement('Input'); input.setAttribute('name', edit.key); set.appendChild(input); }
      for (const type of ['boolean', 'number', 'string']) input.removeAttribute(type);
      input.setAttribute(typeof edit.value, String(edit.value));
      break;
    }
    case 'config-remove': {
      const set=getSet(root,'config',edit.setId);for(const input of children(set,'Input'))if(attr(input,'name')===edit.key)set.removeChild(input);break;
    }
    case 'character': {
      requireInteger(edit.level, '캐릭터 레벨', 1, 100);
      if (edit.level !== number(attr(build, 'level'), 1)) build.setAttribute('characterLevelAutoMode', 'false');
      putAttributes(build, { level: String(edit.level), className: edit.className, ascendClassName: edit.ascendancy });
      const classLegacyId = edit.classLegacyId ?? edit.classId;
      const classInternalId = edit.classInternalId;
      const ascendancyLegacyId = edit.ascendancyLegacyId ?? edit.ascendancyId;
      const selectedTree = activeId(root, 'tree');
      if (selectedTree) {
        const spec = getSet(root, 'tree', selectedTree);
        if (edit.treeVersion) spec.setAttribute('treeVersion', edit.treeVersion);
        if (classLegacyId !== undefined) { requireInteger(classLegacyId, '직업 legacy ID'); spec.setAttribute('classId', String(classLegacyId)); }
        if (classInternalId !== undefined) { requireInteger(classInternalId, '직업 internal ID'); spec.setAttribute('classInternalId', String(classInternalId)); }
        if (ascendancyLegacyId !== undefined) { requireInteger(ascendancyLegacyId, '전직 legacy ID'); spec.setAttribute('ascendClassId', String(ascendancyLegacyId)); }
        if (edit.ascendancyInternalId !== undefined) spec.setAttribute('ascendancyInternalId', edit.ascendancyInternalId);
        if (edit.startNodeId) spec.setAttribute('startNodeId', edit.startNodeId);
      }
      break;
    }
    case 'active-set': {
      const selected = getSet(root, edit.kind, edit.id);
      const [section, , key] = setKinds[edit.kind];
      child(root, section)!.setAttribute(key, edit.id);
      if (edit.kind === 'items' && selected.hasAttribute('useSecondWeaponSet'))
        child(root, 'Items')!.setAttribute('useSecondWeaponSet', attr(selected, 'useSecondWeaponSet'));
      if (edit.kind === 'skills') clampMain(root);
      break;
    }
    default: { const exhaustive: never = edit; throw new Error(`지원하지 않는 편집: ${String(exhaustive)}`); }
  }
  const output = writeXml(document);
  // Attribute/name edits are untrusted too; never return malformed XML to a caller.
  readXml(output);
  return output;
}

/** Transient calculation/export projection. The editor's original ordering stays intact. */
export function projectActiveXml(xml: string): string {
  const document = readXml(xml);
  const root = document.documentElement!;
  for (const kind of Object.keys(setKinds) as SetKind[]) {
    const all = sets(root, kind);
    if (!all.length) continue;
    const explicit = attr(child(root, setKinds[kind][0]), setKinds[kind][2]);
    if (all.length > 1 && !all.some((node,index) => setId(node,index,kind) === explicit))
      throw new Error(`활성 ${kind} 세트가 명확하지 않습니다. 계산 전에 사용할 세트를 선택해 주세요.`);
    const selected = getSet(root, kind, activeId(root, kind));
    const parent = child(root, setKinds[kind][0])!;
    if (selected !== parent && selected !== all[0]) parent.insertBefore(selected, all[0]);
    parent.setAttribute(setKinds[kind][2], kind === 'tree' ? '1' : attr(selected, 'id', '1'));
    if (kind === 'items' && selected.hasAttribute('useSecondWeaponSet'))
      parent.setAttribute('useSecondWeaponSet', attr(selected, 'useSecondWeaponSet'));
  }
  return writeXml(document);
}

export interface BlankBuildOptions {
  defaultTreeVersion?: string;
  targetVersion?: string;
  characterClass?: CatalogClass;
  ascendancyId?: string;
}

export function createBlankXml(options: BlankBuildOptions = {}): string {
  const treeVersion = options.defaultTreeVersion ?? '0_1';
  const klass = options.characterClass;
  const ascendancy = options.ascendancyId ? klass?.ascendancies.find(entry => entry.id === options.ascendancyId) : undefined;
  const buildAttributes = [
    ['level', '1'],
    ['characterLevelAutoMode', 'false'],
    ['className', klass?.name ?? ''],
    ['ascendClassName', ascendancy?.name ?? ''],
    ['mainSocketGroup', '1'],
    ['targetVersion', options.targetVersion ?? '0_1'],
  ].map(([key, value]) => `${key}="${escapeAttribute(value)}"`).join(' ');
  const specAttributes = [
    ['title', '기본'],
    ['nodes', ''],
    ['treeVersion', treeVersion],
    ...(klass ? [['classId', String(klass.legacyId)], ['classInternalId', String(klass.internalId)]] : []),
    ...(ascendancy ? [['ascendClassId', String(ascendancy.legacyId)], ['ascendancyInternalId', ascendancy.id]] : [['ascendClassId', '0'], ['ascendancyInternalId', '']]),
    ...(klass?.startNodeId ? [['startNodeId', klass.startNodeId]] : []),
  ].map(([key, value]) => `${key}="${escapeAttribute(value)}"`).join(' ');
  return '<?xml version="1.0" encoding="UTF-8"?>\n<PathOfBuilding2>\n'
    + `  <Build ${buildAttributes}/>\n`
    + `  <Tree activeSpec="1"><Spec ${specAttributes}><Sockets/></Spec></Tree>\n`
    + '  <Skills activeSkillSet="1"><SkillSet id="1" title="기본"/></Skills>\n'
    + '  <Items activeItemSet="1" useSecondWeaponSet="false"><ItemSet id="1" title="기본" useSecondWeaponSet="false"/></Items>\n'
    + '  <Config activeConfigSet="1"><ConfigSet id="1" title="기본"/></Config>\n'
    + '</PathOfBuilding2>';
}
