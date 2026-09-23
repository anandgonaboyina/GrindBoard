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

  // Live polling for deadlines
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
    // STRICT 1px GLASS BORDER WRAPPER
    <div className="w-[180px] sm:w-[240px] h-[250px] sm:h-[260px]  rounded-[1.25rem] bg-gradient-to-br from-white/30 via-white/5 to-white/20 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] pointer-events-auto select-none flex shrink-0 transition-all duration-300">
      
      {/* HIGHLY TRANSPARENT INNER SCREEN */}
      <div className="w-full h-full bg-black/30 rounded-[calc(1.25rem-1px)] flex flex-col relative overflow-hidden shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]">
        
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/20 rounded-full blur-[30px] pointer-events-none z-0" />
        
        {/* Main Content Area - Extremely minimal padding */}
        <div className="relative z-10 flex flex-col h-full w-full p-1.5 sm:p-2">

          {/* VIEW 1: ALL DEADLINES */}
          {showAllDeadlines ? (
            <div className="flex flex-col h-full w-full animate-in slide-in-from-right-4 duration-300">
              <div className="flex justify-between items-start mb-1 pb-1 border-b border-white/10 shrink-0 gap-1 w-full">
                <div className="flex items-center gap-1 min-w-0">
                  <button onClick={() => setShowAllDeadlines(false)} className="p-1 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors shrink-0">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-white text-[9.5px] sm:text-[10px] font-bold flex items-center gap-1 uppercase tracking-wide truncate">
                    <ListTodo className="w-3 h-3 text-sky-400 shrink-0" /> All Deadlines
                  </span>
                </div>
                {sortedAllDeadlines.length > 0 && (
                  <button
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        title: 'Clear All Deadlines',
                        message: 'Permanently clear ALL deadlines? This cannot be undone.',
                        requireText: 'delete',
                        isDestructive: true,
                        onConfirm: () => deleteAllDeadlines()
                      });
                    }}
                    className="p-1 text-rose-400/80 bg-rose-500/10 hover:text-rose-200 hover:bg-rose-500/20 rounded-md transition-colors shrink-0 border border-rose-500/20"
                    title="Delete All Deadlines"
                  >
                    <Trash className="w-3 h-3" />
                  </button>
                )}
              </div>

              <ScrollableWithArrows className="flex-1 h-0 space-y-1.5 pr-0.5 custom-scrollbar w-full overflow-x-hidden">
                {sortedAllDeadlines.length === 0 && <div className="text-white/40 text-[9px] text-center mt-4 italic bg-black/20 p-2 rounded-lg border border-white/5">No upcoming deadlines</div>}
                {sortedAllDeadlines.map(d => (
                  <div key={d.id} className="flex flex-col gap-1 bg-black/30 hover:bg-black/50 p-1.5 rounded-xl border border-white/5 hover:border-white/10 transition-colors group shrink-0 shadow-sm w-full min-w-0">
                    <div className="flex justify-between items-center gap-1 w-full">
                      <span className="text-rose-400/90 text-[8px] font-black tracking-widest uppercase bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 shrink-0">{d.date}</span>
                      <button
                        onClick={() => {
                          setConfirmModal({
                            isOpen: true,
                            title: 'Delete Deadline',
                            message: 'Delete this deadline?',
                            isDestructive: true,
                            onConfirm: () => deleteDeadline(d.id)
                          });
                        }}
                        className="text-rose-400/60 hover:text-rose-400 p-0.5 rounded-md hover:bg-rose-500/10 transition-colors shrink-0"
                      >
                        <Trash className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-white/90 text-[9.5px] font-medium leading-tight break-words whitespace-pre-wrap w-full px-0.5">
                      {d.text || <span className="text-white/30 italic">Empty deadline</span>}
                    </span>
                  </div>
                ))}
              </ScrollableWithArrows>
            </div>

          ) : selectedDate ? (

            /* VIEW 2: SPECIFIC DAY DEADLINES */
            <div className="flex flex-col h-full w-full animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-start mb-1 pb-1 border-b border-white/10 shrink-0 gap-1 w-full">
                <div className="flex items-start gap-1 min-w-0">
                  <button onClick={handleCloseDate} className="p-1 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors shrink-0 mt-0.5">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex flex-col min-w-0">
                    <span className="text-white/60 font-bold text-[7.5px] sm:text-[8px] uppercase tracking-widest leading-tight">Deadlines for</span>
                    <span className="text-rose-400 text-[9.5px] sm:text-[10px] font-black tracking-wider leading-tight truncate">{selectedDate}</span>
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
                    className="p-1 mt-0.5 text-rose-400/80 bg-rose-500/10 hover:text-rose-200 hover:bg-rose-500/20 rounded-md transition-colors shrink-0 border border-rose-500/20"
                    title="Clear All for Day"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <ScrollableWithArrows className="flex-1 h-0 space-y-1 pr-0.5 custom-scrollbar w-full overflow-x-hidden pt-0.5">
                {dayDeadlines.length === 0 && <div className="text-white/40 text-[9px] text-center my-2 bg-black/20 p-2 rounded-lg border border-white/5 italic w-full">No deadlines set.</div>}
                {dayDeadlines.map(d => (
                  <div key={d.id} className="flex gap-1.5 items-start bg-black/40 p-1.5 rounded-xl border border-white/5 focus-within:border-sky-500/40 transition-all shadow-inner shrink-0 w-full min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] shrink-0 mt-1.5" />

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
                        rows={Math.max(1, d.text.split('\n').length)}
                        className="flex-1 min-w-0 w-full bg-white/5 hover:bg-white/10 outline-none text-white/90 text-[9px] sm:text-[9.5px] font-medium leading-tight placeholder:text-white/30 border border-white/10 rounded-md focus:border-sky-400/50 transition-colors resize-none overflow-y-auto py-1 px-1.5 custom-scrollbar break-words max-h-[60px]"
                        placeholder="Write deadline..."
                        autoFocus
                      />
                    ) : (
                      <div
                        onDoubleClick={() => setEditingDeadlineId(d.id)}
                        title="Double click to edit"
                        className="flex-1 min-w-0 w-full text-white/90 text-[9px] sm:text-[9.5px] font-medium leading-tight cursor-text whitespace-pre-wrap break-words py-0.5"
                      >
                        {d.text}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: 'Delete Deadline',
                          message: 'Delete this deadline?',
                          isDestructive: true,
                          onConfirm: () => deleteDeadline(d.id)
                        });
                      }}
                      className="text-white/20 hover:text-rose-400 p-0.5 rounded-md hover:bg-rose-500/10 transition-colors shrink-0 mt-0.5"
                    >
                      <Trash className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </ScrollableWithArrows>

              <div className="mt-auto pt-1.5 border-t border-white/10 shrink-0 w-full">
                <button
                  onClick={() => addDeadline(selectedDate, "")}
                  className="w-full py-1.5 flex items-center justify-center gap-1.5 text-[9px] font-bold text-white/80 bg-white/5 hover:bg-white/10 hover:text-white rounded-lg transition-all border border-dashed border-white/20 hover:border-white/40 active:scale-[0.98]"
                >
                  <Plus className="w-3 h-3" /> ADD DEADLINE
                </button>
              </div>
            </div>

          ) : (

            /* VIEW 3: MAIN CALENDAR GRID */
            <div className="flex flex-col h-full w-full animate-in fade-in duration-500">
              
              {/* Header */}
              <div className="flex justify-between items-center mb-1 shrink-0 bg-black/20 p-1 rounded-lg border border-white/5 w-full">
                <button onClick={prevMonth} className="p-1 bg-white/5 hover:bg-white/10 rounded-md text-white/70 hover:text-white transition-all shrink-0">
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <div className="text-white font-black tracking-widest uppercase text-[9px] sm:text-[9.5px] flex items-center gap-1 px-1 truncate">
                  <span>{monthNames[currentDate.getMonth()]}</span> <span className="text-sky-300">{currentDate.getFullYear()}</span>
                </div>
                <button onClick={nextMonth} className="p-1 bg-white/5 hover:bg-white/10 rounded-md text-white/70 hover:text-white transition-all shrink-0">
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* Days Header */}
              <div className="grid grid-cols-7 gap-0.5 text-center mb-1 shrink-0 bg-white/[0.03] rounded-md py-0.5 w-full">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-[7.5px] sm:text-[8px] font-black text-white/40 uppercase tracking-widest">{d}</div>
                ))}
              </div>

              {/* Days Grid - fixed flex space */}
              <div className="flex-1 h-0 w-full overflow-hidden">
                <div className="grid grid-cols-7 gap-y-1 gap-x-0.5 text-center place-content-start pt-0.5 h-full">
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
                        className={`relative h-5 w-5 sm:h-6 sm:w-6 rounded-full flex items-center justify-center text-[8.5px] sm:text-[9.5px] mx-auto transition-all cursor-pointer shrink-0
                          ${isToday
                            ? 'bg-sky-500 text-white shadow-[0_0_10px_rgba(14,165,233,0.5)] font-black border border-sky-400 scale-105'
                            : hasDeadline
                              ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40 hover:bg-rose-500/40 font-bold'
                              : 'text-white/70 hover:bg-white/10 hover:text-white font-medium border border-transparent hover:border-white/5'
                          }`}
                      >
                        {day}
                        {hasDeadline && !isToday && (
                          <div className="absolute top-0 right-0 w-1 h-1 bg-rose-500 rounded-full shadow-[0_0_4px_rgba(244,63,94,0.8)]" />
                        )}
                        {hasDeadline && isToday && (
                          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-rose-500 rounded-full border border-sky-500 shadow-[0_0_4px_rgba(244,63,94,0.8)] animate-pulse" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer Button */}
              <div className="mt-1 pt-1.5 border-t border-white/10 shrink-0 w-full">
                <button
                  onClick={() => setShowAllDeadlines(true)}
                  className="w-full py-1.5 bg-black/40 hover:bg-black/60 border border-white/5 rounded-xl text-[8px] font-bold text-white/80 hover:text-white transition-all flex items-center justify-center gap-1.5 group active:scale-[0.98]"
                >
                  <ListTodo className="w-3 h-3 text-white/40 group-hover:text-sky-400 transition-colors" />
                  <span className="tracking-widest">VIEW ALL DEADLINES</span>
                  {deadlines.length > 0 && (
                    <span className="bg-rose-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-md shadow-[0_0_6px_rgba(244,63,94,0.4)]">
                      {deadlines.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
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