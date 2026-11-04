import {test} from 'node:test';
import assert from 'node:assert/strict';
import {tradeSearchUrl} from '../src/main/trade-search';
const query=encodeURIComponent(JSON.stringify({query:{status:{option:'online'}},sort:{price:'asc'}}));
test('trade search opens only the original PoE2 search destination with one JSON query',()=>{
  const url='https://www.pathofexile.com/trade2/search/poe2/Standard?q='+query;
  assert.equal(tradeSearchUrl(url),url);
  for(const value of [url.replace('https:','http:'),url.replace('www.pathofexile.com','www.pathofexile.com.evil.test'),url.replace('/poe2/','/pc/'),url.replace('https://','https://user@'),url+'#fragment',url+'&q='+query,url+'&redirect=https://example.com',url.replace(query,'broken'),url.replace(query,'%7B%7D'),'file:///etc/passwd'])assert.throws(()=>tradeSearchUrl(value));
});
