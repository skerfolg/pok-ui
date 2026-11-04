import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {ItemArtStore} from '../src/main/item-art';
import {itemArtwork} from '../src/shared/item-art';
import type {Item} from '../src/shared/contracts';
test('art identity resolves exact unique art and rare base art independently of rolled names',()=>{
  const index={bases:{'Iron Ring':'a'},uniques:{'Original Unique\nIron Ring':'b'},files:{a:{hash:'a',url:'a',width:1,height:1},b:{hash:'b',url:'b',width:1,height:1}}};
  assert.equal(itemArtwork(index,{name:'Random Rare Name',base:'Iron Ring',rarity:'RARE'} as Item)?.hash,'a');
  assert.equal(itemArtwork(index,{name:'Original Unique',base:'Iron Ring',rarity:'UNIQUE'} as Item)?.hash,'b');
  assert.equal(itemArtwork(index,{name:'Unknown',base:'Unknown',rarity:'UNIQUE'} as Item),undefined);
});
test('item artwork is served only from indexed hash-addressed local files; mutation and traversal fail',async()=>{
  const root=await mkdtemp(join(tmpdir(),'pok-item-art-')),bytes=Buffer.from('synthetic indexed artwork'),hash=createHash('sha256').update(bytes).digest('hex');await mkdir(join(root,'images'));
  await writeFile(join(root,'images',hash+'.png'),bytes);await writeFile(join(root,'index.json'),JSON.stringify({schemaVersion:1,bases:{'Synthetic Base':hash},uniques:{},files:{[hash]:{hash,file:'images/'+hash+'.png',mime:'image/png',width:1,height:1}}}));
  const store=new ItemArtStore(root),index=await store.index();assert.equal(index.files[hash].url,'pok-item://artwork/'+hash);assert.deepEqual((await store.asset(hash)).bytes,bytes);await assert.rejects(store.asset('../private'));
  await writeFile(join(root,'images',hash+'.png'),'changed');await assert.rejects(store.asset(hash),/무결성/);
});
