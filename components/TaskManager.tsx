'use client';

import { Plus, CheckCircle, RotateCcw, BellRing, Info, ArrowRight, ArrowLeft, ChevronDown } from 'lucide-react';
import { useTaskManagerLogic } from '@/hooks/useTaskManagerLogic';
import { useDashboardStore } from '@/store/dashboardStore';
import ScrollableWithArrows from './ScrollableWithArrows';
import ConfirmationModal from './ConfirmationModal';
import GroupTaskManager from './GroupTaskManager';
import TaskItem from './TaskItem';

export default function TaskManager() {
    const {
        newTaskTitle, setNewTaskTitle, newTaskDuration, setNewTaskDuration,
        activeTab, setActiveTab, activeGroupTab, setActiveGroupTab,
        editingGroupIndex, setEditingGroupIndex, draggedIndex, setDraggedIndex,
        isGroupDropdownOpen, setIsGroupDropdownOpen, openMenuId, setOpenMenuId,
        isInfoOpen, setIsInfoOpen, confirmModal, setConfirmModal,
        dashboardStore, taskStore, currentTasks, filteredTasks,
        handleToggleTask, handleRestartTask, handleRestartAllCompleted, handleAddTask,
        isTaskCompleted, totalRemainingMinutes, formatRemainingTime, draggedIndexRef
    } = useTaskManagerLogic();

    return (
        <div className="relative w-full h-full z-10 mr-24 pointer-events-auto">
            <span className="absolute -top-2.5 left-4 px-2 bg-[#0f0f13] rounded-md text-[10px] sm:text-xs font-black tracking-widest text-blue-400 uppercase z-20 shadow-sm border border-white/10 backdrop-blur-md">
                Plan your Day
            </span>

            <div className="w-full h-full rounded-2xl bg-black/40 backdrop-blur-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden text-white transition-all duration-300">
                <div className="border-b border-white/5 bg-black/20 flex flex-col pt-3 pb-1 px-3 gap-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            <div className="relative group/groupselect mt-1">
                                <button
                                    onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
                                    className="flex items-center gap-1 text-[11px] sm:text-xs font-bold tracking-wider text-white bg-white/5 border border-white/20 hover:bg-white/10 px-2 py-1 rounded-md transition-colors outline-none cursor-pointer max-w-[160px]"
                                >
                                    <span className="truncate">
                                        {dashboardStore.selectedGroupId ? dashboardStore.userGroups.find(g => g._id === dashboardStore.selectedGroupId)?.title : 'Personal Tasks'}
                                    </span>
                                    <ChevronDown size={14} className="opacity-70 shrink-0" />
                                </button>

                                {isGroupDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsGroupDropdownOpen(false)} />
                                        <div className="absolute top-full left-0 mt-1 w-44 bg-[#0f0f13] border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-60 overflow-y-auto p-1 backdrop-blur-xl">
                                            <button
                                                onClick={() => { dashboardStore.setSelectedGroupId(null); setIsGroupDropdownOpen(false); }}
                                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold text-left transition-colors flex items-center justify-between ${!dashboardStore.selectedGroupId ? 'bg-blue-500/20 text-blue-300' : 'text-white/80 hover:bg-white/10'}`}
                                            >
                                                <span>Personal Tasks</span>
                                                {!dashboardStore.selectedGroupId && <CheckCircle size={12} className="text-blue-400 shrink-0" />}
                                            </button>

                                            {dashboardStore.userGroups && dashboardStore.userGroups.length > 0 && (
                                                <>
                                                    <div className="px-2.5 py-1 mt-1 text-[8.5px] font-bold uppercase tracking-wider text-white/40 border-t border-white/10 pt-1.5">Your Groups</div>
                                                    {dashboardStore.userGroups.map(g => (
                                                        <button
                                                            key={g._id}
                                                            onClick={() => { dashboardStore.setSelectedGroupId(g._id); setIsGroupDropdownOpen(false); }}
                                                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold text-left truncate transition-colors flex items-center justify-between ${dashboardStore.selectedGroupId === g._id ? 'bg-blue-500/20 text-blue-300' : 'text-white/80 hover:bg-white/10'}`}
                                                        >
                                                            <span className="truncate">{g.title}</span>
                                                            {dashboardStore.selectedGroupId === g._id && <CheckCircle size={12} className="text-blue-400 shrink-0" />}
                                                        </button>
                                                    ))}
                                                </>
                                            )}

                                            <div className="border-t border-white/10 mt-1 pt-1">
                                                <button
                                                    onClick={() => { setIsGroupDropdownOpen(false); useDashboardStore.setState({ isSettingsOpen: true, settingsActiveTab: 'connect', connectInitialTab: 'groups' }); }}
                                                    className="w-full px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-left text-purple-300 hover:bg-purple-500/20 hover:text-purple-200 transition-colors flex items-center gap-1.5"
                                                >
                                                    <Plus size={13} className="text-purple-400 shrink-0" /> <span>Create / Join Group</span>
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            <button onClick={() => setIsInfoOpen(true)} className="transition-colors rounded-full p-0.5 text-blue-300 hover:text-white hover:bg-white/10"><Info size={14} /></button>
                            {totalRemainingMinutes > 0 && (
                                <div className="relative group ml-1 mt-1.5">
                                    <span className="absolute -top-2 left-1 px-1 bg-red-300 backdrop-blur-md rounded-md text-[6px] font-bold tracking-widest text-black uppercase pointer-events-none z-10 transition-colors group-hover:text-sky-300"><pre>Total Left</pre></span>
                                    <span className="text-[10px] sm:text-xs font-bold text-sky-300 flex items-center gap-1 px-2 py-0.5 bg-sky-500/20 rounded-md border border-sky-500/30 shadow-sm pt-1"><pre>{formatRemainingTime(totalRemainingMinutes)}</pre></span>
                                </div>
                            )}
                            {currentTasks.filter(t => (t.groupId || 0) === activeGroupTab).some(isTaskCompleted) && (
                                <button onClick={handleRestartAllCompleted} className="flex items-center px-1.5 py-0.5 bg-orange-500/20 text-orange-300 hover:bg-orange-500 hover:text-white rounded-md transition-colors active:scale-95 text-[10px] sm:text-md font-bold uppercase tracking-wider border border-orange-500/30 shadow-sm"><RotateCcw size={12} /></button>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[8px] font-bold tracking-widest text-white/60 uppercase">
                            <button onClick={() => dashboardStore.toggleTaskManager()} className=" ml-0.5 p-1 text-white/90 hover:text-white/100 hover:bg-white/10 rounded-full transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                            </button>
                        </div>
                    </div>

                    <>
                        <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                            <div className="flex items-center gap-1 md:gap-2">
                                {dashboardStore.selectedGroupId ? (
                                    <button onClick={() => dashboardStore.setSelectedGroupId(null)} className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 hover:border-blue-400 rounded-md text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0">
                                        <ArrowLeft size={12} className="shrink-0 text-blue-400" /> <span>Go Personal Tasks</span>
                                    </button>
                                ) : (
                                    <div className="flex bg-white/5 rounded-md overflow-hidden border border-white/10 shrink-0 shadow-inner">
                                        <button onClick={() => { setActiveTab('today'); dashboardStore.setSelectedGroupId(null); }} className={`px-1.5 py-0.5 md:px-2 md:py-1 text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-colors ${!dashboardStore.selectedGroupId && activeTab === 'today' ? 'bg-sky-500/20 text-sky-300' : 'text-white/40 hover:text-white/80 hover:bg-white/10'}`}>Today</button>
                                        <button onClick={() => { setActiveTab('tomorrow'); dashboardStore.setSelectedGroupId(null); }} className={`px-1.5 py-0.5 md:px-2 md:py-1 text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-colors ${!dashboardStore.selectedGroupId && activeTab === 'tomorrow' ? 'bg-purple-500/20 text-purple-300' : 'text-white/40 hover:text-white/80 hover:bg-white/10'}`}>Tomorrow</button>
                                    </div>
                                )}
                                
                                <div className="relative flex items-center gap-1 md:gap-1.5 px-1.5 py-0.5 md:px-2 md:py-1 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors shrink-0">
                                    <div className="flex items-center gap-1 md:gap-1.5 cursor-pointer" onClick={() => { dashboardStore.isTaskIntervalAlertEnabled ? dashboardStore.setIsTaskIntervalAlertEnabled(false) : (dashboardStore.setIsTaskIntervalAlertEnabled(true), dashboardStore.taskIntervalAlertMins === 0 && dashboardStore.setTaskIntervalAlertMins(10)); }}>
                                        <BellRing size={12} className={dashboardStore.isTaskIntervalAlertEnabled ? "text-sky-300" : "text-white/40"} />
                                        <span className="text-[9px] font-medium text-white/70">Interval</span>
                                        <button className={`relative inline-flex h-2.5 md:h-3 w-4 md:w-5 items-center rounded-full transition-colors shrink-0 ml-0.5 ${dashboardStore.isTaskIntervalAlertEnabled ? 'bg-sky-500' : 'bg-white/20'}`}>
                                            <span className={`inline-block h-1.5 md:h-2 w-1.5 md:w-2 transform rounded-full bg-white transition-transform ${dashboardStore.isTaskIntervalAlertEnabled ? 'translate-x-1.5 md:translate-x-2.5' : 'translate-x-0.5'}`} />
                                        </button>
                                    </div>
                                    {dashboardStore.isTaskIntervalAlertEnabled ? (
                                    <div className="flex items-center gap-1 pl-1 md:pl-1.5 ml-0.5 border-l border-white/10">
                                    <input 
                                        type="number" 
                                        value={dashboardStore.taskIntervalAlertMins || ''} 
                                        onChange={(e) => dashboardStore.setTaskIntervalAlertMins(isNaN(parseInt(e.target.value)) ? 0 : parseInt(e.target.value))} 
                                        className="w-6 md:w-7 bg-black/40 border border-white/20 rounded px-0.5 md:px-1 py-0.5 text-[9px] text-center font-bold text-sky-300 outline-none focus:border-sky-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner" 
                                        min="1" 
                                    />
                                    <span className="text-[8px] font-medium text-white/40 uppercase">min</span>
                                    </div>
                                    ) : (
                                        <div className="flex items-center pl-1 md:pl-1.5 ml-0.5 border-l border-white/10"><span className="text-[8px] font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-1.5 py-0.5 rounded-md shadow-sm">Beep alert off</span></div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {!dashboardStore.selectedGroupId && (
                                <div className="flex items-center gap-1">
                                    {[0, 1, 2].map((idx) => {
                                        const tabTasks = currentTasks.filter(t => (t.groupId || 0) === idx);
                                        const tabRemaining = tabTasks.filter(t => !isTaskCompleted(t)).reduce((sum, t) => sum + (t.duration || 0), 0);
                                        const timeDisplay = tabRemaining > 0 ? formatRemainingTime(tabRemaining).replace(' left', '') : '';
                                        const isActive = activeGroupTab === idx;

                                        return (
                                            <div key={idx} className={`relative flex items-center flex-1 h-[25px] min-w-0 rounded-md border text-[8px] font-bold uppercase tracking-wider cursor-pointer transition-all ${isActive ? 'bg-blue-500/20 border-blue-500/50 text-blue-200' : 'bg-white/5 border-white/20 text-white/50 hover:bg-white/10'}`} onClick={() => setActiveGroupTab(idx)}>
                                                {editingGroupIndex === idx ? (
                                                    <input autoFocus className="w-full h-full bg-transparent outline-none px-2 text-white" defaultValue={taskStore.taskGroupNames?.[idx] || `Tab ${idx + 1}`} onBlur={(e) => { taskStore.setTaskGroupName(idx, e.target.value.trim() || `Tab ${idx + 1}`); setEditingGroupIndex(null); }} onKeyDown={(e) => e.key === 'Enter' && (taskStore.setTaskGroupName(idx, e.currentTarget.value.trim() || `Tab ${idx + 1}`), setEditingGroupIndex(null))} />
                                                ) : (
                                                    <div onDoubleClick={() => setEditingGroupIndex(idx)} className="w-full px-2 truncate select-none text-left">{taskStore.taskGroupNames?.[idx] || `Tab ${idx + 1}`}</div>
                                                )}
                                                {timeDisplay && (
                                                    <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-extrabold tracking-wide px-1.5  rounded border shadow-md select-none transition-all ${
                                                        isActive 
                                                            ? 'bg-emerald-500 text-black border-emerald-400 font-black' 
                                                            : 'bg-[#141414] text-emerald-400 border-white/20'
                                                    }`}>
                                                        <pre>{timeDisplay}</pre>
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                        )}
                    </>
                </div>

                {dashboardStore.selectedGroupId ? (
                    <GroupTaskManager groupId={dashboardStore.selectedGroupId} />
                ) : (
                    <>
                        <ScrollableWithArrows className="px-1.5 max-h-[350px]">
                           {filteredTasks.length === 0 ? (
                                <div className="text-center text-white/50 p-4 text-[11px] sm:text-xs flex flex-col gap-2.5 items-center justify-center">
                                    <p className="italic font-medium text-white/60">No {activeTab} tasks found.</p>
                                    
                                    <div className="text-[11px] sm:text-[12px] bg-white/[0.04] border border-white/10 rounded-xl p-3 leading-relaxed text-left w-full space-y-1.5 text-white/80 shadow-inner">
                                        {activeTab === 'tomorrow' ? (
                                            <>
                                                📅 <strong className="text-purple-300">Plan Ahead & Rollover:</strong> Add your upcoming goals here to reduce today's load. When tomorrow arrives, these tasks will automatically shift over to Today so your workflow is seamless and nothing ever gets lost unless you delete it!
                                            </>
                                        ) : (
                                            <>
                                                💡 <strong className="text-sky-300">Quick Tip:</strong> Set a task title & duration to add it to your list, then hit <strong className="text-sky-300">Start</strong> to launch the timer with interval beeps. Focus time automatically increments in <strong className="text-emerald-300">5-minute spans</strong>, updates your daily focus hours, and saves to your history. Today's tasks are always safe and never lost unless you delete them!
                                            </>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* GAP REDUCED TO 1 (4px gap) */
                                <div className="flex flex-col pb-1 mt-1">
                                    {filteredTasks.map((task, index) => (
                                        <TaskItem 
                                            key={task.id} 
                                            task={task} 
                                            index={index} 
                                            activeTab={activeTab} 
                                            draggedIndex={draggedIndex} 
                                            setDraggedIndex={setDraggedIndex} 
                                            draggedIndexRef={draggedIndexRef} 
                                            openMenuId={openMenuId} 
                                            setOpenMenuId={setOpenMenuId} 
                                            isTaskDone={isTaskCompleted(task)} 
                                            handleToggleTask={handleToggleTask} 
                                            handleRestartTask={handleRestartTask} 
                                            triggerTimer={dashboardStore.triggerTimer} 
                                            setConfirmModal={setConfirmModal} 
                                            taskStore={taskStore}
                                        />
                                    ))}
                                </div>
                            )}
                        </ScrollableWithArrows>

                        <form 
                        onSubmit={handleAddTask} 
                        className="p-1 border-t border-white/10 bg-white/[0.02] flex items-center gap-2 backdrop-blur-sm shadow-sm"
                        >
                        {/* Task Input Container */}
                        <div className="relative flex-1 flex items-center">
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
                            className="w-full bg-white/5 border border-white/30 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:bg-white/10 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 transition-all placeholder:text-white/30 resize-none overflow-hidden h-[32px] min-h-[32px] max-h-[80px] flex items-center leading-normal" 
                            />
                        </div>

                        {/* Duration Input Container */}
                        <div className="relative shrink-0 flex items-center">
                            <input 
                            type="number" 
                            placeholder="Min" 
                            value={newTaskDuration} 
                            onChange={(e) => setNewTaskDuration(e.target.value)} 
                            className="w-[60px] h-[32px] bg-white/5 border border-white/30 rounded-lg px-1 text-xs font-medium text-center text-white outline-none focus:bg-white/10 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 transition-all placeholder:text-white/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                            />
                        </div>

                        {/* Submit Button */}
                        <button 
                            type="submit" 
                            className="h-[32px] w-[32px] bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-white border border-sky-500/20 rounded-lg transition-all shrink-0 active:scale-95 flex items-center justify-center shadow-md shadow-sky-500/5"
                        >
                            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                        </button>
                        </form>

                    </>
                )}

                <ConfirmationModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} isDestructive={confirmModal.isDestructive} />
                <ConfirmationModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} onConfirm={() => setIsInfoOpen(false)} title="Plan Your Day — Task Manager & Group Tasks Guide"                     message={
                        <ScrollableWithArrows className="max-h-[60vh] pr-2 flex flex-col gap-4 text-sm mt-1">
                            <div className="p-3 bg-purple-500/15 border border-purple-400/30 rounded-xl">
                                <h4 className="font-bold text-purple-300 mb-1 text-base flex items-center gap-1.5">
                                    👥 Group Tasks & Friend Collaboration
                                </h4>
                                <ul className="list-disc list-inside space-y-1.5 text-white/90 text-[12px] leading-relaxed">
                                    <li><strong>🔄 Daily Automatic Reset:</strong> Unlike personal tasks which remain active until completed, <strong>Group Tasks automatically reset completion progress every day at 00:00</strong> so group members start fresh together each day.</li>
                                    <li><strong>🤝 Work Together with Friends:</strong> Join your friends' task groups or create your own group to share tasks. Everyone tracks each other's live daily progress, reference time, and done minutes.</li>
                                    <li><strong>✨ Drag to Reorder:</strong> Group admins can reorder group tasks using the drag handle on the left of any task, updating the list in real-time for all group members.</li>
                                    <li><strong>🚀 How to Get Started:</strong> Click the Task Dropdown at the top left of Task Manager and select <strong>+ Create / Join Group</strong> to build or join a group with friends!</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-bold text-sky-400 mb-1 text-base">📅 Tabs, Drag Handles & Personal Tasks</h4>
                                <ul className="list-disc list-inside mt-2 space-y-1 text-white/90 text-[12px]">
                                    <li><strong>Custom Tabs:</strong> Switch between tabs to organize tasks. <strong>Double-click any tab name</strong> to rename it!</li>
                                    <li><strong>Drag & Drop Reordering:</strong> Drag the grip handle on the left of any task to easily reorder your list.</li>
                                    <li><strong>Move Tasks:</strong> Open the task menu to quickly swap a task between Today and Tomorrow.</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-emerald-400 mb-1 text-base">⏱️ Durations, Focus Timer & Editing</h4>
                                <ul className="list-disc list-inside mt-2 space-y-1 text-white/90 text-[12px]">
                                    <li><strong>Start Task Timer:</strong> Click the Start button at the bottom right of any task to launch the Focus Timer specifically for that task.</li>
                                    <li><strong>Double-click Task Title:</strong> Instantly edit the task title inline.</li>
                                    <li><strong>Edit Durations:</strong> Double-click the remaining duration or done badges to manually adjust logged time.</li>
                                </ul>
                            </div>
                        </ScrollableWithArrows>
                    } confirmText="Got it!" hideCancel={true} />
            </div>
        </div>
    );
}