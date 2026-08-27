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
      <div className="w-[260px] sm:w-[280px] bg-gradient-to-br from-indigo-950/90 via-slate-900/90 to-purple-950/95 border border-indigo-500/30 shadow-[0_15px_40px_rgba(0,0,0,0.85)] backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-3 text-white pointer-events-auto select-none relative overflow-hidden">
        <div className="flex items-center gap-2 pb-1.5 mb-2 border-b border-white/10">
          <button
            onClick={() => useDashboardStore.getState().setIsMobileCountdownsVisible(false)}
            className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            title="Collapse to left edge"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="p-1 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 shrink-0">
            <Hourglass className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <span className="text-xs font-black tracking-wide bg-gradient-to-r from-cyan-300 via-indigo-200 to-pink-300 bg-clip-text text-transparent uppercase break-words flex-1">
            Target Countdowns
          </span>
        </div>

        <div className="flex flex-col items-center justify-center p-3 text-center gap-2 bg-white/5 border border-white/10 rounded-xl my-1">
          <div className="p-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h4 className="text-xs font-bold text-white">No Target Days Set</h4>
            <p className="text-[10px] text-white/60 leading-tight">
              Set exam dates, birthdays, or target goals to see days remaining!
            </p>
          </div>
          <button
            onClick={handleAddNew}
            className="mt-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-[11px] font-bold shadow-lg shadow-indigo-500/25 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Target Countdown</span>
          </button>
        </div>
      </div>
    );
  }

  const hasTime = examCountdown.endDate && examCountdown.endDate.includes('T') && examCountdown.endDate.split('T')[1] !== '';

  return (
    <div className="group w-[260px] sm:w-[280px] bg-gradient-to-br from-indigo-950/95 via-slate-900/95 to-purple-950/95 border border-indigo-500/35 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 text-white pointer-events-auto select-none relative overflow-hidden transition-all duration-300 hover:border-indigo-500/60">
      {/* Header Bar: Collapse Arrow + Hourglass + FULL Title */}
      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-white/10">
        {/* Collapse Arrow on FAR LEFT */}
        <button
          onClick={() => useDashboardStore.getState().setIsMobileCountdownsVisible(false)}
          className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          title="Collapse to left edge"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="p-1 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 shrink-0">
          <Hourglass className="w-3.5 h-3.5 animate-pulse" />
        </div>

        {/* Full Title without truncation */}
        <div className="font-black text-xs sm:text-[13px] bg-gradient-to-r from-cyan-300 via-indigo-200 to-pink-300 bg-clip-text text-transparent leading-tight break-words flex-1">
          {isEditing ? "Edit Target" : (examCountdown.title || "Set Target Title")}
        </div>
      </div>

      {showMaxError && (
        <div className="mb-2 p-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold text-center animate-in fade-in zoom-in-95">
          Maximum 5 target countdowns allowed!
        </div>
      )}

      {/* Editing State Form */}
      {isEditing ? (
        <div className="space-y-2 py-0.5">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full bg-slate-950/80 border border-indigo-500/40 rounded-xl px-2.5 py-1.5 text-white outline-none focus:border-indigo-400 text-xs font-semibold placeholder:text-white/30"
            placeholder="Set Target Title (e.g. Final Exam)"
            autoFocus
          />
          <div className="flex flex-col gap-1.5 relative">
            <div className="w-full">
              <CustomDatePicker value={editDateOnly} onChange={setEditDateOnly} placeholder="Select Target Date" />
            </div>
            <div className="w-full">
              <CustomTimePicker value={editTimeOnly} onChange={setEditTimeOnly} />
            </div>
          </div>
          <button
            onClick={handleSave}
            className="w-full py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95"
          >
            Save Target
          </button>
        </div>
      ) : (
        /* Countdown Days Display */
        <div className="flex flex-col items-center justify-center py-0.5">
          {/* Main Counter Row with Edge Navigation Arrows */}
          <div className="flex items-center justify-between gap-1.5 w-full">
            {/* Left Edge Arrow */}
            {totalCount > 1 && (
              <button
                disabled={!hasPrev}
                onClick={onPrev}
                className="p-1 sm:p-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white disabled:opacity-25 disabled:hover:bg-white/5 disabled:hover:text-white/70 transition-all shrink-0 active:scale-95"
                title="Previous Target"
              >
                <ChevronLeft size={16} />
              </button>
            )}

            {/* Compact Days Counter Block */}
            <div className="relative flex-1 bg-slate-950/70 border border-indigo-500/20 rounded-xl p-1.5 text-center flex flex-col items-center justify-center shadow-inner overflow-hidden">
              {/* Ambient Background Radial Glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-indigo-500/10 to-pink-500/10 blur-md pointer-events-none" />

              <div className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-indigo-200 to-pink-300 drop-shadow-md">
                {String(timeLeft.days).padStart(2, '0')}
              </div>
              <div className="text-[8px] font-mono uppercase tracking-widest text-cyan-300/80 font-bold mt-0.5">
                Days Remaining
              </div>
            </div>

            {/* Right Edge Arrow */}
            {totalCount > 1 && (
              <button
                disabled={!hasNext}
                onClick={onNext}
                className="p-1 sm:p-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white disabled:opacity-25 disabled:hover:bg-white/5 disabled:hover:text-white/70 transition-all shrink-0 active:scale-95"
                title="Next Target"
              >
                <ChevronRight size={16} />
              </button>
            )}
          </div>

          {/* Sub-Time Row (HH:MM:SS) if time specified or available */}
          {hasTime && (
            <div className="grid grid-cols-3 gap-1.5 w-full mt-1.5 text-center">
              <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-xl py-0.5 px-1">
                <div className="text-xs font-black text-white">{String(timeLeft.hours).padStart(2, '0')}</div>
                <div className="text-[7px] text-white/50 uppercase tracking-wider font-bold">Hours</div>
              </div>
              <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-xl py-0.5 px-1">
                <div className="text-xs font-black text-white">{String(timeLeft.mins).padStart(2, '0')}</div>
                <div className="text-[7px] text-white/50 uppercase tracking-wider font-bold">Mins</div>
              </div>
              <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-xl py-0.5 px-1">
                <div className="text-xs font-black text-cyan-400">{String(timeLeft.secs).padStart(2, '0')}</div>
                <div className="text-[7px] text-white/50 uppercase tracking-wider font-bold">Secs</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Actions Row */}
      <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between gap-1 text-[10px]">
        {totalCount > 1 && (
          <span className="text-[10px] font-mono text-cyan-300/80 font-bold px-1">
            {currentIndex + 1}/{totalCount}
          </span>
        )}

        <div className="flex items-center gap-1.5 ml-auto">
          {/* Add New Target Button */}
          <button
            onClick={handleAddNew}
            disabled={countdowns.length >= 5}
            className={`px-2 py-1 rounded-lg border transition-all flex items-center gap-1 ${
              countdowns.length >= 5
                ? 'opacity-40 cursor-not-allowed bg-white/5 border-white/10 text-white/40'
                : 'bg-indigo-500/20 hover:bg-indigo-500/40 border-indigo-500/30 text-indigo-300 hover:text-white'
            }`}
            title={countdowns.length >= 5 ? "Maximum 5 target countdowns allowed" : "Add New Target"}
          >
            <Plus size={12} />
            <span className="font-semibold text-[10px]">Add</span>
          </button>

          {/* Edit / Save Button */}
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className={`px-2 py-1 rounded-lg transition-all border flex items-center gap-1 ${
              isEditing
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/15'
            }`}
            title={isEditing ? "Save Target" : "Edit Target"}
          >
            {isEditing ? <Check size={12} className="text-emerald-400" /> : <Edit2 size={12} />}
            <span className="font-semibold text-[10px]">{isEditing ? "Save" : "Edit"}</span>
          </button>

          {/* Delete Button */}
          {!isEditing && id && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/30 border border-red-500/20 text-red-400 transition-all"
              title="Delete Target"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center pointer-events-auto p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-slate-950 border border-red-500/40 rounded-3xl p-5 z-10 w-full max-w-[280px] shadow-2xl animate-in zoom-in-95 text-center">
            <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={20} />
            </div>
            <h3 className="text-white font-bold text-sm mb-1">Delete Countdown?</h3>
            <p className="text-white/60 text-xs mb-4 leading-tight">
              Are you sure you want to delete <span className="text-white font-semibold">{examCountdown.title ? `"${examCountdown.title}"` : 'this target'}</span>?
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  if (id) deleteCountdown(id);
                }}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-red-500/30"
              >
                Delete
              </button>
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
        className="w-full bg-slate-950/80 border border-indigo-500/30 hover:border-indigo-400 rounded-xl px-3 py-1.5 text-white cursor-pointer transition-colors text-xs text-center flex items-center justify-center min-h-[36px]"
      >
        <span className={value ? "text-white font-semibold" : "text-white/40"}>{value || "Select Time (Optional)"}</span>
      </div>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center pointer-events-auto p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative bg-slate-950 border border-indigo-500/40 rounded-3xl p-5 z-10 w-full max-w-[280px] shadow-2xl animate-in zoom-in-95">
            <h3 className="text-white text-center font-bold mb-3 tracking-wide text-sm">
              Target Time <span className="text-white/40 text-[10px] font-normal">(Optional)</span>
            </h3>

            <input
              type="time"
              value={tempTime}
              onChange={e => setTempTime(e.target.value)}
              className="w-full bg-slate-900 text-white rounded-xl px-3 py-3 border border-indigo-500/30 outline-none focus:border-indigo-400 mb-4 [color-scheme:dark] text-xl text-center shadow-inner font-mono font-bold"
            />

            <div className="flex gap-2">
              <button
                onClick={() => { onChange(''); setIsOpen(false); }}
                className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded-xl text-xs font-bold transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => { onChange(tempTime); setIsOpen(false); }}
                className="flex-[2] py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-indigo-500/30"
              >
                Save Time
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}