'use client';
import { Activity } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { getLocalDateString } from '@/utils/date';

interface Props {
  heatmapMonths: any[];
  history: Record<string, number>;
  isLight: boolean;
  formatMins: (mins: number) => string;
  formatDisplayDate: (dateStr: string) => string;
}

export default function FocusHeatmap({ heatmapMonths, history, isLight, formatMins, formatDisplayDate }: Props) {
  const [activeHeatmapDay, setActiveHeatmapDay] = useState<{ dateStr: string, mins: number } | null>(null);
  const heatmapScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the far right (current day) when mounted
    if (heatmapScrollRef.current) {
      setTimeout(() => {
        heatmapScrollRef.current?.scrollTo({
          left: heatmapScrollRef.current.scrollWidth,
          behavior: 'smooth'
        });
      }, 150);
    }
  }, []);

  const getIntensityClass = (mins: number) => {
    if (mins < 60) return isLight ? 'bg-slate-100 border border-slate-200' : 'bg-slate-800/60 border border-slate-700';
    if (mins < 180) return isLight ? 'bg-emerald-300' : 'bg-emerald-700/80 border border-emerald-600/50';
    if (mins < 300) return isLight ? 'bg-emerald-400' : 'bg-emerald-500 border border-emerald-400';
    if (mins < 480) return isLight ? 'bg-emerald-500 shadow-sm' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] border border-emerald-300';
    return isLight ? 'bg-emerald-600 shadow-md' : 'bg-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.8)] border border-emerald-200';
  };

  const todayStr = getLocalDateString();
  const todayMins = (history[todayStr] as number) || 0;
  const displayDay = activeHeatmapDay || { dateStr: todayStr, mins: todayMins };
  const isShowingToday = !activeHeatmapDay;

  return (
    <div className={`p-2.5 sm:p-4 rounded-xl border flex flex-col gap-1.5 shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-slate-800/50 border-slate-700/50'}`}>
      <div className="flex justify-between items-center px-1 mb-1 h-6">
        <div className="flex items-center gap-1.5 shrink-0">
          <Activity className={`w-3.5 h-3.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
          <h3 className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Focus Heatmap</h3>
        </div>
        
        <div className="flex items-center justify-end h-full">
          <div className={`text-[9px] sm:text-[10px] font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
            {isShowingToday && <span className={`text-[7px] sm:text-[8px] uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Today</span>}
            <span className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[16px] font-black ${isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {formatMins(displayDay.mins)}
            </span>
            <span className="w-[75px] sm:w-[90px] text-right truncate">
              {formatDisplayDate(displayDay.dateStr)}
            </span>
          </div>
        </div>
      </div>

      {/* Added onMouseLeave here to the PARENT container. 
          This prevents mobile taps from disappearing instantly, 
          and resets the hover state only when the mouse completely leaves the heatmap on desktop. */}
      <div 
        ref={heatmapScrollRef} 
        onMouseLeave={() => setActiveHeatmapDay(null)}
        className="flex gap-2 sm:gap-3 lg:gap-4 w-full overflow-x-auto custom-scrollbar pb-2 relative scroll-smooth"
      >
        <div className={`flex flex-col justify-between text-[7px] sm:text-[8px] font-bold uppercase tracking-widest py-1 shrink-0 mt-[18px] lg:mt-[22px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
          <span>S</span><span className="invisible">M</span><span>T</span><span className="invisible">W</span><span>T</span><span className="invisible">F</span><span>S</span>
        </div>
        
        {heatmapMonths.map((month) => (
          <div key={month.monthName} className="flex flex-col gap-1.5 shrink-0">
            <span className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-widest pl-0.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              {month.monthName}
            </span>
            {/* Expanded gap sizes for larger screens */}
            <div className="grid grid-rows-7 grid-flow-col gap-[2px] sm:gap-[3px] lg:gap-1 w-max">
              {month.gridDays.map((day: any, idx: number) => {
                // Scaled up square sizes (lg:w-4 lg:h-4) so it fills desktop screens beautifully
                if (!day) return <div key={`pad-${idx}`} className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4" />;
                return (
                  <div 
                    key={day.dateStr} 
                    onMouseEnter={() => setActiveHeatmapDay(day)} 
                    onClick={() => setActiveHeatmapDay(day)}
                    // Removed onMouseLeave from the individual square
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 rounded-[2px] lg:rounded-sm transition-all cursor-pointer hover:ring-[1.5px] hover:ring-offset-[1px] ${isLight ? 'hover:ring-emerald-400 hover:ring-offset-white' : 'hover:ring-emerald-400 hover:ring-offset-slate-900'} ${getIntensityClass(day.mins)}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}