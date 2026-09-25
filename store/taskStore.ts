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

interface TaskAction {
    type: 'ADD_TASK' | 'UPDATE_TASK' | 'DELETE_TASK' | 'REPLACE_ALL';
    tab?: 'today' | 'tomorrow';
    taskId?: string;
    task?: Task;
    updates?: any;
    data?: any;
}

interface TaskState {
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
    tasks: Task[];
    tomorrowTasks: Task[];
    tasksDate: string;
    taskGroupNames: string[];
    lastModified: number;
    setTaskGroupName: (index: number, name: string) => void;
    setTasks: (tasks: Task[], tab?: 'today' | 'tomorrow') => void;
    addTask: (title: string, duration: number, tab?: 'today' | 'tomorrow', groupId?: number) => void;
    toggleTask: (id: string, tab?: 'today' | 'tomorrow') => void;
    deleteTask: (id: string, tab?: 'today' | 'tomorrow') => Promise<void>;
    moveTaskTab: (id: string, fromTab: 'today' | 'tomorrow') => void;
    updateTaskTitle: (id: string, title: string, tab?: 'today' | 'tomorrow') => void;
    updateTaskDuration: (id: string, decreaseMins: number) => void;
    editTaskDuration: (id: string, newDuration: number, tab?: 'today' | 'tomorrow') => void;
    editTaskTimeSpent: (id: string, newTimeSpent: number, tab?: 'today' | 'tomorrow') => void;
    reorderTasks: (tab: 'today' | 'tomorrow', startIndex: number, endIndex: number) => void;
    checkTasksRollover: () => void;
    fetchTasks: () => Promise<void>;
}

// ----------------------------------------------------------------------
// QUEUE & SYNC ENGINE
// ----------------------------------------------------------------------
export const syncTasksQueue = async () => {
    if (typeof window === 'undefined' || !navigator.onLine) return;
    const token = localStorage.getItem('dashboard_sync_token');
    if (!token) return;

    const queueStr = localStorage.getItem('tasks_offline_queue');
    if (!queueStr) return;

    let actions: TaskAction[] = [];
    try { actions = JSON.parse(queueStr); } catch (e) { return; }
    if (actions.length === 0) return;

    try {
        const res = await fetch('/api/tasks', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ actions })
        });
        
        if (res.ok) {
            localStorage.removeItem('tasks_offline_queue');
        }
    } catch (e) {
        console.warn("[Tasks] Failed to push offline queue. Will retry later.", e);
    }
};

const queueTaskAction = (action: TaskAction) => {
    if (typeof window === 'undefined') return;

    // UNIVERSAL HYDRATION LOCK: Never allow queueing database changes if local data hasn't loaded
    try {
        if (!useTaskStore.getState()._hasHydrated) {
            console.warn("Blocked a ghost save! Tasks haven't hydrated yet.", action.type);
            return;
        }
    } catch (e) {
        // Prevents ReferenceError if called during initial app boot
        return;
    }
    
    let queue: TaskAction[] = [];
    try {
        const queueStr = localStorage.getItem('tasks_offline_queue');
        if (queueStr) queue = JSON.parse(queueStr);
    } catch (e) {}

    queue.push(action);
    localStorage.setItem('tasks_offline_queue', JSON.stringify(queue));

    if (navigator.onLine) {
        syncTasksQueue();
    }
};

// Backward-compatibility wrapper for components still calling pushTasksToDB directly
export const pushTasksToDB = (updates: Partial<TaskState>, immediate: boolean = false) => {
    queueTaskAction({ type: 'REPLACE_ALL', data: updates });
    if (immediate) {
        syncTasksQueue();
    }
};

if (typeof window !== 'undefined') {
    window.addEventListener('online', syncTasksQueue);
    window.addEventListener('app_sync_now', syncTasksQueue);
}


// ----------------------------------------------------------------------
// STORE
// ----------------------------------------------------------------------
export const useTaskStore = create<TaskState>()(
    persist(
        (set, get) => ({
            _hasHydrated: false,
            setHasHydrated: (state) => set({ _hasHydrated: state }),
            tasks: [],
            tomorrowTasks: [],
            tasksDate: getLocalDateString(),
            taskGroupNames: ['Core Tasks', 'Daily Routine', 'Milestones'],
            lastModified: 0,

            setTaskGroupName: (index, name) => {
                set((state) => {
                    const DEFAULT_TAB_NAMES = ['Core Tasks', 'Daily Routine', 'Milestones'];
                    const newNames = [...(state.taskGroupNames || DEFAULT_TAB_NAMES)];
                    const cleanName = name.trim() || DEFAULT_TAB_NAMES[index] || `Tab ${index + 1}`;
                    newNames[index] = cleanName === `Tab ${index + 1}` ? DEFAULT_TAB_NAMES[index] : cleanName;
                    
                    queueTaskAction({ type: 'REPLACE_ALL', data: { taskGroupNames: newNames } });
                    return { taskGroupNames: newNames, lastModified: Date.now() };
                });
            },

            setTasks: (tasks, tab = 'today') => {
                set(() => {
                    const updates = tab === 'today' ? { tasks } : { tomorrowTasks: tasks };
                    queueTaskAction({ type: 'REPLACE_ALL', data: updates });
                    return { ...updates, lastModified: Date.now() };
                });
            },

            addTask: (title, duration, tab = 'today', groupId = 0) => {
                set((state) => {
                    const newTask: Task = { id: Date.now().toString(), title, duration, completed: false, timeSpent: 0, groupId };
                    queueTaskAction({ type: 'ADD_TASK', tab, task: newTask });
                    
                    if (tab === 'today') return { tasks: [...state.tasks, newTask], lastModified: Date.now() };
                    return { tomorrowTasks: [...state.tomorrowTasks, newTask], lastModified: Date.now() };
                });
            },

            toggleTask: (id, tab = 'today') => {
                set((state) => {
                    const list = tab === 'today' ? state.tasks : state.tomorrowTasks;
                    const task = list.find(t => t.id === id);
                    if (!task) return state;

                    queueTaskAction({ type: 'UPDATE_TASK', tab, taskId: id, updates: { completed: !task.completed } });
                    
                    const updatedList = list.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
                    return tab === 'today' ? { tasks: updatedList, lastModified: Date.now() } : { tomorrowTasks: updatedList, lastModified: Date.now() };
                });
            },

            deleteTask: async (id, tab = 'today') => {
                const dashboardState = useDashboardStore.getState();
                if (dashboardState.activeTaskId === id) dashboardState.setActiveTask(null, null);

                set((state) => {
                    queueTaskAction({ type: 'DELETE_TASK', taskId: id });
                    
                    const newTasks = tab === 'today' ? state.tasks.filter((t) => t.id !== id) : state.tasks;
                    const newTomorrowTasks = tab === 'tomorrow' ? state.tomorrowTasks.filter((t) => t.id !== id) : state.tomorrowTasks;
                    const now = Date.now();

                    // Manual localStorage update (preserved from original code)
                    if (typeof window !== 'undefined') {
                        const cached = localStorage.getItem('tasks-storage');
                        if (cached) {
                            try {
                                const parsed = JSON.parse(cached);
                                if (parsed.state) {
                                    parsed.state.tasks = newTasks;
                                    parsed.state.tomorrowTasks = newTomorrowTasks;
                                    parsed.state.lastModified = now;
                                    localStorage.setItem('tasks-storage', JSON.stringify(parsed));
                                }
                            } catch (e) { }
                        }
                    }

                    return { tasks: newTasks, tomorrowTasks: newTomorrowTasks, lastModified: now };
                });
            },

            moveTaskTab: (id, fromTab) => {
                set((state) => {
                    const sourceList = fromTab === 'today' ? state.tasks : state.tomorrowTasks;
                    const targetList = fromTab === 'today' ? state.tomorrowTasks : state.tasks;
                    const taskToMove = sourceList.find(t => t.id === id);
                    
                    if (!taskToMove) return state;
                    
                    const newSourceList = sourceList.filter(t => t.id !== id);
                    const newTargetList = [...targetList, taskToMove];
                    const updates = fromTab === 'today' 
                        ? { tasks: newSourceList, tomorrowTasks: newTargetList }
                        : { tomorrowTasks: newSourceList, tasks: newTargetList };

                    queueTaskAction({ type: 'REPLACE_ALL', data: updates });
                    return { ...updates, lastModified: Date.now() };
                });
            },

            updateTaskTitle: (id, title, tab = 'today') => {
                const dashboardState = useDashboardStore.getState();
                if (dashboardState.activeTaskId === id) dashboardState.setActiveTask(id, title);

                set((state) => {
                    queueTaskAction({ type: 'UPDATE_TASK', tab, taskId: id, updates: { title } });
                    const list = tab === 'today' ? state.tasks : state.tomorrowTasks;
                    const updatedList = list.map(t => t.id === id ? { ...t, title } : t);
                    return tab === 'today' ? { tasks: updatedList, lastModified: Date.now() } : { tomorrowTasks: updatedList, lastModified: Date.now() };
                });
            },

            updateTaskDuration: (id, decreaseMins) => set((state) => {
                let updatedTask: Partial<Task> = {};
                
                const updateTasks = (tasks: Task[]) => tasks.map(t => {
                    if (t.id === id) {
                        const newDuration = Math.max(0, t.duration - decreaseMins);
                        const newTimeSpent = (t.timeSpent || 0) + decreaseMins;
                        updatedTask = { duration: newDuration, timeSpent: newTimeSpent };
                        return { ...t, duration: newDuration, timeSpent: newTimeSpent };
                    }
                    return t;
                });

                const newTasks = updateTasks(state.tasks);
                const newTomorrowTasks = updateTasks(state.tomorrowTasks);
                
                if (updatedTask.duration !== undefined) {
                    const tab = state.tasks.find(t => t.id === id) ? 'today' : 'tomorrow';
                    queueTaskAction({ type: 'UPDATE_TASK', tab, taskId: id, updates: updatedTask });
                }

                return { tasks: newTasks, tomorrowTasks: newTomorrowTasks, lastModified: Date.now() };
            }),

            editTaskDuration: (id, newDuration, tab = 'today') => set((state) => {
                queueTaskAction({ type: 'UPDATE_TASK', tab, taskId: id, updates: { duration: Math.max(0, newDuration) } });
                const list = tab === 'today' ? state.tasks : state.tomorrowTasks;
                const updatedList = list.map(t => t.id === id ? { ...t, duration: Math.max(0, newDuration) } : t);
                return tab === 'today' ? { tasks: updatedList, lastModified: Date.now() } : { tomorrowTasks: updatedList, lastModified: Date.now() };
            }),

            editTaskTimeSpent: (id, newTimeSpent, tab = 'today') => set((state) => {
                const list = tab === 'today' ? state.tasks : state.tomorrowTasks;
                let updatedTask: Partial<Task> = {};
                
                const updatedList = list.map(t => {
                    if (t.id === id) {
                        const diff = newTimeSpent - (t.timeSpent || 0);
                        const newDuration = Math.max(0, t.duration - diff);
                        updatedTask = { timeSpent: Math.max(0, newTimeSpent), duration: newDuration };
                        return { ...t, ...updatedTask };
                    }
                    return t;
                });

                if (updatedTask.timeSpent !== undefined) {
                    queueTaskAction({ type: 'UPDATE_TASK', tab, taskId: id, updates: updatedTask });
                }

                return tab === 'today' ? { tasks: updatedList, lastModified: Date.now() } : { tomorrowTasks: updatedList, lastModified: Date.now() };
            }),

            reorderTasks: (tab, startIndex, endIndex) => set((state) => {
                const list = (tab === 'today' ? [...state.tasks] : [...state.tomorrowTasks]) as Task[];
                if (startIndex < 0 || startIndex >= list.length || endIndex < 0 || endIndex >= list.length) return state;

                const [removed] = list.splice(startIndex, 1);
                list.splice(endIndex, 0, removed);

                const updates = tab === 'today' ? { tasks: list } : { tomorrowTasks: list };
                queueTaskAction({ type: 'REPLACE_ALL', data: updates });
                return { ...updates, lastModified: Date.now() };
            }),

            checkTasksRollover: () => set((state) => {
                //  HYDRATION LOCK: Do not run rollover if the store hasn't booted from local memory yet!
                if (!state._hasHydrated) return state;

                const todayStr = getLocalDateString();
                if (!state.tasksDate || state.tasksDate !== todayStr) {
                    if (!state.tomorrowTasks || state.tomorrowTasks.length === 0) {
                        const updates = { tasksDate: todayStr };
                        queueTaskAction({ type: 'REPLACE_ALL', data: updates });
                        return { ...updates, lastModified: Date.now() };
                    }
                    const newToday = state.tomorrowTasks.map(t => ({ ...t, completed: false, timeSpent: 0, id: Date.now().toString() + Math.random() }));
                    const updates = { tasksDate: todayStr, tasks: [...state.tasks, ...newToday], tomorrowTasks: [] };
                    queueTaskAction({ type: 'REPLACE_ALL', data: updates });
                    return { ...updates, lastModified: Date.now() };
                }
                return state; // Changed from {} to state to be completely safe
            }),

            fetchTasks: async () => {
                // GUARD: Try pushing offline queue first before fetching
                const queueStr = localStorage.getItem('tasks_offline_queue');
                if (queueStr && JSON.parse(queueStr).length > 0) {
                    await syncTasksQueue();
                    if (localStorage.getItem('tasks_offline_queue')) return; // If queue failed to clear, skip fetch
                }

                if (typeof window !== 'undefined' && !navigator.onLine) {
                    console.log("Offline on boot: Skipping task fetch, strictly trusting local cache.");
                    return;
                }

                const token = localStorage.getItem('dashboard_sync_token');
                if (!token) return;

                try {
                    const res = await fetch('/api/tasks', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const json = await res.json();
                        if (json.success && json.data) {

                            const localModified = get().lastModified || 0;
                            const cloudModified = json.data.lastModified || 0;

                            // ONLY overwrite if the cloud data is genuinely newer!
                            if (cloudModified >= localModified) {
                                console.log("Cloud is newer or equal. Syncing tasks DOWN.");
                                set({
                                    tasks: json.data.tasks ?? get().tasks,
                                    tomorrowTasks: json.data.tomorrowTasks ?? get().tomorrowTasks,
                                    tasksDate: json.data.tasksDate ?? get().tasksDate,
                                    taskGroupNames: json.data.taskGroupNames ?? get().taskGroupNames,
                                    lastModified: cloudModified
                                });
                            } else {
                                // Local is newer! Protect local data and push it UP.
                                console.log("Local tasks are newer! Protecting local cache and syncing UP to fix cloud.");
                                queueTaskAction({ 
                                    type: 'REPLACE_ALL', 
                                    data: {
                                        tasks: get().tasks,
                                        tomorrowTasks: get().tomorrowTasks,
                                        tasksDate: get().tasksDate,
                                        taskGroupNames: get().taskGroupNames,
                                        lastModified: localModified
                                    } 
                                });
                            }
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch tasks from DB, keeping local state completely intact:", e);
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