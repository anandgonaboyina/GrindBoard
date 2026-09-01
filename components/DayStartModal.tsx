'use client';
import { useDashboardStore } from '@/store/dashboardStore';
import { Sunrise, Sparkles, Moon, Coffee, Check, X, AlertTriangle, Quote as QuoteIcon } from 'lucide-react';
import { getLocalDateString } from '@/utils/date';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchQuote } from '@/utils/quoteEngine';

const MORNING_HARDWORK_QUOTES = [
  { text: "Every morning brings new potential, but only if you wake up and execute.", author: "Unknown" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "Hard work beats talent when talent fails to work hard.", author: "Tim Notke" },
  { text: "Wake up with determination. Go to bed with satisfaction.", author: "George Horace Lorimer" },
  { text: "Work hard in silence, let your success be your noise.", author: "Frank Ocean" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Success isn't always about greatness. It's about consistency. Consistent hard work leads to success.", author: "Dwayne Johnson" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "There are no shortcuts to any place worth going.", author: "Beverly Sills" },
  { text: "Great things never come from comfort zones.", author: "Anonymous" },
  { text: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "Do what you have to do until you can do what you want to do.", author: "Oprah Winfrey" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson" },
  { text: "Dreams don't work unless you do.", author: "John C. Maxwell" }
];

export default function DayStartModal() {
  const { dailyTimes, updateDailyTime, isDayStartModalOpen, toggleDayStartModal, _hasHydrated } = useDashboardStore();
  const today = getLocalDateString();
  const todayTimes = dailyTimes[today] || {};

  const [mounted, setMounted] = useState(false);
  const [confirming, setConfirming] = useState<'wakeupTime' | null>(null);
  const [pendingTime, setPendingTime] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [hasPrompted, setHasPrompted] = useState(false);
  const [quote, setQuote] = useState<{ text: string; author: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Post-wake-up log celebration state (Center-occupying new quote with 5s timer)
  const [isLoggedCelebration, setIsLoggedCelebration] = useState(false);
  const [celebrationQuote, setCelebrationQuote] = useState<{ text: string; author: string } | null>(null);
  const [celebrationTimer, setCelebrationTimer] = useState(5);

  // Auto-open if missing wakeup time for today (checking DB hydration & local cache)
  useEffect(() => {
    if (!_hasHydrated) return;

    const storeState = useDashboardStore.getState();
    const currentDailyTimes = storeState.dailyTimes?.[today] || dailyTimes[today] || {};

    // Robust check for ANY logged daily time for today (wakeupTime, workStartedTime, sleepTime, etc.)
    let hasWakeupLogged = !!todayTimes?.wakeupTime ||
                          !!currentDailyTimes?.wakeupTime ||
                          !!currentDailyTimes?.workStartedTime ||
                          !!currentDailyTimes?.sleepTime ||
                          !!(currentDailyTimes as any)?.bedTime ||
                          (Object.keys(currentDailyTimes).length > 0);

    // Multi-layer fallback check: local storage key & raw local cache dump
    if (!hasWakeupLogged && typeof window !== 'undefined') {
      if (localStorage.getItem(`grindboard_wakeup_logged_${today}`) === 'true') {
        hasWakeupLogged = true;
      } else {
        try {
          const rawLocal = localStorage.getItem('dashboard-storage');
          if (rawLocal) {
            const parsed = JSON.parse(rawLocal);
            const cachedToday = parsed?.state?.dailyTimes?.[today];
            if (cachedToday && (cachedToday.wakeupTime || Object.keys(cachedToday).length > 0)) {
              hasWakeupLogged = true;
            }
          }
        } catch (e) {
          // ignore fallback parse error
        }
      }
    }

    if (hasWakeupLogged) {
      // Mark local storage anchor for fast sync
      if (typeof window !== 'undefined') {
        localStorage.setItem(`grindboard_wakeup_logged_${today}`, 'true');
      }
      // If already logged in DB or local cache, guarantee modal stays CLOSED
      if (storeState.isDayStartModalOpen || isDayStartModalOpen) {
        useDashboardStore.setState({ isDayStartModalOpen: false });
      }
    } else {
      // Only show modal if NOT logged in DB and NOT logged in local cache, and hasn't been prompted yet
      if (!hasPrompted && !storeState.isDayStartModalOpen && !isDayStartModalOpen) {
        useDashboardStore.setState({ isDayStartModalOpen: true });
        setHasPrompted(true);
      }
    }
  }, [_hasHydrated, todayTimes, dailyTimes, isDayStartModalOpen, today, hasPrompted]);

  // Load fresh inspirational/fire-burning quote online (API first with keyword filter, local fallback if offline)
  useEffect(() => {
    if (!isDayStartModalOpen) return;

    let isMounted = true;
    async function loadMorningQuote() {
      // Keywords that ensure quotes inspire hard work, focus, hope, fire, and victory
      const FIRE_MOTIVATION_KEYWORDS = [
        'work', 'discipline', 'success', 'future', 'dream', 'focus', 'start', 'today', 'great', 
        'action', 'win', 'power', 'fear', 'courage', 'strength', 'hope', 'believe', 'fight', 
        'fire', 'passion', 'create', 'achieve', 'limit', 'build', 'rise', 'hustle', 'grind', 
        'strive', 'persist', 'conquer', 'impossible', 'victory', 'goal', 'never', 'keep', 
        'forward', 'strong', 'potential', 'opportunity', 'effort', 'mind', 'determination'
      ];

      // 1. Try Quotable API (Filtered by tags: motivational, inspirational, wisdom, success)
      try {
        const res = await fetch('https://api.quotable.io/quotes/random?tags=motivational|inspirational|wisdom|success', { 
          signal: AbortSignal.timeout(3500) 
        });
        if (res.ok) {
          const data = await res.json();
          const item = Array.isArray(data) ? data[0] : data;
          if (item && item.content && item.author && isMounted) {
            const textLower = item.content.toLowerCase();
            if (FIRE_MOTIVATION_KEYWORDS.some(k => textLower.includes(k))) {
              setQuote({ text: item.content, author: item.author });
              return;
            }
          }
        }
      } catch (e) {
        // try next endpoint
      }

      // 2. Try ZenQuotes API
      try {
        const res = await fetch('https://zenquotes.io/api/random', { 
          signal: AbortSignal.timeout(3500) 
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data[0]?.q && data[0]?.a && isMounted) {
            const textLower = data[0].q.toLowerCase();
            if (FIRE_MOTIVATION_KEYWORDS.some(k => textLower.includes(k))) {
              setQuote({ text: data[0].q, author: data[0].a });
              return;
            }
          }
        }
      } catch (e) {
        // try next endpoint
      }

      // 3. Try DummyJSON API with strict keyword filter
      try {
        const res = await fetch('https://dummyjson.com/quotes/random', { 
          signal: AbortSignal.timeout(3000) 
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.quote && data.author && isMounted) {
            const textLower = data.quote.toLowerCase();
            if (FIRE_MOTIVATION_KEYWORDS.some(k => textLower.includes(k))) {
              setQuote({ text: data.quote, author: data.author });
              return;
            }
          }
        }
      } catch (e) {
        // try next endpoint
      }

      // 4. Try internal quoteEngine (user / cached quotes)
      try {
        const engineQuote = await fetchQuote();
        if (engineQuote && engineQuote.text && isMounted) {
          const textLower = engineQuote.text.toLowerCase();
          if (FIRE_MOTIVATION_KEYWORDS.some(k => textLower.includes(k))) {
            setQuote({ text: engineQuote.text, author: engineQuote.author });
            return;
          }
        }
      } catch (e) {
        // fallback to curated list
      }

      // 5. Ultimate Fallback (Guaranteed Fire & Morning Hardwork Quotes Array)
      if (isMounted) {
        const randomQuote = MORNING_HARDWORK_QUOTES[Math.floor(Math.random() * MORNING_HARDWORK_QUOTES.length)];
        setQuote(randomQuote);
      }
    }

    loadMorningQuote();
    return () => { isMounted = false; };
  }, [isDayStartModalOpen]);

  // 5-second countdown timer for post-log victory quote celebration
  useEffect(() => {
    if (!isLoggedCelebration) return;

    const timer = setInterval(() => {
      setCelebrationTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (useDashboardStore.getState().isDayStartModalOpen) {
            useDashboardStore.getState().toggleDayStartModal();
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
        localStorage.setItem(`grindboard_wakeup_logged_${today}`, 'true');
        window.dispatchEvent(new Event('app_sync_now'));
      }

      // Select a fresh, distinct victory/fire quote for celebration view
      const remainingQuotes = MORNING_HARDWORK_QUOTES.filter(q => q.text !== quote?.text);
      const newQuote = remainingQuotes[Math.floor(Math.random() * remainingQuotes.length)] || MORNING_HARDWORK_QUOTES[0];

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

  const formatTime = (ts?: number | null) => {
    if (!ts) return null;
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isDayStartModalOpen || !mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      style={{ zIndex: 999999 }}
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) toggleDayStartModal();
      }}
    >
      {/* Relative wrapper centering the modal on screen */}
      <div className="relative w-full max-w-md flex flex-col items-center justify-center">

        {/* Inspirational Daily Quote Card (Floating Directly Above Centered Modal - Hidden after log confirmation) */}
        {!isLoggedCelebration && (
          <div className="absolute bottom-full mb-3 sm:mb-5 w-[92vw] md:w-[70vw] max-w-4xl left-1/2 -translate-x-1/2 p-4 sm:p-5 md:p-5.5 rounded-2xl bg-gradient-to-br from-slate-950/95 via-amber-950/40 to-slate-950/95 backdrop-blur-xl border border-amber-400/40 shadow-[0_0_40px_rgba(251,191,36,0.2)] flex flex-col gap-2.5 overflow-hidden animate-in slide-in-from-top-6 duration-300 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 font-bold text-[10px] sm:text-xs uppercase tracking-widest shadow-sm">
                <QuoteIcon className="w-3.5 h-3.5 text-amber-300" />
                <span>Daily Morning Inspiration</span>
              </div>
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin shrink-0" style={{ animationDuration: '4s' }} />
            </div>

            <blockquote className="text-sm sm:text-base md:text-lg font-extrabold text-white leading-relaxed tracking-wide font-serif italic drop-shadow-md text-center sm:text-left">
              "{quote ? quote.text : "Every morning brings new potential, but only if you wake up and create it."}"
            </blockquote>

            <div className="flex items-center justify-end gap-2 text-xs sm:text-sm font-bold text-amber-200/90 tracking-wider not-italic">
              <span className="w-8 h-[1px] bg-amber-400/50"></span>
              <span>{quote ? quote.author : "Unknown"}</span>
            </div>
          </div>
        )}

        {/* Main Day Start Modal Box - Perfectly Centered */}
        {isLoggedCelebration ? (
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-amber-400/50 shadow-[0_0_60px_rgba(251,191,36,0.3)] p-5 sm:p-6 flex flex-col items-center gap-4 text-center animate-in zoom-in-95 duration-300">
            {/* Glowing ambient background circle */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-tr from-amber-500/25 via-emerald-500/20 to-sky-500/20 rounded-full blur-3xl pointer-events-none"></div>

            {/* Victory Badge */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-xs sm:text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.3)] relative z-10">
              <Check className="w-4 h-4 text-emerald-400 animate-bounce" />
              <span>Wake Up Logged at {formatTime(todayTimes.wakeupTime)}!</span>
            </div>

            {/* New Quote Occupying Center Stage */}
            <div className="relative z-10 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-950/30 to-slate-900/60 border border-amber-400/35 shadow-inner flex flex-col gap-2.5 my-1 w-full">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-amber-300/90 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300 animate-spin" /> Your Daily Victory Fuel
                </span>
                <QuoteIcon className="w-4 h-4 text-amber-300/60" />
              </div>

              <blockquote className="text-base sm:text-lg font-extrabold text-white leading-relaxed tracking-wide font-serif italic drop-shadow-md">
                "{celebrationQuote ? celebrationQuote.text : "Discipline is choosing between what you want now and what you want most."}"
              </blockquote>

              <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-amber-200/90 not-italic">
                <span className="w-6 h-[1px] bg-amber-400/50"></span>
                <span>{celebrationQuote ? celebrationQuote.author : "Abraham Lincoln"}</span>
              </div>
            </div>

            {/* Timer Banner & Prominent Close Button */}
            <div className="w-full pt-3 border-t border-white/10 flex items-center justify-between gap-3 relative z-10">
              <span className="text-xs font-bold text-amber-300/90 flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                Closing in {celebrationTimer}s...
              </span>

              <button
                onClick={() => {
                  setIsLoggedCelebration(false);
                  toggleDayStartModal();
                }}
                className="px-4 py-2 bg-gradient-to-r from-red-500/30 to-amber-500/30 hover:bg-red-500/50 text-white font-bold text-xs rounded-xl border border-amber-400/40 shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <X className="w-4 h-4 text-red-300" /> Close Now
              </button>
            </div>
          </div>
        ) : (
          <div className="relative w-full rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-white/20 shadow-[0_0_50px_rgba(56,189,248,0.2)] overflow-hidden animate-in zoom-in-95 duration-300">

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
        )}
      </div>
    </div>,
    document.body
  );
}
