'use client';
import { useDashboardStore } from '@/store/dashboardStore';
import { Sunrise, Sparkles, Moon, Coffee, Check, X, AlertTriangle } from 'lucide-react';
import { getLocalDateString } from '@/utils/date';
import { useEffect, useState } from 'react';

export default function DayStartModal() {
  const { dailyTimes, updateDailyTime, isDayStartModalOpen, toggleDayStartModal, _hasHydrated } = useDashboardStore();
  const today = getLocalDateString();
  const todayTimes = dailyTimes[today] || {};

  const [confirming, setConfirming] = useState<'wakeupTime' | null>(null);
  const [pendingTime, setPendingTime] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [hasPrompted, setHasPrompted] = useState(false);

  // Auto-open if missing wakeup time for today (only once per page load)
  useEffect(() => {
    if (hasPrompted || !_hasHydrated) return;

    if (!todayTimes.wakeupTime) {
      if (!isDayStartModalOpen) {
        useDashboardStore.setState({ isDayStartModalOpen: true });
      }
    }
    setHasPrompted(true);
  }, [hasPrompted, _hasHydrated, todayTimes.wakeupTime, isDayStartModalOpen]);

  const handleTimeAction = () => {
    setPendingTime(Date.now());
    setConfirming('wakeupTime');
  };

  const confirmAction = () => {
    if (confirming && pendingTime) {
      updateDailyTime(today, confirming, pendingTime);

      setSuccessMsg(`Successfully logged Wake Up at ${formatTime(pendingTime)}`);
      setTimeout(() => {
        setSuccessMsg(null);
        if (useDashboardStore.getState().isDayStartModalOpen) {
          useDashboardStore.getState().toggleDayStartModal();
        }
      }, 1500);

      setConfirming(null);
      setPendingTime(null);
    }
  };

  const cancelAction = () => {
    setConfirming(null);
    setPendingTime(null);
  };

  const formatTime = (ts?: number | null) => {
    if (!ts) return null;
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isDayStartModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[990] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) toggleDayStartModal();
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-white/20 shadow-[0_0_50px_rgba(56,189,248,0.2)] overflow-hidden animate-in zoom-in-95 duration-300">

        {/* Glowing ambient background circle */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-56 h-56 bg-gradient-to-tr from-amber-500/20 via-sky-500/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 relative z-10">
          <div className="flex items-center gap-3">
            {/* Big Animated Symbol */}
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 via-sky-500/15 to-purple-500/20 border border-amber-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.3)] shrink-0">
              <Sunrise className="text-amber-300 w-6 h-6 animate-bounce" style={{ animationDuration: '2.8s' }} />
              <Sparkles className="text-sky-300 w-3 h-3 absolute -top-1 -right-1 animate-spin" style={{ animationDuration: '3.5s' }} />
            </div>
            <div className="flex flex-col">
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-1.5">
                Daily Routine Log
              </h2>
              <span className="text-[11px] font-medium text-sky-300/80">Track your real wake-up time</span>
            </div>
          </div>

          {/* Highlighted Close Button */}
          <button
            onClick={toggleDayStartModal}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/40 rounded-xl font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(239,68,68,0.25)] transition-all cursor-pointer text-xs active:scale-95 shrink-0"
            title="Dismiss prompt if working past 12 AM and haven't slept yet"
          >
            <X className="w-4 h-4" /> Close
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 flex flex-col gap-4 relative z-10">

          {/* Late Night Session Notice (Highly Legible & Prominent) */}
          <div className="p-3.5 bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-slate-900/60 border border-purple-400/40 rounded-xl flex flex-col gap-2 shadow-lg">
            <div className="flex items-center gap-2 text-purple-200 font-bold text-xs sm:text-sm">
              <Moon className="w-4 h-4 text-purple-300 animate-pulse shrink-0" />
              <span>Working past 12:00 AM (Midnight)?</span>
            </div>
            <p className="text-xs text-white/90 leading-relaxed">
              If you are working late and <strong className="text-purple-300 font-bold underline decoration-purple-400/60">haven't slept yet tonight</strong>, please <strong className="text-red-300 font-bold">DO NOT click Log Now!</strong>
              <br className="hidden sm:block" />
              Simply click <strong className="text-red-300 font-bold">Close (✕)</strong> above and log your time when you actually wake up tomorrow after sleeping.
            </p>
          </div>

          {/* Log Action / Confirmation Dialog */}
          <div className="flex flex-col gap-3">
            <div className={`flex flex-col p-4 rounded-xl bg-white/5 border transition-all duration-500 ${!todayTimes.wakeupTime ? 'border-sky-400/50 shadow-[0_0_20px_rgba(56,189,248,0.15)]' : 'border-white/10'}`}>

              {todayTimes.wakeupTime ? (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Coffee className="w-5 h-5 text-sky-300 animate-bounce" />
                    <span className="text-xs font-bold text-white">Wake Up Time Logged</span>
                  </div>
                  <span className="text-xs font-bold text-sky-300 bg-sky-500/20 border border-sky-400/30 px-3 py-1 rounded-lg font-mono">
                    {formatTime(todayTimes.wakeupTime)}
                  </span>
                </div>
              ) : confirming === 'wakeupTime' ? (
                /* Prominent Confirmation Overlay Step */
                <div className="flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-bold bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl">
                    <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce" />
                    <span>Confirm logging Wake Up at {formatTime(pendingTime)}?</span>
                  </div>

                  <p className="text-[11px] text-white/70 leading-snug">
                    Confirming will permanently log <strong className="text-sky-300">{formatTime(pendingTime)}</strong> as your wake-up time for today's friend leaderboard.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2 mt-1">
                    <button
                      onClick={confirmAction}
                      className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer border border-emerald-300/30"
                    >
                      <Check className="w-4 h-4" /> Yes, Log {formatTime(pendingTime)}
                    </button>
                    <button
                      onClick={cancelAction}
                      className="py-2 px-3 bg-purple-500/20 hover:bg-purple-500/35 text-purple-200 border border-purple-400/30 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                    >
                      <X className="w-4 h-4 text-purple-300" /> I Haven't Slept Yet
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center shrink-0 shadow-sm">
                      <Coffee className="w-4 h-4 text-sky-300 animate-bounce" style={{ animationDuration: '2.5s' }} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">Log Wake Up Time</span>
                      <span className="text-[10px] text-white/50 truncate">Permanent once confirmed</span>
                    </div>
                  </div>

                  <button
                    onClick={handleTimeAction}
                    className="text-xs font-bold px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl transition-all shadow-[0_0_15px_rgba(56,189,248,0.5)] active:scale-95 border border-sky-400/30 shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sunrise className="w-4 h-4 animate-bounce" /> Log Now
                  </button>
                </div>
              )}
            </div>
          </div>

          {successMsg && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[11px] font-bold px-4 py-2 rounded-full shadow-xl animate-in fade-in slide-in-from-bottom-2 whitespace-nowrap z-50 flex items-center gap-1.5 border border-emerald-300/30">
              <Check className="w-4 h-4" /> {successMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
