'use client';
import { useDashboardStore } from '@/store/dashboardStore';
import { Sunrise, Sparkles, Moon, Coffee, Check, X, AlertTriangle, Quote as QuoteIcon, Clock } from 'lucide-react';
import { getLocalDateString } from '@/utils/date';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function DayStartModal() {
  const { 
    dailyTimes, 
    updateDailyTime, 
    isDayStartModalOpen, 
    _hasHydrated,
    customQuotes = [],
    manifestationCustomQuotes = [] 
  } = useDashboardStore();
  
  const today = getLocalDateString();
  const todayTimes = dailyTimes[today] || {};

  const [mounted, setMounted] = useState(false);
  const [confirming, setConfirming] = useState<'wakeupTime' | null>(null);
  const [pendingTime, setPendingTime] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [quote, setQuote] = useState<{ text: string; author: string } | null>(null);

  // Post-wake-up log celebration state
  const [isLoggedCelebration, setIsLoggedCelebration] = useState(false);
  const [celebrationQuote, setCelebrationQuote] = useState<{ text: string; author: string } | null>(null);
  const [celebrationTimer, setCelebrationTimer] = useState(5);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. SINGLE KEY LOCAL STORAGE & CLOUD CHECK
  useEffect(() => {
    if (!_hasHydrated) return;

    const checkAndOpenModal = () => {
      const storeState = useDashboardStore.getState();
      const currentDailyTimes = storeState.dailyTimes?.[today] || dailyTimes[today] || {};
      const hasCloudWakeup = !!currentDailyTimes.wakeupTime;

      if (typeof window !== 'undefined') {
        // A. CLEANUP: Destroy all old memory-leaking grindboard keys
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('grindboard_wakeup_logged_')) {
            localStorage.removeItem(key);
          }
        });

        // B. SINGLE KEY CHECK (`grindboard_wakeup_date`)
        const localDate = localStorage.getItem('grindboard_wakeup_date');
        
        // If the local key is from yesterday, delete it automatically!
        if (localDate && localDate !== today) {
          localStorage.removeItem('grindboard_wakeup_date');
        }

        // C. CLOUD SYNC OVERRIDE
        if (hasCloudWakeup) {
          localStorage.setItem('grindboard_wakeup_date', today);
          if (storeState.isDayStartModalOpen || isDayStartModalOpen) {
            useDashboardStore.setState({ isDayStartModalOpen: false });
          }
          return;
        }

        // D. LOCAL KEY CHECK 
        if (localStorage.getItem('grindboard_wakeup_date') === today) {
          if (storeState.isDayStartModalOpen || isDayStartModalOpen) {
            useDashboardStore.setState({ isDayStartModalOpen: false });
          }
          return;
        }

        // E. SNOOZE CHECK
        const snoozeUntil = localStorage.getItem('wakeup_snooze_until');
        if (snoozeUntil) {
          const timeRemaining = parseInt(snoozeUntil, 10) - Date.now();
          if (timeRemaining > 0) {
            useDashboardStore.setState({ isDayStartModalOpen: false });
            
            // Wake it back up exactly when snooze expires
            const timer = setTimeout(() => {
              const latestStore = useDashboardStore.getState();
              const cloudHasIt = !!latestStore.dailyTimes?.[today]?.wakeupTime;
              const localHasIt = localStorage.getItem('grindboard_wakeup_date') === today;
              
              if (!cloudHasIt && !localHasIt) {
                useDashboardStore.setState({ isDayStartModalOpen: true });
              }
              localStorage.removeItem('wakeup_snooze_until');
            }, timeRemaining);
            return () => clearTimeout(timer);
          } else {
            localStorage.removeItem('wakeup_snooze_until');
          }
        }
      }

      // Passed all checks? Cloud is empty, local key is gone, no snooze. OPEN MODAL!
      if (!storeState.isDayStartModalOpen && !isDayStartModalOpen) {
        useDashboardStore.setState({ isDayStartModalOpen: true });
      }
    };

    checkAndOpenModal();
  }, [_hasHydrated, today, dailyTimes]);

  // 2. STRICT CUSTOM QUOTES ENGINE (No Hardcoded, No APIs)
  useEffect(() => {
    if (!isDayStartModalOpen) return;

    // Combine standard custom quotes with manifestation quotes strictly from store
    const normalizedCustom = (customQuotes || []).map((q: any) => ({ text: q.text, author: q.author || 'Unknown' }));
    const normalizedManifest = (manifestationCustomQuotes || []).map((q: string) => ({ text: q, author: 'Unknown' }));
    const combinedQuotes = [...normalizedCustom, ...normalizedManifest];

    if (combinedQuotes.length > 0) {
      const randomQuote = combinedQuotes[Math.floor(Math.random() * combinedQuotes.length)];
      setQuote(randomQuote);
    } else {
      // Clean fallback if user deleted ALL quotes from settings
    }
  }, [isDayStartModalOpen, customQuotes, manifestationCustomQuotes]);

  // 5-second countdown timer for post-log victory quote celebration
  useEffect(() => {
    if (!isLoggedCelebration) return;

    const timer = setInterval(() => {
      setCelebrationTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (useDashboardStore.getState().isDayStartModalOpen) {
            useDashboardStore.setState({ isDayStartModalOpen: false });
          }
          setIsLoggedCelebration(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoggedCelebration]);

  const handleTimeAction = () => {
    setPendingTime(Date.now());
    setConfirming('wakeupTime');
  };

  const confirmAction = () => {
    if (confirming && pendingTime) {
      updateDailyTime(today, confirming, pendingTime);

      if (typeof window !== 'undefined') {
        // Set the single key for today!
        localStorage.setItem('grindboard_wakeup_date', today);
        // Clear snooze instantly
        localStorage.removeItem('wakeup_snooze_until');
        window.dispatchEvent(new Event('app_sync_now'));
      }

      // Pick a celebration quote strictly from the user's custom collection
      const normalizedCustom = (useDashboardStore.getState().customQuotes || []).map((q: any) => ({ text: q.text, author: q.author || 'Unknown' }));
      const normalizedManifest = (useDashboardStore.getState().manifestationCustomQuotes || []).map((q: string) => ({ text: q, author: 'Unknown' }));
      const combinedQuotes = [...normalizedCustom, ...normalizedManifest];

      const remainingQuotes = combinedQuotes.filter(q => q.text !== quote?.text);
      const newQuote = remainingQuotes.length > 0 
        ? remainingQuotes[Math.floor(Math.random() * remainingQuotes.length)] 
        : (quote || { text: "Wakeup Logged!", author: "" });

      setCelebrationQuote(newQuote);
      setCelebrationTimer(5);
      setIsLoggedCelebration(true);

      setConfirming(null);
      setPendingTime(null);
    }
  };

  const cancelAction = () => {
    setConfirming(null);
    setPendingTime(null);
  };

const handleSnooze = () => {
    if (typeof window !== 'undefined') {
      const snoozeDuration = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
      const twoHoursFromNow = Date.now() + snoozeDuration;
      
      // 1. Save to local storage in case they refresh or close the tab
      localStorage.setItem('wakeup_snooze_until', twoHoursFromNow.toString());
      // 2. Start the live countdown for the current active session
      setTimeout(() => {
        const latestStore = useDashboardStore.getState();
        const cloudHasIt = !!latestStore.dailyTimes?.[today]?.wakeupTime;
        const localHasIt = localStorage.getItem('grindboard_wakeup_date') === today;
        // If 2 hours passed and they STILL haven't logged it on any device, pop it back open!
        if (!cloudHasIt && !localHasIt) {
          useDashboardStore.setState({ isDayStartModalOpen: true });
        }
        localStorage.removeItem('wakeup_snooze_until');
      }, snoozeDuration);
    }
    
    // 3. Force the modal fully closed right now
    useDashboardStore.setState({ isDayStartModalOpen: false });
  };

  const formatTime = (ts?: number | null) => {
    if (!ts) return null;
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isDayStartModalOpen || !mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      style={{ zIndex: 999999 }}
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto"
      // Removed the onClick here to prevent outside clicks from closing the modal
    >
      <div className="relative w-full max-w-md flex flex-col items-center justify-center">

        {!isLoggedCelebration && quote && (
          <div className="absolute bottom-full mb-3 sm:mb-5 w-[92vw] md:w-[70vw] max-w-4xl left-1/2 -translate-x-1/2 p-4 sm:p-5 md:p-5.5 rounded-2xl bg-gradient-to-br from-slate-950/95 via-amber-950/40 to-slate-950/95 backdrop-blur-xl border border-amber-400/40 shadow-[0_0_40px_rgba(251,191,36,0.2)] flex flex-col gap-2.5 overflow-hidden animate-in slide-in-from-top-6 duration-300 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 font-bold text-[10px] sm:text-xs uppercase tracking-widest shadow-sm">
                <QuoteIcon className="w-3.5 h-3.5 text-amber-300" />
                <span>Daily Morning Inspiration</span>
              </div>
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin shrink-0" style={{ animationDuration: '4s' }} />
            </div>

            <blockquote className="text-sm sm:text-base md:text-lg font-extrabold text-white leading-relaxed tracking-wide font-serif italic drop-shadow-md text-center sm:text-left">
              "{quote ? quote.text : ""}"
            </blockquote>

            {quote?.author && (
              <div className="flex items-center justify-end gap-2 text-xs sm:text-sm font-bold text-amber-200/90 tracking-wider not-italic">
                <span className="w-8 h-[1px] bg-amber-400/50"></span>
                <span>{quote.author}</span>
              </div>
            )}
          </div>
        )}

        {isLoggedCelebration ? (
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-amber-400/50 shadow-[0_0_60px_rgba(251,191,36,0.3)] p-5 sm:p-6 flex flex-col items-center gap-4 text-center animate-in zoom-in-95 duration-300">
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-tr from-amber-500/25 via-emerald-500/20 to-sky-500/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-xs sm:text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.3)] relative z-10">
              <Check className="w-4 h-4 text-emerald-400 animate-bounce" />
              <span>Wake Up Logged at {formatTime(todayTimes.wakeupTime)}!</span>
            </div>

            <div className="relative z-10 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-950/30 to-slate-900/60 border border-amber-400/35 shadow-inner flex flex-col gap-2.5 my-1 w-full">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-amber-300/90 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300 animate-spin" /> Your Daily Victory Fuel
                </span>
                <QuoteIcon className="w-4 h-4 text-amber-300/60" />
              </div>

              <blockquote className="text-base sm:text-lg font-extrabold text-white leading-relaxed tracking-wide font-serif italic drop-shadow-md">
                "{celebrationQuote ? celebrationQuote.text : ""}"
              </blockquote>

              {celebrationQuote?.author && (
                <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-amber-200/90 not-italic">
                  <span className="w-6 h-[1px] bg-amber-400/50"></span>
                  <span>{celebrationQuote.author}</span>
                </div>
              )}
            </div>

            <div className="w-full pt-3 border-t border-white/10 flex items-center justify-between gap-3 relative z-10">
              <span className="text-xs font-bold text-amber-300/90 flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                Closing in {celebrationTimer}s...
              </span>
            </div>
          </div>
        ) : (
          <div className="relative w-full rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-white/20 shadow-[0_0_50px_rgba(56,189,248,0.2)] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-56 h-56 bg-gradient-to-tr from-amber-500/20 via-sky-500/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="p-4 border-b border-white/10 flex justify-center items-center bg-white/5 relative z-10">
              <div className="flex items-center ">
                <div className="flex flex-col">
                  <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-1.5">
                    Daily Routine Log
                  </h2>
                  <span className="text-[11px] font-medium text-sky-300/80">Track your real wake-up time</span>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex flex-col gap-4 relative z-10">
              <div className="p-3.5 bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-slate-900/60 border border-purple-400/40 rounded-xl flex flex-col gap-2 shadow-lg">
                <div className="flex items-center gap-2 text-purple-200 font-bold text-xs sm:text-sm">
                  <Moon className="w-4 h-4 text-purple-300 animate-pulse shrink-0" />
                  <span>Working past 12:00 AM (Midnight)?</span>
                </div>
                <p className="text-xs text-white/90 leading-relaxed">
                  If you are working late and <strong className="text-purple-300 font-bold underline decoration-purple-400/60">haven't slept yet tonight</strong>, please <strong className="text-red-300 font-bold">DO NOT click Log Now!</strong>
                  <br className="hidden sm:block" />
                  Simply click <strong className="text-sky-300 font-bold">Snooze (2h)</strong> below and log your time when you actually wake up tomorrow.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className={`flex flex-col p-2 rounded-xl bg-white/5 border transition-all duration-500 ${!todayTimes.wakeupTime ? 'border-sky-400/50 shadow-[0_0_20px_rgba(56,189,248,0.15)]' : 'border-white/10'}`}>

                  {todayTimes.wakeupTime ? (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center flex-col gap-1">
                        <Coffee className="w-8 h-8 text-sky-300 animate-bounce" />
                        <span className="text-xs font-bold text-white">Wake Up Time Logged</span>
                      </div>
                      <span className="text-xs font-bold text-sky-300 bg-sky-500/20 border border-sky-400/30 px-3 py-1 rounded-lg font-mono">
                        {formatTime(todayTimes.wakeupTime)}
                      </span>
                    </div>
                  ) : confirming === 'wakeupTime' ? (
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
                          <X className="w-4 h-4 text-purple-300" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center shrink-0 shadow-sm">
                          <Coffee className="w-4 h-4 text-sky-300 animate-bounce" style={{ animationDuration: '2.5s' }} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-white ">Log Wake Up Time</span>
                          <span className="text-[10px] text-white/50 ">Permanent once confirmed</span>
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={handleSnooze}
                          className="text-xs font-bold px-3 py-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all border border-white/10 active:scale-95 cursor-pointer flex items-center gap-1"
                        >
                          <Clock className="w-3.5 h-3.5" /> Snooze 2h
                        </button>
                        <button
                          onClick={handleTimeAction}
                          className="text-xs font-bold px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl transition-all shadow-[0_0_15px_rgba(56,189,248,0.5)] active:scale-95 border border-sky-400/30 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sunrise className="w-4 h-4 animate-bounce" /> Log Now
                        </button>
                      </div>
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
        )}
      </div>
    </div>,
    document.body
  );
}