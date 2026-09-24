'use client';
import { useDashboardStore } from '@/store/dashboardStore';
import { AlertTriangle, BatteryWarning, Wind, X, Trophy, Info } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

export default function BurnoutRadar() {
  const { history, theme } = useDashboardStore();
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
  const [isDismissed, setIsDismissed] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  // burnout threshold here (480 mins = 8 hours)
  const BURNOUT_THRESHOLD_MINS = 480; 

  useEffect(() => {
    if (theme === 'auto') {
      const hour = new Date().getHours();
      setResolvedTheme(hour >= 6 && hour < 18 ? 'light' : 'dark');
    } else {
      setResolvedTheme(theme as 'light' | 'dark');
    }
  }, [theme]);

  const isLight = resolvedTheme === 'light';

  // --- Calculations: 7-Day Rolling Average ---
  const stats = useMemo(() => {
    const today = new Date();
    let last7DaysTotal = 0;

    const getLocalStr = (d: Date) => {
      const offset = d.getTimezoneOffset();
      return new Date(d.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
    };

    // Calculate ONLY the last 7 days (Today + previous 6 days)
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const mins = (history && history[getLocalStr(checkDate)] as number) || 0;
      last7DaysTotal += mins;
    }

    const dailyAvg = Math.round(last7DaysTotal / 7);
    const isAtRisk = dailyAvg >= BURNOUT_THRESHOLD_MINS;

    return { dailyAvg, isAtRisk };
  }, [history, BURNOUT_THRESHOLD_MINS]);

  // --- Dual Cooldown Logic ---
  const handleDismiss = (actionType: 'ignore' | 'rest') => {
    setIsDismissed(true);
    setShowPopup(false);
    
    if (typeof window !== 'undefined') {
      // If ignored / snoozed -> 10 hours. If rested -> 3 days.
      const cooldownMs = actionType === 'rest' 
        ? 3 * 24 * 60 * 60 * 1000  // 3 days
        : 10 * 60 * 60 * 1000;     // 10 hours
        
      localStorage.setItem('burnout_dismissed_until', (Date.now() + cooldownMs).toString());
    }
  };

  // Trigger popup with delay, ONLY if not in cooldown period
  useEffect(() => {
    if (stats.isAtRisk && !isDismissed) {
      if (typeof window !== 'undefined') {
        const dismissedUntil = localStorage.getItem('burnout_dismissed_until');
        if (dismissedUntil) {
          const parsedTimestamp = parseInt(dismissedUntil, 10);
          if (!isNaN(parsedTimestamp) && Date.now() < parsedTimestamp) {
            return;
          }
        }
      }

      const timer = setTimeout(() => setShowPopup(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [stats.isAtRisk, isDismissed]);

  const formatMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  if (isDismissed || !showPopup) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-500 overflow-hidden"
    >
      
      {/* Custom CSS for Falling Animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fall {
          0% { transform: translateY(-10vh) rotate(0deg) scale(0.8); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateY(110vh) rotate(360deg) scale(1.2); opacity: 0; }
        }
        .falling-flower {
          position: absolute;
          animation: fall linear infinite;
          z-index: 0;
          pointer-events: none;
          user-select: none;
        }
      `}} />

      {/* Falling Flowers Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="falling-flower text-3xl left-[10%]" style={{ animationDuration: '8s', animationDelay: '0s' }}>🌸</div>
        <div className="falling-flower text-2xl left-[25%]" style={{ animationDuration: '12s', animationDelay: '2s' }}>💮</div>
        <div className="falling-flower text-4xl left-[45%]" style={{ animationDuration: '10s', animationDelay: '1s' }}>🌺</div>
        <div className="falling-flower text-2xl left-[65%]" style={{ animationDuration: '14s', animationDelay: '3s' }}>🌻</div>
        <div className="falling-flower text-3xl left-[85%]" style={{ animationDuration: '9s', animationDelay: '0.5s' }}>🌼</div>
        <div className="falling-flower text-xl left-[15%]" style={{ animationDuration: '11s', animationDelay: '4s' }}>🍃</div>
        <div className="falling-flower text-2xl left-[80%]" style={{ animationDuration: '13s', animationDelay: '1.5s' }}>🌸</div>
        <div className="falling-flower text-xl left-[50%]" style={{ animationDuration: '15s', animationDelay: '4.5s' }}>🍃</div>
      </div>

      {/* Modal Box - Converted to Row Layout on Desktop */}
      <div className={`w-full max-w-sm md:max-w-3xl relative flex flex-col md:flex-row gap-5 md:gap-8 p-5 md:p-8 rounded-[2rem] border shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 z-10 ${
        isLight 
          ? 'bg-white border-slate-200' 
          : 'bg-slate-900 border-white/10'
      }`}>
        
        {/* Close Button */}
        <button 
          onClick={() => handleDismiss('ignore')} 
          className={`absolute top-2 right-1 md:top-2 md:right-2 p-1 rounded-full transition-colors z-20 ${
            isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-white/10 text-slate-400'
          }`}
        > 
          <X className={`w-7 h-7 p-1 rounded-full ${isLight ? 'bg-slate-200' : 'bg-white/20 text-white'}`} />
        </button>

        {/* LEFT COLUMN: Context & Text */}
        <div className="flex-1 flex flex-col md:pr-4">
          <div className="flex items-center gap-4 mb-4 mt-2 md:mt-0">
            <div className={`p-3 rounded-2xl border bg-white animate-pulse shadow-sm shrink-0`}>
              <Trophy size={28} className="text-amber-500" />
            </div>
            <h3 className={`text-base md:text-lg font-black uppercase tracking-widest leading-tight ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Grindboard <br/> <span className={isLight ? 'text-amber-600' : 'text-amber-500'}>Energy Check</span>
            </h3>
          </div>

          <div className={`text-sm md:text-base font-medium leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            You have been pushing relentlessly, averaging <strong className={isLight ? 'text-amber-600' : 'text-amber-400'}>{formatMins(stats.dailyAvg)} per day</strong> over the last 7 days. 
            <br/><br/>
            If you don't step back and restore your energy now, you will burn out and ruin your focus for the days ahead. Protect your long-term momentum by resting today.
          </div>
        </div>

        {/* RIGHT COLUMN: Actions & Info */}
        <div className={`flex-1 flex flex-col justify-center pt-4 md:pt-0 border-t md:border-t-0 md:border-l ${isLight ? 'border-slate-200 md:pl-8' : 'border-white/10 md:pl-8'}`}>
          
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border mb-3 ${isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
            <span className="text-xl leading-none shrink-0">🌿</span>
            <span className={`text-xs md:text-sm font-black uppercase tracking-widest ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>Required: Recharge</span>
          </div>

          {/* Action Guide */}
          <div className={`flex flex-col gap-2 p-3.5 rounded-xl border mb-4 shadow-sm ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
            <div className="flex items-center gap-2">
              <Info className={`w-4 h-4 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
              <span className={`text-[10px] md:text-xs font-black uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Action Required</span>
            </div>
            <p className={`text-xs font-medium leading-snug ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              • <strong className={isLight ? 'text-amber-600' : 'text-amber-400'}>Take Rest:</strong> Mutes warning for <strong className={isLight ? 'text-slate-800' : 'text-white'}>3 Days</strong>.<br/>
              • <strong className={isLight ? 'text-slate-600' : 'text-slate-300'}>Snooze:</strong> Snoozes alert for <strong className={isLight ? 'text-slate-800' : 'text-white'}>10 Hours</strong>.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-2.5 mt-auto">
            <button 
              onClick={() => handleDismiss('ignore')} 
              className="w-full py-2.5 sm:py-3 rounded-xl bg-amber-500/70 hover:bg-slate-500 text-black hover:text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all duration-300 active:scale-95 shadow-sm"
            >
              Snooze Alert For 10 Hours
            </button>
            
            <button 
              onClick={() => handleDismiss('rest')} 
              className="w-full py-3.5 sm:py-4 rounded-xl bg-amber-500 hover:bg-emerald-400 text-black text-xs sm:text-sm font-black uppercase tracking-widest transition-all duration-300 active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(52,211,153,0.4)]"
            >
              I Will Rest and Recover
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}