import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { ChatImage } from '../shared/contracts';

export const MAX_CHAT_IMAGE_BYTES=4*1024*1024;
export const MAX_CHAT_IMAGES=4;
const extensions:Record<string,string>={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif'};
function imageType(bytes:Buffer):string {
  if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'image/png';
  if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
  if(/^GIF8[79]a$/.test(bytes.subarray(0,6).toString('ascii')))return 'image/gif';
  if(bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP')return 'image/webp';
  throw new Error('PNG, JPEG, WebP, GIF 이미지 파일만 첨부할 수 있습니다.');
}
export class ChatImageStore {
  constructor(private directory:string){}
  async add(name:string,bytes:Buffer):Promise<ChatImage> {
    if(!bytes.length||bytes.length>MAX_CHAT_IMAGE_BYTES)throw new Error('이미지는 한 장당 4 MB 이하여야 합니다.');
    const mimeType=imageType(bytes);
    const id=createHash('sha256').update(bytes).digest('hex');
    const image:ChatImage={id,name:basename(name.replaceAll('\\','/')).replace(/[\x00-\x1f]/g,'').slice(0,160)||'image.'+extensions[mimeType],mimeType,size:bytes.length};
    await mkdir(this.directory,{recursive:true});
    await writeFile(join(this.directory,id+'.'+extensions[mimeType]),bytes);
    await writeFile(join(this.directory,id+'.json'),JSON.stringify(image));
    return image;
  }
  async addDataUrl(name:string,dataUrl:string):Promise<ChatImage> {
    if(dataUrl.length>Math.ceil(MAX_CHAT_IMAGE_BYTES*4/3)+100)throw new Error('이미지는 한 장당 4 MB 이하여야 합니다.');
    const match=/^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/]*={0,2})$/.exec(dataUrl);
    if(!match)throw new Error('이미지 첨부 형식이 올바르지 않습니다.');
    const bytes=Buffer.from(match[2],'base64');
    if(imageType(bytes)!==match[1])throw new Error('이미지 내용과 형식이 일치하지 않습니다.');
    return this.add(name,bytes);
  }
  async get(id:string):Promise<{image:ChatImage;path:string;bytes:Buffer}> {
    if(!/^[a-f0-9]{64}$/.test(id))throw new Error('이미지 ID가 올바르지 않습니다.');
    const image:ChatImage=JSON.parse(await readFile(join(this.directory,id+'.json'),'utf8'));
    if(image.id!==id||!extensions[image.mimeType])throw new Error('저장된 이미지 정보가 올바르지 않습니다.');
    const path=join(this.directory,id+'.'+extensions[image.mimeType]);
    const bytes=await readFile(path);
    if(bytes.length>MAX_CHAT_IMAGE_BYTES||bytes.length!==image.size||createHash('sha256').update(bytes).digest('hex')!==id||imageType(bytes)!==image.mimeType)throw new Error('저장된 이미지가 변경되었거나 손상되었습니다.');
    return {image,path,bytes};
  }
}
