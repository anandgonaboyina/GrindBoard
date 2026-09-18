'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Info, RefreshCw, WifiOff, ChevronDown, Clock, ShieldAlert, Flame, Search, Sparkles, X } from 'lucide-react';
import ScrollableWithArrows from '../ScrollableWithArrows';

interface LeaderboardTabProps {
  setSelectedImageOverlay: (overlay: any) => void;
}

export default function LeaderboardTab({ setSelectedImageOverlay }: LeaderboardTabProps) {
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [leaderboardFilter, setLeaderboardFilter] = useState<'today' | 'week' | 'month'>('today');
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'current' | 'previous'>('current');
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardSearch, setLeaderboardSearch] = useState('');
  const [expandedLeaderboardUserId, setExpandedLeaderboardUserId] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      const token = localStorage.getItem('dashboard_sync_token');
      const offset = new Date().getTimezoneOffset();
      const res = await fetch(`/api/leaderboard?offset=${offset}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (res.ok && data.leaderboard) {
        setLeaderboardData(data.leaderboard);
      }
    } catch (e) {} finally {
      setLeaderboardLoading(false);
    }
  };

  function LeaderboardLoadingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-6 w-full animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500/30 via-yellow-500/40 to-amber-300/20 border-2 border-yellow-400/60 flex items-center justify-center shadow-[0_0_25px_rgba(234,179,8,0.4)] animate-pulse">
          <Trophy className="w-7 h-7 text-yellow-300 animate-bounce" />
        </div>
        <div className="absolute -inset-1.5 rounded-full border border-yellow-400/40 border-t-yellow-300 animate-spin" style={{ animationDuration: '2s' }}></div>
        <div className="absolute -top-1 -right-1">
          <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
        <span className="text-xs font-bold tracking-wider text-yellow-300/90 uppercase animate-pulse">
          Computing Leaderboard Rankings...
        </span>
        <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
      </div>

      <div className="w-full flex flex-col gap-2 mt-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-amber-950/20 via-black/40 to-yellow-950/20 border border-yellow-500/10 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-[10px] font-bold text-yellow-400">#{i}</div>
              <div className="w-7 h-7 rounded-full bg-white/10"></div>
              <div className="h-3 w-24 bg-white/15 rounded"></div>
            </div>
            <div className="h-4 w-16 bg-yellow-500/20 rounded-md"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

  return (
    <div className="flex flex-col gap-1 md:gap-2 w-full lg:max-w-3xl mx-auto min-w-0 h-full overflow-hidden">
      {/* Search Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-1 min-w-0 w-full shrink-0">
        <h4 className="text-xs md:text-sm font-bold flex items-center gap-1 truncate">
          <Trophy className="text-yellow-400 w-3 h-3 md:w-4 md:h-4 shrink-0" />
          <span className="truncate">Global Leaderboard</span>
          <button onClick={() => setShowInfoModal(true)} className="ml-1 px-1.5 py-0.5 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors shrink-0 flex items-center gap-1">
            <span className="text-[12px] font-semibold hidden md:inline">About Leaderboard</span>
            <Info className="w-4 h-4" />
          </button>
        </h4>
        <button onClick={fetchLeaderboard} className="p-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 shrink-0">
          <RefreshCw className={`w-4 h-4 ${leaderboardLoading ? "animate-spin text-blue-400" : "text-white/60"}`} />
        </button>
      </div>

      { <div className="flex flex-col gap-1 md:gap-2 w-full lg:max-w-3xl mx-auto min-w-0 h-full overflow-hidden">


          {typeof navigator !== 'undefined' && !navigator.onLine && (
            <div className="w-full px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] md:text-xs font-medium flex items-center justify-between gap-2 shadow-sm my-1 shrink-0 animate-in fade-in">
              <div className="flex items-center gap-1.5 min-w-0">
                <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Offline Mode: Live ranks won't update. Showing cached/local stats.</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 text-[9px] font-mono shrink-0 uppercase font-bold">Offline</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5 w-full shrink-0 items-center justify-center">
            <div className="w-full">
              <div className="relative flex w-full bg-black/40 p-0.5 md:p-1 rounded-full border border-white/10 isolate">
                {(() => {
                  const viewOptions = [
                    { filter: 'today', period: 'current', label: 'Today' },
                    { filter: 'today', period: 'previous', label: 'Yesterday' },
                    { filter: 'week', period: 'current', label: 'This Week' },
                    { filter: 'week', period: 'previous', label: 'Last Week' },
                    { filter: 'month', period: 'current', label: 'This Month' },
                    { filter: 'month', period: 'previous', label: 'Last Month' },
                  ];
                  const activeIndex = viewOptions.findIndex(o => o.filter === leaderboardFilter && o.period === leaderboardPeriod);

                  return (
                    <>
                      <div
                        className="absolute top-0.5 bottom-0.5 md:top-1 md:bottom-1 rounded-full bg-blue-500/20 border border-blue-500/30 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] -z-10 shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                        style={{
                          width: `calc((100% - 4px) / 6)`,
                          left: `calc(2px + ((100% - 4px) / 6) * ${activeIndex})`
                        }}
                      />
                      {viewOptions.map((opt, i) => {
                        const isActive = activeIndex === i;
                        return (
                          <button
                            key={`${opt.filter}-${opt.period}`}
                            onClick={() => {
                              setLeaderboardFilter(opt.filter as any);
                              setLeaderboardPeriod(opt.period as any);
                            }}
                            className={`flex-1 py-0.5 md:py-1 rounded-full text-[7px] sm:text-[9px] md:text-[11px] tracking-tighter md:tracking-normal font-bold transition-all whitespace-nowrap text-center ${isActive ? 'text-blue-300 drop-shadow-md' : 'text-white/40 hover:text-white/80'}`}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="relative w-full shrink-0 min-w-0">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-white/30 w-3 h-3 md:w-3.5 md:h-3.5" />
              <input
                type="text"
                placeholder="Search user..."
                value={leaderboardSearch}
                onChange={(e) => setLeaderboardSearch(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-full pl-7 pr-3 py-1 md:py-1.5 text-[9px] md:text-xs outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
          </div>

          {leaderboardLoading && leaderboardData.length === 0 ? (
            <LeaderboardLoadingSkeleton />
          ) : (
            <div className="flex-1 relative overflow-hidden min-h-0 w-full pb-1">
              <ScrollableWithArrows className="flex flex-col gap-1 w-full min-w-0 pr-1 h-full pb-10">
                {(() => {
                  const getVal = (u: any) => {
                    if (leaderboardFilter === 'today') return leaderboardPeriod === 'current' ? u.todayFocused : u.yesterdayFocused;
                    if (leaderboardFilter === 'week') return leaderboardPeriod === 'current' ? u.thisWeekFocused : u.lastWeekFocused;
                    return leaderboardPeriod === 'current' ? u.thisMonthFocused : u.lastMonthFocused;
                  };

                  const sortLeaderboardUsers = (users: any[], filter: string, period: string) => {
                    return [...users].sort((a, b) => {
                      const valA = getVal(a) || 0;
                      const valB = getVal(b) || 0;

                      // 1. Primary: Sort by selected period focus time (descending)
                      if (valA !== valB) return valB - valA;

                      // 2. Tie breaker: wakeupTime (earlier is better, missing is worst)
                      const wakeA = a.wakeupTime ? new Date(a.wakeupTime).getTime() : Infinity;
                      const wakeB = b.wakeupTime ? new Date(b.wakeupTime).getTime() : Infinity;
                      if (wakeA !== wakeB) {
                        return wakeA < wakeB ? -1 : 1;
                      }

                      // 3. Tie breaker: streak (descending)
                      const streakA = a.streak || 0;
                      const streakB = b.streak || 0;
                      if (streakA !== streakB) return streakB - streakA;

                      // 4. Tie breaker: this week focused (descending)
                      const weekA = a.thisWeekFocused || 0;
                      const weekB = b.thisWeekFocused || 0;
                      if (weekA !== weekB) return weekB - weekA;

                      // 5. Tie breaker: this month focused (descending)
                      const monthA = a.thisMonthFocused || 0;
                      const monthB = b.thisMonthFocused || 0;
                      if (monthA !== monthB) return monthB - monthA;

                      return 0;
                    });
                  };

                  const sortedData = sortLeaderboardUsers(leaderboardData, leaderboardFilter, leaderboardPeriod);
                  const filteredData = sortedData.filter(u => u.displayName.toLowerCase().includes(leaderboardSearch.toLowerCase()));

                  if (filteredData.length === 0) return <p className="text-white/40 italic text-center py-2 text-[9px] md:text-xs">No user found.</p>;

                  return filteredData.map((user, index) => {
                    const val = getVal(user);
                    const isTop3 = index < 3 && val > 0;
                    const rankColors = ['bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]', 'bg-gray-300/20 text-gray-300 border-gray-300/30', 'bg-amber-700/20 text-amber-500 border-amber-700/30'];
                    const rankColor = isTop3 ? rankColors[index] : 'bg-white/5 text-white/50 border-white/10';

                    return (
                      <div key={user.id} className={`flex flex-col gap-0.5 p-0.5 sm:p-1 rounded-xl border transition-all w-full min-w-0 ${user.isMe ? 'bg-blue-500/10 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)] z-10' : 'bg-black/40 border-white/5 hover:bg-black/60 hover:border-white/10'}`}>
                        <div className={`flex items-center justify-between w-full min-w-0 gap-1 sm:gap-1.5 ${leaderboardFilter === 'today' && leaderboardPeriod === 'current' ? 'cursor-pointer group/row' : ''}`}
                          onClick={() => {
                            if (leaderboardFilter === 'today' && leaderboardPeriod === 'current') {
                              setExpandedLeaderboardUserId(expandedLeaderboardUserId === user.id ? null : user.id);
                            }
                          }}
                        >
                          <div className="flex items-center gap-1 sm:gap-1 min-w-0 flex-1">
                            {/* Left Column: Rank number & Profile picture side by side */}
                            <div className="flex items-center gap-1 sm:gap-1 shrink-0">
                              <span className={`font-black text-[14px] sm:text-xs md:text-xl leading-none tracking-tighter min-w-[14px] sm:min-w-[18px] text-center ${isTop3 ? (index === 0 ? 'text-yellow-400 drop-shadow-[0_0_6px_rgba(234,179,8,0.5)]' : index === 1 ? 'text-gray-200' : 'text-amber-500') : 'text-white/60'}`}>
                                {index + 1}
                              </span>
                              <div
                                onClick={(e) => {
                                  if (user.profilePicture) {
                                    e.stopPropagation();
                                    setSelectedImageOverlay({ url: user.profilePicture, title: user.displayName });
                                  }
                                }}
                                className={`w-9 h-9 sm:w-8.5 sm:h-8.5 md:w-9.5 md:h-9.5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold text-[10px] sm:text-xs md:text-sm shrink-0 overflow-hidden border border-white/10 ${user.profilePicture ? 'cursor-pointer hover:opacity-90 hover:scale-105 transition-all' : ''}`}
                                title={user.profilePicture ? "Click to view photo" : ""}
                              >
                                {user.profilePicture ? <img src={user.profilePicture} alt="" className="w-full h-full object-cover" /> : user.displayName.charAt(0).toUpperCase()}
                              </div>
                            </div>

                            {/* Middle Column: Display name and 4-item grid */}
                            <div className="flex flex-col min-w-0 overflow-hidden justify-center gap-0.5 flex-1">
                              <div className="flex items-center gap-0.5 w-full overflow-hidden">
                                <span className={`font-bold text-[10px] sm:text-xs md:text-sm tracking-wide truncate leading-none ${user.isMe ? 'text-blue-400 font-extrabold' : 'text-white/90'}`}>
                                  {user.displayName}
                                </span>
                              </div>

                              <div className="grid grid-cols-[auto_auto] gap-0.5 sm:gap-1 w-fit">
                                {(user.streak > 0 || user.maxStreak > 0) && (
                                  <div className="flex items-center justify-start gap-0.5 sm:gap-1 bg-red-500/15 border border-red-500/25 px-1 py-0.5 rounded min-w-0 w-fit">
                                    <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-400 shrink-0" />
                                    <span className="text-[8px] sm:text-[9.5px] md:text-xs text-red-300 font-bold leading-none whitespace-nowrap">
                                      {user.streak}d <span className="text-red-300/70 font-normal text-[7px] sm:text-[8.5px]">(Max:{user.maxStreak || 0})</span>
                                    </span>
                                  </div>
                                )}
                                {user.wakeupTime && (
                                  <div className="flex items-center justify-start gap-0.5 sm:gap-1 bg-blue-500/15 border border-blue-500/25 px-1 py-0.5 rounded min-w-0 w-fit">
                                    <span className="text-[8px] sm:text-[9.5px] md:text-xs text-blue-300/80 font-medium leading-none shrink-0">Wake:</span>
                                    <span className="text-[8px] sm:text-[9.5px] md:text-xs text-blue-200 font-bold leading-none whitespace-nowrap">
                                      {new Date(user.wakeupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                )}
                                {user.workStartedTime && (
                                  <div className="flex items-center justify-start gap-0.5 sm:gap-1 bg-orange-500/15 border border-orange-500/25 px-1 py-0.5 rounded min-w-0 w-fit">
                                    <span className="text-[8px] sm:text-[9.5px] md:text-xs text-orange-300/80 font-medium leading-none shrink-0">Work:</span>
                                    <span className="text-[8px] sm:text-[9.5px] md:text-xs text-orange-200 font-bold leading-none whitespace-nowrap">
                                      {new Date(user.workStartedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                )}
                                {user.bedTime && (
                                  <div className="flex items-center justify-start gap-0.5 sm:gap-1 bg-indigo-500/15 border border-indigo-500/25 px-1 py-0.5 rounded min-w-0 w-fit">
                                    <span className="text-[8px] sm:text-[9.5px] md:text-xs text-indigo-300/80 font-medium leading-none shrink-0">Last Active:</span>
                                    <span className="text-[8px] sm:text-[9.5px] md:text-xs text-indigo-200 font-bold leading-none whitespace-nowrap">
                                      {(() => {
                                        const d = new Date(user.bedTime);
                                        const today = new Date();
                                        if (d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) {
                                          return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        }
                                        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
                                      })()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-0.5 sm:gap-1 shrink-0 pl-0">
                            <div className="flex flex-col items-end justify-center leading-none">
                              <span className="font-mono font-bold text-[10.5px] sm:text-xs md:text-sm tracking-tighter text-white dark:text-white/90">
                                {Math.floor(val / 60)}<span className="text-[8px] md:text-[10px] ml-0.5 text-gray-500 dark:text-white/40 mr-0.5">h</span>{val % 60}<span className="text-[8px] md:text-[10px] ml-0.5 text-gray-500 dark:text-white/40">m</span>
                              </span>
                            </div>
                            {leaderboardFilter === 'today' && leaderboardPeriod === 'current' && (
                              <div className="text-white/30 group-hover/row:text-white/70 transition-colors shrink-0 flex items-center justify-center pl-0">
                                <ChevronDown className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-transform duration-300 ${expandedLeaderboardUserId === user.id ? 'rotate-180' : ''}`} />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Expanded Stats */}
                        {expandedLeaderboardUserId === user.id && leaderboardFilter === 'today' && leaderboardPeriod === 'current' && (() => {
                          const daysPassedThisWeek = new Date().getDay() === 0 ? 7 : new Date().getDay();
                          const thisWeekDailyAvg = Math.round((user.thisWeekFocused || 0) / daysPassedThisWeek);
                          const lastWeekDailyAvg = Math.round((user.lastWeekFocused || 0) / 7);

                          return (
                            <div className="w-full mt-1 pt-1 border-t border-white/10 flex flex-col gap-1 animate-fade-in min-w-0">
                              <div className="text-[7.5px] md:text-[8.5px] text-white/60 font-mono text-left bg-black/30 px-2 py-0.5 rounded select-all cursor-text flex items-center justify-between border border-white/5">
                                <span className="uppercase tracking-widest font-semibold text-white/40">User ID:</span>
                                <span>{user.id.slice(0, 5)}...{user.id.slice(-4)}</span>
                              </div>

                              <div className="grid grid-cols-4 gap-0.5 sm:gap-1 text-center min-w-0">
                                <div className="flex flex-col bg-black/30 p-0.5 sm:p-1 rounded border border-yellow-500/20 min-w-0 justify-center items-center">
                                  <span className="text-[6.5px] sm:text-[7.5px] md:text-[8.5px] text-yellow-400 font-bold uppercase tracking-wider truncate" title="Daily Average of This Week">This Wk Avg</span>
                                  <span className="font-mono text-[7.5px] sm:text-[8.5px] md:text-[10.5px] font-bold text-yellow-300 truncate">{Math.floor(thisWeekDailyAvg / 60)}h {thisWeekDailyAvg % 60}m</span>
                                </div>
                                <div className="flex flex-col bg-black/30 p-0.5 sm:p-1 rounded border border-amber-500/20 min-w-0 justify-center items-center">
                                  <span className="text-[6.5px] sm:text-[7.5px] md:text-[8.5px] text-amber-400 font-bold uppercase tracking-wider truncate" title="Daily Average of Last Week">Last Wk Avg</span>
                                  <span className="font-mono text-[7.5px] sm:text-[8.5px] md:text-[10.5px] font-bold text-amber-300 truncate">{Math.floor(lastWeekDailyAvg / 60)}h {lastWeekDailyAvg % 60}m</span>
                                </div>
                                <div className="flex flex-col bg-black/30 p-0.5 sm:p-1 rounded border border-purple-500/20 min-w-0 justify-center items-center">
                                  <span className="text-[6.5px] sm:text-[7.5px] md:text-[8.5px] text-purple-400 font-bold uppercase tracking-wider truncate">This Week</span>
                                  <span className="font-mono text-[7.5px] sm:text-[8.5px] md:text-[10.5px] font-bold text-purple-300 truncate">{Math.floor(user.thisWeekFocused / 60)}h {user.thisWeekFocused % 60}m</span>
                                </div>
                                <div className="flex flex-col bg-black/30 p-0.5 sm:p-1 rounded border border-emerald-500/20 min-w-0 justify-center items-center">
                                  <span className="text-[6.5px] sm:text-[7.5px] md:text-[8.5px] text-emerald-400 font-bold uppercase tracking-wider truncate">This Month</span>
                                  <span className="font-mono text-[7.5px] sm:text-[8.5px] md:text-[10.5px] font-bold text-emerald-300 truncate">{Math.floor(user.thisMonthFocused / 60)}h {user.thisMonthFocused % 60}m</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  });
                })()}
              </ScrollableWithArrows>
            </div>
          )}
        </div>}

          {showInfoModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/10 p-5 rounded-xl w-full max-w-sm flex flex-col gap-3 relative max-h-[80vh] overflow-y-auto shadow-2xl">
            <button onClick={() => setShowInfoModal(false)} className="absolute top-3 right-3 text-white/40 hover:text-white p-1 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm md:text-base font-bold flex items-center gap-2 text-white"><Info className="w-4 h-4 text-blue-400" /> About Leaderboard</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              The Global Leaderboard ranks users based on their total focus time. Focus time is strictly tracked by completing Timer or Stopwatch sessions on the dashboard.
            </p>
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-start gap-2 bg-black/30 p-2.5 rounded-lg border border-white/5">
                <Flame className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-red-300">Daily Streaks</h4>
                  <p className="text-[10px] md:text-xs text-white/50 mt-0.5 leading-relaxed">You earn a streak day by accumulating at least 60 minutes of focus time in a single day. Miss a day, and your current streak resets.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-black/30 p-2.5 rounded-lg border border-white/5">
                <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-blue-300">Sleep Schedule</h4>
                  <p className="text-[10px] md:text-xs text-white/50 mt-0.5 leading-relaxed">Your Wake and Work times are captured via the Daily Routine modal. Your Last Active time is logged automatically based on when you stop working.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-black/30 p-2.5 rounded-lg border border-white/5">
                <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-purple-300">Privacy & IDs</h4>
                  <p className="text-[10px] md:text-xs text-white/50 mt-0.5 leading-relaxed">Your personal data is secured by JWT encryption. We mask user IDs for privacy. IDs are only used to send friend requests.</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowInfoModal(false)}
              className="mt-2 w-full py-2 bg-white/10 hover:bg-white/15 text-white/90 text-xs font-bold rounded-lg transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}