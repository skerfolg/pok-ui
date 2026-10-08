import type { CalculationProvenance } from './calculation-context';
import type { CatalogEntry, CatalogEntryType, CatalogQuery, CatalogQueryResult, DataBundleInfo, ItemRenderRequest, ItemRenderResult, RuntimeIdentity } from './game-data';
import type { PassiveTreeData } from './passive-tree';

export type { CatalogEntry, CatalogEntryType, CatalogQuery, CatalogQueryResult, DataBundleInfo, ItemRenderRequest, ItemRenderResult } from './game-data';
export type { PassiveTreeData } from './passive-tree';

export type View = 'chat' | 'equipment' | 'skills' | 'tree' | 'config' | 'settings' | 'calculations';
export type Attributes = Record<string, string>;
export interface Item { id: string; name: string; base: string; rarity: string; text: string }
export interface ItemSet { id: string; title: string; slots: Record<string, string>; active: boolean }
export interface Gem { name: string; level: number; quality: number; enabled: boolean; attributes: Attributes; sourceIndex?: number }
export interface SkillGroup { id: string; label: string; slot: string; enabled: boolean; includeInFullDPS: boolean; gems: Gem[]; attributes: Attributes }
export interface SkillSet { id: string; title: string; groups: SkillGroup[]; active: boolean }
export interface TreeSpec { id: string; title: string; version: string; nodes: number[]; sockets: { nodeId: string; itemId: string }[]; active: boolean; attributes: Attributes }
export interface ConfigSet { id: string; title: string; inputs: Record<string, string | number | boolean>; placeholders: Attributes[]; active: boolean }
export interface ParsedBuild {
  className: string; ascendancy: string; level: number; mainSocketGroup: number;
  items: Item[]; itemSets: ItemSet[]; skillSets: SkillSet[]; trees: TreeSpec[]; configs: ConfigSet[];
  stats: Record<string, string>;
}
export type BuildAtomicEdit =
  | { type: 'item'; id: string; text: string }
  | { type: 'item-equip'; setId: string; slot: string; id: string; text: string }
  | { type: 'slot'; setId: string; slot: string; itemId: string }
  | { type: 'skill-group'; setId: string; groupId: string; group: SkillGroup }
  | { type: 'skill-add'; setId: string }
  | { type: 'skill-remove'; setId: string; groupId: string }
  | { type: 'main-skill'; index: number }
  | { type: 'tree-nodes'; specId: string; nodes: number[] }
  | { type: 'config'; setId: string; key: string; value: string | number | boolean }
  | { type: 'character'; level: number; className: string; ascendancy: string; classId?: number; ascendancyId?: number; classLegacyId?: number; classInternalId?: number; ascendancyLegacyId?: number; ascendancyInternalId?: string; treeVersion?: string; startNodeId?: string }
  | { type: 'active-set'; kind: 'items' | 'skills' | 'tree' | 'config'; id: string };
export type BuildEdit = BuildAtomicEdit | { type: 'batch'; edits: BuildAtomicEdit[] };
export interface Calculation { provenance?: CalculationProvenance; revision: number; at: string; result: Record<string, unknown>; restoreNotes: unknown[] }
export interface BuildDocument {
  id: string; name: string; revision: number; createdAt: string; updatedAt: string;
  xml: string; originalXml: string; sourceName: string;
  undo: { xml: string; label: string }[]; calculation?: Calculation;
}
export interface ChatImage { id:string; name:string; mimeType:string; size:number }
export interface AgentModel { id:string; label:string; description?:string; isDefault?:boolean; inputModalities?:string[]; reasoningEfforts?:{effort:string;description:string}[] }
export interface AgentQuestion { id:string; header:string; question:string; options?:{label:string;description:string}[]; isSecret?:boolean; isOther?:boolean }
export interface AgentQuestionRequest { requestId:string; chatId:string; questions:AgentQuestion[]; mode?:'blocking'|'async' }
export interface AgentQuestionAnswer { continuation:'answered'|'steered'|'new-turn'; text?:string }
export interface Message { id: string; role: 'user' | 'assistant' | 'system'; text: string; at: string; completedAt?:string; durationMs?:number; firstTokenAt?:string; images?:ChatImage[]; status?: 'streaming' | 'complete' | 'error' | 'cancelled' }
export interface Chat { id: string; title: string; pinned: boolean; updatedAt: string; messages: Message[]; providerThreadId?: string; buildId?: string }
export interface Settings {
  theme: 'system' | 'dark' | 'light'; density: 'compact' | 'comfortable';
  pok: { mode: 'checkout' | 'bundled'; root: string; python: string; luajit: string };
  agent: { provider: 'codex' | 'claude'; executable: string; model: string; reasoningEffort?:string };
  trade: { league: string };
}
export interface AppState { schemaVersion: 1; settings: Settings; chats: Chat[]; builds: BuildDocument[]; activeBuildId?: string; activeChatId?: string }
export interface ConnectionInfo { connected: boolean; connecting?: boolean; managed?: boolean; bundleId?: string; identity?: RuntimeIdentity; compatibility?: 'ready' | 'engine-unavailable' | 'incompatible'; info?: unknown; tools?: string[]; error?: string }
export interface BuildProposalDraft { buildId: string; baseRevision: number; baseXmlSha256: string; bundleId: string; xml: string; summary: string }
export interface BuildProposal extends BuildProposalDraft { proposalId: string; changes: string[] }
export interface AgentRequest { chatId: string; prompt: string; history: Message[]; images?:ChatImage[]; providerThreadId?: string; build?: { id: string; name: string; revision: number; xml: string; xmlSha256?: string; bundleId?: string } }
export interface AgentEvent { chatId: string; type: 'delta' | 'completed' | 'error' | 'status' | 'approval' | 'question' | 'build-proposal'; text?: string; threadId?: string; requestId?: string; details?: unknown; finishReason?:'completed'|'cancelled'|'error' }
export interface DesktopApi {
  readonly platform:string;
  readonly windowChrome:boolean;
  loadState(): Promise<AppState>;
  saveState(state: AppState): Promise<void>;
  importBuild(): Promise<BuildDocument | null>;
  exportBuild(build: BuildDocument, format: 'xml' | 'pob' | 'json'): Promise<string | null>;
  connectPok(settings: Settings['pok']): Promise<ConnectionInfo>;
  getPokConnection(): Promise<ConnectionInfo>;
  onPokConnection(listener: (connection: ConnectionInfo) => void): () => void;
  callPok(name: string, args: Record<string, unknown>): Promise<unknown>;
  getDataBundleInfo(): Promise<DataBundleInfo>;
  queryPobCatalog(query: CatalogQuery): Promise<CatalogQueryResult>;
  getPobCatalogEntry(type: CatalogEntryType, id: string): Promise<CatalogEntry>;
  renderPobItem(request: ItemRenderRequest): Promise<ItemRenderResult>;
  loadPassiveTree(version: string): Promise<PassiveTreeData>;
  computeBuild(build: BuildDocument): Promise<Calculation>;
  applyBuildProposal(proposalId: string): Promise<BuildDocument>;
  sendChat(request: AgentRequest): Promise<void>;
  listAgentModels():Promise<AgentModel[]>;
  pickChatImages():Promise<ChatImage[]>;
  addChatImage(image:{name:string;dataUrl:string}):Promise<ChatImage>;
  chatImageUrl(id:string):string;
  answerAgentQuestion(requestId:string,answers:Record<string,string[]>):Promise<AgentQuestionAnswer>;
  cancelChat(chatId: string): Promise<void>;
  resolveApproval(requestId: string, decision: 'accept' | 'decline'): Promise<void>;
  onAgentEvent(listener: (event: AgentEvent) => void): () => void;
  openDataFolder(): Promise<void>;
  selectPath(kind: 'directory' | 'executable'): Promise<string | null>;
}
declare global { interface Window { pok?: DesktopApi } }
