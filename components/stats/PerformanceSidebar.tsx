'use client';
import { Ghost, TrendingUp, TrendingDown, Crown, Zap, CalendarDays, ChevronRight, Trophy, Users } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboardStore';

interface Props {
  stats: any;
  isLight: boolean;
  formatMins: (mins: number) => string;
  formatDate: (dateStr: string) => string;
  deepThresholdHrs: number;
  setDeepThresholdHrs: (val: number) => void;
  viewingFriend: any;
  setShowFriendTimetable?: (val: boolean) => void;
  handleClose: () => void;
  isPublicView?: boolean;
}

export default function PerformanceSidebar({ stats, isLight, formatMins, formatDate, deepThresholdHrs, setDeepThresholdHrs, viewingFriend, setShowFriendTimetable, handleClose, isPublicView }: Props) {
  const ghostPercent = stats.yesterdayMins === 0 ? (stats.todayMins > 0 ? 100 : 0) : Math.min(100, Math.round((stats.todayMins / stats.yesterdayMins) * 100));
  const defeatedGhost = stats.todayMins > stats.yesterdayMins && stats.yesterdayMins > 0;
  const weeklyDiff = stats.thisWeekSoFar - stats.lastWeekToSameDay;
  const aheadOfPace = weeklyDiff >= 0;
  const monthlyDiff = stats.thisMonthSoFar - stats.lastMonthToSameDay;
  const aheadOfMonthPace = monthlyDiff >= 0;

  const navigateToTab = (tab: 'leaderboard' | 'friends') => {
    if (viewingFriend) useDashboardStore.getState().setViewingFriend(null);
    if (typeof window !== 'undefined') sessionStorage.removeItem('returnToConnect');
    handleClose();
    const store = useDashboardStore.getState();
    if (!store.isSettingsOpen) store.toggleSettings();
    store.setConnectInitialTab(tab);
    store.setSettingsActiveTab('connect');
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('force-settings-tab', { detail: 'connect' }));
  };

  return (
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

{/* Routing Buttons - HIDDEN ON PUBLIC LEADERBOARD */}
      {!isPublicView && (
        <div className="flex gap-1.5 w-full mt-1">
          {viewingFriend ? (
            <button onClick={() => setShowFriendTimetable && setShowFriendTimetable(true)} className={`flex-1 p-2 rounded-xl transition-all flex items-center justify-between group border shadow-sm hover:scale-[1.02] active:scale-95 ${isLight ? 'bg-white hover:bg-cyan-50 border-cyan-200' : 'bg-slate-800/50 hover:bg-cyan-900/20 border-cyan-500/30'}`}>
              <div className="flex items-center gap-1.5">
                <CalendarDays className={`w-3.5 h-3.5 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`} />
                <h3 className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-cyan-800' : 'text-cyan-100'}`}>Timetable</h3>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-1 ${isLight ? 'text-cyan-500' : 'text-cyan-400/80'}`} />
            </button>
          ) : (
            <>
              <button onClick={() => navigateToTab('leaderboard')} className={`flex-1 p-2 rounded-xl transition-all flex items-center justify-center gap-1.5 group border shadow-sm hover:scale-[1.02] active:scale-95 ${isLight ? 'bg-white hover:bg-purple-50 border-purple-200' : 'bg-slate-800/50 hover:bg-purple-900/20 border-purple-500/30'}`}>
                <Trophy className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
                <h3 className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-purple-800' : 'text-purple-100'}`}>Ranks</h3>
              </button>
              <button onClick={() => navigateToTab('friends')} className={`flex-1 p-2 rounded-xl transition-all flex items-center justify-center gap-1.5 group border shadow-sm hover:scale-[1.02] active:scale-95 ${isLight ? 'bg-white hover:bg-emerald-50 border-emerald-200' : 'bg-slate-800/50 hover:bg-emerald-900/20 border-emerald-500/30'}`}>
                <Users className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                <h3 className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-emerald-800' : 'text-emerald-100'}`}>Friends</h3>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}