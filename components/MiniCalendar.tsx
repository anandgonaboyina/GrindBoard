'use client';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash, ListTodo, X } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboardStore';
import ScrollableWithArrows from './ScrollableWithArrows';
import ConfirmationModal from './ConfirmationModal';

export default function MiniCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAllDeadlines, setShowAllDeadlines] = useState(false);
  const [editingDeadlineId, setEditingDeadlineId] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    requireText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  const { deadlines, addDeadline, updateDeadline, deleteDeadline, deleteAllDeadlinesForDay, deleteAllDeadlines, cleanOldDeadlines, toggleCalendar, setIsCalendarBusy, _hasHydrated } = useDashboardStore();

  // Sync busy state so Dashboard doesn't auto-hide the calendar while editing
  useEffect(() => {
    setIsCalendarBusy(!!selectedDate || showAllDeadlines || !!editingDeadlineId);
  }, [selectedDate, showAllDeadlines, editingDeadlineId, setIsCalendarBusy]);

  // Live polling for deadlines — after we get real data, THEN clean stale ones
  useEffect(() => {
    const fetchLiveDeadlines = async () => {
      const token = localStorage.getItem('dashboard_sync_token');
      if (!token) return;
      try {
        const res = await fetch('/api/deadlines', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.data) {
          useDashboardStore.setState((state) => ({
            deadlines: data.data.deadlines || state.deadlines,
            syntheticDeadlines: data.data.syntheticDeadlines || state.syntheticDeadlines,
            deadlineAlertDays: data.data.deadlineAlertDays !== undefined ? data.data.deadlineAlertDays : state.deadlineAlertDays,
            dismissedDeadlineAlerts: data.data.dismissedDeadlineAlerts || state.dismissedDeadlineAlerts,
          }));
          if (cleanOldDeadlines && _hasHydrated) {
            cleanOldDeadlines();
          }
        }
      } catch (e) {
        // ignore
      }
    };
    fetchLiveDeadlines();
  }, [_hasHydrated]);

  const handleCloseDate = () => {
    if (selectedDate) {
      deadlines.forEach(d => {
        if (d.date === selectedDate && !d.text.trim()) {
          deleteDeadline(d.id);
        }
      });
    }
    setSelectedDate(null);
  };

  const today = new Date();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const formatDate = (date: Date, day: number) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const dayDeadlines = selectedDate ? deadlines.filter(d => d.date === selectedDate) : [];
  const sortedAllDeadlines = [...deadlines].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 sm:p-2.5 w-full max-w-[250px] sm:max-w-[280px] h-[280px] sm:h-[300px] flex flex-col relative overflow-hidden transition-all duration-300 select-none pointer-events-auto shadow-[0_8px_32px_rgba(0,0,0,0.5)]">

      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-[40px] pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col h-full w-full">

        {/* VIEW 1: ALL DEADLINES */}
        {showAllDeadlines ? (
          <div className="flex flex-col h-full w-full animate-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-start mb-1.5 pb-1 border-b border-white/10 shrink-0 gap-2 w-full">
              <div className="flex items-start gap-1.5">
                <button onClick={() => setShowAllDeadlines(false)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-white text-[10px] sm:text-[11px] font-bold flex items-center gap-1 uppercase tracking-wide leading-tight break-words mt-0.5">
                  <ListTodo className="w-3 h-3 text-sky-400 shrink-0" /> All Deadlines
                </span>
              </div>
              {sortedAllDeadlines.length > 0 && (
                <button
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: 'Clear All Deadlines',
                      message: 'Are you sure you want to permanently clear ALL deadlines? This cannot be undone.',
                      requireText: 'delete',
                      isDestructive: true,
                      onConfirm: () => deleteAllDeadlines()
                    });
                  }}
                  className="p-1 text-rose-400/80 bg-rose-500/10 hover:text-rose-200 hover:bg-rose-500/20 rounded-md transition-colors flex items-center justify-center shrink-0 border border-rose-500/20 mt-0.5"
                  title="Delete All Deadlines"
                >
                  <Trash className="w-3 h-3" />
                </button>
              )}
            </div>

            <ScrollableWithArrows className="flex-1 h-0 space-y-1.5 pr-0.5 custom-scrollbar w-full overflow-x-hidden">
              {sortedAllDeadlines.length === 0 && <div className="text-white/40 text-[9px] text-center mt-4 italic bg-black/20 p-2 rounded-lg border border-white/5 break-words">No upcoming deadlines</div>}
              {sortedAllDeadlines.map(d => (
                <div key={d.id} className="flex flex-col gap-1 bg-black/30 hover:bg-black/50 p-2 rounded-xl border border-white/5 hover:border-white/10 transition-colors group shrink-0 shadow-sm w-full min-w-0">
                  <div className="flex justify-between items-start gap-2 w-full">
                    <span className="text-rose-400/90 text-[8.5px] font-black tracking-widest uppercase bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 shrink-0">{d.date}</span>
                    <button
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: 'Delete Deadline',
                          message: 'Are you sure you want to delete this deadline?',
                          isDestructive: true,
                          onConfirm: () => deleteDeadline(d.id)
                        });
                      }}
                      className="text-rose-400/60 hover:text-rose-400 p-0.5 rounded-md hover:bg-rose-500/10 transition-colors shrink-0"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-white/90 text-[10px] font-medium leading-snug break-words whitespace-pre-wrap w-full px-0.5 pb-0.5">
                    {d.text || <span className="text-white/30 italic">Empty deadline</span>}
                  </span>
                </div>
              ))}
            </ScrollableWithArrows>
          </div>

        ) : selectedDate ? (

          /* VIEW 2: SPECIFIC DAY DEADLINES */
          <div className="flex flex-col h-full w-full animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-start mb-1.5 pb-1 border-b border-white/10 shrink-0 gap-2 w-full">
              <div className="flex items-start gap-1.5 min-w-0">
                <button onClick={handleCloseDate} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors shrink-0 mt-0.5">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <div className="flex flex-col min-w-0">
                  <span className="text-white/60 font-bold text-[8px] sm:text-[9px] uppercase tracking-widest leading-tight break-words">Deadlines for</span>
                  <span className="text-rose-400 text-[10px] sm:text-[11px] font-black tracking-wider leading-tight break-words">{selectedDate}</span>
                </div>
              </div>
              {dayDeadlines.length > 0 && (
                <button
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: 'Clear Day Deadlines',
                      message: 'Clear all deadlines for this day?',
                      isDestructive: true,
                      onConfirm: () => deleteAllDeadlinesForDay(selectedDate)
                    });
                  }}
                  className="p-1 mt-0.5 text-rose-400/80 bg-rose-500/10 hover:text-rose-200 hover:bg-rose-500/20 rounded-md transition-colors flex items-center justify-center shrink-0 border border-rose-500/20"
                  title="Clear All for Day"
                >
                  <Trash className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <ScrollableWithArrows className="flex-1 h-0 space-y-1.5 pr-0.5 custom-scrollbar w-full overflow-x-hidden">
              {dayDeadlines.length === 0 && <div className="text-white/40 text-[9px] text-center my-2 bg-black/20 p-2 rounded-lg border border-white/5 italic break-words w-full">No deadlines set for this day.</div>}
              {dayDeadlines.map(d => (
                <div key={d.id} className="flex gap-2 items-start bg-black/40 p-2 rounded-xl border border-white/5 focus-within:border-sky-500/40 transition-all shadow-inner shrink-0 w-full min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] shrink-0 mt-2" />

                  {editingDeadlineId === d.id || !d.text.trim() ? (
                    <textarea
                      value={d.text}
                      onChange={e => {
                        updateDeadline(d.id, e.target.value);
                        if (editingDeadlineId !== d.id) setEditingDeadlineId(d.id);
                      }}
                      onBlur={() => {
                        if (!d.text.trim()) deleteDeadline(d.id);
                        setEditingDeadlineId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (!d.text.trim()) deleteDeadline(d.id);
                          setEditingDeadlineId(null);
                        }
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${target.scrollHeight}px`;
                      }}
                      // Dynamically sets rows based on line breaks, making it look like a proper note
                      rows={Math.max(2, d.text.split('\n').length)}
                      className="flex-1 min-w-0 w-full bg-white/5 hover:bg-white/10 outline-none text-white/90 text-[9.5px] sm:text-[10px] font-medium leading-relaxed placeholder:text-white/30 border border-white/10 rounded-md focus:border-sky-400/50 transition-colors resize-none overflow-y-auto py-1.5 px-2 custom-scrollbar break-words shadow-sm"
                      placeholder="Write your deadline..."
                      autoFocus
                    />
                  ) : (
                    <div
                      onDoubleClick={() => setEditingDeadlineId(d.id)}
                      title="Double click to edit"
                      className="flex-1 min-w-0 w-full text-white/90 text-[9.5px] sm:text-[10px] font-medium leading-relaxed cursor-text whitespace-pre-wrap break-words py-0.5"
                    >
                      {d.text}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        title: 'Delete Deadline',
                        message: 'Are you sure you want to delete this deadline?',
                        isDestructive: true,
                        onConfirm: () => deleteDeadline(d.id)
                      });
                    }}
                    className="text-white/20 hover:text-rose-400 p-1 rounded-md hover:bg-rose-500/10 transition-colors shrink-0 mt-0.5"
                  >
                    <Trash className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </ScrollableWithArrows>

            <div className="mt-auto pt-1.5 border-t border-white/10 shrink-0 w-full">
              <button
                onClick={() => addDeadline(selectedDate, "")}
                className="w-full py-1.5 sm:py-2 flex items-center justify-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-white/80 bg-white/5 hover:bg-white/10 hover:text-white rounded-lg transition-all border border-dashed border-white/20 hover:border-white/40 active:scale-[0.98] shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> ADD DEADLINE
              </button>
            </div>
          </div>

        ) : (

          /* VIEW 3: MAIN CALENDAR GRID */
          <div className="flex flex-col h-full w-full animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center mb-2 shrink-0 bg-black/30 p-1.5 rounded-lg border border-white/5 shadow-sm w-full">
              <button onClick={prevMonth} className="p-1 sm:p-1.5 bg-white/5 hover:bg-white/10 rounded-md text-white/70 hover:text-white transition-all shadow-sm shrink-0">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <div className="text-white font-black tracking-widest uppercase text-[9.5px] sm:text-[10px] flex items-center gap-1 px-1 break-words text-center min-w-0">
                <span className="truncate">{monthNames[currentDate.getMonth()]}</span> <span className="text-sky-300">{currentDate.getFullYear()}</span>
              </div>
              <button onClick={nextMonth} className="p-1 sm:p-1.5 bg-white/5 hover:bg-white/10 rounded-md text-white/70 hover:text-white transition-all shadow-sm shrink-0">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 gap-0.5 text-center mb-1 shrink-0 bg-white/[0.03] rounded-md py-1 w-full">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="text-[8px] sm:text-[9px] font-black text-white/40 uppercase tracking-widest break-words">{d}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-y-1 gap-x-0.5 text-center flex-1 place-content-start pt-1 w-full">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`blank-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = formatDate(currentDate, day);
                const hasDeadline = deadlines.some(d => d.date === dateStr);
                const isToday =
                  day === today.getDate() &&
                  currentDate.getMonth() === today.getMonth() &&
                  currentDate.getFullYear() === today.getFullYear();

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`relative h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] mx-auto transition-all cursor-pointer group shrink-0
                      ${isToday
                        ? 'bg-sky-500 text-white shadow-[0_0_12px_rgba(14,165,233,0.5)] font-black border border-sky-400 scale-105'
                        : hasDeadline
                          ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40 hover:bg-rose-500/40 font-bold shadow-inner'
                          : 'text-white/70 hover:bg-white/10 hover:text-white font-medium border border-transparent hover:border-white/5'
                      }`}
                  >
                    {day}
                    {hasDeadline && !isToday && (
                      <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-rose-500 rounded-full border border-black shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                    )}
                    {hasDeadline && isToday && (
                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-sky-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer Button */}
            <div className="mt-auto pt-1.5 border-t border-white/10 shrink-0 w-full">
              <button
                onClick={() => setShowAllDeadlines(true)}
                className="w-full py-1.5 bg-black/40 hover:bg-black/60 border border-white/5 rounded-xl text-[8px] sm:text-[9px] font-bold text-white/80 hover:text-white transition-all flex items-center justify-center gap-1.5 group active:scale-[0.98] shadow-sm break-words"
              >
                <ListTodo className="w-3.5 h-3.5 text-white/40 group-hover:text-sky-400 transition-colors" />
                <span className="tracking-widest">VIEW ALL DEADLINES</span>
                {deadlines.length > 0 && (
                  <span className="bg-rose-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-md ml-0.5 shadow-[0_0_8px_rgba(244,63,94,0.5)]">
                    {deadlines.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        requireText={confirmModal.requireText}
        isDestructive={confirmModal.isDestructive}
      />
    </div>
  );
}