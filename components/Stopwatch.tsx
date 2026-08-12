'use client';
import { useState, useEffect } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { Play, Pause, Square, History, Trash2, ChevronLeft, Check } from 'lucide-react';
import DraggableWidget from './DraggableWidget';
import ConfirmationModal from './ConfirmationModal';
import { getLocalDateString } from '@/utils/date';

export default function Stopwatch() {
  const { isStopwatchOpen, stopwatchStartTime, setStopwatchStartTime, stopwatchLastSavedChunks, setStopwatchLastSavedChunks, addMins, stopwatchAddToStats, setStopwatchAddToStats } = useDashboardStore();
  
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);

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
          setElapsedSecs(cappedElapsed);
          return;
        }

        const currentElapsed = Math.max(0, Math.floor((now - stopwatchStartTime) / 1000));
        setElapsedSecs(currentElapsed);

        if (stopwatchAddToStats) {
          const chunks = Math.floor(currentElapsed / 300); // 5 minutes = 300 seconds
          if (chunks > stopwatchLastSavedChunks) {
            const diff = chunks - stopwatchLastSavedChunks;
            const minsToSave = diff * 5;
            const today = getLocalDateString();
            addMins(today, minsToSave);
            setStopwatchLastSavedChunks(chunks);
          }
        }
      }, 250); 
    }
    return () => clearInterval(interval);
  }, [isRunning, stopwatchStartTime, stopwatchAddToStats, stopwatchLastSavedChunks]);

  const handleStart = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isRunning) {
      if (elapsedSecs === 0) {
        setStopwatchLastSavedChunks(0);
      }
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
    finalizeStop(stopwatchAddToStats);
  };

  const finalizeStop = (saveToStats: boolean) => {
    if (elapsedSecs > 0 && saveToStats) {
      const totalMins = Math.floor(elapsedSecs / 60);
      const alreadySavedMins = stopwatchLastSavedChunks * 5;
      const finalUnsavedMins = Math.max(0, totalMins - alreadySavedMins);
      if (finalUnsavedMins > 0) {
        addMins(getLocalDateString(), finalUnsavedMins);
      }
    }
    setIsRunning(false);
    setElapsedSecs(0);
    setStopwatchStartTime(null);
    setStopwatchLastSavedChunks(0);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('stopwatch_paused_secs');
      localStorage.removeItem('stopwatch_last_active');
    }
  };

  const toggleStatsCheckbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStopwatchAddToStats(!stopwatchAddToStats);
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
      >
        <div className="w-48 rounded-3xl glass-panel border border-white/20 text-white flex flex-col min-h-[90px] overflow-hidden shadow-2xl">
          
          {/* Top Handle - Draggable */}
          <div 
            className="w-full h-5 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center cursor-grab active:cursor-grabbing group border-b border-white/5"
            onPointerDown={updateInteraction}
          >
            <div className="w-8 h-1 rounded-full bg-white/20 group-hover:bg-white/40 transition-colors" />
          </div>

          {/* Body - Non-draggable */}
          <div 
            className="p-3 flex flex-col gap-1 cursor-default"
            onPointerDown={(e) => {
              e.stopPropagation();
              updateInteraction();
            }}
          >
            {showContinuePrompt ? (
              <div className="flex flex-col items-center gap-2 w-full py-1">
                <p className="text-[10px] font-semibold text-blue-300">Still working?</p>
                <div className="flex gap-2 w-full">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowContinuePrompt(false);
                      useDashboardStore.getState().setIsAlarmPlaying(false);
                      
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('stopwatch_paused_secs');
                      }
                      updateInteraction();
                      setStopwatchStartTime(Date.now() - elapsedSecs * 1000);
                      setIsRunning(true);
                    }}
                    className="flex-1 py-1 bg-blue-500 hover:bg-blue-600 rounded-lg text-[9px] font-bold transition-colors"
                  >
                    Continue
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowContinuePrompt(false);
                      useDashboardStore.getState().setIsAlarmPlaying(false);
                    }}
                    className="flex-1 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[9px] font-bold transition-colors"
                  >
                    Stop
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Time Display */}
                <div className="text-center flex flex-col items-center justify-center">
                  <div className={`text-4xl font-light tracking-tighter tabular-nums drop-shadow-md transition-opacity ${isRunning ? 'opacity-100' : 'opacity-90'}`}>
                    {formatTime(elapsedSecs)}
                  </div>
                </div>

                {/* Add to Stats Toggle */}
                <div 
                  className="flex items-center justify-center gap-1.5 cursor-pointer opacity-70 hover:opacity-100 transition-opacity my-0.5"
                  onClick={toggleStatsCheckbox}
                >
                  <div className={`w-3 h-3 rounded-[3px] border flex items-center justify-center transition-colors ${stopwatchAddToStats ? 'bg-blue-500 border-blue-400' : 'border-white/40'}`}>
                    {stopwatchAddToStats && <Check size={8} className="text-white" />}
                  </div>
                  <span className="text-[8px] uppercase tracking-wider font-bold">Add to Today's Focus</span>
                </div>

                {/* Controls */}
                <div className="flex justify-center items-center gap-2">
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
          </div>
        </div>
      </div>
    </DraggableWidget>
  );
}
