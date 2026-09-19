'use client';

import { useState, useRef, useEffect } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { Plus, Play, Trash2, CheckCircle, Circle, Clock, RotateCcw, Filter, BellRing, ClipboardList, Info, X, ArrowRight, ArrowLeft, Sparkles, GripVertical } from 'lucide-react';
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
                            className={`relative flex items-center flex-1 h-[25px] min-w-0 rounded-md border text-[8px] font-bold uppercase tracking-wider cursor-pointer transition-all ${activeGroupTab === idx
                                ? 'bg-blue-500/20 border-blue-500/50 text-blue-200'
                                : 'bg-white/5 border-white/20 text-white/50 hover:bg-white/10'
                                }`}
                            onClick={() => setActiveGroupTab(idx)}
                        >
                            {editingGroupIndex === idx && canEdit ? (
                                <input
                                    autoFocus
                                    className="w-full h-full bg-transparent outline-none px-2 text-white"
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
                                    className={`w-full px-2 truncate select-none text-left ${canEdit ? 'cursor-text' : 'cursor-default'}`}
                                    title={canEdit ? "Double click to rename tab" : ""}
                                >
                                    {tabNames[idx]}
                                </div>
                            )}
                            {timeDisplay && (
                                <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-extrabold tracking-wide px-1.5 rounded border shadow-md select-none transition-all ${
                                    activeGroupTab === idx
                                        ? 'bg-emerald-500 text-black border-emerald-400 font-black'
                                        : 'bg-[#141414] text-emerald-400 border-white/20'
                                    }`}>
                                    <pre>{timeDisplay}</pre>
                                </span>
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
                        className="flex flex-col w-full"
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
                                    className={`group relative flex gap-1.5 sm:gap-2 p-1.5 rounded-[12px] transition-all shadow-sm mt-0.5
                                        ${isTaskDone ? 'bg-white/[0.02] border-white/5 opacity-60 grayscale-[40%]' : 'bg-[#15171e]/80 border-white/30 hover:border-white/20 hover:bg-[#1a1c24]/90'}
                                        ${draggedIndex === index ? 'opacity-40 border-sky-500/50 scale-[0.98]' : 'border'}
                                    `}
                                >
                                    {/* LEFT COLUMN: Tick (Top) & Grip (Bottom) Only */}
                                    <div className="flex flex-col items-center justify-between shrink-0 w-6 sm:w-7 py-1 rounded-xl bg-black/20 border border-white/5 shadow-inner">
                                        {/* 1. TOP: Bigger Checkbox */}
                                        <button
                                            onClick={() => handleToggleTask(task.id)}
                                            className={`p-0.5 rounded-full transition-colors focus:outline-none flex items-center justify-center ${canEdit ? 'text-white/30 hover:text-emerald-400 cursor-pointer' : 'text-white/30 cursor-default'}`}
                                            disabled={!canEdit}
                                        >
                                            {isTaskDone ? (
                                                <CheckCircle className="w-[18px] h-[18px] text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] fill-emerald-500/20" />
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>
                                            )}
                                        </button>

                                        {/* 2. BOTTOM: Drag Handle */}
                                        {canEdit && (
                                            <div
                                                className="cursor-grab active:cursor-grabbing text-white/20 hover:text-white transition-colors p-0.5 rounded-md hover:bg-white/10 mt-1 touch-none select-none flex items-center justify-center"
                                                onPointerDown={(e) => {
                                                    e.stopPropagation();
                                                    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { }
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
                                                <GripVertical size={14} />
                                            </div>
                                        )}
                                    </div>

                                    {/* RIGHT COLUMN: Content */}
                                    <div className="flex flex-col flex-1 min-w-0 justify-between py-0.5 pl-0.5">
                                        {/* Top Row: Title & Options */}
                                        <div className="flex items-start justify-between gap-1 w-full">

                                            {/* Inline Subtle Number + Title */}
                                            <div className="flex-1 min-w-0 flex items-start gap-1 mt-[2px]">
                                                <span className="text-[10px] sm:text-[11px] font-black text-white/30 pt-[1px] select-none shrink-0">
                                                    {index + 1}.
                                                </span>

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
        // ADD THIS REF TO AUTO-EXPAND ON DOUBLE CLICK
        ref={(el) => { 
            if (el) { 
                el.style.height = 'auto'; 
                el.style.height = el.scrollHeight + 'px'; 
            } 
        }}
        value={task.title}
        onChange={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
            const newTasks = tasks.map(t => t.id === task.id ? { ...t, title: e.target.value } : t);
            setTasks(newTasks);
            updateTasksInDB(newTasks);
        }}
        rows={1}
        spellCheck={false}
        className="bg-black/60 outline-none w-full text-[12px] sm:text-[13px] leading-snug border-b border-sky-500/70 px-1 -mx-1 resize-none overflow-hidden block text-white rounded-md shadow-inner transition-colors"
    />
) : (
    <div
        onDoubleClick={() => canEdit && setEditingTaskId(task.id)}
        title={canEdit ? "Double click to edit title" : ""}
        className={`w-full text-[12px] sm:text-[13px] font-medium leading-snug whitespace-pre-wrap ${canEdit ? 'cursor-text' : 'cursor-default'} ${isTaskDone ? 'line-through text-white/50' : 'text-white/95'}`}
    >
        {task.title}
    </div>
)}
                                            </div>

                                            <div className="relative shrink-0 ml-1 z-[10000]">
                                                {canEdit && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
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
                                                        className="p-1.5 rounded-lg border transition-all active:scale-95 shadow-sm bg-white/5 border-transparent text-white/30 hover:bg-rose-500/20 hover:border-rose-500/30 hover:text-rose-400"
                                                        title="Delete task"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Bottom Row: Enhanced Badges & Start Button (Strict Single Line) */}
                                        <div className="flex items-center justify-between mt-1.5 w-full gap-1">
                                            {/* flex-nowrap ensures these NEVER drop to a second line */}
                                            <div className="flex items-center gap-1 flex-nowrap min-w-0 overflow-hidden">

                                                {/* Duration Left Badge */}
                                                {task.duration > 0 && !isTaskDone && (
                                                    canEdit && editingDurationId === task.id ? (
                                                        <div className="flex items-center bg-[#0d1b2a] rounded border border-sky-500/40 px-1 py-[1px] shadow-sm shrink-0">
                                                            <input
                                                                autoFocus
                                                                type="number"
                                                                defaultValue={Math.max(0, task.duration - timeSpent)}
                                                                min="0"
                                                                max="999"
                                                                className="w-6 bg-transparent text-[9px] font-bold text-sky-200 outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none"
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
                                                            <span className="text-[8.5px] font-semibold text-sky-200/50 pr-0.5">m</span>
                                                        </div>
                                                    ) : (
                                                        <span
                                                            onDoubleClick={(e) => { if (canEdit) { e.stopPropagation(); setEditingDurationId(task.id); } }}
                                                            className={`whitespace-nowrap text-[8.5px] sm:text-[9px] font-bold tracking-wide text-sky-300 bg-sky-900/30 border border-sky-500/30 px-1.5 py-[2px] rounded shadow-sm transition-colors shrink-0 ${canEdit ? 'hover:bg-sky-800/40 cursor-pointer' : 'cursor-default'}`}
                                                            title={canEdit ? "Double click to edit planned duration" : ""}
                                                        >
                                                            {(() => {
                                                                const timeLeft = Math.max(0, task.duration - timeSpent);
                                                                return timeLeft >= 60 ? Math.floor(timeLeft / 60) + "h " + (timeLeft % 60) + "m" : timeLeft + "m";
                                                            })()} left
                                                        </span>
                                                    )
                                                )}

                                                {/* Done Time Badge */}
                                                {!isTaskDone && editingTimeSpentId === task.id ? (
                                                    <div className="flex items-center bg-[#061c13] rounded border border-emerald-500/40 px-1 py-[1px] shadow-sm shrink-0">
                                                        <input
                                                            autoFocus
                                                            type="number"
                                                            defaultValue={timeSpent}
                                                            min="0"
                                                            max="999"
                                                            className="w-6 bg-transparent text-[9px] font-bold text-emerald-200 outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none"
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
                                                        <span className="text-[8.5px] font-semibold text-emerald-200/50 pr-0.5">m</span>
                                                    </div>
                                                ) : (
                                                    <span
                                                        onDoubleClick={(e) => { if (!isTaskDone && canEdit) { e.stopPropagation(); setEditingTimeSpentId(task.id); } }}
                                                        className={`whitespace-nowrap text-[8.5px] sm:text-[9px] font-bold tracking-wide px-1.5 py-[2px] rounded border shadow-sm transition-colors shrink-0 ${isTaskDone ? 'text-emerald-400/60 bg-emerald-900/20 border-emerald-500/20 cursor-default' : `text-emerald-300 bg-emerald-900/30 border-emerald-500/30 ${canEdit ? 'hover:bg-emerald-800/40 cursor-pointer' : 'cursor-default'}`}`}
                                                    >
                                                        {(() => {
                                                            const doneMins = isTaskDone ? Math.max(timeSpent || 0, task.duration || 0) : (timeSpent || 0);
                                                            return doneMins >= 60 ? Math.floor(doneMins / 60) + "h " + (doneMins % 60) + "m" : doneMins + "m";
                                                        })()} done
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0">
                                                {(isTaskDone || timeSpent > 0) && canEdit && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleRestartTask(task.id); }}
                                                        className="p-[4px] bg-orange-500/10 text-orange-300 hover:bg-orange-500 hover:text-white rounded border border-orange-500/20 hover:border-transparent transition-all shadow-md active:scale-95"
                                                        title="Restart task"
                                                    >
                                                        <RotateCcw size={10} />
                                                    </button>
                                                )}

                                                {!isTaskDone && canEdit && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const timeLeft = Math.max(0, task.duration - timeSpent);
                                                            triggerTimer(timeLeft, task.id, task.title);
                                                        }}
                                                        className="flex items-center gap-1 px-2.5 py-[4px] rounded border bg-sky-500/20 text-sky-300 hover:bg-sky-500 hover:text-white border-sky-500/30 hover:border-transparent transition-all shadow-md active:scale-95 shrink-0"
                                                        title={`Start ${Math.max(0, task.duration - timeSpent)}m timer`}
                                                    >
                                                        <Play size={10} className="fill-current" />
                                                        <span className="text-[8.5px] font-black uppercase tracking-wider">Start</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </ScrollableWithArrows>

            {canEdit && (
<form 
  onSubmit={handleAddTask} 
  className="p-1 border-t border-white/10 bg-white/[0.02] flex items-center gap-1.5 mt-0.5 backdrop-blur-sm shadow-sm"
>
  {/* Task Input Container */}
  <div className="relative flex-1 flex items-center">
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
      className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-[9.5px] text-white outline-none focus:bg-white/10 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 transition-all placeholder:text-white/30 resize-none overflow-hidden h-[24px] min-h-[24px] max-h-[70px] flex items-center leading-normal" 
    />
  </div>

  {/* Duration Input Container */}
  <div className="relative shrink-0 flex items-center">
    <input 
      type="number" 
      placeholder="Min" 
      value={newTaskDuration} 
      onChange={(e) => setNewTaskDuration(e.target.value)} 
      className="w-[45px] h-[24px] bg-white/5 border border-white/10 rounded-lg px-1 text-[9.5px] font-medium text-center text-white outline-none focus:bg-white/10 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 transition-all placeholder:text-white/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
    />
  </div>

  {/* Submit Button */}
  <button 
    type="submit" 
    className="h-[24px] w-[24px] bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-white border border-sky-500/20 rounded-lg transition-all shrink-0 active:scale-95 flex items-center justify-center shadow-md shadow-sky-500/5"
  >
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
                    <ScrollableWithArrows className="max-h-[60vh] pr-2 flex flex-col gap-2 text-sm mt-1">
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