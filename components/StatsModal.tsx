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
        const prevDate = new Date(sortedDates[i-1]);
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
      className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-h-[85vh] max-w-3xl rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900 shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 flex flex-col border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-red-500 to-purple-600" />

        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-pink-500/10 rounded-full blur-[60px] pointer-events-none z-0"></div>

        {/* Header */}
        <div className="flex-none p-2 sm:p-3 flex justify-between items-center border-b border-white/10 bg-black/20 relative z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-sm sm:text-lg font-black tracking-tight flex items-center gap-1.5 text-white">
              <BarChart2 className="text-orange-500 w-4 h-4 sm:w-5 sm:h-5" /> {viewingFriend ? `${viewingFriend.username}'s Stats` : 'Focus History'}
            </h2>
            {currentStreak > 0 && (
              <div className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded flex items-center gap-1 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 animate-pulse" />
                <span className="text-xs sm:text-sm font-bold text-red-300" title={`Max Streak: ${maxStreak}`}>{currentStreak} Day{currentStreak !== 1 ? 's' : ''}</span>
              </div>
            )}
            {maxStreak > 0 && currentStreak === 0 && (
              <div className="px-2 py-0.5 bg-white/5 border border-white/10 rounded flex items-center gap-1">
                <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-white/40" />
                <span className="text-xs sm:text-sm font-bold text-white/50">Max: {maxStreak}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">

            <button
              onClick={handleClose}
              className="p-1 sm:p-1.5 bg-white/5 hover:bg-white/10 rounded-md sm:rounded-lg transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row relative z-10">

          {/* Sidebar: Overall Stats */}
          <div className="w-full md:w-[35%] border-b md:border-b-0 md:border-r border-white/10 bg-black/10 flex flex-col relative flex-none md:flex-1 shrink-0">
            <ScrollableWithArrows className="p-2 sm:p-3 flex flex-col gap-2 sm:gap-2.5">

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-1 gap-1.5 sm:gap-2">
                {/* Today */}
                <div className="p-2 sm:p-3 rounded-lg bg-blue-500/10 border border-blue-400/30 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                  <div className="absolute -right-2 -top-2 w-8 h-8 bg-blue-500/20 rounded-full blur-xl group-hover:bg-blue-500/30 transition-colors" />
                  <Clock className="mb-0.5 text-blue-300 w-4 h-4 sm:w-5 sm:h-5" />
                  <p className="text-base sm:text-xl font-black text-white leading-tight">{formatMinutes(todayMins)}</p>
                  <p className="text-[8px] sm:text-[9px] text-blue-200/70 uppercase tracking-widest mt-0.5 font-bold">Today's Focus</p>
                </div>

                {/* Yearly */}
                <div className="p-2 sm:p-3 rounded-lg bg-emerald-500/10 border border-emerald-400/30 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                  <div className="absolute -left-2 -bottom-2 w-8 h-8 bg-emerald-500/20 rounded-full blur-xl group-hover:bg-emerald-500/30 transition-colors" />
                  <Calendar className="mb-0.5 text-emerald-300 w-4 h-4 sm:w-5 sm:h-5" />

                  {prevYearTotal > 0 ? (
                    <div className="flex items-center justify-center gap-2 mt-0.5">
                      <div className="flex flex-col items-center">
                        <span className="text-base sm:text-lg font-black text-white leading-tight">{formatMinutes(currentYearTotal)}</span>
                        <span className="text-[7px] text-emerald-200/50 uppercase">{currentYear}</span>
                      </div>
                      <div className="w-px h-6 bg-white/10"></div>
                      <div className="flex flex-col items-center opacity-70">
                        <span className="text-sm font-bold text-white leading-tight">{formatMinutes(prevYearTotal)}</span>
                        <span className="text-[7px] text-emerald-200/50 uppercase">{currentYear - 1}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-base sm:text-xl font-black text-white leading-tight mt-0.5">{formatMinutes(currentYearTotal)}</span>
                  )}

                  <p className="text-[8px] sm:text-[9px] text-emerald-200/70 uppercase tracking-widest mt-1 font-bold">Yearly Total</p>
                </div>
              </div>

              {/* Quick Summary */}
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
                <h3 className="text-[8px] sm:text-[9px] font-bold text-white/50 uppercase tracking-widest mb-1.5 border-b border-white/10 pb-1">Quick Summary</h3>
                <div className="flex flex-col gap-1 text-[10px] sm:text-xs">
                  <div className="flex justify-between items-center bg-black/20 p-1 sm:p-1.5 rounded border border-white/5">
                    <span className="text-white/70 font-medium">Days Logged</span>
                    <span className="font-bold text-white px-1.5 py-px rounded bg-white/10">{dates.length}</span>
                  </div>
                  <div className="flex justify-between items-center bg-black/20 p-1 sm:p-1.5 rounded border border-white/5">
                    <span className="text-white/70 font-medium">This Week</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white px-1.5 py-px rounded bg-blue-500/20 text-blue-200 border border-blue-400/30" title="Total">
                        total : {formatMinutes(thisWeekTotal)}
                      </span>
                      <span className="font-bold text-white px-1.5 py-px rounded bg-emerald-500/20 text-emerald-200 border border-emerald-400/30" title="Daily Avg">
                        daily avg : {formatMinutes(thisWeekAvg)}/d
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-black/20 p-1 sm:p-1.5 rounded border border-white/5">
                    <span className="text-white/70 font-medium">Last Week</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white px-1.5 py-px rounded bg-purple-500/20 text-purple-200 border border-purple-400/30" title="Total">
                        total : {formatMinutes(lastWeekTotal)}
                      </span>
                      <span className="font-bold text-white px-1.5 py-px rounded bg-emerald-500/20 text-emerald-200 border border-emerald-400/30" title="Daily Avg">
                        daily avg : {formatMinutes(lastWeekAvg)}/d
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leaderboard / Timetable Link Button */}
              {viewingFriend ? (
                <button
                  onClick={() => setShowFriendTimetable(true)}
                  className="w-full mt-1 p-2 sm:p-2.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-white/10 hover:border-white/30 transition-all flex items-center justify-between group shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/10 rounded-md group-hover:scale-110 transition-transform">
                      <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-[10px] sm:text-[11px] font-bold text-white tracking-tight leading-tight">{viewingFriend.username}'s Timetable</h3>
                      <p className="text-[8px] sm:text-[9px] text-white/50 leading-tight">View weekly schedule</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </button>
              ) : (
                <div className="flex gap-1.5 mt-1 w-full">
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
                    className="flex-1 p-2 sm:p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-white/10 hover:border-white/30 transition-all flex items-center justify-between group shadow-md"
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="p-1 sm:p-1.5 bg-white/10 rounded-md group-hover:scale-110 transition-transform shrink-0">
                        <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />
                      </div>
                      <div className="text-left min-w-0">
                        <h3 className="text-[9px] sm:text-[10px] font-bold text-white tracking-tight leading-tight truncate">Leaderboard</h3>
                      </div>
                    </div>
                    <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
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
                    className="flex-1 p-2 sm:p-2 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-white/10 hover:border-white/30 transition-all flex items-center justify-between group shadow-md"
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="p-1 sm:p-1.5 bg-white/10 rounded-md group-hover:scale-110 transition-transform shrink-0">
                        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                      </div>
                      <div className="text-left min-w-0">
                        <h3 className="text-[9px] sm:text-[10px] font-bold text-white tracking-tight leading-tight truncate">Friends</h3>
                      </div>
                    </div>
                    <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                </div>
              )}
            </ScrollableWithArrows>
          </div>

          {/* Main Content: History */}
          <div className="flex-1 bg-transparent relative flex flex-col md:w-[65%]">
            <ScrollableWithArrows className="p-1.5 sm:p-2.5">
              <h3 className="text-[9px] sm:text-[10px] font-bold tracking-widest text-white/70 uppercase mb-1.5 sticky top-0 bg-black/40 backdrop-blur-md p-1.5 rounded-md border border-white/10 z-10 text-center">
                Monthly Breakdown
              </h3>

              <div className="flex flex-col gap-1.5 sm:gap-2">
                {sortedMonths.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-24 sm:h-32 opacity-50 bg-black/20 rounded-lg border border-white/10">
                    <Calendar className="mb-1 w-6 h-6 sm:w-8 sm:h-8 text-white/40" />
                    <p className="text-[10px] sm:text-xs font-medium text-white/70 text-center">No focus sessions recorded yet.</p>
                  </div>
                ) : (
                  sortedMonths.map(monthKey => {
                    const data = monthlyData[monthKey];
                    const isMonthExpanded = expandedMonths[monthKey];

                    return (
                      <div key={monthKey} className="flex flex-col rounded-lg bg-white/5 border border-white/20 overflow-hidden shadow-sm">

                        {/* Month Header */}
                        <div
                          className="flex justify-between items-center p-1.5 sm:p-2 cursor-pointer hover:bg-white/10 transition-colors group relative bg-black/20"
                          onClick={() => toggleMonthExpand(monthKey)}
                        >
                          <div className="flex items-center gap-1.5 relative z-10">
                            <div className="p-1 bg-orange-500/20 rounded-md group-hover:bg-orange-500/30 transition-colors border border-orange-400/30">
                              <CalendarDays className="text-orange-300 w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </div>
                            <div>
                              <h4 className="text-[11px] sm:text-xs font-bold text-white tracking-tight leading-none">{data.name}</h4>
                              <p className="text-[8px] sm:text-[9px] text-white/50 mt-0.5 leading-none">{data.days.length} days active</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 relative z-10">
                            <div className="text-right">
                              <span className="block text-[11px] sm:text-xs font-black text-orange-300 leading-none">{formatMinutes(data.total)}</span>
                            </div>
                            <div className={`p-0.5 rounded bg-white/10 transition-transform ${isMonthExpanded ? 'rotate-180' : ''}`}>
                              <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/70" />
                            </div>
                          </div>
                        </div>

                        {/* Days inside Month */}
                        {isMonthExpanded && (
                          <div className="flex flex-col p-1 sm:p-1.5 bg-black/20 gap-0.5 sm:gap-1 border-t border-white/5">
                            {data.days.map((date: string) => {
                              const dTime = dailyTimes[date];
                              return (
                                <div key={date} className="flex flex-row items-center justify-between p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors border border-white/10 gap-1.5 sm:gap-2">

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <div className="w-1 h-1 rounded-full bg-orange-400" />
                                    <span className="font-semibold text-white/90 text-[9px] sm:text-[10px] leading-none">
                                      {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-end w-full gap-1.5 sm:gap-2">
                                    {dTime ? (
                                      <div className="flex items-center gap-0.5 sm:gap-1">
                                        {dTime.wakeupTime && (
                                          <div className="flex items-center gap-0.5 text-[8px] sm:text-[9px] text-blue-200 bg-blue-500/20 px-1 py-px rounded border border-blue-400/30">
                                            <span className="font-bold leading-none">Wake: {new Date(dTime.wakeupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                          </div>
                                        )}
                                        {dTime.bedTime && (
                                          <div className="flex items-center gap-0.5 text-[8px] sm:text-[9px] text-indigo-200 bg-indigo-500/20 px-1 py-px rounded border border-indigo-400/30">
                                            <span className="font-bold leading-none">Last Active: {new Date(dTime.bedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                          </div>
                                        )}
                                      </div>
                                    ) : <div className="flex-1" />}

                                    <span className="font-bold text-orange-200 bg-orange-500/20 px-1 py-px rounded border border-orange-400/30 text-[9px] sm:text-[10px] leading-none shrink-0">
                                      {formatMinutes(history[date] as number)}
                                    </span>
                                  </div>

                                </div>
                              );
                            })}
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
        <div
          className="fixed inset-0 z-[10005] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 p-2 sm:p-4"
          onClick={() => setShowFriendTimetable(false)}
        >
          <div
            className="w-full max-w-3xl relative animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowFriendTimetable(false)}
              className="absolute -top-10 sm:-top-12 right-0 bg-white/10 hover:bg-white/20 p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-colors text-white"
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