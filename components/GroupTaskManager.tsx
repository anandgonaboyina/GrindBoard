'use client';

import { useState, useRef, useEffect } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { Plus, Play, Trash2, CheckCircle, Circle, Clock, RotateCcw, Filter, BellRing, ClipboardList, Info, X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { fetchQuote } from '@/utils/quoteEngine';
import ScrollableWithArrows from './ScrollableWithArrows';
import ConfirmationModal from './ConfirmationModal';

interface GroupTaskManagerProps {
    groupId: string;
    targetUserId?: string;
    activeTabProp?: number;
    onTabChange?: (tabIdx: number) => void;
    dateStrProp?: string;
    hideHeader?: boolean;
}

export default function GroupTaskManager({
    groupId,
    targetUserId,
    activeTabProp,
    onTabChange,
    dateStrProp,
    hideHeader = false
}: GroupTaskManagerProps) {
    const { userGroups, setUserGroups, triggerTimer, isTaskManagerOpen, showQuotePopup, activeTaskId, isTaskIntervalAlertEnabled, setIsTaskIntervalAlertEnabled, taskIntervalAlertMins, setTaskIntervalAlertMins } = useDashboardStore();
    const group = userGroups.find(g => g._id === groupId);

    const username = typeof window !== 'undefined' ? localStorage.getItem('dashboard_username') : '';
    const members = group?.members || [];
    const myMemberInfo = members.find((m: any) => m.username === username || m.isMe);
    const myUserId = myMemberInfo?.userId || '';

    const effectiveUserId = targetUserId || myUserId;
    const isMe = targetUserId ? effectiveUserId === myUserId : true;
    const canEdit = isMe && (!!myMemberInfo || (group?.members && group.members.some((m: any) => m.isMe)));

    const getUserTasks = (groupData: any, uId: string) => {
        if (!groupData || !uId) return [];
        if (groupData.memberTasks && groupData.memberTasks[uId] !== undefined) {
            return groupData.memberTasks[uId];
        }
        const isGroupAdmin = groupData.adminId === uId || groupData.members?.some((m: any) => (m.userId === uId || m.username === uId) && m.role === 'admin');
        if (isGroupAdmin) {
            return groupData.tasks || [];
        }
        return [];
    };

    const getLocalDateString = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const todayStr = dateStrProp || getLocalDateString();

    const [tasks, setTasks] = useState<any[]>(getUserTasks(group, effectiveUserId));
    const [completions, setCompletions] = useState<any>(group?.completions || {});
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDuration, setNewTaskDuration] = useState('');
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editingDurationId, setEditingDurationId] = useState<string | null>(null);
    const [editingTimeSpentId, setEditingTimeSpentId] = useState<string | null>(null);
    const [internalActiveGroupTab, setInternalActiveGroupTab] = useState<number>(0);
    const [editingGroupIndex, setEditingGroupIndex] = useState<number | null>(null);

    const activeGroupTab = activeTabProp !== undefined ? activeTabProp : internalActiveGroupTab;
    const setActiveGroupTab = (idx: number) => {
        setInternalActiveGroupTab(idx);
        if (onTabChange) onTabChange(idx);
    };

    const DEFAULT_UNIVERSAL_TAB_NAMES = ['Core Tasks', 'Daily Routine', 'Milestones'];
    const formatTabName = (name: string | undefined | null, idx: number): string => {
        if (!name || !name.trim() || name === `Tab ${idx + 1}`) {
            return DEFAULT_UNIVERSAL_TAB_NAMES[idx] || `Tab ${idx + 1}`;
        }
        return name.trim();
    };

    const initialRaw = group?.memberTabNames?.[effectiveUserId] || group?.tabNames || DEFAULT_UNIVERSAL_TAB_NAMES;
    const initialTabNames = [0, 1, 2].map(idx => formatTabName(initialRaw[idx], idx));
    const [tabNames, setTabNames] = useState<string[]>(initialTabNames);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const draggedIndexRef = useRef<number | null>(null);
    const filteredTasksRef = useRef<any[]>([]);
    const currentTasksRef = useRef<any[]>([]);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: React.ReactNode;
        isDestructive?: boolean;
        onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const infoRef = useRef<HTMLDivElement>(null);

    const handleExitGroup = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Exit Group',
            message: `Are you sure you want to exit "${group?.title || 'this group'}"? ${myMemberInfo?.role === 'admin' ? 'As admin, group ownership will be transferred to the next member.' : 'Your group task progress will be removed.'}`,
            isDestructive: true,
            onConfirm: async () => {
                const token = localStorage.getItem('dashboard_sync_token');
                try {
                    const res = await fetch(`/api/groups/${groupId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ action: 'exit_group' })
                    });
                    if (res.ok) {
                        const updatedGroups = useDashboardStore.getState().userGroups.filter((g: any) => g._id !== groupId);
                        setUserGroups(updatedGroups);
                        if (useDashboardStore.getState().selectedGroupId === groupId) {
                            useDashboardStore.getState().setSelectedGroupId(null);
                        }
                    }
                } catch (e) {
                    console.error('Failed to exit group:', e);
                }
            }
        });
    };

    const handleClaimLeadership = async () => {
        const token = localStorage.getItem('dashboard_sync_token');
        try {
            const res = await fetch(`/api/groups/${groupId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ action: 'claim_leadership' })
            });
            if (res.ok) {
                fetchGroupData();
            }
        } catch (e) {
            console.error('Failed to claim leadership:', e);
        }
    };

    useEffect(() => {
        draggedIndexRef.current = draggedIndex;
    }, [draggedIndex]);

    const reorderGroupTasks = (fromIndex: number, toIndex: number) => {
        if (!canEdit) return;
        const updatedTasks = [...tasks];
        const [movedTask] = updatedTasks.splice(fromIndex, 1);
        updatedTasks.splice(toIndex, 0, movedTask);

        setTasks(updatedTasks);
        const updatedGroups = useDashboardStore.getState().userGroups.map((g: any) => g._id === groupId ? { ...g, memberTasks: { ...(g.memberTasks || {}), [effectiveUserId]: updatedTasks } } : g);
        setUserGroups(updatedGroups);
        updateTasksInDB(updatedTasks);
    };

    useEffect(() => {
        const handlePointerMove = (e: PointerEvent | TouchEvent) => {
            if (draggedIndexRef.current === null || !canEdit) return;
            const clientX = 'touches' in e ? e.touches[0]?.clientX : (e as PointerEvent).clientX;
            const clientY = 'touches' in e ? e.touches[0]?.clientY : (e as PointerEvent).clientY;
            if (clientX === undefined || clientY === undefined) return;

            const el = document.elementFromPoint(clientX, clientY);
            if (el) {
                const taskEl = el.closest('[data-task-index]');
                if (taskEl) {
                    const targetIndex = parseInt(taskEl.getAttribute('data-task-index') || '', 10);
                    if (!isNaN(targetIndex) && targetIndex !== draggedIndexRef.current) {
                        const draggedTask = filteredTasksRef.current[draggedIndexRef.current];
                        const targetTask = filteredTasksRef.current[targetIndex];
                        if (draggedTask && targetTask) {
                            const realDraggedIndex = currentTasksRef.current.findIndex(t => t.id === draggedTask.id);
                            const realTargetIndex = currentTasksRef.current.findIndex(t => t.id === targetTask.id);
                            if (realDraggedIndex !== -1 && realTargetIndex !== -1) {
                                reorderGroupTasks(realDraggedIndex, realTargetIndex);
                                draggedIndexRef.current = targetIndex;
                                setDraggedIndex(targetIndex);
                            }
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
    }, [canEdit, tasks]);

    const myCompletions = completions[effectiveUserId]?.[todayStr] || {};

    const fetchGroupData = async () => {
        const token = localStorage.getItem('dashboard_sync_token');
        if (!token) return;
        try {
            const res = await fetch(`/api/groups/${groupId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.group) {
                const uId = effectiveUserId;
                if (uId) {
                    setTasks(getUserTasks(data.group, uId));
                    setCompletions(data.group.completions || {});
                    const rawNames = data.group.memberTabNames?.[uId] || data.group.tabNames || DEFAULT_UNIVERSAL_TAB_NAMES;
                    setTabNames([0, 1, 2].map(i => formatTabName(rawNames[i], i)));
                }

                // Sync to global store to keep timer logic accurate
                const updatedGroups = useDashboardStore.getState().userGroups.map((g: any) => g._id === groupId ? data.group : g);
                setUserGroups(updatedGroups);
            }
        } catch (e) { }
    };

    useEffect(() => {
        if (hideHeader) return;
        if (!group) {
            fetchGroupData();
        }
    }, [groupId, targetUserId, hideHeader]);

    useEffect(() => {
        if (group && effectiveUserId) {
            const newTasks = getUserTasks(group, effectiveUserId);
            const newCompletions = group.completions || {};
            const rawNames = group.memberTabNames?.[effectiveUserId] || group.tabNames || DEFAULT_UNIVERSAL_TAB_NAMES;
            const newTabNames = [0, 1, 2].map(i => formatTabName(rawNames[i], i));

            setTasks((prev: any[]) => JSON.stringify(prev) !== JSON.stringify(newTasks) ? newTasks : prev);
            setCompletions((prev: any) => JSON.stringify(prev) !== JSON.stringify(newCompletions) ? newCompletions : prev);
            setTabNames((prev: string[]) => JSON.stringify(prev) !== JSON.stringify(newTabNames) ? newTabNames : prev);
        }
    }, [group, effectiveUserId]);

    const updateTasksInDB = async (newTasks: any[]) => {
        const updatedGroups = useDashboardStore.getState().userGroups.map((g: any) => g._id === groupId ? {
            ...g,
            memberTasks: { ...(g.memberTasks || {}), [effectiveUserId]: newTasks }
        } : g);
        setUserGroups(updatedGroups);

        const token = localStorage.getItem('dashboard_sync_token');
        try {
            await fetch(`/api/groups/${groupId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ action: 'update_task_list', tasks: newTasks, targetUserId: effectiveUserId })
            });
        } catch (e) { }
    };

    const updateTabNameInDB = async (idx: number, name: string) => {
        if (!canEdit) return;
        const cleanName = formatTabName(name, idx);
        const newTabNames = [...tabNames];
        newTabNames[idx] = cleanName;
        setTabNames(newTabNames);

        const updatedGroups = useDashboardStore.getState().userGroups.map((g: any) => g._id === groupId ? {
            ...g,
            memberTabNames: { ...(g.memberTabNames || {}), [effectiveUserId]: newTabNames }
        } : g);
        setUserGroups(updatedGroups);

        const token = localStorage.getItem('dashboard_sync_token');
        try {
            await fetch(`/api/groups/${groupId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ action: 'update_tab_names', tabNames: newTabNames, targetUserId: effectiveUserId })
            });
        } catch (e) { }
    };

    const updateCompletionInDB = async (taskId: string, completed: boolean, timeSpent: number) => {
        const token = localStorage.getItem('dashboard_sync_token');
        try {
            await fetch(`/api/groups/${groupId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ action: 'update_completion', dateStr: todayStr, taskId, completed, timeSpent, targetUserId: effectiveUserId })
            });
        } catch (e) { }
    };

    const handleToggleTask = async (id: string) => {
        if (!canEdit) return;
        const comp = myCompletions[id] || { completed: false, timeSpent: 0 };
        const newCompleted = !comp.completed;
        const newComps = { ...myCompletions, [id]: { ...comp, completed: newCompleted } };
        const finalCompletions = { ...completions, [effectiveUserId]: { ...(completions[effectiveUserId] || {}), [todayStr]: newComps } };
        setCompletions(finalCompletions);

        const updatedGroups = useDashboardStore.getState().userGroups.map((g: any) => g._id === groupId ? { ...g, completions: finalCompletions } : g);
        setUserGroups(updatedGroups);

        await updateCompletionInDB(id, newCompleted, comp.timeSpent);

        if (newCompleted) {
            const q = await fetchQuote();
            showQuotePopup(q);
        }
    };

    const handleRestartTask = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Restart Task',
            message: 'Are you sure you want to restart this task?',
            isDestructive: false,
            onConfirm: () => {
                const newComps = { ...myCompletions, [id]: { completed: false, timeSpent: 0 } };
                const finalCompletions = { ...completions, [effectiveUserId]: { ...(completions[effectiveUserId] || {}), [todayStr]: newComps } };
                setCompletions(finalCompletions);

                const updatedGroups = useDashboardStore.getState().userGroups.map((g: any) => g._id === groupId ? { ...g, completions: finalCompletions } : g);
                setUserGroups(updatedGroups);

                updateCompletionInDB(id, false, 0);
            }
        });
    };

    const handleAddTask = (e: React.FormEvent | React.KeyboardEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim() || !canEdit) return;

        const countInTab = tasks.filter(t => (t.groupId || 0) === activeGroupTab).length;
        if (countInTab >= 6) {
            setConfirmModal({
                isOpen: true,
                title: 'Limit Reached',
                message: 'Each tab section can have at most 6 tasks.',
                isDestructive: false,
                onConfirm: () => { }
            });
            return;
        }

        const newTask = {
            id: Date.now().toString(),
            title: newTaskTitle.trim(),
            duration: parseInt(newTaskDuration) || 25,
            groupId: activeGroupTab
        };
        const newTasks = [...tasks, newTask];
        setTasks(newTasks);

        const updatedGroups = useDashboardStore.getState().userGroups.map((g: any) => g._id === groupId ? { ...g, memberTasks: { ...(g.memberTasks || {}), [effectiveUserId]: newTasks } } : g);
        setUserGroups(updatedGroups);

        updateTasksInDB(newTasks);

        setNewTaskTitle('');
        setNewTaskDuration('');
    };

    const isTaskCompleted = (t: any) => {
        return myCompletions[t.id]?.completed || false;
    };

    const groupFilteredTasks = tasks.filter(t => (t.groupId || 0) === activeGroupTab);

    const filteredTasks = [...groupFilteredTasks].sort((a, b) => {
        if (a.id === activeTaskId && b.id !== activeTaskId) return -1;
        if (b.id === activeTaskId && a.id !== activeTaskId) return 1;

        const aDone = isTaskCompleted(a);
        const bDone = isTaskCompleted(b);
        if (aDone === bDone) return 0;
        return aDone ? 1 : -1;
    });

    filteredTasksRef.current = filteredTasks;
    currentTasksRef.current = tasks;

    const totalRemainingMinutes = tasks.filter(t => !isTaskCompleted(t)).reduce((sum, t) => sum + Math.max(0, (t.duration || 0) - (myCompletions[t.id]?.timeSpent || 0)), 0);
    const formatRemainingTime = (mins: number) => {
        if (mins < 60) return `${mins}m left`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };

    return (
        <div className="flex flex-col h-full w-full">
            {/* 3-day Abandonment / Deletion Notice Banner */}
            {!hideHeader && group?.pendingDeletion && (
                <div className="mx-2 mt-2 p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-[10px] flex items-center justify-between gap-2 shadow-md animate-in fade-in">
                    <div className="flex flex-col min-w-0">
                        <span className="font-bold flex items-center gap-1 text-amber-300">
                            <Clock size={12} className="animate-spin" style={{ animationDuration: '6s' }} /> Admin Abandonment Grace Period
                        </span>
                        <span className="text-[9px] text-white/70 truncate">
                            Admin left group. Auto-deletes in 3 days unless claimed!
                        </span>
                    </div>
                    <button
                        onClick={handleClaimLeadership}
                        className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-black text-[9.5px] font-bold rounded-lg transition-colors cursor-pointer shrink-0 shadow-sm"
                    >
                        Claim Leadership
                    </button>
                </div>
            )}

            {/* Sub-tabs for grouping */}
            <div className="flex items-start gap-1 p-1.5 border-t border-white/5 bg-black/20">
                {[0, 1, 2].map((idx) => {
                    const tabTasks = tasks.filter(t => (t.groupId || 0) === idx);
                    const tabRemaining = tabTasks.filter(t => !isTaskCompleted(t)).reduce((sum, t) => sum + Math.max(0, (t.duration || 0) - (myCompletions[t.id]?.timeSpent || 0)), 0);
                    const timeDisplay = tabRemaining > 0 ? formatRemainingTime(tabRemaining).replace(' left', '') : '';

                    return (
                        <div
                            key={idx}
                            className={`relative flex flex-col flex-1 min-w-0 rounded-md border transition-all h-[22px] ${activeGroupTab === idx
                                ? 'bg-blue-500/20 border-blue-500/50 text-blue-200'
                                : 'bg-white/5 border-white/20 text-white/50 hover:bg-white/10 hover:text-white/80 cursor-pointer'
                                }`}
                            onClick={() => setActiveGroupTab(idx)}
                        >
                            {editingGroupIndex === idx && canEdit ? (
                                <input
                                    autoFocus
                                    className="absolute inset-0 w-full h-full bg-transparent outline-none px-1 py-0.5 text-[7.5px] font-bold text-left text-white"
                                    defaultValue={tabNames[idx]}
                                    onBlur={(e) => {
                                        updateTabNameInDB(idx, e.target.value.trim());
                                        setEditingGroupIndex(null);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            updateTabNameInDB(idx, e.currentTarget.value.trim());
                                            setEditingGroupIndex(null);
                                        }
                                    }}
                                />
                            ) : (
                                <div
                                    onDoubleClick={() => { if (canEdit) setEditingGroupIndex(idx) }}
                                    className={`w-full px-1.5 py-0.5 text-[7.5px] font-bold uppercase tracking-wider text-left truncate select-none ${canEdit ? 'cursor-text' : 'cursor-default'}`}
                                    title={canEdit ? "Double click to rename tab" : ""}
                                >
                                    {tabNames[idx]}
                                </div>
                            )}
                            {timeDisplay && (
                                <div className={`absolute bottom-0 right-0 text-[7px] font-bold uppercase tracking-widest px-1 py-[0px] rounded-tl-md rounded-br-md border-t border-l shadow-sm ${activeGroupTab === idx ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-black/60 text-white/40 border-white/20 border-t-white/20 border-l-white/20'}`}>
                                    {timeDisplay}
                                </div>
                            )}
                        </div>
                    );
                })}
                {!hideHeader && (
                    <>
                        <button
                            onClick={() => setIsInfoOpen(true)}
                            className="p-1 text-sky-300 hover:text-white hover:bg-white/10 rounded-md transition-colors shrink-0 self-center"
                            title="Group Task Rules & Reset Info"
                        >
                            <Info size={14} />
                        </button>
                        {/* <button
                            onClick={handleExitGroup}
                            className="px-2 py-0.5 text-[9px] font-bold bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white rounded-md transition-colors cursor-pointer border border-rose-500/30 shrink-0 self-center"
                            title="Exit this group"
                        >
                            Exit
                        </button> */}
                    </>
                )}
            </div>

            <ScrollableWithArrows className={`p-1 ${hideHeader ? 'max-h-[210px] sm:max-h-[230px]' : 'max-h-[350px]'}`}>
                {filteredTasks.length === 0 ? (
                    canEdit ? (
                        <div className="flex flex-col items-center justify-center p-2 text-center border border-dashed border-sky-500/30 rounded-lg bg-sky-500/5 my-0.5 gap-0.5 shadow-inner">
                            <div className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-400/35 flex items-center justify-center text-sky-300 shadow-sm mb-0.5">
                                <Sparkles size={11} className="animate-pulse text-sky-300" />
                            </div>
                            <span className="text-[9.5px] font-bold text-white/90">No tasks added yet!</span>
                            <span className="text-[8px] text-white/50 max-w-[160px] leading-tight">
                                Add your first task below to start tracking duration & focus progress!
                            </span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-2 text-center border border-dashed border-white/10 rounded-lg bg-white/[0.02] my-0.5 gap-0.5">
                            <span className="text-[9px] font-medium text-white/40 italic">No active tasks in this tab yet</span>
                        </div>
                    )
                ) : (
                    <div
                        className="flex flex-col gap-1 w-full"
                        onPointerDown={() => setDraggedIndex(null)}
                        onPointerUp={() => setDraggedIndex(null)}
                        onPointerCancel={() => setDraggedIndex(null)}
                        onMouseLeave={() => setDraggedIndex(null)}
                    >
                        {filteredTasks.map((task, index) => {
                            const isTaskDone = isTaskCompleted(task);
                            const timeSpent = myCompletions[task.id]?.timeSpent || 0;
                            return (
                                <div
                                    key={task.id}
                                    data-task-index={index}
                                    onPointerEnter={() => {
                                        if (draggedIndex !== null && draggedIndex !== index && canEdit) {
                                            const draggedTask = filteredTasks[draggedIndex];
                                            const targetTask = filteredTasks[index];
                                            if (draggedTask && targetTask) {
                                                const realDraggedIndex = tasks.findIndex(t => t.id === draggedTask.id);
                                                const realTargetIndex = tasks.findIndex(t => t.id === targetTask.id);
                                                if (realDraggedIndex !== -1 && realTargetIndex !== -1) {
                                                    reorderGroupTasks(realDraggedIndex, realTargetIndex);
                                                    draggedIndexRef.current = index;
                                                    setDraggedIndex(index);
                                                }
                                            }
                                        }
                                    }}
                                    className={`group flex items-center justify-between p-1 px-1.5 py-1 rounded-md border bg-white/[0.02] hover:bg-white/10 transition-all shadow-sm ${isTaskDone ? 'opacity-75 grayscale-[30%]' : ''} ${draggedIndex === index ? 'opacity-50 border-sky-500/50 scale-[0.98]' : 'border-white/20 hover:border-white/40'}`}
                                >
                                    <div className="flex items-start gap-1 flex-1 min-w-0 pl-0">
                                        {canEdit && (
                                            <div
                                                className="flex flex-col items-center opacity-40 hover:opacity-100 transition-opacity justify-center mt-0.5 shrink-0 cursor-grab active:cursor-grabbing touch-none select-none p-0.5"
                                                onPointerDown={(e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                                                    } catch { }
                                                    draggedIndexRef.current = index;
                                                    setDraggedIndex(index);
                                                }}
                                                onTouchStart={(e) => {
                                                    e.stopPropagation();
                                                    draggedIndexRef.current = index;
                                                    setDraggedIndex(index);
                                                }}
                                                onMouseDown={(e) => e.stopPropagation()}
                                            >
                                                <svg className="w-3 h-3 text-white/50 hover:text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /></svg>
                                            </div>
                                        )}
                                        <div className="flex flex-col items-center justify-center gap-0.5 mt-0.5 shrink-0 px-0">
                                            <button onClick={() => handleToggleTask(task.id)} className="text-white/50 hover:text-white hover:scale-110 transition-all active:scale-95 flex items-center justify-center">
                                                {isTaskDone ? (
                                                    <div className="w-3.5 h-3.5 rounded-[4px] bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] flex items-center justify-center">
                                                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                    </div>
                                                ) : (
                                                    <div className="w-3.5 h-3.5 rounded-[4px] border-[1.5px] border-white/40 group-hover:border-white/70 transition-colors" />
                                                )}
                                            </button>
                                            <span className="text-[10px] font-black text-sky-300/90 tabular-nums select-none leading-none mt-0.5">{index + 1}</span>
                                        </div>
                                        <div className="flex flex-col gap-0.5 flex-1 min-w-0 w-full ml-0.5">
                                            {canEdit && editingTaskId === task.id ? (
                                                <textarea
                                                    autoFocus
                                                    onBlur={() => setEditingTaskId(null)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            setEditingTaskId(null);
                                                        }
                                                    }}
                                                    value={task.title}
                                                    onChange={(e) => {
                                                        const newTasks = tasks.map(t => t.id === task.id ? { ...t, title: e.target.value } : t);
                                                        setTasks(newTasks);
                                                        updateTasksInDB(newTasks);
                                                    }}
                                                    rows={1}
                                                    spellCheck={false}
                                                    className={`bg-black/40 outline-none w-full text-[11px] leading-snug border-b border-sky-500/50 px-0.5 resize-none overflow-hidden block text-white rounded-md shadow-inner transition-colors`}
                                                />
                                            ) : (
                                                <div
                                                    onDoubleClick={() => canEdit && setEditingTaskId(task.id)}
                                                    className={`w-full text-[11px] leading-snug px-0.5 ${canEdit ? 'cursor-text' : 'cursor-default'} whitespace-pre-wrap ${isTaskDone ? 'line-through text-white/60' : 'text-white/90'}`}
                                                >
                                                    {task.title}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1 mt-0.5 overflow-hidden w-full flex-wrap">
                                                {task.duration > 0 && !isTaskDone && (
                                                    canEdit && editingDurationId === task.id ? (
                                                        <div className="shrink-0 flex items-center bg-sky-500/30 rounded-full border border-sky-400/30 px-1 py-px shadow-sm">
                                                            <input
                                                                autoFocus
                                                                type="number"
                                                                defaultValue={Math.max(0, task.duration - timeSpent)}
                                                                min="0"
                                                                max="999"
                                                                className="w-7 bg-transparent text-[8.5px] font-bold text-white outline-none placeholder:text-white/50 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                onBlur={(e) => {
                                                                    const dur = parseInt(e.target.value);
                                                                    if (!isNaN(dur) && dur >= 0) {
                                                                        const newGlobalDuration = dur + timeSpent;
                                                                        const newTasks = tasks.map(t => t.id === task.id ? { ...t, duration: newGlobalDuration } : t);
                                                                        setTasks(newTasks);
                                                                        updateTasksInDB(newTasks);
                                                                    }
                                                                    setEditingDurationId(null);
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.currentTarget.blur();
                                                                    }
                                                                }}
                                                            />
                                                            <span className="text-[8.5px] font-semibold text-white/80 ml-0.5">m</span>
                                                        </div>
                                                    ) : (
                                                        <span
                                                            onDoubleClick={(e) => {
                                                                if (canEdit) {
                                                                    e.stopPropagation();
                                                                    setEditingDurationId(task.id);
                                                                }
                                                            }}
                                                            className={`shrink-0 text-[8.5px] font-semibold tracking-wide text-white/90 bg-sky-500/20 ${canEdit ? 'hover:bg-sky-500/40 cursor-pointer' : 'cursor-default'} px-1.5 py-0.5 rounded-full border border-sky-400/20 transition-colors shadow-sm`}
                                                        >
                                                            {(() => {
                                                                const timeLeft = Math.max(0, task.duration - timeSpent);
                                                                return timeLeft >= 60 ? Math.floor(timeLeft / 60) + "h " + (timeLeft % 60) + "m" : timeLeft + "m";
                                                            })()} left
                                                        </span>
                                                    )
                                                )}
                                                {(
                                                    !isTaskDone && editingTimeSpentId === task.id ? (
                                                        <div className="shrink-0 flex items-center bg-emerald-500/30 rounded-full border border-emerald-400/30 px-1 py-px shadow-sm">
                                                            <input
                                                                autoFocus
                                                                type="number"
                                                                defaultValue={timeSpent}
                                                                min="0"
                                                                max="999"
                                                                className="w-7 bg-transparent text-[8.5px] font-bold text-emerald-100 outline-none placeholder:text-emerald-100/50 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                onBlur={(e) => {
                                                                    const dur = parseInt(e.target.value);
                                                                    if (!isNaN(dur) && dur >= 0) {
                                                                        const newComps = { ...myCompletions, [task.id]: { completed: false, timeSpent: dur } };
                                                                        const finalCompletions = { ...completions, [effectiveUserId]: { ...(completions[effectiveUserId] || {}), [todayStr]: newComps } };
                                                                        setCompletions(finalCompletions);

                                                                        const updatedGroups = useDashboardStore.getState().userGroups.map((g: any) => g._id === groupId ? { ...g, completions: finalCompletions } : g);
                                                                        setUserGroups(updatedGroups);

                                                                        updateCompletionInDB(task.id, false, dur);
                                                                    }
                                                                    setEditingTimeSpentId(null);
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.currentTarget.blur();
                                                                    }
                                                                }}
                                                            />
                                                            <span className="text-[8.5px] font-semibold text-emerald-100/80 ml-0.5">m done</span>
                                                        </div>
                                                    ) : (
                                                        <span
                                                            onDoubleClick={(e) => {
                                                                if (isTaskDone) return;
                                                                e.stopPropagation();
                                                                setEditingTimeSpentId(task.id);
                                                            }}
                                                            className={`shrink-0 text-[8.5px] font-semibold tracking-wide px-1.5 py-0.5 rounded-full border transition-colors shadow-sm ${isTaskDone ? 'text-emerald-300/80 bg-emerald-500/10 border-emerald-500/20 cursor-default' : 'text-emerald-200 bg-emerald-500/20 hover:bg-emerald-500/40 cursor-pointer border-emerald-400/20'}`}
                                                        >
                                                            {(() => {
                                                                const doneMins = isTaskDone ? Math.max(timeSpent || 0, task.duration || 0) : (timeSpent || 0);
                                                                return doneMins >= 60 ? Math.floor(doneMins / 60) + "h " + (doneMins % 60) + "m" : doneMins + "m";
                                                            })()} done
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end justify-center shrink-0 ml-1">
                                        {canEdit && (
                                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                {!isTaskDone && (
                                                    <button
                                                        onClick={() => {
                                                            const timeLeft = Math.max(0, task.duration - timeSpent);
                                                            triggerTimer(timeLeft, task.id, task.title);
                                                        }}
                                                        className="p-1 bg-sky-500/20 text-sky-300 hover:bg-sky-500 hover:text-white rounded-md transition-all active:scale-95"
                                                        title={`Start ${Math.max(0, task.duration - timeSpent)}m timer`}
                                                    >
                                                        <Play className="w-3 h-3 fill-current" />
                                                    </button>
                                                )}
                                                {(isTaskDone || timeSpent > 0) && (
                                                    <button
                                                        onClick={() => handleRestartTask(task.id)}
                                                        className="p-1 bg-orange-500/10 text-orange-300 hover:bg-orange-500 hover:text-white rounded-md transition-all active:scale-95 border border-orange-500/20 hover:border-transparent"
                                                        title="Restart task"
                                                    >
                                                        <RotateCcw className="w-3 h-3" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setConfirmModal({
                                                            isOpen: true,
                                                            title: 'Delete Task',
                                                            message: `Are you sure you want to delete the task "${task.title}"?`,
                                                            isDestructive: true,
                                                            onConfirm: () => {
                                                                const newTasks = tasks.filter(t => t.id !== task.id);
                                                                setTasks(newTasks);
                                                                const updatedGroups = useDashboardStore.getState().userGroups.map((g: any) => g._id === groupId ? { ...g, memberTasks: { ...(g.memberTasks || {}), [effectiveUserId]: newTasks } } : g);
                                                                setUserGroups(updatedGroups);
                                                                updateTasksInDB(newTasks);
                                                            }
                                                        });
                                                    }}
                                                    className="p-1 text-white/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-all active:scale-95 border border-transparent hover:border-rose-500/20"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </ScrollableWithArrows>

            {canEdit && (
                <form onSubmit={handleAddTask} className="p-1 border-t border-white/10 bg-black/20 flex gap-1 items-end mt-0.5 pt-2">
                    <div className="relative flex-1 group/task">
                        <span className="absolute -top-[8px] left-1 px-1 bg-[#1a1a1a] rounded text-[6px] font-bold tracking-widest text-white/40 uppercase pointer-events-none z-10 transition-colors group-hover/task:text-blue-300">
                            Task Name
                        </span>
                        <textarea
                            placeholder={`New task for ${group?.title}...`}
                            value={newTaskTitle}
                            onChange={(e) => {
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                                setNewTaskTitle(e.target.value);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddTask(e);
                                }
                            }}
                            rows={1}
                            className="w-full bg-white/5 border border-white/20 rounded-md px-1.5 py-1 text-[9.5px] outline-none focus:bg-white/10 focus:border-blue-500/50 transition-all placeholder:text-white/30 shadow-inner resize-none overflow-hidden min-h-[24px] max-h-[70px]"
                        />
                    </div>
                    <div className="relative -top-[4px] flex-col items-center shrink-0 group/duration">
                        <span className="absolute -top-[8px] left-1 px-1 bg-[#1a1a1a] rounded text-[6px] font-bold tracking-widest text-white/40 uppercase pointer-events-none z-10 transition-colors group-hover/duration:text-blue-300 whitespace-nowrap">
                            duration(min)
                        </span>
                        <input
                            type="number"
                            placeholder="min"
                            value={newTaskDuration}
                            onChange={(e) => setNewTaskDuration(e.target.value)}
                            className="w-[45px] bg-white/5 border border-white/20 rounded-md px-1 py-1 text-[9.5px] font-semibold text-center outline-none focus:bg-white/10 focus:border-blue-500/50 transition-all placeholder:text-white/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner h-[24px]"
                        />
                    </div>
                    <button type="submit" className="h-[24px] w-[24px] bg-white/10 hover:bg-white/20 hover:text-sky-300 rounded-md transition-all shrink-0 active:scale-95 shadow-sm border border-white/20 flex items-center justify-center mb-px">
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                </form>
            )}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                isDestructive={confirmModal.isDestructive}
            />

            <ConfirmationModal
                isOpen={isInfoOpen}
                onClose={() => setIsInfoOpen(false)}
                title={`Group Tasks Guide — ${group?.title || 'Group'}`}
                message={
                    <ScrollableWithArrows className="max-h-[60vh] pr-2 flex flex-col gap-4 text-sm mt-1">
                        <div className="p-3 bg-purple-500/15 border border-purple-400/30 rounded-xl">
                            <h4 className="font-bold text-purple-300 mb-1 text-base flex items-center gap-1.5">
                                👥 How Group Tasks Work
                            </h4>
                            <ul className="list-disc list-inside space-y-1.5 text-white/90 text-[12px] leading-relaxed">
                                <li><strong>🔄 Daily Automatic Reset:</strong> Group tasks automatically reset completion status every day at 00:00 local time, so all members start fresh together each morning.</li>
                                <li><strong>🤝 Work Together:</strong> Track live completion status, remaining time, and completed focus duration for every task in real-time.</li>
                                <li><strong>✨ Drag to Reorder:</strong> Admins can reorder tasks using the drag handle (⋮⋮) on the left of any task item.</li>
                                <li><strong>➕ Add Friends:</strong> Invite friends to join your group or share your group invite reference to build a powerful productivity squad!</li>
                            </ul>
                        </div>
                    </ScrollableWithArrows>
                }
                onConfirm={() => setIsInfoOpen(false)}
                confirmText="Got it!"
                hideCancel={true}
            />
        </div>
    );
}
