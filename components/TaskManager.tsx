'use client';

import { useState, useRef, useEffect } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { Plus, Play, Trash2, CheckCircle, Circle, Clock, RotateCcw, Filter, BellRing, ChevronUp, ChevronDown, ClipboardList, Info, X } from 'lucide-react';
import { fetchQuote } from '@/utils/quoteEngine';
import DraggableWidget from './DraggableWidget';
import ScrollableWithArrows from './ScrollableWithArrows';
import ConfirmationModal from './ConfirmationModal';

export default function TaskManager() {
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDuration, setNewTaskDuration] = useState('25');
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editingDurationId, setEditingDurationId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'today' | 'tomorrow'>('today');

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
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setIsSettingsOpen(false);
            }
            if (infoRef.current && !infoRef.current.contains(event.target as Node)) {
                setIsInfoOpen(false);
            }
        }
        if (isSettingsOpen || isInfoOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isSettingsOpen, isInfoOpen]);

    const { tasks, tomorrowTasks, checkTasksRollover, reorderTasks, setTasks, addTask, toggleTask, deleteTask, triggerTimer, isTaskManagerOpen, showQuotePopup, editTaskDuration, updateTaskTitle, taskIntervalAlertMins, setTaskIntervalAlertMins } = useDashboardStore();

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
            message: 'Are you sure you want to restart ALL completed tasks?',
            isDestructive: false,
            onConfirm: () => {
                setTasks(currentTasks.map(t => {
                    if (t.completed) {
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

        if (currentTasks.length >= 10) {
            alert("Maximum of 10 tasks allowed per day to maintain focus!");
            return;
        }

        addTask(
            newTaskTitle.trim(),
            parseInt(newTaskDuration) || 25,
            activeTab
        );

        setNewTaskTitle('');
    };

    const isTaskCompleted = (t: any) => {
        if (Boolean(t.completed) && t.completed !== 'false') return true;
        if (t.duration !== undefined && t.duration <= 0) return true;
        return false;
    };

    const filteredTasks = currentTasks.sort((a, b) => {
        const aDone = isTaskCompleted(a);
        const bDone = isTaskCompleted(b);
        if (aDone === bDone) return 0;
        return aDone ? 1 : -1;
    });

    const totalRemainingMinutes = currentTasks.filter(t => !isTaskCompleted(t)).reduce((sum, t) => sum + (t.duration || 0), 0);
    const formatRemainingTime = (mins: number) => {
        if (mins < 60) return `${mins}m left`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };

    return (
        <div className="w-full h-full mr-24 rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/10 shadow-xl  flex flex-col overflow-hidden text-white pointer-events-auto transition-all duration-300">
            <div className="border-b border-white/5 bg-black/20 flex flex-col pt-3 pb-2 px-3 gap-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xs sm:text-sm font-bold tracking-wider text-white drop-shadow-md">Plan your Day</h2>
                        <button
                            onClick={() => setIsInfoOpen(true)}
                            className={`transition-colors rounded-full p-0.5 text-white/40 hover:text-white hover:bg-white/10`}
                        >
                            <Info size={14} />
                        </button>
                        <div ref={settingsRef} className="relative flex items-center">
                            <button
                                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                className={`transition-colors rounded-full p-0.5 ${taskIntervalAlertMins > 0 ? 'text-sky-300 bg-sky-500/20 hover:bg-sky-500/30' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
                                title="Timer Interval Alert"
                            >
                                <BellRing size={14} />
                            </button>
                            {isSettingsOpen && (
                                <div className="absolute left-0 top-full mt-2 w-48 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 cursor-default flex flex-col gap-2">
                                    <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest border-b border-white/10 pb-1.5">Interval Alert</span>
                                    <p className="text-[9px] text-white/50 leading-tight normal-case">Plays a short beep every X minutes while a task timer is running.</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input 
                                            type="number" 
                                            min="0" 
                                            max="60"
                                            value={taskIntervalAlertMins}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                setTaskIntervalAlertMins(isNaN(val) ? 0 : val);
                                            }}
                                            className="w-14 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-sky-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <span className="text-[10px] text-white/60 lowercase">minutes</span>
                                    </div>
                                    <span className="text-[8px] text-white/40 mt-0.5 normal-case">Set to 0 to disable.</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[8px] font-bold tracking-widest text-white/60 uppercase">


                        {totalRemainingMinutes > 0 && (
                            <>
                                <span className="hidden w-1 h-1 rounded-full bg-white/20" />
                                <span className="text-sky-300/90 flex items-center gap-0.5 bg-sky-500/10 px-1.5 py-0.5 rounded-md border border-sky-500/20">
                                    <Clock className="w-2.5 h-2.5 mb-[1px]" /> {formatRemainingTime(totalRemainingMinutes)}
                                </span>
                            </>
                        )}
                        <button onClick={() => useDashboardStore.getState().toggleTaskManager()} className="ml-0.5 p-1 text-white/30 hover:text-white/70 hover:bg-white/10 rounded-full transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-1">
                    <div className="flex bg-white/5 rounded-md overflow-hidden border border-white/10">
                        <button
                            onClick={() => setActiveTab('today')}
                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${activeTab === 'today' ? 'bg-sky-500/20 text-sky-300' : 'text-white/40 hover:text-white/80 hover:bg-white/10'}`}
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setActiveTab('tomorrow')}
                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${activeTab === 'tomorrow' ? 'bg-purple-500/20 text-purple-300' : 'text-white/40 hover:text-white/80 hover:bg-white/10'}`}
                        >
                            Tomorrow
                        </button>
                    </div>

                    {currentTasks.some(isTaskCompleted) && (
                        <button
                            onClick={handleRestartAllCompleted}
                            className="flex items-center gap-1 px-1.5 py-1 bg-orange-500/20 text-orange-300 hover:bg-orange-500 hover:text-white rounded-md transition-colors active:scale-95 text-[9px] font-bold uppercase tracking-wider"
                            title="Restart all completed"
                        >
                            <RotateCcw className="w-3 h-3 " /> <span className="hidden sm:inline">Reset All</span>
                        </button>
                    )}
                </div>
            </div>

            <ScrollableWithArrows className="p-1.5 max-h-[350px] ">
                {filteredTasks.length === 0 ? (
                    <div className="text-center text-white/40 p-3 text-[10px] italic">
                        No {activeTab} tasks found.
                    </div>
                ) : (
                    <div className="flex flex-col gap-1.5 ">
                        {filteredTasks.map((task, index) => {
                            const isTaskDone = isTaskCompleted(task);
                            return (
                                <div
                                    key={task.id}
                                    className={`group flex items-start justify-between p-1.5 rounded-lg border border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/10 transition-all shadow-sm ${isTaskDone ? 'opacity-40 grayscale-[50%]' : ''}`}
                                >
                                    <div className="flex items-start gap-1.5 flex-1 min-w-0">
                                        <div className="flex flex-col items-center opacity-30 hover:opacity-100 transition-opacity justify-center mt-0.5 shrink-0 -ml-0.5">
                                            <button 
                                                onClick={() => { if (index > 0) reorderTasks(activeTab, index, index - 1); }}
                                                disabled={index === 0}
                                                className="p-[1px] hover:text-sky-300 disabled:opacity-10 transition-colors"
                                            >
                                                <ChevronUp className="w-2.5 h-2.5" strokeWidth={3} />
                                            </button>
                                            <button 
                                                onClick={() => { if (index < filteredTasks.length - 1) reorderTasks(activeTab, index, index + 1); }}
                                                disabled={index === filteredTasks.length - 1}
                                                className="p-[1px] hover:text-sky-300 disabled:opacity-10 transition-colors"
                                            >
                                                <ChevronDown className="w-2.5 h-2.5" strokeWidth={3} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-1 mt-[2.5px] shrink-0">
                                            <span className="text-[9px] font-bold text-white/30 tabular-nums w-4 text-right select-none">{index + 1}.</span>
                                            <button onClick={() => handleToggleTask(task.id)} className="text-white/50 hover:text-white hover:scale-110 transition-all active:scale-95">
                                                {isTaskDone ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" /> : <Circle className="w-3.5 h-3.5 " />}
                                            </button>
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
                                                    className={`w-full text-[11px] leading-snug px-1 -mx-1 cursor-text whitespace-pre-wrap ${isTaskDone ? 'line-through text-white/40' : 'text-white/90'}`}
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
                                                                    if (!isNaN(dur) && dur > 0) editTaskDuration(task.id, dur);
                                                                    setEditingDurationId(null);
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        const dur = parseInt(e.currentTarget.value);
                                                                        if (!isNaN(dur) && dur > 0) editTaskDuration(task.id, dur);
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
                                                {task.timeSpent !== undefined && task.timeSpent > 0 && !isTaskDone && (
                                                    <span
                                                        className="shrink-0 text-[9px] font-semibold tracking-wide text-emerald-200 bg-emerald-500/20 px-1.5 py-0.5 rounded-full border border-emerald-400/20 shadow-sm pointer-events-none"
                                                        title="Total time tracked for this task"
                                                    >
                                                        {task.timeSpent >= 60 ? Math.floor(task.timeSpent / 60) + "h " + (task.timeSpent % 60) + "m" : task.timeSpent + "m"} done
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center gap-0.5 shrink-0 ml-1">
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
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </ScrollableWithArrows>

            <form onSubmit={handleAddTask} className="p-1.5 border-t border-white/5 bg-black/20 flex gap-1.5 items-end">
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
                    className="flex-1 bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-[11px] outline-none focus:bg-white/10 focus:border-sky-500/50 transition-all placeholder:text-white/30 shadow-inner resize-none overflow-hidden min-h-[28px] max-h-[80px]"
                />
                <input
                    type="number"
                    placeholder="min"
                    value={newTaskDuration}
                    onChange={(e) => setNewTaskDuration(e.target.value)}
                    title="Minutes"
                    className="w-10 bg-white/5 border border-white/10 rounded-md px-1.5 py-1 text-[11px] font-semibold text-center outline-none focus:bg-white/10 focus:border-sky-500/50 transition-all placeholder:text-white/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
                />
                <button type="submit" className="p-1 bg-white/10 hover:bg-white/20 hover:text-sky-300 rounded-md transition-all shrink-0 active:scale-95 shadow-sm border border-white/5">
                    <Plus className="w-3.5 h-3.5 " />
                </button>
            </form>

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
                title="How Task Manager Works"
                message={
                    <div className="flex flex-col gap-4 text-sm mt-1">
                        <div>
                            <h4 className="font-bold text-sky-400 mb-1 text-base">📅 Plan your Today & Tomorrow</h4>
                            <p>Add tasks to Today or Tomorrow. Tasks placed in Tomorrow will automatically move to Today at midnight, but they will also stay in the Tomorrow tab so you don't have to rewrite repetitive tasks!</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-emerald-400 mb-1 text-base">⏱️ Focus Timer</h4>
                            <p>Click the play button next to a task to start a focus timer. The duration can be adjusted by double-clicking the time on a task.</p>
                            <div className="mt-2 p-2 bg-emerald-500/10 rounded-md border border-emerald-500/20 text-emerald-100/80 text-[11px] leading-relaxed">
                                <strong className="text-emerald-300">Why are stats updated in 10-minute blocks?</strong><br/>
                                Focus time is saved in 10-minute spans. This ensures you maintain deep, uninterrupted focus on a task for a meaningful amount of time before it counts towards your daily completed statistics!
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-purple-400 mb-1 text-base flex items-center gap-1"><BellRing size={16} /> Interval Alert</h4>
                            <p className="mb-2">Plays a short beep every X minutes while a task timer is running. Set this using the bell icon at the top of the Task Manager.</p>
                        </div>
                        <div className="text-white/40 mt-2 text-xs italic border-t border-white/10 pt-3">
                            Tip: Use the Up/Down arrows to reorder tasks. Double-click any task title to edit it.
                        </div>
                    </div>
                }
                onConfirm={() => setIsInfoOpen(false)}
                confirmText="Got it!"
                hideCancel={true}
            />
        </div>
    );
}
