'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SHORTCUTS } from '../content/shortcuts';

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}

export default function GlobalShortcuts() {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);

  const shortcutMap = useMemo(() => {
    return new Map([
      ['d', '/'],
      ['i', '/ideas'],
      ['s', '/scripts'],
      ['t', '/thumbnails'],
      ['o', '/seo'],
      ['a', '/ai'],
      ['c', '/channels'],
      ['g', '/start'],
    ]);
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;

      if (event.key === '?' || (event.shiftKey && event.key === '/')) {
        event.preventDefault();
        setShowHelp((current) => !current);
        return;
      }

      if (!event.altKey) return;
      const key = event.key.toLowerCase();
      const href = shortcutMap.get(key);
      if (!href) return;

      event.preventDefault();
      router.push(href);
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [router, shortcutMap]);

  if (!showHelp) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4">
      <div className="w-[min(92vw,420px)] rounded-2xl border border-gray-800 bg-gray-950 p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-yellow-400/90">Atajos</div>
            <h4 className="mt-1 text-lg font-semibold text-white">Navegación rápida</h4>
          </div>
          <button
            type="button"
            onClick={() => setShowHelp(false)}
            className="text-xs text-slate-400 hover:text-yellow-300"
          >
            Cerrar
          </button>
        </div>
        <div className="mt-4 space-y-2 text-sm text-slate-300">
          {SHORTCUTS.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/40 px-3 py-2">
              <span>{item.label}</span>
              <span className="text-xs text-slate-400">{item.keys}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
