import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, Shield, Gem, Network, SlidersHorizontal, Settings2, Plus, MoreHorizontal, Upload, Download, Undo2, Calculator, Pin, FolderOpen, X } from 'lucide-react';
import type { AgentEvent, BuildEdit, Chat, ConnectionInfo, Message, View } from '../shared/contracts';
import { createBuildDocument, createChat } from '../shared/state';
import { createBlankXml, parseBuild } from '../shared/pob-document';
import { useWorkspace } from './state/useWorkspace';
import { api, isDesktop } from './services/api';
import { StatsRail, calculationStats } from './components/StatsRail';
import { EquipmentView } from './features/EquipmentView';
import { SkillsView } from './features/SkillsView';
import { ConfigView } from './features/ConfigView';
import { TreeView } from './features/TreeView';
import { ChatView } from './features/ChatView';
import { SettingsView } from './features/SettingsView';
const navigation = [{ id: 'chat', label: '채팅', icon: MessageSquare }, { id: 'equipment', label: '장비', icon: Shield }, { id: 'skills', label: '스킬', icon: Gem }, { id: 'tree', label: '패시브트리', icon: Network }, { id: 'config', label: '설정', icon: SlidersHorizontal }, { id: 'settings', label: 'pok 설정', icon: Settings2 }] as const;
interface Proposal { buildId: string; baseRevision: number; xml: string; summary: string }
export function App() {
  const workspace = useWorkspace(); const { state, loaded, update, changeBuild, applyEdit, undo, saveStatus, error, setError, flush } = workspace;
  const [view, setView] = useState<View>('equipment'); const [connection, setConnection] = useState<ConnectionInfo>({ connected: false }); const [busy, setBusy] = useState(''); const [notice, setNotice] = useState('');
  const [rename, setRename] = useState<{ id: string; title: string }>(); const [deleted, setDeleted] = useState<Chat>();
  const [running, setRunning] = useState<string>(); const [liveText, setLiveText] = useState(''); const [agentStatus, setAgentStatus] = useState(''); const [approvals, setApprovals] = useState<AgentEvent[]>([]); const [proposal, setProposal] = useState<Proposal>();
  const activeTurn = useRef<{ chatId: string; messageId: string; text: string } | undefined>(undefined);
  const connectedOnLoad = useRef(false);
  const build = state.builds.find(b => b.id === state.activeBuildId) ?? state.builds[0];
  const chat = state.chats.find(c => c.id === state.activeChatId);
  const parsedResult = useMemo(() => { try { return { parsed: build ? parseBuild(build.xml) : undefined, error: '' }; } catch (e) { return { parsed: undefined, error: String(e) }; } }, [build?.xml]);
  const parsed = parsedResult.parsed;
  const showStats = Boolean(build && parsed && ['equipment', 'skills', 'tree', 'config', 'calculations'].includes(view));
  useEffect(() => { document.documentElement.dataset.theme = state.settings.theme; document.documentElement.dataset.density = state.settings.density; }, [state.settings.theme, state.settings.density]);
  useEffect(() => api.onAgentEvent(event => {
    const current = activeTurn.current;
    if (event.type === 'status' && event.requestId && (event.details as { approvalResolved?: boolean } | undefined)?.approvalResolved) { setApprovals(list => list.filter(a => a.requestId !== event.requestId)); return; }
    if (event.type === 'approval') { setApprovals(list => [...list.filter(a => a.requestId !== event.requestId), event]); return; }
    if (event.type === 'build-proposal') { setProposal(event.details as Proposal); return; }
    if (!current || event.chatId !== current.chatId) return;
    if (event.type === 'delta') { current.text += event.text ?? ''; setLiveText(current.text); }
    if (event.type === 'status') setAgentStatus(event.text ?? '');
    if (event.threadId) update(s => s.chats.find(c => c.id === event.chatId)?.providerThreadId === event.threadId ? s : ({ ...s, chats: s.chats.map(c => c.id === event.chatId ? { ...c, providerThreadId: event.threadId } : c) }));
    if (event.type === 'completed' || event.type === 'error') {
      const finalText = current.text + (event.type === 'error' ? `\n\n${event.text || '응답이 중단되었습니다.'}` : '');
      update(s => ({ ...s, chats: s.chats.map(c => c.id === event.chatId ? { ...c, updatedAt: new Date().toISOString(), messages: c.messages.map(m => m.id === current.messageId ? { ...m, text: finalText, status: event.type === 'error' ? 'error' : 'complete' } : m) } : c) }));
      activeTurn.current = undefined; setRunning(undefined); setLiveText(''); setAgentStatus(''); setApprovals(list => list.filter(a => a.chatId !== event.chatId));
    }
  }), [update]);
  async function connect(settings = state.settings.pok) { setBusy('pok 연결 중…'); try { setConnection(await api.connectPok(settings)); } catch (e) { setConnection({ connected: false, error: String(e) }); } finally { setBusy(''); } }
  useEffect(() => { if (loaded && isDesktop && !connectedOnLoad.current) { connectedOnLoad.current = true; void connect(); } }, [loaded]);
  async function importFile() { try { const imported = await api.importBuild(); if (!imported) return; update(s => ({ ...s, builds: [...s.builds, imported], activeBuildId: imported.id })); setView('equipment'); setNotice(`${imported.sourceName} 불러옴`); } catch (e) { setError(String(e)); } }
  function newBuild() { const next = createBuildDocument('새 빌드', createBlankXml()); update(s => ({ ...s, builds: [...s.builds, next], activeBuildId: next.id })); setView('equipment'); }
  function newChat() { const next = createChat(build?.id); update(s => ({ ...s, chats: [next, ...s.chats], activeChatId: next.id })); setView('chat'); }
  const edit = (operation: BuildEdit, label: string) => { if (!build) return; try { applyEdit(build.id, operation, label); } catch (e) { setError(String(e)); } };
  async function compute() { if (!build) return; const submitted = build; setBusy('PoB 계산 중…'); try { const result = await api.computeBuild(submitted); changeBuild(submitted.id, current => ({ ...current, calculation: result })); if (result.result.ok === false) { setNotice('계산을 완료하지 못했습니다. 복원·계산 진단을 확인하세요.'); setView('calculations'); } else setNotice('계산 결과를 받았습니다. 진단 항목도 확인하세요.'); } catch (e) { setError(String(e)); } finally { setBusy(''); } }
  async function send(prompt: string) {
    if (activeTurn.current) return;
    const target = chat ?? createChat(build?.id); const assistantId = crypto.randomUUID(); const now = new Date().toISOString();
    const messages: Message[] = [...target.messages, { id: crypto.randomUUID(), role: 'user', text: prompt, at: now, status: 'complete' }, { id: assistantId, role: 'assistant', text: '', at: now, status: 'streaming' }];
    const next = { ...target, title: !target.messages.length && target.title === '새 대화' ? prompt.slice(0, 35) : target.title, messages, updatedAt: now, buildId: build?.id };
    update(s => ({ ...s, activeChatId: next.id, chats: s.chats.some(c => c.id === next.id) ? s.chats.map(c => c.id === next.id ? next : c) : [next, ...s.chats] }));
    activeTurn.current = { chatId: next.id, messageId: assistantId, text: '' }; setRunning(next.id); setLiveText(''); setAgentStatus('에이전트 연결 중…');
    try { await flush(); await api.sendChat({ chatId: next.id, prompt, history: target.messages.filter(m => m.status !== 'streaming'), providerThreadId: target.providerThreadId, build: build ? { id: build.id, name: build.name, revision: build.revision, xml: build.xml } : undefined }); }
    catch (e) { update(s => ({ ...s, chats: s.chats.map(c => c.id === next.id ? { ...c, messages: c.messages.map(m => m.id === assistantId ? { ...m, text: String(e), status: 'error' } : m) } : c) })); activeTurn.current = undefined; setRunning(undefined); }
  }
  function editMessage(id: string, text: string) { if (!chat) return; const index = chat.messages.findIndex(m => m.id === id); update(s => ({ ...s, chats: s.chats.map(c => c.id === chat.id ? { ...c, providerThreadId: undefined, updatedAt: new Date().toISOString(), messages: c.messages.slice(0, index + 1).map(m => m.id === id ? { ...m, text } : m) } : c) })); }
  async function approve(event: AgentEvent, decision: 'accept' | 'decline') { try { await api.resolveApproval(event.requestId!, decision); setApprovals(list => list.filter(a => a.requestId !== event.requestId)); } catch (e) { setError(String(e)); } }
  function applyProposal() { if (!proposal) return; const target = state.builds.find(b => b.id === proposal.buildId); if (!target || target.revision !== proposal.baseRevision) { setError('제안 이후 빌드가 변경됐습니다. 현재 리비전으로 다시 제안받으세요.'); return; } try { parseBuild(proposal.xml); changeBuild(target.id, b => ({ ...b, xml: proposal.xml, revision: b.revision + 1, updatedAt: new Date().toISOString(), undo: [...b.undo, { xml: b.xml, label: 'AI 빌드 제안 적용' }].slice(-30) })); setProposal(undefined); setNotice('AI 변경을 적용했습니다. 새 계산이 필요합니다.'); } catch (e) { setError(String(e)); } }
  const sortedChats = [...state.chats].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-mark">pk</span><div><strong>pok</strong><small>Path of Knowledge</small></div></div><nav aria-label="주요 메뉴">{navigation.map(({ id, label, icon: Icon }) => <button className="nav-item" key={id} aria-current={view === id ? 'page' : undefined} onClick={() => setView(id)}><Icon size={17} /><span>{label}</span></button>)}</nav>
      <div className="history-heading"><span>최근 대화</span><button className="icon-button" aria-label="새 대화" onClick={newChat}><Plus size={16} /></button></div><div className="history-list scroll">{sortedChats.map(c => <div className="history-row" key={c.id} data-active={c.id === chat?.id && view === 'chat'}><button className="history-title" onClick={() => { update(s => ({ ...s, activeChatId: c.id, activeBuildId: c.buildId ?? s.activeBuildId })); setView('chat'); }}>{c.pinned && <Pin size={11} />}<span>{c.title}</span></button><details className="history-menu"><summary aria-label={`${c.title} 대화 관리`}><MoreHorizontal size={15} /></summary><div className="menu"><button onClick={() => setRename({ id: c.id, title: c.title })}>이름 변경</button><button onClick={() => update(s => ({ ...s, chats: s.chats.map(x => x.id === c.id ? { ...x, pinned: !x.pinned } : x) }))}>{c.pinned ? '고정 해제' : '고정'}</button><button disabled={running === c.id} onClick={() => { setDeleted(c); update(s => ({ ...s, chats: s.chats.filter(x => x.id !== c.id), activeChatId: s.activeChatId === c.id ? undefined : s.activeChatId })); }}>대화 삭제</button></div></details></div>)}</div><div className="sidebar-bottom"><span className={`connection-dot ${connection.connected ? 'online' : ''}`} /><button className="text-button" onClick={() => setView('settings')}>{connection.connected ? 'pok 연결됨' : 'pok 연결 설정'}</button></div>
    </aside>
    <main className="main"><header className="topbar"><div className="build-heading"><small>현재 빌드</small><div className="build-picker"><select aria-label="현재 빌드" value={build?.id ?? ''} onChange={e => update(s => ({ ...s, activeBuildId: e.target.value }))}>{!build && <option value="">빌드를 가져오세요</option>}{state.builds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select><button className="icon-button" aria-label="새 빌드" onClick={newBuild}><Plus size={15} /></button></div>{parsed && <small>Lv. {parsed.level} · {parsed.className} · {parsed.ascendancy}</small>}</div><div className="top-actions"><button onClick={() => void importFile()}><Upload size={14} />가져오기</button><details className="export-menu"><summary><Download size={14} />내보내기</summary><div className="menu">{(['xml', 'pob', 'json'] as const).map(format => <button key={format} disabled={!build} onClick={() => build && api.exportBuild(build, format).then(path => path && setNotice(`저장: ${path}`)).catch(e => setError(String(e)))}>{format === 'json' ? 'POK 편집 문서' : `PoB ${format.toUpperCase()}`}</button>)}</div></details><button disabled={!build?.undo.length} onClick={() => build && undo(build.id)}><Undo2 size={14} />되돌리기</button><button className="primary" disabled={!build || !connection.connected || Boolean(busy)} onClick={() => void compute()}><Calculator size={14} />계산</button></div></header>
      {(error || parsedResult.error) && <div className="error-banner" role="alert"><span>{error || parsedResult.error}</span><button aria-label="오류 닫기" onClick={() => setError('')}><X size={15} /></button></div>}
      <div className={`workspace ${showStats ? 'with-stats' : ''}`}><div className="content">
        {!loaded ? <div className="empty-state"><h1>작업 공간을 불러오는 중…</h1>{error && <button onClick={() => location.reload()}>다시 시도</button>}</div> : view === 'settings' ? <SettingsView settings={state.settings} save={settings => update(s => ({ ...s, settings }))} connect={connect} connection={connection} /> : view === 'chat' ? <ChatView chat={chat} running={Boolean(running)} liveText={running === chat?.id ? liveText : ''} status={running && running !== chat?.id ? '다른 대화에서 에이전트 실행 중' : agentStatus} send={text => void send(text)} cancel={() => running && void api.cancelChat(running).catch(e => setError(String(e)))} editMessage={editMessage} connected={connection.connected} /> : !build || !parsed ? <div className="empty-state"><FolderOpen size={36} /><h1>빌드를 가져와 시작하세요</h1><p>PoB XML·공유 코드 또는 POK 문서를 불러옵니다.</p><div className="actions"><button className="primary" onClick={() => void importFile()}>빌드 가져오기</button><button onClick={newBuild}>새 빌드</button></div></div> : <>
          {view === 'equipment' && <EquipmentView parsed={parsed} edit={edit} />}
          {view === 'skills' && <SkillsView parsed={parsed} edit={edit} />}
          {view === 'tree' && <TreeView parsed={parsed} connected={connection.connected} edit={edit} />}
          {view === 'config' && <ConfigView parsed={parsed} edit={edit} />}
          {view === 'calculations' && <section className="feature scroll"><div className="page-heading"><h1>계산 결과</h1><span className="muted">{build.calculation ? `리비전 ${build.calculation.revision}${build.calculation.revision !== build.revision ? ' · 현재 편집본과 다름' : ''}` : '새 계산 전'}</span></div><div className="calculation-grid"><div className="panel"><header className="panel-heading"><h2>계산된 수치</h2></header><dl className="stats-table">{Object.entries(calculationStats(build)).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>)}</dl></div><div className="panel"><header className="panel-heading"><h2>복원·적법성·계산 진단</h2></header><pre>{JSON.stringify(build.calculation ? { restore: build.calculation.restoreNotes, ...Object.fromEntries(Object.entries(build.calculation.result).filter(([k]) => k !== 'stats')) } : { message: 'pok 엔진 연결 후 계산하세요.' }, null, 2)}</pre></div></div><details className="spaced"><summary>원본 XML 저장값 · {Object.keys(parsed.stats).length}개</summary><dl className="stats-table">{Object.entries(parsed.stats).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></details></section>}
        </>}
      </div>{showStats && <StatsRail build={build!} parsed={parsed!} onDetails={() => setView('calculations')} />}</div>
      <footer className="statusbar"><span>{busy || notice || (build ? `${build.name} · 리비전 ${build.revision}` : '로컬 작업 공간')}{!isDesktop && ' · 브라우저 개발 미리보기'}</span><span role="status">{saveStatus}</span></footer>
    </main>
    {deleted && <div className="toast" role="status">대화를 삭제했습니다.<button onClick={() => { update(s => ({ ...s, chats: [deleted, ...s.chats] })); setDeleted(undefined); }}>되돌리기</button><button aria-label="알림 닫기" onClick={() => setDeleted(undefined)}><X size={14} /></button></div>}
    {rename && <div className="modal-backdrop"><form className="modal" role="dialog" aria-modal="true" aria-label="대화 이름 변경" onSubmit={e => { e.preventDefault(); if (rename.title.trim()) update(s => ({ ...s, chats: s.chats.map(c => c.id === rename.id ? { ...c, title: rename.title.trim() } : c) })); setRename(undefined); }}><h2>대화 이름 변경</h2><input autoFocus aria-label="대화 제목" value={rename.title} onChange={e => setRename({ ...rename, title: e.target.value })} /><div className="actions"><button type="button" onClick={() => setRename(undefined)}>취소</button><button className="primary">저장</button></div></form></div>}
    {approvals[0] && <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-label="에이전트 승인 요청"><h2>에이전트 승인 요청</h2><p>{approvals[0].text}</p><pre>{JSON.stringify(approvals[0].details, null, 2)}</pre><div className="actions"><button onClick={() => void approve(approvals[0], 'decline')}>거절</button><button className="primary" onClick={() => void approve(approvals[0], 'accept')}>이 요청 허용</button></div></section></div>}
    {proposal && !approvals.length && <div className="modal-backdrop"><section className="modal proposal" role="dialog" aria-modal="true" aria-label="AI 빌드 변경 검토"><h2>빌드 수정 제안</h2><p>{proposal.summary}</p><p className="muted">기준 리비전 {proposal.baseRevision} · 적용 후 되돌릴 수 있습니다.</p><details><summary>제안된 PoB XML 확인</summary><pre>{proposal.xml}</pre></details><div className="actions"><button onClick={() => setProposal(undefined)}>닫기</button><button className="primary" onClick={applyProposal}>검토한 변경 적용</button></div></section></div>}
  </div>;
}
