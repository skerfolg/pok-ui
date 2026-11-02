import type { AppState, BuildDocument, Chat } from './contracts';
export function createDefaultState(): AppState {
  return { schemaVersion: 2, chats: [], builds: [], settings: {
    theme: 'system', density: 'compact', pok: { mode: 'bundled', root: '', python: '', luajit: '' },
    agent: { provider: 'codex', executable: 'codex', model: '' }, trade: { league: '' },
  } };
}
export function createBuildDocument(name: string, xml: string, sourceName = ''): BuildDocument {
  const now = new Date().toISOString();
  return { documentSchemaVersion: 2, id: crypto.randomUUID(), name, xml, originalXml: xml, sourceName, revision: 0, createdAt: now, updatedAt: now, undo: [] };
}
export function createChat(buildId?: string): Chat {
  return { id: crypto.randomUUID(), title: '새 대화', pinned: false, updatedAt: new Date().toISOString(), messages: [], buildId };
}

// Pure representation upgrade; main validates the complete persisted envelope.
export function upgradeWorkspace(state:AppState):AppState {
  if(state.schemaVersion!==1&&state.schemaVersion!==2)throw new Error('지원하지 않는 작업 공간 버전입니다.');
  const upgraded=structuredClone(state);
  upgraded.schemaVersion=2;
  upgraded.builds=upgraded.builds.map(build=>({...build,documentSchemaVersion:2}));
  return upgraded;
}
