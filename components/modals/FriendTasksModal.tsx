'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
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
        className="bg-[#0f0f13]/95 backdrop-blur-xl w-full max-w-sm md:w-[360px] max-h-[80vh] md:max-h-[85vh] h-auto rounded-2xl border border-white/10 flex flex-col overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl backdrop-blur-md transition-all shadow-lg"
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
            <div className="flex bg-white/5 rounded-md overflow-hidden border border-white/10 shrink-0">
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

          {/* Sub-tabs for grouping (Tab 1, Tab 2, Tab 3) */}
          <div className="flex items-start gap-1 mt-1">
            {[0, 1, 2].map((idx) => {
              const tabTasks = friendTasksList.filter((t: any) => (t.groupId || 0) === idx);
              const tabRemaining = tabTasks.filter((t: any) => !isTaskDone(t)).reduce((sum: number, t: any) => sum + (t.duration || 0), 0);

              return (
                <div
                  key={idx}
                  className={`relative flex flex-col flex-1 min-w-0 rounded-md border transition-all h-[28px] cursor-pointer ${
                    friendTaskGroupTab === idx
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-200'
                      : 'bg-white/5 border-white/20 text-white/50 hover:bg-white/10 hover:text-white/80'
                  }`}
                  onClick={() => setFriendTaskGroupTab(idx)}
                >
                  <div className="w-full px-2 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-left truncate select-none">
                    {friendGroupNames[idx] || `Tab ${idx + 1}`}
                  </div>
                  {tabRemaining > 0 && (
                    <div
                      className={`absolute bottom-0 right-0 text-[7.5px] font-bold uppercase tracking-widest px-1 py-[1px] rounded-tl-md rounded-br-md border-t border-l shadow-sm ${
                        friendTaskGroupTab === idx
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-black/60 text-white/40 border-white/20'
                      }`}
                    >
                      {formatDuration(tabRemaining)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-4">
          {sortedTasks.length > 0 ? (
            <div className="space-y-2">
              {sortedTasks.map((task: any, index: number) => {
                const done = isTaskDone(task);
                return (
                  <div
                    key={task.id || index}
                    className={`flex items-center justify-between p-3 rounded-lg border bg-white/[0.02] hover:bg-white/10 transition-all shadow-sm ${
                      done ? 'opacity-75 grayscale-[30%] border-white/10' : 'border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                      <div className="flex items-center justify-center shrink-0">
                        {done ? (
                          <div className="w-4 h-4 rounded-[4px] bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] flex items-center justify-center">
                            <Check size={11} className="text-white stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-[4px] border-[1.5px] border-white/40" />
                        )}
                      </div>
                      <span className="text-[11px] font-black text-sky-300/90 tabular-nums select-none shrink-0">
                        {index + 1}
                      </span>
                      <span className={`text-xs md:text-sm font-semibold truncate ${done ? 'text-white/40 line-through' : 'text-white/90'}`}>
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {task.duration > 0 && !done && (
                        <span className="text-[9px] md:text-[10px] font-semibold tracking-wide text-white/90 bg-sky-500/20 px-2 py-0.5 rounded-full border border-sky-400/20 shadow-sm">
                          {formatDuration(task.duration)} left
                        </span>
                      )}
                      <span
                        className={`text-[9px] md:text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full border shadow-sm ${
                          done
                            ? 'text-emerald-300/80 bg-emerald-500/10 border-emerald-500/20'
                            : 'text-emerald-200 bg-emerald-500/20 border-emerald-400/20'
                        }`}
                      >
                        {done
                          ? formatDuration(Math.max(task.timeSpent || 0, task.duration || 0)) + ' done'
                          : formatDuration(task.timeSpent || 0) + ' done'}
                      </span>
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

