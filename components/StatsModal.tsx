'use client';
import { useDashboardStore } from '@/store/dashboardStore';
import { X, Flame, CalendarDays, Trophy, ChevronRight, Users, BarChart2, Ghost, Crown, Zap, TrendingUp, TrendingDown, ChevronDown, Activity } from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { getLocalDateString } from '@/utils/date';
import ScrollableWithArrows from './ScrollableWithArrows';
import Timetable from './Timetable';

export default function StatsModal() {
  const { history: myHistory, dailyTimes: myDailyTimes, isStatsOpen, toggleStats, viewingFriend, setViewingFriend, theme } = useDashboardStore();
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
  
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});
  const [showFriendTimetable, setShowFriendTimetable] = useState(false);
  
  // Custom threshold for Deep Work Consistency (default: 3 hours)
  const [deepThresholdHrs, setDeepThresholdHrs] = useState(3);
  // Heatmap Hover State
  const [activeHeatmapDay, setActiveHeatmapDay] = useState<{ dateStr: string, mins: number } | null>(null);

  const history = viewingFriend ? viewingFriend.stats.history || {} : myHistory;
  const dailyTimes = viewingFriend ? viewingFriend.stats.dailyTimes || {} : myDailyTimes;

  const heatmapScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isStatsOpen && heatmapScrollRef.current) {
      setTimeout(() => {
        heatmapScrollRef.current?.scrollTo({
          left: heatmapScrollRef.current.scrollWidth,
          behavior: 'smooth'
        });
      }, 150); // slight delay ensures modal is fully rendered before scrolling
    }
  }, [isStatsOpen]);

  useEffect(() => {
    if (theme === 'auto') {
      setResolvedTheme(new Date().getHours() >= 6 && new Date().getHours() < 18 ? 'light' : 'dark');
    } else setResolvedTheme(theme as 'light' | 'dark');
  }, [theme]);
  const isLight = resolvedTheme === 'light';

  useEffect(() => {
    if (isStatsOpen) {
      const d = new Date();
      setExpandedMonths({ [`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`]: true });
    }
  }, [isStatsOpen]);

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

  // --- MEGA DATA CALCULATOR ---
  const stats = useMemo(() => {
    const dates = Object.keys(history).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const todayStr = getLocalDateString();
    const todayObj = new Date();
    
    const getLocalStr = (d: Date) => {
      const offset = d.getTimezoneOffset();
      return new Date(d.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
    };

    const yesterdayObj = new Date(todayObj); yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterdayStr = getLocalStr(yesterdayObj);
    
    const todayMins = history[todayStr] as number || 0;
    const yesterdayMins = history[yesterdayStr] as number || 0;

    // --- Ghost Tracker: Monthly Pacing ---
    const currentDayOfMonth = todayObj.getDate(); 
    let thisMonthSoFar = 0;
    let lastMonthToSameDay = 0;

    const prevMonthObj = new Date(todayObj.getFullYear(), todayObj.getMonth() - 1, 1);
    const daysInLastMonth = new Date(prevMonthObj.getFullYear(), prevMonthObj.getMonth() + 1, 0).getDate();
    const targetLastMonthDay = Math.min(currentDayOfMonth, daysInLastMonth);

    for (let day = 1; day <= currentDayOfMonth; day++) {
      const d = new Date(todayObj.getFullYear(), todayObj.getMonth(), day);
      thisMonthSoFar += (history[getLocalStr(d)] as number) || 0;
    }

    for (let day = 1; day <= targetLastMonthDay; day++) {
      const d = new Date(prevMonthObj.getFullYear(), prevMonthObj.getMonth(), day);
      lastMonthToSameDay += (history[getLocalStr(d)] as number) || 0;
    }

    // --- Ghost Tracker: Weekly Pacing ---
    let thisWeekSoFar = 0;
    let lastWeekToSameDay = 0;
    const currentDayOfWeek = todayObj.getDay() === 0 ? 7 : todayObj.getDay();

    for (let i = 0; i < currentDayOfWeek; i++) {
      const d1 = new Date(todayObj); d1.setDate(todayObj.getDate() - i);
      const d2 = new Date(todayObj); d2.setDate(todayObj.getDate() - i - 7);
      thisWeekSoFar += (history[getLocalStr(d1)] as number || 0);
      lastWeekToSameDay += (history[getLocalStr(d2)] as number || 0);
    }

    // --- Trophies & Streaks ---
    let bestDayMins = 0; let bestDayDate = '';
    let best7DaySum = 0; let best7DayEnd = '';
    let maxStreak = 0; let tempStreak = 0;
    let daysOver1h = 0; let daysOverDeep = 0;
    let totalMins = 0;

    const datesAsc = [...dates].reverse(); 
    for (let i = 0; i < datesAsc.length; i++) {
      const dStr = datesAsc[i];
      const mins = history[dStr] as number;
      totalMins += mins;

      if (mins > bestDayMins) { bestDayMins = mins; bestDayDate = dStr; }

      if (mins >= 60) {
        if (i > 0 && Math.round((new Date(dStr).getTime() - new Date(datesAsc[i - 1]).getTime()) / 86400000) === 1) tempStreak++; 
        else tempStreak = 1;
        if (tempStreak > maxStreak) maxStreak = tempStreak;
      } else tempStreak = 0;
    }

    if (datesAsc.length > 0) {
      const firstDate = new Date(datesAsc[0]);
      for (let d = new Date(firstDate); d <= todayObj; d.setDate(d.getDate() + 1)) {
        let windowSum = 0;
        for (let i = 0; i < 7; i++) {
          const checkDate = new Date(d); checkDate.setDate(d.getDate() - i);
          windowSum += (history[getLocalStr(checkDate)] as number || 0);
        }
        if (windowSum > best7DaySum) { best7DaySum = windowSum; best7DayEnd = getLocalStr(d); }
      }
    }

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(todayObj); checkDate.setDate(todayObj.getDate() - i);
      const mins = history[getLocalStr(checkDate)] as number || 0;
      if (mins >= 60) daysOver1h++;
      if (mins >= deepThresholdHrs * 60) daysOverDeep++;
    }

    // --- MONTHLY HEATMAP GENERATOR (Last 6 Months) ---
    const heatmapMonths = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(todayObj.getFullYear(), todayObj.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthName = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
      
      const gridDays = [];
      for (let pad = 0; pad < firstDayOfWeek; pad++) { gridDays.push(null); }
      
      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        if (currentDate > todayObj) {
          gridDays.push(null);
        } else {
          const dateStr = getLocalStr(currentDate);
          gridDays.push({ dateStr, mins: (history[dateStr] as number) || 0 });
        }
      }
      heatmapMonths.push({ monthName, gridDays });
    }

    // --- Timeline Archive ---
    const monthlyData = dates.reduce((acc, date) => {
      const d = new Date(date);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthName = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!acc[monthKey]) acc[monthKey] = { name: monthName, total: 0, days: [] };
      acc[monthKey].total += history[date] || 0;
      acc[monthKey].days.push(date);
      return acc;
    }, {} as Record<string, { name: string, total: number, days: string[] }>);

    // --- Current Streak ---
    let currentStreak = 0;
    const streakCheckDate = new Date(todayObj); streakCheckDate.setHours(0, 0, 0, 0);
    const yesterdayCheck = new Date(streakCheckDate); yesterdayCheck.setDate(yesterdayCheck.getDate() - 1);
    let activeDate = streakCheckDate;
    if (!history[getLocalStr(streakCheckDate)] || history[getLocalStr(streakCheckDate)] < 60) activeDate = yesterdayCheck;
    while (history[getLocalStr(activeDate)] && history[getLocalStr(activeDate)] >= 60) {
      currentStreak++; activeDate.setDate(activeDate.getDate() - 1);
    }
    if (currentStreak > maxStreak) maxStreak = currentStreak;

    return {
      todayMins, yesterdayMins, thisWeekSoFar, lastWeekToSameDay,
      thisMonthSoFar, lastMonthToSameDay,
      bestDayMins, bestDayDate, best7DaySum, best7DayEnd, maxStreak, currentStreak, totalMins,
      consistency1h: Math.round((daysOver1h / 30) * 100),
      consistencyDeep: Math.round((daysOverDeep / 30) * 100),
      heatmapMonths, monthlyData, dates
    };
  }, [history, deepThresholdHrs]);

  const sortedMonths = Object.keys(stats.monthlyData).sort((a, b) => b.localeCompare(a));
  const toggleMonthExpand = (month: string) => setExpandedMonths(prev => ({ ...prev, [month]: !prev[month] }));
  const toggleWeekExpand = (weekKey: string) => setExpandedWeeks(prev => ({ ...prev, [weekKey]: !prev[weekKey] }));

  const formatMins = (mins: number) => {
    const isNegative = mins < 0;
    const absMins = Math.abs(mins);
    if (absMins < 60) return `${isNegative ? '-' : ''}${absMins}m`;
    const h = Math.floor(absMins / 60); 
    const m = absMins % 60;
    const formattedTime = m > 0 ? `${h}h ${m}m` : `${h}h`;
    return isNegative ? `-${formattedTime}` : formattedTime;
  };
  
  const formatDate = (dateStr: string) => !dateStr ? '' : new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  const formatDisplayDate = (dateStr: string) => !dateStr ? '' : new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  // --- Adjusted Heatmap Colors (Brighter in Dark Mode) ---
  const getIntensityClass = (mins: number) => {
    if (mins < 60) return isLight ? 'bg-slate-100 border border-slate-200' : 'bg-slate-800/60 border border-slate-700';
    if (mins < 180) return isLight ? 'bg-emerald-300' : 'bg-emerald-700/80 border border-emerald-600/50';
    if (mins < 300) return isLight ? 'bg-emerald-400' : 'bg-emerald-500 border border-emerald-400';
    if (mins < 480) return isLight ? 'bg-emerald-500 shadow-sm' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] border border-emerald-300';
    return isLight ? 'bg-emerald-600 shadow-md' : 'bg-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.8)] border border-emerald-200';
  };

  const ghostPercent = stats.yesterdayMins === 0 ? (stats.todayMins > 0 ? 100 : 0) : Math.min(100, Math.round((stats.todayMins / stats.yesterdayMins) * 100));
  const defeatedGhost = stats.todayMins > stats.yesterdayMins && stats.yesterdayMins > 0;
  const weeklyDiff = stats.thisWeekSoFar - stats.lastWeekToSameDay;
  const aheadOfPace = weeklyDiff >= 0;

  const monthlyDiff = stats.thisMonthSoFar - stats.lastMonthToSameDay;
  const aheadOfMonthPace = monthlyDiff >= 0;

  if (!isStatsOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" onClick={handleClose}>
      <div className={`relative w-full h-[98vh] md:h-auto md:max-h-[82vh] max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border transition-colors ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-900 border-slate-700/60'}`} onClick={(e) => e.stopPropagation()}>
        
        {/* Glow Header Accent */}
        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${isLight ? 'from-blue-400 via-indigo-500 to-purple-500' : 'from-cyan-400 via-blue-500 to-purple-500'} opacity-100 z-50`} />

        {/* Modal Header */}
        <div className={`flex-none px-4 py-2.5 flex justify-between items-center border-b shrink-0 z-40 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'}`}>
          <div className="flex items-center gap-2.5">
            <h2 className={`text-sm md:text-base font-black tracking-tight flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
              <BarChart2 className="text-blue-500 w-4 h-4 md:w-5 md:h-5" /> 
              {viewingFriend ? `${viewingFriend.username}'s Arsenal` : 'Focus Arsenal'}
            </h2>
            {stats.currentStreak > 0 && (
              <div className={`px-2 py-0.5 rounded-md flex items-center gap-1.5 shadow-sm border ${isLight ? 'bg-red-50 border-red-200 text-red-600' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                <Flame className="w-3 h-3 md:w-3.5 md:h-3.5 animate-pulse drop-shadow-md" />
                <span className="text-[10px] font-bold">{stats.currentStreak} D</span>
              </div>
            )}
          </div>
          <button onClick={handleClose} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-500' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200'}`}>
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        {/* Dual Panel Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative z-10 min-h-0">

          {/* LEFT SIDEBAR */}
          <div className={`w-full md:w-[35%] lg:w-[32%] border-b md:border-b-0 md:border-r flex flex-col shrink-0 overflow-y-auto custom-scrollbar ${isLight ? 'bg-slate-50/50 border-slate-200' : 'bg-slate-800/20 border-slate-800'}`}>
            <div className="p-2.5 md:p-3 flex flex-col gap-2.5">

              {/* Ghost Tracker */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 ml-1">
                  <Ghost className={`w-3.5 h-3.5 ${isLight ? 'text-indigo-500' : 'text-indigo-400'}`} />
                  <h3 className={`text-[9px] font-black uppercase tracking-widest ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Beat Your Ghost</h3>
                </div>

                <div className={`p-2.5 rounded-xl border transition-all shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-slate-800/50 border-slate-700/50'}`}>
                  <div className="flex justify-between items-end mb-1.5">
                    <div className="flex flex-col">
                      <span className={`text-[8px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Vs Yesterday</span>
                      <span className={`text-xs md:text-sm font-black tracking-tight mt-0.5 ${defeatedGhost ? 'text-green-500 drop-shadow-sm' : isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
                        {defeatedGhost ? 'Ghost Defeated! 🏆' : `${formatMins(stats.todayMins)} / ${formatMins(stats.yesterdayMins)}`}
                      </span>
                    </div>
                    {!defeatedGhost && stats.yesterdayMins > 0 && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-700/50 text-slate-300'}`}>
                        {formatMins(stats.yesterdayMins - stats.todayMins)} left
                      </span>
                    )}
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden shadow-inner ${isLight ? 'bg-slate-200' : 'bg-slate-900'}`}>
                    <div className={`h-full transition-all duration-1000 ease-out relative ${defeatedGhost ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]'}`} style={{ width: `${ghostPercent}%` }}>
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/30 to-transparent" />
                    </div>
                  </div>
                </div>

                {/* Weekly & Monthly Pacing */}
                <div className="grid grid-cols-2 gap-1.5">
                  {/* Weekly Pace */}
                  <div className={`p-2 rounded-xl border flex flex-col justify-center shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-slate-800/50 border-slate-700/50'}`}>
                    <span className={`text-[8px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Weekly Pace</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-[9px] font-medium truncate ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Vs last week</span>
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border shadow-inner ${aheadOfPace ? (isLight ? 'bg-green-50 text-green-700 border-green-200' : 'bg-green-500/10 text-green-400 border-green-500/20') : (isLight ? 'bg-red-50 text-red-700 border-red-200' : 'bg-red-500/10 text-red-400 border-red-500/20')}`}>
                        {aheadOfPace ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span className="text-[9px] font-black">{aheadOfPace ? '+' : ''}{formatMins(weeklyDiff)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Pace */}
                  <div className={`p-2 rounded-xl border flex flex-col justify-center shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-slate-800/50 border-slate-700/50'}`}>
                    <span className={`text-[8px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Monthly Pace</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-[9px] font-medium truncate ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Vs last month</span>
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border shadow-inner ${aheadOfMonthPace ? (isLight ? 'bg-green-50 text-green-700 border-green-200' : 'bg-green-500/10 text-green-400 border-green-500/20') : (isLight ? 'bg-red-50 text-red-700 border-red-200' : 'bg-red-500/10 text-red-400 border-red-500/20')}`}>
                        {aheadOfMonthPace ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span className="text-[9px] font-black">{aheadOfMonthPace ? '+' : ''}{formatMins(monthlyDiff)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trophies Grid */}
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                <div className={`group flex flex-col p-2 rounded-xl border shadow-sm transition-transform cursor-default ${isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-500/5 border-amber-500/20'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Crown className={`w-3 h-3 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                    <span className={`text-[8px] font-black uppercase tracking-widest ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>Titan Day</span>
                  </div>
                  <div className={`text-sm font-black leading-none tracking-tight ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{formatMins(stats.bestDayMins)}</div>
                  <div className={`text-[8px] font-medium mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{stats.bestDayMins > 0 ? formatDate(stats.bestDayDate) : '-'}</div>
                </div>

                <div className={`group flex flex-col p-2 rounded-xl border shadow-sm transition-transform cursor-default ${isLight ? 'bg-purple-50/50 border-purple-200' : 'bg-purple-500/5 border-purple-500/20'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap className={`w-3 h-3 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
                    <span className={`text-[8px] font-black uppercase tracking-widest ${isLight ? 'text-purple-700' : 'text-purple-400'}`}>Perfect Week</span>
                  </div>
                  <div className={`text-sm font-black leading-none tracking-tight ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{formatMins(stats.best7DaySum)}</div>
                  <div className={`text-[8px] font-medium mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{stats.best7DaySum > 0 ? `End ${formatDate(stats.best7DayEnd)}` : '-'}</div>
                </div>

                <div className={`group flex flex-col p-2 rounded-xl border shadow-sm transition-transform cursor-default ${isLight ? 'bg-blue-50/50 border-blue-200' : 'bg-blue-500/5 border-blue-500/20'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <CalendarDays className={`w-3 h-3 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
                    <span className={`text-[8px] font-black uppercase tracking-widest ${isLight ? 'text-blue-700' : 'text-blue-400'}`}>30d Base (≥1h)</span>
                  </div>
                  <div className={`text-sm font-black leading-none tracking-tight ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{stats.consistency1h}%</div>
                  <div className={`text-[8px] font-medium mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Consistency Score</div>
                </div>
                
                <div className={`group flex flex-col p-2 rounded-xl border shadow-sm transition-transform cursor-default ${isLight ? 'bg-emerald-50/50 border-emerald-200' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                  <div className="flex items-center gap-1 mb-1">
                    <div className={`text-[8px] font-black uppercase tracking-widest flex items-center ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                      <p>30d Deep (≥)
                      <input
                        type="text" value={deepThresholdHrs || ''} placeholder="3"
                        onChange={(e) => setDeepThresholdHrs(Math.min(24, Number(e.target.value)))}
                        onBlur={(e) => { if (e.target.value === '') setDeepThresholdHrs(3); }}
                        className={`w-6 bg-transparent text-center font-bold mx-0.5 rounded border focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isLight ? 'border-emerald-300 focus:border-emerald-500 text-emerald-800' : 'border-emerald-500/30 focus:border-emerald-400 text-emerald-200'}`}
                      />h</p>
                    </div>
                  </div>
                  <div className={`text-sm font-black leading-none tracking-tight ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{stats.consistencyDeep}%</div>
                  <div className={`text-[8px] font-medium mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Consistency Score</div>
                </div>
              </div>

              {/* ROUTING BUTTONS */}
              <div className="flex gap-1.5 w-full mt-1">
                {viewingFriend ? (
                  <button onClick={() => setShowFriendTimetable(true)} className={`flex-1 p-2 rounded-xl transition-all flex items-center justify-between group border shadow-sm hover:scale-[1.02] active:scale-95 ${isLight ? 'bg-white hover:bg-cyan-50 border-cyan-200' : 'bg-slate-800/50 hover:bg-cyan-900/20 border-cyan-500/30'}`}>
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className={`w-3.5 h-3.5 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`} />
                      <h3 className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-cyan-800' : 'text-cyan-100'}`}>Timetable</h3>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-1 ${isLight ? 'text-cyan-500' : 'text-cyan-400/80'}`} />
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
                    }} className={`flex-1 p-2 rounded-xl transition-all flex items-center justify-center gap-1.5 group border shadow-sm hover:scale-[1.02] active:scale-95 ${isLight ? 'bg-white hover:bg-purple-50 border-purple-200' : 'bg-slate-800/50 hover:bg-purple-900/20 border-purple-500/30'}`}>
                      <Trophy className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
                      <h3 className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-purple-800' : 'text-purple-100'}`}>Ranks</h3>
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
                    }} className={`flex-1 p-2 rounded-xl transition-all flex items-center justify-center gap-1.5 group border shadow-sm hover:scale-[1.02] active:scale-95 ${isLight ? 'bg-white hover:bg-emerald-50 border-emerald-200' : 'bg-slate-800/50 hover:bg-emerald-900/20 border-emerald-500/30'}`}>
                      <Users className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                      <h3 className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-emerald-800' : 'text-emerald-100'}`}>Friends</h3>
                    </button>
                  </>
                )}
              </div>

            </div>
          </div>

          {/* RIGHT SIDEBAR: Heatmap + Timeline Archive */}
          <div className="flex-1 relative flex flex-col overflow-y-auto custom-scrollbar pb-10 md:pb-0 min-h-0">
            <ScrollableWithArrows className="p-2.5 md:p-3 h-full flex flex-col gap-2.5">
              
              {/* MONTHLY HEATMAP */}
              <div className={`p-2.5 rounded-xl border flex flex-col gap-1.5 shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-slate-800/50 border-slate-700/50'}`}>
                <div className="flex justify-between items-center px-1 mb-0.5 h-6">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Activity className={`w-3.5 h-3.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                    <h3 className={`text-[9px] font-black uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Focus Heatmap</h3>
                  </div>
                  
                  <div className="flex items-center justify-end h-full">
                    {(() => {
                      const todayStr = getLocalDateString();
                      const todayMins = (history[todayStr] as number) || 0;
                      const displayDay = activeHeatmapDay || { dateStr: todayStr, mins: todayMins };
                      const isShowingToday = !activeHeatmapDay;

                      return (
                        <div className={`text-[9px] font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                          {isShowingToday && <span className={`text-[7px] uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Today</span>}
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'}`}>
                           { formatMins(displayDay.mins)}
                          </span>
                          <span className="w-[70px] sm:w-[80px] text-right truncate">
                            {formatDisplayDate(displayDay.dateStr)}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div ref={heatmapScrollRef} className="flex gap-2 w-full overflow-x-auto custom-scrollbar pb-1.5 relative scroll-smooth">
                  <div className={`flex flex-col justify-between text-[7px] font-bold uppercase tracking-widest py-1 shrink-0 mt-[16px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span>S</span><span className="invisible">M</span><span>T</span><span className="invisible">W</span><span>T</span><span className="invisible">F</span><span>S</span>
                  </div>
                  
                  {stats.heatmapMonths.map((month) => (
                    <div key={month.monthName} className="flex flex-col gap-1 shrink-0">
                      <span className={`text-[8px] font-bold uppercase tracking-widest pl-0.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                        {month.monthName}
                      </span>
                      <div className="grid grid-rows-7 grid-flow-col gap-[2px] sm:gap-[3px] w-max">
                        {month.gridDays.map((day, idx) => {
                          if (!day) return <div key={`pad-${idx}`} className="w-2.5 h-2.5 sm:w-3 sm:h-3" />;
                          return (
                            <div 
                              key={day.dateStr} 
                              onMouseEnter={() => setActiveHeatmapDay(day)} 
                              onMouseLeave={() => setActiveHeatmapDay(null)} 
                              onClick={() => setActiveHeatmapDay(day)}
                              className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[2px] transition-all cursor-pointer hover:ring-[1.5px] hover:ring-offset-[1px] ${isLight ? 'hover:ring-emerald-400 hover:ring-offset-white' : 'hover:ring-emerald-400 hover:ring-offset-slate-900'} ${getIntensityClass(day.mins)}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline Archive */}
              <div className={`sticky top-0 z-20 backdrop-blur-xl border rounded-lg p-1.5 mt-0.5 flex justify-center shadow-sm ${isLight ? 'bg-white/90 border-slate-200' : 'bg-slate-900/95 border-slate-700/60'}`}>
                <h3 className={`text-[9px] font-black tracking-widest uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Timeline Archive</h3>
              </div>

              <div className="flex flex-col gap-1.5">
                {sortedMonths.length === 0 ? (
                  <div className={`flex flex-col items-center justify-center h-20 opacity-60 rounded-xl border mt-1 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/40 border-slate-700/50'}`}>
                    <p className={`text-[10px] font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>No sessions recorded yet.</p>
                  </div>
                ) : (
                  sortedMonths.map(monthKey => {
                    const data = stats.monthlyData[monthKey];
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
            </ScrollableWithArrows>
          </div>
        </div>
      </div>

      {/* FRIEND TIMETABLE OVERLAY */}
      {showFriendTimetable && viewingFriend && (
        <div className="fixed inset-0 z-[10005] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in" onClick={() => setShowFriendTimetable(false)}>
          <div className="w-full max-w-4xl relative animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowFriendTimetable(false)} className={`absolute -top-12 right-0 p-2 rounded-xl transition-colors border ${isLight ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'}`}>
              <X className="w-5 h-5" />
            </button>
            <Timetable />
          </div>
        </div>
      )}
    </div>
  );
}