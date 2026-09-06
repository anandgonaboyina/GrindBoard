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

interface TimetableState {
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;

    timetableGrid: TimetableGrid;
    timetableColors: Record<string, Record<string, string>>;
    weekdayTimes: string[];
    weekendTimes: string[];
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
    deleteTimetableRow: (isWeekend: boolean, index: number) => void;
}

// Helper to push to our new isolated API
export const pushTimetableToDB = async (updates: Partial<TimetableState>) => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('dashboard_sync_token');
    if (token && navigator.onLine) {
        try {
            await fetch('/api/timetable', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ updates })
            });
        } catch (e) {
            console.error("Failed to sync timetable", e);
        }
    }
};

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
                    pushTimetableToDB({ timetableGrid: newGrid });
                    return { timetableGrid: newGrid };
                });
            },

            updateTimetableColor: (day, time, color) => {
                set((state) => {
                    const newColors = { ...state.timetableColors, [day]: { ...(state.timetableColors[day] || {}), [time]: color } };
                    pushTimetableToDB({ timetableColors: newColors });
                    return { timetableColors: newColors };
                });
            },

            setIsTimetableOpen: (isOpen) => set({ isTimetableOpen: isOpen }),

            toggleTimetableRange: () => {
                set((state) => {
                    const newState = !state.useTimetableRange;
                    pushTimetableToDB({ useTimetableRange: newState });
                    return { useTimetableRange: newState };
                });
            },

            setTimetableStartTime: (mins) => {
                set({ timetableStartTime: mins });
                pushTimetableToDB({ timetableStartTime: mins });
            },

            setTimetableWeekendStartTime: (mins) => {
                set({ timetableWeekendStartTime: mins });
                pushTimetableToDB({ timetableWeekendStartTime: mins });
            },

            updateTimetableTime: (isWeekend, index, newTime, keyMap) => set((state) => {
                const targetArray = isWeekend ? state.weekendTimes : state.weekdayTimes;
                const fallbackArray = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"];
                const timesList = targetArray || fallbackArray;
                const newTimes = [...timesList];
                const oldTime = newTimes[index];
                newTimes[index] = newTime;

                // Also update the timetableGrid and timetableColors keys to preserve data
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

                pushTimetableToDB(payload);
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
                pushTimetableToDB(payload);
                return payload;
            }),

            resetTimetable: () => set(() => {
                const payload = {
                    timetableGrid: JSON.parse(JSON.stringify(DEFAULT_TIMETABLE_GRID)),
                    timetableColors: {},
                    weekdayTimes: ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"],
                    weekendTimes: ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"],
                    // FIX: Force start times back to 09:00 AM (540 mins) so the grid keys align!
                    timetableStartTime: 540,
                    timetableWeekendStartTime: 540,
                };
                pushTimetableToDB(payload);
                return payload;
            }),

            addTimetableRow: (isWeekend, prepend = false) => set((state) => {
                const targetArray = isWeekend ? state.weekendTimes : state.weekdayTimes;
                const timesList = targetArray || [];
                const newTimes = prepend ? ["60", ...timesList] : [...timesList, "60"];
                const payload = isWeekend ? { weekendTimes: newTimes } : { weekdayTimes: newTimes };
                pushTimetableToDB(payload);
                return payload as any;
            }),

            deleteTimetableRow: (isWeekend, index) => set((state) => {
                const targetArray = isWeekend ? state.weekendTimes : state.weekdayTimes;
                const timesList = targetArray || [];
                const newTimes = timesList.filter((_, i) => i !== index);
                const payload = isWeekend ? { weekendTimes: newTimes } : { weekdayTimes: newTimes };
                pushTimetableToDB(payload);
                return payload as any;
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