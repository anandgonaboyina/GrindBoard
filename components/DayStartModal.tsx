'use client';
import { useDashboardStore } from '@/store/dashboardStore';
import { Sunrise, Check, X } from 'lucide-react';
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
      className="fixed inset-0 z-[990] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) toggleDayStartModal();
      }}
    >
      <div className="relative w-full max-w-sm rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-white/10 shadow-2xl overflow-hidden shadow-blue-500/10 animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 relative z-10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sunrise className="text-blue-400 w-5 h-5" /> Good Morning!
          </h2>
          <button onClick={toggleDayStartModal} className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 relative z-10">
          <p className="text-[11px] text-white/60 mb-2 leading-relaxed">
            Record your wake-up time for today. This time is <strong className="text-white">permanent</strong> once logged. Your work-started time is now logged automatically when you first focus!
          </p>

          <div className="flex flex-col gap-3">
            <div className={`flex flex-col p-4 rounded-xl bg-blue-500/10 border transition-all duration-700 ${!todayTimes.wakeupTime ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-pulse' : 'border-blue-500/20'}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sunrise className="w-5 h-5 text-blue-400" />
                  <span className="text-base font-semibold text-blue-100">Wake Up Time</span>
                </div>
                {todayTimes.wakeupTime ? (
                  <span className="text-sm font-bold text-blue-300 bg-blue-500/20 px-2 py-1 rounded">{formatTime(todayTimes.wakeupTime)}</span>
                ) : confirming === 'wakeupTime' ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-200">Set to {formatTime(pendingTime)}?</span>
                    <button onClick={confirmAction} className="p-1 bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded"><Check className="w-5 h-5" /></button>
                    <button onClick={cancelAction} className="p-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded"><X className="w-5 h-5" /></button>
                  </div>
                ) : (
                  <button onClick={handleTimeAction} className="text-xs font-bold px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg transition-colors shadow-[0_0_10px_rgba(59,130,246,0.6)] animate-pulse">Log Now</button>
                )}
              </div>
            </div>
          </div>

          {successMsg && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] px-3 py-1.5 rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-2 whitespace-nowrap z-50">
              {successMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
