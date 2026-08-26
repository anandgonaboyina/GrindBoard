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
    onConfirm: () => {},
  });

  const { deadlines, addDeadline, updateDeadline, deleteDeadline, deleteAllDeadlinesForDay, deleteAllDeadlines, cleanOldDeadlines, toggleCalendar, setIsCalendarBusy } = useDashboardStore();

  // Auto-clean deadlines older than 7 days when calendar mounts
  useEffect(() => {
    if (cleanOldDeadlines) {
      cleanOldDeadlines();
    }
  }, [cleanOldDeadlines]);

  // Sync busy state so Dashboard doesn't auto-hide the calendar while editing
  useEffect(() => {
    setIsCalendarBusy(!!selectedDate || showAllDeadlines || !!editingDeadlineId);
  }, [selectedDate, showAllDeadlines, editingDeadlineId, setIsCalendarBusy]);

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
    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-3 w-full max-w-[250px] h-[280px] flex flex-col relative overflow-hidden transition-all duration-300 select-none pointer-events-auto shadow-xl _8px_30px_rgb(0,0,0,0.3)]">

      {/* Mobile Close Button - Changed to X to avoid confusion with Back arrows */}


      {showAllDeadlines ? (
        <div className="flex flex-col h-full w-full animate-in slide-in-from-right-4 duration-300">
          <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-white/10 pr-7 shrink-0">
            <div className="flex items-center">
              <button onClick={() => setShowAllDeadlines(false)} className="p-1 hover:bg-white/10 rounded-lg text-white/70 transition-colors">
                <ChevronLeft className="w-4 h-4 " />
              </button>
              <span className="text-white text-xs font-medium ml-1.5 flex items-center gap-1.5 ">
                <ListTodo className="w-3.5 h-3.5 text-sky-400" /> All Deadlines
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
                className="p-1 text-rose-400/80 bg-rose-500/10 hover:text-rose-300 hover:bg-rose-500/20 rounded-lg transition-colors flex items-center gap-1 text-[9px] font-semibold px-1.5 shrink-0"
                title="Delete All Deadlines"
              >
                <Trash className="w-3 h-3 " /> <span className="hidden ">Clear All</span>
              </button>
            )}
          </div>

          <ScrollableWithArrows className="flex-1 h-0 space-y-1.5 pr-1 ">
            {sortedAllDeadlines.length === 0 && <div className="text-white/40 text-[10px] text-center mt-4 italic">No upcoming deadlines</div>}
            {sortedAllDeadlines.map(d => (
              <div key={d.id} className="flex flex-col gap-0.5 bg-white/5 hover:bg-white/10 p-2 rounded-lg border border-white/5 transition-colors group shrink-0">
                <div className="flex justify-between items-center">
                  <span className="text-rose-400 text-[9px] font-bold tracking-wider">{d.date}</span>
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
                    className="text-rose-400/80 bg-rose-500/10 hover:bg-rose-500/20 hover:text-rose-300 p-1 rounded transition-all shrink-0 opacity-100"
                  >
                    <Trash className="w-3 h-3 " />
                  </button>
                </div>
                <span className="text-white/90 text-[11px] leading-snug">{d.text || <span className="text-white/30 italic">Empty deadline</span>}</span>
              </div>
            ))}
          </ScrollableWithArrows>
        </div>
      ) : selectedDate ? (
        <div className="flex flex-col h-full w-full animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-white/10 pr-7 shrink-0">
            <div className="flex items-center min-w-0">
              <button onClick={handleCloseDate} className="p-1 hover:bg-white/10 rounded-lg text-white/70 transition-colors shrink-0">
                <ChevronLeft className="w-4 h-4 " />
              </button>
              <div className="flex flex-col ml-1.5 min-w-0">
                <span className="text-white font-medium text-[10px] leading-tight truncate">Deadlines for</span>
                <span className="text-rose-400 text-[9px] font-bold tracking-wider leading-tight truncate">{selectedDate}</span>
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
                className="p-1 text-rose-400/80 bg-rose-500/10 hover:text-rose-300 hover:bg-rose-500/20 rounded-lg transition-colors flex items-center gap-1 text-[9px] font-semibold px-1.5 shrink-0"
                title="Delete all"
              >
                <Trash className="w-3 h-3 " /> <span className="hidden ">Clear All</span>
              </button>
            )}
          </div>

          <ScrollableWithArrows className="flex-1 h-0 space-y-1.5 pr-1 ">
            {dayDeadlines.length === 0 && <div className="text-white/40 text-[10px] text-center my-1 ">No deadlines set for this day.</div>}
            {dayDeadlines.map(d => (
              <div key={d.id} className="flex gap-1.5 items-center bg-black/20 px-2 py-1 rounded-md border border-white/5 focus-within:border-sky-500/30 transition-all group shadow-sm shrink-0">
                <div className="w-1 h-1 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e] shrink-0" />
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
                    className="flex-1 bg-transparent outline-none text-white/90 text-[11px] min-h-[24px] leading-tight placeholder:text-white/30 border-b border-white/20 transition-colors resize-none overflow-hidden py-1 "
                    placeholder="Enter deadline here..."
                    autoFocus
                    rows={1}
                  />
                ) : (
                  <div
                    onDoubleClick={() => setEditingDeadlineId(d.id)}
                    title="Double click to edit"
                    className="flex-1 text-white/90 text-[11px] leading-tight cursor-text whitespace-pre-wrap break-words py-1 "
                  >
                    {d.text}
                  </div>
                )}
                <button
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: 'Delete Deadline',
                      message: `Are you sure you want to delete the deadline "${d.text.length > 20 ? d.text.substring(0, 20) + '...' : d.text}"?`,
                      isDestructive: true,
                      onConfirm: () => deleteDeadline(d.id)
                    });
                  }}
                  className="text-rose-400/80 bg-rose-500/10 hover:bg-rose-500/20 hover:text-rose-300 p-1 rounded transition-all shrink-0 opacity-100"
                >
                  <Trash className="w-3 h-3 " />
                </button>
              </div>
            ))}
          </ScrollableWithArrows>

          <div className="mt-auto pt-1.5 border-t border-white/10 shrink-0">
            <button
              onClick={() => addDeadline(selectedDate, "")}
              className="w-full py-1.5 flex items-center justify-center gap-1 text-[9px] font-bold text-white/70 bg-white/5 hover:bg-white/10 hover:text-white rounded-lg transition-all border border-dashed border-white/10 hover:border-white/40 active:scale-[0.98]"
            >
              <Plus className="w-3 h-3 " /> ADD DEADLINE
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full w-full animate-in fade-in duration-500">
          {/* Header */}
          <div className="flex justify-between items-center mb-2.5 pr-7 shrink-0">
            <button onClick={prevMonth} className="p-1 bg-white/5 hover:bg-white/10 rounded-md text-white/70 hover:text-white transition-all border border-white/5 shrink-0">
              <ChevronLeft className="w-3.5 h-3.5 " />
            </button>
            <div className="text-white font-semibold tracking-wide text-[11px] truncate px-1">
              {monthNames[currentDate.getMonth()]} <span className="text-white/50">{currentDate.getFullYear()}</span>
            </div>
            <button onClick={nextMonth} className="p-1 bg-white/5 hover:bg-white/10 rounded-md text-white/70 hover:text-white transition-all border border-white/5 shrink-0">
              <ChevronRight className="w-3.5 h-3.5 " />
            </button>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 gap-0.5 text-center mb-1.5 shrink-0">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="text-[8px] font-bold text-white/30 uppercase tracking-widest">{d}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-1 gap-x-0.5 text-center flex-1 place-content-start">
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
                  className={`relative h-6 w-6 rounded-full flex items-center justify-center text-[10px] mx-auto transition-all cursor-pointer group shrink-0
  ${isToday ? 'bg-sky-500 text-white shadow-[0_0_12px_rgba(14,165,233,0.5)] font-bold border border-sky-400'
                      : hasDeadline ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40 hover:bg-rose-500/40 font-semibold shadow-[inset_0_0_8px_rgba(244,63,94,0.2)]'
                        : 'text-white/70 hover:bg-white/10 hover:text-white font-medium border border-transparent'}`}
                >
                  {day}
                  {hasDeadline && !isToday && (
                    <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-rose-500 rounded-full border border-black/50 shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                  )}
                  {hasDeadline && isToday && (
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full border border-sky-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Button */}
          <div className="mt-auto pt-2 border-t border-white/10 shrink-0">
            <button
              onClick={() => setShowAllDeadlines(true)}
              className="w-full py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-semibold text-white/80 hover:text-white transition-all flex items-center justify-center gap-1.5 group active:scale-[0.98]"
            >
              <ListTodo className="w-3 h-3 text-white/50 group-hover:text-sky-400 transition-colors" />
              VIEW ALL DEADLINES
              {deadlines.length > 0 && (
                <span className="bg-rose-500 text-white text-[8px] px-1 py-px rounded-full ml-0.5 shadow-[0_0_8px_rgba(244,63,94,0.6)]">
                  {deadlines.length}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

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