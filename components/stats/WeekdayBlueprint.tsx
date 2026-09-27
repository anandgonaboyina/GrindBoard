'use client';

import React, { useMemo, useState } from 'react';
import { Flame, Star, Activity, CalendarDays, TrendingUp, TrendingDown, Ghost } from 'lucide-react';

interface Props {
  history: Record<string, number>;
  isLight: boolean;
  formatMins: (mins: number) => string;
  ownerName?: string | null;
}

const RANGES = [
  { id: 14, label: '14 Days' },
  { id: 21, label: '21 Days' },
  { id: 30, label: '30 Days' },
  { id: 60, label: '60 Days' }, 
];

const DAYS_ORDER = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 0, label: 'Sun' },
];

export default function WeekdayBlueprint({ history, isLight, formatMins, ownerName=null}: Props) {
  const [selectedRange, setSelectedRange] = useState<number>(14); 
  const currentDayOfWeek = new Date().getDay();

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayData: Record<number, { total: number; count: number }> = {
      0: { total: 0, count: 0 }, 1: { total: 0, count: 0 },
      2: { total: 0, count: 0 }, 3: { total: 0, count: 0 },
      4: { total: 0, count: 0 }, 5: { total: 0, count: 0 },
      6: { total: 0, count: 0 }
    };

    const getLocalStr = (d: Date) => {
      const offset = d.getTimezoneOffset();
      return new Date(d.getTime() - offset * 60000).toISOString().split('T')[0];
    };

    const todayStr = getLocalStr(today);
    const todayActualMins = history[todayStr] || 0;

    for (let i = 0; i < selectedRange; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dStr = getLocalStr(d);
      
      const mins = history[dStr] || 0;
      
      const dow = d.getDay();
      dayData[dow].total += mins;
      dayData[dow].count += 1;
    }

    let maxAvg = 0;
    let maxValForScale = 0;
    let bestDay = -1;
    const averages: Record<number, number> = {};

    DAYS_ORDER.forEach(({ id: dow }) => {
      const data = dayData[dow];
      const avg = data.count > 0 ? Math.round(data.total / data.count) : 0;
      averages[dow] = avg;
      
      if (avg > maxAvg) {
        maxAvg = avg;
        bestDay = dow;
      }

      // Ensure the scale accommodates Today's actual value if it's currently spiking
      const displayVal = dow === currentDayOfWeek ? Math.max(avg, todayActualMins) : avg;
      if (displayVal > maxValForScale) maxValForScale = displayVal;
    });

    if (maxAvg === 0) bestDay = -1;

    return {
      averages,
      maxAvg,
      maxValForScale,
      bestDay,
      todayActualMins,
      hasAnyData: maxValForScale > 0
    };
  }, [history, selectedRange]);

  return (
    <div className={`p-2 md:p-3 rounded-xl border flex flex-col md:flex-row-reverse gap-1.5 md:gap-3 shadow-sm w-full ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/70 border-white/10 backdrop-blur-md'}`}>
      
      {/* RIGHT ON DESKTOP, TOP ON MOBILE: Ultra-Compact Range Selector with "From Last" Label */}
      <div className="flex flex-col gap-1 md:gap-1.5 w-full md:w-[85px] shrink-0">
        <span className={`text-[8.5px] font-black uppercase tracking-wider text-center md:text-left opacity-80 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
          From Last
        </span>
        <div className="grid grid-cols-4 md:flex md:flex-col gap-1 w-full shrink-0">
          {RANGES.map((range) => {
            const isSelected = selectedRange === range.id;
            return (
              <button
                key={range.id}
                onClick={() => setSelectedRange(range.id)}
                className={`flex items-center justify-center gap-1 px-0.5 py-1.5 md:py-2 rounded-lg font-bold text-[8.5px] md:text-[9.5px] transition-all shrink-0 border
                  ${isSelected 
                    ? (isLight ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm' : 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-sm')
                    : (isLight ? 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100' : 'bg-black/30 text-white/50 border-transparent hover:bg-white/5 hover:text-white/80')
                  }
                `}
              >
                <CalendarDays className={`w-2.5 h-2.5 shrink-0 hidden sm:block ${isSelected ? 'opacity-100' : 'opacity-60'}`} />
                <span className="whitespace-nowrap">{range.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* LEFT ON DESKTOP, BOTTOM ON MOBILE: Chart */}
      <div className="flex-1 flex flex-col gap-1 min-w-0 w-full">
        
        {/* Header with Today's actual time explicitly shown via justify-between */}
        <div className="flex items-center justify-between border-b pb-1.5 border-white/10 dark:border-white/10">
          <div className="flex items-center gap-1.5">
            <div className={`p-1 rounded-md shrink-0 ${isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/20 text-blue-400'}`}>
              <Activity className="w-3 h-3" />
            </div>
            <h3 className={`text-[10px] font-black uppercase tracking-wider leading-none ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Weekly Averages
            </h3>
          </div>
          
          {/* Today's Focus Time Badge */}
          {stats.todayActualMins > 0 && (
            <div className={`text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-md border flex items-center gap-1
              ${isLight ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-blue-500/10 border-blue-500/30 text-blue-300'}
            `}>
              Today: {formatMins(stats.todayActualMins).replace(/ /g, '')}
            </div>
          )}
        </div>

        {/* Vertical Bar Chart Container */}
        <div className={`w-full h-32 md:h-36 mt-0.5 flex items-end justify-between px-1 pb-1 relative ${isLight ? 'bg-slate-50/50' : 'bg-black/20'} rounded-xl border border-transparent dark:border-white/5`}>
          {!stats.hasAnyData ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-4 z-20 animate-in fade-in duration-500">
              {/* Animated Floating Icon */}
              <div className="relative flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full animate-ping opacity-30 ${isLight ? 'bg-blue-400' : 'bg-blue-500'}`} />
                <div className={`w-10 h-10 rounded-full flex items-center justify-center relative z-10 shadow-sm border
                  ${isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700/50'}
                `}>
                  {ownerName ? (
                    <Ghost className={`w-5 h-5 animate-bounce ${isLight ? 'text-slate-400' : 'text-white/60'}`} style={{ animationDuration: '2s' }} />
                  ) : (
                    <Activity className={`w-5 h-5 ${isLight ? 'text-blue-500' : 'text-blue-400'}`} />
                  )}
                </div>
              </div>

              {/* High-Visibility Dynamic Text */}
              <div className="flex flex-col gap-1 max-w-[260px]">
                <span className={`text-[11px] font-black uppercase tracking-wider drop-shadow-sm
                  ${isLight ? 'text-slate-700' : 'text-white/90'}
                `}>
                  {ownerName ? "No Signal Detected" : "Your Canvas is Blank"}
                </span>
                <span className={`text-[10px] font-medium leading-relaxed drop-shadow-sm
                  ${isLight ? 'text-slate-600' : 'text-white/70'}
                `}>
                  {ownerName
                    ? `${ownerName} hasn't logged any focus time in the last ${selectedRange} days.`
                    : `You haven't tracked any focus in the last ${selectedRange} days. Start a session to map out your rhythm!`
                  }
                </span>
              </div>
            </div>
          ) : (
            DAYS_ORDER.map(({ id: dow, label }) => {
              const isToday = currentDayOfWeek === dow;
              const isBest = stats.bestDay === dow;
              const avgMins = stats.averages[dow];
              
              // For "Today", we render the actual time to compare against the average for scaling
              const displayMins = isToday ? stats.todayActualMins : avgMins;
              
              // Height scaling logic (2% minimum so the bar doesn't completely vanish)
              const heightPct = displayMins === 0 ? 2 : Math.max(2, (displayMins / stats.maxValForScale) * 100);
              
              // Performance vs Average logic for Today
              const diff = stats.todayActualMins - avgMins;
              const isBeatingAvg = isToday && diff > 0;

              return (
                <div key={dow} className="flex flex-col items-center justify-end h-full w-[13%] sm:w-10 gap-0.5 group relative z-10">
                  
                  {/* Glowing Flower/Bloom effect behind the bar if crushing it */}
                  {isBeatingAvg && (
                    <div className="absolute bottom-4 w-[150%] h-[80%] bg-emerald-500/30 blur-xl rounded-t-full animate-pulse pointer-events-none z-0" />
                  )}

                  {/* Top Label (Always show the Average) */}
                  <div className="h-3 flex items-end justify-center w-full relative z-10">
                    {avgMins > 0 && (
                      <span className={`text-[7.5px] md:text-[8.5px] font-bold whitespace-nowrap
                        ${isBest ? (isLight ? 'text-amber-600' : 'text-amber-400') : (isLight ? 'text-slate-600' : 'text-white/70')}
                      `}>
                        {formatMins(avgMins)}
                      </span>
                    )}
                  </div>

                  {/* Indicator Icon (Flame, Star, or Diff) */}
                  <div className="h-4 flex items-center justify-center shrink-0 z-10 relative">
                    {isBest && !isToday && <Flame className={`w-3 h-3 ${isLight ? 'text-amber-500' : 'text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]'}`} />}
                    
                    {/* Show diff if beating average! */}
                    {isBeatingAvg && (
                      <span className="text-[8px] font-black text-emerald-400 shrink-0 flex items-center drop-shadow-[0_0_5px_rgba(52,211,153,0.8)] animate-bounce">
                        <TrendingUp className="w-2 h-2 mr-0.5" />
                        +{formatMins(diff)}m
                      </span>
                    )}

                    {/* Show diff if losing to average! */}
                    {isToday && diff < 0 && (
                      <span className={`text-[8px] font-black flex items-center shrink-0 ${isLight ? 'text-rose-600' : 'text-rose-400 drop-shadow-[0_0_5px_rgba(244,63,94,0.8)]'}`}>
                        <TrendingDown className="w-2 h-2 mr-0.5" />
                        {formatMins(diff)}m
                      </span>
                    )}
                    
                    {/* Default to Star if exactly tied or if both are zero */}
                    {isToday && diff === 0 && <Star className={`w-2.5 h-2.5 ${isLight ? 'text-blue-500' : 'text-blue-400'}`} />}
                  </div>

                  {/* The Vertical Bar Container */}
                  <div className="w-full h-16 md:h-20 bg-transparent flex items-end justify-center rounded-t-md relative z-10">
                    
                    {/* Background Track */}
                    <div className={`absolute inset-0 rounded-t-md ${isLight ? 'bg-slate-200/50' : 'bg-white/5'}`}></div>
                    
                    {/* Active Colored Fill */}
                    <div 
                      className={`w-full rounded-t-md transition-all duration-700 ease-out relative overflow-hidden
                        ${isBeatingAvg 
                          ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]'
                          : isBest 
                            ? 'bg-gradient-to-t from-amber-600 to-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.3)]' 
                            : isToday 
                              ? 'bg-gradient-to-t from-blue-600 to-blue-400'
                              : (isLight ? 'bg-slate-400' : 'bg-slate-600/80')
                        }
                      `}
                      style={{ height: `${heightPct}%` }}
                    >
                      <div className="absolute top-0 left-0 w-full h-2 bg-white/20"></div>
                    </div>
                  </div>

                  {/* Day Label */}
                  <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-wider mt-0.5 shrink-0 z-10
                    ${isToday ? (isBeatingAvg ? 'text-emerald-400' : (isLight ? 'text-blue-600' : 'text-blue-400')) : isBest ? (isLight ? 'text-amber-600' : 'text-amber-400') : (isLight ? 'text-slate-500' : 'text-white/50')}
                  `}>
                    {label}
                  </span>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}