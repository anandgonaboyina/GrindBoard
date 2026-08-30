'use client';

import React, { useState, useEffect } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { Flame, Calendar, ChevronDown, ChevronUp, X, AlertTriangle, Clock, Info, CheckCircle2, Check, Trash2, Lock } from 'lucide-react';
import Tooltip from './Tooltip';

export default function DeadlineTickerWidget() {
  const { deadlines, deadlineAlertDays, dismissedDeadlineAlerts, deleteDeadline, toggleDeadlineDone, dockOffset, widgetZIndices } = useDashboardStore();
  const [mounted, setMounted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false); // Always expand on app open
  const [showEmptyInfo, setShowEmptyInfo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    deadlineId: string;
    deadlineText: string;
    isDone: boolean;
  }>({
    isOpen: false,
    deadlineId: '',
    deadlineText: '',
    isDone: false,
  });

  useEffect(() => {
    setMounted(true);
    setIsMinimized(false); // Force expand on app open
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!mounted) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayFormatted = today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  // Filter active deadlines based on alert days and dismissal status
  const activeAlerts = deadlines.filter((d) => {
    const deadlineDate = new Date(d.date);
    deadlineDate.setHours(0, 0, 0, 0);

    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const isToday = diffDays === 0;
    const alertKey = `${d.id}-${isToday ? 'today' : 'preview'}`;

    if (dismissedDeadlineAlerts.includes(alertKey)) return false;

    return diffDays === 0 || (diffDays > 0 && diffDays <= deadlineAlertDays);
  });

  // Position: start above top of bottom dock on mobile, aligned on desktop
  const bottomPos = `${(isMobile ? 80 : 72) + dockOffset}px`;

  // Standard widget z-index matching dashboard layer (so modals like Settings, Timetable, Notes sit above it)
  const widgetZ = widgetZIndices?.deadlineTicker || 50;

  // Empty state: Show edge toggle button & informative card when clicked
  if (activeAlerts.length === 0) {
    return (
      <div
        className="pointer-events-auto transition-all duration-300"
      >
        {showEmptyInfo ? (
          <div className="w-[200px] xs:w-[230px] sm:w-[310px] p-2 sm:p-3 rounded-2xl bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-black/95 border border-white/15 shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5">
              <div className="flex items-center gap-1.5">
                <div className="p-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                  <Calendar className="w-3 h-3 text-emerald-400" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-white tracking-wide">No Deadlines Today 🎉</span>
              </div>
              <Tooltip text="Close" position="left">
                <button
                  onClick={() => setShowEmptyInfo(false)}
                  className="p-0.5 text-white/40 hover:text-white rounded hover:bg-white/10 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Tooltip>
            </div>
            <p className="text-[10px] sm:text-[11px] text-white/70 leading-relaxed">
              You currently have no active deadline alerts. You can add deadlines in the <strong className="text-sky-300">Calendar Widget</strong> to track important target dates!
            </p>
            <div className="mt-2 p-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[9px] sm:text-[10px] text-blue-200/90 flex items-center gap-1.5">
              <Info className="w-3 h-3 shrink-0 text-blue-400" />
              <span>Upcoming calendar deadlines will automatically alert you here!</span>
            </div>
            {/* EMPTY STATE INFO (When no active deadlines exist) */}
            {activeAlerts.length === 0 && (
              <div className="flex flex-col items-center justify-center p-2 text-center gap-1 bg-white/5 border border-white/10 rounded-xl my-1">
                <div className="p-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Calendar className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <h4 className="text-[10px] sm:text-xs font-bold text-white">No Active Deadlines</h4>
                  <p className="text-[9px] sm:text-[10px] text-white/60 leading-tight">
                    You have no pending deadlines set.
                  </p>
                </div>
                <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[9px] text-blue-200 text-left flex flex-col gap-0.5 w-full mt-0.5">
                  <span className="font-bold text-blue-300 flex items-center gap-1">
                    <Info className="w-2.5 h-2.5 text-blue-400 shrink-0" /> How to set a deadline:
                  </span>
                  <ol className="list-decimal list-inside space-y-0.5 text-white/80 text-[8.5px] sm:text-[9.5px]">
                    <li>Click <strong>Calendar</strong> on the bottom dock.</li>
                    <li>Click any target date on the calendar.</li>
                    <li>Add your deadline event title & time.</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Tooltip text="Click for Deadline Alert Info" position="top">
            <button
              onClick={() => setShowEmptyInfo(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-white/15 text-white/70 hover:text-white shadow-xl backdrop-blur-md hover:bg-slate-800/90 transition-all hover:scale-105 group text-xs font-medium"
            >
              <Calendar className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] sm:text-[11px]">No Deadlines</span>
              <Info className="w-2.5 h-2.5 text-white/40 group-hover:text-white/80" />
            </button>
          </Tooltip>
        )}
      </div>
    );
  }

  // Helper: sort deadlines so completed (isDone) items sink to the bottom
  const sortDeadlines = (list: typeof deadlines) => {
    return [...list].sort((a, b) => {
      if (a.isDone && !b.isDone) return 1;
      if (!a.isDone && b.isDone) return -1;
      return 0;
    });
  };

  // Separate today's deadlines and upcoming deadlines
  const todayAlerts = sortDeadlines(activeAlerts.filter((d) => {
    const dDate = new Date(d.date);
    dDate.setHours(0, 0, 0, 0);
    return Math.ceil((dDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) === 0;
  }));

  const upcomingAlerts = activeAlerts.filter((d) => {
    const dDate = new Date(d.date);
    dDate.setHours(0, 0, 0, 0);
    return Math.ceil((dDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) > 0;
  });

  // Check if there are pending (non-done) deadlines for TODAY
  const pendingTodayCount = todayAlerts.filter((d) => !d.isDone).length;
  const hasPendingToday = pendingTodayCount > 0;

  // Group upcoming by exact days ahead
  const upcomingGrouped: { [days: number]: typeof deadlines } = {};
  upcomingAlerts.forEach((d) => {
    const dDate = new Date(d.date);
    dDate.setHours(0, 0, 0, 0);
    const days = Math.ceil((dDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (!upcomingGrouped[days]) upcomingGrouped[days] = [];
    upcomingGrouped[days].push(d);
  });

  const sortedUpcomingDays = Object.keys(upcomingGrouped).map(Number).sort((a, b) => a - b);

  return (
    <>
      {isMinimized && !hasPendingToday ? (
        <div className="pointer-events-auto transition-all duration-300">
          <button
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-red-500/40 text-white shadow-2xl backdrop-blur-md hover:bg-slate-800/90 transition-all hover:scale-105 group"
          >
            <div className="relative">
              <Flame className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-red-300">
              {activeAlerts.length} Deadline Alert{activeAlerts.length > 1 ? 's' : ''}
            </span>
            <ChevronUp className="w-3 h-3 text-white/50 group-hover:text-white" />
          </button>
        </div>
      ) : (
        <div
          className="pointer-events-auto w-[200px] xs:w-[220px] sm:w-[320px] max-h-[170px] xs:max-h-[200px] sm:max-h-[380px] flex flex-col rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-black/95 border border-white/15 shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-bottom-3 transition-all duration-300"
        >
          {/* Header Bar with Today's Date */}
          <div className="flex items-center justify-between px-2 py-1 sm:px-3 sm:py-2 bg-gradient-to-r from-red-500/20 via-slate-900 to-amber-500/10 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <div className="p-0.5 sm:p-1 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                <Flame className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-red-400 animate-pulse" />
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-[10px] sm:text-xs font-bold tracking-wide text-white uppercase">
                  Deadlines
                </span>
                <span className="text-[8px] sm:text-[10px] text-red-300/80 font-mono font-semibold">
                  ({todayFormatted})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[7.5px] sm:text-[9px] bg-red-500/30 text-red-300 px-1 py-0.2 rounded-full border border-red-500/30 font-mono font-bold">
                {activeAlerts.length}
              </span>

              {/* Minimize Toggle: Disabled if any pending deadlines exist for Today */}
              {hasPendingToday ? (
                <Tooltip text="Cannot contract widget while today deadlines are pending!" position="left">
                  <div
                    className="p-0.5 rounded-md text-white/30 cursor-not-allowed flex items-center gap-0.5"
                  >
                    <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-400/80" />
                  </div>
                </Tooltip>
              ) : (
                <Tooltip text="Minimize alerts" position="left">
                  <button
                    onClick={() => setIsMinimized(true)}
                    className="p-0.5 hover:bg-white/10 rounded-md text-white/50 hover:text-white transition-colors"
                  >
                    <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Content Scroll Box */}
          <div className="p-1.5 sm:p-2.5 overflow-y-auto flex flex-col gap-1 sm:gap-2 custom-scrollbar max-h-[120px] xs:max-h-[150px] sm:max-h-[320px]">

            {/* TODAY'S DEADLINES SECTION */}
            {todayAlerts.length > 0 && (
              <div className="flex flex-col gap-1 sm:gap-1.5">
                {/* Glowing Today Header Banner */}
                <div className="flex items-center justify-between px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-gradient-to-r from-red-600/30 via-amber-600/20 to-red-950/30 border border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.25)]">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400 animate-bounce" />
                    <span className="text-[9px] sm:text-[10.5px] font-black tracking-wider uppercase text-red-200">
                      Today's ({todayAlerts.length})
                    </span>
                  </div>
                  <span className="text-[7.5px] sm:text-[8.5px] font-mono uppercase bg-red-500 text-white px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded font-bold shadow-sm">
                    URGENT
                  </span>
                </div>

                {/* List of Today's Items */}
                <div className="flex flex-col gap-1 sm:gap-1.5 pl-0.5 sm:pl-1">
                  {todayAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`group relative flex items-start justify-between p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all shadow-sm ${alert.isDone
                        ? 'bg-emerald-500/15 border border-emerald-500/30 opacity-80 hover:opacity-100'
                        : 'bg-red-500/10 border border-red-500/25 hover:border-red-500/50'
                        }`}
                    >
                      <div className="flex items-start gap-1.5 sm:gap-2 flex-1 min-w-0 pr-1">
                        <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full mt-1 shrink-0 ${alert.isDone ? 'bg-emerald-400' : 'bg-red-400 animate-ping'}`} />
                        <div className="flex flex-col min-w-0 flex-1">
                          <p className={`text-[10px] sm:text-xs font-semibold leading-tight break-words ${alert.isDone ? 'text-emerald-200 line-through opacity-85' : 'text-white/90'}`}>
                            {alert.text}
                          </p>
                          <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5">
                            {alert.time && (
                              <span className={`text-[8px] sm:text-[9px] font-mono flex items-center gap-0.5 ${alert.isDone ? 'text-emerald-300/70' : 'text-red-300/80'}`}>
                                <Clock className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> {alert.time}
                              </span>
                            )}
                            {alert.isDone && (
                              <span className="text-[7.5px] sm:text-[8.5px] bg-emerald-500/30 text-emerald-300 px-1 py-0.2 rounded font-bold">
                                Done ✓
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Button: Triggers Choice Modal */}
                      <Tooltip text="Mark as Done or Delete" position="left">
                        <button
                          onClick={() => setActionModal({
                            isOpen: true,
                            deadlineId: alert.id,
                            deadlineText: alert.text,
                            isDone: !!alert.isDone,
                          })}
                          className={`p-0.5 sm:p-1 rounded transition-colors shrink-0 ${alert.isDone
                            ? 'text-emerald-400 hover:bg-emerald-500/20'
                            : 'text-white/40 hover:text-emerald-400 hover:bg-white/10'
                            }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* HORIZONTAL DIVIDER SECTION */}
            {todayAlerts.length > 0 && sortedUpcomingDays.length > 0 && (
              <div className="relative py-0.5 sm:py-1 flex items-center justify-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <span className="absolute bg-[#0f1118] px-1.5 sm:px-2 text-[7.5px] sm:text-[8px] font-bold text-white/40 uppercase tracking-widest">
                  Upcoming
                </span>
              </div>
            )}

            {/* UPCOMING DEADLINES BY DAYS AHEAD WITH EXACT DATE */}
            {sortedUpcomingDays.map((daysAhead) => {
              const daysItems = sortDeadlines(upcomingGrouped[daysAhead]);
              const targetDate = new Date(today);
              targetDate.setDate(today.getDate() + daysAhead);
              const dateLabel = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const daysLabel = daysAhead === 1 ? `Tomorrow (${dateLabel})` : `In ${daysAhead} Days (${dateLabel})`;

              return (
                <div key={daysAhead} className="flex flex-col gap-0.5 sm:gap-1">
                  {/* Days Ahead Header with Date */}
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 w-fit">
                    <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
                    <span className="text-[8.5px] sm:text-[9.5px] font-bold uppercase text-amber-300/90 tracking-wider">
                      {daysLabel} ({daysItems.length})
                    </span>
                  </div>

                  {/* Items for this day */}
                  <div className="flex flex-col gap-1 pl-0.5 sm:pl-1">
                    {daysItems.map((alert) => (
                      <div
                        key={alert.id}
                        className={`flex items-start justify-between p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all shadow-sm ${alert.isDone
                          ? 'bg-emerald-500/15 border border-emerald-500/30 opacity-80 hover:opacity-100'
                          : 'bg-white/[0.04] border border-white/10 hover:bg-white/[0.08]'
                          }`}
                      >
                        <div className="flex flex-col min-w-0 flex-1 pr-1">
                          <p className={`text-xs font-medium leading-tight break-words ${alert.isDone ? 'text-emerald-200 line-through opacity-85' : 'text-white/80'}`}>
                            {alert.text}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[8.5px] text-white/40 font-mono">
                              Due: {new Date(alert.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            {alert.isDone && (
                              <span className="text-[8.5px] bg-emerald-500/30 text-emerald-300 px-1 py-0.2 rounded font-bold">
                                Done ✓
                              </span>
                            )}
                          </div>
                        </div>

                        <Tooltip text="Mark as Done or Delete" position="left">
                          <button
                            onClick={() => setActionModal({
                              isOpen: true,
                              deadlineId: alert.id,
                              deadlineText: alert.text,
                              isDone: !!alert.isDone,
                            })}
                            className={`p-1 rounded transition-colors shrink-0 ${alert.isDone
                              ? 'text-emerald-400 hover:bg-emerald-500/20'
                              : 'text-white/40 hover:text-emerald-400 hover:bg-white/10'
                              }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

          </div>
        </div>
      )}

      {/* Deadline Action Modal: Choice to Mark as Done or Delete Permanently */}
      {actionModal.isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[900] flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setActionModal({ isOpen: false, deadlineId: '', deadlineText: '', isDone: false })}
        >
          <div
            className="bg-slate-900 border border-white/15 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-4 flex flex-col gap-3 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-white">Deadline Options</h3>
              </div>
              <button
                onClick={() => setActionModal({ isOpen: false, deadlineId: '', deadlineText: '', isDone: false })}
                className="p-1 text-white/40 hover:text-white rounded hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-white/80 leading-relaxed">
              What would you like to do with <strong className="text-white">"{actionModal.deadlineText}"</strong>?
            </p>

            <div className="flex flex-col gap-2 mt-1">
              <button
                onClick={() => {
                  toggleDeadlineDone(actionModal.deadlineId);
                  setActionModal({ isOpen: false, deadlineId: '', deadlineText: '', isDone: false });
                }}
                className="w-full py-2 px-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{actionModal.isDone ? 'Mark as Pending' : 'Mark as Done (Stays until past)'}</span>
              </button>

              <button
                onClick={() => {
                  deleteDeadline(actionModal.deadlineId);
                  setActionModal({ isOpen: false, deadlineId: '', deadlineText: '', isDone: false });
                }}
                className="w-full py-2 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Deadline Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
