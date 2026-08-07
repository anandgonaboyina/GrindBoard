"use client";

import { useState, useEffect } from "react";
import { useDashboardStore } from "@/store/dashboardStore";
import { Clock, Edit2, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { createPortal } from "react-dom";

import CustomDatePicker from "@/components/CustomDatePicker";

export default function Countdown({
  id,
  onPrev,
  onNext,
  hasPrev,
  hasNext
}: {
  id: string;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}) {
  const { countdowns, updateCountdown } = useDashboardStore();
  const examCountdown = countdowns.find(c => c.id === id) || { title: 'Target', endDate: null };

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [isEditing, setIsEditing] = useState(false);

  const [editTitle, setEditTitle] = useState(examCountdown.title);

  // Split into date and time for better browser compatibility
  const initialDate = examCountdown.endDate ? examCountdown.endDate.split('T')[0] : '';
  const initialTime = examCountdown.endDate && examCountdown.endDate.includes('T') ? examCountdown.endDate.split('T')[1] : '';

  const [editDateOnly, setEditDateOnly] = useState(initialDate);
  const [editTimeOnly, setEditTimeOnly] = useState(initialTime);

  useEffect(() => {
    if (!examCountdown.endDate) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      let targetTime;

      const hasTime = examCountdown.endDate && examCountdown.endDate.includes('T') && examCountdown.endDate.split('T')[1] !== '';

      if (examCountdown.endDate && !hasTime) {
        // Parse 'YYYY-MM-DD' exactly as Local Midnight to prevent UTC timezone skew bugs
        const [y, m, d] = examCountdown.endDate.split('T')[0].split('-');
        targetTime = new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0).getTime();
      } else {
        targetTime = new Date(examCountdown.endDate!).getTime();
      }

      const distance = targetTime - now;

      if (distance < 0 || isNaN(distance)) {
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
        return false; // stop interval
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((distance % (1000 * 60)) / 1000)
      });
      return true;
    };

    // Run immediately once
    const shouldContinue = calculateTimeLeft();
    if (!shouldContinue) return;

    const interval = setInterval(() => {
      const keepGoing = calculateTimeLeft();
      if (!keepGoing) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [examCountdown.endDate]);

  const handleSave = () => {
    // Combine date and time (omit time if not provided)
    const finalDateTime = editDateOnly ? (editTimeOnly ? `${editDateOnly}T${editTimeOnly}` : editDateOnly) : null;
    updateCountdown(id, editTitle, finalDateTime);
    setIsEditing(false);
  };

  const hasTime = examCountdown.endDate && examCountdown.endDate.includes('T') && examCountdown.endDate.split('T')[1] !== '';

  return (
    <div className="group bg-black/20 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-3xl p-2 sm:p-3 shadow-2xl w-[calc(100vw-32px)] max-w-[290px] sm:w-[300px] pointer-events-auto select-none">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-1 sm:gap-1.5 text-white/80 cursor-grab active:cursor-grabbing">
          {hasPrev && (
            <button onClick={onPrev} className="p-1 bg-white/10 hover:bg-white/50 rounded-full text-white/40 hover:text-white transition-colors cursor-pointer">
              <ChevronLeft size={16} />
            </button>
          )}
          <Clock size={14} className="text-blue-400 sm:w-[16px] sm:h-[16px] shrink-0" />
          <span className="font-semibold tracking-wide uppercase text-xs sm:text-[13px]  max-w-[120px] sm:max-w-[160px]">
            {isEditing ? "Edit Target" : examCountdown.title}
          </span>
        </div>
        <div>
          {hasNext && (
            <button onClick={onNext} className="p-1 bg-white/10 hover:bg-white/50 rounded-full text-white/40 hover:text-white transition-colors cursor-pointer">
              <ChevronRight size={16} />
            </button>
          )}
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className={`p-1.5 sm:p-1.5 ml-1 rounded-lg sm:rounded-xl transition-all border ${isEditing ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20 hover:border-green-500/50' : 'bg-white/5 border-white/10 hover:bg-white/15 hover:border-white/20'}`}
            title={isEditing ? "Save Target" : "Edit Target"}
          >
            {isEditing ? <Check size={18} className="text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)] sm:w-5 sm:h-5" /> : <Edit2 size={16} className="text-white/80 sm:w-[18px] sm:h-[18px]" />}
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg sm:rounded-xl px-2.5 py-1.5 text-white outline-none focus:border-white/30 text-sm"
            placeholder="Target Title"
          />
          <div className="flex flex-col sm:flex-row gap-1.5 relative items-stretch">
            <div className="flex-1 min-h-[36px] sm:min-h-0">
              <CustomDatePicker value={editDateOnly} onChange={setEditDateOnly} />
            </div>
            <div className="w-full sm:w-28 shrink-0 min-h-[40px] sm:min-h-0">
              <CustomTimePicker value={editTimeOnly} onChange={setEditTimeOnly} />
            </div>
          </div>
        </div>
      ) : hasTime ? (
        <div className="grid grid-cols-3 gap-1 text-center">
          <div className="bg-white/5 rounded-lg sm:rounded-xl py-1.5 sm:py-2 border border-white/5">
            <div className="text-xl sm:text-2xl font-bold text-white">{String(timeLeft.days).padStart(2, '0')}</div>
            <div className="text-[9px] text-white/50 uppercase tracking-widest mt-0.5">Days</div>
          </div>
          <div className="bg-white/5 rounded-lg sm:rounded-xl py-1.5 sm:py-2 border border-white/5">
            <div className="text-xl sm:text-2xl font-bold text-white">{String(timeLeft.hours).padStart(2, '0')}</div>
            <div className="text-[9px] text-white/50 uppercase tracking-widest mt-0.5">Hrs</div>
          </div>
          <div className="bg-white/5 rounded-lg sm:rounded-xl py-1.5 sm:py-2 border border-white/5">
            <div className="text-xl sm:text-2xl font-bold text-white">{String(timeLeft.mins).padStart(2, '0')}</div>
            <div className="text-[9px] text-white/50 uppercase tracking-widest mt-0.5">Min</div>
          </div>
        </div>
      ) : (
        <div className="bg-white/5 rounded-lg sm:rounded-xl py-2 sm:py-3 border border-white/5 text-center flex flex-col items-center justify-center">
          <div className="text-3xl sm:text-4xl font-bold text-white">{String(timeLeft.days).padStart(2, '0')}</div>
          <div className="text-[9px] sm:text-[10px] text-white/50 uppercase tracking-widest mt-1 sm:mt-1.5">Days Remaining</div>
        </div>
      )}
    </div>
  );
}

function CustomTimePicker({ value, onChange }: { value: string, onChange: (time: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempTime, setTempTime] = useState(value);

  // Sync tempTime when opened
  useEffect(() => {
    if (isOpen) setTempTime(value);
  }, [isOpen, value]);

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className="w-full h-full bg-black/40 border border-white/10 rounded-lg sm:rounded-xl px-3 text-white cursor-pointer hover:border-blue-500 transition-colors text-sm text-center flex items-center justify-center min-h-[40px] sm:min-h-[42px]"
      >
        <span className={value ? "text-white" : "text-white/40"}>{value || "Time"}</span>
      </div>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center pointer-events-auto p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative bg-gray-900 border border-white/20 rounded-2xl sm:rounded-3xl p-5 sm:p-6 z-10 w-full max-w-[280px] sm:w-72 animate-in zoom-in-95 shadow-2xl">
            <h3 className="text-white text-center font-medium mb-3 sm:mb-4 tracking-wide text-sm sm:text-base">Target Time <span className="text-white/30 text-[10px] sm:text-xs font-normal">(Optional)</span></h3>

            <input
              type="time"
              value={tempTime}
              onChange={e => setTempTime(e.target.value)}
              className="w-full bg-black/40 text-white rounded-lg sm:rounded-xl px-3 sm:px-4 py-3 sm:py-4 border border-white/10 outline-none focus:border-blue-500 mb-5 sm:mb-6 [color-scheme:dark] text-xl sm:text-2xl text-center shadow-inner"
            />

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => { onChange(''); setIsOpen(false); }}
                className="flex-1 py-2.5 sm:py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => { onChange(tempTime); setIsOpen(false); }}
                className="flex-[2] py-2.5 sm:py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
              >
                Save
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}