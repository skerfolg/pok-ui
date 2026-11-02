import test from 'node:test';
import assert from 'node:assert/strict';
import { DOMParser, XMLSerializer, type Element } from '@xmldom/xmldom';
import { createBlankXml, editBuild, MAX_XML_BYTES, parseBuild, projectActiveXml } from '../src/shared/pob-document';

// Entirely synthetic: no account information or personal build is used as a fixture.
test('native character patch updates matching build/spec identity and preserves level, inactive trees and unknown fields',()=>{
  let xml=createBlankXml().replace('</Spec>','<FutureSpec keep="yes"/></Spec>');
  xml=editBuild(xml,{type:'set-add',kind:'tree',title:'Inactive',copyFrom:'1'});xml=editBuild(xml,{type:'active-set',kind:'tree',id:'1'});
  const before=parseBuild(xml),edited=editBuild(xml,{type:'tree-native-patch',specId:'1',patch:{attributes:{classId:'1',classInternalId:'1',ascendClassId:'2',ascendancyInternalId:'Titan',nodes:'123'},buildAttributes:{className:'Warrior',ascendClassName:'Titan'}}}),after=parseBuild(edited);
  assert.equal(after.className,'Warrior');assert.equal(after.ascendancy,'Titan');assert.equal(after.level,before.level);assert.deepEqual(after.trees[1],before.trees[1]);assert.match(edited,/<FutureSpec keep="yes"\/>/);
  assert.throws(()=>editBuild(xml,{type:'tree-native-patch',specId:'1',patch:{attributes:{},buildAttributes:{level:'100'}}}),/캐릭터 속성/);
});
test('native item edits update owned legacy range and variant fields without removing future metadata',()=>{
  const xml=editBuild(createBlankXml(),{type:'item',id:'1',text:'Rarity: RARE\nSynthetic\nIron Ring'}).replace('</Item>','<ModRange id="1" range="0" future="keep"><FutureRange/></ModRange><FutureItem/></Item>');
  const result=editBuild(xml,{type:'item-native',id:'1',text:'Rarity: RARE\nChanged\nIron Ring',metadata:{variants:{variant:'2'},modRanges:{1:'1'}}});assert.match(result,/variant="2"/);assert.match(result,/id="1" range="1" future="keep"><FutureRange\/>/);assert.match(result,/<FutureItem\/>/);
  assert.throws(()=>editBuild(xml,{type:'item-native',id:'1',text:'Changed',metadata:{variants:{},modRanges:{}}}),/알 수 없는 metadata/);assert.match(xml,/range="0" future="keep"/);
});
test('native equipment patches sync active weapon flags and main skill while retaining inactive sets and slot metadata',()=>{
  let xml=createBlankXml().replace('<ItemSet id="1" title="기본" useSecondWeaponSet="false"/>','<ItemSet id="1" title="기본" useSecondWeaponSet="false" future="keep"><Slot name="Body Armour Jewel Socket 1" itemId="0" future="keep"><FutureSlot/></Slot></ItemSet>');xml=editBuild(xml,{type:'set-add',kind:'items',title:'Inactive',copyFrom:'1'});xml=editBuild(xml,{type:'active-set',kind:'items',id:'1'});
  const previous=parseBuild(xml).itemSets[1],edited=editBuild(xml,{type:'equipment-native-patch',setId:'1',patch:{slots:{'Body Armour Jewel Socket 1':'3'},useSecondWeaponSet:true,mainSocketGroup:2}}),parsed=parseBuild(edited);
  assert.equal(parsed.itemSets[0].useSecondWeaponSet,true);assert.equal(parsed.mainSocketGroup,2);assert.equal(parsed.itemSets[0].slots['Body Armour Jewel Socket 1'],'3');assert.deepEqual(parsed.itemSets[1],previous);assert.match(edited,/itemId="3" future="keep"><FutureSlot\/>/);assert.match(edited,/<Items activeItemSet="1" useSecondWeaponSet="true"/);
});
test('new attribute override containers require the complete original loader schema',()=>{
  assert.throws(()=>editBuild(createBlankXml(),{type:'tree-native-patch',specId:'1',patch:{attributes:{},attributeOverrides:{dexNodes:'722'}}}),/모든 기본 필드/);
  const xml=editBuild(createBlankXml(),{type:'tree-native-patch',specId:'1',patch:{attributes:{nodes:'722'},attributeOverrides:{strNodes:'',dexNodes:'722',intNodes:''}}});
  assert.match(xml,/<AttributeOverride strNodes="" dexNodes="722" intNodes=""/);
});
test('native jewel patches preserve socket extensions during equip and unequip',()=>{
  const xml=createBlankXml().replace('<Sockets/>','<Sockets future="keep"><Socket nodeId="12" itemId="0" future="keep"><FutureSocket/></Socket><Socket nodeId="13" itemId="8"/></Sockets>');
  const equipped=editBuild(xml,{type:'tree-native-patch',specId:'1',patch:{attributes:{},sockets:{12:'100'}}});assert.equal(parseBuild(equipped).trees[0].sockets[0].itemId,'100');assert.match(equipped,/future="keep"><FutureSocket\/>/);
  const removed=editBuild(equipped,{type:'tree-native-patch',specId:'1',patch:{attributes:{},sockets:{12:''}}});assert.equal(parseBuild(removed).trees[0].sockets[0].itemId,'0');assert.equal(parseBuild(removed).trees[0].sockets[1].itemId,'8');assert.match(removed,/<FutureSocket\/>/);
});
test('native tree field patches keep unknown spec metadata, sockets and inactive trees intact',()=>{
  const xml=createBlankXml().replace('<Sockets/>','<URL future="keep">old-url<FutureURL/></URL><WeaponSet1 nodes="7" future="keep"/><Sockets future="keep"><Socket nodeId="9" itemId="11"/></Sockets><Overrides future="keep"><AttributeOverride strNodes="7" dexNodes="" intNodes="" future="keep"/><FutureOverride/></Overrides><FutureSpec/>').replace('</Tree>','<Spec title="Inactive" treeVersion="0_1" nodes="99" future="inactive"><FutureInactive/></Spec></Tree>');
  const next=editBuild(xml,{type:'tree-native-patch',specId:'1',patch:{attributes:{nodes:'1,2,3'},weaponSets:{WeaponSet1:'2,3'},attributeOverrides:{strNodes:'',dexNodes:'2'},url:'new-url'}});
  const parsed=parseBuild(next);assert.deepEqual(parsed.trees[0].nodes,[1,2,3]);assert.equal(parsed.trees[1].attributes.future,'inactive');assert.deepEqual(parsed.trees[1].nodes,[99]);assert.equal(parsed.trees[0].sockets[0].itemId,'11');
  assert.match(next,/<WeaponSet1 nodes="2,3" future="keep"/);assert.match(next,/<AttributeOverride strNodes="" dexNodes="2" intNodes="" future="keep"/);assert.match(next,/new-url<FutureURL\/>/);assert.match(next,/<FutureSpec\/>/);assert.match(next,/<FutureOverride\/>/);
  assert.throws(()=>editBuild(xml,{type:'tree-native-patch',specId:'1',patch:{attributes:{unexpected:'lost'}}}),/패치/);
});
test('party edits preserve unknown nodes, support exports and duplicate metadata without replaying old imported text',()=>{
  const xml=createBlankXml().replace('</PathOfBuilding2>','<Party future="keep"><ImportedBuffs name="Aura" old="keep">old<FutureBuff/></ImportedBuffs><ImportedBuffs name="Aura" last="keep">last</ImportedBuffs><ImportedBuffs name="FutureKind">future</ImportedBuffs><ExportedBuffs name="Aura">export</ExportedBuffs><FutureParty/></Party><Import future="keep" exportParty="false"/></PathOfBuilding2>');
  const edited=editBuild(xml,{type:'party-buffer',name:'Aura',text:'new <&> 한글'});
  assert.equal(parseBuild(edited).party?.buffers.Aura,'new <&> 한글');assert.doesNotMatch(edited,/>old</);assert.match(edited,/<FutureBuff\/>/);assert.match(edited,/old="keep"/);assert.match(edited,/last="keep"/);assert.match(edited,/<ExportedBuffs name="Aura">export/);assert.match(edited,/name="FutureKind">future/);
  const enabled=editBuild(edited,{type:'party-export-enabled',enabled:true});assert.equal(parseBuild(enabled).party?.exportEnabled,true);assert.match(enabled,/future="keep" exportParty="true"/);
  const cleared=editBuild(enabled,{type:'party-buffer',name:'Aura',text:''});assert.equal(parseBuild(cleared).party?.buffers.Aura,'');assert.match(cleared,/<FutureParty\/>/);
});
test('Calcs inputs preserve sections, unknown metadata and normal calculation inputs',()=>{
  const xml=createBlankXml().replace('</PathOfBuilding2>','<Calcs future="keep"><Input name="showMinion" boolean="true"/><Input name="showMinion" boolean="false" future="last"/><Section id="Life" subsection="Life" collapsed="true"/><FutureCalcs/></Calcs></PathOfBuilding2>');
  const mode=editBuild(xml,{type:'calcs-input',key:'misc_buffMode',value:'UNBUFFED'});
  const minion=editBuild(mode,{type:'calcs-input',key:'showMinion',value:true});
  assert.match(minion,/name="showMinion" future="last" boolean="true"/);
  assert.match(minion,/<Section id="Life" subsection="Life" collapsed="true"\/>/);assert.match(minion,/<FutureCalcs\/>/);assert.match(minion,/future="keep"/);
  assert.deepEqual(parseBuild(minion),parseBuild(xml));
  const reset=editBuild(minion,{type:'calcs-input',key:'showMinion'});assert.doesNotMatch(reset,/name="showMinion"/);assert.match(reset,/name="misc_buffMode" string="UNBUFFED"/);
  assert.throws(()=>editBuild(xml,{type:'calcs-input',key:'skill_number',value:0}),/계산 스킬 그룹/);
  assert.throws(()=>editBuild(xml,{type:'calcs-input',key:'showMinion',value:'true'}),/대상/);
});
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

test('set copies retain inactive XML, unknown children, gem metadata and shared item identities',()=>{
  let xml=editBuild(fixture,{type:'set-add',kind:'items',title:'Copied gear',copyFrom:'2'});
  assert.equal(parseBuild(xml).itemSets.find(s=>s.active)?.id,'9');
  assert.equal(elements(xml,'Items')[0].getAttribute('useSecondWeaponSet'),'true');
  assert.equal(elements(xml,'Item').length,2); // Global item library is shared, not rebuilt.
  assert.equal(serial(elements(xml,'ItemSet').find(s=>s.getAttribute('id')==='2')!),serial(elements(fixture,'ItemSet').find(s=>s.getAttribute('id')==='2')!));
  xml=editBuild(xml,{type:'set-add',kind:'skills',title:'Copied skill modes',copyFrom:'2'});
  const parsed=parseBuild(xml),copy=parsed.skillSets.find(s=>s.active)!;
  assert.equal(copy.id,'9');assert.equal(copy.groups[0].attributes.mainActiveSkill,'2');
  const group=copy.groups[0];group.gems[0].level=12;
  xml=editBuild(xml,{type:'skill-group',setId:'9',groupId:'1',group});
  assert.equal(parseBuild(xml).skillSets.find(s=>s.id==='2')!.groups[0].gems[0].level,10);
  assert.equal(elements(xml,'FutureGem').length,4);assert.equal(elements(xml,'FutureGroup').length,2);
  assert.equal(serial(elements(xml,'FutureRoot')[0]),serial(elements(fixture,'FutureRoot')[0]));
});
test('tree set removal keeps the same surviving active spec despite positional IDs shifting',()=>{
  const removed=editBuild(fixture,{type:'set-remove',kind:'tree',id:'1'});
  const active=parseBuild(removed).trees.find(t=>t.active)!;
  assert.equal(active.id,'1');assert.equal(active.title,'Active tree');assert.deepEqual(active.nodes,[1,2,3]);
  assert.equal(elements(removed,'WeaponSet2')[0].getAttribute('nodes'),'3');assert.equal(elements(removed,'FutureTree').length,1);
  const deletedActive=editBuild(fixture,{type:'set-remove',kind:'tree',id:'2'});
  assert.equal(parseBuild(deletedActive).trees.find(t=>t.active)?.title,'Inactive tree');
  const copied=editBuild(fixture,{type:'set-add',kind:'tree',title:'Copied tree',copyFrom:'2'});
  assert.equal(parseBuild(copied).trees.find(t=>t.active)?.id,'3');assert.equal(elements(copied,'Overrides').length,2);
  const blank=editBuild(copied,{type:'set-add',kind:'tree',title:'Empty tree'});
  assert.deepEqual(parseBuild(blank).trees.find(t=>t.active)?.nodes,[]);
  assert.equal(parseBuild(blank).trees.find(t=>t.active)?.version,'test2');assert.equal(elements(blank,'Overrides').length,2);
});
test('legacy flat sets are converted without discarding section options or unknown fields',()=>{
  const xml='<PathOfBuilding2><Build level="1"/><Skills future="section"><Skill label="kept"><Gem nameSpec="Synthetic" level="1" quality="0"/></Skill><UnknownSkillData/></Skills><Items><Item id="1">Rarity: NORMAL\nSynthetic\n</Item><Slot name="Ring 1" itemId="1"/><UnknownItems/></Items><Config><Input name="customMods" string="line1&#10;line2"/><Placeholder name="x" number="1"/><UnknownConfig/></Config></PathOfBuilding2>';
  for(const kind of ['items','skills','config'] as const){
    const output=editBuild(xml,{type:'set-add',kind,title:'Copy',copyFrom:'1'});
    assert.equal(parseBuild(output)[kind==='items'?'itemSets':kind==='skills'?'skillSets':'configs'].length,2);
    assert.equal(elements(output,'UnknownSkillData').length,1);assert.equal(elements(output,'UnknownItems').length,1);assert.equal(elements(output,'UnknownConfig').length,1);
    assert.equal(elements(output,'Skills')[0].getAttribute('future'),'section');
  }
});
test('set deletion/creation and config reset preserve original values and do not invent replacement settings',()=>{
  let xml=editBuild(fixture,{type:'set-add',kind:'config',title:'Empty conditions'});
  assert.deepEqual(parseBuild(xml).configs.find(s=>s.active)?.inputs,{});
  xml=editBuild(xml,{type:'set-rename',kind:'config',id:'9',title:'Renamed <&>'});assert.equal(parseBuild(xml).configs.find(s=>s.active)?.title,'Renamed <&>');
  xml=editBuild(xml,{type:'config-remove',setId:'2',key:'a'});
  assert.equal(parseBuild(xml).configs.find(s=>s.id==='2')?.inputs.a,undefined);
  assert.equal(elements(xml,'Placeholder').find(n=>n.getAttribute('name')==='a')?.getAttribute('number'),'99');
  const removed=editBuild(xml,{type:'set-remove',kind:'config',id:'9'});assert.equal(parseBuild(removed).configs.length,2);
  assert.throws(()=>editBuild(createBlankXml(),{type:'set-remove',kind:'items',id:'1'}),/마지막/);
  assert.throws(()=>editBuild(fixture,{type:'set-add',kind:'skills',title:'  '}),/이름/);
  const missing='<PathOfBuilding2><Build level="1"/></PathOfBuilding2>';
  const added=editBuild(missing,{type:'set-add',kind:'skills',title:'First'});assert.equal(parseBuild(added).skillSets[0].id,'1');
  assert.throws(()=>editBuild(missing,{type:'set-add',kind:'skills',title:'Invalid copy',copyFrom:'1'}),/복사할/);
});
test('notes preserve literal formatting, XML entities and future metadata across edits',()=>{
  const xml=fixture.replace('<Notes>Preserve arbitrary notes</Notes>','<Notes future="keep"><![CDATA[^xFF0000Synthetic <&>\n\tline2]]><FutureNote/></Notes>');
  assert.equal(parseBuild(xml).notes,'^xFF0000Synthetic <&>\n\tline2');
  const result=editBuild(xml,{type:'notes',text:'^7한글 <노트> & text\n\tline2'});
  assert.equal(parseBuild(result).notes,'^7한글 <노트> & text\n\tline2');assert.equal(elements(result,'FutureNote').length,1);assert.equal(elements(result,'Notes')[0].getAttribute('future'),'keep');
  assert.equal(serial(elements(result,'Items')[0]),serial(elements(xml,'Items')[0]));
});
test('native skill options update only the chosen gem/effect while preserving calcs, other modes and future children',()=>{
  let xml=fixture.replace('<FutureGem token="first"/>','<StatSetIndex grantedEffect="EffectA" index="1"/><StatSetIndex grantedEffect="EffectB" index="3"/><StatSetCalcsIndex grantedEffect="EffectA" index="4"/><FutureGem token="first"/>');
  xml=editBuild(xml,{type:'gem-stat-set',setId:'2',groupId:'1',gemIndex:1,grantedEffectId:'EffectA',index:2});
  const first=elements(xml,'SkillSet').find(s=>s.getAttribute('id')==='2')!.getElementsByTagName('Gem')[0];
  assert.equal(Array.from(first.getElementsByTagName('StatSetIndex')).find(n=>n.getAttribute('grantedEffect')==='EffectA')?.getAttribute('index'),'2');
  assert.equal(Array.from(first.getElementsByTagName('StatSetIndex')).find(n=>n.getAttribute('grantedEffect')==='EffectB')?.getAttribute('index'),'3');
  assert.equal(first.getElementsByTagName('StatSetCalcsIndex')[0].getAttribute('index'),'4');assert.equal(first.getElementsByTagName('FutureGem')[0].getAttribute('token'),'first');
  xml=editBuild(xml,{type:'gem-option',setId:'2',groupId:'1',gemIndex:1,key:'skillStageCount',value:0});
  assert.equal(activeGroup(xml).gems[0].attributes.skillStageCount,'0');
  xml=editBuild(xml,{type:'gem-option',setId:'2',groupId:'1',gemIndex:1,key:'skillStageCount',value:undefined});
  assert.equal(activeGroup(xml).gems[0].attributes.skillStageCount,undefined);
  xml=editBuild(xml,{type:'skill-active',setId:'2',groupId:'1',index:2});assert.equal(activeGroup(xml).attributes.mainActiveSkill,'2');assert.equal(parseBuild(xml).mainSocketGroup,3);
  assert.throws(()=>editBuild(xml,{type:'gem-stat-set',setId:'2',groupId:'1',gemIndex:1,grantedEffectId:'EffectA',index:0}),/모드/);
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

test('ambiguous active sets remain readable but cannot be silently projected for calculation',()=>{
  const xml=fixture.replace(/activeSkillSet="[^"]*"/,'activeSkillSet="999"');
  assert.doesNotThrow(()=>parseBuild(xml));
  assert.throws(()=>projectActiveXml(xml),/활성 skills 세트/);
});
