'use client';
import { useDashboardStore } from '@/store/dashboardStore';
import { Sunrise, Briefcase, Moon, Check, X, Clock, Bed } from 'lucide-react';
import { getLocalDateString } from '@/utils/date';
import { useEffect, useState } from 'react';

export default function DayStartModal() {
  const { dailyTimes, updateDailyTime, isDayStartModalOpen, toggleDayStartModal, _hasHydrated } = useDashboardStore();
  const today = getLocalDateString();
  const todayTimes = dailyTimes[today] || {};

  const [confirming, setConfirming] = useState<'wakeupTime' | 'workStartedTime' | 'bedTime' | null>(null);
  const [pendingTime, setPendingTime] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [hasPrompted, setHasPrompted] = useState(false);

  // Auto-open if missing required times for today (only once per page load)
  useEffect(() => {
    if (hasPrompted || !_hasHydrated) return;

    const isMorningMissing = !todayTimes.wakeupTime || !todayTimes.workStartedTime;
    const isAfter8PM = new Date().getHours() >= 20;
    const isBedTimeMissing = !todayTimes.bedTime;

    const needsPrompt = isMorningMissing || (isAfter8PM && isBedTimeMissing);

    if (needsPrompt) {
      if (!isDayStartModalOpen) {
        useDashboardStore.setState({ isDayStartModalOpen: true });
      }
    }
    setHasPrompted(true);
  }, [hasPrompted, _hasHydrated, todayTimes.wakeupTime, todayTimes.workStartedTime, todayTimes.bedTime, isDayStartModalOpen]);

  const handleTimeAction = (field: 'wakeupTime' | 'workStartedTime' | 'bedTime') => {
    setPendingTime(Date.now());
    setConfirming(field);
  };

  const confirmAction = () => {
    if (confirming && pendingTime) {
      updateDailyTime(today, confirming, pendingTime);

      if (confirming === 'workStartedTime' && !todayTimes.wakeupTime) {
        updateDailyTime(today, 'wakeupTime', pendingTime);
      }

      const label = confirming === 'wakeupTime' ? 'Wake Up' : confirming === 'workStartedTime' ? 'Start Work' : 'Bed Time';
      setSuccessMsg(`Successfully set ${label} to ${formatTime(pendingTime)}`);
      setTimeout(() => setSuccessMsg(null), 3000);

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

  const isMissing = !todayTimes.wakeupTime || !todayTimes.workStartedTime;
  const missingImageSrc = !todayTimes.wakeupTime ? "/cartoon_wakeup.png" : "/cartoon_work.png";
  const missingText = !todayTimes.wakeupTime ? "Log Wake Time" : "Log Work Time";

  return (
    <>
      {/* Toggle Button (Always mounted to allow seamless morphing) */}
      <div
        className={`fixed ${isMissing ? 'z-[999]' : 'z-[90]'} transition-all duration-[1500ms] ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col items-center gap-4 ${isMissing
          ? "top-[50vh] left-[50vw] -translate-x-[50%] -translate-y-[50%] scale-100 opacity-100"
          : "top-[calc(20vh+45px)] sm:top-[calc(20vh+55px)] left-[100vw] -translate-x-[100%] translate-y-0 scale-100 opacity-100"
          } ${isDayStartModalOpen ? 'opacity-0 pointer-events-none scale-90' : ''}`}
      >
        <button
          onClick={toggleDayStartModal}
          className={`relative group flex items-center justify-center transition-all duration-[1500ms] ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden ${isMissing
            ? "rounded-full shadow-[0_0_50px_rgba(249,115,22,0.8)] border-2 sm:border-4 border-orange-400 animate-[pulse_2s_ease-in-out_infinite] hover:scale-105 w-60 h-60 sm:w-60 sm:h-60 md:w-[250px] md:h-[250px] bg-black"
            : "glass-btn border-r-0 rounded-r-none rounded-l-xl sm:rounded-l-2xl shadow-xl hover:-translate-x-[4px] w-8 h-10 sm:w-10 sm:h-12 bg-black/40 backdrop-blur-md"
            }`}
          title="Daily Routine"
        >
          {/* Missing State Image */}
          <div className={`absolute inset-0 transition-all duration-[1500ms] ${isMissing ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}>
            <img
              src={missingImageSrc}
              alt="Routine Missing"
              className="w-full h-full object-cover scale-[1.05]"
            />
          </div>

          {/* Not Missing State Icon */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-[1500ms] ${!isMissing ? 'opacity-100 scale-100' : 'opacity-0 scale-150 pointer-events-none'}`}>
            <Moon className="w-4 h-4 z-5 sm:w-5 sm:h-5 text-indigo-400 drop-shadow-[0_0_5px_rgba(99,102,241,0.6)] group-hover:-rotate-12 transition-transform" />
          </div>

          {/* Tooltip for Edge Peek */}
          <div className={`absolute w-max bg-black/80 text-white rounded px-2 py-1 text-[10px] right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity pointer-events-none ${!isMissing ? 'group-hover:opacity-100' : ''}`}>
            Night Routine
          </div>
        </button>

        {/* Text Below Image (Only when missing) */}
        <button
          onClick={toggleDayStartModal}
          className={`text-white font-bold bg-black/60 px-5 py-2 rounded-full backdrop-blur-md border border-white/10 shadow-xl transition-all duration-[1500ms] whitespace-nowrap text-sm sm:text-base cursor-pointer hover:bg-black/80 hover:scale-105 ${isMissing ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none absolute'}`}
        >
          {missingText}
        </button>
      </div>

      {/* The Popup Modal */}
      {isDayStartModalOpen && (
        <div
          className="fixed inset-0 z-[990] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) toggleDayStartModal();
          }}
        >
          <div className="relative w-full max-w-sm rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-white/10 shadow-2xl overflow-hidden shadow-orange-500/10">

            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 relative z-10">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sunrise className="text-orange-400 w-5 h-5" /> Daily Routine
              </h2>
              <button onClick={toggleDayStartModal} className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col gap-4 relative z-10">
              <p className="text-[11px] text-white/60 mb-2 leading-relaxed">
                Record your daily times. Wake Up and Start Work times are <strong className="text-white">permanent</strong> once logged. Bed Time can be updated later today. We use your current exact time.
              </p>

              <div className="flex flex-col gap-3">
                {/* Wake Up Time */}
                <div className={`flex flex-col p-3 rounded-xl bg-blue-500/10 border transition-all duration-700 ${!todayTimes.wakeupTime ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-pulse' : 'border-blue-500/20'}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Sunrise className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-semibold text-blue-100">Wake Up</span>
                    </div>
                    {todayTimes.wakeupTime ? (
                      <span className="text-xs font-bold text-blue-300 bg-blue-500/20 px-2 py-1 rounded">{formatTime(todayTimes.wakeupTime)}</span>
                    ) : confirming === 'wakeupTime' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-blue-200">Set to {formatTime(pendingTime)}?</span>
                        <button onClick={confirmAction} className="p-1 bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded"><Check className="w-4 h-4" /></button>
                        <button onClick={cancelAction} className="p-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <button onClick={() => handleTimeAction('wakeupTime')} className="text-[10px] font-bold px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-white rounded-lg transition-colors shadow-[0_0_10px_rgba(59,130,246,0.6)] animate-pulse">Log Now</button>
                    )}
                  </div>
                </div>

                {/* Work Started */}
                <div className={`flex flex-col p-3 rounded-xl bg-orange-500/10 border transition-all duration-700 ${!todayTimes.workStartedTime ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)] animate-pulse' : 'border-orange-500/20'}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-orange-400" />
                      <span className="text-sm font-semibold text-orange-100">Work Started</span>
                    </div>
                    {todayTimes.workStartedTime ? (
                      <span className="text-xs font-bold text-orange-300 bg-orange-500/20 px-2 py-1 rounded">{formatTime(todayTimes.workStartedTime)}</span>
                    ) : confirming === 'workStartedTime' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-orange-200">Set to {formatTime(pendingTime)}?</span>
                        <button onClick={confirmAction} className="p-1 bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded"><Check className="w-4 h-4" /></button>
                        <button onClick={cancelAction} className="p-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <button onClick={() => handleTimeAction('workStartedTime')} className="text-[10px] font-bold px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-white rounded-lg transition-colors shadow-[0_0_10px_rgba(249,115,22,0.6)] animate-pulse">Start Work</button>
                    )}
                  </div>
                </div>

                {/* Bed Time */}
                <div className={`flex flex-col p-3 rounded-xl bg-indigo-500/10 border transition-all duration-700 ${(!todayTimes.bedTime && new Date().getHours() >= 20) ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)] animate-pulse' : 'border-indigo-500/20'}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4 text-indigo-400" />
                      <span className="text-sm font-semibold text-indigo-100">Bed Time</span>
                    </div>
                    {todayTimes.bedTime && confirming !== 'bedTime' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-300 bg-indigo-500/20 px-2 py-1 rounded">{formatTime(todayTimes.bedTime)}</span>
                        <button onClick={() => handleTimeAction('bedTime')} className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded hover:bg-indigo-500/40 transition-colors">Update</button>
                      </div>
                    ) : confirming === 'bedTime' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-indigo-200">Set to {formatTime(pendingTime)}?</span>
                        <button onClick={confirmAction} className="p-1 bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded"><Check className="w-4 h-4" /></button>
                        <button onClick={cancelAction} className="p-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <button onClick={() => handleTimeAction('bedTime')} className={`text-[10px] font-bold px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg transition-colors ${(!todayTimes.bedTime && new Date().getHours() >= 20) ? 'shadow-[0_0_10px_rgba(99,102,241,0.6)] animate-pulse' : 'shadow-lg'}`}>Sleep</button>
                    )}
                  </div>
                  {!todayTimes.bedTime && <p className="text-[9px] text-indigo-300/50 mt-1.5 pl-6">Defaults to your last active time if missed.</p>}
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
      )}
    </>
  );
}
