'use client';
import { CalendarDays, ChevronDown, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Props {
  monthlyData: Record<string, any>;
  dailyTimes: Record<string, any>;
  history: Record<string, number>;
  isLight: boolean;
  formatMins: (mins: number) => string;
  formatDisplayDate: (dateStr: string) => string;
}

export default function TimelineArchive({ monthlyData, dailyTimes, history, isLight, formatMins, formatDisplayDate }: Props) {
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});
  const sortedMonths = Object.keys(monthlyData).sort((a, b) => b.localeCompare(a));

  useEffect(() => {
    // Expand current month by default
    const d = new Date();
    setExpandedMonths({ [`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`]: true });
  }, []);

  const toggleMonthExpand = (month: string) => setExpandedMonths(prev => ({ ...prev, [month]: !prev[month] }));
  const toggleWeekExpand = (weekKey: string) => setExpandedWeeks(prev => ({ ...prev, [weekKey]: !prev[weekKey] }));

  return (
    <>
      <div className={`sticky top-0 z-20 backdrop-blur-xl border rounded-lg p-1.5 mt-0.5 flex justify-center shadow-sm ${isLight ? 'bg-white/90 border-slate-200' : 'bg-slate-900/95 border-slate-700/60'}`}>
        <h3 className={`text-[9px] font-black tracking-widest uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Timeline Archive</h3>
      </div>

      <div className="flex flex-col gap-1.5 pb-8">
        {sortedMonths.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-20 opacity-60 rounded-xl border mt-1 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/40 border-slate-700/50'}`}>
            <p className={`text-[10px] font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>No sessions recorded yet.</p>
          </div>
        ) : (
          sortedMonths.map(monthKey => {
            const data = monthlyData[monthKey];
            const isMonthExpanded = expandedMonths[monthKey];

            return (
              <div key={monthKey} className={`flex flex-col rounded-xl border overflow-hidden shadow-sm transition-colors ${isLight ? 'bg-white border-slate-200' : 'bg-slate-800/40 border-slate-700/50'}`}>
                <div className={`flex justify-between items-center px-2.5 py-2 cursor-pointer transition-colors group ${isLight ? 'bg-slate-50 hover:bg-slate-100' : 'bg-slate-800/60 hover:bg-slate-800'}`} onClick={() => toggleMonthExpand(monthKey)}>
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="text-orange-400 w-3.5 h-3.5" />
                    <h4 className={`text-[11px] font-black uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{data.name}</h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded-md">{formatMins(data.total)}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isMonthExpanded ? 'rotate-180' : ''} ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                  </div>
                </div>

                {isMonthExpanded && (
                  <div className={`flex flex-col p-1.5 gap-0.5 border-t ${isLight ? 'bg-white border-slate-200' : 'bg-slate-800/30 border-slate-700/50'}`}>
                    {(() => {
                      const weeks: Record<string, any> = {};
                      const weekKeys: string[] = [];
                      data.days.forEach((date: string) => {
                        const d = new Date(date);
                        const diffToMonday = d.getDay() === 0 ? 6 : d.getDay() - 1;
                        const weekStart = new Date(d); weekStart.setDate(d.getDate() - diffToMonday);
                        const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
                        if (weekStart.getMonth() !== d.getMonth()) weekStart.setMonth(d.getMonth(), 1);
                        if (weekEnd.getMonth() !== d.getMonth()) weekEnd.setMonth(d.getMonth() + 1, 0);

                        const startStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        const endStr = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        const weekKey = startStr === endStr ? startStr : `${startStr} - ${endStr}`;

                        if (!weeks[weekKey]) {
                          let physicalDays = Math.round((Math.min(weekEnd.getTime(), new Date().setHours(0,0,0,0)) - weekStart.getTime()) / 86400000) + 1;
                          weeks[weekKey] = { total: 0, days: [], physicalDays: Math.max(1, physicalDays) };
                          weekKeys.push(weekKey);
                        }
                        weeks[weekKey].days.push(date);
                        weeks[weekKey].total += (history[date] as number) || 0;
                      });

                      return weekKeys.map(weekKey => {
                        const week = weeks[weekKey];
                        const isWeekExpanded = expandedWeeks[weekKey];
                        const weekAvg = Math.round(week.total / week.physicalDays);

                        return (
                          <div key={weekKey} className="flex flex-col gap-0.5">
                            <div className={`flex justify-between items-center px-1.5 py-1 cursor-pointer rounded-lg border border-transparent transition-colors group ${isLight ? 'hover:bg-slate-50 hover:border-slate-200' : 'hover:bg-slate-800/60 hover:border-slate-700'}`} onClick={() => toggleWeekExpand(weekKey)}>
                              <div className="flex items-center gap-1">
                                <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${isWeekExpanded ? 'rotate-90' : ''} ${isLight ? 'text-slate-400 group-hover:text-slate-600' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                <span className={`text-[9px] font-black uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{weekKey}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className={`text-[8px] font-bold px-1 py-0.5 rounded-md ${isLight ? 'text-slate-500 bg-slate-100' : 'text-slate-400 bg-slate-800'}`}>Avg: {formatMins(weekAvg)}</span>
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${isLight ? 'text-cyan-700 bg-cyan-50 border-cyan-200' : 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20'}`}>{formatMins(week.total)}</span>
                              </div>
                            </div>

                            {isWeekExpanded && (
                              <div className="flex flex-col gap-0.5 mt-0.5 mb-1">
                                {week.days.map((date: string) => {
                                  const dTime = dailyTimes[date];
                                  return (
                                    <div key={date} className={`flex items-center justify-between px-2 py-1 rounded-md ml-3 border transition-colors ${isLight ? 'bg-slate-50 border-slate-200 hover:bg-slate-100' : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60'}`}>
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.5)]" />
                                        <span className={`font-bold text-[9px] uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{formatDisplayDate(date)}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        {dTime && (
                                          <div className="flex items-center gap-1 hidden sm:flex">
                                            {dTime.wakeupTime && <span className={`text-[8px] font-medium px-1 py-0.5 rounded border ${isLight ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'}`}>W: {new Date(dTime.wakeupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                            {dTime.bedTime && <span className={`text-[8px] font-medium px-1 py-0.5 rounded border ${isLight ? 'text-indigo-700 bg-indigo-50 border-indigo-200' : 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20'}`}>S: {new Date(dTime.bedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                          </div>
                                        )}
                                        <span className={`font-black px-1.5 py-0.5 rounded border text-[9px] ${isLight ? 'text-cyan-700 bg-cyan-100 border-cyan-300' : 'text-cyan-200 bg-cyan-500/20 border-cyan-500/30'}`}>
                                          {formatMins(history[date] as number)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}