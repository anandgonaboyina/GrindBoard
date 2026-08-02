'use client';
import { useState, useEffect } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { Play, Pause, Square, History, Trash2, ChevronLeft, Check } from 'lucide-react';
import DraggableWidget from './DraggableWidget';
import ConfirmationModal from './ConfirmationModal';

export default function Stopwatch() {
  const { isStopwatchOpen, addStopwatchSession, stopwatchSessions, deleteStopwatchSession, clearStopwatchSessions, stopwatchStartTime, setStopwatchStartTime } = useDashboardStore();
  
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [taskTitle, setTaskTitle] = useState('');
  const [viewingHistory, setViewingHistory] = useState(false);
  const [addToStats, setAddToStats] = useState(true);
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false, title: '', message: '', onConfirm: () => {}
  });

  const updateInteraction = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('stopwatch_last_active', Date.now().toString());
    }
  };

  useEffect(() => {
    const pausedSecs = typeof window !== 'undefined' ? localStorage.getItem('stopwatch_paused_secs') : null;

    if (stopwatchStartTime) {
      const now = Date.now();
      const storedLastActive = typeof window !== 'undefined' ? localStorage.getItem('stopwatch_last_active') : null;
      const lastActive = storedLastActive ? parseInt(storedLastActive) : now;
      
      const timeSinceActive = Math.floor((now - lastActive) / 1000);
      
      if (timeSinceActive >= 7200) {
        const cappedElapsed = Math.floor((lastActive + 7200000 - stopwatchStartTime) / 1000);
        setIsRunning(false);
        setElapsedSecs(cappedElapsed);
        setShowContinuePrompt(true);
        if (now - (lastActive + 7200000) < 120000) {
          useDashboardStore.getState().setIsAlarmPlaying(true);
        }
        useDashboardStore.setState({ isStopwatchOpen: true });
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('stopwatch_paused_secs', cappedElapsed.toString());
        }
        setStopwatchStartTime(null);
      } else {
        setIsRunning(true);
        setElapsedSecs(Math.max(0, Math.floor((now - stopwatchStartTime) / 1000)));
        // We do NOT update interaction here, otherwise just opening the tab keeps it alive.
      }
    } else if (pausedSecs) {
      setIsRunning(false);
      setElapsedSecs(Math.max(0, parseInt(pausedSecs)));
    } else {
      setIsRunning(false);
      setElapsedSecs(0);
    }
  }, [stopwatchStartTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && stopwatchStartTime) {
      interval = setInterval(() => {
        setElapsedSecs(prev => {
          const now = Date.now();
          const stored = typeof window !== 'undefined' ? localStorage.getItem('stopwatch_last_active') : null;
          const lastActive = stored ? parseInt(stored) : now;
          const timeSinceActive = Math.floor((now - lastActive) / 1000);
          
          if (timeSinceActive >= 7200) {
            setIsRunning(false);
            if (now - (lastActive + 7200000) < 120000) {
              useDashboardStore.getState().setIsAlarmPlaying(true);
            }
            useDashboardStore.setState({ isStopwatchOpen: true });
            setShowContinuePrompt(true);
            updateInteraction();
            
            const cappedElapsed = Math.max(0, Math.floor((lastActive + 7200000 - stopwatchStartTime) / 1000));
            if (typeof window !== 'undefined') {
              localStorage.setItem('stopwatch_paused_secs', cappedElapsed.toString());
            }
            setStopwatchStartTime(null);
            
            return cappedElapsed;
          }
          return Math.max(0, Math.floor((now - stopwatchStartTime) / 1000));
        });
      }, 250); 
    }
    return () => clearInterval(interval);
  }, [isRunning, stopwatchStartTime]);

  const handleStart = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isRunning) {
      setStopwatchStartTime(Date.now() - elapsedSecs * 1000);
      setIsRunning(true);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('stopwatch_paused_secs');
      }
      updateInteraction();
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setTimeout(() => {
          useDashboardStore.setState({ isStopwatchOpen: false });
        }, 3000);
      }
    }
  };

  const handlePause = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isRunning) {
      setIsRunning(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem('stopwatch_paused_secs', elapsedSecs.toString());
      }
      setStopwatchStartTime(null);
    }
  };

  const handleStop = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (elapsedSecs > 0) {
      addStopwatchSession(taskTitle.trim() || 'Untitled Session', elapsedSecs, addToStats);
    }
    setIsRunning(false);
    setElapsedSecs(0);
    setStopwatchStartTime(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('stopwatch_paused_secs');
      localStorage.removeItem('stopwatch_last_active');
    }
    setTaskTitle('');
  };

  const toggleStatsCheckbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAddToStats(!addToStats);
  };

  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <DraggableWidget id="stopwatch">
      <div 
        className={`relative pointer-events-auto select-none ${isStopwatchOpen ? '' : 'hidden'}`} 
        onClick={(e) => e.stopPropagation()}
        onPointerDown={updateInteraction}
      >
        <div className="w-56 rounded-3xl glass-panel p-3 text-white flex flex-col gap-2 min-h-[120px]">
          
          {viewingHistory ? (
            <div className="flex flex-col h-full gap-2 relative">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); setViewingHistory(false); }} className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white">
                    <ChevronLeft size={16} />
                  </button>
                  <span className="font-medium text-xs tracking-wide">History</span>
                </div>
                {stopwatchSessions && stopwatchSessions.length > 0 && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmModal({
                        isOpen: true,
                        title: 'Clear History',
                        message: 'Clear all stopwatch history?',
                        isDestructive: true,
                        onConfirm: clearStopwatchSessions
                      });
                    }}
                    className="p-1.5 bg-white/10 border border-white/20 text-white/70 hover:text-red-400 hover:bg-red-500/20 hover:border-red-500/30 rounded-lg transition-all shadow-sm"
                    title="Clear All History"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto arrow-scrollbar pr-1 max-h-[160px]" onWheel={(e) => { e.stopPropagation(); e.currentTarget.scrollTop += e.deltaY; }}>
                {(!stopwatchSessions || stopwatchSessions.length === 0) ? (
                  <div className="text-center text-white/40 mt-4 text-[10px]">No records yet.</div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {(stopwatchSessions || []).map(session => (
                      <div key={session.id} className="bg-black/20 border border-white/5 rounded-xl p-2 flex flex-col gap-1 group">
                        <div className="flex justify-between items-start">
                          <span className="font-semibold text-[10px] truncate pr-2 text-white/90">{session.title}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteStopwatchSession(session.id); }}
                            className="p-1 bg-white/5 border border-white/10 text-white/50 hover:text-red-400 hover:bg-red-500/20 hover:border-red-500/30 rounded-md transition-all shrink-0"
                            title="Delete Record"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-white/50">
                          <span className="tabular-nums font-bold text-blue-300/80">{formatTime(session.durationSecs)}</span>
                          <span>{new Date(session.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Header / Title Input */}
              <div className="w-full flex items-center justify-between gap-1 px-1">
                <input 
                  type="text" 
                  placeholder="Task Name..." 
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-center text-[10px] font-medium outline-none focus:border-blue-400 focus:bg-white/10 transition-all placeholder:text-white/40 shadow-inner"
                />
                <button 
                  onClick={(e) => { e.stopPropagation(); setViewingHistory(true); }}
                  className="p-1.5 bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg transition-all text-white/80 hover:text-white shrink-0 shadow-sm"
                  title="View History"
                >
                  <History size={12} />
                </button>
              </div>

              {showContinuePrompt ? (
                <div className="flex flex-col items-center gap-3 w-full py-2">
                  <p className="text-[11px] font-semibold text-blue-300">Are you still working?</p>
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowContinuePrompt(false);
                        useDashboardStore.getState().setIsAlarmPlaying(false);
                        
                        // Clear paused secs and resume
                        if (typeof window !== 'undefined') {
                          localStorage.removeItem('stopwatch_paused_secs');
                        }
                        updateInteraction();
                        setStopwatchStartTime(Date.now() - elapsedSecs * 1000);
                        setIsRunning(true);
                      }}
                      className="flex-1 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-[10px] font-bold transition-colors"
                    >
                      Continue
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowContinuePrompt(false);
                        useDashboardStore.getState().setIsAlarmPlaying(false);
                      }}
                      className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold transition-colors"
                    >
                      Stop
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Time Display */}
                  <div className="text-center min-h-[50px] flex flex-col items-center justify-center relative">
                    <div className="flex items-center justify-center w-full relative">
                      <div className={`text-4xl font-light tracking-tighter tabular-nums drop-shadow-md transition-opacity ${isRunning ? 'opacity-100' : 'opacity-90'}`}>
                        {formatTime(elapsedSecs)}
                      </div>
                    </div>
                  </div>

                  {/* Add to Stats Toggle */}
                  <div 
                    className="flex items-center justify-center gap-1.5 cursor-pointer opacity-70 hover:opacity-100 transition-opacity mb-1"
                    onClick={toggleStatsCheckbox}
                  >
                    <div className={`w-3 h-3 rounded-[3px] border flex items-center justify-center transition-colors ${addToStats ? 'bg-blue-500 border-blue-400' : 'border-white/40'}`}>
                      {addToStats && <Check size={8} className="text-white" />}
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-bold">Add to Today's Focus</span>
                  </div>

                  {/* Controls */}
                  <div className="flex justify-center items-center gap-2 mt-1">
                    {!isRunning ? (
                      <button 
                        onClick={handleStart} 
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg transition-all hover:scale-105 active:scale-95"
                        title="Start Stopwatch"
                      >
                        <Play fill="currentColor" size={14} className="ml-0.5" />
                      </button>
                    ) : (
                      <button 
                        onClick={handlePause} 
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg transition-all hover:scale-105 active:scale-95"
                        title="Pause Stopwatch"
                      >
                        <Pause fill="currentColor" size={14} />
                      </button>
                    )}
                    <button 
                      onClick={handleStop} 
                      disabled={elapsedSecs === 0}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                      title="Stop & Save"
                    >
                      <Square fill="currentColor" size={12} />
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
      
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        isDestructive={confirmModal.isDestructive}
      />
    </DraggableWidget>
  );
}
