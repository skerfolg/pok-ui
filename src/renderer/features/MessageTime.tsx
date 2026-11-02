import { useEffect, useState } from 'react';
import type { Message } from '../../shared/contracts';

function clock(value: string): string {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function duration(ms: number): string {
  if (ms < 1000) return '1초 미만';
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}초`;
  return `${Math.floor(seconds / 60)}분 ${seconds % 60}초`;
}

export function MessageTime({ message, running, startedAt }: { message: Message; running?: boolean; startedAt?: number }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const firstTokenAt = message.firstTokenAt ? new Date(message.firstTokenAt).getTime() : undefined;
  const messageStartedAt = startedAt ?? new Date(message.at).getTime();
  const completedAt = message.completedAt ? new Date(message.completedAt).getTime() : undefined;
  const elapsed = message.durationMs ?? (completedAt ? completedAt - messageStartedAt : running ? now - messageStartedAt : undefined);
  const completed = message.completedAt ? clock(message.completedAt) : undefined;

  return <time dateTime={message.completedAt ?? message.at} title={firstTokenAt ? '첫 응답까지 '+duration(Math.max(0,firstTokenAt-messageStartedAt)) : undefined}>
    {completed ?? clock(message.at)}
    {elapsed !== undefined && <span> · {duration(Math.max(0, elapsed))}</span>}
    {message.status==='cancelled'&&<span> · 중지됨</span>}
  </time>;
}
