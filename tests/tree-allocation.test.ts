import test from 'node:test';
import assert from 'node:assert/strict';
import {createBlankXml,parseBuild} from '../src/shared/pob-document';
import {treeAllocationModes} from '../src/shared/tree-allocation';
test('weapon display assignments follow persisted XML and survive parsing without changing it',()=>{
  const xml=createBlankXml().replace('<Sockets/>','<WeaponSet1 nodes="1,2"/><WeaponSet2 nodes="3,4"/><Sockets/>');
  const spec=parseBuild(xml).trees[0],modes=treeAllocationModes(spec);assert.deepEqual([...modes],[[1,1],[2,1],[3,2],[4,2]]);assert.equal(modes.has(5),false);assert.deepEqual(spec.weaponSets,{WeaponSet1:[1,2],WeaponSet2:[3,4]});
});
