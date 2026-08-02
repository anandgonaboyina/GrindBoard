'use client';
import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, VolumeX, Check, ListTodo, ChevronUp, ChevronDown, BarChart2, StickyNote, Map, Settings } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboardStore';
import { fetchQuote } from '@/utils/quoteEngine';
import { getLocalDateString } from '@/utils/date';
import DraggableWidget from './DraggableWidget';

export default function Timer() {
  const {
    timerTrigger, toggleTaskManager, isTaskManagerOpen,
    toggleStats, isStatsOpen,
    toggleNotes, isNotesOpen,
    togglePlans, isPlansOpen,
    timerEndAt, setTimerEndAt,
    timerPausedLeft, setTimerPausedLeft,
    timerInitialMins, setTimerInitialMins,
    timerLastSavedChunks, setTimerLastSavedChunks,
    timerLastAlertedChunks, setTimerLastAlertedChunks, taskIntervalAlertMins,
    taskIntervalRingSecs, isTaskIntervalAlertEnabled,
    isAlarmPlaying, setIsAlarmPlaying,
    addMins,
    showQuotePopup, isHidden,
    activeTaskId, activeTaskTitle, setActiveTask, updateTaskDuration,
    alarmSound, alarmVolume,
    enableAlarmSound, enableAlarmVibration,
    isTimerOpen
  } = useDashboardStore();

  const audioRef = useRef<HTMLAudioElement>(null);
  const [customMins, setCustomMins] = useState('');

  // Local state for UI updates (does not spam DB)
  const [localTimeLeft, setLocalTimeLeft] = useState(0);

  // Inline editing state
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editHours, setEditHours] = useState('00');
  const [editMins, setEditMins] = useState('25');
  
  const [lastInteractionTime, setLastInteractionTime] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('timer_last_active');
      return stored ? parseInt(stored) : Date.now();
    }
    return Date.now();
  });
  
  const updateInteraction = () => {
    const now = Date.now();
    setLastInteractionTime(now);
    localStorage.setItem('timer_last_active', now.toString());
  };

  const [showContinuePrompt, setShowContinuePrompt] = useState(false);

  // Ensure local time immediately reflects store changes
  useEffect(() => {
    if (timerEndAt) {
      const remaining = Math.max(0, Math.floor((timerEndAt - Date.now()) / 1000));
      setLocalTimeLeft(remaining);
    } else if (timerPausedLeft !== null) {
      setLocalTimeLeft(timerPausedLeft);
    } else {
      setLocalTimeLeft(0);
    }
  }, [timerEndAt, timerPausedLeft]);

  // Helper to save partial time for an active task timer before clearing/overwriting it
  const saveAndClearActiveTaskTimer = () => {
    if (activeTaskId && timerInitialMins) {
      let currentRemaining = localTimeLeft;
      if (timerEndAt) {
        currentRemaining = Math.max(0, Math.floor((timerEndAt - Date.now()) / 1000));
      } else if (timerPausedLeft !== null) {
        currentRemaining = timerPausedLeft;
      }

      const elapsedSeconds = (timerInitialMins * 60) - currentRemaining;
      if (elapsedSeconds > 0) {
        const finalUnsavedSeconds = elapsedSeconds - (timerLastSavedChunks * 300);
        const additionalChunks = Math.floor(finalUnsavedSeconds / 300);
        const finalUnsavedMins = additionalChunks * 5;

        if (finalUnsavedMins > 0) {
          const today = getLocalDateString();
          addMins(today, finalUnsavedMins);
          updateTaskDuration(activeTaskId, finalUnsavedMins);
        }
      }
    }

    setActiveTask(null, null);
    setTimerLastSavedChunks(0);
    setTimerLastAlertedChunks(0);
  };

  // Main tick interval
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timerEndAt) {
      interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.floor((timerEndAt - now) / 1000);

        if (timerInitialMins && activeTaskId) {
          const elapsedSeconds = (timerInitialMins * 60) - remaining;
          if (elapsedSeconds >= 0) {
            const chunks = Math.floor(elapsedSeconds / 300); // 5 minutes = 300 seconds
            if (chunks > timerLastSavedChunks) {
              const diff = chunks - timerLastSavedChunks;
              const minsToSave = diff * 5;
              const today = getLocalDateString();
              addMins(today, minsToSave);
              updateTaskDuration(activeTaskId, minsToSave);
              setTimerLastSavedChunks(chunks);
            }

            // Interval Alert Beep
            if (isTaskIntervalAlertEnabled && taskIntervalAlertMins > 0) {
              const alertIntervalSecs = taskIntervalAlertMins * 60;
              const alertChunks = Math.floor(elapsedSeconds / alertIntervalSecs);
              if (alertChunks > timerLastAlertedChunks && alertChunks > 0) {
                setTimerLastAlertedChunks(alertChunks);
                if (enableAlarmSound) {
                  const audio = new Audio(alarmSound);
                  const vol = alarmVolume !== undefined ? alarmVolume : 1;
                  audio.volume = (vol > 1 ? vol / 100 : vol) * 0.4; // Slightly lower volume for the interval beep
                  audio.play().catch(e => console.log('Interval beep failed:', e));
                  const duration = taskIntervalRingSecs ? taskIntervalRingSecs * 1000 : 1500;
                  setTimeout(() => {
                    audio.pause();
                  }, duration);
                }
              }
            }
          }
        }
        
        const elapsedSinceInteraction = Math.floor((now - lastInteractionTime) / 1000);
        if (elapsedSinceInteraction >= 7200) {
           // Idle for 2 hours while running, auto pause!
           const intendedPauseTime = lastInteractionTime + 7200000;
           // Only pause if the timer wouldn't have finished naturally before the pause time
           if (intendedPauseTime < timerEndAt) {
             const actualRemaining = Math.max(0, Math.floor((timerEndAt - intendedPauseTime) / 1000));
             setTimerPausedLeft(actualRemaining);
             setTimerEndAt(null);
             if (now - intendedPauseTime < 120000) {
               playAlarm();
             }
             setShowContinuePrompt(true);
             updateInteraction();
             return;
           }
        }

        if (remaining <= 0) {
          // Timer finished!
          clearInterval(interval);
          setLocalTimeLeft(0);
          setTimerEndAt(null);
          setTimerPausedLeft(null);
          
          if (now - timerEndAt < 120000) {
            playAlarm();
          }

          // Log to history
          if (timerInitialMins && timerInitialMins > 0) {
            const today = getLocalDateString();
            if (activeTaskId) {
              const elapsedSeconds = timerInitialMins * 60;
              const finalUnsavedSeconds = elapsedSeconds - (timerLastSavedChunks * 300);
              const additionalChunks = Math.floor(finalUnsavedSeconds / 300);
              const finalUnsavedMins = additionalChunks * 5;
              if (finalUnsavedMins > 0) {
                addMins(today, finalUnsavedMins);
                updateTaskDuration(activeTaskId, finalUnsavedMins);
              }
              setActiveTask(null, null);
              setTimerLastSavedChunks(0);
            } else {
              addMins(today, timerInitialMins);
            }
            setTimerInitialMins(null);
          }

          // Show quote popup
          fetchQuote().then(q => showQuotePopup(q));
        } else {
          setLocalTimeLeft(remaining);
        }
      }, 250); // High frequency check for smooth local UI update
    }

    return () => clearInterval(interval);
  }, [timerEndAt, timerInitialMins, timerLastSavedChunks, timerLastAlertedChunks, taskIntervalAlertMins, addMins, setTimerEndAt, setTimerPausedLeft, setTimerInitialMins, setTimerLastSavedChunks, setTimerLastAlertedChunks, showQuotePopup, activeTaskId, updateTaskDuration, setActiveTask, alarmSound, alarmVolume, enableAlarmSound]);

  // Listen for timer triggers from other components
  useEffect(() => {
    if (timerTrigger) {
      const state = useDashboardStore.getState();
      if (timerTrigger.taskId && timerTrigger.taskId === state.activeTaskId) {
        if (state.timerPausedLeft !== null) {
          setTimerEndAt(Date.now() + state.timerPausedLeft * 1000);
          setTimerPausedLeft(null);
        }
        return;
      }

      // If we are triggering a new timer, save partial time of any currently running task timer
      saveAndClearActiveTaskTimer();

      if (timerTrigger.taskId) {
        setActiveTask(timerTrigger.taskId, timerTrigger.taskTitle || null);
        startTimer(timerTrigger.mins * 60, true);
      } else {
        startTimer(timerTrigger.mins * 60, false);
      }
    }
  }, [timerTrigger]);

  // Handle vibration pattern when alarm is playing
  useEffect(() => {
    let vibeInterval: NodeJS.Timeout;
    if (isAlarmPlaying && enableAlarmVibration) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([500, 500, 500, 500, 500]);
          vibeInterval = setInterval(() => {
            try { navigator.vibrate([500, 500, 500, 500, 500]); } catch (e) { }
          }, 2500);
        } catch (e) { }
      }
    } else {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(0); } catch (e) { }
      }
    }
    return () => {
      if (vibeInterval) clearInterval(vibeInterval);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(0); } catch (e) { }
      }
    };
  }, [isAlarmPlaying, enableAlarmVibration]);

  // Handle Audio playback reacting to isAlarmPlaying state
  useEffect(() => {
    if (audioRef.current) {
      if (isAlarmPlaying && enableAlarmSound) {
        const vol = alarmVolume !== undefined ? alarmVolume : 1;
        audioRef.current.volume = vol > 1 ? vol / 100 : vol;
        audioRef.current.play().catch(e => console.error('Failed to play alarm:', e));
      } else {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [isAlarmPlaying, enableAlarmSound, alarmVolume]);

  const getAlarmTitle = () => {
    if (enableAlarmSound && enableAlarmVibration) return 'PWA_ALARM_RING_VIBRATE';
    if (enableAlarmSound) return 'PWA_ALARM_RING';
    if (enableAlarmVibration) return 'PWA_ALARM_VIBRATE';
    return 'PWA_ALARM_TRIGGER';
  };

  const playAlarm = async () => {
    setIsAlarmPlaying(true);
    useDashboardStore.setState({ isTimerOpen: true });
    const durationSecs = useDashboardStore.getState().alarmDurationSecs || 60;

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          registration.showNotification(getAlarmTitle(), {
            body: 'Your focus session has ended.',
            icon: '/icon-192x192.png',
            vibrate: enableAlarmVibration ? [500, 500, 500, 500, 500] : undefined,
            silent: !enableAlarmSound,
            requireInteraction: true,
            tag: 'alarm-alert',
            renotify: true
          } as any);
        } else {
          new Notification(getAlarmTitle(), {
            body: 'Your focus session has ended.',
            icon: '/icon-192x192.png',
            vibrate: enableAlarmVibration ? [500, 500, 500, 500, 500] : undefined,
            silent: !enableAlarmSound,
            requireInteraction: true,
            tag: 'alarm-alert',
            renotify: true
          } as any);
        }
      } catch (e) {
        console.error('Notification failed:', e);
      }
    }

    setTimeout(() => {
      useDashboardStore.getState().setIsAlarmPlaying(false);
    }, durationSecs * 1000);
  };

  const stopAlarm = async () => {
    setIsAlarmPlaying(false);
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const notifications = await registration.getNotifications({ tag: 'alarm-alert' } as any);
        notifications.forEach(n => n.close());
      } catch (e) { }
    }
  };

  const startTimer = (seconds: number, isTask: boolean = false) => {
    if (!isTask) {
      saveAndClearActiveTaskTimer();
    }
    setTimerInitialMins(Math.round(seconds / 60));
    setTimerPausedLeft(null);
    setTimerEndAt(Date.now() + seconds * 1000);
    setTimerLastSavedChunks(0);
    setTimerLastAlertedChunks(0);
    stopAlarm();
    updateInteraction();

    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setTimeout(() => {
        useDashboardStore.setState({ isTimerOpen: false });
      }, 3000);
    }

    // Unlock audio for mobile browsers during this user interaction
    // We allow a brief audible "blip" which acts as start feedback and securely unlocks audio on strict mobile browsers
    if (audioRef.current && enableAlarmSound) {
      const vol = alarmVolume !== undefined ? alarmVolume : 1;
      audioRef.current.volume = vol > 1 ? vol / 100 : vol;
      audioRef.current.play().then(() => {
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
        }, 150); // 150ms audible blip
      }).catch(e => console.log('Audio unlock failed:', e));
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') scheduleNotification(Date.now() + seconds * 1000);
        });
      } else if (Notification.permission === 'granted') {
        scheduleNotification(Date.now() + seconds * 1000);
      }
    }
  };

  const scheduleNotification = async (targetTimestamp: number) => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && (window as any).TimestampTrigger) {
      try {
        const registration = await navigator.serviceWorker.ready;
        registration.showNotification(getAlarmTitle(), {
          body: 'Your focus session has ended.',
          icon: '/icon-192x192.png',
          vibrate: enableAlarmVibration ? [500, 500, 500, 500, 500] : undefined,
          silent: !enableAlarmSound,
          requireInteraction: true,
          tag: 'alarm-alert',
          renotify: true,
          showTrigger: new (window as any).TimestampTrigger(targetTimestamp)
        } as any);
      } catch (e) {
        console.error('Failed to schedule notification:', e);
      }
    }
  };

  const togglePause = () => {
    if (timerEndAt) {
      // Pause it
      setTimerPausedLeft(localTimeLeft);
      setTimerEndAt(null);

      // Clear scheduled background notification
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(async (registration) => {
          try {
            const notifications = await registration.getNotifications({ tag: 'alarm-alert', includeTriggered: true } as any);
            notifications.forEach(n => n.close());
          } catch (e) { }
        });
      }
    } else if (timerPausedLeft !== null) {
      // Resume it
      const newEndAt = Date.now() + timerPausedLeft * 1000;
      setTimerEndAt(newEndAt);
      setTimerPausedLeft(null);

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        scheduleNotification(newEndAt);
      }
    }
  };

  const resetTimer = () => {
    saveAndClearActiveTaskTimer();
    setTimerEndAt(null);
    setTimerPausedLeft(null);
    setTimerInitialMins(null);
    stopAlarm();
  };

  const handleCustomStart = () => {
    let mins = parseInt(customMins);
    if (!isNaN(mins) && mins > 0) {
      startTimer(mins * 60); 
      setCustomMins('');
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const openEditor = () => {
    if (timerEndAt || isAlarmPlaying) return;
    const h = Math.floor(localTimeLeft / 3600);
    const m = Math.floor((localTimeLeft % 3600) / 60) || 25;
    setEditHours(h.toString().padStart(2, '0'));
    setEditMins(m.toString().padStart(2, '0'));
    setIsEditingTime(true);
  };

  const saveEditor = () => {
    let h = parseInt(editHours) || 0;
    let m = parseInt(editMins) || 0;
    const newRemaining = h * 3600 + m * 60;

    if (timerInitialMins) {
      const oldElapsed = (timerInitialMins * 60) - localTimeLeft;
      setTimerInitialMins(Math.max(0, Math.round((oldElapsed + newRemaining) / 60)));
    }

    setTimerPausedLeft(newRemaining);
    setIsEditingTime(false);
  };

  const adjustEditTime = (type: 'h' | 'm', delta: number) => {
    if (type === 'h') {
      const h = Math.max(0, Math.min(99, parseInt(editHours) + delta));
      setEditHours(h.toString().padStart(2, '0'));
    } else {
      const m = Math.max(0, Math.min(59, parseInt(editMins) + delta));
      setEditMins(m.toString().padStart(2, '0'));
    }
  };

  // Always render to keep interval running, but can hide visually if needed.
  // Actually, we'll just not return null.

  return (
    <DraggableWidget id="timer">
      <div 
        onPointerDown={updateInteraction}
        className={`relative pointer-events-auto select-none ${isTimerOpen || isAlarmPlaying ? '' : 'hidden'}`}
      >
        <div className="w-64 rounded-3xl glass-panel p-3 text-white flex flex-col gap-2">
          {/* Timer Display / Editor */}
          <div className="text-center min-h-[80px] flex flex-col items-center justify-center relative">
            {activeTaskTitle && (
              <div className="w-full max-w-[220px] mb-3 text-sm font-bold text-white flex items-center justify-center gap-2 bg-blue-600/50 backdrop-blur-md border border-blue-400/50 px-2 py-2 rounded-2xl shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <span className="shrink-0 w-2 h-2 rounded-full bg-blue-200 animate-pulse mt-[5px] self-start"></span>
                <span className="break-words whitespace-normal text-center leading-snug drop-shadow-md">{activeTaskTitle}</span>
              </div>
            )}
            <div className="flex items-center justify-center w-full relative">
              {/* Quick Presets Right */}
              {!timerEndAt && !timerPausedLeft && localTimeLeft === 0 && !isEditingTime && !isAlarmPlaying && (
                <div className="absolute right-1 top-1/2 mt-[20px] ml-[5px] -translate-y-1/2 flex flex-col gap-1.5">
                  {[5, 15, 25].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => startTimer(preset * 60)}
                      className="w-10 py-1 text-xs bg-white/5 hover:bg-white/20 rounded-lg transition-colors border border-white/10 font-medium"
                    >
                      {preset}m
                    </button>
                  ))}
                </div>
              )}

              {isEditingTime ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="flex flex-col items-center">
                    <button onClick={() => adjustEditTime('h', 1)} className="hover:text-white/60 p-1"><ChevronUp size={20} /></button>
                    <input
                      type="number"
                      value={editHours}
                      onChange={(e) => setEditHours(e.target.value.padStart(2, '0'))}
                      onKeyDown={(e) => e.key === 'Enter' && saveEditor()}
                      className="w-16 bg-transparent text-5xl font-light tabular-nums text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none selection:bg-white/20"
                      min="0"
                      max="99"
                    />
                    <button onClick={() => adjustEditTime('h', -1)} className="hover:text-white/60 p-1"><ChevronDown size={20} /></button>
                  </div>
                  <span className="text-5xl font-light opacity-50 mb-0">:</span>
                  <div className="flex flex-col items-center">
                    <button onClick={() => adjustEditTime('m', 1)} className="hover:text-white/60 p-1"><ChevronUp size={20} /></button>
                    <input
                      type="number"
                      value={editMins}
                      onChange={(e) => setEditMins(e.target.value.padStart(2, '0'))}
                      onKeyDown={(e) => e.key === 'Enter' && saveEditor()}
                      className="w-16 bg-transparent text-5xl font-light tabular-nums text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none selection:bg-white/20"
                      min="0"
                      max="59"
                    />
                    <button onClick={() => adjustEditTime('m', -1)} className="hover:text-white/60 p-1"><ChevronDown size={20} /></button>
                  </div>
                  <button onClick={saveEditor} className="ml-1 p-2 bg-blue-500/80 hover:bg-blue-500 rounded-xl transition-colors">
                    <Check size={20} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={openEditor}
                  className={`text-5xl font-light tracking-widest tabular-nums drop-shadow-md transition-opacity ${!timerEndAt && !isAlarmPlaying ? 'cursor-pointer hover:opacity-80' : ''}`}
                  title={!timerEndAt && !isAlarmPlaying ? "Click to set time" : ""}
                >
                  {formatTime(localTimeLeft)}
                </div>
              )}
            </div>
          </div>

          {/* Alarm State */}
          {isAlarmPlaying ? (
            showContinuePrompt ? (
              <div className="flex flex-col items-center gap-3 w-full py-2">
                <p className="text-sm font-semibold text-blue-300">Are you still working?</p>
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => {
                      setShowContinuePrompt(false);
                      setIsAlarmPlaying(false);
                      // Resume timer
                      if (timerPausedLeft !== null) {
                        setTimerEndAt(Date.now() + timerPausedLeft * 1000);
                        setTimerPausedLeft(null);
                        updateInteraction();
                      }
                    }}
                    className="flex-1 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-xs font-bold transition-colors"
                  >
                    Continue
                  </button>
                  <button
                    onClick={() => {
                      setShowContinuePrompt(false);
                      setIsAlarmPlaying(false);
                    }}
                    className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors"
                  >
                    Stop
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={stopAlarm}
                className="w-full py-2 flex items-center justify-center gap-2 bg-red-500/80 hover:bg-red-500 rounded-xl font-medium transition-colors animate-pulse"
              >
                <VolumeX size={20} />
                STOP TIMER
              </button>
            )
          ) : (
            <>
              {/* Controls */}
              {!isEditingTime && (
                <div className="flex justify-center gap-2">
                  <button
                    onClick={localTimeLeft > 0 || timerPausedLeft ? togglePause : () => startTimer(25 * 60)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                    title={localTimeLeft > 0 || timerPausedLeft ? (timerEndAt ? "Pause" : "Resume") : "Start 25m Timer"}
                  >
                    {timerEndAt ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                  <button
                    onClick={resetTimer}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                    title="Reset Timer"
                  >
                    <Square size={20} className="fill-current" />
                  </button>
                </div>
              )}

              {/* Custom Input */}
              {!timerEndAt && !timerPausedLeft && localTimeLeft === 0 && !isEditingTime && (
                <div className="flex gap-2 mt-1">
                  <input
                    type="number"
                    placeholder="Custom mins..."
                    value={customMins}
                    onChange={(e) => setCustomMins(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCustomStart()}
                    className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm outline-none focus:bg-white/10 transition-colors placeholder:text-white/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    min="1"
                  />
                  <button
                    onClick={handleCustomStart}
                    className="px-3 py-1 bg-blue-500/60 hover:bg-blue-500/80 rounded-lg text-sm font-medium transition-colors shrink-0"
                  >
                    Set
                  </button>
                </div>
              )}
            </>
          )}

          {/* Hidden Audio Element */}
          <audio 
            ref={audioRef} 
            src={alarmSound} 
            loop 
            preload="auto" 
            onPlay={(e) => {
              // Prevent Lively Wallpaper / Chromium from auto-resuming media on focus
              if (!useDashboardStore.getState().isAlarmPlaying) {
                e.currentTarget.pause();
                e.currentTarget.currentTime = 0;
              }
            }}
          />
        </div>
      </div>
    </DraggableWidget>
  );
}
