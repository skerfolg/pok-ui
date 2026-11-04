import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import type {ItemArtIndex} from '../shared/item-art';
interface StoredIndex {schemaVersion:number;bases:Record<string,string>;uniques:Record<string,string>;files:Record<string,{file:string;mime:string;hash:string;width:number;height:number}>}
export class ItemArtStore {
  private loaded?:Promise<StoredIndex>;
  constructor(private root:string){}
  private load(){return this.loaded??=readFile(join(this.root,'index.json'),'utf8').then(text=>{const value=JSON.parse(text) as StoredIndex;if(value.schemaVersion!==1||!value.bases||!value.uniques||!value.files)throw new Error('아이템 이미지 목록이 올바르지 않습니다.');return value;});}
  async index():Promise<ItemArtIndex>{
    try{const index=await this.load();return{bases:index.bases,uniques:index.uniques,files:Object.fromEntries(Object.entries(index.files).filter(([id,file])=>/^[a-f0-9]{64}$/.test(id)&&file.hash===id).map(([id,file])=>[id,{hash:id,url:'pok-item://artwork/'+id,width:file.width,height:file.height}]))};}
    catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return{bases:{},uniques:{},files:{}};throw error;}
  }
  async asset(hash:string){
    if(!/^[a-f0-9]{64}$/.test(hash))throw new Error('아이템 이미지 경로가 올바르지 않습니다.');const index=await this.load(),file=index.files[hash];
    if(!file||file.hash!==hash||!['image/png','image/webp'].includes(file.mime)||!new RegExp('^images/'+hash+'\\.(png|webp)$').test(file.file))throw new Error('등록된 아이템 이미지가 아닙니다.');
    const bytes=await readFile(join(this.root,file.file));if(bytes.length>2*1024*1024||createHash('sha256').update(bytes).digest('hex')!==hash)throw new Error('아이템 이미지의 무결성을 확인하지 못했습니다.');return{bytes,mime:file.mime};
  }
}
