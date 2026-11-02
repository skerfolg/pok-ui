import test from 'node:test';
import assert from 'node:assert/strict';
import {projectNote,noteRawOffset,noteVisibleOffset,noteSelection,colorNoteSelection,editVisibleNote,NOTE_DIGIT_COLORS} from '../src/shared/pob-notes';
test('note rendering follows indexed/hex colors while preserving malformed codes, Korean, emoji, whitespace and literal markup',()=>{
  const raw='^1red ^3blue ^x123aBC한글😀\n\t<&> ^_xABCDEF ^x12345 ^X00FF00green',view=projectNote(raw);assert.equal(view.text,'red blue 한글😀\n\t<&> ^_xABCDEF ^x12345 green');assert.equal(view.runs[0].color,NOTE_DIGIT_COLORS[1]);assert.equal(view.runs[1].color,'#0000ff');assert.equal(view.runs[2].color,'#123abc');assert.equal(view.runs.at(-1)?.color,'#00ff00');assert.equal(projectNote(raw,true).text,raw);
});
test('visible offsets and range edits retain hidden formatting outside their selected source range',()=>{
  const raw='^1A^2B^7C',view=projectNote(raw);assert.equal(noteRawOffset(view,1),5);assert.equal(noteRawOffset(view,1,'before'),3);assert.equal(noteVisibleOffset(view,5),1);assert.deepEqual(noteSelection(raw,view,1,2),{start:5,end:6});assert.equal(editVisibleNote(raw,'AXC',{start:1,end:2,inputType:'insertText'}).text,'^1A^2X^7C');assert.equal(editVisibleNote(raw,'BC',{start:1,end:1,inputType:'deleteContentBackward'}).text,'^1^2B^7C');
});
test('repeated visible characters use the actual caret instead of coloring an insertion at the wrong end',()=>{
  const raw='^1aa^2aa';assert.equal(editVisibleNote(raw,'aaaaa',{start:1,end:1,inputType:'insertText'}).text,'^1aaa^2aa');assert.equal(editVisibleNote(raw,'aaa',{start:1,end:1,inputType:'deleteContentBackward'}).text,'^1a^2aa');
});
test('formatting-only buffers and select-all replacement preserve explicit insertion versus replacement intent',()=>{
  assert.equal(editVisibleNote('^1','가',{start:0,end:0,inputType:'insertText'}).text,'^1가');assert.equal(editVisibleNote('^1A','',{start:1,end:1,inputType:'deleteContentBackward'}).text,'^1');assert.equal(editVisibleNote('^1AB^7','new',{start:0,end:2,inputType:'insertText'}).text,'new');
});
test('CRLF display mapping preserves source line endings outside an edited region in both views',()=>{
  const raw='^1A\r\nB',view=projectNote(raw);assert.equal(view.text,'A\nB');assert.equal(editVisibleNote(raw,'A\nC',{start:2,end:3,inputType:'insertText'}).text,'^1A\r\nC');assert.equal(editVisibleNote(raw,'^1A\nC',{start:4,end:5,inputType:'insertText'},true).text,'^1A\r\nC');
});
test('color range replacement uses NotesTab last-selected-hex behavior without rewriting indexed or unknown codes',()=>{
  const selected='A^x112233B^2C^x445566D',raw='before '+selected+' after',start=7,result=colorNoteSelection(raw,start,start+selected.length,'^xABCDEF');assert.equal(result.text,'before ^xABCDEFAB^2CD^x445566 after');assert.equal(colorNoteSelection('가😀',1,1,'^7').text,'가^7😀');assert.throws(()=>colorNoteSelection('safe',0,4,'<script>'));
});
test('fallback edits never split a surrogate pair when replacing an emoji',()=>{
  const raw='^1😀x';assert.equal(editVisibleNote(raw,'😃x').text,'^1😃x');assert.equal(editVisibleNote(raw,'가😀x',{start:0,end:0,inputType:'insertText'}).text,'^1가😀x');
});
