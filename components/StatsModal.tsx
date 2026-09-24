'use client';
import { useDashboardStore } from '@/store/dashboardStore';
import { X, Flame, Calendar, Clock, ChevronDown, CalendarDays, Trophy, ChevronRight, Users, BarChart2, Star, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getLocalDateString } from '@/utils/date';
import ScrollableWithArrows from './ScrollableWithArrows';
import Timetable from './Timetable';

export default function StatsModal() {
  const { history: myHistory, dailyTimes: myDailyTimes, isStatsOpen, toggleStats, viewingFriend, setViewingFriend } = useDashboardStore();
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});
  const [showFriendTimetable, setShowFriendTimetable] = useState(false);

  const history = viewingFriend ? viewingFriend.stats.history || {} : myHistory;
  const dailyTimes = viewingFriend ? viewingFriend.stats.dailyTimes || {} : myDailyTimes;

  useEffect(() => {
    if (isStatsOpen) {
      const d = new Date();
      const currentMonthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      setExpandedMonths({ [currentMonthKey]: true });
    }
  }, [isStatsOpen]);

  // ----- DESKTOP SITE OVERRIDE LOGIC -----
  const handleClose = () => {
    const wasViewingFriend = !!viewingFriend;
    const shouldReturn = wasViewingFriend || (typeof window !== 'undefined' && sessionStorage.getItem('returnToConnect') === 'true');
    if (viewingFriend) setViewingFriend(null);

    if (shouldReturn) {
      if (typeof window !== 'undefined') sessionStorage.removeItem('returnToConnect');
      if (wasViewingFriend) useDashboardStore.getState().setConnectInitialTab('friends');
      const store = useDashboardStore.getState();
      if (!store.isSettingsOpen) store.toggleSettings();
      store.setSettingsActiveTab('connect');
    }
    toggleStats();
  };

  if (!isStatsOpen) return null;

  // Data Calculations
  const dates = Object.keys(history).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const today = getLocalDateString();
  const todayMins = history[today] || 0;
  const totalMins = Object.values(history).reduce((acc: number, curr: any) => acc + (curr as number), 0);

  // Best Day
  let bestDayMins = 0;
  Object.values(history).forEach((m) => { if ((m as number) > bestDayMins) bestDayMins = m as number; });

  const currentYear = new Date().getFullYear();
  let currentYearTotal = 0;
  let prevYearTotal = 0;

  Object.entries(history).forEach(([dateStr, mins]) => {
    const year = new Date(dateStr).getFullYear();
    if (year === currentYear) currentYearTotal += (mins as number);
    if (year === currentYear - 1) prevYearTotal += (mins as number);
  });

  const todayDate = new Date();
  const getLocalDateStr = (d: Date) => {
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - (offset * 60 * 1000));
    return local.toISOString().split('T')[0];
  };

  const thisWeekDays: string[] = [];
  const lastWeekDays: string[] = [];
  const currentDayOfWeek = todayDate.getDay() === 0 ? 7 : todayDate.getDay();
  const mondayDate = new Date(todayDate);
  mondayDate.setDate(todayDate.getDate() - currentDayOfWeek + 1);

  const lastWeekMonday = new Date(mondayDate);
  lastWeekMonday.setDate(mondayDate.getDate() - 7);

  for (let i = 0; i < 7; i++) {
    const d = new Date(mondayDate); d.setDate(mondayDate.getDate() + i); thisWeekDays.push(getLocalDateStr(d));
    const ld = new Date(lastWeekMonday); ld.setDate(lastWeekMonday.getDate() + i); lastWeekDays.push(getLocalDateStr(ld));
  }

  const calculateTotalForDates = (dateStrings: string[]) => dateStrings.reduce((total, dateStr) => total + (history[dateStr] || 0), 0);
  const thisWeekTotal = calculateTotalForDates(thisWeekDays);
  const lastWeekTotal = calculateTotalForDates(lastWeekDays);
  const thisWeekAvg = Math.round(thisWeekTotal / currentDayOfWeek);
  const lastWeekAvg = Math.round(lastWeekTotal / 7);

  // 30-Day Consistency
  let activeDaysLast30 = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(todayDate); d.setDate(todayDate.getDate() - i);
    if (history[getLocalDateStr(d)] && history[getLocalDateStr(d)] >= 60) activeDaysLast30++;
  }
  const consistencyScore = Math.round((activeDaysLast30 / 30) * 100);

  const monthlyData = dates.reduce((acc, date) => {
    const d = new Date(date);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthName = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (!acc[monthKey]) acc[monthKey] = { name: monthName, total: 0, days: [] };
    acc[monthKey].total += history[date] || 0;
    acc[monthKey].days.push(date);
    return acc;
  }, {} as Record<string, { name: string, total: number, days: string[] }>);

  const sortedMonths = Object.keys(monthlyData).sort((a, b) => b.localeCompare(a));
  const toggleMonthExpand = (month: string) => setExpandedMonths(prev => ({ ...prev, [month]: !prev[month] }));
  const toggleWeekExpand = (weekKey: string) => setExpandedWeeks(prev => ({ ...prev, [weekKey]: !prev[weekKey] }));

  const formatMinutes = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  };

  let maxStreak = 0, tempStreak = 0;
  const sortedDates = Object.keys(history).sort((a, b) => a.localeCompare(b));
  for (let i = 0; i < sortedDates.length; i++) {
    const dStr = sortedDates[i];
    if (history[dStr] >= 60) {
      if (i > 0) {
        const diffDays = Math.round((new Date(dStr).getTime() - new Date(sortedDates[i - 1]).getTime()) / 86400000);
        if (diffDays === 1) tempStreak++; else tempStreak = 1;
      } else tempStreak = 1;
      if (tempStreak > maxStreak) maxStreak = tempStreak;
    } else tempStreak = 0;
  }

  let currentStreak = 0;
  const streakCheckDate = new Date(); streakCheckDate.setHours(0, 0, 0, 0);
  const yesterdayCheck = new Date(streakCheckDate); yesterdayCheck.setDate(yesterdayCheck.getDate() - 1);
  let activeDate = streakCheckDate;
  if (!history[getLocalDateStr(streakCheckDate)] || history[getLocalDateStr(streakCheckDate)] < 60) activeDate = yesterdayCheck;

  while (true) {
    const dStr = getLocalDateStr(activeDate);
    if (history[dStr] && history[dStr] >= 60) { currentStreak++; activeDate.setDate(activeDate.getDate() - 1); } else break;
  }
  if (currentStreak > maxStreak) maxStreak = currentStreak;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-1 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" onClick={handleClose}>
      <div className="relative w-[95vw]  md:h-auto md:max-h-[80vh] md:max-w-[40vw] rounded-xl sm:rounded-2xl bg-slate-900/90 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col border border-white/10" onClick={(e) => e.stopPropagation()}>
        
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 opacity-90" />

        {/* Header */}
        <div className="flex-none px-3 py-2 flex justify-between items-center border-b border-white/10 bg-black/20 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h2 className="text-sm font-black tracking-tight flex items-center gap-1.5 text-white">
              <BarChart2 className="text-blue-400 w-4 h-4" /> {viewingFriend ? `${viewingFriend.username}'s Stats` : 'Focus History'}
            </h2>
            {currentStreak > 0 && (
              <div className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded flex items-center gap-1 shadow-sm">
                <Flame className="w-3 h-3 text-red-400 animate-pulse" />
                <span className="text-[10px] font-bold text-red-300">{currentStreak} D</span>
              </div>
            )}
            {maxStreak > 0 && currentStreak === 0 && (
              <div className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded flex items-center gap-1">
                <Flame className="w-3 h-3 text-white/40" />
                <span className="text-[10px] font-bold text-white/50">Max: {maxStreak}</span>
              </div>
            )}
          </div>
          <button onClick={handleClose} className="p-1 bg-white/5 hover:bg-white/10 rounded-md transition-colors text-white/70 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Layout */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative z-10 min-h-0">

          {/* Left Sidebar: Analytics */}
          <div className="w-full md:w-[35%] border-b md:border-b-0 md:border-r border-white/10 bg-black/30 flex flex-col shrink-0 overflow-y-auto no-scrollbar">
            <div className="p-2 flex flex-col gap-1.5">

              {/* 4-Grid Core Stats (4-cols on mobile, 2-cols on desktop) */}
              <div className="grid grid-cols-4 md:grid-cols-2 gap-1.5">
                <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 flex flex-col items-center justify-center text-center shadow-inner">
                  <Clock className="mb-0.5 text-blue-400 w-3.5 h-3.5" />
                  <p className="text-sm font-black text-white leading-none mt-0.5">{formatMinutes(todayMins)}</p>
                  <p className="text-[8px] text-blue-300/70 uppercase tracking-widest mt-0.5 font-bold">Today</p>
                </div>
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center text-center shadow-inner">
                  <Star className="mb-0.5 text-amber-400 w-3.5 h-3.5" />
                  <p className="text-sm font-black text-white leading-none mt-0.5">{formatMinutes(bestDayMins)}</p>
                  <p className="text-[8px] text-amber-300/70 uppercase tracking-widest mt-0.5 font-bold">Best</p>
                </div>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center text-center shadow-inner">
                  <Zap className="mb-0.5 text-emerald-400 w-3.5 h-3.5" />
                  <p className="text-sm font-black text-white leading-none mt-0.5">{consistencyScore}%</p>
                  <p className="text-[8px] text-emerald-300/70 uppercase tracking-widest mt-0.5 font-bold">30d Score</p>
                </div>
                <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 flex flex-col items-center justify-center text-center shadow-inner">
                  <Trophy className="mb-0.5 text-purple-400 w-3.5 h-3.5" />
                  <p className="text-sm font-black text-white leading-none mt-0.5">{Math.floor(totalMins / 60)}<span className="text-[9px] text-purple-200/50">h</span></p>
                  <p className="text-[8px] text-purple-300/70 uppercase tracking-widest mt-0.5 font-bold">Lifetime</p>
                </div>
              </div>

              {/* Data Table / Quick Summary */}
              <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 shadow-sm mt-0.5">
                <h3 className="text-[9px] font-black text-white/50 uppercase tracking-wider mb-1 px-1">Performance Matrix</h3>
                <div className="flex flex-col text-[9px] sm:text-[10px] gap-0.5">
                  <div className="flex justify-between items-center py-1 px-1.5 bg-black/20 rounded">
                    <span className="text-white/70 font-medium">Days Forged</span>
                    <span className="font-bold text-white">{dates.length}</span>
                  </div>
                  
                  {/* Visual Comparison: This Week vs Last Week */}
                  <div className="flex flex-col py-1 px-1.5 bg-black/20 rounded mt-0.5">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white/70 font-medium">This Week</span>
                      <div className="flex gap-1.5 font-bold">
                        <span className="text-blue-300">{formatMinutes(thisWeekTotal)}</span>
                        <span className="text-white/30">|</span>
                        <span className="text-emerald-300">{formatMinutes(thisWeekAvg)}/d</span>
                      </div>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (thisWeekTotal / Math.max(lastWeekTotal, 1)) * 50)}%` }} />
                    </div>
                  </div>

                  <div className="flex flex-col py-1 px-1.5 bg-black/20 rounded mt-0.5">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white/70 font-medium">Last Week</span>
                      <div className="flex gap-1.5 font-bold">
                        <span className="text-purple-300">{formatMinutes(lastWeekTotal)}</span>
                        <span className="text-white/30">|</span>
                        <span className="text-emerald-300">{formatMinutes(lastWeekAvg)}/d</span>
                      </div>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `50%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Functional Routing Buttons (Matches Your Original Code) */}
              <div className="flex gap-1.5 w-full mt-0.5">
                {viewingFriend ? (
                  <button onClick={() => setShowFriendTimetable(true)} className="flex-1 p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-cyan-400" />
                      <h3 className="text-[10px] font-bold text-cyan-100">Timetable</h3>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-cyan-400/50 group-hover:translate-x-0.5" />
                  </button>
                ) : (
                  <>
                    <button onClick={() => {
                      if (viewingFriend) setViewingFriend(null);
                      if (typeof window !== 'undefined') sessionStorage.removeItem('returnToConnect');
                      toggleStats();
                      const store = useDashboardStore.getState();
                      if (!store.isSettingsOpen) store.toggleSettings();
                      store.setConnectInitialTab('leaderboard');
                      store.setSettingsActiveTab('connect');
                      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('force-settings-tab', { detail: 'connect' }));
                    }} className="flex-1 p-1.5 sm:p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-all flex items-center justify-center gap-1 group">
                      <Trophy className="w-3.5 h-3.5 text-purple-400" />
                      <h3 className="text-[10px] font-bold text-purple-100">Ranks</h3>
                    </button>
                    
                    <button onClick={() => {
                      if (viewingFriend) setViewingFriend(null);
                      if (typeof window !== 'undefined') sessionStorage.removeItem('returnToConnect');
                      toggleStats();
                      const store = useDashboardStore.getState();
                      if (!store.isSettingsOpen) store.toggleSettings();
                      store.setConnectInitialTab('friends');
                      store.setSettingsActiveTab('connect');
                      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('force-settings-tab', { detail: 'connect' }));
                    }} className="flex-1 p-1.5 sm:p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all flex items-center justify-center gap-1 group">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      <h3 className="text-[10px] font-bold text-emerald-100">Squad</h3>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Area: Timeline / History */}
          <div className="flex-1 relative flex flex-col overflow-y-auto no-scrollbar pb-10 md:pb-0">
            <ScrollableWithArrows className="p-1.5 sm:p-2 h-full">
              <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded pb-1 mb-1.5 flex justify-center pt-1 shadow-sm">
                <h3 className="text-[9px] font-black tracking-widest text-white/60 uppercase">Timeline Archive</h3>
              </div>

              <div className="flex flex-col gap-1.5">
                {sortedMonths.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-20 opacity-50 bg-white/5 rounded-lg border border-white/5 mt-2">
                    <p className="text-[10px] font-bold text-white/70">No sessions recorded yet.</p>
                  </div>
                ) : (
                  sortedMonths.map(monthKey => {
                    const data = monthlyData[monthKey];
                    const isMonthExpanded = expandedMonths[monthKey];

                    return (
                      <div key={monthKey} className="flex flex-col rounded-lg bg-white/5 border border-white/5 overflow-hidden">
                        {/* Month Header */}
                        <div className="flex justify-between items-center px-2 py-1.5 cursor-pointer hover:bg-white/10 transition-colors group bg-black/20" onClick={() => toggleMonthExpand(monthKey)}>
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="text-orange-400 w-3.5 h-3.5" />
                            <div>
                              <h4 className="text-[10px] sm:text-[11px] font-black text-white leading-none">{data.name}</h4>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] sm:text-[11px] font-black text-orange-300">{formatMinutes(data.total)}</span>
                            <ChevronDown className={`w-3.5 h-3.5 text-white/50 transition-transform ${isMonthExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </div>

                        {/* Weeks inside Month */}
                        {isMonthExpanded && (
                          <div className="flex flex-col p-1 bg-black/40 gap-0.5 border-t border-white/5">
                            {(() => {
                              const weeks: Record<string, any> = {};
                              const weekKeys: string[] = [];

                              data.days.forEach((date: string) => {
                                const d = new Date(date);
                                const day = d.getDay();
                                const diffToMonday = day === 0 ? 6 : day - 1;
                                const mondayDate = new Date(d); mondayDate.setDate(d.getDate() - diffToMonday);
                                const sundayDate = new Date(mondayDate); sundayDate.setDate(mondayDate.getDate() + 6);
                                
                                const weekStart = new Date(mondayDate); if (weekStart.getMonth() !== d.getMonth()) weekStart.setMonth(d.getMonth(), 1);
                                const weekEnd = new Date(sundayDate); if (weekEnd.getMonth() !== d.getMonth()) weekEnd.setMonth(d.getMonth() + 1, 0);

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
                                    <div className="flex justify-between items-center px-1.5 py-1 hover:bg-white/10 cursor-pointer rounded border border-transparent hover:border-white/5 transition-colors group" onClick={() => toggleWeekExpand(weekKey)}>
                                      <div className="flex items-center gap-1">
                                        <ChevronRight className={`w-3 h-3 text-white/50 transition-transform ${isWeekExpanded ? 'rotate-90' : ''}`} />
                                        <span className="text-[9px] font-black text-white/70 uppercase">{weekKey}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="text-[8px] font-bold text-white/50 bg-black/60 px-1 rounded">Avg: {formatMinutes(weekAvg)}</span>
                                        <span className="text-[9px] font-bold text-cyan-300 bg-cyan-500/10 px-1 rounded border border-cyan-500/20">{formatMinutes(week.total)}</span>
                                      </div>
                                    </div>

                                    {/* Days inside Week */}
                                    {isWeekExpanded && week.days.map((date: string) => {
                                      const dTime = dailyTimes[date];
                                      return (
                                        <div key={date} className="flex items-center justify-between px-1.5 py-1 rounded bg-white/5 border border-white/5 ml-3 mt-0.5 hover:bg-white/10">
                                          <div className="flex items-center gap-1.5">
                                            <div className="w-1 h-1 rounded-full bg-cyan-400" />
                                            <span className="font-bold text-white/90 text-[9px]">
                                              {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1 sm:gap-1.5">
                                            {dTime && (
                                              <div className="flex items-center gap-1 hidden sm:flex">
                                                {dTime.wakeupTime && <span className="text-[8px] text-emerald-200 bg-emerald-500/10 px-1 rounded border border-emerald-500/20">W: {new Date(dTime.wakeupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                                {dTime.bedTime && <span className="text-[8px] text-indigo-200 bg-indigo-500/10 px-1 rounded border border-indigo-500/20">S: {new Date(dTime.bedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                              </div>
                                            )}
                                            <span className="font-black text-cyan-200 bg-cyan-500/20 px-1.5 rounded border border-cyan-500/30 text-[9px]">
                                              {formatMinutes(history[date] as number)}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
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
            </ScrollableWithArrows>
          </div>
        </div>
      </div>

      {showFriendTimetable && viewingFriend && (
        <div className="fixed inset-0 z-[10005] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-1 sm:p-4" onClick={() => setShowFriendTimetable(false)}>
          <div className="w-full max-w-3xl relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowFriendTimetable(false)} className="absolute -top-10 right-0 bg-white/10 hover:bg-white/20 p-1.5 rounded-lg text-white backdrop-blur-md border border-white/10">
              <X className="w-5 h-5" />
            </button>
            <Timetable />
          </div>
        </div>
      )}
    </div>
  );
}