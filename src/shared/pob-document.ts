import { DOMParser, XMLSerializer, type Document, type Element, type Node } from '@xmldom/xmldom';
import type { Attributes, BuildEdit, Gem, ParsedBuild, SkillGroup } from './contracts';

/** Also enforced on edited output; documents remain small enough to parse in the renderer. */
export const MAX_XML_BYTES = 10 * 1024 * 1024;

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
      slots: Object.fromEntries(children(set, 'Slot').map(slot => [attr(slot, 'name'), attr(slot, 'itemId', '0')])),
    })),
    skillSets: sets(root, 'skills').map((set, index) => ({
      id: setId(set, index, 'skills'), title: attr(set, 'title', '기본'), active: setId(set, index, 'skills') === activeId(root, 'skills'),
      groups: children(set, 'Skill').map(skillGroup),
    })),
    trees: sets(root, 'tree').map((set, index) => ({
      id: String(index + 1), title: attr(set, 'title', `트리 ${index + 1}`), version: attr(set, 'treeVersion'),
      active: String(index + 1) === activeId(root, 'tree'), attributes: attributes(set),
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
  const document = readXml(xml);
  const root = document.documentElement!;
  const build = child(root, 'Build')!;
  switch (edit.type) {
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
      let input = children(set, 'Input').find(node => attr(node, 'name') === edit.key);
      if (!input) { input = document.createElement('Input'); input.setAttribute('name', edit.key); set.appendChild(input); }
      for (const type of ['boolean', 'number', 'string']) input.removeAttribute(type);
      input.setAttribute(typeof edit.value, String(edit.value));
      break;
    }
    case 'character':
      requireInteger(edit.level, '캐릭터 레벨', 1, 100);
      putAttributes(build, { level: String(edit.level), className: edit.className, ascendClassName: edit.ascendancy });
      break;
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
    const selected = getSet(root, kind, activeId(root, kind));
    const parent = child(root, setKinds[kind][0])!;
    if (selected !== parent && selected !== all[0]) parent.insertBefore(selected, all[0]);
    parent.setAttribute(setKinds[kind][2], kind === 'tree' ? '1' : attr(selected, 'id', '1'));
    if (kind === 'items' && selected.hasAttribute('useSecondWeaponSet'))
      parent.setAttribute('useSecondWeaponSet', attr(selected, 'useSecondWeaponSet'));
  }
  return writeXml(document);
}

export function createBlankXml(): string {
  return '<?xml version="1.0" encoding="UTF-8"?>\n<PathOfBuilding2>\n'
    + '  <Build level="1" className="" ascendClassName="" mainSocketGroup="1" targetVersion="0_1"/>\n'
    + '  <Tree activeSpec="1"><Spec title="기본" nodes=""><Sockets/></Spec></Tree>\n'
    + '  <Skills activeSkillSet="1"><SkillSet id="1" title="기본"/></Skills>\n'
    + '  <Items activeItemSet="1" useSecondWeaponSet="false"><ItemSet id="1" title="기본" useSecondWeaponSet="false"/></Items>\n'
    + '  <Config activeConfigSet="1"><ConfigSet id="1" title="기본"/></Config>\n'
    + '</PathOfBuilding2>';
}
