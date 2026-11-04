import {ItemSummary} from '../components/ItemSummary';
import {useEffect,useState} from 'react';
import type {BuildDocument,Item} from '../../shared/contracts';
import type {PobItemTooltip} from '../../shared/pob-item-tooltip';
import {hashBuildXml} from '../../shared/calculation-context';
import {api} from '../services/api';

/** Mounted only while the card is visible. The stock comparison runs off the summary worker. */
export function ItemHover({build,item,runtimeId,slot,nodeId}:{build:Pick<BuildDocument,'id'|'revision'|'xml'>;item:Item;runtimeId?:string;slot?:string;nodeId?:number}){
  const [result,setResult]=useState<PobItemTooltip>(),[error,setError]=useState('');
  useEffect(()=>{
    let alive=true;setResult(undefined);setError('');if(!runtimeId)return;
    const timer=setTimeout(()=>{void Promise.all([api.itemTooltip({buildId:build.id,revision:build.revision,xml:build.xml,runtimeId,itemId:item.id,slot,nodeId}),hashBuildXml(build.xml)]).then(([data,hash])=>{
      if(!alive)return;
      if(data.buildId!==build.id||data.revision!==build.revision||data.xmlSha256!==hash||data.runtimeId!==runtimeId||data.itemId!==item.id||data.slot!==slot||data.nodeId!==nodeId)throw new Error('아이템 비교의 입력·위치·PoB 출처가 다릅니다.');
      setResult(data);
    }).catch(reason=>{if(alive)setError(String(reason));});},250);
    return()=>{alive=false;clearTimeout(timer);};
  },[build.id,build.revision,build.xml,item.id,runtimeId,slot,nodeId]);
  const current=result?.buildId===build.id&&result.revision===build.revision&&result.runtimeId===runtimeId&&result.itemId===item.id&&result.slot===slot&&result.nodeId===nodeId?result:undefined;
  return <><ItemSummary item={item} compact lines={current?.displayLines}/>{current?.requirements.length?<section aria-label="원본 아이템 요구량"><h3>원본 요구량</h3>{current.requirements.map((line,index)=><p key={index}>{line}</p>)}</section>:null}<section className="item-hover-comparisons" aria-label="원본 장착 비교"><h3>원본 PoB 장착 비교</h3><p className="muted">리비전 {build.revision} · 현재 주력 대상</p>{error?<p className="warning">비교를 읽지 못했습니다. {error}</p>:!runtimeId?<p>독립 PoB가 준비되지 않았습니다.</p>:!current?<p role="status">원본 비교 확인 중…</p>:current.comparisons.length?current.comparisons.map((section,index)=><section key={index}>{section.lines.length?<div className="calcs-line">{section.lines.map((line,index)=><div key={index}>{line}</div>)}</div>:<><h4>{section.header}</h4><p className="muted">원본 PoB가 표시한 수치 차이가 없습니다.</p></>}</section>):<p className="muted">현재 입력에서 원본 PoB가 제공하는 장착 비교가 없습니다.</p>}</section></>;
}
