import { useEffect, useMemo, useState } from 'react';
import type { AgentQuestionRequest } from '../../shared/contracts';

type QuestionDraft = Record<string, { choice: string; text: string }>;

const OTHER_VALUE = '__other__';

export function AgentQuestionCard({
  request,
  onSubmit,
  disabled,
}: {
  request: AgentQuestionRequest;
  onSubmit: (requestId: string, answers: Record<string, string[]>) => Promise<void>;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState<QuestionDraft>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setDraft({});
    setError('');
    setSubmitting(false);
  }, [request.requestId]);

  const complete = useMemo(() => request.questions.every(question => {
    const answer = draft[question.id];
    if (!answer) return false;
    if (question.options?.length && answer.choice !== OTHER_VALUE) return Boolean(answer.choice);
    return Boolean(answer.text.trim());
  }), [draft, request.questions]);

  async function submit() {
    if (!complete || submitting) return;
    const answers: Record<string, string[]> = Object.create(null);
    for (const question of request.questions) {
      const answer = draft[question.id] ?? { choice: '', text: '' };
      if (question.options?.length && answer.choice !== OTHER_VALUE) {
        answers[question.id] = [answer.choice];
      } else {
        answers[question.id] = [answer.text.trim()];
      }
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(request.requestId, answers);
    } catch (caught) {
      setError(String(caught));
      setSubmitting(false);
    }
  }

  return <article className="agent-question-card" aria-label="에이전트 질문">
    {request.questions.map(question => {
      const current = draft[question.id] ?? { choice: '', text: '' };
      const hasOptions = Boolean(question.options?.length);
      return <fieldset key={question.id}>
        <legend>{question.header}</legend>
        <p>{question.question}</p>
        {hasOptions && <div className="question-options">
          {question.options?.map(option => <label key={option.label} className="question-option">
            <input
              type="radio"
              name={`${request.requestId}-${question.id}`}
              checked={current.choice === option.label}
              disabled={disabled || submitting}
              onChange={() => setDraft(value => ({ ...value, [question.id]: { ...current, choice: option.label } }))}
            />
            <span>{option.label}<small>{option.description}</small></span>
          </label>)}
          {question.isOther && <label className="question-option">
            <input
              type="radio"
              name={`${request.requestId}-${question.id}`}
              checked={current.choice === OTHER_VALUE}
              disabled={disabled || submitting}
              onChange={() => setDraft(value => ({ ...value, [question.id]: { ...current, choice: OTHER_VALUE } }))}
            />
            <span>직접 입력</span>
          </label>}
        </div>}
        {(!hasOptions || question.isOther) && (question.isSecret ? <input
          aria-label={`${question.header} 직접 입력`}
          type="password"
          value={current.text}
          disabled={disabled || submitting || (hasOptions && current.choice !== OTHER_VALUE)}
          onChange={event => setDraft(value => ({ ...value, [question.id]: { ...current, text: event.target.value, choice: hasOptions ? current.choice || OTHER_VALUE : current.choice } }))}
          placeholder="응답 입력"
        /> : <textarea
          aria-label={`${question.header} 직접 입력`}
          value={current.text}
          disabled={disabled || submitting || (hasOptions && current.choice !== OTHER_VALUE)}
          onChange={event => setDraft(value => ({ ...value, [question.id]: { ...current, text: event.target.value, choice: hasOptions ? current.choice || OTHER_VALUE : current.choice } }))}
          placeholder="답변을 입력하세요"
        />)}
      </fieldset>;
    })}
    {error && <p className="warning">{error}</p>}
    <div className="actions justify-between">
      <span className="muted">{disabled ? '현재는 답변을 보낼 수 없습니다.' : '에이전트가 답변을 기다리는 중입니다.'}</span>
      <button type="button" className="primary" disabled={disabled || !complete || submitting} onClick={() => void submit()}>{submitting ? '전송 중…' : '답변 보내기'}</button>
    </div>
  </article>;
}
