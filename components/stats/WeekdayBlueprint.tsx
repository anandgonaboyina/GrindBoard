// components/stats/WeekdayBlueprint.tsx
'use client';
import { useState, useMemo } from 'react';
import { BarChart2 } from 'lucide-react'; 
import { calculateWeekdayAverages } from './utils';

interface Props {
  history: Record<string, number>;
  isLight: boolean;
  formatMins: (mins: number) => string;
}

const RANGES = [
  { label: '14d', value: 14 },
  { label: '30d', value: 30 },
  { label: '60d', value: 60 },
  { label: '90d', value: 90 },
];

export default function WeekdayBlueprint({ history, isLight, formatMins }: Props) {
  const [rangeDays, setRangeDays] = useState<number>(30);

  const weekdayData = useMemo(() => {
    return calculateWeekdayAverages(history, rangeDays);
  }, [history, rangeDays]);

  const maxAvg = useMemo(() => {
    return Math.max(...weekdayData.map((d) => d.avgMins), 1);
  }, [weekdayData]);

  return (
    <div className={`w-full h-full p-3 sm:p-4 rounded-2xl border flex flex-col justify-between gap-3 shadow-sm transition-colors duration-300 ${
      isLight ? 'bg-white border-gray-100' : 'bg-gray-900 border-gray-800'
    }`}>
      {/* Header with Segmented Range Buttons */}
      <div className="flex justify-between items-center gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-xl ${isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400'}`}>
            <BarChart2 className="w-4 h-4" />
          </div>
          <h3 className={`text-xs sm:text-sm font-semibold tracking-wide ${isLight ? 'text-gray-800' : 'text-gray-100'}`}>
            Weekday Blueprint
          </h3>
        </div>

        {/* Right-Side Segmented Pill Control */}
        <div className={`flex items-center p-0.5 rounded-xl border transition-colors ${
          isLight ? 'bg-gray-100/80 border-gray-200/60' : 'bg-gray-800/80 border-gray-700/60'
        }`}>
          {RANGES.map((range) => {
            const isActive = rangeDays === range.value;
            return (
              <button
                key={range.value}
                onClick={() => setRangeDays(range.value)}
                className={`px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold rounded-lg transition-all duration-200 ${
                  isActive
                    ? isLight
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'bg-blue-600 text-white shadow-sm'
                    : isLight
                    ? 'text-gray-500 hover:text-gray-900'
                    : 'text-gray-400 hover:text-gray-100'
                }`}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>

{/* 7-Day Bar Display */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 items-end h-[110px] mt-2">
        {weekdayData.map((item) => {
          const heightPercent = Math.max(8, Math.round((item.avgMins / maxAvg) * 100));
          const isHighest = item.avgMins === maxAvg && maxAvg > 0;
          const isZero = item.avgMins === 0;

          return (
            <div key={item.dayShort} className="flex flex-col items-center justify-end h-full gap-1.5 group">
              
              {/* Formatted Value Label */}
              <span className={`text-[9px] sm:text-[10px] font-bold tracking-tight whitespace-nowrap transition-colors ${
                isHighest 
                  ? isLight ? 'text-blue-600' : 'text-blue-400'
                  : isZero 
                  ? isLight ? 'text-slate-300' : 'text-slate-600' 
                  : isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {formatMins(item.avgMins)}
              </span>

              {/* Bar Container - Auto-fits responsive width with a max cap */}
              <div className={`relative w-full max-w-[28px] flex-1 rounded-t-md flex items-end justify-center p-0.5 transition-colors ${
                isLight ? 'bg-slate-100 group-hover:bg-slate-200' : 'bg-slate-800/40 group-hover:bg-slate-800/60'
              }`}>
                <div
                  style={{ height: `${isZero ? 0 : heightPercent}%` }}
                  className={`w-full rounded-[4px] transition-all duration-700 ease-out ${
                    isHighest
                      ? 'bg-gradient-to-t from-blue-500 to-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.4)]'
                      : isZero
                      ? 'bg-transparent'
                      : isLight 
                        ? 'bg-slate-300' 
                        : 'bg-slate-600'
                  }`}
                />
              </div>

              {/* Day Label */}
              <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-colors ${
                isHighest
                  ? isLight ? 'text-slate-800' : 'text-white'
                  : isLight ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {item.dayShort}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}