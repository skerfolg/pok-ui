import test from 'node:test';
import assert from 'node:assert/strict';
import { DOMParser, XMLSerializer, type Element } from '@xmldom/xmldom';
import { createBlankXml, editBuild, MAX_XML_BYTES, parseBuild, projectActiveXml } from '../src/shared/pob-document';

// Entirely synthetic: no account information or personal build is used as a fixture.
const fixture = `<?xml version="1.0"?>
<PathOfBuilding2 future="keep"><!-- keep this -->
  <Build className="TestClass" ascendClassName="TestAscendancy" level="42" mainSocketGroup="3" unknown="build">
    <PlayerStat stat="Life" value="123.40"/><PlayerStat stat="DPS" value="45"/><FutureStat value="keep"/>
  </Build>
  <Items activeItemSet="2" useSecondWeaponSet="true" future="items">
    <Item id="5" variant="7">Rarity: RARE
Test Item
Test Base
--------
An example modifier<ModRange id="17" range="0.25"/><FutureItem value="preserve"/></Item>
    <Item id="9">Rarity: NORMAL
Other Base</Item>
    <ItemSet id="8" title="Inactive items" useSecondWeaponSet="false"><Slot name="Weapon 1" itemId="9"/><FutureSlot/></ItemSet>
    <FutureItems marker="keep"/>
    <ItemSet id="2" title="Active items" useSecondWeaponSet="true"><Slot name="Weapon 1" itemId="5" active="true"/><Slot name="Weapon 1 Swap" itemId="9"/></ItemSet>
  </Items>
  <Skills activeSkillSet="2" future="skills">
    <SkillSet id="8" title="Inactive skills"><Skill label="Inactive" enabled="false"><Gem nameSpec="Stored" level="7" quality="2" enabled="false" gemId="StoredID"/></Skill></SkillSet>
    <SkillSet id="2" title="Active skills" unknown="set">
      <Skill label="First" slot="Weapon 1" enabled="true" includeInFullDPS="true" mainActiveSkill="2" mystery="group">
        <Gem nameSpec="Same" gemId="same-id" skillId="same-skill" level="10" quality="0" enabled="false" enableGlobal1="false" enableGlobal2="true" variantId="variant"><FutureGem token="first"/></Gem>
        <Gem nameSpec="Same" gemId="same-id" skillId="same-skill" level="10" quality="0" enabled="false" enableGlobal1="false" enableGlobal2="true" variantId="variant"><FutureGem token="second"/></Gem>
        <FutureGroup/>
      </Skill>
      <Skill label="Second" enabled="false"><Gem nameSpec="Other" level="4" quality="0" enabled="true"/></Skill>
      <Skill label="Main" enabled="true" mainActiveSkill="2" mainActiveSkillCalcs="3"><Gem nameSpec="Main gem" level="20" quality="10" enabled="true"/></Skill>
    </SkillSet>
  </Skills>
  <Tree activeSpec="2"><Spec title="Inactive tree" treeVersion="test" nodes="7,8"><WeaponSet1 nodes="8"/></Spec>
    <FutureTree/><Spec title="Active tree" nodes="1,2,3" treeVersion="test2" future="spec"><WeaponSet1 nodes="2"/><WeaponSet2 nodes="3"/><Sockets><Socket nodeId="2" itemId="9"/></Sockets><Overrides><AttributeOverride id="2" value="int"/></Overrides></Spec>
  </Tree>
  <Config activeConfigSet="2"><ConfigSet id="8" title="Inactive config"><Input name="a" boolean="false"/></ConfigSet>
    <ConfigSet id="2" title="Active config"><Input name="a" number="4" unknown="input"/><Input name="b" string="hello"/><Input name="c" boolean="true"/><Placeholder name="a" number="99"/><FutureConfig/></ConfigSet>
  </Config>
  <Notes>Preserve arbitrary notes</Notes><Import generic="metadata"/><FutureRoot><Deep value="unchanged"/></FutureRoot>
</PathOfBuilding2>`;

function dom(xml: string) { return new DOMParser().parseFromString(xml, 'application/xml'); }
function elements(xml: string, tag: string): Element[] { return Array.from(dom(xml).getElementsByTagName(tag)); }
function serial(node: Element): string { return new XMLSerializer().serializeToString(node); }
function activeGroup(xml: string, index = 0) { return parseBuild(xml).skillSets.find(set => set.active)!.groups[index]; }

test('parses all sets, active IDs, one-based group/spec IDs and saved stats without treating placeholders as inputs', () => {
  const build = parseBuild(fixture);
  assert.equal(build.level, 42);
  assert.equal(build.mainSocketGroup, 3);
  assert.equal(build.className, 'TestClass');
  assert.equal(build.ascendancy, 'TestAscendancy');
  assert.deepEqual(build.itemSets.map(set => [set.id, set.active]), [['8', false], ['2', true]]);
  assert.equal(build.itemSets[1].slots['Weapon 1 Swap'], '9');
  assert.equal(build.items[0].name, 'Test Item');
  assert.equal(build.items[0].base, 'Test Base');
  assert.ok(!build.items[0].text.includes('ModRange'));
  assert.deepEqual(build.skillSets[1].groups.map(group => group.id), ['1', '2', '3']);
  assert.equal(build.skillSets[1].groups[0].gems[0].enabled, false);
  assert.equal(build.skillSets[1].groups[0].attributes.mainActiveSkill, '2');
  assert.deepEqual(build.trees.map(tree => [tree.id, tree.active]), [['1', false], ['2', true]]);
  assert.deepEqual(build.trees[1].sockets, [{ nodeId: '2', itemId: '9' }]);
  assert.deepEqual(build.configs[1].inputs, { a: 4, b: 'hello', c: true });
  assert.deepEqual(build.configs[1].placeholders, [{ name: 'a', number: '99' }]);
  assert.deepEqual(build.stats, { Life: '123.40', DPS: '45' });
});

test('item edits preserve child metadata and every unedited section', () => {
  const output = editBuild(fixture, { type: 'item', id: '5', text: 'Rarity: UNIQUE\nEdited\nBase\nA & B < C' });
  const item = elements(output, 'Item')[0];
  assert.equal(item.getAttribute('variant'), '7');
  assert.equal(item.getElementsByTagName('ModRange')[0].getAttribute('range'), '0.25');
  assert.equal(item.getElementsByTagName('FutureItem').length, 1);
  assert.equal(parseBuild(output).items[0].text, 'Rarity: UNIQUE\nEdited\nBase\nA & B < C');
  for (const section of ['Skills', 'Tree', 'Config', 'Notes', 'Import', 'FutureRoot'])
    assert.equal(serial(elements(output, section)[0]), serial(elements(fixture, section)[0]));
  assert.ok(output.includes('<!-- keep this -->'));
});

test('magic item metadata is not misidentified as a base name', () => {
  const output = editBuild(fixture, { type: 'item', id: '5', text: 'Rarity: MAGIC\nSynthetic Flask of Testing\nUnique ID: synthetic\nItem Level: 20' });
  assert.equal(parseBuild(output).items[0].name, 'Synthetic Flask of Testing');
  assert.equal(parseBuild(output).items[0].base, '');
});

test('new numeric item IDs can be inserted and equipped without changing existing items', () => {
  const text = 'Rarity: NORMAL\nSynthetic Base';
  const inserted = editBuild(fixture, { type: 'item', id: '10', text });
  assert.equal(parseBuild(inserted).items.length, 3);
  assert.equal(parseBuild(inserted).items[2].text, text);
  assert.deepEqual(elements(inserted, 'Item').slice(0, 2).map(serial), elements(fixture, 'Item').map(serial));
  const equipped = editBuild(inserted, { type: 'slot', setId: '2', slot: 'Weapon 1', itemId: '10' });
  assert.equal(parseBuild(equipped).itemSets[1].slots['Weapon 1'], '10');
  for (const id of ['-1', '1.5', 'item', String(Number.MAX_SAFE_INTEGER + 1)])
    assert.throws(() => editBuild(fixture, { type: 'item', id, text }));
});

test('item-equip and batch edits are one logical XML operation for callers', () => {
  const equipped = editBuild(fixture, { type: 'item-equip', setId: '2', slot: 'Weapon 1', id: '10', text: 'Rarity: NORMAL\nCatalog Base' });
  const parsed = parseBuild(equipped);
  assert.equal(parsed.items.find(item => item.id === '10')?.name, 'Catalog Base');
  assert.equal(parsed.itemSets[1].slots['Weapon 1'], '10');
  const batched = editBuild(fixture, { type: 'batch', edits: [
    { type: 'config', setId: '2', key: 'a', value: 5 },
    { type: 'tree-nodes', specId: '2', nodes: [9, 10] },
  ] });
  assert.equal(parseBuild(batched).configs[1].inputs.a, 5);
  assert.deepEqual(parseBuild(batched).trees[1].nodes, [9, 10]);
  assert.equal(serial(elements(batched, 'SkillSet')[0]), serial(elements(fixture, 'SkillSet')[0]));
});

test('slot edits target the requested set and preserve weapon-set data', () => {
  const output = editBuild(fixture, { type: 'slot', setId: '2', slot: 'Weapon 1', itemId: '0' });
  const result = parseBuild(output);
  assert.equal(result.itemSets[1].slots['Weapon 1'], '0');
  assert.equal(result.itemSets[1].slots['Weapon 1 Swap'], '9');
  assert.equal(result.itemSets[0].slots['Weapon 1'], '9');
  assert.equal(elements(output, 'Items')[0].getAttribute('useSecondWeaponSet'), 'true');
  assert.equal(elements(output, 'Slot')[1].getAttribute('active'), 'true');
  assert.throws(() => editBuild(fixture, { type: 'slot', setId: '2', slot: 'Weapon 1', itemId: '404' }));
});

test('gem removal keeps the surviving duplicate gem metadata by source index', () => {
  const group = activeGroup(fixture);
  group.gems = [group.gems[1]];
  group.gems[0].level = 15;
  const output = editBuild(fixture, { type: 'skill-group', setId: '2', groupId: '1', group });
  const saved = activeGroup(output);
  assert.equal(saved.gems.length, 1);
  assert.equal(saved.gems[0].level, 15);
  assert.equal(saved.gems[0].enabled, false);
  assert.equal(saved.gems[0].attributes.enableGlobal2, 'true');
  assert.equal(saved.attributes.mystery, 'group');
  assert.equal(saved.attributes.mainActiveSkill, '2');
  assert.equal(elements(output, 'FutureGem')[0].getAttribute('token'), 'second');
  assert.equal(elements(output, 'FutureGroup').length, 1);
  assert.equal(serial(elements(output, 'SkillSet')[0]), serial(elements(fixture, 'SkillSet')[0]));
});

test('renaming a gem clears only obsolete resolver IDs', () => {
  const group = activeGroup(fixture);
  group.gems[0].name = 'Renamed';
  const saved = activeGroup(editBuild(fixture, { type: 'skill-group', setId: '2', groupId: '1', group }));
  assert.equal(saved.gems[0].name, 'Renamed');
  assert.equal(saved.gems[0].attributes.gemId, undefined);
  assert.equal(saved.gems[0].attributes.skillId, undefined);
  assert.equal(saved.gems[0].attributes.variantId, undefined);
  assert.equal(saved.gems[0].attributes.enableGlobal1, 'false');
  assert.equal(saved.gems[1].attributes.gemId, 'same-id');
});

test('main skill selection uses the active set and preserves internal active-skill indexes', () => {
  const output = editBuild(fixture, { type: 'main-skill', index: 2 });
  assert.equal(parseBuild(output).mainSocketGroup, 2);
  assert.equal(activeGroup(output, 2).attributes.mainActiveSkill, '2');
  assert.equal(activeGroup(output, 2).attributes.mainActiveSkillCalcs, '3');
  assert.throws(() => editBuild(fixture, { type: 'main-skill', index: 4 }));
  assert.throws(() => editBuild(fixture, { type: 'main-skill', index: 0 }));
});

test('adding/removing groups maintains a valid main group without affecting inactive removals', () => {
  const output = editBuild(fixture, { type: 'skill-remove', setId: '2', groupId: '1' });
  assert.equal(parseBuild(output).mainSocketGroup, 2);
  assert.equal(activeGroup(output, 1).label, 'Main');
  const removedMain = editBuild(output, { type: 'skill-remove', setId: '2', groupId: '2' });
  assert.equal(parseBuild(removedMain).mainSocketGroup, 1);
  const inactive = editBuild(fixture, { type: 'skill-remove', setId: '8', groupId: '1' });
  assert.equal(parseBuild(inactive).mainSocketGroup, 3);
  const added = editBuild(inactive, { type: 'skill-add', setId: '8' });
  assert.equal(parseBuild(added).skillSets[0].groups[0].gems.length, 0);
});

test('active-set changes select IDs rather than positions, clamp main and sync active weapon-set choice', () => {
  for (const kind of ['items', 'skills', 'config'] as const) {
    const parsed = parseBuild(editBuild(fixture, { type: 'active-set', kind, id: '8' }));
    const selected = kind === 'items' ? parsed.itemSets : kind === 'skills' ? parsed.skillSets : parsed.configs;
    assert.equal(selected.find(set => set.active)?.id, '8');
  }
  assert.equal(parseBuild(editBuild(fixture, { type: 'active-set', kind: 'skills', id: '8' })).mainSocketGroup, 1);
  assert.equal(elements(editBuild(fixture, { type: 'active-set', kind: 'items', id: '8' }), 'Items')[0].getAttribute('useSecondWeaponSet'), 'false');
  assert.equal(parseBuild(editBuild(fixture, { type: 'active-set', kind: 'tree', id: '1' })).trees[0].active, true);
  assert.throws(() => editBuild(fixture, { type: 'active-set', kind: 'tree', id: '8' }));
});

test('active projection places all four selected elements first and keeps all inactive/unknown data', () => {
  const output = projectActiveXml(fixture);
  for (const tag of ['ItemSet', 'SkillSet', 'ConfigSet']) {
    const projected = elements(output, tag);
    assert.equal(projected[0].getAttribute('id'), '2');
    assert.equal(projected[1].getAttribute('id'), '8');
    assert.deepEqual(projected.map(serial).sort(), elements(fixture, tag).map(serial).sort());
  }
  assert.equal(elements(output, 'Spec')[0].getAttribute('title'), 'Active tree');
  assert.equal(elements(output, 'Tree')[0].getAttribute('activeSpec'), '1');
  assert.deepEqual(elements(output, 'Spec').map(serial).sort(), elements(fixture, 'Spec').map(serial).sort());
  assert.equal(parseBuild(output).mainSocketGroup, 3);
  assert.equal(elements(output, 'FutureTree').length, 1);
  assert.equal(elements(output, 'FutureItems').length, 1);
  assert.equal(projectActiveXml(output), output);
  assert.equal(parseBuild(fixture).trees[1].active, true);
});

test('config edits preserve typed inputs, separate placeholders, unknown metadata and inactive config', () => {
  const output = editBuild(fixture, { type: 'config', setId: '2', key: 'a', value: false });
  assert.equal(parseBuild(output).configs[1].inputs.a, false);
  assert.equal(elements(output, 'Input')[1].hasAttribute('number'), false);
  assert.equal(elements(output, 'Input')[1].getAttribute('unknown'), 'input');
  assert.equal(elements(output, 'Placeholder')[0].getAttribute('number'), '99');
  assert.equal(serial(elements(output, 'ConfigSet')[0]), serial(elements(fixture, 'ConfigSet')[0]));
  const added = editBuild(output, { type: 'config', setId: '2', key: 'custom', value: 'first\nsecond & "quoted"' });
  assert.equal(parseBuild(added).configs[1].inputs.custom, 'first\nsecond & "quoted"');
  assert.throws(() => editBuild(fixture, { type: 'config', setId: '2', key: 'a', value: NaN }));
});

test('tree edits preserve weapon assignments, sockets, overrides, unknown attributes and other specs', () => {
  const output = editBuild(fixture, { type: 'tree-nodes', specId: '2', nodes: [1, 3, 3, 4] });
  assert.deepEqual(parseBuild(output).trees[1].nodes, [1, 3, 4]);
  for (const tag of ['WeaponSet1', 'WeaponSet2', 'Sockets', 'Overrides'])
    assert.deepEqual(elements(output, tag).map(serial), elements(fixture, tag).map(serial));
  assert.equal(serial(elements(output, 'Spec')[0]), serial(elements(fixture, 'Spec')[0]));
  assert.equal(parseBuild(output).trees[1].attributes.future, 'spec');
});

test('character edits update build and active spec metadata without touching inactive specs', () => {
  const output = editBuild(fixture, { type: 'character', level: 55, className: 'Sorceress', ascendancy: 'Stormweaver',
    classLegacyId: 7, classInternalId: 4, ascendancyLegacyId: 1, ascendancyInternalId: 'Sorceress1', treeVersion: '0_5', startNodeId: '123' });
  const parsed = parseBuild(output);
  assert.equal(parsed.level, 55);
  assert.equal(parsed.className, 'Sorceress');
  assert.equal(parsed.ascendancy, 'Stormweaver');
  const specs = elements(output, 'Spec');
  assert.equal(specs[0].getAttribute('treeVersion'), 'test');
  assert.equal(specs[1].getAttribute('treeVersion'), '0_5');
  assert.equal(specs[1].getAttribute('classId'), '7');
  assert.equal(specs[1].getAttribute('classInternalId'), '4');
  assert.equal(specs[1].getAttribute('ascendClassId'), '1');
  assert.equal(specs[1].getAttribute('ascendancyInternalId'), 'Sorceress1');
  assert.equal(specs[1].getAttribute('startNodeId'), '123');
});

test('character edits can explicitly clear ascendancy using PoB unascended convention', () => {
  const output = editBuild(fixture, { type: 'character', level: 55, className: 'Sorceress', ascendancy: '',
    classLegacyId: 7, classInternalId: 4, ascendancyLegacyId: 0, ascendancyInternalId: '', treeVersion: '0_5', startNodeId: '123' });
  const parsed = parseBuild(output);
  assert.equal(parsed.className, 'Sorceress');
  assert.equal(parsed.ascendancy, '');
  const spec = elements(output, 'Spec')[1];
  assert.equal(spec.getAttribute('ascendClassId'), '0');
  assert.equal(spec.getAttribute('ascendancyInternalId'), '');
});

test('literal attribute newlines/tabs/CR survive parsing and repeated edits without numeric escape output', () => {
  const multiline = 'first\r\nsecond\nthird\tfourth > quoted & text';
  const xml = fixture.replace('string="hello"', `string="first\r\nsecond\nthird\tfourth > quoted &amp; text"`)
    .replace('future="keep"', 'future="line\nnext"');
  assert.equal(parseBuild(xml).configs[1].inputs.b, multiline);
  let output = xml;
  for (let index = 0; index < 3; index++) output = editBuild(output, { type: 'character', level: 43, className: 'C', ascendancy: 'A' });
  assert.equal(parseBuild(output).configs[1].inputs.b, multiline);
  assert.ok(output.includes('future="line\nnext"'));
  assert.ok(!/&#(?:10|13|9);/.test(output));
  assert.equal(parseBuild(projectActiveXml(output)).configs[0].inputs.b, multiline);
});

test('newline conversion leaves comments, CDATA and literal entity text untouched', () => {
  const xml = fixture.replace('<Notes>Preserve arbitrary notes</Notes>', '<Notes><![CDATA[<fake value="one\ntwo"> & text]]><!-- <fake value="a\nb"> --></Notes>')
    .replace('string="hello"', 'string="literal &amp;#10; and &#10; real"');
  const output = projectActiveXml(xml);
  assert.ok(output.includes('<![CDATA[<fake value="one\ntwo"> & text]]>'));
  assert.ok(output.includes('<!-- <fake value="a\nb"> -->'));
  assert.equal(parseBuild(output).configs[0].inputs.b, 'literal &#10; and \n real');
});

test('legacy flat sections can be parsed and edited without discarding unknown children', () => {
  const xml = '<PathOfBuilding2><Build level="1"/><Items><Item id="1">Rarity: NORMAL\nBase</Item><Slot name="Weapon 1" itemId="1"/></Items><Skills><Skill label="Legacy"><Gem nameSpec="Test" level="1" enabled="false"/></Skill><Future/></Skills><Config><Input name="test" boolean="true"/><Placeholder name="test" string="keep"/></Config></PathOfBuilding2>';
  assert.equal(parseBuild(xml).skillSets[0].groups[0].gems[0].enabled, false);
  const output = editBuild(xml, { type: 'config', setId: '1', key: 'test', value: false });
  assert.equal(parseBuild(output).configs[0].inputs.test, false);
  assert.equal(elements(projectActiveXml(output), 'Future').length, 1);
});

test('blank XML is valid and editable without invented saved calculation values', () => {
  const xml = createBlankXml();
  assert.deepEqual(parseBuild(xml).stats, {});
  assert.equal(parseBuild(xml).level, 1);
  const withGroup = editBuild(xml, { type: 'skill-add', setId: '1' });
  assert.equal(parseBuild(withGroup).skillSets[0].groups.length, 1);
  const emptyAgain = editBuild(withGroup, { type: 'skill-remove', setId: '1', groupId: '1' });
  assert.equal(parseBuild(emptyAgain).mainSocketGroup, 1);
  assert.doesNotThrow(() => projectActiveXml(emptyAgain));
});

test('blank XML catalog defaults keep the character unascended unless an ascendancy is explicit', () => {
  const xml = createBlankXml({ defaultTreeVersion: '0_5', characterClass: { id: 'Sorceress', internalId: 4, legacyId: 3, name: 'Sorceress', startNodeId: '123',
    ascendancies: [{ id: 'Sorceress1', name: 'Stormweaver', legacyId: 1 }] } });
  const parsed = parseBuild(xml);
  assert.equal(parsed.className, 'Sorceress');
  assert.equal(parsed.ascendancy, '');
  assert.equal(parsed.trees[0].version, '0_5');
  assert.equal(elements(xml, 'Build')[0].getAttribute('targetVersion'), '0_1');
  assert.equal(elements(xml, 'Spec')[0].getAttribute('classId'), '3');
  assert.equal(elements(xml, 'Spec')[0].getAttribute('classInternalId'), '4');
  assert.equal(elements(xml, 'Spec')[0].getAttribute('ascendClassId'), '0');
  assert.equal(elements(xml, 'Spec')[0].getAttribute('ascendancyInternalId'), '');
  assert.equal(elements(xml, 'Spec')[0].getAttribute('startNodeId'), '123');
});

test('blank XML applies an explicitly selected catalog ascendancy', () => {
  const xml = createBlankXml({ defaultTreeVersion: '0_5', ascendancyId: 'Sorceress1', characterClass: { id: 'Sorceress', internalId: 4, legacyId: 3, name: 'Sorceress', startNodeId: '123',
    ascendancies: [{ id: 'Sorceress1', name: 'Stormweaver', legacyId: 1 }] } });
  assert.equal(parseBuild(xml).ascendancy, 'Stormweaver');
  assert.equal(elements(xml, 'Spec')[0].getAttribute('ascendClassId'), '1');
  assert.equal(elements(xml, 'Spec')[0].getAttribute('ascendancyInternalId'), 'Sorceress1');
});

test('rejects DTD/entities, malformed XML, invalid characters, excessive depth and oversized input', () => {
  const invalid = [
    '<!DOCTYPE PathOfBuilding2 [<!ENTITY external SYSTEM "file:///secret">]>' + fixture,
    '<!ENTITY a "x">' + fixture,
    '<PathOfBuilding2><Build></PathOfBuilding2>',
    '<PathOfBuilding2><Build level=1/></PathOfBuilding2>',
    '<PathOfBuilding2><Build level="1" level="2"/></PathOfBuilding2>',
    fixture.replace('TestClass', '&unknown;'),
    fixture.replace('TestClass', '\u0000'),
    fixture.replace('TestClass', '&#0;'),
    fixture.replace('TestClass', '&#xD800;'),
    fixture.replace('TestClass', 'unescaped & value'),
    fixture + '<extra/>',
    '<wrong><Build/></wrong>',
    '<PathOfBuilding2><Build/>' + '<x>'.repeat(260) + '</x>'.repeat(260) + '</PathOfBuilding2>',
    ' '.repeat(MAX_XML_BYTES + 1),
  ];
  for (const [index, xml] of invalid.entries()) assert.throws(() => parseBuild(xml), `case ${index}: ${xml.slice(0, 80)}`);
});

test('rejects edits that cannot be applied safely instead of silently choosing another target', () => {
  assert.throws(() => editBuild(fixture, { type: 'item', id: '-1', text: 'x' }));
  assert.throws(() => editBuild(fixture, { type: 'skill-remove', setId: '2', groupId: '0' }));
  assert.throws(() => editBuild(fixture, { type: 'tree-nodes', specId: '2', nodes: [-1] }));
  assert.throws(() => editBuild(fixture, { type: 'character', level: 101, className: '', ascendancy: '' }));
  const group = activeGroup(fixture);
  group.gems[0].quality = -1;
  assert.throws(() => editBuild(fixture, { type: 'skill-group', setId: '2', groupId: '1', group }));
  assert.throws(() => editBuild(fixture, { type: 'item', id: '5', text: '\u0000' }));
});

test('explicit level edits disable PoB auto-level while class-only edits preserve its mode',()=>{
  const xml=createBlankXml().replace('characterLevelAutoMode="false"','characterLevelAutoMode="true"');
  const same=editBuild(xml,{type:'character',level:1,className:'Ranger',ascendancy:''});
  assert.match(same,/characterLevelAutoMode="true"/);
  const changed=editBuild(xml,{type:'character',level:50,className:'Ranger',ascendancy:''});
  assert.match(changed,/characterLevelAutoMode="false"/);
  assert.equal(parseBuild(changed).level,50);
});
