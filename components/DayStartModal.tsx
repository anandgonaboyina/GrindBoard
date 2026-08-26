'use client';
import { useDashboardStore } from '@/store/dashboardStore';
import { Sunrise, Sparkles, Moon, Coffee, Check, X } from 'lucide-react';
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
      className="fixed inset-0 z-[990] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) toggleDayStartModal();
      }}
    >
      <div className="relative w-full max-w-sm rounded-2xl bg-black/60 backdrop-blur-xl border border-white/20 shadow-[0_0_35px_rgba(56,189,248,0.15)] overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Glow ambient background circles */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-44 h-44 bg-gradient-to-tr from-sky-500/20 via-blue-500/15 to-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 relative z-10">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center">
              <Sunrise className="text-amber-400 w-5 h-5 animate-bounce" style={{ animationDuration: '3s' }} />
              <Sparkles className="text-sky-300 w-2.5 h-2.5 absolute -top-1 -right-1 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Good Morning! <span className="text-[11px] font-normal text-white/50">Log Wake Time</span>
            </h2>
          </div>
          <button 
            onClick={toggleDayStartModal} 
            className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
            title="Close / Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 flex flex-col gap-3.5 relative z-10">
          
          {/* Late Night Session Helper Card */}
          <div className="p-3 bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900/40 border border-purple-400/30 rounded-xl flex flex-col gap-1.5 shadow-inner">
            <div className="flex items-center gap-1.5 text-purple-300 font-bold text-[11px]">
              <Moon className="w-3.5 h-3.5 text-purple-300 animate-pulse shrink-0" />
              <span>Working past 12:00 AM (Midnight)?</span>
            </div>
            <p className="text-[10px] text-white/75 leading-relaxed">
              If you haven't slept yet tonight, <strong className="text-purple-200">do not log now!</strong> Simply close (<strong className="text-white">✕</strong>) this prompt and click <strong>Log Now</strong> when you actually wake up after your sleep cycle.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className={`flex flex-col p-3.5 rounded-xl bg-white/5 border transition-all duration-500 ${!todayTimes.wakeupTime ? 'border-sky-400/50 shadow-[0_0_20px_rgba(56,189,248,0.2)]' : 'border-white/10'}`}>
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-400/30 flex items-center justify-center shrink-0 shadow-sm">
                    <Coffee className="w-4 h-4 text-sky-300 animate-bounce" style={{ animationDuration: '2.5s' }} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate">Wake Up Time</span>
                    <span className="text-[9px] text-white/50 truncate">Permanent once logged</span>
                  </div>
                </div>

                {todayTimes.wakeupTime ? (
                  <span className="text-xs font-bold text-sky-300 bg-sky-500/20 border border-sky-400/30 px-2.5 py-1 rounded-lg font-mono shrink-0">
                    {formatTime(todayTimes.wakeupTime)}
                  </span>
                ) : confirming === 'wakeupTime' ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-semibold text-sky-200">Confirm {formatTime(pendingTime)}?</span>
                    <button onClick={confirmAction} className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 rounded-lg border border-emerald-500/30 transition-all active:scale-95" title="Confirm Wake Time"><Check className="w-4 h-4" /></button>
                    <button onClick={cancelAction} className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg border border-red-500/30 transition-all active:scale-95" title="Cancel"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button 
                    onClick={handleTimeAction} 
                    className="text-[11px] font-bold px-3.5 py-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl transition-all shadow-[0_0_15px_rgba(56,189,248,0.5)] active:scale-95 border border-sky-400/30 shrink-0 flex items-center gap-1"
                  >
                    <Sunrise className="w-3.5 h-3.5 animate-bounce" /> Log Now
                  </button>
                )}
              </div>
            </div>
          </div>

          {successMsg && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-bold px-3.5 py-1.5 rounded-full shadow-xl animate-in fade-in slide-in-from-bottom-2 whitespace-nowrap z-50 flex items-center gap-1.5 border border-emerald-300/30">
              <Check className="w-3.5 h-3.5" /> {successMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
