import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Note {
    id: string;
    title: string;
    entries: Record<string, string>; // date string -> html content
}

interface NoteState {
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
    lastModified: number; // Tracks exactly when the note was last touched
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

let noteSaveTimeout: NodeJS.Timeout | null = null;

// Debounced API sync helper
export const pushNotesToDB = async (updates: Partial<NoteState>) => {
    if (typeof window === 'undefined') return;
    if (noteSaveTimeout) clearTimeout(noteSaveTimeout);

    noteSaveTimeout = setTimeout(async () => {
        const token = localStorage.getItem('dashboard_sync_token') || localStorage.getItem('token');
        if (!token || !navigator.onLine) return;
        try {
            await fetch('/api/notes', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(updates) // This now includes lastModified!
            });
        } catch (e) {
            console.error("Failed to sync notes", e);
        }
    }, 3000);
};

export const useNoteStore = create<NoteState>()(
    persist(
        (set, get) => ({
            _hasHydrated: false,
            setHasHydrated: (state) => set({ _hasHydrated: state }),

            lastModified: 0, // Fresh devices start at 0
            notes: [{ id: 'default', title: 'Daily Journal', entries: {} }],
            activeNoteId: 'default',

            setNotes: (notes) => {
                const now = Date.now();
                set({ notes, lastModified: now });
                pushNotesToDB({ notes, lastModified: now });
            },

            addNote: () => set((state) => {
                const emptyNote = state.notes.find(n => n.title === 'New Note' && Object.values(n.entries).every(e => !e || e.trim() === '' || e === '<br>'));
                if (emptyNote) return { activeNoteId: emptyNote.id };

                const newNote = { id: Date.now().toString(), title: 'New Note', entries: {} };
                const newNotes = [newNote, ...state.notes];
                const now = Date.now();

                pushNotesToDB({ notes: newNotes, lastModified: now });
                return { notes: newNotes, activeNoteId: newNote.id, lastModified: now };
            }),

            updateNoteTitle: (id, title) => set((state) => {
                const newNotes = state.notes.map(n => n.id === id ? { ...n, title } : n);
                const now = Date.now();

                pushNotesToDB({ notes: newNotes, lastModified: now });
                return { notes: newNotes, lastModified: now };
            }),

            updateNoteEntry: (id, date, content) => set((state) => {
                const updatedNotes = state.notes.map(n => {
                    if (n.id !== id) return n;
                    const newEntries = { ...n.entries };
                    const cleanText = content.replace(/<[^>]*>?/gm, '').trim();
                    if (!cleanText) {
                        delete newEntries[date];
                    } else {
                        newEntries[date] = content;
                    }
                    return { ...n, entries: newEntries };
                });
                const now = Date.now();

                pushNotesToDB({ notes: updatedNotes, lastModified: now });
                return { notes: updatedNotes, lastModified: now };
            }),

            deleteNote: (id) => set((state) => {
                let newNotes = state.notes.filter(n => n.id !== id);
                if (newNotes.length === 0) {
                    newNotes = [{ id: Date.now().toString(), title: 'Daily Journal', entries: {} }];
                }
                const now = Date.now();

                pushNotesToDB({ notes: newNotes, lastModified: now });
                return {
                    notes: newNotes,
                    activeNoteId: state.activeNoteId === id ? newNotes[0].id : state.activeNoteId,
                    lastModified: now
                };
            }),

            setActiveNote: (id) => set({ activeNoteId: id }),

            reorderNotes: (fromIndex, toIndex) => set((state) => {
                if (fromIndex < 0 || fromIndex >= state.notes.length || toIndex < 0 || toIndex >= state.notes.length) return state;
                const newNotes = [...state.notes];
                const [moved] = newNotes.splice(fromIndex, 1);
                newNotes.splice(toIndex, 0, moved);
                const now = Date.now();

                pushNotesToDB({ notes: newNotes, lastModified: now });
                return { notes: newNotes, lastModified: now };
            }),

            fetchNotes: async () => {
                const token = localStorage.getItem('dashboard_sync_token') || localStorage.getItem('token');
                if (!token || !navigator.onLine) return;
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

                                // GUARD 1: Prevent empty defaults from wiping real cloud data
                                const isLocalEmptyDefault = localLastModified === 0 ||
                                    (state.notes.length === 1 && state.notes[0].id === 'default' && Object.keys(state.notes[0].entries).length === 0);

                                if (isLocalEmptyDefault && cloudNotes.length > 0) {
                                    return { notes: cloudNotes, lastModified: cloudLastModified };
                                }

                                // GUARD 2: Strict Overwrite using exact timestamps
                                if (cloudLastModified > localLastModified) {
                                    // Cloud has newer edits from another device. OVERWRITE local.
                                    return { notes: cloudNotes, lastModified: cloudLastModified };
                                } else if (localLastModified > cloudLastModified) {
                                    // Local has newer edits (likely happened offline). PUSH to cloud!
                                    pushNotesToDB({ notes: state.notes, lastModified: localLastModified });
                                    return state;
                                }

                                return state; // Timestamps match, do nothing.
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