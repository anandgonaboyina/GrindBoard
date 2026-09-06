'use client';
import { useDashboardStore } from '@/store/dashboardStore';
import { X, Flame, Calendar, Clock, BookOpen, GraduationCap, MessageCircle, ChevronDown, CalendarDays, Trophy, ChevronRight, Users, BarChart2 } from 'lucide-react';
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
    // When modal opens, auto-expand the current month
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
    if (viewingFriend) {
      setViewingFriend(null);
    }

    if (shouldReturn) {
      if (typeof window !== 'undefined') sessionStorage.removeItem('returnToConnect');
      if (wasViewingFriend) {
        useDashboardStore.getState().setConnectInitialTab('friends');
      }
      // Ensure Settings Modal is open and on the connect tab
      useDashboardStore.getState().setSettingsActiveTab('connect');
      if (!useDashboardStore.getState().isSettingsOpen) {
        useDashboardStore.getState().toggleSettings();
      }
    }
    toggleStats();
  };

  if (!isStatsOpen) return null;

  // Sort dates descending (newest first)
  const dates = Object.keys(history).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const today = getLocalDateString();
  const todayMins = history[today] || 0;
  const totalMins = Object.values(history).reduce((acc: number, curr: any) => acc + (curr as number), 0);

  // Helper to calculate total mins for a set of dates
  const calculateTotalForDates = (dateStrings: string[]) => {
    return dateStrings.reduce((total, dateStr) => total + (history[dateStr] || 0), 0);
  };

  const currentYear = new Date().getFullYear();
  let currentYearTotal = 0;
  let prevYearTotal = 0;

  Object.entries(history).forEach(([dateStr, mins]) => {
    const year = new Date(dateStr).getFullYear();
    if (year === currentYear) currentYearTotal += (mins as number);
    if (year === currentYear - 1) prevYearTotal += (mins as number);
  });

  // Calculate "This Week" (Monday to Sunday)
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
    const d = new Date(mondayDate);
    d.setDate(mondayDate.getDate() + i);
    thisWeekDays.push(getLocalDateStr(d));

    const ld = new Date(lastWeekMonday);
    ld.setDate(lastWeekMonday.getDate() + i);
    lastWeekDays.push(getLocalDateStr(ld));
  }

  // Calculate "This Month"
  const thisMonthDays: string[] = [];
  const lastDayOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0).getDate();
  for (let i = 1; i <= lastDayOfMonth; i++) {
    const d = new Date(todayDate.getFullYear(), todayDate.getMonth(), i);
    thisMonthDays.push(getLocalDateStr(d));
  }

  const thisWeekTotal = calculateTotalForDates(thisWeekDays);
  const lastWeekTotal = calculateTotalForDates(lastWeekDays);
  const thisMonthTotal = calculateTotalForDates(thisMonthDays);

  const thisWeekAvg = Math.round(thisWeekTotal / currentDayOfWeek); // average based on days passed this week so far
  const lastWeekAvg = Math.round(lastWeekTotal / 7); // full 7 days for last week
  const thisMonthAvg = Math.round(thisMonthTotal / todayDate.getDate()); // average based on days passed this month so far

  // Group by month
  const monthlyData = dates.reduce((acc, date) => {
    const d = new Date(date);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthName = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    if (!acc[monthKey]) {
      acc[monthKey] = { name: monthName, total: 0, days: [] };
    }

    acc[monthKey].total += history[date] || 0;
    acc[monthKey].days.push(date);
    return acc;
  }, {} as Record<string, { name: string, total: number, days: string[] }>);

  const sortedMonths = Object.keys(monthlyData).sort((a, b) => b.localeCompare(a));

  const toggleMonthExpand = (month: string) => {
    setExpandedMonths(prev => ({ ...prev, [month]: !prev[month] }));
  };

  const toggleWeekExpand = (weekKey: string) => {
    setExpandedWeeks(prev => ({ ...prev, [weekKey]: !prev[weekKey] }));
  };

  const formatMinutes = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  };

  // Calculate Max Streak from all history
  let maxStreak = 0;
  let tempStreak = 0;
  const sortedDates = Object.keys(history).sort((a, b) => a.localeCompare(b));

  for (let i = 0; i < sortedDates.length; i++) {
    const dStr = sortedDates[i];
    if (history[dStr] >= 60) {
      if (i > 0) {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(dStr);
        const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      if (tempStreak > maxStreak) maxStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  // Calculate current streak
  let currentStreak = 0;
  const streakCheckDate = new Date();
  streakCheckDate.setHours(0, 0, 0, 0);

  const yesterdayCheck = new Date(streakCheckDate);
  yesterdayCheck.setDate(yesterdayCheck.getDate() - 1);

  let activeDate = streakCheckDate;
  if (!history[getLocalDateStr(streakCheckDate)] || history[getLocalDateStr(streakCheckDate)] < 60) {
    activeDate = yesterdayCheck; // Allow missing today if yesterday was done
  }

  while (true) {
    const dStr = getLocalDateStr(activeDate);
    if (history[dStr] && history[dStr] >= 60) {
      currentStreak++;
      activeDate.setDate(activeDate.getDate() - 1);
    } else {
      break;
    }
  }

  if (currentStreak > maxStreak) maxStreak = currentStreak;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-h-[85vh] max-w-3xl rounded-2xl sm:rounded-3xl bg-slate-900/80 backdrop-blur-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 flex flex-col border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Top Gradient Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 opacity-80" />

        {/* Header */}
        <div className="flex-none px-3 py-2.5 sm:px-4 sm:py-3 flex justify-between items-center border-b border-white/10 bg-white/5 relative z-10 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <h2 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-1.5 text-white">
              <BarChart2 className="text-orange-400 w-4 h-4 sm:w-5 sm:h-5" /> {viewingFriend ? `${viewingFriend.username}'s Stats` : 'Focus History'}
            </h2>
            {currentStreak > 0 && (
              <div className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded flex items-center gap-1 shadow-sm">
                <Flame className="w-3 h-3 text-red-400 animate-pulse" />
                <span className="text-[10px] sm:text-xs font-bold text-red-300" title={`Max Streak: ${maxStreak}`}>{currentStreak} Day{currentStreak !== 1 ? 's' : ''}</span>
              </div>
            )}
            {maxStreak > 0 && currentStreak === 0 && (
              <div className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded flex items-center gap-1">
                <Flame className="w-3 h-3 text-white/40" />
                <span className="text-[10px] sm:text-xs font-bold text-white/50">Max: {maxStreak}</span>
              </div>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-1 sm:p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row relative z-10 min-h-0">

          {/* Sidebar: Overall Stats */}
          <div className="w-full md:w-[35%] border-b md:border-b-0 md:border-r border-white/10 bg-black/20 flex flex-col relative flex-none md:flex-1 shrink-0">
            <ScrollableWithArrows className="p-2 sm:p-2.5 flex flex-col gap-2 sm:gap-2.5">

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                {/* Today */}
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col items-center justify-center text-center relative overflow-hidden group shadow-inner">
                  <Clock className="mb-0.5 text-blue-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <p className="text-lg sm:text-xl font-black text-white leading-tight mt-0.5">{formatMinutes(todayMins)}</p>
                  <p className="text-[9px] text-blue-200/60 uppercase tracking-widest mt-0.5 font-bold">Today</p>
                </div>

                {/* Yearly */}
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center text-center relative overflow-hidden group shadow-inner">
                  <Calendar className="mb-0.5 text-emerald-400 w-4 h-4 sm:w-5 sm:h-5" />
                  {prevYearTotal > 0 ? (
                    <div className="flex items-center justify-center gap-2 mt-0.5">
                      <div className="flex flex-col items-center">
                        <span className="text-lg sm:text-xl font-black text-white leading-tight">{formatMinutes(currentYearTotal)}</span>
                        <span className="text-[8px] text-emerald-300/60 font-bold uppercase">{currentYear}</span>
                      </div>
                      <div className="w-px h-5 bg-white/20"></div>
                      <div className="flex flex-col items-center opacity-60">
                        <span className="text-sm font-bold text-white leading-tight">{formatMinutes(prevYearTotal)}</span>
                        <span className="text-[8px] text-emerald-300/60 font-bold uppercase">{currentYear - 1}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-lg sm:text-xl font-black text-white leading-tight mt-0.5">{formatMinutes(currentYearTotal)}</span>
                  )}
                  <p className="text-[9px] text-emerald-200/60 uppercase tracking-widest mt-1 font-bold">Yearly Total</p>
                </div>
              </div>

              {/* Quick Summary */}
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 shadow-sm mt-0.5">
                <h3 className="text-[9px] font-bold text-white/50 uppercase tracking-wider mb-1.5 border-b border-white/10 pb-1.5 px-1">Quick Summary</h3>
                <div className="flex flex-col text-[10px] sm:text-xs">
                  <div className="flex justify-between items-center py-1.5 px-1 border-b border-white/5">
                    <span className="text-white/70 font-medium">Days Logged</span>
                    <span className="font-bold text-white/90">{dates.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 px-1 border-b border-white/5">
                    <span className="text-white/70 font-medium">This Week</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-blue-300">{formatMinutes(thisWeekTotal)}</span>
                      <span className="text-white/30">|</span>
                      <span className="font-bold text-emerald-300">{formatMinutes(thisWeekAvg)}/d</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-1.5 px-1">
                    <span className="text-white/70 font-medium">Last Week</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-purple-300">{formatMinutes(lastWeekTotal)}</span>
                      <span className="text-white/30">|</span>
                      <span className="font-bold text-emerald-300">{formatMinutes(lastWeekAvg)}/d</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leaderboard / Timetable Link Button */}
              {viewingFriend ? (
                <button
                  onClick={() => setShowFriendTimetable(true)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-500/40 transition-all flex items-center justify-between group shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-cyan-500/20 rounded-lg group-hover:scale-110 transition-transform border border-cyan-500/30">
                      <CalendarDays className="w-4 h-4 text-cyan-300" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xs font-bold text-cyan-100 tracking-tight leading-tight">{viewingFriend.username}'s Timetable</h3>
                      <p className="text-[9px] text-cyan-200/50 leading-tight mt-0.5">View weekly schedule</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-cyan-400/50 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all" />
                </button>
              ) : (
                <div className="flex gap-2 w-full mt-1">
                  <button
                    onClick={() => {
                      if (viewingFriend) setViewingFriend(null);
                      if (typeof window !== 'undefined') sessionStorage.removeItem('returnToConnect');
                      toggleStats();
                      useDashboardStore.getState().setConnectInitialTab('leaderboard');
                      useDashboardStore.getState().setSettingsActiveTab('connect');
                      if (!useDashboardStore.getState().isSettingsOpen) {
                        useDashboardStore.getState().toggleSettings();
                      }
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new Event('open-leaderboard'));
                      }
                    }}
                    className="flex-1 p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/40 transition-all flex items-center justify-between group shadow-sm"
                  >
                    <div className="flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <h3 className="text-[10px] sm:text-[11px] font-bold text-purple-100 tracking-tight leading-none truncate">Leaderboard</h3>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-purple-400/50 group-hover:text-purple-300 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>

                  <button
                    onClick={() => {
                      if (viewingFriend) setViewingFriend(null);
                      if (typeof window !== 'undefined') sessionStorage.removeItem('returnToConnect');
                      toggleStats();
                      useDashboardStore.getState().setConnectInitialTab('friends');
                      useDashboardStore.getState().setSettingsActiveTab('connect');
                      if (!useDashboardStore.getState().isSettingsOpen) {
                        useDashboardStore.getState().toggleSettings();
                      }
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new Event('open-leaderboard'));
                      }
                    }}
                    className="flex-1 p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex items-center justify-between group shadow-sm"
                  >
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <h3 className="text-[10px] sm:text-[11px] font-bold text-emerald-100 tracking-tight leading-none truncate">Friends</h3>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-400/50 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                </div>
              )}
            </ScrollableWithArrows>
          </div>

          {/* Main Content: History */}
          <div className="flex-1 bg-transparent relative flex flex-col md:w-[65%]">
            <ScrollableWithArrows className="p-2 sm:p-2.5 h-full">
              <div className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-lg p-1.5 mb-2 shadow-sm">
                <h3 className="text-[10px] sm:text-xs font-bold tracking-widest text-white/80 uppercase text-center">
                  Monthly Breakdown
                </h3>
              </div>

              <div className="flex flex-col gap-2 pb-4">
                {sortedMonths.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-28 opacity-60 bg-white/5 rounded-xl border border-white/5 mt-4">
                    <Calendar className="mb-1 w-6 h-6 text-white/40" />
                    <p className="text-[10px] sm:text-xs font-medium text-white/70">No focus sessions recorded yet.</p>
                  </div>
                ) : (
                  sortedMonths.map(monthKey => {
                    const data = monthlyData[monthKey];
                    const isMonthExpanded = expandedMonths[monthKey];

                    return (
                      <div key={monthKey} className="flex flex-col rounded-xl bg-white/5 border border-white/10 overflow-hidden shadow-sm">
                        {/* Month Header */}
                        <div
                          className="flex justify-between items-center px-2.5 py-2 cursor-pointer hover:bg-white/10 transition-colors group relative bg-black/20"
                          onClick={() => toggleMonthExpand(monthKey)}
                        >
                          <div className="flex items-center gap-2 relative z-10">
                            <div className="p-1.5 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors border border-orange-500/20">
                              <CalendarDays className="text-orange-400 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </div>
                            <div>
                              <h4 className="text-[11px] sm:text-xs font-bold text-white tracking-wide leading-none mb-0.5">{data.name}</h4>
                              <p className="text-[9px] text-white/50 leading-none">{data.days.length} active days</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 relative z-10">
                            <span className="block text-[11px] sm:text-xs font-black text-orange-300 leading-none">{formatMinutes(data.total)}</span>
                            <div className={`p-0.5 rounded transition-transform ${isMonthExpanded ? 'rotate-180' : ''}`}>
                              <ChevronDown className="w-3.5 h-3.5 text-white/50 group-hover:text-white" />
                            </div>
                          </div>
                        </div>

                        {/* Days inside Month */}
                        {isMonthExpanded && (
                          <div className="flex flex-col p-1.5 sm:p-2 bg-black/40 gap-1 border-t border-white/5">
                            {(() => {
                              const weeks: Record<string, { total: number, days: string[] }> = {};
                              const weekKeys: string[] = [];

                              data.days.forEach((date: string) => {
                                const d = new Date(date);
                                const day = d.getDay();
                                const diffToMonday = day === 0 ? 6 : day - 1;

                                const mondayDate = new Date(d);
                                mondayDate.setDate(d.getDate() - diffToMonday);

                                const sundayDate = new Date(mondayDate);
                                sundayDate.setDate(mondayDate.getDate() + 6);

                                const weekStart = new Date(mondayDate);
                                if (weekStart.getMonth() !== d.getMonth()) {
                                  weekStart.setMonth(d.getMonth(), 1);
                                }

                                const weekEnd = new Date(sundayDate);
                                if (weekEnd.getMonth() !== d.getMonth()) {
                                  weekEnd.setMonth(d.getMonth() + 1, 0);
                                }

                                const startStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                const endStr = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                const weekKey = startStr === endStr ? startStr : `${startStr} - ${endStr}`;

                                if (!weeks[weekKey]) {
                                  const todayCalc = new Date();
                                  todayCalc.setHours(0, 0, 0, 0);
                                  const endCalc = weekEnd > todayCalc ? todayCalc : weekEnd;
                                  let physicalDays = Math.round((endCalc.getTime() - weekStart.getTime()) / (1000 * 3600 * 24)) + 1;
                                  if (physicalDays < 1) physicalDays = 1;

                                  weeks[weekKey] = { total: 0, days: [], physicalDays } as any;
                                  weekKeys.push(weekKey);
                                }
                                weeks[weekKey].days.push(date);
                                weeks[weekKey].total += (history[date] as number) || 0;
                              });

                              return weekKeys.map(weekKey => {
                                const week = weeks[weekKey] as any;
                                const isWeekExpanded = expandedWeeks[weekKey];
                                const weekAvg = Math.round(week.total / week.physicalDays);

                                return (
                                  <div key={weekKey} className="flex flex-col gap-0.5 sm:gap-1 mb-1 last:mb-0">
                                    <div
                                      className="flex justify-between items-center px-2 py-1.5 bg-white/5 hover:bg-white/10 cursor-pointer rounded-lg border border-white/5 transition-colors group"
                                      onClick={() => toggleWeekExpand(weekKey)}
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <div className={`p-0.5 rounded transition-transform ${isWeekExpanded ? 'rotate-90' : ''}`}>
                                          <ChevronRight className="w-3.5 h-3.5 text-white/50 group-hover:text-white/80" />
                                        </div>
                                        <span className="text-[10px] font-bold text-white/70 tracking-wider uppercase">{weekKey}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 sm:gap-2">
                                        <span className="text-[9px] sm:text-[10px] font-bold text-white/50 bg-black/40 px-1.5 py-0.5 rounded" title="Daily Average">
                                          Avg: {formatMinutes(weekAvg)}/d
                                        </span>
                                        <span className="text-[9px] sm:text-[10px] font-bold text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20" title="Week Total">
                                          {formatMinutes(week.total)}
                                        </span>
                                      </div>
                                    </div>
                                    {isWeekExpanded && week.days.map((date: string) => {
                                      const dTime = dailyTimes[date];
                                      return (
                                        <div key={date} className="flex flex-row items-center justify-between px-2 py-1.5 rounded-lg bg-black/40 border border-white/5 gap-2 ml-2 sm:ml-3 mt-0.5 hover:bg-black/60 transition-colors">
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/80" />
                                            <span className="font-semibold text-white/90 text-[10px] leading-none">
                                              {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </span>
                                          </div>

                                          <div className="flex items-center justify-end w-full gap-1.5 sm:gap-2 min-w-0">
                                            {dTime ? (
                                              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                                                {dTime.wakeupTime && (
                                                  <div className="flex items-center text-[9px] text-emerald-200 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                                                    <span className="font-bold">Wake: {new Date(dTime.wakeupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                  </div>
                                                )}
                                                {dTime.bedTime && (
                                                  <div className="flex items-center text-[9px] text-indigo-200 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 shrink-0">
                                                    <span className="font-bold">Last: {new Date(dTime.bedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                  </div>
                                                )}
                                              </div>
                                            ) : <div className="flex-1" />}

                                            <span className="font-black text-cyan-200 bg-cyan-500/20 px-1.5 py-0.5 rounded border border-cyan-500/30 text-[10px] shrink-0">
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

      {/* Friend Timetable Modal */}
      {showFriendTimetable && viewingFriend && (
        <div
          className="fixed inset-0 z-[10005] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 p-2 sm:p-4"
          onClick={() => setShowFriendTimetable(false)}
        >
          <div
            className="w-full max-w-3xl relative animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowFriendTimetable(false)}
              className="absolute -top-10 sm:-top-12 right-0 bg-white/10 hover:bg-white/20 p-1.5 sm:p-2 rounded-xl transition-colors text-white backdrop-blur-md border border-white/10"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <Timetable />
          </div>
        </div>
      )}
    </div>
  );
}