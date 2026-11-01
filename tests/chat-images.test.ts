import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { ChatImageStore, MAX_CHAT_IMAGE_BYTES } from '../src/main/chat-images';

const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
async function fixture(){const directory=await mkdtemp(join(tmpdir(),'pok-chat-images-'));return{store:new ChatImageStore(directory),async cleanup(){assert(resolve(directory).startsWith(resolve(tmpdir(),'pok-chat-images-')));await rm(directory,{recursive:true,force:true});}};}
test('image attachment round-trips by opaque id without persisting source paths',async()=>{
  const f=await fixture();try{
    const image=await f.store.addDataUrl('private/folder/synthetic.png','data:image/png;base64,'+png.toString('base64'));
    assert.equal(image.name,'synthetic.png');assert.match(image.id,/^[a-f0-9]{64}$/);assert.equal(image.mimeType,'image/png');
    const stored=await f.store.get(image.id);assert.deepEqual(stored.bytes,png);assert.equal(stored.image.size,png.length);
    await writeFile(stored.path,Buffer.from('changed'));await assert.rejects(f.store.get(image.id),/변경|손상/);
  }finally{await f.cleanup();}
});
test('attachment store rejects paths, non-images and oversized inputs',async()=>{
  const f=await fixture();try{
    await assert.rejects(f.store.get('../private'),/ID/);
    await assert.rejects(f.store.add('script.svg',Buffer.from('<svg/>')),/이미지/);
    await assert.rejects(f.store.add('huge.png',Buffer.alloc(MAX_CHAT_IMAGE_BYTES+1)),/4 MB/);
    await assert.rejects(f.store.addDataUrl('wrong.jpg','data:image/jpeg;base64,'+png.toString('base64')),/일치/);
  }finally{await f.cleanup();}
});
