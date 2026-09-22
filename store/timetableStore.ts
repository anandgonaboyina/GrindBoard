import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_TIMETABLE_GRID = {
    "Mon": { "09:00 AM": "DSA", "10:00 AM": "Web Dev", "11:00 AM": "OS", "12:00 PM": "Lunch", "01:00 PM": "Math", "02:00 PM": "Physics", "03:00 PM": "Project", "04:00 PM": "Free", "05:00 PM": "Free" },
    "Tue": { "09:00 AM": "Math", "10:00 AM": "DSA", "11:00 AM": "Web Dev", "12:00 PM": "Lunch", "01:00 PM": "OS", "02:00 PM": "DB", "03:00 PM": "Project", "04:00 PM": "Free", "05:00 PM": "Free" },
    "Wed": { "09:00 AM": "OS", "10:00 AM": "Math", "11:00 AM": "DSA", "12:00 PM": "Lunch", "01:00 PM": "Web Dev", "02:00 PM": "Physics", "03:00 PM": "Project", "04:00 PM": "Free", "05:00 PM": "Free" },
    "Thu": { "09:00 AM": "DB", "10:00 AM": "OS", "11:00 AM": "Math", "12:00 PM": "Lunch", "01:00 PM": "DSA", "02:00 PM": "Web Dev", "03:00 PM": "Project", "04:00 PM": "Free", "05:00 PM": "Free" },
    "Fri": { "09:00 AM": "Web Dev", "10:00 AM": "DB", "11:00 AM": "OS", "12:00 PM": "Lunch", "01:00 PM": "Math", "02:00 PM": "DSA", "03:00 PM": "Project", "04:00 PM": "Free", "05:00 PM": "Free" },
    "Sat": { "09:00 AM": "Free", "10:00 AM": "Free", "11:00 AM": "Free", "12:00 PM": "Free", "01:00 PM": "Free", "02:00 PM": "Free", "03:00 PM": "Free", "04:00 PM": "Free", "05:00 PM": "Free" },
    "Sun": { "09:00 AM": "Free", "10:00 AM": "Free", "11:00 AM": "Free", "12:00 PM": "Free", "01:00 PM": "Free", "02:00 PM": "Free", "03:00 PM": "Free", "04:00 PM": "Free", "05:00 PM": "Free" },
};

type TimetableGrid = Record<string, Record<string, string>>;

interface TimetableAction {
    type: 'UPDATE_TIMETABLE';
    updates: Record<string, any>;
}

interface TimetableState {
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;

    timetableGrid: TimetableGrid;
    timetableColors: Record<string, Record<string, string>>;
    weekdayTimes: any[];
    weekendTimes: any[];
    timetableStartTime: number;
    timetableWeekendStartTime: number;
    useTimetableRange: boolean;
    isTimetableOpen: boolean;

    updateTimetableCell: (day: string, time: string, subject: string) => void;
    updateTimetableColor: (day: string, time: string, color: string) => void;
    setIsTimetableOpen: (isOpen: boolean) => void;
    toggleTimetableRange: () => void;
    setTimetableStartTime: (mins: number) => void;
    setTimetableWeekendStartTime: (mins: number) => void;
    updateTimetableTime: (isWeekend: boolean, index: number, newTime: string, keyMap?: Record<string, string>) => void;
    renameTimetableKeys: (isWeekend: boolean, keyMap: Record<string, string>) => void;
    resetTimetable: () => void;
    addTimetableRow: (isWeekend: boolean, prepend?: boolean) => void;
    deleteTimetableRow: (isWeekend: boolean, index: number, keyMap?: Record<string, string | null>) => void;
    insertTimetableRow: (isWeekend: boolean, index: number, duration: number, keyMap?: Record<string, string | null>) => void;
    copyTimetableDay: (sourceDay: string, targetDay: string) => void;
    swapTimetableDays: (day1: string, day2: string) => void;
}

// ----------------------------------------------------------------------
// QUEUE & SYNC ENGINE
// ----------------------------------------------------------------------
export const syncTimetableQueue = async () => {
    if (typeof window === 'undefined' || !navigator.onLine) return;
    const token = localStorage.getItem('dashboard_sync_token');
    if (!token) return;

    const queueStr = localStorage.getItem('timetable_offline_queue');
    if (!queueStr) return;

    let actions: TimetableAction[] = [];
    try { actions = JSON.parse(queueStr); } catch (e) { return; }
    if (actions.length === 0) return;

    try {
        const res = await fetch('/api/timetable', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ actions })
        });
        
        if (res.ok) {
            localStorage.removeItem('timetable_offline_queue');
        }
    } catch (e) {
        console.warn("[Timetable] Failed to push offline queue.", e);
    }
};

let syncTimetableTimeout: any = null;

const queueTimetableAction = (action: TimetableAction) => {
    if (typeof window === 'undefined') return;
    
    let queue: TimetableAction[] = [];
    try {
        const queueStr = localStorage.getItem('timetable_offline_queue');
        if (queueStr) queue = JSON.parse(queueStr);
    } catch (e) {}

    // Compress queue: If the last action in the queue is also an UPDATE_TIMETABLE, 
    // merge the updates into it instead of appending a new action.
    if (action.type === 'UPDATE_TIMETABLE' && queue.length > 0 && queue[queue.length - 1].type === 'UPDATE_TIMETABLE') {
        queue[queue.length - 1].updates = {
            ...queue[queue.length - 1].updates,
            ...action.updates
        };
    } else {
        queue.push(action);
    }

    localStorage.setItem('timetable_offline_queue', JSON.stringify(queue));

    if (navigator.onLine) {
        if (syncTimetableTimeout) clearTimeout(syncTimetableTimeout);
        syncTimetableTimeout = setTimeout(syncTimetableQueue, 2000);
    }
};

// Legacy wrapper for bulk restores/wipes
export const pushTimetableToDB = (updates: any) => {
    queueTimetableAction({ type: 'UPDATE_TIMETABLE', updates });
};

if (typeof window !== 'undefined') {
    window.addEventListener('online', syncTimetableQueue);
    window.addEventListener('app_sync_now', syncTimetableQueue);
    
    // Fallback sync for tab closes
    window.addEventListener('beforeunload', () => {
        const queueStr = localStorage.getItem('timetable_offline_queue');
        const token = localStorage.getItem('dashboard_sync_token');
        if (queueStr && token && navigator.onLine) {
            try {
                const actions = JSON.parse(queueStr);
                if (actions.length > 0) {
                    const blob = new Blob([JSON.stringify({ actions })], { type: 'application/json' });
                    navigator.sendBeacon('/api/timetable', blob); // Best effort, but queue stays safe in localStorage anyway!
                }
            } catch (e) {}
        }
    });
}

// ----------------------------------------------------------------------
// STORE
// ----------------------------------------------------------------------
export const useTimetableStore = create<TimetableState>()(
    persist(
        (set, get) => ({
            _hasHydrated: false,
            setHasHydrated: (state) => set({ _hasHydrated: state }),

            timetableGrid: JSON.parse(JSON.stringify(DEFAULT_TIMETABLE_GRID)),
            timetableColors: {},
            weekdayTimes: ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"],
            weekendTimes: ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"],
            timetableStartTime: 540,
            timetableWeekendStartTime: 540,
            useTimetableRange: true,
            isTimetableOpen: false,

            updateTimetableCell: (day, time, subject) => {
                set((state) => {
                    const newGrid = { ...state.timetableGrid, [day]: { ...state.timetableGrid[day], [time]: subject } };
                    // Surgical DB update using Dot Notation!
                    queueTimetableAction({ type: 'UPDATE_TIMETABLE', updates: { [`timetableGrid.${day}.${time}`]: subject } });
                    return { timetableGrid: newGrid };
                });
            },

            updateTimetableColor: (day, time, color) => {
                set((state) => {
                    const newColors = { ...state.timetableColors, [day]: { ...(state.timetableColors[day] || {}), [time]: color } };
                    // Surgical DB update using Dot Notation!
                    queueTimetableAction({ type: 'UPDATE_TIMETABLE', updates: { [`timetableColors.${day}.${time}`]: color } });
                    return { timetableColors: newColors };
                });
            },

            copyTimetableDay: (sourceDay, targetDay) => {
                set((state) => {
                    const newGrid = { ...state.timetableGrid };
                    const newColors = { ...state.timetableColors };
                    
                    if (state.timetableGrid[sourceDay]) {
                        newGrid[targetDay] = { ...state.timetableGrid[sourceDay] };
                    } else {
                        delete newGrid[targetDay];
                    }
                    
                    if (state.timetableColors[sourceDay]) {
                        newColors[targetDay] = { ...state.timetableColors[sourceDay] };
                    } else {
                        delete newColors[targetDay];
                    }
                    
                    queueTimetableAction({ type: 'UPDATE_TIMETABLE', updates: { timetableGrid: newGrid, timetableColors: newColors } });
                    return { timetableGrid: newGrid, timetableColors: newColors };
                });
            },

            swapTimetableDays: (day1, day2) => {
                set((state) => {
                    const newGrid = { ...state.timetableGrid };
                    const newColors = { ...state.timetableColors };
                    
                    const tempGridDay1 = newGrid[day1] ? { ...newGrid[day1] } : undefined;
                    const tempGridDay2 = newGrid[day2] ? { ...newGrid[day2] } : undefined;
                    if (tempGridDay2) newGrid[day1] = tempGridDay2; else delete newGrid[day1];
                    if (tempGridDay1) newGrid[day2] = tempGridDay1; else delete newGrid[day2];
                    
                    const tempColorDay1 = newColors[day1] ? { ...newColors[day1] } : undefined;
                    const tempColorDay2 = newColors[day2] ? { ...newColors[day2] } : undefined;
                    if (tempColorDay2) newColors[day1] = tempColorDay2; else delete newColors[day1];
                    if (tempColorDay1) newColors[day2] = tempColorDay1; else delete newColors[day2];
                    
                    queueTimetableAction({ type: 'UPDATE_TIMETABLE', updates: { timetableGrid: newGrid, timetableColors: newColors } });
                    return { timetableGrid: newGrid, timetableColors: newColors };
                });
            },

            setIsTimetableOpen: (isOpen) => set({ isTimetableOpen: isOpen }),

            toggleTimetableRange: () => {
                set((state) => {
                    const newState = !state.useTimetableRange;
                    queueTimetableAction({ type: 'UPDATE_TIMETABLE', updates: { useTimetableRange: newState } });
                    return { useTimetableRange: newState };
                });
            },

            setTimetableStartTime: (mins) => {
                set({ timetableStartTime: mins });
                queueTimetableAction({ type: 'UPDATE_TIMETABLE', updates: { timetableStartTime: mins } });
            },

            setTimetableWeekendStartTime: (mins) => {
                set({ timetableWeekendStartTime: mins });
                queueTimetableAction({ type: 'UPDATE_TIMETABLE', updates: { timetableWeekendStartTime: mins } });
            },

            updateTimetableTime: (isWeekend, index, newTime, keyMap) => set((state) => {
                const targetArray = isWeekend ? state.weekendTimes : state.weekdayTimes;
                const fallbackArray = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"];
                const timesList = targetArray || fallbackArray;
                const newTimes = [...timesList];
                const oldTime = newTimes[index];
                newTimes[index] = newTime;

                const newGrid = { ...state.timetableGrid };
                const newColors = { ...(state.timetableColors || {}) };
                const targetDays = isWeekend ? ["Sat", "Sun"] : ["Mon", "Tue", "Wed", "Thu", "Fri"];

                if (keyMap) {
                    targetDays.forEach(day => {
                        if (newGrid[day]) {
                            const currentDayData = { ...newGrid[day] };
                            let updatedDayData: Record<string, string> = {};
                            Object.entries(currentDayData).forEach(([oldKey, value]) => {
                                const newKey = keyMap[oldKey] || oldKey;
                                updatedDayData[newKey] = value as string;
                            });
                            newGrid[day] = updatedDayData;
                        }
                        if (newColors[day]) {
                            const currentDayColors = { ...newColors[day] };
                            let updatedDayColors: Record<string, string> = {};
                            Object.entries(currentDayColors).forEach(([oldKey, value]) => {
                                const newKey = keyMap[oldKey] || oldKey;
                                updatedDayColors[newKey] = value as string;
                            });
                            newColors[day] = updatedDayColors;
                        }
                    });
                } else {
                    targetDays.forEach(day => {
                        if (newGrid[day] && newGrid[day][oldTime] !== undefined) {
                            newGrid[day] = { ...newGrid[day] };
                            newGrid[day][newTime] = newGrid[day][oldTime];
                            delete newGrid[day][oldTime];
                        }
                        if (newColors[day] && newColors[day][oldTime] !== undefined) {
                            newColors[day] = { ...newColors[day] };
                            newColors[day][newTime] = newColors[day][oldTime];
                            delete newColors[day][oldTime];
                        }
                    });
                }

                const payload = isWeekend
                    ? { weekendTimes: newTimes, timetableGrid: newGrid, timetableColors: newColors }
                    : { weekdayTimes: newTimes, timetableGrid: newGrid, timetableColors: newColors };

                queueTimetableAction({ type: 'UPDATE_TIMETABLE', updates: payload });
                return payload as any;
            }),

            renameTimetableKeys: (isWeekend, keyMap) => set((state) => {
                const newGrid = { ...state.timetableGrid };
                const newColors = { ...(state.timetableColors || {}) };
                const targetDays = isWeekend ? ["Sat", "Sun"] : ["Mon", "Tue", "Wed", "Thu", "Fri"];

                targetDays.forEach(day => {
                    if (newGrid[day]) {
                        const currentDayData = { ...newGrid[day] };
                        let updatedDayData: Record<string, string> = {};
                        Object.entries(currentDayData).forEach(([oldKey, value]) => {
                            const newKey = keyMap[oldKey] || oldKey;
                            updatedDayData[newKey] = value as string;
                        });
                        newGrid[day] = updatedDayData;
                    }
                    if (newColors[day]) {
                        const currentDayColors = { ...newColors[day] };
                        let updatedDayColors: Record<string, string> = {};
                        Object.entries(currentDayColors).forEach(([oldKey, value]) => {
                            const newKey = keyMap[oldKey] || oldKey;
                            updatedDayColors[newKey] = value as string;
                        });
                        newColors[day] = updatedDayColors;
                    }
                });

                const payload = { timetableGrid: newGrid, timetableColors: newColors };
                queueTimetableAction({ type: 'UPDATE_TIMETABLE', updates: payload });
                return payload;
            }),

            resetTimetable: () => set(() => {
                const payload = {
                    timetableGrid: JSON.parse(JSON.stringify(DEFAULT_TIMETABLE_GRID)),
                    timetableColors: {},
                    weekdayTimes: ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"],
                    weekendTimes: ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"],
                    timetableStartTime: 540,
                    timetableWeekendStartTime: 540,
                };
                queueTimetableAction({ type: 'UPDATE_TIMETABLE', updates: payload });
                return payload;
            }),

            addTimetableRow: (isWeekend, prepend = false) => set((state) => {
                const targetArray = isWeekend ? state.weekendTimes : state.weekdayTimes;
                const timesList = targetArray || [];
                const newTimes = prepend ? ["60", ...timesList] : [...timesList, "60"];
                const payload = isWeekend ? { weekendTimes: newTimes } : { weekdayTimes: newTimes };
                queueTimetableAction({ type: 'UPDATE_TIMETABLE', updates: payload });
                return payload as any;
            }),

            insertTimetableRow: (isWeekend, index, duration, keyMap?: Record<string, string | null>) => set((state) => {
                const targetArray = isWeekend ? state.weekendTimes : state.weekdayTimes;
                const timesList = targetArray || [];
                const newTimes = [...timesList];
                newTimes.splice(index, 0, duration.toString());

                let payload: any = isWeekend ? { weekendTimes: newTimes } : { weekdayTimes: newTimes };

                if (keyMap) {
                    const newGrid = { ...state.timetableGrid };
                    const newColors = { ...(state.timetableColors || {}) };
                    const targetDays = isWeekend ? ["Sat", "Sun"] : ["Mon", "Tue", "Wed", "Thu", "Fri"];

                    targetDays.forEach(day => {
                        if (newGrid[day]) {
                            const currentDayData = { ...newGrid[day] };
                            let updatedDayData: Record<string, string> = {};
                            Object.entries(currentDayData).forEach(([oldKey, value]) => {
                                if (keyMap[oldKey] !== undefined) {
                                    if (keyMap[oldKey] !== null) {
                                        updatedDayData[keyMap[oldKey] as string] = value as string;
                                    }
                                } else {
                                    updatedDayData[oldKey] = value as string;
                                }
                            });
                            newGrid[day] = updatedDayData;
                        }
                        if (newColors[day]) {
                            const currentDayColors = { ...newColors[day] };
                            let updatedDayColors: Record<string, string> = {};
                            Object.entries(currentDayColors).forEach(([oldKey, value]) => {
                                if (keyMap[oldKey] !== undefined) {
                                    if (keyMap[oldKey] !== null) {
                                        updatedDayColors[keyMap[oldKey] as string] = value as string;
                                    }
                                } else {
                                    updatedDayColors[oldKey] = value as string;
                                }
                            });
                            newColors[day] = updatedDayColors;
                        }
                    });
                    
                    payload.timetableGrid = newGrid;
                    payload.timetableColors = newColors;
                }

                queueTimetableAction({ type: 'UPDATE_TIMETABLE', updates: payload });
                return payload;
            }),

            deleteTimetableRow: (isWeekend, index, keyMap?: Record<string, string | null>) => set((state) => {
                const targetArray = isWeekend ? state.weekendTimes : state.weekdayTimes;
                const timesList = targetArray || [];
                const newTimes = timesList.filter((_, i) => i !== index);
                
                let payload: any = isWeekend ? { weekendTimes: newTimes } : { weekdayTimes: newTimes };

                if (keyMap) {
                    const newGrid = { ...state.timetableGrid };
                    const newColors = { ...(state.timetableColors || {}) };
                    const targetDays = isWeekend ? ["Sat", "Sun"] : ["Mon", "Tue", "Wed", "Thu", "Fri"];

                    targetDays.forEach(day => {
                        if (newGrid[day]) {
                            const currentDayData = { ...newGrid[day] };
                            let updatedDayData: Record<string, string> = {};
                            Object.entries(currentDayData).forEach(([oldKey, value]) => {
                                if (keyMap[oldKey] !== undefined) {
                                    if (keyMap[oldKey] !== null) {
                                        updatedDayData[keyMap[oldKey] as string] = value as string;
                                    }
                                } else {
                                    updatedDayData[oldKey] = value as string;
                                }
                            });
                            newGrid[day] = updatedDayData;
                        }
                        if (newColors[day]) {
                            const currentDayColors = { ...newColors[day] };
                            let updatedDayColors: Record<string, string> = {};
                            Object.entries(currentDayColors).forEach(([oldKey, value]) => {
                                if (keyMap[oldKey] !== undefined) {
                                    if (keyMap[oldKey] !== null) {
                                        updatedDayColors[keyMap[oldKey] as string] = value as string;
                                    }
                                } else {
                                    updatedDayColors[oldKey] = value as string;
                                }
                            });
                            newColors[day] = updatedDayColors;
                        }
                    });
                    
                    payload.timetableGrid = newGrid;
                    payload.timetableColors = newColors;
                }

                queueTimetableAction({ type: 'UPDATE_TIMETABLE', updates: payload });
                return payload;
            })
        }),
        {
            name: 'timetable-storage',
            partialize: (state) => Object.fromEntries(
                Object.entries(state).filter(([key]) => !['isTimetableOpen', '_hasHydrated'].includes(key))
            ),
            onRehydrateStorage: () => (state) => {
                if (state) state.setHasHydrated(true);
            }
        }
    )
);