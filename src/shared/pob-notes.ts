// Presentation contract: pinned NotesTab.SetColor and upstream SimpleGraphic color escapes.
// Sources/compatibility scope: docs/POB-NOTES.md. No game calculations live here.
export const NOTE_DIGIT_COLORS=['#000000','#ff0000','#00ff00','#0000ff','#ffff00','#ff00ff','#00ffff','#ffffff','#b3b3b3','#666666'];
export const NOTE_PRESETS=[['NORMAL','^xC8C8C8'],['MAGIC','^x8888FF'],['RARE','^xFFFF77'],['UNIQUE','^xAF6025'],['FIRE','^xB97123'],['COLD','^x3F6DB3'],['LIGHTNING','^xADAA47'],['CHAOS','^xD02090'],['STRENGTH','^xE05030'],['DEXTERITY','^x70FF70'],['INTELLIGENCE','^x7070FF'],['DEFAULT','^7']] as const;
export interface NoteRun {text:string;color:string;start:number;end:number}
export interface NoteProjection {text:string;runs:NoteRun[];codes:{start:number;end:number;visible:number;code:string}[]}
export function projectNote(raw:string,showCodes=false):NoteProjection{
  const runs:NoteRun[]=[],codes:NoteProjection['codes']=[];let cursor=0,visible=0,color=NOTE_DIGIT_COLORS[7];const pattern=showCodes?/\r(?=\n)/g:/\r(?=\n)|\^(?:[0-9]|[xX][0-9a-fA-F]{6})/g;
  function append(end:number){if(end<=cursor)return;const text=raw.slice(cursor,end).replace(/\r/g,'\n');runs.push({text,color,start:visible,end:visible+text.length});visible+=text.length;}
  for(const match of raw.matchAll(pattern)){append(match.index);const code=match[0];codes.push({start:match.index,end:match.index+code.length,visible,code});if(code!=='\r')color=code.length===2?NOTE_DIGIT_COLORS[Number(code[1])]:'#'+code.slice(2).toLowerCase();cursor=match.index+code.length;}
  append(raw.length);return{text:runs.map(run=>run.text).join(''),runs,codes};
}
export function noteRawOffset(projection:NoteProjection,offset:number,affinity:'before'|'after'='after'):number{
  const position=Math.max(0,Math.min(projection.text.length,offset));return position+projection.codes.filter(code=>code.visible<position||code.visible===position&&affinity==='after').reduce((length,code)=>length+code.end-code.start,0);
}
export function noteVisibleOffset(projection:NoteProjection,offset:number):number{
  return Math.max(0,offset-projection.codes.reduce((length,code)=>length+Math.max(0,Math.min(offset,code.end)-code.start),0));
}
export function noteSelection(raw:string,projection:NoteProjection,start:number,end:number,selectAll=true):{start:number;end:number}{
  if(selectAll&&start===0&&end===projection.text.length&&start!==end)return{start:0,end:raw.length};
  const left=noteRawOffset(projection,start);return{start:left,end:start===end?left:noteRawOffset(projection,end,'before')};
}
export function colorNoteSelection(raw:string,start:number,end:number,code:string):{text:string;caret:number}{
  if(!/^\^(?:[0-9]|[xX][0-9a-fA-F]{6})$/.test(code))throw new Error('PoB 색상 코드 형식이 올바르지 않습니다.');
  const selected=raw.slice(start,end),last=[...selected.matchAll(/\^x[0-9a-fA-F]{6}/g)].at(-1)?.[0]||'^7',inserted=(code+(start===end?'':selected.replace(/\^x[0-9a-fA-F]{6}/g,'')+last)).replace(/\r/g,'');
  return{text:raw.slice(0,start)+inserted+raw.slice(end),caret:start+inserted.length};
}
export interface NoteInputSelection {start:number;end:number;inputType:string}
export function editVisibleNote(raw:string,next:string,selection?:NoteInputSelection,showCodes=false):{text:string;caret:number}{
  const projection=projectNote(raw,showCodes),old=projection.text;let start=0,end=old.length,inserted='';
  if(selection){start=selection.start;end=selection.end;const delta=next.length-old.length;
    if(start===end&&selection.inputType.startsWith('delete')&&delta<0){if(selection.inputType.endsWith('Backward'))start=Math.max(0,start+delta);else end=Math.min(old.length,end-delta);}
    const length=next.length-(old.length-end+start);inserted=next.slice(start,start+Math.max(0,length));
    if(length<0||old.slice(0,start)+inserted+old.slice(end)!==next)selection=undefined;
  }
  if(!selection){start=0;while(start<Math.min(old.length,next.length)&&old[start]===next[start])start++;if(start>0&&/[\uDC00-\uDFFF]/.test(old[start]||'')&&/[\uD800-\uDBFF]/.test(old[start-1]))start--;let suffix=0;while(suffix<old.length-start&&suffix<next.length-start&&old[old.length-1-suffix]===next[next.length-1-suffix])suffix++;end=old.length-suffix;if(end>0&&/[\uDC00-\uDFFF]/.test(old[end]||'')&&/[\uD800-\uDBFF]/.test(old[end-1])){suffix--;end++;}inserted=next.slice(start,next.length-suffix);}
  const range=noteSelection(raw,projection,start,end,selection?selection.start!==selection.end:start===0&&end===old.length&&start!==end);
  return{text:raw.slice(0,range.start)+inserted+raw.slice(range.end),caret:range.start+inserted.length};
}
