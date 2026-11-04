import type {Item} from '../../shared/contracts';
const metadata:Record<string,string>={Quality:'퀄리티',Sockets:'소켓',LevelReq:'요구 레벨',ItemLevel:'아이템 레벨',Catalyst:'촉매',CatalystQuality:'촉매 퀄리티',League:'리그'};
/** Presentation of the input text only. Native calculations and controls remain authoritative. */
export function ItemSummary({item,compact=false}:{item:Item;compact?:boolean}){
  const chips:{label:string;value:string}[]=[],lines:string[]=[];
  for(const line of item.text.trim().split(/\r?\n/)){
    if(!line.trim()||line===item.name||line===item.base||/^Rarity:/.test(line))continue;
    const field=/^([^:]+):\s*(.*)$/.exec(line);
    if(field&&metadata[field[1]]){if(!field[2]||field[1]==='LevelReq'&&field[2]==='0')continue;chips.push({label:metadata[field[1]],value:field[2]});continue;}
    if(/^(Crafted|Prefix|Suffix|Implicits|Variant|Alt Variant(?: \d+)?|Has Alt Variant|Selected Variant|Unique ID|Item ID):/.test(line))continue;
    if(line==='Corrupted'){chips.push({label:'타락',value:''});continue;}
    if(/^[-=]{3,}$/.test(line)&&(!lines.length||/^[-=]{3,}$/.test(lines[lines.length-1])))continue;
    lines.push(line.replace(/^\{custom\}/,''));
  }
  return <article className={'item-preview item-summary'+(compact?' compact':'')}>
    <header><span className={'item-summary-mark rarity-'+item.rarity.toLowerCase()} aria-hidden="true">◇</span><div><h3 className={'rarity-'+item.rarity.toLowerCase()}>{item.name}</h3>{item.base&&item.base!==item.name&&<p className="muted">{item.base}</p>}</div><span className="item-rarity">{({RARE:'희귀',UNIQUE:'고유',MAGIC:'마법',NORMAL:'일반'} as Record<string,string>)[item.rarity.toUpperCase()]||item.rarity}</span></header>
    {chips.length>0&&<div className="item-meta-chips">{chips.map((chip,index)=><span key={index}><small>{chip.label}</small>{chip.value&&<b>{chip.value}</b>}</span>)}</div>}
    <div className="item-lines">{lines.map((line,index)=>/^[-=]{3,}$/.test(line)?<hr key={index}/>:<div key={index}>{line}</div>)}</div>
    {!compact&&<details className="item-source-text"><summary>고급 · 보존된 아이템 원문</summary><pre>{item.text}</pre></details>}
  </article>;
}
