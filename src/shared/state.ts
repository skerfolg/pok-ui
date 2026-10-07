import type { AppState, BuildDocument, Chat } from './contracts';
export function createDefaultState(): AppState {
  return { schemaVersion: 1, chats: [], builds: [], settings: {
    theme: 'system', density: 'compact', pok: { mode: 'bundled', root: '', python: '', luajit: '' },
    agent: { provider: 'codex', executable: 'codex', model: '' }, trade: { league: '' },
  } };
}
export function createBuildDocument(name: string, xml: string, sourceName = ''): BuildDocument {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), name, xml, originalXml: xml, sourceName, revision: 0, createdAt: now, updatedAt: now, undo: [] };
}
export function createChat(buildId?: string): Chat {
  return { id: crypto.randomUUID(), title: '새 대화', pinned: false, updatedAt: new Date().toISOString(), messages: [], buildId };
}
