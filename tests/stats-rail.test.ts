import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {StatsRail,numericStat} from '../src/renderer/components/StatsRail';
import {createBlankXml,parseBuild} from '../src/shared/pob-document';
import type {BuildDocument} from '../src/shared/contracts';
const xml=createBlankXml({defaultTreeVersion:'0_5'});
function markup(life:unknown,fresh:boolean){
 const build:BuildDocument={id:'display-fixture',name:'display fixture',revision:1,createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:00Z',xml,originalXml:xml,sourceName:'fixture.xml',undo:[],calculation:{revision:1,at:'2026-01-01T00:00:00Z',result:{ok:true,stats:{Life:life}},restoreNotes:[]}};
 return renderToStaticMarkup(createElement(StatsRail,{build,parsed:parseBuild(xml),fresh,onDetails:()=>{}}));
}
test('stats rail follows the authoritative parent freshness result',()=>{
 assert.match(markup(78,true),/<span>총 생명력<\/span><strong[^>]*>78<\/strong>/);
 assert.match(markup(78,false),/<span>총 생명력<\/span><strong[^>]*>—<\/strong>/);
 assert.match(markup(78,false),/재계산 필요/);
});
test('missing and nonfinite display values remain distinct from actual zero',()=>{
 for(const value of [null,undefined,'', '  ',false,{},[],NaN,Infinity,'nan'])assert.equal(numericStat(value),undefined);
 assert.equal(numericStat(0),0);assert.equal(numericStat('0'),0);
 assert.match(markup(null,true),/<span>총 생명력<\/span><strong[^>]*>—<\/strong>/);
 assert.match(markup(0,true),/<span>총 생명력<\/span><strong[^>]*>0<\/strong>/);
});
