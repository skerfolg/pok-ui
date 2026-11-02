import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, ImagePlus, Search, Square, X, Pencil } from 'lucide-react';
import type { AgentModel, AgentQuestionRequest, Chat, ChatImage, Settings } from '../../shared/contracts';
import { api } from '../services/api';
import { AgentQuestionCard } from './AgentQuestionCard';
import { MessageTime } from './MessageTime';
import '../design/chat-controls.css';

const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

interface ChatViewProps {
  chat?: Chat;
  running: boolean;
  liveText: string;
  status: string;
  send: (text: string, images?: ChatImage[]) => void;
  cancel: () => void;
  editMessage: (id: string, text: string) => void;
  connected: boolean;
  agentSettings: Settings['agent'];
  changeAgentSettings: (patch: Partial<Settings['agent']>) => void;
  question?: AgentQuestionRequest;
  answerQuestion: (requestId: string, answers: Record<string, string[]>) => Promise<void>;
  engineConnecting?: boolean;
  questionBusy?:boolean;
}

function formatSize(size: number): string {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MiB`;
  return `${Math.max(1, Math.round(size / 1024))} KiB`;
}

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`${file.name} 파일을 읽지 못했습니다.`));
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error(`${file.name} 이미지 데이터가 비어 있습니다.`));
    reader.readAsDataURL(file);
  });
}

export function ChatView({
  chat,
  running,
  liveText,
  status,
  send,
  cancel,
  editMessage,
  connected,
  agentSettings,
  changeAgentSettings,
  question,
  answerQuestion,
  engineConnecting = false,
  questionBusy = false,
}: ChatViewProps) {
  const [input, setInput] = useState('');
  const [editing, setEditing] = useState('');
  const [draft, setDraft] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Record<string, any>[]>([]);
  const [detail, setDetail] = useState<unknown>();
  const [searchError, setSearchError] = useState('');
  const [models, setModels] = useState<AgentModel[]>([]);
  const [modelError, setModelError] = useState('');
  const [images, setImages] = useState<ChatImage[]>([]);
  const [imageError, setImageError] = useState('');
  const [dragging, setDragging] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const liveStartedAt = useRef<number | undefined>(undefined);

  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }); }, [chat?.messages.length, liveText, question?.requestId]);
  useEffect(()=>{
    if(!question)return;
    let frame=0;
    const reveal=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>bottom.current?.scrollIntoView({block:'end'}));};
    window.addEventListener('resize',reveal);
    return()=>{window.removeEventListener('resize',reveal);cancelAnimationFrame(frame);};
  },[question?.requestId]);

  useEffect(() => {
    let cancelled = false;
    setModelError('');
    api.listAgentModels()
      .then(list => {
        if (cancelled) return;
        setModels(list);
      })
      .catch(error => {
        if (!cancelled) setModelError(String(error));
      });
    return () => { cancelled = true; };
  }, [agentSettings.provider, agentSettings.executable]);

  useEffect(() => {
    if (running) {
      liveStartedAt.current ??= Date.now();
    } else {
      liveStartedAt.current = undefined;
    }
  }, [running]);

  const selectedModel = useMemo(() => {
    return models.find(model => model.id === agentSettings.model) ?? models.find(model => model.isDefault) ?? models[0];
  }, [agentSettings.model, models]);

  const supportsImages = selectedModel?.inputModalities?.includes('image') ?? true;
  const canSend = !running && !engineConnecting && Boolean(input.trim() || images.length);

  async function search() {
    setSearchError('검색 중…');
    try {
      const result = await api.callPok('search_kb', { query, limit: 30 });
      setResults(Array.isArray(result) ? result : []);
      setDetail(undefined);
      setSearchError('');
    } catch (e) {
      setSearchError(String(e));
    }
  }

  async function addImages(next: ChatImage[]) {
    const available = MAX_IMAGES - images.length;
    if (available <= 0) {
      setImageError(`이미지는 최대 ${MAX_IMAGES}개까지 첨부할 수 있습니다.`);
      return;
    }
    const accepted = next.slice(0, available);
    setImages(current => [...current, ...accepted]);
    setImageError(next.length > accepted.length ? `이미지는 최대 ${MAX_IMAGES}개까지 첨부할 수 있습니다.` : '');
  }

  async function chooseImages() {
    try {
      const picked = await api.pickChatImages();
      await addImages(picked.filter(image => image.size <= MAX_IMAGE_BYTES));
      if (picked.some(image => image.size > MAX_IMAGE_BYTES)) setImageError(`이미지는 파일당 ${formatSize(MAX_IMAGE_BYTES)} 이하만 첨부할 수 있습니다.`);
    } catch (error) {
      setImageError(String(error));
    }
  }

  async function addFiles(files: FileList | File[]) {
    const fileList = Array.from(files).filter(isImageFile);
    if (!fileList.length) return;
    const tooLarge = fileList.find(file => file.size > MAX_IMAGE_BYTES);
    if (tooLarge) {
      setImageError(`${tooLarge.name}은 ${formatSize(MAX_IMAGE_BYTES)}를 초과합니다.`);
      return;
    }
    const available = MAX_IMAGES - images.length;
    if (available <= 0) {
      setImageError(`이미지는 최대 ${MAX_IMAGES}개까지 첨부할 수 있습니다.`);
      return;
    }
    try {
      const uploaded: ChatImage[] = [];
      for (const file of fileList.slice(0, available)) {
        uploaded.push(await api.addChatImage({ name: file.name, dataUrl: await readImageFile(file) }));
      }
      setImages(current => [...current, ...uploaded]);
      setImageError(fileList.length > available ? `이미지는 최대 ${MAX_IMAGES}개까지 첨부할 수 있습니다.` : '');
    } catch (error) {
      setImageError(String(error));
    }
  }

  function submit() {
    if (!canSend) return;
    send(input.trim(), images);
    setInput('');
    setImages([]);
    setImageError('');
  }

  return <section
    className="feature chat-view fill"
    onDragEnter={event => {
      if (Array.from(event.dataTransfer.items).some(item => item.kind === 'file')) {
        event.preventDefault();
        setDragging(true);
      }
    }}
    onDragOver={event => {
      if (dragging) event.preventDefault();
    }}
    onDragLeave={event => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
    }}
    onDrop={event => {
      event.preventDefault();
      setDragging(false);
      void addFiles(event.dataTransfer.files);
    }}
  >
    <div className="page-heading chat-heading">
      <h1>{chat?.title ?? '새 대화'}</h1>
      <div className="chat-agent-controls">
        <label>
          <span>모델</span>
          <select
            aria-label="에이전트 모델"
            value={agentSettings.model}
            onChange={event => changeAgentSettings({ model: event.target.value, reasoningEffort: undefined })}
          >
            <option value="">기본 모델{models.find(model => model.isDefault)?.label ? ` (${models.find(model => model.isDefault)?.label})` : ''}</option>
            {models.map(model => <option key={model.id} value={model.id}>{model.label}{model.isDefault ? ' · 기본값' : ''}</option>)}
          </select>
        </label>
        {selectedModel?.reasoningEfforts?.length ? <label>
          <span>추론</span>
          <select
            aria-label="추론 강도"
            value={agentSettings.reasoningEffort ?? ''}
            onChange={event => changeAgentSettings({ reasoningEffort: event.target.value || undefined })}
          >
            <option value="">기본값</option>
            {selectedModel.reasoningEfforts.map(item => <option key={item.effort} value={item.effort}>{item.effort}</option>)}
          </select>
        </label> : null}
        <button onClick={() => setSearchOpen(v => !v)}><Search size={14} />지식 검색</button>
      </div>
      {modelError && <p className="warning chat-model-error">{modelError}</p>}
    </div>
    {searchOpen && <div className="knowledge-panel">
      <form className="actions" onSubmit={e => { e.preventDefault(); void search(); }}>
        <input aria-label="게임 지식 검색" value={query} onChange={e => setQuery(e.target.value)} placeholder="아이템·젬·패시브 검색" />
        <button disabled={!connected || !query.trim()}>검색</button>
      </form>
      <p role="status" className="muted">{connected ? searchError : 'pok 엔진을 먼저 연결하세요.'}</p>
      <div className="knowledge-results">{results.map((r, i) => r.empty ? <p key={i}>{JSON.stringify(r.why)}</p> : <button key={r.id} onClick={() => api.callPok('get_entry', { id: r.id }).then(setDetail).catch(e => setSearchError(String(e)))}>{r.name_ko || r.name_en || r.id}<small>{r.type}</small></button>)}</div>
      {detail !== undefined && <pre className="knowledge-detail">{JSON.stringify(detail, null, 2)}</pre>}
    </div>}
    <div className="chat-log scroll">
      {!chat?.messages.length && <div className="chat-empty">
        <div className="brand-mark">pk</div>
        <h2>어떤 빌드를 만들어볼까요?</h2>
        <p>게임 지식을 찾고, 장비·스킬·패시브를 함께 다듬으세요.</p>
        <div className="suggestions">{['이 빌드의 약점을 분석해줘', '주력 스킬에 맞는 보조 젬을 찾아줘', '생존력을 유지하면서 DPS를 높여줘'].map(text => <button key={text} onClick={() => setInput(text)}>{text}</button>)}</div>
      </div>}
      {chat?.messages.map(message => <article key={message.id} className={`message ${message.role}`}>
        <header>
          <strong>{message.role === 'user' ? '나' : message.role === 'assistant' ? 'pok 에이전트' : '시스템'}</strong>
          {message.role === 'user' && !running && <button className="icon-button" aria-label="메시지 편집" onClick={() => { setEditing(message.id); setDraft(message.text); }}><Pencil size={13} /></button>}
          <MessageTime message={message} running={message.status === 'streaming' && running} startedAt={liveStartedAt.current} />
        </header>
        {editing === message.id ? <div>
          <textarea aria-label="메시지 수정" value={draft} onChange={e => setDraft(e.target.value)} />
          <p className="muted note">수정한 메시지 이후의 응답은 제거됩니다. 다음 전송에서 새 맥락으로 이어갑니다.</p>
          <div className="actions"><button onClick={() => setEditing('')}>취소</button><button className="primary" onClick={() => { editMessage(message.id, draft); setEditing(''); }}>수정 저장</button></div>
        </div> : <>
          {message.images?.length ? <div className="message-images">{message.images.map(image => <img key={image.id} src={api.chatImageUrl(image.id)} alt={image.name} />)}</div> : null}
          <div className={`message-text ${message.status === 'error' ? 'warning' : ''}`}>
            {message.status === 'streaming' && running ? liveText || status || '응답 준비 중…' : message.text || (message.status === 'streaming' ? '이전 응답이 중단되었습니다.' : message.status === 'cancelled' ? '응답이 중지되었습니다.' : '')}
          </div>
        </>}
      </article>)}
      {question && chat?.id === question.chatId ? <AgentQuestionCard request={question} onSubmit={answerQuestion} disabled={questionBusy||(question.mode!=='async'&&!running)} /> : null}
      <div ref={bottom} />
    </div>
    <form
      className={`composer ${dragging ? 'dragging' : ''}`}
      onPaste={event => {
        const files = Array.from(event.clipboardData.files).filter(isImageFile);
        if (files.length) void addFiles(files);
      }}
      onSubmit={e => { e.preventDefault(); submit(); }}
    >
      {dragging && <div className="drop-hint">이미지를 여기에 놓아 첨부</div>}
      {images.length ? <div className="image-tray" aria-label="첨부 이미지">
        {images.map(image => <figure key={image.id}>
          <img src={api.chatImageUrl(image.id)} alt={image.name} />
          <figcaption><span>{image.name}</span><small>{formatSize(image.size)}</small></figcaption>
          <button type="button" aria-label={`${image.name} 제거`} onClick={() => setImages(current => current.filter(item => item.id !== image.id))}><X size={13} /></button>
        </figure>)}
      </div> : null}
      <textarea
        aria-label="에이전트 메시지"
        placeholder="pok에 질문하거나 빌드 수정을 요청하세요…"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <div className="composer-bottom">
        <span className={imageError || !supportsImages || engineConnecting ? 'warning' : 'muted'}>{imageError || (!supportsImages ? '선택한 모델은 이미지 입력을 지원하지 않을 수 있습니다.' : running ? status || '에이전트 실행 중' : engineConnecting ? 'POK 연결을 확인하는 중…' : 'Enter 전송 · Shift+Enter 줄바꿈')}</span>
        <div className="composer-actions">
          <button type="button" aria-label="이미지 첨부" disabled={running || images.length >= MAX_IMAGES} onClick={() => void chooseImages()}><ImagePlus size={15} /></button>
          {running ? <button type="button" className="stop-button" onClick={cancel}><Square size={15} />응답 중지</button> : <button className="primary" aria-label="메시지 보내기" disabled={!canSend}><ArrowUp size={17} /></button>}
        </div>
      </div>
    </form>
  </section>;
}
