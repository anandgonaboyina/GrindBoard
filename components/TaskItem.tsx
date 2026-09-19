'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Play, Trash2, CheckCircle, RotateCcw, ArrowRight, ArrowLeft, LayoutGrid, GripVertical } from 'lucide-react';

interface TaskItemProps {
    task: any;
    index: number;
    activeTab: 'today' | 'tomorrow';
    draggedIndex: number | null;
    setDraggedIndex: (idx: number | null) => void;
    draggedIndexRef: React.MutableRefObject<number | null>;
    openMenuId: string | null;
    setOpenMenuId: (id: string | null) => void;
    isTaskDone: boolean;
    handleToggleTask: (id: string) => void;
    handleRestartTask: (id: string) => void;
    triggerTimer: (duration: number, id: string, title: string) => void;
    setConfirmModal: (modal: any) => void;
    taskStore: any;
}

export default function TaskItem({
    task, index, activeTab, draggedIndex, setDraggedIndex, draggedIndexRef,
    openMenuId, setOpenMenuId, isTaskDone, handleToggleTask, handleRestartTask,
    triggerTimer, setConfirmModal, taskStore
}: TaskItemProps) {
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editingDurationId, setEditingDurationId] = useState<string | null>(null);
    const [editingTimeSpentId, setEditingTimeSpentId] = useState<string | null>(null);
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

    const { updateTaskTitle, editTaskDuration, editTaskTimeSpent, moveTaskTab, deleteTask } = taskStore;

    return (
        <div
            data-task-index={index}
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
                    className="p-0.5 rounded-full transition-colors text-white/30 hover:text-emerald-400 focus:outline-none flex items-center justify-center"
                >
                    {isTaskDone ? (
                        <CheckCircle className="w-[18px] h-[18px] text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] fill-emerald-500/20" />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>
                    )}
                </button>

                {/* 2. BOTTOM: Drag Handle */}
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
            </div>

            {/* RIGHT COLUMN: Content */}
            <div className="flex flex-col flex-1 min-w-0 justify-between py-0.5 pl-0.5">
                {/* Top Row: Title & Options Menu */}
                <div className="flex items-start justify-between gap-1 w-full">
                    
                    {/* Inline Subtle Number + Title */}
                    <div className="flex-1 min-w-0 flex items-start gap-1 mt-[2px]">
                        <span className="text-[10px] sm:text-[11px] font-black text-white/30 pt-[1px] select-none shrink-0">
                            {index + 1}.
                        </span>

                        {editingTaskId === task.id ? (
                            <textarea
                                autoFocus
                                onBlur={() => setEditingTaskId(null)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); setEditingTaskId(null); } }}
                                ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                                value={task.title}
                                onChange={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; updateTaskTitle(task.id, e.target.value); }}
                                rows={1} spellCheck={false}
                                className="bg-black/60 outline-none w-full text-[12px] sm:text-[13px] leading-snug border-b border-sky-500/70 px-1 -mx-1 resize-none overflow-hidden block text-white rounded-md shadow-inner transition-colors"
                            />
                        ) : (
                            <div
                                onDoubleClick={() => setEditingTaskId(task.id)}
                                title="Double click to edit title"
                                className={`w-full text-[12px] sm:text-[13px] font-medium leading-snug cursor-text whitespace-pre-wrap ${isTaskDone ? 'line-through text-white/50' : 'text-white/95'}`}
                            >
                                {task.title}
                            </div>
                        )}
                    </div>

                    <div className="relative shrink-0 ml-1 z-[10000]">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (openMenuId === task.id) {
                                    setOpenMenuId(null);
                                } else {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const isNearBottom = rect.bottom > window.innerHeight - 220; // 220px is rough height of the menu
                                    setMenuStyle({
                                        position: 'fixed',
                                        right: `${window.innerWidth - rect.right}px`,
                                        [isNearBottom ? 'bottom' : 'top']: isNearBottom ? `${window.innerHeight - rect.top + 4}px` : `${rect.bottom + 4}px`,
                                    });
                                    setOpenMenuId(task.id);
                                }
                            }}
                            className={`p-1.5 rounded-lg border transition-all active:scale-95 shadow-sm ${openMenuId === task.id ? 'bg-sky-500/20 border-sky-500/30 text-sky-300' : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10 hover:border-white/10 hover:text-white'}`}
                        >
                            <LayoutGrid size={13} />
                        </button>

                        {/* Enhanced Cool Popup Menu */}
                        {openMenuId === task.id && typeof window !== 'undefined' && createPortal(
                            <>
                                <div className="fixed inset-0 z-[10000]" onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }} onWheel={(e) => { e.stopPropagation(); setOpenMenuId(null); }} />
                                <div 
                                    className="w-44 bg-[#121318]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] z-[10001] flex flex-col p-1.5 gap-1 animate-in fade-in zoom-in-95 duration-200"
                                    style={{ ...menuStyle, transformOrigin: menuStyle.bottom ? 'bottom right' : 'top right' }}
                                >
                                    {!isTaskDone && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); triggerTimer(task.duration, task.id, task.title); }}
                                            className="flex items-center gap-2.5 px-2.5 py-2 text-[11px] font-bold text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-transparent hover:border-sky-500/20 rounded-lg transition-all text-left"
                                        >
                                            <Play size={12} className="fill-current shrink-0" /> Start Focus Timer
                                        </button>
                                    )}
                                    {(isTaskDone || (task.timeSpent !== undefined && task.timeSpent > 0)) && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleRestartTask(task.id); }}
                                            className="flex items-center gap-2.5 px-2.5 py-2 text-[11px] font-bold text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 border border-transparent hover:border-orange-500/20 rounded-lg transition-colors text-left"
                                        >
                                            <RotateCcw size={12} className="shrink-0" /> Restart Task
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); moveTaskTab(task.id, activeTab); }}
                                        className="flex items-center gap-2.5 px-2.5 py-2 text-[11px] font-bold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-transparent hover:border-purple-500/20 rounded-lg transition-colors text-left"
                                    >
                                        {activeTab === 'today' ? <ArrowRight size={12} className="shrink-0" /> : <ArrowLeft size={12} className="shrink-0" />}
                                        Move to {activeTab === 'today' ? 'Tomorrow' : 'Today'}
                                    </button>
                                    <div className="h-px w-full bg-white/10 my-0.5" />
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); setOpenMenuId(null);
                                            setConfirmModal({
                                                isOpen: true, title: 'Delete Task', message: `Are you sure you want to delete "${task.title}"?`, isDestructive: true,
                                                onConfirm: () => deleteTask(task.id, activeTab)
                                            });
                                        }}
                                        className="flex items-center gap-2.5 px-2.5 py-2 text-[11px] font-bold text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 rounded-lg transition-colors text-left"
                                    >
                                        <Trash2 size={12} className="shrink-0" /> Delete Task
                                    </button>
                                </div>
                            </>,
                            document.body
                        )}
                    </div>
                </div>

                {/* Bottom Row: Enhanced Badges & Start Button (Strict Single Line) */}
                <div className="flex items-center justify-between mt-1.5 w-full gap-1">
                    {/* flex-nowrap ensures these NEVER drop to a second line */}
                    <div className="flex items-center gap-1 flex-nowrap min-w-0 overflow-hidden">
                        
                        {/* Duration Left Badge */}
                        {task.duration > 0 && !isTaskDone && (
                            editingDurationId === task.id ? (
                                <div className="flex items-center bg-[#0d1b2a] rounded border border-sky-500/40 px-1 py-[1px] shadow-sm shrink-0">
                                    <input
                                        autoFocus type="number" defaultValue={task.duration} min="1" max="999"
                                        className="w-6 bg-transparent text-[9px] font-bold text-sky-200 outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none"
                                        onBlur={(e) => { const dur = parseInt(e.target.value); if (!isNaN(dur) && dur > 0) editTaskDuration(task.id, dur, activeTab); setEditingDurationId(null); }}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { const dur = parseInt(e.currentTarget.value); if (!isNaN(dur) && dur > 0) editTaskDuration(task.id, dur, activeTab); setEditingDurationId(null); } }}
                                    />
                                    <span className="text-[8.5px] font-semibold text-sky-200/50 pr-0.5">m</span>
                                </div>
                            ) : (
                                <span
                                    onDoubleClick={(e) => { e.stopPropagation(); setEditingDurationId(task.id); }}
                                    className="whitespace-nowrap text-[8.5px] sm:text-[9px] font-bold tracking-wide text-sky-300 bg-sky-900/30 hover:bg-sky-800/40 border border-sky-500/30 cursor-pointer px-1.5 py-[2px] rounded shadow-sm transition-colors shrink-0"
                                    title="Double click to edit planned duration"
                                >
                                    {task.duration >= 60 ? Math.floor(task.duration / 60) + "h " + (task.duration % 60) + "m" : task.duration + "m"} left
                                </span>
                            )
                        )}

                        {/* Done Time Badge */}
                        {(!isTaskDone && editingTimeSpentId === task.id ? (
                            <div className="flex items-center bg-[#061c13] rounded border border-emerald-500/40 px-1 py-[1px] shadow-sm shrink-0">
                                <input
                                    autoFocus type="number" defaultValue={task.timeSpent || 0} min="0" max="999"
                                    className="w-6 bg-transparent text-[9px] font-bold text-emerald-200 outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none"
                                    onBlur={(e) => { const dur = parseInt(e.target.value); if (!isNaN(dur) && dur >= 0) editTaskTimeSpent(task.id, dur, activeTab); setEditingTimeSpentId(null); }}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { const dur = parseInt(e.currentTarget.value); if (!isNaN(dur) && dur >= 0) editTaskTimeSpent(task.id, dur, activeTab); setEditingTimeSpentId(null); } }}
                                />
                                <span className="text-[8.5px] font-semibold text-emerald-200/50 pr-0.5">m</span>
                            </div>
                        ) : (
                            <span
                                onDoubleClick={(e) => { if (isTaskDone) return; e.stopPropagation(); setEditingTimeSpentId(task.id); }}
                                className={`whitespace-nowrap text-[8.5px] sm:text-[9px] font-bold tracking-wide px-1.5 py-[2px] rounded border shadow-sm transition-colors shrink-0 ${isTaskDone ? 'text-emerald-400/60 bg-emerald-900/20 border-emerald-500/20 cursor-default' : 'text-emerald-300 bg-emerald-900/30 hover:bg-emerald-800/40 cursor-pointer border-emerald-500/30'}`}
                            >
                                {isTaskDone ? (
                                    ((task.timeSpent || 0) + (task.duration || 0)) >= 60 ? Math.floor(((task.timeSpent || 0) + (task.duration || 0)) / 60) + "h " + (((task.timeSpent || 0) + (task.duration || 0)) % 60) + "m" : ((task.timeSpent || 0) + (task.duration || 0)) + "m"
                                ) : (
                                    (task.timeSpent || 0) >= 60 ? Math.floor((task.timeSpent || 0) / 60) + "h " + ((task.timeSpent || 0) % 60) + "m" : (task.timeSpent || 0) + "m"
                                )} done
                            </span>
                        ))}
                    </div>

                    {!isTaskDone && (
                        <button
                            onClick={(e) => { e.stopPropagation(); triggerTimer(task.duration, task.id, task.title); }}
                            className="flex items-center gap-1 px-2.5 py-[4px] rounded border bg-sky-500/20 text-sky-300 hover:bg-sky-500 hover:text-white border-sky-500/30 hover:border-transparent transition-all shadow-md active:scale-95 shrink-0"
                            title={`Start ${task.duration}m timer`}
                        >
                            <Play size={10} className="fill-current" />
                            <span className="text-[8.5px] font-black uppercase tracking-wider">Start</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}