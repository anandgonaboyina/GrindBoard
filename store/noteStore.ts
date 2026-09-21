import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Note {
    id: string;
    title: string;
    entries: Record<string, string>; // date string -> html content
}

interface NoteAction {
    type: 'ADD_NOTE' | 'UPDATE_NOTE_TITLE' | 'UPDATE_NOTE_ENTRY' | 'DELETE_NOTE' | 'REPLACE_ALL';
    noteId?: string;
    note?: Note;
    title?: string;
    date?: string;
    content?: string | null;
    notes?: Note[];
}

interface NoteState {
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
    lastModified: number;
    notes: Note[];
    setNotes: (notes: Note[]) => void;
    activeNoteId: string | null;
    addNote: () => void;
    updateNoteTitle: (id: string, title: string) => void;
    updateNoteEntry: (id: string, date: string, content: string) => void;
    deleteNote: (id: string) => void;
    setActiveNote: (id: string) => void;
    reorderNotes: (fromIndex: number, toIndex: number) => void;
    fetchNotes: () => Promise<void>;
}

// ----------------------------------------------------------------------
// QUEUE & SYNC ENGINE
// ----------------------------------------------------------------------
export const syncNotesQueue = async () => {
    if (typeof window === 'undefined' || !navigator.onLine) return;
    const token = localStorage.getItem('dashboard_sync_token') || localStorage.getItem('token');
    if (!token) return;

    const queueStr = localStorage.getItem('notes_offline_queue');
    if (!queueStr) return;

    let actions: NoteAction[] = [];
    try { actions = JSON.parse(queueStr); } catch (e) { return; }
    if (actions.length === 0) return;

    try {
        const res = await fetch('/api/notes', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ actions })
        });
        
        if (res.ok) {
            localStorage.removeItem('notes_offline_queue');
        }
    } catch (e) {
        console.warn("[Notes] Failed to push offline queue. Will retry later.", e);
    }
};

const queueNoteAction = (action: NoteAction) => {
    if (typeof window === 'undefined') return;
    
    let queue: NoteAction[] = [];
    try {
        const queueStr = localStorage.getItem('notes_offline_queue');
        if (queueStr) queue = JSON.parse(queueStr);
    } catch (e) {}

    queue.push(action);
    localStorage.setItem('notes_offline_queue', JSON.stringify(queue));

    if (navigator.onLine) {
        syncNotesQueue();
    }
};

if (typeof window !== 'undefined') {
    window.addEventListener('online', syncNotesQueue);
    window.addEventListener('app_sync_now', syncNotesQueue);
}

// ----------------------------------------------------------------------
// STORE
// ----------------------------------------------------------------------
export const useNoteStore = create<NoteState>()(
    persist(
        (set, get) => ({
            _hasHydrated: false,
            setHasHydrated: (state) => set({ _hasHydrated: state }),

            lastModified: 0,
            notes: [{ id: 'default', title: 'Daily Journal', entries: {} }],
            activeNoteId: 'default',

            setNotes: (notes) => {
                const now = Date.now();
                queueNoteAction({ type: 'REPLACE_ALL', notes });
                set({ notes, lastModified: now });
            },

            addNote: () => set((state) => {
                const emptyNote = state.notes.find(n => n.title === 'New Note' && Object.values(n.entries).every(e => !e || e.trim() === '' || e === '<br>'));
                if (emptyNote) return { activeNoteId: emptyNote.id };

                const newNote = { id: Date.now().toString(), title: 'New Note', entries: {} };
                const newNotes = [newNote, ...state.notes];
                const now = Date.now();

                queueNoteAction({ type: 'ADD_NOTE', note: newNote });
                return { notes: newNotes, activeNoteId: newNote.id, lastModified: now };
            }),

            updateNoteTitle: (id, title) => set((state) => {
                queueNoteAction({ type: 'UPDATE_NOTE_TITLE', noteId: id, title });
                const newNotes = state.notes.map(n => n.id === id ? { ...n, title } : n);
                return { notes: newNotes, lastModified: Date.now() };
            }),

            updateNoteEntry: (id, date, content) => set((state) => {
                const cleanText = content.replace(/<[^>]*>?/gm, '').trim();
                const isDeleting = !cleanText;

                queueNoteAction({ 
                    type: 'UPDATE_NOTE_ENTRY', 
                    noteId: id, 
                    date, 
                    content: isDeleting ? null : content 
                });

                const updatedNotes = state.notes.map(n => {
                    if (n.id !== id) return n;
                    const newEntries = { ...n.entries };
                    if (isDeleting) {
                        delete newEntries[date];
                    } else {
                        newEntries[date] = content;
                    }
                    return { ...n, entries: newEntries };
                });

                return { notes: updatedNotes, lastModified: Date.now() };
            }),

            deleteNote: (id) => set((state) => {
                queueNoteAction({ type: 'DELETE_NOTE', noteId: id });
                
                let newNotes = state.notes.filter(n => n.id !== id);
                if (newNotes.length === 0) {
                    const defaultNote = { id: Date.now().toString(), title: 'Daily Journal', entries: {} };
                    newNotes = [defaultNote];
                    queueNoteAction({ type: 'ADD_NOTE', note: defaultNote }); // Safely queue the fallback note
                }

                return {
                    notes: newNotes,
                    activeNoteId: state.activeNoteId === id ? newNotes[0].id : state.activeNoteId,
                    lastModified: Date.now()
                };
            }),

            setActiveNote: (id) => set({ activeNoteId: id }),

            reorderNotes: (fromIndex, toIndex) => set((state) => {
                if (fromIndex < 0 || fromIndex >= state.notes.length || toIndex < 0 || toIndex >= state.notes.length) return state;
                const newNotes = [...state.notes];
                const [moved] = newNotes.splice(fromIndex, 1);
                newNotes.splice(toIndex, 0, moved);
                
                queueNoteAction({ type: 'REPLACE_ALL', notes: newNotes });
                return { notes: newNotes, lastModified: Date.now() };
            }),

            fetchNotes: async () => {
                // GUARD 1: Try flushing queue first to avoid overwriting local changes
                const queueStr = localStorage.getItem('notes_offline_queue');
                if (queueStr && JSON.parse(queueStr).length > 0) {
                    await syncNotesQueue();
                    if (localStorage.getItem('notes_offline_queue')) return;
                }

                if (typeof window !== 'undefined' && !navigator.onLine) return;
                const token = localStorage.getItem('dashboard_sync_token') || localStorage.getItem('token');
                if (!token) return;

                try {
                    const res = await fetch(`/api/notes?t=${Date.now()}`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                        cache: 'no-store'
                    });

                    if (res.ok) {
                        const json = await res.json();
                        if (json.success && json.data) {
                            const cloudNotes = json.data.notes || [];
                            const cloudLastModified = json.data.lastModified || 0;

                            set((state) => {
                                const localLastModified = state.lastModified || 0;

                                // Prevent empty defaults from wiping real cloud data
                                const isLocalEmptyDefault = localLastModified === 0 ||
                                    (state.notes.length === 1 && state.notes[0].id === 'default' && Object.keys(state.notes[0].entries).length === 0);

                                if (isLocalEmptyDefault && cloudNotes.length > 0) {
                                    return { notes: cloudNotes, lastModified: cloudLastModified };
                                }

                                // Strict Overwrite using exact timestamps
                                if (cloudLastModified > localLastModified) {
                                    return { notes: cloudNotes, lastModified: cloudLastModified };
                                } else if (localLastModified > cloudLastModified) {
                                    // Local is newer. Push up to cloud.
                                    queueNoteAction({ type: 'REPLACE_ALL', notes: state.notes });
                                    return state;
                                }

                                return state; 
                            });
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch notes from DB", e);
                }
            },
        }),
        {
            name: 'notes-storage',
            onRehydrateStorage: () => (state) => {
                if (state) state.setHasHydrated(true);
            }
        }
    )
);