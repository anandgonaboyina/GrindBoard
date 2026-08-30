"use client";

import { useState, useEffect } from "react";
import { useDashboardStore } from "@/store/dashboardStore";
import { Clock, Edit2, Check, ChevronLeft, ChevronRight, Plus, Trash2, Hourglass, Calendar, Info, X } from "lucide-react";
import { createPortal } from "react-dom";

import CustomDatePicker from "@/components/CustomDatePicker";

export default function Countdown({
  id,
  onPrev,
  onNext,
  onAddNew,
  hasPrev,
  hasNext,
  currentIndex = 0,
  totalCount = 0
}: {
  id?: string;
  onPrev?: () => void;
  onNext?: () => void;
  onAddNew?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  currentIndex?: number;
  totalCount?: number;
}) {
  const { countdowns, updateCountdown, addCountdown, deleteCountdown } = useDashboardStore();
  const examCountdown = countdowns.find(c => c.id === id) || { title: '', endDate: null };

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [isEditing, setIsEditing] = useState(() => !examCountdown.title && !examCountdown.endDate);
  const [editTitle, setEditTitle] = useState(examCountdown.title);

  // Sync title & direct edit mode when id or values change
  useEffect(() => {
    if (!examCountdown.title && !examCountdown.endDate) {
      setIsEditing(true);
      setEditTitle('');
    } else {
      setEditTitle(examCountdown.title);
    }
  }, [examCountdown.title, examCountdown.endDate, id]);

  // Split into date and time
  const initialDate = examCountdown.endDate ? examCountdown.endDate.split('T')[0] : '';
  const initialTime = examCountdown.endDate && examCountdown.endDate.includes('T') ? examCountdown.endDate.split('T')[1] : '';

  const [editDateOnly, setEditDateOnly] = useState(initialDate);
  const [editTimeOnly, setEditTimeOnly] = useState(initialTime);

  useEffect(() => {
    setEditDateOnly(initialDate);
    setEditTimeOnly(initialTime);
  }, [initialDate, initialTime, id]);

  const [showMaxError, setShowMaxError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!examCountdown.endDate) return;

    const calculateTimeLeft = () => {
      if (!examCountdown.endDate) return false;

      const now = new Date();
      const hasTime = examCountdown.endDate.includes('T') && examCountdown.endDate.split('T')[1] !== '';

      if (!hasTime) {
        // Pure date without time: Calculate calendar days difference relative to today (00:00)
        const [y, m, d] = examCountdown.endDate.split('T')[0].split('-').map(Number);
        const targetDateObj = new Date(y, m - 1, d);
        const todayDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const diffTime = targetDateObj.getTime() - todayDateObj.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          // Past date
          setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
          return false;
        }

        // Calculate hours, mins, secs remaining to reach midnight tonight
        const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const timeUntilMidnight = midnight.getTime() - now.getTime();

        const hours = Math.max(0, Math.floor((timeUntilMidnight % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
        const mins = Math.max(0, Math.floor((timeUntilMidnight % (1000 * 60 * 60)) / (1000 * 60)));
        const secs = Math.max(0, Math.floor((timeUntilMidnight % (1000 * 60)) / 1000));

        setTimeLeft({
          days: Math.max(0, diffDays),
          hours,
          mins,
          secs
        });
        return true;
      } else {
        // Specific target date and time specified
        const targetTime = new Date(examCountdown.endDate).getTime();
        const distance = targetTime - now.getTime();

        if (distance < 0 || isNaN(distance)) {
          setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
          return false;
        }

        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          mins: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          secs: Math.floor((distance % (1000 * 60)) / 1000)
        });
        return true;
      }
    };

    const shouldContinue = calculateTimeLeft();
    if (!shouldContinue) return;

    const interval = setInterval(() => {
      const keepGoing = calculateTimeLeft();
      if (!keepGoing) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [examCountdown.endDate]);

  const handleSave = () => {
    if (!id) return;
    const finalTitle = editTitle.trim() || 'Target Goal';
    const finalDateTime = editDateOnly ? (editTimeOnly ? `${editDateOnly}T${editTimeOnly}` : editDateOnly) : null;
    updateCountdown(id, finalTitle, finalDateTime);
    setIsEditing(false);
  };

  const handleAddNew = () => {
    if (countdowns.length >= 5) {
      setShowMaxError(true);
      setTimeout(() => setShowMaxError(false), 3000);
      return;
    }
    const newId = addCountdown('', null);
    if (newId) {
      if (onAddNew) onAddNew();
      setIsEditing(true);
      setEditTitle('');
      setEditDateOnly('');
      setEditTimeOnly('');
    }
  };

  // EMPTY STATE CARD
  if (!id || totalCount === 0 || countdowns.length === 0) {
    return (
      <div className="w-[150px] sm:w-[200px] bg-slate-900/30 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-2xl p-1.5 sm:p-2 text-white pointer-events-auto select-none overflow-hidden transition-all duration-300">
        <div className="flex items-center gap-1 pb-1.5 border-b border-white/10">
          <button
            onClick={() => useDashboardStore.getState().setIsMobileCountdownsVisible(false)}
            className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <ChevronLeft size={12} />
          </button>
          <Hourglass className="w-3 h-3 text-indigo-400 animate-pulse shrink-0" />
          <span className="text-[10px] sm:text-xs font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-pink-300 uppercase truncate flex-1">
            Targets
          </span>
        </div>

        <div className="flex flex-col items-center justify-center py-3 text-center gap-1.5">
          <Calendar className="w-6 h-6 text-white/20" />
          <h4 className="text-[9px] sm:text-[10px] font-bold text-white">No Targets Set</h4>
          <button
            onClick={handleAddNew}
            className="mt-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white text-[9px] font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1"
          >
            <Plus size={10} /> Add
          </button>
        </div>
      </div>
    );
  }

  const hasTime = examCountdown.endDate && examCountdown.endDate.includes('T') && examCountdown.endDate.split('T')[1] !== '';

  return (
    <div className="group w-[150px] sm:w-[210px] bg-indigo-950/30 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-2xl p-1.5 sm:p-2 text-white pointer-events-auto select-none relative overflow-hidden transition-all duration-300 hover:border-white/20 flex flex-col gap-1">

      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-cyan-400/20 blur-[25px] pointer-events-none rounded-full" />

      {/* Header Bar */}
      <div className="flex items-center gap-1 pb-1 border-b border-white/10 relative z-10 shrink-0">
        <button
          onClick={() => useDashboardStore.getState().setIsMobileCountdownsVisible(false)}
          className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/60 transition-colors shrink-0"
        >
          <ChevronLeft size={12} />
        </button>
        <Hourglass className="w-2.5 h-2.5 text-indigo-400 animate-pulse shrink-0" />
        <div className="font-black text-[13px] sm:text-[15px] text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-pink-300 truncate flex-1 leading-tight">
          {isEditing ? "Edit Target" : (examCountdown.title || "Set Title")}
        </div>
      </div>

      {showMaxError && (
        <div className="px-1 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[8px] font-bold text-center animate-in fade-in zoom-in-95 relative z-10">
          Max 5 allowed!
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 flex flex-col justify-center min-h-[75px] sm:min-h-[85px] relative z-10">
        {isEditing ? (
          <div className="flex flex-col gap-1 w-full">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-md px-1.5 py-1 text-white outline-none focus:border-cyan-400 text-[10px] font-bold placeholder:text-white/30"
              placeholder="Target Title"
              autoFocus
            />
            <CustomDatePicker value={editDateOnly} onChange={setEditDateOnly} placeholder="Date" />
            <CustomTimePicker value={editTimeOnly} onChange={setEditTimeOnly} />
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            {/* Prev Arrow */}
            <div className="w-4 flex justify-start">
              {totalCount > 1 && (
                <button
                  disabled={!hasPrev}
                  onClick={onPrev}
                  className="p-0.5 rounded-full text-white/40 hover:text-white bg-white/60 disabled:opacity-0 transition-all"
                >
                  <ChevronLeft size={12} className="text-black" />
                </button>
              )}
            </div>

            {/* Main Countdown Display Logic */}
            <div className="flex flex-col items-center justify-center flex-1">
              {hasTime && timeLeft.days === 0 && timeLeft.hours < 12 ? (
                // LESS THAN 12 HOURS - SHOW HUGE TIME
                <>
                  <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-pink-400 tracking-tighter drop-shadow-sm font-mono leading-none">
                    {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.mins).padStart(2, '0')}
                  </span>
                  <span className="text-[7px] sm:text-[8px] uppercase font-black tracking-widest text-amber-400 animate-pulse mt-0.5">
                    Hours Left
                  </span>
                </>
              ) : timeLeft.days === 0 && !hasTime ? (
                // NO TIME SPECIFIED, DAY IS 0 -> TARGET TODAY
                <>
                  <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-emerald-300 to-teal-500 tracking-tighter drop-shadow-sm leading-none">
                    00
                  </span>
                  <span className="text-[7px] sm:text-[8px] uppercase font-black tracking-widest text-emerald-400 animate-pulse mt-0.5">
                    Target Today
                  </span>
                </>
              ) : (
                // DEFAULT SHOW HUGE DAYS (Subtext Time if applicable)
                <>
                  <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-200 tracking-tighter leading-none drop-shadow-sm">
                    {String(timeLeft.days).padStart(2, '0')}
                  </span>
                  {hasTime ? (
                    <div className="flex items-center gap-0.5 mt-0.5 bg-black/20 px-1.5 py-0.5 rounded border border-white/5 text-[8px] font-mono text-cyan-200/80">
                      <span>{String(timeLeft.hours).padStart(2, '0')}h</span>
                      <span>{String(timeLeft.mins).padStart(2, '0')}m</span>
                    </div>
                  ) : (
                    <span className="text-[7px] uppercase font-black tracking-widest text-cyan-400/80 mt-0.5">
                      Days Left
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Next Arrow */}
            <div className="w-4 flex justify-end">
              {totalCount > 1 && (
                <button
                  disabled={!hasNext}
                  onClick={onNext}
                  className="p-0.5 rounded-full text-white/40 hover:text-white bg-white/60 disabled:opacity-0 transition-all"
                >
                  <ChevronRight size={12} className="text-black" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions Row */}
      <div className="pt-1 border-t border-white/10 flex items-center justify-between relative z-10 shrink-0">
        <div className="flex items-center">
          {totalCount > 1 && !isEditing ? (
            <span className="text-[8px] font-mono text-white/40 font-bold px-1">
              {currentIndex + 1}/{totalCount}
            </span>
          ) : (
            <span className="w-1" />
          )}
        </div>

        <div className="flex items-center gap-1">
          {isEditing ? (
            // EDIT MODE: CANCEL & SAVE SIDE-BY-SIDE
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-2 py-1 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 transition-all text-[9px] font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-2 py-1 rounded border border-emerald-500/30 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition-all text-[9px] font-bold flex items-center gap-1"
              >
                <Check size={10} /> Save
              </button>
            </>
          ) : (
            // VIEW MODE: MINIMAL ICONS
            <>
              <button
                onClick={handleAddNew}
                disabled={countdowns.length >= 5}
                className="p-1 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-30 transition-all"
              >
                <Plus size={10} />
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
              >
                <Edit2 size={10} />
              </button>
              {id && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1 rounded border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                >
                  <Trash2 size={10} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal (Unchanged structurally, just styled compact) */}
      {showDeleteConfirm && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[900] flex items-center justify-center pointer-events-auto p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-slate-900/90 backdrop-blur-xl border border-red-500/30 rounded-2xl p-4 z-10 w-[220px] shadow-2xl animate-in zoom-in-95 text-center">
            <h3 className="text-white font-bold text-sm mb-1">Delete Target?</h3>
            <p className="text-white/60 text-[10px] mb-4">
              Delete <span className="text-white font-bold">{examCountdown.title || 'this target'}</span>?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-[11px] font-bold text-white transition-colors">Cancel</button>
              <button onClick={() => { setShowDeleteConfirm(false); if (id) deleteCountdown(id); }} className="flex-1 py-1.5 bg-red-500/80 hover:bg-red-500 rounded-md text-[11px] font-bold text-white transition-colors">Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function CustomTimePicker({ value, onChange }: { value: string, onChange: (time: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempTime, setTempTime] = useState(value);

  useEffect(() => {
    if (isOpen) setTempTime(value);
  }, [isOpen, value]);

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className="w-full bg-black/30 border border-white/10 hover:border-cyan-500/50 rounded-md px-1.5 py-1 text-white cursor-pointer text-[9px] text-center min-h-[24px] flex items-center justify-center transition-colors"
      >
        <span className={value ? "font-bold text-cyan-300" : "text-white/40"}>{value || "Time (Optional)"}</span>
      </div>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[900] flex items-center justify-center pointer-events-auto p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative bg-slate-900/90 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-4 z-10 w-[220px] shadow-2xl animate-in zoom-in-95">
            <h3 className="text-white text-center font-bold mb-3 text-xs">Set Time</h3>
            <input
              type="time"
              value={tempTime}
              onChange={e => setTempTime(e.target.value)}
              className="w-full bg-black/40 text-white rounded-lg px-2 py-2 border border-white/10 outline-none mb-4 text-lg text-center font-mono"
            />
            <div className="flex gap-2">
              <button onClick={() => { onChange(''); setIsOpen(false); }} className="flex-1 py-1.5 bg-red-500/20 text-red-400 rounded-md text-[11px] font-bold">Clear</button>
              <button onClick={() => { onChange(tempTime); setIsOpen(false); }} className="flex-[2] py-1.5 bg-indigo-500/80 text-white rounded-md text-[11px] font-bold">Save</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}