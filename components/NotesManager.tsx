'use client';
import { useState, useEffect, useRef } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { Sun, Moon, Plus, X, StickyNote, Trash2, Undo, Redo, Bold, Italic, Underline, List, Download, ChevronLeft, ChevronRight, Calendar, Upload, GripVertical } from 'lucide-react';
import ScrollableWithArrows from './ScrollableWithArrows';
import ConfirmationModal from './ConfirmationModal';

function EditorBlock({ isLight, date, initialHtml, onChange }: { isLight: boolean; date: string; initialHtml: string; onChange: (html: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    // Only set initial HTML once when mounting to prevent cursor jumps
    if (editorRef.current && editorRef.current.innerHTML === '') {
      editorRef.current.innerHTML = initialHtml;
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      // Ensure we save when the component unmounts (e.g. modal closed)
      if (editorRef.current) {
        onChangeRef.current(editorRef.current.innerHTML);
      }
    };
  }, [initialHtml]);

  const handleInput = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (editorRef.current) {
        onChangeRef.current(editorRef.current.innerHTML);
      }
    }, 30000); // Wait 30 seconds of inactivity before auto-saving
  };

  const handleBlur = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (editorRef.current) {
      onChangeRef.current(editorRef.current.innerHTML);
    }
  };

  return (
    <div id={`note-date-${date.replace(/\s+/g, '-')}`} className="mb-4 md:mb-5 relative group">
      <div className='flex justify-center '>
        <h3 className={`text-[10px] text-center bg-blue-300 px-5 rounded-xl md:text-xl font-bold ${isLight ? 'text-slate-500 border-slate-200' : 'text-white/50 border-white/10'} pb-1 md:pb-2 mb-1.5 md:mb-3 select-none tracking-wide`}>
          {date}
        </h3>

      </div>
      <div
        ref={editorRef}
        contentEditable
        spellCheck={false}
        onInput={handleInput}
        onBlur={handleBlur}
        onDoubleClick={(e) => {
          const el = e.target as HTMLElement;
          if (el.tagName === 'A' || el.closest('a')) {
            const anchor = (el.tagName === 'A' ? el : el.closest('a')) as HTMLAnchorElement;
            if (anchor.href) window.open(anchor.href, '_blank');
          }
        }}
        className={`select-text cursor-text outline ${isLight ? 'text-slate-800 focus:bg-slate-50 focus:border-slate-200' : 'text-white/90 focus:bg-white/5 focus:border-white/10'} min-h-[40px] md:min-h-[60px] text-xs md:text-lg leading-relaxed transition-all p-2 md:p-4 rounded-lg md:rounded-2xl border border-transparent [&_h1]:text-lg md:[&_h1]:text-4xl [&_h1]:font-bold [&_h1]:mb-1.5 md:[&_h1]:mb-4 [&_h2]:text-base md:[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-1 md:[&_h2]:mb-3 [&_p]:mb-1 md:[&_p]:mb-2 [&_ul]:list-disc [&_ul]:ml-4 md:[&_ul]:ml-6 [&_b]:font-bold [&_i]:italic [&_u]:underline [&_a]:text-blue-400 [&_a]:underline`}
      />
    </div>
  );
}

export default function NotesManager() {
  const { theme: globalTheme, notesThemeOverride, setNotesThemeOverride, isNotesOpen, toggleNotes, notes, setNotes, activeNoteId, addNote, updateNoteTitle, updateNoteEntry, deleteNote, setActiveNote, reorderNotes } = useDashboardStore();
  const effectiveTheme = notesThemeOverride || (globalTheme === 'light' ? 'light' : 'dark');
  const isLight = effectiveTheme === 'light';
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || !isNotesOpen) return null;

  return (
    <NotepadModal
      isLight={isLight}
      setNotesThemeOverride={setNotesThemeOverride}
      toggleNotes={toggleNotes}
      notes={notes}
      activeNoteId={activeNoteId}
      addNote={addNote}
      updateNoteTitle={updateNoteTitle}
      updateNoteEntry={updateNoteEntry}
      deleteNote={deleteNote}
      setActiveNote={setActiveNote}
      setNotes={setNotes}
      reorderNotes={reorderNotes}
    />
  );
}

function NoteCalendar({ existingDates, onSelectDate, isLight }: { existingDates: string[], onSelectDate: (dateStr: string) => void, isLight: boolean }) {
  const dateMap = new Map<string, string>();
  existingDates.forEach(dStr => {
    const d = new Date(dStr);
    if (!isNaN(d.getTime())) {
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dateMap.set(iso, dStr);
    }
  });

  const [currentMonth, setCurrentMonth] = useState(() => {
    if (existingDates.length > 0) {
      const d = new Date(existingDates[existingDates.length - 1]);
      if (!isNaN(d.getTime())) return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const blanks = Array.from({ length: firstDay });
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className={`p-3 w-72 ${isLight ? 'bg-white border-slate-200' : 'bg-black/90 border-white/20 backdrop-blur-xl text-white'} rounded-xl shadow-xl border z-50 animate-in fade-in zoom-in-95 duration-200`}>
      <div className="flex justify-between items-center mb-3">
        <button onClick={prevMonth} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/10 text-white/80'}`}><ChevronLeft className="w-4 h-4" /></button>
        <span className="font-semibold text-sm">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
        <button onClick={nextMonth} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/10 text-white/80'}`}><ChevronRight className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 font-medium">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className={`opacity-50 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {blanks.map((_, i) => <div key={`blank-${i}`} />)}
        {days.map(day => {
          const iso = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const hasNote = dateMap.has(iso);
          return (
            <button
              key={day}
              disabled={!hasNote}
              onClick={() => hasNote && onSelectDate(dateMap.get(iso)!)}
              className={`p-1.5 rounded-full transition-colors w-8 h-8 flex items-center justify-center mx-auto
                ${hasNote ? (isLight ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 font-bold shadow-sm' : 'bg-blue-500 text-white hover:bg-blue-600 font-bold shadow-md') : `opacity-40 cursor-default ${isLight ? 'text-slate-400' : 'text-white/40'}`}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NotepadModal({ isLight, setNotesThemeOverride, toggleNotes, notes, activeNoteId, addNote, updateNoteTitle, updateNoteEntry, deleteNote, setActiveNote, setNotes, reorderNotes }: any) {
  const [format, setFormat] = useState({ bold: false, italic: false, underline: false, list: false });
  const titleInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const draggedIndexRef = useRef<number | null>(null);

  // Controls mobile drill-down view
  const [isMobileDetailView, setIsMobileDetailView] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onCancel?: () => void;
    onConfirm: () => void;
  }>({
    isOpen: false, title: '', message: '', onConfirm: () => { }
  });

  useEffect(() => {
    draggedIndexRef.current = draggedIndex;
  }, [draggedIndex]);

  // Handle touch & pointer drag reordering for notes
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent | TouchEvent) => {
      if (draggedIndexRef.current === null) return;
      const clientX = 'touches' in e ? e.touches[0]?.clientX : (e as PointerEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0]?.clientY : (e as PointerEvent).clientY;
      if (clientX === undefined || clientY === undefined) return;

      const el = document.elementFromPoint(clientX, clientY);
      if (el) {
        const noteEl = el.closest('[data-note-index]');
        if (noteEl) {
          const targetIndex = parseInt(noteEl.getAttribute('data-note-index') || '', 10);
          if (!isNaN(targetIndex) && targetIndex !== draggedIndexRef.current) {
            reorderNotes(draggedIndexRef.current, targetIndex);
            draggedIndexRef.current = targetIndex;
            setDraggedIndex(targetIndex);
          }
        }
      }
    };

    const handlePointerUp = () => {
      if (draggedIndexRef.current !== null) {
        draggedIndexRef.current = null;
        setDraggedIndex(null);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('touchend', handlePointerUp);
    window.addEventListener('touchcancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('touchend', handlePointerUp);
      window.removeEventListener('touchcancel', handlePointerUp);
    };
  }, [reorderNotes]);

  useEffect(() => {
    const checkFormat = () => {
      setFormat({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        list: document.queryCommandState('insertUnorderedList')
      });
    };
    document.addEventListener('selectionchange', checkFormat);
    return () => document.removeEventListener('selectionchange', checkFormat);
  }, []);

  const activeNote = notes.find((n: any) => n.id === activeNoteId) || notes[0];

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Handle legacy notes from old storage format safely
  const entries = activeNote?.entries || {};
  if (activeNote && !activeNote.entries && activeNote.content) {
    entries[todayStr] = activeNote.content; // Recover old text
  }

  // Get all existing dates for the active note
  const existingDates = Object.keys(entries).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  if (!existingDates.includes(todayStr)) {
    existingDates.push(todayStr); // Always show today at the bottom
  }

  // Smooth scroll to today's note editor block when user clicks Today button
  const scrollToToday = () => {
    const todayId = `note-date-${todayStr.replace(/\s+/g, '-')}`;
    const el = document.getElementById(todayId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
  };

  const downloadSingleNote = (note: any) => {
    const isWebView2 = typeof window !== 'undefined' && ((window as any).chrome?.webview !== undefined || navigator.userAgent.includes('wv') || navigator.userAgent.includes('Lively'));
    const safeTitle = (note.title || 'untitled').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `note-${safeTitle}-${new Date().toISOString().split('T')[0]}`;

    if (isWebView2) {
      setConfirmModal({
        isOpen: true,
        title: 'Download Note',
        message: (
          <div className="flex flex-col gap-3 text-sm text-white/80">
            <p>This note (<code className="text-orange-300 text-xs px-1 bg-black/30 rounded">{fileName}.json</code>) will be saved to your PC's <strong>Downloads</strong> folder.</p>
            <p className="text-[11px] text-blue-300 bg-blue-500/10 p-2 rounded mt-1 border border-blue-500/20">
              ℹ️ A new tab will briefly open to process the download securely.
            </p>
          </div>
        ),
        confirmText: 'Download',
        cancelText: 'Cancel',
        onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
        onConfirm: async () => {
          try {
            const res = await fetch('/api/download-echo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                data: JSON.stringify(note, null, 2),
                name: fileName + '.json',
                type: 'Note'
              })
            });
            const result = await res.json();
            if (result.success && result.id) {
              window.open(window.location.origin + '/download.html?apiId=' + result.id + '&type=Note', '_blank');
            } else {
              alert('Failed to prepare download.');
            }
          } catch (e) {
            // Offline fallback
            const encoded = encodeURIComponent(JSON.stringify(note, null, 2));
            const url = new URL(window.location.origin + '/download.html');
            url.searchParams.set('data', encoded);
            url.searchParams.set('name', fileName);
            url.searchParams.set('type', 'Note');
            window.open(url.toString(), '_blank');
          }
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else {
      const jsonString = JSON.stringify(note, null, 2);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonString);
      const a = document.createElement("a");
      a.href = dataStr;
      a.download = `${fileName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleBackup = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Notes Backup',
      message: (
        <div className="flex flex-col gap-3 text-sm text-white/80">
          <p>Your notes backup file (<code className="text-orange-300 text-xs px-1 bg-black/30 rounded">notes_backup.json</code>) will be saved to your PC's <strong>Downloads</strong> folder.</p>
          <p>To use this backup later or on another device, click the <strong>Restore</strong> button and select the downloaded file.</p>
          {typeof window !== 'undefined' && ((window as any).chrome?.webview !== undefined || navigator.userAgent.includes('wv') || navigator.userAgent.includes('Lively')) && (
            <p className="text-[11px] text-blue-300 bg-blue-500/10 p-2 rounded mt-1 border border-blue-500/20">
              ℹ️ Since you are using Lively Wallpaper, your default browser will briefly open to process the download safely.
            </p>
          )}
        </div>
      ),
      confirmText: 'Download',
      cancelText: 'Cancel',
      onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
      onConfirm: () => {
        const isWebView2 = typeof window !== 'undefined' && ((window as any).chrome?.webview !== undefined || navigator.userAgent.includes('wv') || navigator.userAgent.includes('Lively'));

        if (isWebView2) {
          fetch('/api/download-echo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: JSON.stringify(notes, null, 2),
              name: 'notes_backup.json',
              type: 'Notes Backup'
            })
          }).then(res => res.json()).then(result => {
            if (result.success && result.id) {
              window.open(window.location.origin + '/download.html?apiId=' + result.id + '&type=Notes+Backup', '_blank');
            } else {
              alert('Failed to prepare download.');
            }
          }).catch(() => {
            // Offline fallback
            const encoded = encodeURIComponent(JSON.stringify(notes, null, 2));
            const url = new URL(window.location.origin + '/download.html');
            url.searchParams.set('data', encoded);
            url.searchParams.set('name', 'notes_backup');
            url.searchParams.set('type', 'Notes Backup');
            window.open(url.toString(), '_blank');
          });
        } else {
          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notes, null, 2));
          const downloadAnchorNode = document.createElement('a');
          downloadAnchorNode.setAttribute("href", dataStr);
          downloadAnchorNode.setAttribute("download", "notes_backup.json");
          document.body.appendChild(downloadAnchorNode);
          downloadAnchorNode.click();
          downloadAnchorNode.remove();
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        let importedNotes = [];
        if (Array.isArray(data)) {
          importedNotes = data;
        } else if (data && data.id && data.title) {
          importedNotes = [data]; // Single note restore
        } else {
          alert('Invalid notes backup file.');
          return;
        }

        // Merge logic: append entries for matching titles, otherwise add new
        const existingNotes = [...notes];
        
        importedNotes.forEach((impNote: any) => {
          const existing = existingNotes.find(n => n.title === impNote.title);
          if (existing) {
            // Merge entries
            const mergedEntries = { ...(existing.entries || {}) };
            if (impNote.entries) {
              Object.keys(impNote.entries).forEach(date => {
                if (mergedEntries[date]) {
                  mergedEntries[date] += `<br/><br/>--- Imported ---<br/><br/>${impNote.entries[date]}`;
                } else {
                  mergedEntries[date] = impNote.entries[date];
                }
              });
            } else if (impNote.content) {
               // legacy
               const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
               mergedEntries[todayStr] = (mergedEntries[todayStr] ? mergedEntries[todayStr] + `<br/><br/>--- Imported ---<br/><br/>` : '') + impNote.content;
            }
            existing.entries = mergedEntries;
          } else {
            // New note, generate fresh ID to avoid collisions
            existingNotes.push({ ...impNote, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) });
          }
        });

        if (setNotes) {
          setNotes(existingNotes);
        }
      } catch (err) {
        console.error(err);
        alert('Failed to parse notes backup.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 ${isLight ? 'bg-slate-500/20' : 'bg-black/60'} backdrop-blur-sm animate-in fade-in duration-300 pointer-events-auto`}>
      <div
        className="absolute inset-0"
        onClick={() => {
          toggleNotes();
          setIsMobileDetailView(false);
        }}
      />

      <div className={`relative w-full max-w-6xl h-[80vh] md:h-[85vh] flex flex-col md:flex-row rounded-2xl md:rounded-3xl ${isLight ? 'bg-white/90 border-slate-200' : 'bg-black/80 border-white/20'} backdrop-blur-2xl border shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300`}>

        {/* Top/Left Sidebar: Notes List */}
        <div className={`${isMobileDetailView ? 'hidden md:flex' : 'flex'} relative w-full md:w-1/4 md:max-w-[300px] h-full ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'} border-r flex-col shrink-0`}>
          <div className={`p-2.5 md:p-4 border-b ${isLight ? 'border-slate-200 bg-slate-100' : 'border-white/10 bg-white/5'} flex justify-between items-center shrink-0`}>
            <h2 className={`text-sm md:text-lg font-medium ${isLight ? 'text-slate-800' : 'text-white'} tracking-wide flex items-center gap-1.5 md:gap-2`}>
              <StickyNote className="text-yellow-400 w-4 h-4 md:w-[18px] md:h-[18px]" /> Notes
            </h2>
            <button
              onClick={() => {
                toggleNotes();
                setIsMobileDetailView(false);
              }}
              className={`md:hidden p-1.5 rounded-lg transition-colors ${isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-red-100' : 'text-white/60 hover:text-white hover:bg-red-500/20'}`}
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative flex-1 overflow-hidden flex flex-col">
            <ScrollableWithArrows className="p-1 md:p-2 flex flex-col gap-1 pr-1">
              {notes.map((note: any, index: number) => {
                const isDragging = draggedIndex === index;
                return (
                  <div
                    key={note.id}
                    data-note-index={index}
                    onClick={() => {
                      setActiveNote(note.id);
                      setIsMobileDetailView(true);
                    }}
                    className={`group flex items-center justify-between p-2 md:p-2.5 rounded-lg md:rounded-xl cursor-pointer transition-all min-w-0 ${
                      isDragging ? 'opacity-40 scale-[0.98]' : ''
                    } ${
                      activeNoteId === note.id
                        ? (isLight ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'bg-white/20 text-white shadow-md')
                        : (isLight ? 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900' : 'text-white/60 hover:bg-white/10 hover:text-white')
                    }`}
                  >
                    <div className="flex items-center gap-1 flex-1 min-w-0 pr-1">
                      <div
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          setDraggedIndex(index);
                        }}
                        onTouchStart={() => {
                          setDraggedIndex(index);
                        }}
                        className="cursor-grab active:cursor-grabbing p-0.5 opacity-40 group-hover:opacity-100 transition-opacity touch-none shrink-0"
                        title="Drag to reorder"
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>

                      <span className="font-medium truncate text-xs md:text-sm flex-1">{note.title || 'Untitled Note'}</span>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0 transition-all">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadSingleNote(note);
                        }}
                        className={`p-1 md:p-1.5 rounded-md md:rounded-lg transition-all ${isLight ? 'hover:bg-blue-100 hover:text-blue-600 text-slate-400 group-hover:text-slate-600' : 'hover:bg-blue-500/20 hover:text-blue-400 text-white/40 group-hover:text-white/80'}`}
                        title="Download Note"
                      >
                        <Download className="w-3.5 h-3.5 md:w-[14px] md:h-[14px]" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmModal({
                            isOpen: true,
                            title: 'Delete Note',
                            message: `Are you sure you want to delete "${note.title || 'Untitled Note'}"?`,
                            isDestructive: true,
                            onConfirm: () => deleteNote(note.id)
                          });
                        }}
                        className={`p-1 md:p-1.5 rounded-md md:rounded-lg transition-all ${notes.length === 1 ? 'hidden' : ''} ${isLight ? 'hover:bg-red-100 hover:text-red-600 text-slate-400 group-hover:text-slate-600' : 'hover:bg-red-500/20 hover:text-red-400 text-white/40 group-hover:text-white/80'}`}
                        title="Delete Note"
                      >
                        <Trash2 className="w-3.5 h-3.5 md:w-[14px] md:h-[14px]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </ScrollableWithArrows>
          </div>

          {/* Floating Bottom Dock Pill */}
          <div className="absolute bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <div className={`flex items-center gap-1 md:gap-2 px-1.5 py-1.5 md:px-2 md:py-2 rounded-full shadow-xl backdrop-blur-md border transition-colors ${isLight ? 'bg-white/80 border-slate-200/50 shadow-slate-200/50' : 'bg-black/60 border-white/10 shadow-black/50'}`}>

              {/* Utility Actions */}
              <div className="flex items-center gap-0.5">
                <button
                  onClick={handleBackup}
                  className={`p-2 rounded-full transition-all hover:scale-105 active:scale-95 ${isLight ? 'text-slate-600 hover:bg-slate-200/50' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                  title="Backup Notes"
                >
                  <Download className="w-4 h-4 md:w-4 md:h-4" />
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2 rounded-full transition-all hover:scale-105 active:scale-95 ${isLight ? 'text-slate-600 hover:bg-slate-200/50' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                  title="Restore Notes"
                >
                  <Upload className="w-4 h-4 md:w-4 md:h-4" />
                </button>
                <input type="file" accept=".json" ref={fileInputRef} onChange={handleRestore} className="hidden" />

                <button
                  onClick={() => setNotesThemeOverride(isLight ? 'dark' : 'light')}
                  className={`p-2 rounded-full transition-all hover:scale-105 active:scale-95 ${isLight ? 'text-slate-600 hover:bg-slate-200/50' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                  title="Toggle Theme"
                >
                  {isLight ? <Moon className="w-4 h-4 md:w-4 md:h-4" /> : <Sun className="w-4 h-4 md:w-4 md:h-4" />}
                </button>
              </div>

              {/* Divider */}
              <div className={`w-px h-5 mx-0.5 md:mx-1 ${isLight ? 'bg-slate-300' : 'bg-white/20'}`}></div>

              {/* Primary Action */}
              <button
                onClick={() => {
                  addNote();
                  setIsMobileDetailView(true);
                  setTimeout(() => {
                    if (titleInputRef.current) {
                      titleInputRef.current.focus();
                      titleInputRef.current.select();
                    }
                  }, 50);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 ml-0.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
                title="New Note"
              >
                <Plus className="w-4 h-4" />
                <span className="text-[11px] md:text-[13px] font-bold tracking-wide pr-1">New</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom/Right Pane: Editor Area */}
        <div className={`${isMobileDetailView ? 'flex' : 'hidden md:flex'} flex-1 flex-col relative min-h-0 w-full ${isLight ? 'bg-slate-100' : 'bg-black/20'}`}>

          {/* Editor Top Bar */}
          {activeNote && (
            <div className={`flex items-center justify-between p-2 md:p-4 border-b shrink-0 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-black/20'}`}>
              <div className="flex items-center flex-1 min-w-0 pr-2 md:pr-4">
                {isMobileDetailView && (
                  <button
                    onClick={() => setIsMobileDetailView(false)}
                    className={`md:hidden flex items-center justify-center p-1.5 mr-2 border rounded-md transition-colors shrink-0 ${isLight ? 'bg-white border-slate-200 text-slate-600 hover:text-slate-900' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                <input
                  ref={titleInputRef}
                  type="text"
                  value={activeNote.title || ''}
                  onChange={(e) => updateNoteTitle(activeNote.id, e.target.value)}
                  placeholder="Note Title"
                  className={`bg-transparent text-sm md:text-2xl font-bold outline-none w-full min-w-0 truncate ${isLight ? 'text-slate-900 placeholder:text-slate-400' : 'text-white placeholder:text-white/20'}`}
                />
              </div>

              <div className="flex items-center gap-1 md:gap-2 shrink-0 relative">
                <button
                  onClick={scrollToToday}
                  className={`px-2 py-1 md:px-2.5 md:py-1.5 rounded-lg md:rounded-xl transition-all flex items-center gap-1 text-[11px] md:text-xs font-semibold ${
                    isLight ? 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20' : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30'
                  }`}
                  title="Scroll to Today's Note"
                >
                  <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span>Today</span>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowDateDropdown(!showDateDropdown)}
                    className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-colors flex items-center gap-1.5 md:gap-2 ${isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-200' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                    title="Jump to Date"
                  >
                    <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                  </button>

                  {showDateDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowDateDropdown(false)} />
                      <div className="absolute right-0 top-full mt-2 z-50 origin-top-right">
                        <NoteCalendar
                          isLight={isLight}
                          existingDates={existingDates}
                          onSelectDate={(date) => {
                            const el = document.getElementById(`note-date-${date.replace(/\s+/g, '-')}`);
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                            setShowDateDropdown(false);
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setNotesThemeOverride(isLight ? 'dark' : 'light')}
                  className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-colors shrink-0 ${isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-200' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
                  title="Toggle Theme"
                >
                  {isLight ? <Moon className="w-4 h-4 md:w-5 md:h-5" /> : <Sun className="w-4 h-4 md:w-5 md:h-5" />}
                </button>
                <button
                  onClick={() => {
                    toggleNotes();
                    setIsMobileDetailView(false);
                  }}
                  className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-colors shrink-0 ${isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-200' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
                >
                  <X className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </div>
          )}

          {activeNote && (
            <div className="flex-1 flex flex-col relative overflow-hidden">
              <ScrollableWithArrows persistKey={`note-scroll-${activeNote.id}`} className="px-3 md:px-6 pt-3 md:pt-6 pb-20 md:pb-32" downArrowOffset="bottom-16 md:bottom-24">
                {existingDates.map((date) => (
                  <EditorBlock
                    isLight={isLight}
                    key={`${activeNote.id}-${date}`}
                    date={date}
                    initialHtml={entries[date] || ''}
                    onChange={(html) => updateNoteEntry(activeNote.id, date, html)}
                  />
                ))}
              </ScrollableWithArrows>
            </div>
          )}

          {/* Floating Toolbar - Responsive Scrollable Container */}
          {activeNote && (
            <div className={`absolute bottom-2 md:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 md:gap-1.5 px-1.5 md:px-4 py-1.5 md:py-2 border rounded-lg md:rounded-2xl z-50 w-max max-w-[95%] overflow-x-auto no-scrollbar ${isLight ? 'bg-white/90 backdrop-blur-xl border-slate-200 shadow-xl' : 'bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl'}`}>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec('undo')} className={`p-1.5 md:p-2.5 rounded-md md:rounded-xl transition-colors shrink-0 ${isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/10 text-white'}`} title="Undo"><Undo className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" /></button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec('redo')} className={`p-1.5 md:p-2.5 rounded-md md:rounded-xl transition-colors shrink-0 ${isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/10 text-white'}`} title="Redo"><Redo className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" /></button>

              <div className={`w-px h-4 md:h-8 mx-0.5 md:mx-2 shrink-0 ${isLight ? 'bg-slate-200' : 'bg-white/20'}`} />

              <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec('formatBlock', 'H1')} className={`p-1.5 md:p-2.5 rounded-md md:rounded-xl font-bold text-[9px] md:text-sm transition-colors shrink-0 ${isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/10 text-white'}`} title="Heading 1">H1</button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec('formatBlock', 'H2')} className={`p-1.5 md:p-2.5 rounded-md md:rounded-xl font-bold text-[9px] md:text-sm transition-colors shrink-0 ${isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/10 text-white'}`} title="Heading 2">H2</button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec('formatBlock', 'P')} className={`p-1.5 md:p-2.5 rounded-md md:rounded-xl text-[9px] md:text-sm transition-colors shrink-0 ${isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/10 text-white'}`} title="Normal Text">P</button>

              <div className={`w-px h-4 md:h-8 mx-0.5 md:mx-2 shrink-0 ${isLight ? 'bg-slate-200' : 'bg-white/20'}`} />

              <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')} className={`p-1.5 md:p-2.5 rounded-md md:rounded-xl transition-colors shrink-0 ${format.bold ? (isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-500 text-white') : (isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/10 text-white')}`} title="Bold"><Bold className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" /></button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec('italic')} className={`p-1.5 md:p-2.5 rounded-md md:rounded-xl transition-colors shrink-0 ${format.italic ? (isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-500 text-white') : (isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/10 text-white')}`} title="Italic"><Italic className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" /></button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec('underline')} className={`p-1.5 md:p-2.5 rounded-md md:rounded-xl transition-colors shrink-0 ${format.underline ? (isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-500 text-white') : (isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/10 text-white')}`} title="Underline"><Underline className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" /></button>

              <div className={`w-px h-4 md:h-8 mx-0.5 md:mx-2 shrink-0 ${isLight ? 'bg-slate-200' : 'bg-white/20'}`} />

              <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertUnorderedList')} className={`p-1.5 md:p-2.5 rounded-md md:rounded-xl transition-colors shrink-0 ${format.list ? (isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-500 text-white') : (isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/10 text-white')}`} title="Bullet List"><List className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" /></button>
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
        isDestructive={confirmModal.isDestructive}
      />
    </div>
  );
}