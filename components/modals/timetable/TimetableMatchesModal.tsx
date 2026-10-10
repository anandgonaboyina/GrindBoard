"use client";

import React, { useState } from 'react';
import { X, Copy, Check, Ban } from 'lucide-react';

interface TimetableMatchesModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  color?: string;
  subjects: string[];
  isDark: boolean;
  emptyText?: string;
  /** shows a "Copy" button on every subject (used by the Uncategorized list) */
  showCopy?: boolean;
  /** shows an action button on every subject, e.g. "Ignore" (used by a category's Matched list) */
  actionLabel?: string;
  onAction?: (subject: string) => void;
}

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
};

// z-[70]: above the modal's own content, below ConfirmationModal so confirms opened from here stay on top
export default function TimetableMatchesModal({ isOpen, onClose, title, subtitle, color, subjects, isDark, emptyText = 'Nothing here.', showCopy, actionLabel, onAction }: TimetableMatchesModalProps) {
  const [copied, setCopied] = useState<string | null>(null);
  if (!isOpen) return null;

  const handleCopy = async (sub: string) => {
    await copyText(sub);
    setCopied(sub);
    setTimeout(() => setCopied(c => (c === sub ? null : c)), 1500);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 animate-in fade-in duration-150" onClick={onClose}>
      <div
        className={`w-full max-w-md max-h-[70vh] flex flex-col rounded-2xl md:rounded-3xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 ${isDark ? 'bg-[#0f0f13] border-white/10' : 'bg-white border-black/10'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between gap-3 px-4 py-3 border-b shrink-0 ${isDark ? 'border-white/10 bg-black/20' : 'border-black/5 bg-slate-50'}`}>
          <div className="flex items-center gap-2 min-w-0">
            {color && <div className="w-3 h-3 rounded-full shadow-sm shrink-0" style={{ backgroundColor: color }} />}
            <div className="min-w-0">
              <h3 className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
              <p className={`text-[10px] md:text-xs ${isDark ? 'text-white/40' : 'text-slate-500'}`}>{subtitle ?? `${subjects.length} subject${subjects.length === 1 ? '' : 's'}`}</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-xl transition-all border active:scale-95 shrink-0 ${isDark ? 'bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20 text-rose-400' : 'bg-rose-50 border-rose-200 hover:bg-rose-100 text-rose-600'}`}>
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {subjects.length === 0 ? (
            <p className={`text-xs italic text-center py-6 opacity-60 ${isDark ? 'text-white' : 'text-slate-700'}`}>{emptyText}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {subjects.map(sub => (
                <span
                  key={sub}
                  className={`flex items-center gap-1.5 text-[10px] md:text-xs pl-2.5 pr-1.5 py-1 rounded-lg font-semibold border shadow-sm ${isDark ? 'bg-violet-500/20 border-violet-500/30 text-violet-300' : 'bg-violet-100 border-violet-200 text-violet-700'}`}
                >
                  <span>{sub}</span>
                  {showCopy && (
                    <button
                      onClick={() => handleCopy(sub)}
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider transition-all active:scale-95 ${copied === sub ? (isDark ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-emerald-100 border-emerald-300 text-emerald-700') : (isDark ? 'bg-white/5 border-white/10 text-white/70 hover:text-white' : 'bg-white border-black/10 text-slate-600 hover:text-slate-900')}`}
                    >
                      {copied === sub ? <Check size={10} strokeWidth={3} /> : <Copy size={10} />}
                      <span>{copied === sub ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                  {onAction && (
                    <button
                      onClick={() => onAction(sub)}
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider transition-all active:scale-95 ${isDark ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/30' : 'bg-amber-100 border-amber-300 text-amber-700 hover:bg-amber-200'}`}
                    >
                      <Ban size={10} />
                      <span>{actionLabel || 'Ignore'}</span>
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Asks which Plan your Day tab (section) the tasks should be added to
// ---------------------------------------------------------------------------
interface PlanTabPickerModalProps {
  isOpen: boolean;
  isDark: boolean;
  tabNames: string[];
  count: number;
  dayLabel: string;
  onPick: (groupIndex: number) => void;
  onClose: () => void;
}

export function PlanTabPickerModal({ isOpen, isDark, tabNames, count, dayLabel, onPick, onClose }: PlanTabPickerModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 animate-in fade-in duration-150" onClick={onClose}>
      <div
        className={`w-full max-w-sm flex flex-col rounded-2xl md:rounded-3xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 ${isDark ? 'bg-[#0f0f13] border-white/10' : 'bg-white border-black/10'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`px-4 py-3 border-b ${isDark ? 'border-white/10 bg-black/20' : 'border-black/5 bg-slate-50'}`}>
          <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>Add to which tab?</h3>
          <p className={`text-[10px] md:text-xs ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
            {count} task{count === 1 ? '' : 's'} → Plan your Day ({dayLabel})
          </p>
        </div>
        <div className="p-3 flex flex-col gap-2">
          {tabNames.map((name, idx) => (
            <button
              key={idx}
              onClick={() => onPick(idx)}
              className={`w-full px-3 py-2.5 rounded-xl border text-left text-xs font-bold transition-all active:scale-[0.98] ${isDark ? 'bg-white/5 border-white/10 text-white hover:bg-blue-500/20 hover:border-blue-500/40' : 'bg-slate-50 border-black/10 text-slate-800 hover:bg-blue-50 hover:border-blue-300'}`}
            >
              {name}
            </button>
          ))}
          <button onClick={onClose} className={`mt-1 w-full px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${isDark ? 'text-white/50 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-800 hover:bg-black/5'}`}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
