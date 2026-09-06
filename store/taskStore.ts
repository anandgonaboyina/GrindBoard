import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getLocalDateString } from '@/utils/date';
import { useDashboardStore } from './dashboardStore';

export interface Task {
    id: string;
    title: string;
    duration: number;
    completed: boolean;
    timeSpent?: number;
    groupId?: number;
}

interface TaskState {
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
    tasks: Task[];
    tomorrowTasks: Task[];
    tasksDate: string;
    taskGroupNames: string[];
    setTaskGroupName: (index: number, name: string) => void;
    setTasks: (tasks: Task[], tab?: 'today' | 'tomorrow') => void;
    addTask: (title: string, duration: number, tab?: 'today' | 'tomorrow', groupId?: number) => void;
    toggleTask: (id: string, tab?: 'today' | 'tomorrow') => void;
    deleteTask: (id: string, tab?: 'today' | 'tomorrow') => void;
    moveTaskTab: (id: string, fromTab: 'today' | 'tomorrow') => void;
    updateTaskTitle: (id: string, title: string, tab?: 'today' | 'tomorrow') => void;
    editTaskDuration: (id: string, newDuration: number, tab?: 'today' | 'tomorrow') => void;
    editTaskTimeSpent: (id: string, newTimeSpent: number, tab?: 'today' | 'tomorrow') => void;
    reorderTasks: (tab: 'today' | 'tomorrow', startIndex: number, endIndex: number) => void;
    checkTasksRollover: () => void;
    fetchTasks: () => Promise<void>;
}

let taskSaveTimeout: NodeJS.Timeout | null = null;


// Debounced API sync helper (waits 1000ms after last edit before hitting DB)
export const pushTasksToDB = async (updates: Partial<TaskState>) => {
    if (typeof window === 'undefined') return;

    if (taskSaveTimeout) clearTimeout(taskSaveTimeout);

    taskSaveTimeout = setTimeout(async () => {
        const token = localStorage.getItem('dashboard_sync_token');
        if (!token || !navigator.onLine) return;
        try {
            const res = await fetch('/api/tasks', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ updates })
            });
            console.log(res.json());
        } catch (e) {
            console.error("Failed to sync tasks", e);
        }
    }, 5000);
};


export const useTaskStore = create<TaskState>()(
    persist(
        (set, get) => ({
            _hasHydrated: false,
            setHasHydrated: (state) => set({ _hasHydrated: state }),
            tasks: [],
            tomorrowTasks: [],
            tasksDate: getLocalDateString(),
            taskGroupNames: ['Core Tasks', 'Daily Routine', 'Milestones'],

            setTaskGroupName: (index, name) => {
                set((state) => {
                    const DEFAULT_TAB_NAMES = ['Core Tasks', 'Daily Routine', 'Milestones'];
                    const newNames = [...(state.taskGroupNames || DEFAULT_TAB_NAMES)];
                    const cleanName = name.trim() || DEFAULT_TAB_NAMES[index] || `Tab ${index + 1}`;
                    newNames[index] = cleanName === `Tab ${index + 1}` ? DEFAULT_TAB_NAMES[index] : cleanName;
                    pushTasksToDB({ taskGroupNames: newNames });
                    return { taskGroupNames: newNames };
                });
            },

            setTasks: (tasks, tab = 'today') => {
                set(() => {
                    const updates = tab === 'today' ? { tasks } : { tomorrowTasks: tasks };
                    pushTasksToDB(updates);
                    return updates;
                });
            },

            addTask: (title, duration, tab = 'today', groupId = 0) => {
                set((state) => {
                    const newTask = { id: Date.now().toString(), title, duration, completed: false, timeSpent: 0, groupId };
                    const updates = tab === 'today' ? { tasks: [...state.tasks, newTask] } : { tomorrowTasks: [...state.tomorrowTasks, newTask] };
                    pushTasksToDB(updates);
                    return updates;
                });
            },

            toggleTask: (id, tab = 'today') => {
                set((state) => {
                    const updates = tab === 'today'
                        ? { tasks: state.tasks.map((t) => t.id === id ? { ...t, completed: !t.completed } : t) }
                        : { tomorrowTasks: state.tomorrowTasks.map((t) => t.id === id ? { ...t, completed: !t.completed } : t) };
                    pushTasksToDB(updates);
                    return updates;
                });
            },

            deleteTask: async (id, tab = 'today') => {
                const state = get();
                const dashboardState = useDashboardStore.getState();
                if (dashboardState.activeTaskId === id) dashboardState.setActiveTask(null, null);

                const newTasks = tab === 'today' ? state.tasks.filter((t) => t.id !== id) : state.tasks;
                const newTomorrowTasks = tab === 'tomorrow' ? state.tomorrowTasks.filter((t) => t.id !== id) : state.tomorrowTasks;
                const now = Date.now();

                // 1. Update local state and timestamp immediately
                set({
                    tasks: newTasks,
                    tomorrowTasks: newTomorrowTasks,
                });

                // 2. Clear out local storage cache override immediately if using persist
                if (typeof window !== 'undefined') {
                    const cached = localStorage.getItem('task-storage'); // Update key if named differently
                    if (cached) {
                        try {
                            const parsed = JSON.parse(cached);
                            if (parsed.state) {
                                parsed.state.tasks = newTasks;
                                parsed.state.tomorrowTasks = newTomorrowTasks;
                                parsed.state.lastModified = now;
                                localStorage.setItem('task-storage', JSON.stringify(parsed));
                            }
                        } catch (e) { }
                    }
                }
                const updates = {
                    tasks: newTasks,
                    tomorrowTasks: newTomorrowTasks
                };
                pushTasksToDB(updates);

            },

            moveTaskTab: (id, fromTab) => {
                set((state) => {
                    if (fromTab === 'today') {
                        const taskToMove = state.tasks.find(t => t.id === id);
                        if (!taskToMove) return state;
                        const updates = { tasks: state.tasks.filter(t => t.id !== id), tomorrowTasks: [...state.tomorrowTasks, taskToMove] };
                        pushTasksToDB(updates);
                        return updates;
                    } else {
                        const taskToMove = state.tomorrowTasks.find(t => t.id === id);
                        if (!taskToMove) return state;
                        const updates = { tomorrowTasks: state.tomorrowTasks.filter(t => t.id !== id), tasks: [...state.tasks, taskToMove] };
                        pushTasksToDB(updates);
                        return updates;
                    }
                });
            },

            updateTaskTitle: (id, title, tab = 'today') => {
                set((state) => {
                    const dashboardState = useDashboardStore.getState();
                    if (dashboardState.activeTaskId === id) dashboardState.setActiveTask(id, title);

                    const updates = tab === 'today'
                        ? { tasks: state.tasks.map((t) => t.id === id ? { ...t, title } : t) }
                        : { tomorrowTasks: state.tomorrowTasks.map((t) => t.id === id ? { ...t, title } : t) };
                    pushTasksToDB(updates);
                    return updates;
                });
            },

            editTaskDuration: (id, newDuration, tab = 'today') => set((state) => {
                const updates = tab === 'today'
                    ? { tasks: state.tasks.map(t => t.id === id ? { ...t, duration: Math.max(0, newDuration) } : t) }
                    : { tomorrowTasks: state.tomorrowTasks.map(t => t.id === id ? { ...t, duration: Math.max(0, newDuration) } : t) };
                pushTasksToDB(updates);
                return updates;
            }),

            editTaskTimeSpent: (id, newTimeSpent, tab = 'today') => set((state) => {
                const updateTasks = (tasks: Task[]) => tasks.map(t => {
                    if (t.id === id) {
                        const diff = newTimeSpent - (t.timeSpent || 0);
                        return { ...t, timeSpent: Math.max(0, newTimeSpent), duration: Math.max(0, t.duration - diff) };
                    }
                    return t;
                });
                const updates = tab === 'today' ? { tasks: updateTasks(state.tasks) } : { tomorrowTasks: updateTasks(state.tomorrowTasks) };
                pushTasksToDB(updates);
                return updates;
            }),

            reorderTasks: (tab, startIndex, endIndex) => set((state) => {
                const list = tab === 'today' ? Array.apply(null, state.tasks as any) : Array.apply(null, state.tomorrowTasks as any);
                const [removed] = list.splice(startIndex, 1);
                list.splice(endIndex, 0, removed);
                const updates = tab === 'today' ? { tasks: list } : { tomorrowTasks: list };
                pushTasksToDB(updates);
                return updates;
            }),

            checkTasksRollover: () => set((state) => {
                const todayStr = getLocalDateString();
                if (!state.tasksDate || state.tasksDate !== todayStr) {
                    if (!state.tomorrowTasks || state.tomorrowTasks.length === 0) {
                        const updates = { tasksDate: todayStr };
                        pushTasksToDB(updates);
                        return updates;
                    }
                    const newToday = state.tomorrowTasks.map(t => ({ ...t, completed: false, timeSpent: 0, id: Date.now().toString() + Math.random() }));
                    const updates = { tasksDate: todayStr, tasks: [...state.tasks, ...newToday], tomorrowTasks: [] };
                    pushTasksToDB(updates);
                    return updates;
                }
                return {};
            }),
            fetchTasks: async () => {
                const token = localStorage.getItem('dashboard_sync_token');
                if (!token) return;

                try {
                    const res = await fetch('/api/tasks', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const json = await res.json();
                        if (json.success && json.data) {
                            set({
                                tasks: json.data.tasks || [],
                                tomorrowTasks: json.data.tomorrowTasks || [],
                                tasksDate: json.data.tasksDate || '',
                                taskGroupNames: json.data.taskGroupNames || ['Core Tasks', 'Daily Routine', 'Milestones'],
                                lastModified: json.data.lastModified || Date.now()
                            });
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch tasks from DB", e);
                }
            },
        }),
        {
            name: 'tasks-storage',
            onRehydrateStorage: () => (state) => {
                if (state) state.setHasHydrated(true);
            }
        }
    )
);