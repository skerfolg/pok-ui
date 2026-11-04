export type WorkspaceLocation={view:'equipment';itemId?:string;slot?:string}|{view:'tree';nodeId:number}|{view:'skills';groupId:string}|{view:'config';field?:string};
export interface BreakdownContext {groupId?:string;grantedEffectId?:string;configKeys?:string[]}
export function breakdownLocation(source:string,slot?:string,context?:BreakdownContext):WorkspaceLocation|undefined{
  const item=/^Item:(\d+):/.exec(source);if(item)return{view:'equipment',itemId:item[1],slot};
  const tree=/^Tree:(\d+)(?::|$)/.exec(source);if(tree)return{view:'tree',nodeId:Number(tree[1])};
  if(context?.groupId&&context.grantedEffectId&&source==='Skill:'+context.grantedEffectId)return{view:'skills',groupId:context.groupId};
  const config=/^Config:(.+)$/.exec(source);if(config&&context?.configKeys?.includes(config[1]))return{view:'config',field:config[1]};
  return undefined;
}
