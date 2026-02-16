'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface PromptOptimizerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPrompt: (prompt: string) => void;
  apiEndpoint: string;
  apiKey: string;
  apiModel: string;
}

const UI = {
  title: '\u63d0\u793a\u8bcd\u4f18\u5316\u52a9\u624b',
  subtitle: '\u4f18\u5316\u7ed3\u6784\uff0c\u589e\u5f3a\u753b\u9762\uff0c\u8f93\u51fa\u53ef\u76f4\u63a5\u751f\u6210\u7684\u82f1\u6587\u63d0\u793a\u8bcd',
  clear: '\u6e05\u7a7a\u5bf9\u8bdd',
  send: '\u53d1\u9001',
  loading: '\u6b63\u5728\u4f18\u5316\u4e2d...',
  apply: '\u5e94\u7528\u6b64\u63d0\u793a\u8bcd',
  optimized: '\u4f18\u5316\u540e\u7684\u82f1\u6587\u63d0\u793a\u8bcd',
  translation: '\u4e2d\u6587\u91ca\u4e49',
  description: '\u753b\u9762\u63cf\u8ff0',
  ready: 'API \u5df2\u5c31\u7eea\u3002',
  notReady: '\u8bf7\u5148\u914d\u7f6e API\u3002',
  inputHint: '\u63cf\u8ff0\u4f60\u60f3\u751f\u6210\u7684\u753b\u9762\uff0c\u4f8b\u5982\uff1a\u96e8\u540e\u8857\u9053\uff0c\u7535\u5f71\u611f\uff0c\u9006\u5149\u4eba\u50cf',
  helper: 'Enter \u53d1\u9001\uff0cShift + Enter \u6362\u884c\u3002',
  welcome: '\u4f60\u597d\uff0c\u6211\u662f\u63d0\u793a\u8bcd\u4f18\u5316\u52a9\u624b\u3002\n\n\u544a\u8bc9\u6211\u4f60\u60f3\u751f\u6210\u4ec0\u4e48\uff0c\u6211\u4f1a\u8fd4\u56de\uff1a\n1. \u53ef\u76f4\u63a5\u4f7f\u7528\u7684\u82f1\u6587\u63d0\u793a\u8bcd\n2. \u4e2d\u6587\u91ca\u4e49\n3. \u753b\u9762\u6c1b\u56f4\u63cf\u8ff0',
  cleared: '\u5bf9\u8bdd\u5df2\u6e05\u7a7a\u3002\u7ee7\u7eed\u8f93\u5165\u4f60\u7684\u521b\u4f5c\u610f\u56fe\u5427\u3002',
  requestFailed: '\u8bf7\u6c42\u5931\u8d25\uff1a',
};

const SYSTEM_PROMPT = `You are a professional image prompt optimizer. Return strict JSON only:
{
  "optimizedPrompt": "optimized English prompt",
  "chineseTranslation": "Chinese meaning",
  "description": "1-2 sentence visual description"
}`;

const Icons = {
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  ),
  send: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

function parseOutput(raw: string) {
  try {
    const parsed = JSON.parse(raw) as { optimizedPrompt?: string; chineseTranslation?: string; description?: string };
    return {
      optimizedPrompt: parsed.optimizedPrompt || '',
      chineseTranslation: parsed.chineseTranslation || '',
      description: parsed.description || '',
    };
  } catch {
    return { optimizedPrompt: raw, chineseTranslation: '', description: '' };
  }
}

export default function PromptOptimizer({ isOpen, onClose, onApplyPrompt, apiEndpoint, apiKey, apiModel }: PromptOptimizerProps) {
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: UI.welcome, timestamp: Date.now() }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setIsEntering(true);
    const t = setTimeout(() => setIsEntering(false), 420);
    setTimeout(() => inputRef.current?.focus(), 90);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const userText = input.trim();
    setInput('');
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: userText, timestamp: Date.now() }]);

    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: apiEndpoint,
          apiKey,
          type: 'chat',
          payload: {
            model: apiModel || 'gpt-3.5-turbo',
            stream: false,
            messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: userText }],
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Request failed');
      const content = data.choices?.[0]?.message?.content || '{}';
      setMessages((prev) => [...prev, { role: 'assistant', content, timestamp: Date.now() }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: JSON.stringify({ optimizedPrompt: '', chineseTranslation: '', description: `${UI.requestFailed} ${err instanceof Error ? err.message : 'unknown'}` }),
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint, apiKey, apiModel, input, isLoading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
      <div
        className={`relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[26px] border border-[rgba(255,255,255,0.25)] bg-[rgba(255,255,255,0.86)] shadow-2xl backdrop-blur-xl transition-all duration-500 dark:bg-[rgba(28,25,24,0.88)] ${isEntering ? 'translate-y-3 scale-[0.985] opacity-0' : 'translate-y-0 scale-100 opacity-100'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative border-b border-[rgba(42,36,32,0.08)] bg-gradient-to-r from-[var(--color-banana-light)]/45 via-white/95 to-[var(--color-coral-light)]/20 px-5 py-4 md:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{UI.title}</h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{UI.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setMessages([{ role: 'assistant', content: UI.cleared, timestamp: Date.now() }])} className="btn-brutal btn-brutal--secondary px-3.5 py-2 text-sm">{UI.clear}</button>
              <button onClick={onClose} className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-black/5" aria-label="close">{Icons.close}</button>
            </div>
          </div>
        </div>

        <div className="relative flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
          {messages.map((msg, i) => {
            const parsed = msg.role === 'assistant' ? parseOutput(msg.content) : null;
            const isUser = msg.role === 'user';
            return (
              <div key={msg.timestamp} className={`mb-4 flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-scale`} style={{ animationDelay: `${i * 0.05}s` }}>
                <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed md:max-w-[74%] ${isUser ? 'bg-gradient-to-br from-[var(--color-accent-highlight)] to-[#f4946c] text-white shadow-md' : 'border border-[rgba(42,36,32,0.08)] bg-white/90 text-[var(--color-text-primary)] shadow-sm dark:bg-[rgba(43,38,35,0.85)]'}`}>
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="space-y-3">
                      {parsed?.optimizedPrompt && (<div><div className="mb-1 text-xs font-semibold tracking-wide text-[var(--color-accent-highlight)]">{UI.optimized}</div><p className="whitespace-pre-wrap">{parsed.optimizedPrompt}</p></div>)}
                      {parsed?.chineseTranslation && (<div className="rounded-xl bg-[var(--color-banana-light)]/22 p-3"><div className="mb-1 text-xs font-semibold tracking-wide text-[var(--color-text-secondary)]">{UI.translation}</div><p className="whitespace-pre-wrap text-[var(--color-text-secondary)]">{parsed.chineseTranslation}</p></div>)}
                      {parsed?.description && (<div><div className="mb-1 text-xs font-semibold tracking-wide text-[var(--color-text-muted)]">{UI.description}</div><p className="text-[var(--color-text-secondary)]">{parsed.description}</p></div>)}
                      {parsed?.optimizedPrompt && (<button onClick={() => { onApplyPrompt(parsed.optimizedPrompt); onClose(); }} className="btn-brutal btn-brutal--primary px-3.5 py-2 text-xs">{UI.apply}</button>)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="mb-4 flex justify-start animate-fade-in">
              <div className="rounded-2xl border border-[rgba(42,36,32,0.08)] bg-white/90 px-4 py-3 shadow-sm dark:bg-[rgba(43,38,35,0.85)]">
                <div className="flex items-center gap-2.5 text-sm text-[var(--color-text-muted)]">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-banana-dark)]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-banana-dark)] [animation-delay:120ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-banana-dark)] [animation-delay:240ms]" />
                  {UI.loading}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-[rgba(42,36,32,0.08)] bg-white/75 px-4 py-4 backdrop-blur-md md:px-6">
          <div className="flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder={UI.inputHint}
              className="input-brutal min-h-[64px] flex-1 resize-none"
              disabled={isLoading}
            />
            <button onClick={() => void sendMessage()} disabled={!input.trim() || isLoading} className={`btn-brutal btn-brutal--primary px-4 ${!input.trim() || isLoading ? 'cursor-not-allowed opacity-55' : ''}`}>{UI.send}{Icons.send}</button>
          </div>
          <div className="mt-2 text-xs text-[var(--color-text-muted)]">{UI.helper} {apiEndpoint ? UI.ready : UI.notReady}</div>
        </div>
      </div>
    </div>
  );
}
