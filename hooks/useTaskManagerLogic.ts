import { useState, useRef, useEffect, useCallback } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { useTaskStore } from '@/store/taskStore';
import { fetchQuote } from '@/utils/quoteEngine';

export function useTaskManagerLogic() {
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDuration, setNewTaskDuration] = useState('');
    const [activeTab, setActiveTab] = useState<'today' | 'tomorrow'>('today');
    const [activeGroupTab, setActiveGroupTab] = useState<number>(0);
    const [editingGroupIndex, setEditingGroupIndex] = useState<number | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [isInfoOpen, setIsInfoOpen] = useState(false);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean; title: string; message: React.ReactNode; isDestructive?: boolean; onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    const dashboardStore = useDashboardStore();
    const taskStore = useTaskStore();

    useEffect(() => { taskStore.fetchTasks(); }, [taskStore.fetchTasks]);

    useEffect(() => {
        const fetchGroups = async () => {
            const token = localStorage.getItem('dashboard_sync_token');
            if (!token) return;
            try {
                const res = await fetch('/api/groups', { headers: { 'Authorization': `Bearer ${token}` } });
                if (res.ok) {
                    const data = await res.json();
                    dashboardStore.setUserGroups(data.groups || []);
                }
            } catch (e) { }
        };
        fetchGroups();
    }, [dashboardStore.setUserGroups]);

    const draggedIndexRef = useRef<number | null>(null);
    useEffect(() => { draggedIndexRef.current = draggedIndex; }, [draggedIndex]);

    const isTaskCompletedLocal = useCallback((t: any) => {
        return (Boolean(t.completed) && t.completed !== 'false') || (t.duration !== undefined && t.duration <= 0);
    }, []);

    // ROCK-SOLID MOBILE & RAPID DRAG ENGINE
    useEffect(() => {
        const handlePointerMove = (e: PointerEvent | TouchEvent) => {
            if (draggedIndexRef.current === null) return;
            
            // Get exact coordinates whether it's a mouse or touch
            const clientX = 'touches' in e ? e.touches[0].clientX : (e as PointerEvent).clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : (e as PointerEvent).clientY;
            
            // Find what element is currently under the finger/cursor
            const el = document.elementFromPoint(clientX, clientY);
            if (!el) return;

            const taskEl = el.closest('[data-task-index]');
            if (taskEl) {
                const targetIndex = parseInt(taskEl.getAttribute('data-task-index') || '', 10);
                
                if (!isNaN(targetIndex) && targetIndex !== draggedIndexRef.current) {
                    // Prevent "2nd-to-1st stale bug" by reading FRESH state directly from store
                    const freshTasks = useTaskStore.getState()[activeTab === 'today' ? 'tasks' : 'tomorrowTasks'];
                    const activeTaskId = useDashboardStore.getState().activeTaskId;
                    
                    const groupFiltered = freshTasks.filter((t: any) => (t.groupId || 0) === activeGroupTab);
                    const freshFiltered = groupFiltered.sort((a: any, b: any) => {
                        if (a.id === activeTaskId && b.id !== activeTaskId) return -1;
                        if (b.id === activeTaskId && a.id !== activeTaskId) return 1;
                        const aDone = isTaskCompletedLocal(a);
                        const bDone = isTaskCompletedLocal(b);
                        if (aDone === bDone) return 0;
                        return aDone ? 1 : -1;
                    });

                    const draggedTask = freshFiltered[draggedIndexRef.current];
                    const targetTask = freshFiltered[targetIndex];

                    if (draggedTask && targetTask) {
                        const realDraggedIndex = freshTasks.findIndex((t: any) => t.id === draggedTask.id);
                        const realTargetIndex = freshTasks.findIndex((t: any) => t.id === targetTask.id);

                        if (realDraggedIndex !== -1 && realTargetIndex !== -1) {
                            useTaskStore.getState().reorderTasks(activeTab, realDraggedIndex, realTargetIndex);
                            draggedIndexRef.current = targetIndex; // Instant local update
                            setDraggedIndex(targetIndex);          // React UI update
                        }
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

        // Attach globally so tracking works even if finger slides off the specific task
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
    }, [activeTab, activeGroupTab, isTaskCompletedLocal]);

    useEffect(() => { taskStore.checkTasksRollover(); }, [taskStore.checkTasksRollover, dashboardStore.isTaskManagerOpen]);

    const currentTasks = activeTab === 'today' ? taskStore.tasks : taskStore.tomorrowTasks;

    const handleToggleTask = async (id: string) => {
        const task = currentTasks.find(t => t.id === id);
        taskStore.toggleTask(id, activeTab);
        if (task && !task.completed) {
            dashboardStore.showQuotePopup(await fetchQuote());
        }
    };

    const handleRestartTask = (id: string) => {
        setConfirmModal({
            isOpen: true, title: 'Restart Task', message: 'Are you sure you want to restart this task?', isDestructive: false,
            onConfirm: () => {
                taskStore.setTasks(currentTasks.map(t => {
                    if (t.id === id) {
                        const totalDuration = t.duration + (t.timeSpent || 0);
                        return { ...t, completed: false, duration: totalDuration > 0 ? totalDuration : 25, timeSpent: 0 };
                    }
                    return t;
                }), activeTab);
            }
        });
    };

    const handleRestartAllCompleted = () => {
        setConfirmModal({
            isOpen: true, title: 'Restart All Completed', message: 'Are you sure you want to restart ALL completed tasks in this group?', isDestructive: false,
            onConfirm: () => {
                taskStore.setTasks(currentTasks.map(t => {
                    if (isTaskCompletedLocal(t) && (t.groupId || 0) === activeGroupTab) {
                        const totalDuration = t.duration + (t.timeSpent || 0);
                        return { ...t, completed: false, duration: totalDuration > 0 ? totalDuration : 25, timeSpent: 0 };
                    }
                    return t;
                }), activeTab);
            }
        });
    };

    const handleAddTask = (e: React.FormEvent | React.KeyboardEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;
        taskStore.addTask(newTaskTitle.trim(), parseInt(newTaskDuration) || 25, activeTab, activeGroupTab);
        setNewTaskTitle('');
        setNewTaskDuration('');
    };

    const groupFilteredTasks = currentTasks.filter(t => (t.groupId || 0) === activeGroupTab);
    const filteredTasks = groupFilteredTasks.sort((a, b) => {
        if (a.id === dashboardStore.activeTaskId && b.id !== dashboardStore.activeTaskId) return -1;
        if (b.id === dashboardStore.activeTaskId && a.id !== dashboardStore.activeTaskId) return 1;
        const aDone = isTaskCompletedLocal(a);
        const bDone = isTaskCompletedLocal(b);
        if (aDone === bDone) return 0;
        return aDone ? 1 : -1;
    });

    const getLocalDateString = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    let totalRemainingMinutes = 0;
    if (dashboardStore.selectedGroupId) {
        const activeGroup = dashboardStore.userGroups.find(g => g._id === dashboardStore.selectedGroupId);
        if (activeGroup) {
            const username = typeof window !== 'undefined' ? localStorage.getItem('dashboard_username') : '';
            const myMemberInfo = activeGroup.members?.find((m: any) => m.username === username || m.isMe);
            const myUserId = myMemberInfo?.userId || '';
            const myUsername = myMemberInfo?.username || username || '';

            let myTasks: any[] = [];
            if (activeGroup.memberTasks) {
                if (myUserId && activeGroup.memberTasks[myUserId] !== undefined) myTasks = activeGroup.memberTasks[myUserId];
                else if (myUsername && activeGroup.memberTasks[myUsername] !== undefined) myTasks = activeGroup.memberTasks[myUsername];
                else if (activeGroup.adminId === myUserId || activeGroup.adminId === myUsername || myMemberInfo?.role === 'admin') myTasks = activeGroup.tasks || [];
            } else { myTasks = activeGroup.tasks || []; }

            const todayStr = getLocalDateString();
            const myCompletions = (myUserId && activeGroup.completions?.[myUserId]?.[todayStr]) || (myUsername && activeGroup.completions?.[myUsername]?.[todayStr]) || {};
            totalRemainingMinutes = myTasks.filter((t: any) => !myCompletions[t.id]?.completed).reduce((sum: number, t: any) => sum + Math.max(0, (t.duration || 0) - (myCompletions[t.id]?.timeSpent || 0)), 0);
        }
    } else {
        totalRemainingMinutes = currentTasks.filter(t => !isTaskCompletedLocal(t)).reduce((sum, t) => sum + (t.duration || 0), 0);
    }

    const formatRemainingTime = (mins: number) => {
        if (mins < 60) return `${mins}m left`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };

    return {
        newTaskTitle, setNewTaskTitle, newTaskDuration, setNewTaskDuration,
        activeTab, setActiveTab, activeGroupTab, setActiveGroupTab,
        editingGroupIndex, setEditingGroupIndex, draggedIndex, setDraggedIndex,
        isGroupDropdownOpen, setIsGroupDropdownOpen, openMenuId, setOpenMenuId,
        isInfoOpen, setIsInfoOpen, confirmModal, setConfirmModal,
        dashboardStore, taskStore, currentTasks, filteredTasks,
        handleToggleTask, handleRestartTask, handleRestartAllCompleted, handleAddTask,
        isTaskCompleted: isTaskCompletedLocal, totalRemainingMinutes, formatRemainingTime, draggedIndexRef
        
    };
}