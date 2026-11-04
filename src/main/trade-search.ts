/** Only the original PoE2 search destination may be opened by this capability. */
export function tradeSearchUrl(value:unknown):string {
  if(typeof value!=='string'||value.length>65536)throw new Error('거래소 검색 주소가 올바르지 않습니다.');
  const url=new URL(value);
  if(url.protocol!=='https:'||url.hostname!=='www.pathofexile.com'||url.port||url.username||url.password||url.hash||!/^\/trade2\/search\/poe2\/[^/]+$/.test(url.pathname)||[...url.searchParams.keys()].some(key=>key!=='q')||url.searchParams.getAll('q').length!==1)throw new Error('원본 PoE2 거래소 검색 주소만 열 수 있습니다.');
  const query:unknown=JSON.parse(url.searchParams.get('q')!);
  if(!query||typeof query!=='object'||!('query' in query)||!('sort' in query))throw new Error('거래소 검색 조건이 올바르지 않습니다.');
  return url.href;
}
