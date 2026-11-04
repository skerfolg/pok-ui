import test from 'node:test';
import assert from 'node:assert/strict';
import {SessionDrafts} from '../src/renderer/state/session-drafts';
test('session drafts separate build/editor owners and preserve explicit empty/incomplete fields',()=>{
  const drafts=new SessionDrafts();drafts.set('build-a:item-1','number','-');drafts.set('build-a:create','name','');
  assert.equal(drafts.get('build-a:item-1','number',()=>0),'-');assert.equal(drafts.get('build-b:item-1','number',()=>0),0);assert.equal(drafts.get('build-a:create','name',()=> 'default'),'');
});
test('session draft owners are bounded and explicit replacement does not change another owner',()=>{
  const drafts=new SessionDrafts(2);drafts.set('a','draft',{xml:'private-a'});drafts.set('b','draft',{xml:'private-b'});drafts.set('b','draft',{xml:'replaced-b'});drafts.set('c','draft',{xml:'private-c'});
  assert.deepEqual(drafts.get('b','draft',()=>({xml:'lost'})),{xml:'replaced-b'});assert.deepEqual(drafts.get('a','draft',()=>({xml:'new-a'})),{xml:'new-a'});
});
