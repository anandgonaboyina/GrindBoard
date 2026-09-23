"use client";

import { useState, useEffect } from "react";
import { useDashboardStore } from "@/store/dashboardStore";
import { Edit2, Check, ChevronLeft, ChevronRight, Plus, Trash2, Hourglass, Calendar } from "lucide-react";
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
  const { countdowns, updateCountdown, addCountdown, deleteCountdown, setIsMobileCountdownsVisible } = useDashboardStore();
  const examCountdown = countdowns.find(c => c.id === id) || { title: '', endDate: null };

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0 });
  const [status, setStatus] = useState<'calculating' | 'active' | 'reached' | 'expired'>('calculating');
  const [isEditing, setIsEditing] = useState(() => !examCountdown.title && !examCountdown.endDate);
  
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');

  const [showMaxError, setShowMaxError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);


  // Initialize edit fields with smart defaults (Today + Current Time)
  useEffect(() => {
    if (isEditing) {
      setEditTitle(examCountdown.title || '');
      if (examCountdown.endDate) {
        const parts = examCountdown.endDate.split('T');
        setEditDate(parts[0] || '');
        setEditTime(parts[1] || '23:59');
      } else {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const hr = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        setEditDate(`${y}-${m}-${d}`);
        setEditTime(`${hr}:${min}`);
      }
    }
  }, [isEditing, examCountdown.title, examCountdown.endDate, id]);

  // Unified calculation & auto-delete logic
  useEffect(() => {
    if (!examCountdown.endDate) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      let targetTime = 0;
      
      if (examCountdown.endDate && examCountdown.endDate.includes('T')) {
        targetTime = new Date(examCountdown.endDate).getTime();
      } else if (examCountdown.endDate) {
        // Fallback for dates without time
        targetTime = new Date(`${examCountdown.endDate}T23:59:59`).getTime();
      }

      const distance = targetTime - now;

      // Safe-guard against NaN Date generation
      if (isNaN(distance)) {
        setStatus('expired');
        return false;
      }

      // Auto-Delete if older than 1 day (86400000 ms)
      if (distance < -86400000) {
        setStatus('expired');
        return false;
      }
      
      // Reached Target (Today/Time hit)
      if (distance <= 0) {
        setStatus('reached');
        return false;
      }

      setStatus('active');
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      });
      return true;
    };

    const shouldContinue = calculateTimeLeft();
    if (!shouldContinue) return;

    const interval = setInterval(() => {
      const keepGoing = calculateTimeLeft();
      if (!keepGoing) clearInterval(interval);
    }, 1000 * 60); // Update every minute since seconds are removed

    return () => clearInterval(interval);
  }, [examCountdown.endDate]);

  // Execute Auto-Delete safely outside render cycle
  useEffect(() => {
    if (status === 'expired' && id) {
      const timer = setTimeout(() => deleteCountdown(id), 500);
      return () => clearTimeout(timer);
    }
  }, [status, id, deleteCountdown]);

  const handleSave = () => {
    if (!id) return;
    const finalTitle = editTitle.trim() || 'Target Goal';
    
    let finalDateStr = editDate;
    if (!finalDateStr) {
      const now = new Date();
      finalDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
    
    // -------------------------------------------------------------
    // NaN PROTECTION ENGINE: Guarantees a perfectly valid Time format!
    // -------------------------------------------------------------
    let rawTime = editTime || '23:59';
    if (!rawTime.includes(':')) {
      rawTime = rawTime.padEnd(4, '0');
      rawTime = rawTime.slice(0, 2) + ':' + rawTime.slice(2, 4);
    }
    let [hh, mm] = rawTime.split(':');
    
    // Clamp Hours (00-23)
    let hNum = parseInt(hh, 10);
    if (isNaN(hNum)) hNum = 23;
    if (hNum > 23) hNum = 23;
    
    // Clamp Minutes (00-59)
    let mNum = parseInt(mm, 10);
    if (isNaN(mNum)) mNum = 59;
    if (mNum > 59) mNum = 59;

    const finalTimeStr = `${String(hNum).padStart(2, '0')}:${String(mNum).padStart(2, '0')}`;
    const finalDateTime = `${finalDateStr}T${finalTimeStr}`;

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
    }
  };

  // --- Render Empty State ---
  if (!id || totalCount === 0 || countdowns.length === 0 || status === 'expired') {
    return (
      <div className="w-[160px] sm:w-[220px] bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl p-2 text-white pointer-events-auto select-none overflow-hidden transition-all duration-300">
        <div className="flex items-center gap-1.5 pb-2 border-b border-white/10">
          <button onClick={() => setIsMobileCountdownsVisible(false)} className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            <ChevronLeft size={12} />
          </button>
          <Hourglass className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-[11px] font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-indigo-300 uppercase">Targets</span>
        </div>
        <div className="flex flex-col items-center justify-center py-4 text-center gap-2">
          <Calendar className="w-6 h-6 text-white/20" />
          <h4 className="text-[10px] font-bold text-white/80">Countdown The Aim</h4>
          <button onClick={handleAddNew} className="mt-1 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1">
            <Plus size={12} /> Create Task
          </button>
        </div>
      </div>
    );
  }

  // --- Render Main Component ---
  return (
    <div className="group w-[160px] sm:w-[220px] bg-indigo-950/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl p-1 text-white pointer-events-auto select-none relative overflow-hidden transition-all duration-300 flex flex-col gap-2">
      
      {/* Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-cyan-500/20 blur-[30px] pointer-events-none rounded-full" />

      {/* Top Bar */}
      <div className="flex items-center justify-between pb-1.5 border-b border-white/10 relative z-10 shrink-0">
        <div className="flex items-center gap-1 overflow-hidden">
          <button 
            onClick={() => {
              if (isEditing && examCountdown.title) setIsEditing(false);
              else setIsMobileCountdownsVisible(false);
            }} 
            className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/20 transition-colors shrink-0"
          >
            <ChevronLeft size={14} />
          </button>
          <div className="font-black text-[12px] sm:text-[14px] text-white truncate leading-tight pl-0.5">
            {isEditing ? "Configure Target" : (examCountdown.title || "Untitled Target")}
          </div>
        </div>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="p-1 shrink-0 rounded bg-white/5 hover:bg-white/20 border border-white/10 text-white/80 hover:text-white transition-colors">
            <Edit2 size={10} />
          </button>
        )}
      </div>

      {showMaxError && (
        <div className="px-2 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-bold text-center animate-in zoom-in-95 relative z-10">
          Max 5 targets allowed!
        </div>
      )}

      {/* Main Body */}
      <div className="flex flex-col justify-center min-h-[60px] relative z-10">
        {isEditing ? (
          /* COMPACT EDIT MODE UI */
          <div className="flex flex-col gap-1 w-full">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-md px-1.5 py-1 text-white outline-none focus:border-cyan-400 text-[11px] font-bold placeholder:text-white/30 mb-1"
              placeholder="Countdown the Aim..."
              autoFocus
            />
            
            {/* Evenly Placed Date and Time Grid */}
            <div className="grid grid-rows-2 gap-1.5 mt-0.5">
              <CustomDatePicker 
                value={editDate} 
                onChange={(val) => setEditDate(val)} 
                placeholder="Date" 
              />
              
              <CustomTimePicker 
                value={editTime} 
                onChange={(val) => setEditTime(val)} 
              />
            </div>

            <div className="flex items-center justify-between gap-2 mt-1">
              <button onClick={() => setShowDeleteConfirm(true)} className="p-1 rounded border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors">
                <Trash2 size={12} />
              </button>
              <div className="flex gap-1">
                <button onClick={() => {
                  if (!examCountdown.title) deleteCountdown(id!);
                  else setIsEditing(false);
                }} className="px-2 py-0.5 rounded border border-white/10 bg-white/5 hover:bg-white/15 text-white/80 transition-all text-[10px] font-bold">
                  Cancel
                </button>
                <button onClick={handleSave} className="px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 transition-all text-[10px] font-bold flex items-center gap-1">
                  <Check size={10} /> Save
                </button>
              </div>
            </div>
          </div>
        ) : status === 'reached' ? (
          /* GREETING MODE UI */
          <div className="flex flex-col items-center justify-center gap-0.5 animate-in zoom-in py-1">
            <span className="text-2xl mb-1">🎉</span>
            <span className="text-sm font-black text-emerald-400 uppercase tracking-widest text-center leading-tight">Target Reached!</span>
            <span className="text-[10px] font-bold text-emerald-300/80 uppercase truncate w-full text-center px-1">
              {examCountdown.title || "It's Time!"}
            </span>
          </div>
        ) : (
          /* EXCLUSIVE DISPLAY MODE UI */
          <div className="flex flex-col items-center justify-center w-full py-0.5">
            {timeLeft.days > 0 ? (
              // > 24 Hours: Show Huge Days, Smaller Hours
              <div className="flex items-baseline gap-1.5 justify-center">
                <span className="text-4xl sm:text-5xl font-black text-white leading-none tracking-tighter">{String(timeLeft.days).padStart(2, '0')}</span>
                <span className="text-[10px] font-bold text-white/50 tracking-widest">DAYS</span>
                <span className="text-xl sm:text-2xl font-black text-cyan-300 leading-none ml-1">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-[10px] font-bold text-cyan-300/50 tracking-widest">HRS</span>
              </div>
            ) : (
              // < 24 Hours: Show Huge Hours and Mins exclusively
              <div className="flex items-baseline gap-2 justify-center">
                <span className="text-4xl sm:text-5xl font-black text-cyan-300 leading-none tracking-tighter">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-[10px] font-bold text-cyan-300/50 tracking-widest">HRS</span>
                <span className="text-4xl sm:text-5xl font-black text-pink-300 leading-none tracking-tighter">{String(timeLeft.mins).padStart(2, '0')}</span>
                <span className="text-[10px] font-bold text-pink-300/50 tracking-widest">MINS</span>
              </div>
            )}
            <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest mt-1.5 text-white/40">Left</div>
          </div>
        )}
      </div>

      {/* Bottom Bar: Pagination and Add */}
      {!isEditing && (
        <div className="pt-1 mt-1 border-t border-white/10 flex items-center justify-between relative z-10 shrink-0">
          
          {/* Enhanced Visibility Arrows */}
          <div className="flex items-center gap-1 bg-black/40 rounded-full px-1 border border-white/10">
            <button 
              disabled={!hasPrev} 
              onClick={() => { setIsEditing(false); onPrev?.(); }} 
              className="text-white hover:text-cyan-300 bg-white/10 hover:bg-white/20 p-1 rounded-full disabled:opacity-20 disabled:hover:text-white transition-all shadow-sm border border-white/5"
            >
              <ChevronLeft size={14} />
            </button>
            
            <span className="text-[7px] sm:text-[10px] font-mono font-black text-white">
              {currentIndex + 1} <span className="text-white/40">/ {totalCount}</span>
            </span>
            
            <button 
              disabled={!hasNext} 
              onClick={() => { setIsEditing(false); onNext?.(); }} 
              className="text-white hover:text-cyan-300 bg-white/10 hover:bg-white/20 p-1 rounded-full disabled:opacity-20 disabled:hover:text-white transition-all shadow-sm border border-white/5"
            >
              <ChevronRight size={14} />
            </button>
          </div>
          
          <button 
            onClick={handleAddNew} 
            disabled={countdowns.length >= 5} 
            className="flex items-center gap-1 bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-500/30 px-1 py-0.5 rounded-full transition-colors disabled:opacity-30"
          >
            <Plus size={12} className="text-cyan-400" />
            <span className="text-[10px] font-bold text-cyan-300">New</span>
          </button>
        </div>
      )}

      {/* Delete Confirmation Portal */}
      {showDeleteConfirm && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[900] flex items-center justify-center pointer-events-auto p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-slate-900/90 backdrop-blur-xl border border-red-500/40 rounded-2xl p-4 z-10 w-[240px] shadow-2xl animate-in zoom-in-95 text-center">
            <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 className="text-red-400 w-5 h-5" />
            </div>
            <h3 className="text-white font-black text-sm mb-1">Delete Target?</h3>
            <p className="text-white/60 text-[11px] mb-4">
              Permanently delete <strong className="text-white">"{examCountdown.title || 'this target'}"</strong>?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-[11px] font-bold text-white transition-colors">Cancel</button>
              <button onClick={() => { setShowDeleteConfirm(false); setIsEditing(false); if (id) deleteCountdown(id); }} className="flex-1 py-1.5 bg-red-500 hover:bg-red-600 rounded-md text-[11px] font-bold text-white transition-colors">Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// Simple Text Input Time Picker - Lively Wallpaper Compatible
function CustomTimePicker({ value, onChange }: { value: string, onChange: (time: string) => void }) {
  return (
    <div className="w-full relative">

      <input
        type="text"
        value={value}
        onChange={(e) => {
          let val = e.target.value.replace(/[^0-9:]/g, ''); // Only allow numbers and colon
          
          // Auto-insert colon if user types 2 digits
          if (val.length === 2 && !val.includes(':') && e.target.value.length === 2) {
            val += ':';
          }
          if (val.length > 5) val = val.slice(0, 5); // Max length HH:MM
          
          onChange(val);
        }}
        placeholder="HH:MM"
        maxLength={5}
        className="w-full bg-black/40 border border-white/20 hover:border-pink-400/50 focus:border-pink-400 rounded-md px-1 py-1.5 text-[15px] font-bold text-pink-300 outline-none text-center transition-colors shadow-inner"
      />
    </div>
  );
}