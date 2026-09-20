'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Play } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboardStore';

interface FriendTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FriendTasksModal({ isOpen, onClose }: FriendTasksModalProps) {
  const [friendTaskTab, setFriendTaskTab] = useState<'today' | 'tomorrow'>('today');
  const [friendTaskGroupTab, setFriendTaskGroupTab] = useState<number>(0);
  const viewingFriend = useDashboardStore((state) => state.viewingFriend);

  if (!isOpen || !viewingFriend || typeof document === 'undefined') {
    return null;
  }

  const friendStats = viewingFriend?.stats || {};
  const friendTasksList = friendTaskTab === 'today' ? (friendStats.tasks || []) : (friendStats.tomorrowTasks || []);
  const DEFAULT_TAB_NAMES = ['Core Tasks', 'Daily Routine', 'Milestones'];
  const rawGroupNames = friendStats.taskGroupNames || DEFAULT_TAB_NAMES;
  const friendGroupNames = [0, 1, 2].map((i) =>
    (!rawGroupNames[i] || !rawGroupNames[i].trim() || rawGroupNames[i] === `Tab ${i + 1}`)
      ? DEFAULT_TAB_NAMES[i]
      : rawGroupNames[i].trim()
  );

  const isTaskDone = (t: any) => {
    if (Boolean(t.completed) && t.completed !== 'false') return true;
    if (t.duration !== undefined && t.duration <= 0) return true;
    return false;
  };

  const groupFilteredTasks = friendTasksList.filter((t: any) => (t.groupId || 0) === friendTaskGroupTab);

  const sortedTasks = [...groupFilteredTasks].sort((a: any, b: any) => {
    const aDone = isTaskDone(a);
    const bDone = isTaskDone(b);
    if (aDone === bDone) return 0;
    return aDone ? 1 : -1;
  });

  const totalRemainingMinutes = friendTasksList
    .filter((t: any) => !isTaskDone(t))
    .reduce((sum: number, t: any) => sum + (t.duration || 0), 0);

  const formatDuration = (mins: number) => {
    if (!mins || mins <= 0) return '0m';
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10005] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-[#0f0f13]/95 backdrop-blur-xl w-full max-w-sm md:w-[380px] max-h-[80vh] md:max-h-[85vh] h-auto rounded-2xl border border-white/10 flex flex-col overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl backdrop-blur-md transition-all shadow-lg cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-white/10 bg-black/40 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center border border-white/10 shadow-lg shrink-0">
            <Check className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-white tracking-tight truncate">
              {viewingFriend?.username}'s Tasks
            </h2>
            <p className="text-xs text-white/50">Viewing shared personal tasks</p>
          </div>
        </div>

        {/* Header Controls: Today/Tomorrow Tabs & Total Left */}
        <div className="border-b border-white/5 bg-black/20 p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex bg-white/5 rounded-md overflow-hidden border border-white/10 shrink-0 shadow-inner">
              <button
                onClick={() => setFriendTaskTab('today')}
                className={`px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors ${
                  friendTaskTab === 'today' ? 'bg-sky-500/20 text-sky-300' : 'text-white/40 hover:text-white/80 hover:bg-white/10'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setFriendTaskTab('tomorrow')}
                className={`px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors ${
                  friendTaskTab === 'tomorrow' ? 'bg-purple-500/20 text-purple-300' : 'text-white/40 hover:text-white/80 hover:bg-white/10'
                }`}
              >
                Tomorrow
              </button>
            </div>

            {totalRemainingMinutes > 0 && (
              <div className="relative group">
                <span className="text-[10px] sm:text-xs font-bold text-sky-300 flex items-center gap-1 px-2.5 py-1 bg-sky-500/20 rounded-md border border-sky-500/30 shadow-sm">
                  Total Left: {formatDuration(totalRemainingMinutes)}
                </span>
              </div>
            )}
          </div>

          {/* Sub-tabs for grouping */}
          <div className="flex items-start gap-1 mt-2 mb-1">
            {[0, 1, 2].map((idx) => {
              const tabTasks = friendTasksList.filter((t: any) => (t.groupId || 0) === idx);
              const tabRemaining = tabTasks.filter((t: any) => !isTaskDone(t)).reduce((sum: number, t: any) => sum + (t.duration || 0), 0);
              const timeDisplay = tabRemaining > 0 ? formatDuration(tabRemaining) : '';
              const isActive = friendTaskGroupTab === idx;

              return (
                <div
                  key={idx}
                  className={`relative flex items-center flex-1 h-[25px] min-w-0 rounded-md border text-[8px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                    isActive ? 'bg-blue-500/20 border-blue-500/50 text-blue-200' : 'bg-white/5 border-white/20 text-white/50 hover:bg-white/10'
                  }`}
                  onClick={() => setFriendTaskGroupTab(idx)}
                >
                  <div className="w-full px-2 truncate select-none text-left">
                    {friendGroupNames[idx] || `Tab ${idx + 1}`}
                  </div>
                  {timeDisplay && (
                    <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-extrabold tracking-wide px-1.5 rounded border shadow-md select-none transition-all z-10 ${
                      isActive 
                        ? 'bg-emerald-500 text-black border-emerald-400 font-black' 
                        : 'bg-[#141414] text-emerald-400 border-white/20'
                    }`}>
                      <pre>{timeDisplay}</pre>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Task List (Using the identical compact single-line layout) */}
        <div className="flex-1 overflow-auto custom-scrollbar p-2">
          {sortedTasks.length > 0 ? (
            <div className="flex flex-col gap-1 pb-2">
              {sortedTasks.map((task: any, index: number) => {
                const done = isTaskDone(task);
                const durationMins = task.duration || 0;
                const timeSpentMins = task.timeSpent || 0;
                
                const formatTimeBadge = (mins: number) => {
                  if (mins < 60) return `${mins}m`;
                  const h = Math.floor(mins / 60);
                  const m = mins % 60;
                  return m > 0 ? `${h}h ${m}m` : `${h}h`;
                };

                return (
                  <div
                    key={task.id || index}
                    className={`group relative flex gap-1.5 sm:gap-2 p-1.5 rounded-[12px] transition-all shadow-sm mt-0.5 border ${
                      done ? 'bg-black/[0.2] border-white/20 opacity-60 grayscale-[40%]' : 'bg-[#121318]/20 border-white/30'
                    }`}
                  >
                    {/* Read-only Checkbox Box */}
                    <div className="flex flex-col items-center justify-center shrink-0 w-6 py-1 rounded-xl bg-black/20 border border-white/5 shadow-inner">
                      <div className="p-0.5 flex items-center justify-center text-white/30">
                        {done ? (
                          <Check className="w-[16px] h-[16px] text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                        ) : (
                          <div className="w-[14px] h-[14px] rounded-full border border-white/30" />
                        )}
                      </div>
                    </div>

                    {/* Content Column */}
                    <div className="flex flex-col flex-1 min-w-0 justify-between py-0.5 pl-0.5">
                      {/* Top Row: Inline Number + Title */}
                      <div className="flex items-start justify-between gap-1 w-full">
                        <div className="flex-1 min-w-0 flex items-start gap-1 mt-[2px]">
                          <span className="text-[10px] sm:text-[11px] font-black text-white/30 pt-[1px] select-none shrink-0">
                            {index + 1}.
                          </span>
                          <div className={`w-full text-[12px] sm:text-[13px] font-medium leading-snug whitespace-pre-wrap ${done ? 'line-through text-white/50' : 'text-white/95'}`}>
                            {task.title}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Row: Time Badges (Strict Single-Line Layout) */}
                      <div className="flex items-center justify-between mt-1.5 w-full gap-1">
                        <div className="flex items-center gap-1 flex-nowrap min-w-0 overflow-hidden">
                          {durationMins > 0 && !done && (
                            <span className="whitespace-nowrap text-[8.5px] sm:text-[9px] font-bold tracking-wide text-sky-300 bg-sky-900/30 border border-sky-500/30 px-1.5 py-[2px] rounded shadow-sm shrink-0">
                              {formatTimeBadge(durationMins)} left
                            </span>
                          )}
                          <span className={`whitespace-nowrap text-[8.5px] sm:text-[9px] font-bold tracking-wide px-1.5 py-[2px] rounded border shadow-sm shrink-0 ${done ? 'text-emerald-400/60 bg-emerald-900/20 border-emerald-500/20' : 'text-emerald-300 bg-emerald-900/30 border-emerald-500/30'}`}>
                            {done ? formatTimeBadge(timeSpentMins + durationMins) : formatTimeBadge(timeSpentMins)} done
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-white/40 text-center italic text-sm mt-8">
              No {friendTaskTab} tasks found in this tab.
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}