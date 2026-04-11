'use client';

import { useMemo, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';

import { useAuthFetch } from '@/app/contexts/AuthContext';
import { useToast } from '@/app/contexts/ToastContext';
import { CRONO_COPY, type CronoRole } from '@/app/content/crono';

type ChatMessage = {
  id: string;
  role: CronoRole;
  content: string;
};

function createMessage(role: CronoRole, content: string): ChatMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
  };
}

export default function CronoChatPanel() {
  const authFetch = useAuthFetch();
  const { addToast } = useToast();
  const [sessionKey, setSessionKey] = useState('default');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage('assistant', CRONO_COPY.introMessage),
  ]);

  const disabled = sending;

  const suggestions = useMemo(() => CRONO_COPY.suggestions, []);

  const sendMessage = async (text: string) => {
    const message = text.trim();
    if (!message) {
      addToast(CRONO_COPY.emptyMessageError, 'error');
      return;
    }

    setSending(true);
    setMessages((prev) => [...prev, createMessage('user', message)]);

    try {
      const response = await authFetch('/api/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({
          message,
          sessionKey,
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (body?.error === 'assistant_disabled' || body?.error === 'assistant_not_configured') {
          addToast(CRONO_COPY.unavailable, 'error');
        } else {
          addToast(CRONO_COPY.genericError, 'error');
        }
        return;
      }

      if (typeof body?.sessionKey === 'string' && body.sessionKey.length > 0) {
        setSessionKey(body.sessionKey);
      }

      if (typeof body?.reply === 'string' && body.reply.trim().length > 0) {
        setMessages((prev) => [...prev, createMessage('assistant', body.reply.trim())]);
      } else {
        addToast(CRONO_COPY.genericError, 'error');
      }
    } catch {
      addToast(CRONO_COPY.genericError, 'error');
    } finally {
      setSending(false);
      setDraft('');
    }
  };

  return (
    <section className="rounded-2xl border border-gray-800 bg-gray-950/60 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.25)] space-y-4">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-full bg-gray-900/60 border border-gray-800 flex items-center justify-center text-yellow-400">
          <MessageSquare className="w-5 h-5" />
        </span>
        <div>
          <h3 className="text-lg font-semibold text-white">{CRONO_COPY.panelTitle}</h3>
          <p className="text-sm text-slate-400">{CRONO_COPY.panelSubtitle}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-3 max-h-72 overflow-y-auto space-y-3">
        {messages.map((message) => (
          <div key={message.id} className={message.role === 'assistant' ? 'text-slate-100' : 'text-yellow-200'}>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 mb-1">
              {message.role === 'assistant' ? CRONO_COPY.panelTitle : CRONO_COPY.userLabel}
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{CRONO_COPY.suggestionLabel}</p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              disabled={disabled}
              onClick={() => sendMessage(suggestion)}
              className="rounded-full border border-gray-800 px-3 py-1 text-xs text-slate-200 hover:border-yellow-500/40 disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <form
        className="flex gap-2"
        onSubmit={async (event) => {
          event.preventDefault();
          await sendMessage(draft);
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={CRONO_COPY.inputPlaceholder}
          disabled={disabled}
          className="flex-1 rounded-lg border border-gray-800 bg-gray-900/70 px-3 py-2 text-sm text-slate-100"
        />
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-black rounded-lg bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60"
        >
          <Send className="w-4 h-4" />
          {sending ? CRONO_COPY.sendingButton : CRONO_COPY.sendButton}
        </button>
      </form>
    </section>
  );
}
