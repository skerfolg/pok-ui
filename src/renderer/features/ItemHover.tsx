import {useRetainedPresentation} from '../state/useRetainedPresentation';
import {useDetailReads,peekItemTooltip,readItemTooltip,peekItemDisplay} from '../state/native-detail-cache';
import {ItemSummary} from '../components/ItemSummary';
import {useEffect,useState} from 'react';
import type {BuildDocument,Item} from '../../shared/contracts';

/** Mounted only while the card is visible. The stock comparison runs off the summary worker. */
export function ItemHover({build,item,runtimeId,slot,nodeId}:{build:Pick<BuildDocument,'id'|'revision'|'xml'>;item:Item;runtimeId?:string;slot?:string;nodeId?:number}){
  useDetailReads();const [error,setError]=useState('');
  const input=runtimeId?{buildId:build.id,revision:build.revision,xml:build.xml,runtimeId,itemId:item.id,slot,nodeId}:undefined;
  const current=input?peekItemTooltip(input):undefined,presentation=peekItemDisplay(build,runtimeId,item.id);
  const owner=JSON.stringify([build.id,runtimeId,item.id,slot,nodeId]);
  const display=useRetainedPresentation(owner,current),lines=useRetainedPresentation(owner,current?.displayLines??presentation?.displayLines),requirements=useRetainedPresentation(owner,current?.requirements??presentation?.requirements);
  useEffect(()=>{let alive=true;setError('');if(!input||current)return;void readItemTooltip(input).catch(reason=>{if(alive)setError(String(reason));});return()=>{alive=false;};},[build.id,build.revision,build.xml,item.id,runtimeId,slot,nodeId,Boolean(current)]);
  return <><ItemSummary item={item} compact lines={lines} updating={!current&&Boolean(display)}/>{requirements?.length?<section aria-label="아이템 요구사항"><h3>요구사항</h3>{requirements.map((line,index)=><p key={index}>{line}</p>)}</section>:null}<section className="item-hover-comparisons" aria-label="장착 비교"><h3>장착 비교</h3>{!current&&display&&<p className="muted">이전 결과 · 갱신 중</p>}{error?<p className="warning">비교를 읽지 못했습니다. {error}</p>:!runtimeId?<p>계산 기능을 준비하고 있습니다.</p>:!display?<p role="status">비교 갱신 중…</p>:display.comparisons.length?display.comparisons.map((section,index)=><section key={index}>{section.lines.length?<div className="calcs-line">{section.lines.map((line,index)=><div data-direction={/^\s*\+/.test(line)&&!/^\s*\+0(?:\.0+)?(?:\s|%|$)/.test(line)?'increase':/^\s*[-−]\d/.test(line)?'decrease':undefined} key={index}>{line}</div>)}</div>:<><h4>{section.header}</h4><p className="muted">수치 차이가 없습니다.</p></>}</section>):<p className="muted">현재 입력에서 비교할 수 있는 수치가 없습니다.</p>}</section></>;
}
