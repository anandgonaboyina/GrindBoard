'use client';

import { useState, useRef, useEffect } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { Plus, Play, Trash2, CheckCircle, Circle, Clock, RotateCcw, Filter, BellRing, ClipboardList, Info, X, ArrowRight, ArrowLeft, ChevronDown } from 'lucide-react';
import { fetchQuote } from '@/utils/quoteEngine';
import DraggableWidget from './DraggableWidget';
import ScrollableWithArrows from './ScrollableWithArrows';
import ConfirmationModal from './ConfirmationModal';
import GroupTaskManager from './GroupTaskManager';

export default function TaskManager() {
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDuration, setNewTaskDuration] = useState('');
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editingDurationId, setEditingDurationId] = useState<string | null>(null);
    const [editingTimeSpentId, setEditingTimeSpentId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'today' | 'tomorrow'>('today');
    const [activeGroupTab, setActiveGroupTab] = useState<number>(0);
    const [editingGroupIndex, setEditingGroupIndex] = useState<number | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: React.ReactNode;
        isDestructive?: boolean;
        onConfirm: () => void;
    }>({
        isOpen: false, title: '', message: '', onConfirm: () => { }
    });

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);
    const infoRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (infoRef.current && !infoRef.current.contains(event.target as Node)) {
                setIsInfoOpen(false);
            }
        }
        if (isInfoOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isInfoOpen]);

    const { tasks, tomorrowTasks, checkTasksRollover, reorderTasks, setTasks, addTask, toggleTask, deleteTask, triggerTimer, isTaskManagerOpen, showQuotePopup, editTaskDuration, editTaskTimeSpent, updateTaskTitle, taskIntervalAlertMins, setTaskIntervalAlertMins, taskIntervalRingSecs, setTaskIntervalRingSecs, isTaskIntervalAlertEnabled, setIsTaskIntervalAlertEnabled, moveTaskTab, taskGroupNames, setTaskGroupName, activeTaskId, userGroups, setUserGroups, selectedGroupId, setSelectedGroupId } = useDashboardStore();

    useEffect(() => {
        // Fetch user groups for TaskManager if not already loaded or on mount
        const fetchGroups = async () => {
            const token = localStorage.getItem('dashboard_sync_token');
            if (!token) return;
            try {
                const res = await fetch('/api/groups', { headers: { 'Authorization': `Bearer ${token}` } });
                if (res.ok) {
                    const data = await res.json();
                    setUserGroups(data.groups || []);
                }
            } catch (e) { }
        };
        fetchGroups();
    }, [setUserGroups]);

    const draggedIndexRef = useRef<number | null>(null);
    const filteredTasksRef = useRef<any[]>([]);
    const currentTasksRef = useRef<any[]>([]);

    useEffect(() => {
        draggedIndexRef.current = draggedIndex;
    }, [draggedIndex]);

    useEffect(() => {
        const handlePointerMove = (e: PointerEvent | TouchEvent) => {
            if (draggedIndexRef.current === null) return;
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
                                reorderTasks(activeTab, realDraggedIndex, realTargetIndex);
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
    }, [activeTab, reorderTasks]);

    useEffect(() => {
        checkTasksRollover();
    }, [checkTasksRollover, isTaskManagerOpen]);

    // Render regardless of open state, so it doesn't lose internal filter state
    // It is hidden visually via page.tsx wrapper.

    const currentTasks = activeTab === 'today' ? tasks : tomorrowTasks;

    const handleToggleTask = async (id: string) => {
        const task = currentTasks.find(t => t.id === id);
        toggleTask(id, activeTab);

        if (task && !task.completed) {
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
                setTasks(currentTasks.map(t => {
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
            isOpen: true,
            title: 'Restart All Completed',
            message: 'Are you sure you want to restart ALL completed tasks in this group?',
            isDestructive: false,
            onConfirm: () => {
                setTasks(currentTasks.map(t => {
                    if (isTaskCompleted(t) && (t.groupId || 0) === activeGroupTab) {
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

        addTask(
            newTaskTitle.trim(),
            parseInt(newTaskDuration) || 25,
            activeTab,
            activeGroupTab
        );

        setNewTaskTitle('');
        setNewTaskDuration('');
    };

    const isTaskCompleted = (t: any) => {
        if (Boolean(t.completed) && t.completed !== 'false') return true;
        if (t.duration !== undefined && t.duration <= 0) return true;
        return false;
    };

    const groupFilteredTasks = currentTasks.filter(t => (t.groupId || 0) === activeGroupTab);

    const filteredTasks = groupFilteredTasks.sort((a, b) => {
        if (a.id === activeTaskId && b.id !== activeTaskId) return -1;
        if (b.id === activeTaskId && a.id !== activeTaskId) return 1;

        const aDone = isTaskCompleted(a);
        const bDone = isTaskCompleted(b);
        if (aDone === bDone) return 0;
        return aDone ? 1 : -1;
    });

    filteredTasksRef.current = filteredTasks;
    currentTasksRef.current = currentTasks;

    const getLocalDateString = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    let totalRemainingMinutes = 0;
    
    if (selectedGroupId) {
        const activeGroup = userGroups.find(g => g._id === selectedGroupId);
        if (activeGroup && activeGroup.tasks) {
            const username = typeof window !== 'undefined' ? localStorage.getItem('dashboard_username') : '';
            const myMemberInfo = activeGroup.members?.find((m: any) => m.username === username);
            const todayStr = getLocalDateString();
            // In GroupTaskManager, completions are tracked by date string
            const myCompletions = activeGroup.completions?.[myMemberInfo?.userId || '']?.[todayStr] || {};
            totalRemainingMinutes = activeGroup.tasks.filter((t: any) => !myCompletions[t.id]?.completed).reduce((sum: number, t: any) => sum + Math.max(0, (t.duration || 0) - (myCompletions[t.id]?.timeSpent || 0)), 0);
        }
    } else {
        totalRemainingMinutes = currentTasks.filter(t => !isTaskCompleted(t)).reduce((sum, t) => sum + (t.duration || 0), 0);
    }
    const formatRemainingTime = (mins: number) => {
        if (mins < 60) return `${mins}m left`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };

    return (
        <div className="relative w-full h-full z-10 mr-24 pointer-events-auto">
            {/* Top Border Title */}
            <span className="absolute -top-2.5 left-4 px-2 bg-black/80 rounded-md text-[10px] sm:text-xs font-black tracking-widest text-blue-400 uppercase z-20 shadow-sm border border-white/5 backdrop-blur-md">
                Plan your Day
            </span>

            <div className="w-full h-full rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/10 shadow-xl flex flex-col overflow-hidden text-white transition-all duration-300">
                <div className="border-b border-white/5 bg-black/20 flex flex-col pt-3 pb-1 px-3 gap-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            <div className="relative group/groupselect mt-1">
                                <button
                                    onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
                                    className="flex items-center gap-1 text-[11px] sm:text-xs font-bold tracking-wider text-white bg-white/5 border border-white/20 hover:bg-white/10 px-2 py-1 rounded-md transition-colors outline-none cursor-pointer max-w-[160px]"
                                >
                                    <span className="truncate">
                                        {selectedGroupId ? userGroups.find(g => g._id === selectedGroupId)?.title : 'Personal Tasks'}
                                    </span>
                                    <ChevronDown size={14} className="opacity-70 shrink-0" />
                                </button>

                                {isGroupDropdownOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setIsGroupDropdownOpen(false)}
                                        />
                                        <div className="absolute top-full left-0 mt-1 w-44 bg-[#0f0f13] border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-60 overflow-y-auto p-1 backdrop-blur-xl">
                                            <button
                                                onClick={() => {
                                                    setSelectedGroupId(null);
                                                    setIsGroupDropdownOpen(false);
                                                }}
                                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold text-left transition-colors flex items-center justify-between ${!selectedGroupId ? 'bg-blue-500/20 text-blue-300' : 'text-white/80 hover:bg-white/10'}`}
                                            >
                                                <span>Personal Tasks</span>
                                                {!selectedGroupId && <CheckCircle size={12} className="text-blue-400 shrink-0" />}
                                            </button>

                                            {userGroups && userGroups.length > 0 && (
                                                <>
                                                    <div className="px-2.5 py-1 mt-1 text-[8.5px] font-bold uppercase tracking-wider text-white/40 border-t border-white/10 pt-1.5">
                                                        Your Groups
                                                    </div>
                                                    {userGroups.map(g => (
                                                        <button
                                                            key={g._id}
                                                            onClick={() => {
                                                                setSelectedGroupId(g._id);
                                                                setIsGroupDropdownOpen(false);
                                                            }}
                                                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold text-left truncate transition-colors flex items-center justify-between ${selectedGroupId === g._id ? 'bg-blue-500/20 text-blue-300' : 'text-white/80 hover:bg-white/10'}`}
                                                        >
                                                            <span className="truncate">{g.title}</span>
                                                            {selectedGroupId === g._id && <CheckCircle size={12} className="text-blue-400 shrink-0" />}
                                                        </button>
                                                    ))}
                                                </>
                                            )}

                                            <div className="border-t border-white/10 mt-1 pt-1">
                                                <button
                                                    onClick={() => {
                                                        setIsGroupDropdownOpen(false);
                                                        useDashboardStore.setState({ isSettingsOpen: true, settingsActiveTab: 'connect', connectInitialTab: 'groups' });
                                                    }}
                                                    className="w-full px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-left text-purple-300 hover:bg-purple-500/20 hover:text-purple-200 transition-colors flex items-center gap-1.5"
                                                >
                                                    <Plus size={13} className="text-purple-400 shrink-0" />
                                                    <span>Create / Join Group</span>
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            <button
                                onClick={() => setIsInfoOpen(true)}
                                className={`transition-colors rounded-full p-0.5 text-blue-300 hover:text-white hover:bg-white/10`}
                            >
                                <Info size={14} />
                            </button>
                            {totalRemainingMinutes > 0 && (
                                <div className="relative group ml-1 mt-1.5">
                                    <span className="absolute -top-2 left-1 px-1 bg-red-300 backdrop-blur-md rounded-md text-[6px] font-bold tracking-widest text-black uppercase pointer-events-none z-10 transition-colors group-hover:text-sky-300">
                                        <pre>Total Left</pre>
                                    </span>
                                    <span className="text-[10px] sm:text-xs font-bold text-sky-300 flex items-center gap-1 px-2 py-0.5 bg-sky-500/20 rounded-md border border-sky-500/30 shadow-sm pt-1">
                                        <pre>{formatRemainingTime(totalRemainingMinutes)}</pre>
                                    </span>
                                </div>
                            )}
                            {groupFilteredTasks.some(isTaskCompleted) && (
                                <button
                                    onClick={handleRestartAllCompleted}
                                    className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-500/20 text-orange-300 hover:bg-orange-500 hover:text-white rounded-md transition-colors active:scale-95 text-[10px] sm:text-md font-bold uppercase tracking-wider border border-orange-500/30 shadow-sm"
                                    title="Restart all completed in this group"
                                >
                                    <RotateCcw size={12} /> <span className="hidden sm:inline">Reset</span>
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[8px] font-bold tracking-widest text-white/60 uppercase">


                            <button onClick={() => useDashboardStore.getState().toggleTaskManager()} className=" ml-0.5 p-1 text-white/90 hover:text-white/100 hover:bg-white/10 rounded-full transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Header for Today/Tomorrow and Interval Alert */}
                        <>
                            <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                                <div className="flex items-center gap-1 md:gap-2">
                                    <div className="flex bg-white/5 rounded-md overflow-hidden border border-white/10 shrink-0">
                                        <button
                                            onClick={() => {
                                                setActiveTab('today');
                                                setSelectedGroupId(null);
                                            }}
                                            className={`px-1.5 py-0.5 md:px-2 md:py-1 text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-colors ${!selectedGroupId && activeTab === 'today' ? 'bg-sky-500/20 text-sky-300' : 'text-white/40 hover:text-white/80 hover:bg-white/10'}`}
                                        >
                                            Today
                                        </button>
                                        <button
                                            onClick={() => {
                                                setActiveTab('tomorrow');
                                                setSelectedGroupId(null);
                                            }}
                                            className={`px-1.5 py-0.5 md:px-2 md:py-1 text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-colors ${!selectedGroupId && activeTab === 'tomorrow' ? 'bg-purple-500/20 text-purple-300' : 'text-white/40 hover:text-white/80 hover:bg-white/10'}`}
                                        >
                                            Tomorrow
                                        </button>
                                    </div>
                                    <div
                                        className="relative flex items-center gap-1 md:gap-1.5 px-1.5 py-0.5 md:px-2 md:py-1 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors shrink-0"
                                        title="Plays a short beep every X minutes while a task timer is running"
                                    >
                                        <div
                                            className="flex items-center gap-1 md:gap-1.5 cursor-pointer"
                                            onClick={() => {
                                                if (isTaskIntervalAlertEnabled) {
                                                    setIsTaskIntervalAlertEnabled(false);
                                                } else {
                                                    setIsTaskIntervalAlertEnabled(true);
                                                    if (taskIntervalAlertMins === 0) {
                                                        setTaskIntervalAlertMins(10);
                                                    }
                                                }
                                            }}
                                        >
                                            <BellRing size={12} className={isTaskIntervalAlertEnabled ? "text-sky-300" : "text-white/40"} />
                                            <span className="text-[9px] font-medium text-white/70">Interval</span>
                                            <button
                                                className={`relative inline-flex h-2.5 md:h-3 w-4 md:w-5 items-center rounded-full transition-colors shrink-0 ml-0.5 ${isTaskIntervalAlertEnabled ? 'bg-sky-500' : 'bg-white/20'}`}
                                            >
                                                <span className={`inline-block h-1.5 md:h-2 w-1.5 md:w-2 transform rounded-full bg-white transition-transform ${isTaskIntervalAlertEnabled ? 'translate-x-1.5 md:translate-x-2.5' : 'translate-x-0.5'}`} />
                                            </button>
                                        </div>

                                        {isTaskIntervalAlertEnabled ? (
                                            <div className="flex items-center gap-1 pl-1 md:pl-1.5 ml-0.5 border-l border-white/10">
                                                <input
                                                    type="number"
                                                    value={taskIntervalAlertMins || ''}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        setTaskIntervalAlertMins(isNaN(val) ? 0 : val);

                                                    }}
                                                    className="w-6 md:w-7 bg-black/40 border border-white/20 rounded px-0.5 md:px-1 py-0.5 text-[9px] text-center font-bold text-sky-300 outline-none focus:border-sky-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
                                                    min="1"
                                                />
                                                <span className="text-[8px] font-medium text-white/40 uppercase">min</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center pl-1 md:pl-1.5 ml-0.5 border-l border-white/10">
                                                <span className="text-[8px] font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-1.5 py-0.5 rounded-md shadow-sm">Beep alert off</span>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>
                            {/* Sub-tabs for grouping */}
                            {!selectedGroupId && (
                                <div className="flex items-start gap-1">
                                {[0, 1, 2].map((idx) => {
                                    const tabTasks = currentTasks.filter(t => (t.groupId || 0) === idx);
                                    const tabRemaining = tabTasks.filter(t => !isTaskCompleted(t)).reduce((sum, t) => sum + (t.duration || 0), 0);
                                    const timeDisplay = tabRemaining > 0 ? formatRemainingTime(tabRemaining).replace(' left', '') : '';

                                    return (
                                        <div
                                            key={idx}
                                            className={`relative flex flex-col flex-1 min-w-0 rounded-md border transition-all h-[25px] ${activeGroupTab === idx
                                                ? 'bg-blue-500/20 border-blue-500/50 text-blue-200'
                                                : 'bg-white/5 border-white/20 text-white/50 hover:bg-white/10 hover:text-white/80 cursor-pointer'
                                                }`}
                                            onClick={() => setActiveGroupTab(idx)}
                                        >
                                            {editingGroupIndex === idx ? (
                                                <input
                                                    autoFocus
                                                    className="absolute inset-0 w-full h-full bg-transparent outline-none px-1.5 py-1 text-[8px] font-bold text-left text-white"
                                                    defaultValue={taskGroupNames?.[idx] || `Tab ${idx + 1}`}
                                                    onBlur={(e) => {
                                                        setTaskGroupName(idx, e.target.value.trim() || `Tab ${idx + 1}`);
                                                        setEditingGroupIndex(null);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            setTaskGroupName(idx, e.currentTarget.value.trim() || `Tab ${idx + 1}`);
                                                            setEditingGroupIndex(null);
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    onDoubleClick={() => setEditingGroupIndex(idx)}
                                                    className="w-full px-1.5 py-1 text-[8px] font-bold uppercase tracking-wider text-left truncate select-none"
                                                    title="Double click to rename tab"
                                                >
                                                    {taskGroupNames?.[idx] || `Tab ${idx + 1}`}
                                                </div>
                                            )}
                                            {timeDisplay && (
                                                <div className={`absolute bottom-0 right-0 text-[7.5px] font-bold uppercase tracking-widest px-1 py-[1px] rounded-tl-md rounded-br-md border-t border-l shadow-sm ${activeGroupTab === idx ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-black/60 text-white/40 border-white/20 border-t-white/20 border-l-white/20'}`}>
                                                    {timeDisplay}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            )}
                        </>
                </div>

                {selectedGroupId ? (
                    <GroupTaskManager groupId={selectedGroupId} />
                ) : (
                    <>
                        <ScrollableWithArrows className="p-1.5 max-h-[350px] ">
                            {filteredTasks.length === 0 ? (
                                <div className="text-center text-white/40 p-3 text-[10px] italic">
                                    No {activeTab} tasks found.
                                </div>
                            ) : (
                                <div
                                    className="flex flex-col gap-1.5 "
                                    onPointerDown={() => setDraggedIndex(null)}
                                    onPointerUp={() => setDraggedIndex(null)}
                                    onPointerCancel={() => setDraggedIndex(null)}
                                    onMouseLeave={() => setDraggedIndex(null)}
                                >
                                    {filteredTasks.map((task, index) => {
                                        const isTaskDone = isTaskCompleted(task);
                                        return (
                                            <div
                                                key={task.id}
                                                data-task-index={index}
                                                onPointerEnter={() => {
                                                    if (draggedIndex !== null && draggedIndex !== index) {
                                                        const draggedTask = filteredTasks[draggedIndex];
                                                        const targetTask = filteredTasks[index];
                                                        if (draggedTask && targetTask) {
                                                            const realDraggedIndex = currentTasks.findIndex(t => t.id === draggedTask.id);
                                                            const realTargetIndex = currentTasks.findIndex(t => t.id === targetTask.id);
                                                            if (realDraggedIndex !== -1 && realTargetIndex !== -1) {
                                                                reorderTasks(activeTab, realDraggedIndex, realTargetIndex);
                                                                draggedIndexRef.current = index;
                                                                setDraggedIndex(index);
                                                            }
                                                        }
                                                    }
                                                }}
                                                className={`group flex items-start justify-between p-1.5 rounded-lg border bg-white/[0.02] hover:bg-white/10 transition-all shadow-sm ${isTaskDone ? 'opacity-75 grayscale-[30%]' : ''} ${draggedIndex === index ? 'opacity-50 border-sky-500/50 scale-[0.98]' : 'border-white/30 hover:border-white/50'}`}
                                            >
                                                <div className="flex items-start gap-1.5 flex-1 min-w-0">
                                                    <div
                                                        className="flex flex-col items-center opacity-40 hover:opacity-100 transition-opacity justify-center mt-1.5 shrink-0 -ml-0.5 cursor-grab active:cursor-grabbing touch-none select-none p-1"
                                                        onPointerDown={(e) => {
                                                            e.stopPropagation();
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
                                                        <svg className="w-3.5 h-3.5 text-white/50 hover:text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /></svg>
                                                    </div>
                                                    <div className="flex flex-col items-center justify-center gap-0.5 mt-0.5 shrink-0 px-0.5">
                                                        <button onClick={() => handleToggleTask(task.id)} className="text-white/50 hover:text-white hover:scale-110 transition-all active:scale-95 flex items-center justify-center">
                                                            {isTaskDone ? (
                                                                <div className="w-3.5 h-3.5 rounded-[4px] bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] flex items-center justify-center">
                                                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                                </div>
                                                            ) : (
                                                                <div className="w-3.5 h-3.5 rounded-[4px] border-[1.5px] border-white/40 group-hover:border-white/70 transition-colors" />
                                                            )}
                                                        </button>
                                                        <span className="text-[11px] font-black text-sky-300/90 tabular-nums select-none leading-none mt-0.5">{index + 1}</span>
                                                    </div>
                                                    <div className="flex flex-col gap-0.5 flex-1 min-w-0 w-full ml-0.5 ">
                                                        {editingTaskId === task.id ? (
                                                            <textarea
                                                                autoFocus
                                                                onBlur={() => setEditingTaskId(null)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                                        e.preventDefault();
                                                                        setEditingTaskId(null);
                                                                    }
                                                                }}
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
                                                                    updateTaskTitle(task.id, e.target.value);
                                                                }}
                                                                rows={1}
                                                                spellCheck={false}
                                                                className={`bg-black/40 outline-none w-full text-[11px] leading-snug border-b border-sky-500/50 px-1 -mx-1 resize-none overflow-hidden block text-white rounded-md shadow-inner transition-colors`}
                                                            />
                                                        ) : (
                                                            <div
                                                                onDoubleClick={() => setEditingTaskId(task.id)}
                                                                title="Double click to edit"
                                                                className={`w-full text-[11px] leading-snug px-1 -mx-1 cursor-text whitespace-pre-wrap ${isTaskDone ? 'line-through text-white/60' : 'text-white/90'}`}
                                                            >
                                                                {task.title}
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1 mt-0.5 overflow-hidden w-full">
                                                            {task.duration > 0 && !isTaskDone && (
                                                                editingDurationId === task.id ? (
                                                                    <div className="shrink-0 flex items-center bg-sky-500/30 rounded-full border border-sky-400/30 px-1.5 py-px shadow-sm">
                                                                        <input
                                                                            autoFocus
                                                                            type="number"
                                                                            defaultValue={task.duration}
                                                                            min="1"
                                                                            max="999"
                                                                            className="w-8 bg-transparent text-[9px] font-bold text-white outline-none placeholder:text-white/50 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                            onBlur={(e) => {
                                                                                const dur = parseInt(e.target.value);
                                                                                if (!isNaN(dur) && dur > 0) editTaskDuration(task.id, dur, activeTab);
                                                                                setEditingDurationId(null);
                                                                            }}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter') {
                                                                                    const dur = parseInt(e.currentTarget.value);
                                                                                    if (!isNaN(dur) && dur > 0) editTaskDuration(task.id, dur, activeTab);
                                                                                    setEditingDurationId(null);
                                                                                }
                                                                            }}
                                                                        />
                                                                        <span className="text-[9px] font-semibold text-white/80 ml-0.5">m</span>
                                                                    </div>
                                                                ) : (
                                                                    <span
                                                                        onDoubleClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setEditingDurationId(task.id);
                                                                        }}
                                                                        className="shrink-0 text-[9px] font-semibold tracking-wide text-white/90 bg-sky-500/20 hover:bg-sky-500/40 cursor-pointer px-1.5 py-0.5 rounded-full border border-sky-400/20 transition-colors shadow-sm"
                                                                        title="Double click to edit duration"
                                                                    >
                                                                        {task.duration >= 60 ? Math.floor(task.duration / 60) + "h " + (task.duration % 60) + "m" : task.duration + "m"} left
                                                                    </span>
                                                                )
                                                            )}
                                                            {(
                                                                !isTaskDone && editingTimeSpentId === task.id ? (
                                                                    <div className="shrink-0 flex items-center bg-emerald-500/30 rounded-full border border-emerald-400/30 px-1.5 py-px shadow-sm">
                                                                        <input
                                                                            autoFocus
                                                                            type="number"
                                                                            defaultValue={task.timeSpent || 0}
                                                                            min="0"
                                                                            max="999"
                                                                            className="w-8 bg-transparent text-[9px] font-bold text-emerald-100 outline-none placeholder:text-emerald-100/50 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                            onBlur={(e) => {
                                                                                const dur = parseInt(e.target.value);
                                                                                if (!isNaN(dur) && dur >= 0) editTaskTimeSpent(task.id, dur, activeTab);
                                                                                setEditingTimeSpentId(null);
                                                                            }}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter') {
                                                                                    const dur = parseInt(e.currentTarget.value);
                                                                                    if (!isNaN(dur) && dur >= 0) editTaskTimeSpent(task.id, dur, activeTab);
                                                                                    setEditingTimeSpentId(null);
                                                                                }
                                                                            }}
                                                                        />
                                                                        <span className="text-[9px] font-semibold text-emerald-100/80 ml-0.5">m done</span>
                                                                    </div>
                                                                ) : (
                                                                    <span
                                                                        onDoubleClick={(e) => {
                                                                            if (isTaskDone) return;
                                                                            e.stopPropagation();
                                                                            setEditingTimeSpentId(task.id);
                                                                        }}
                                                                        className={`shrink-0 text-[9px] font-semibold tracking-wide px-1.5 py-0.5 rounded-full border transition-colors shadow-sm ${isTaskDone ? 'text-emerald-300/80 bg-emerald-500/10 border-emerald-500/20 cursor-default' : 'text-emerald-200 bg-emerald-500/20 hover:bg-emerald-500/40 cursor-pointer border-emerald-400/20'}`}
                                                                        title={isTaskDone ? "Completed duration" : "Double click to edit done time"}
                                                                    >
                                                                        {isTaskDone ? (
                                                                            ((task.timeSpent || 0) + (task.duration || 0)) >= 60 ? Math.floor(((task.timeSpent || 0) + (task.duration || 0)) / 60) + "h " + (((task.timeSpent || 0) + (task.duration || 0)) % 60) + "m" : ((task.timeSpent || 0) + (task.duration || 0)) + "m"
                                                                        ) : (
                                                                            (task.timeSpent || 0) >= 60 ? Math.floor((task.timeSpent || 0) / 60) + "h " + ((task.timeSpent || 0) % 60) + "m" : (task.timeSpent || 0) + "m"
                                                                        )} done
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end justify-between gap-1 shrink-0 ml-1 self-stretch">
                                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                        {!isTaskDone && (
                                                            <button
                                                                onClick={() => triggerTimer(task.duration, task.id, task.title)}
                                                                className="p-1 bg-sky-500/20 text-sky-300 hover:bg-sky-500 hover:text-white rounded-md transition-all active:scale-95"
                                                                title={`Start ${task.duration}m timer`}
                                                            >
                                                                <Play className="w-3 h-3 fill-current" />
                                                            </button>
                                                        )}
                                                        {(isTaskDone || (task.timeSpent !== undefined && task.timeSpent > 0)) && (
                                                            <button
                                                                onClick={() => handleRestartTask(task.id)}
                                                                className="p-1 bg-orange-500/10 text-orange-300 hover:bg-orange-500 hover:text-white rounded-md transition-all active:scale-95 border border-orange-500/20 hover:border-transparent"
                                                                title="Restart task"
                                                            >
                                                                <RotateCcw className="w-3 h-3 " />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                setConfirmModal({
                                                                    isOpen: true,
                                                                    title: 'Delete Task',
                                                                    message: `Are you sure you want to delete the task "${task.title}"?`,
                                                                    isDestructive: true,
                                                                    onConfirm: () => deleteTask(task.id, activeTab)
                                                                });
                                                            }}
                                                            className="p-1 text-white/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-all active:scale-95 border border-transparent hover:border-rose-500/20"
                                                        >
                                                            <Trash2 className="w-3 h-3 " />
                                                        </button>
                                                    </div>
                                                    <div className="relative group/arrow mt-auto flex items-center">
                                                        <span className="absolute right-6 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-black/80 backdrop-blur-md rounded text-[6.5px] font-bold tracking-widest text-purple-200/50 uppercase pointer-events-none z-10 opacity-0 group-hover/arrow:opacity-100 transition-all whitespace-nowrap shadow-sm border border-white/5">
                                                            {activeTab === 'today' ? 'To Tomorrow' : 'To Today'}
                                                        </span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); moveTaskTab(task.id, activeTab); }}
                                                            className="p-1 bg-purple-500/10 text-purple-300 hover:bg-purple-500 hover:text-white rounded-md transition-all active:scale-95 border border-purple-500/20 hover:border-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shrink-0"
                                                        >
                                                            {activeTab === 'today' ? <ArrowRight className="w-3 h-3" /> : <ArrowLeft className="w-3 h-3" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </ScrollableWithArrows>

                        <form onSubmit={handleAddTask} className="p-2 border-t border-white/20 bg-black/20 flex gap-2 items-end mt-1 pt-3">
                            <div className="relative flex-1 group/task">
                                <span className="absolute -top-[9px] left-1 px-1 bg-[#1a1a1a] rounded text-[6.5px] font-bold tracking-widest text-white/40 uppercase pointer-events-none z-10 transition-colors group-hover/task:text-blue-300">
                                    Task Name
                                </span>
                                <textarea
                                    placeholder={`New ${activeTab} task...`}
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
                                    className="w-full bg-white/5 border border-white/20 rounded-md px-2 py-1.5 text-[11px] outline-none focus:bg-white/10 focus:border-blue-500/50 transition-all placeholder:text-white/30 shadow-inner resize-none overflow-hidden min-h-[28px] max-h-[80px]"
                                />
                            </div>
                            <div className="relative -top-[5px] flex-col items-center shrink-0 group/duration">
                                <span className="absolute -top-[9px] left-1 px-1 bg-[#1a1a1a] rounded text-[6.5px] font-bold tracking-widest text-white/40 uppercase pointer-events-none z-10 transition-colors group-hover/duration:text-blue-300 whitespace-nowrap">
                                    duration(min)
                                </span>
                                <input
                                    type="number"
                                    placeholder="min"
                                    value={newTaskDuration}
                                    onChange={(e) => setNewTaskDuration(e.target.value)}
                                    className="w-[50px] bg-white/5 border border-white/20 rounded-md px-1.5 py-1.5 text-[11px] font-semibold text-center outline-none focus:bg-white/10 focus:border-blue-500/50 transition-all placeholder:text-white/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
                                />
                            </div>
                            <button type="submit" className="h-[28px] w-[28px] bg-white/10 hover:bg-white/20 hover:text-sky-300 rounded-md transition-all shrink-0 active:scale-95 shadow-sm border border-white/20 flex items-center justify-center mb-px">
                                <Plus className="w-4 h-4" />
                            </button>
                        </form>
                    </>
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
                    title="Plan Your Day — Task Manager & Group Tasks Guide"
                    message={
                        <ScrollableWithArrows className="max-h-[60vh] pr-2 flex flex-col gap-4 text-sm mt-1">
                            <div className="p-3 bg-purple-500/15 border border-purple-400/30 rounded-xl">
                                <h4 className="font-bold text-purple-300 mb-1 text-base flex items-center gap-1.5">
                                    👥 Group Tasks & Friend Collaboration
                                </h4>
                                <ul className="list-disc list-inside space-y-1.5 text-white/90 text-[12px] leading-relaxed">
                                    <li><strong>🔄 Daily Automatic Reset:</strong> Unlike personal tasks which remain active until completed, <strong>Group Tasks automatically reset completion progress every day at 00:00</strong> so group members start fresh together each day.</li>
                                    <li><strong>🤝 Work Together with Friends:</strong> Join your friends' task groups or create your own group to share tasks. Everyone tracks each other's live daily progress, reference time, and done minutes.</li>
                                    <li><strong>✨ Drag to Reorder:</strong> Group admins can reorder group tasks using the grip handle (⋮⋮) on the left of any task, updating the list in real-time for all group members.</li>
                                    <li><strong>🚀 How to Get Started:</strong> Click the Task Dropdown at the top left of Task Manager and select <strong>+ Create / Join Group</strong> (or go to Connect &rarr; Groups) to build or join a group with friends!</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-bold text-sky-400 mb-1 text-base">📅 Tabs, Drag Handles & Personal Tasks</h4>
                                <ul className="list-disc list-inside mt-2 space-y-1 text-white/90 text-[12px]">
                                    <li><strong>Custom Tabs:</strong> Switch between tabs to organize tasks. <strong>Double-click any tab name</strong> to rename it!</li>
                                    <li><strong>Drag & Drop Reordering:</strong> Drag the grip handle (⋮⋮) on the left of any task to easily reorder your list.</li>
                                    <li><strong>Move Tasks:</strong> Click the arrow button on a task to quickly swap it between Today and Tomorrow.</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-emerald-400 mb-1 text-base">⏱️ Durations, Focus Timer & Editing</h4>
                                <ul className="list-disc list-inside mt-2 space-y-1 text-white/90 text-[12px]">
                                    <li><strong>Start Task Timer:</strong> Click the play (▶) button next to any task to launch the Focus Timer specifically for that task.</li>
                                    <li><strong>Double-click Task Title:</strong> Instantly edit the task title inline.</li>
                                    <li><strong>Edit "m left" Badge:</strong> Double-click the remaining duration badge to change planned time.</li>
                                    <li><strong>Edit "m done" Badge:</strong> Double-click the done badge to manually add completed duration (deducts from time left automatically).</li>
                                </ul>
                                <div className="mt-2 p-2 bg-emerald-500/10 rounded-md border border-emerald-500/20 text-emerald-100/80 text-[11px] leading-relaxed">
                                    <strong className="text-emerald-300">5-Minute Focus Chunking:</strong><br />
                                    Focus time is logged in completed 5-minute increments to encourage continuous, deep work on tasks.
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-purple-400 mb-1 text-base flex items-center gap-1"><BellRing size={16} /> Task Interval Beep Alert</h4>
                                <p className="mb-1 text-white/90 text-[12px]">Click the bell (🔔) icon at the top of Task Manager to enable recurring interval alerts while running a task timer.</p>
                                <p className="text-[11px] text-white/70">Configure your alert frequency and ring duration under <strong>Settings &rarr; Sound &rarr; Task Interval Alert</strong>.</p>
                            </div>
                        </ScrollableWithArrows>
                    }
                    onConfirm={() => setIsInfoOpen(false)}
                    confirmText="Got it!"
                    hideCancel={true}
                />
            </div>
        </div>
    );
}
