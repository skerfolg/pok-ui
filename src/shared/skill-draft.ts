import type {SkillGroup} from './contracts';

const same=(left:SkillGroup,right:SkillGroup)=>JSON.stringify(left)===JSON.stringify(right);
export class SkillDraft {
  base:SkillGroup;
  value:SkillGroup;
  numbers:Record<string,string>={};
  error='';
  constructor(group:SkillGroup,saved?:{base:SkillGroup;value:SkillGroup;numbers?:Record<string,string>}){
    this.base=structuredClone(saved?.base||group);
    this.value=structuredClone(saved?.value||group);
    this.numbers={...saved?.numbers};
    this.receive(group);
  }
  get dirty():boolean{return !same(this.base,this.value)||Object.entries(this.numbers).some(([key,text])=>{const [index,field]=key.split(':');return text!==String(this.base.gems[Number(index)]?.[field as 'level'|'quality']);});}
  get valid():boolean{return Object.entries(this.numbers).every(([key,text])=>{const field=key.split(':')[1],value=Number(text);return text.trim()!==''&&Number.isSafeInteger(value)&&value>=(field==='level'?1:0);})&&this.value.gems.every(gem=>gem.name.trim()&&Number.isSafeInteger(gem.level)&&gem.level>=1&&Number.isSafeInteger(gem.quality)&&gem.quality>=0);}
  change(next:SkillGroup):void{
    const numbers:Record<string,string>={};
    next.gems.forEach((gem,index)=>{
      const old=this.value.gems.findIndex(source=>source===gem||source.sourceIndex!==undefined&&source.sourceIndex===gem.sourceIndex||source.attributes===gem.attributes);
      if(old>=0)for(const field of ['level','quality']){const text=this.numbers[old+':'+field];if(text!==undefined)numbers[index+':'+field]=text;}
    });
    this.value=structuredClone(next);this.numbers=numbers;this.error='';
  }
  number(index:number,field:'level'|'quality',text:string):void{
    this.numbers={...this.numbers,[index+':'+field]:text};this.error='';
    const value=Number(text);if(text.trim()!==''&&Number.isSafeInteger(value)&&value>=(field==='level'?1:0))this.value={...this.value,gems:this.value.gems.map((gem,i)=>i===index?{...gem,[field]:value}:gem)};
  }
  receive(group:SkillGroup):boolean{
    if(same(group,this.base))return false;
    if(!this.dirty||this.valid&&same(group,this.value)){this.base=structuredClone(group);this.value=structuredClone(group);this.numbers={};this.error='';return true;}
    this.error='원본 그룹이 변경되었습니다. 초안을 유지했으며 자동 반영을 중단했습니다.';return true;
  }
  flush(commit:(value:SkillGroup,base:SkillGroup)=>SkillGroup):boolean{
    if(!this.dirty)return true;
    if(!this.valid){this.error='젬 이름과 정수 레벨·퀄리티를 확인하세요. 미완성 초안은 XML에 반영하지 않았습니다.';return false;}
    try{const result=commit(structuredClone(this.value),structuredClone(this.base));this.base=structuredClone(result);this.value=structuredClone(result);this.numbers={};this.error='';return true;}
    catch(reason){this.error=reason instanceof Error?reason.message:String(reason);return false;}
  }
  reset(group:SkillGroup):void{this.base=structuredClone(group);this.value=structuredClone(group);this.numbers={};this.error='';}
}
