import type {ReactNode} from 'react';
import type {Item} from '../../shared/contracts';
const metadata:Record<string,string>={Quality:'퀄리티',Sockets:'소켓',LevelReq:'요구 레벨',ItemLevel:'아이템 레벨',Catalyst:'촉매',CatalystQuality:'촉매 퀄리티',League:'리그'};
/** Metadata is input text; option sentences come exclusively from the original formatter. */
export function ItemSummary({item,compact=false,lines,editAction,updating=false}:{updating?:boolean;item:Item;compact?:boolean;lines?:string[];editAction?:ReactNode}){
  const chips:{label:string;value:string}[]=[];
  for(const line of item.text.trim().split(/\r?\n/)){
    if(!line.trim()||line===item.name||line===item.base||/^Rarity:/.test(line))continue;
    const field=/^([^:]+):\s*(.*)$/.exec(line);
    if(field&&metadata[field[1]]){if(!field[2]||field[1]==='LevelReq'&&field[2]==='0')continue;chips.push({label:metadata[field[1]],value:field[2]});continue;}
    if(/^(Crafted|Prefix|Suffix|Implicits|Variant|Alt Variant(?: \d+)?|Has Alt Variant|Selected Variant|Unique ID|Item ID):/.test(line))continue;
    if(line==='Corrupted'){chips.push({label:'타락',value:''});continue;}
  }
  return <article aria-busy={updating} data-updating={updating} className={'item-preview item-summary'+(compact?' compact':'')}>
    <header>{updating&&<span className="item-refresh-indicator" role="status" title="이전 옵션 표시 · 새 입력 확인 중" aria-label="이전 옵션 표시 · 새 입력 확인 중">갱신 중</span>}<div className="item-summary-title"><div className="item-summary-name"><h3 className={'rarity-'+item.rarity.toLowerCase()}>{item.name}</h3><span className="item-rarity">{({RARE:'희귀',UNIQUE:'고유',MAGIC:'마법',NORMAL:'일반'} as Record<string,string>)[item.rarity.toUpperCase()]||item.rarity}</span></div>{item.base&&item.base!==item.name&&<p className="muted">{item.base}</p>}</div>{editAction}</header>
    {chips.length>0&&<div className="item-meta-chips">{chips.map((chip,index)=><span data-numeric={/^[+-]?\d/.test(chip.value)} key={index}><small>{chip.label}</small>{chip.value&&<b>{chip.value}</b>}</span>)}</div>}
    <div className="item-lines">{lines?.map((line,index)=>/^[-=]{3,}$/.test(line)?<hr key={index}/>:<div className={/not supported|unsupported|not modelled/i.test(line)?'unsupported-option':undefined} key={index}>{line}</div>)}</div>
    {lines===undefined&&<p className="muted item-options-status" role="status">옵션 확인 중…</p>}
  </article>;
}
