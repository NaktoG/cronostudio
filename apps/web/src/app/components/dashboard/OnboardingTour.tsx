'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';

interface OnboardingTourStep {
  id: string;
  title: string;
  description: string;
}

interface OnboardingTourLabels {
  quickGuide: string;
  back: string;
  close: string;
  next: string;
  finish: string;
}

interface OnboardingTourProps {
  open: boolean;
  stepIndex: number;
  steps: ReadonlyArray<OnboardingTourStep>;
  labels: OnboardingTourLabels;
  onClose: () => void;
  onNext: () => void;
  onBack: () => void;
  reduceMotion: boolean;
}

export default function OnboardingTour({
  open,
  stepIndex,
  steps,
  labels,
  onClose,
  onNext,
  onBack,
  reduceMotion,
}: OnboardingTourProps) {
  const [anchorTick, setAnchorTick] = useState(0);
  const step = steps[stepIndex];
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const anchorRect = useMemo(() => {
    if (!open || !step) return null;
    void anchorTick;
    const anchor = document.querySelector(`[data-tour="${step.id}"]`);
    return anchor ? anchor.getBoundingClientRect() : null;
  }, [open, step, anchorTick]);

  useEffect(() => {
    if (!open) return;
    const handleResize = () => setAnchorTick((prev) => prev + 1);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const focusable = dialogRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();
  }, [open, stepIndex]);

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (event.shiftKey) {
      if (active === first) {
        event.preventDefault();
        last.focus();
      }
    } else if (active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!open || !step) return null;

  const highlightStyle = anchorRect
    ? {
        top: anchorRect.top + window.scrollY - 6,
        left: anchorRect.left + window.scrollX - 6,
        width: anchorRect.width + 12,
        height: anchorRect.height + 12,
      }
    : null;

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      {highlightStyle && (
        <div
          className="absolute rounded-xl border border-yellow-400/70 shadow-[0_0_0_4px_rgba(250,204,21,0.15)]"
          style={highlightStyle}
        />
      )}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-step-title"
        className={`absolute w-[min(90vw,360px)] rounded-xl border border-gray-800 bg-gray-950/95 p-4 text-white shadow-xl ${reduceMotion ? '' : 'transition-all duration-300'}`}
        ref={dialogRef}
        onKeyDown={handleDialogKeyDown}
        style={
          anchorRect
            ? {
                top: anchorRect.bottom + window.scrollY + 12,
                left: Math.max(12, Math.min(anchorRect.left + window.scrollX, window.innerWidth - 372)),
              }
            : { top: '20%', left: '50%', transform: 'translateX(-50%)' }
        }
      >
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-300">{labels.quickGuide}</div>
        <h4 id="tour-step-title" className="mt-2 text-lg font-semibold">{step.title}</h4>
        <p className="mt-2 text-sm text-slate-300">{step.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            disabled={stepIndex === 0}
            className="text-xs text-slate-400 disabled:opacity-40"
          >
            {labels.back}
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="text-xs text-slate-400">
              {labels.close}
            </button>
            <button
              type="button"
              onClick={onNext}
              className="rounded-md bg-yellow-400 px-3 py-1 text-xs font-semibold text-black"
            >
              {stepIndex === steps.length - 1 ? labels.finish : labels.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
