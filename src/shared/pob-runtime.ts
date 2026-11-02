export interface PobRuntimeInfo {
  status:'ready'|'missing'|'corrupt';
  runtimeId?:string;
  commit?:string;
  version?:string;
  supportedTreeVersions?:string[];
  error?:string;
}
