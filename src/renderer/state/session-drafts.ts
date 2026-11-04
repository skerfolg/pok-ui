/** Bounded, session-only editor state. Never enters canonical XML or deployed fixtures. */
export class SessionDrafts {
  private owners=new Map<string,Map<string,unknown>>();
  private listeners=new Set<()=>void>();
  constructor(private limit=64){}
  get<T>(owner:string,field:string,initial:()=>T):T{
    let fields=this.owners.get(owner);
    if(!fields){fields=new Map();this.owners.set(owner,fields);while(this.owners.size>this.limit)this.owners.delete(this.owners.keys().next().value!);}
    if(!fields.has(field))fields.set(field,initial());
    return fields.get(field) as T;
  }
  set<T>(owner:string,field:string,value:T):void{this.get(owner,field,()=>value);this.owners.get(owner)!.set(field,value);for(const listener of this.listeners)listener();}
  subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
}
export const sessionDrafts=new SessionDrafts();
