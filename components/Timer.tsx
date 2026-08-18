'use client';
import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, VolumeX, Check, ListTodo, ChevronUp, ChevronDown, BarChart2, StickyNote, Map, Settings } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboardStore';
import { fetchQuote } from '@/utils/quoteEngine';
import { getLocalDateString } from '@/utils/date';
import DraggableWidget from './DraggableWidget';
import { useAudioUrl } from '@/hooks/useAudioUrl';
import { getDeviceId } from '@/utils/deviceId';

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
    isTimerOpen, timerDeviceId, setTimerDeviceId
  } = useDashboardStore();

  const resolvedAlarmUrl = useAudioUrl(alarmSound);

  const audioRef = useRef<HTMLAudioElement>(null);
  const intervalAudioRef = useRef<HTMLAudioElement | null>(null);
  const [customMins, setCustomMins] = useState<any>('');
  const [isIntervalRinging, setIsIntervalRinging] = useState(false);

  // Local state for UI updates (does not spam DB)
  const [localTimeLeft, setLocalTimeLeft] = useState(0);

  // Ref mirror of timerLastSavedChunks so the interval callback always
  // reads the up-to-date value within the same tick (state updates are async).
  const savedChunksRef = useRef(timerLastSavedChunks);
  const alertedChunksRef = useRef(timerLastAlertedChunks);
  const isUnlockingAudioRef = useRef(false);
  const isIntervalRingingRef = useRef(false);
  const lastIntervalAlertMinsRef = useRef(taskIntervalAlertMins);
  const lastIsIntervalEnabledRef = useRef(isTaskIntervalAlertEnabled);

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
  
  // Suppress harmless NotSupportedError unhandled rejections caused by Lively Wallpaper/Chromium forcing play() on invalid media sources before fallback kicks in
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errStr = String(event.reason?.name || event.reason?.message || event.reason);
      if (errStr.includes('NotSupportedError') || errStr.includes('no supported sources') || errStr.includes('The element has no supported sources')) {
        event.preventDefault(); // Suppresses the console error
        event.stopImmediatePropagation(); // Prevents Next.js Dev overlay from catching it and spamming the terminal
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', handleUnhandledRejection, { capture: true });
      return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection, { capture: true });
    }
  }, []);

  // Keep the ref mirror in sync for resets (0 or -1), but ignore cloud sync overwrites of active state
  // to prevent ghost interval beeps or double-saving stats.
  useEffect(() => {
    if (timerLastSavedChunks === 0) {
      savedChunksRef.current = 0;
    }
  }, [timerLastSavedChunks]);

  useEffect(() => {
    if (timerLastAlertedChunks <= 0) {
      alertedChunksRef.current = timerLastAlertedChunks;
    }
  }, [timerLastAlertedChunks]);

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

  // Helper to clear timer state and save partial minutes IF minimum 5-min span is reached
  const saveAndClearActiveTaskTimer = () => {
    if (timerInitialMins) {
      let currentRemaining = localTimeLeft;
      if (timerEndAt) {
        currentRemaining = Math.max(0, Math.floor((timerEndAt - Date.now()) / 1000));
      } else if (timerPausedLeft !== null) {
        currentRemaining = timerPausedLeft;
      }

      const elapsedSeconds = (timerInitialMins * 60) - currentRemaining;
      if (elapsedSeconds >= 300) {
        const elapsedMins = Math.floor(elapsedSeconds / 60);
        const savedMins = savedChunksRef.current * 5;
        const finalUnsavedMins = Math.max(0, elapsedMins - savedMins);

        if (finalUnsavedMins > 0) {
          const today = getLocalDateString();
          addMins(today, finalUnsavedMins);
          if (activeTaskId) {
            updateTaskDuration(activeTaskId, finalUnsavedMins);
          }
        }
      }
    }

    savedChunksRef.current = 0;
    setActiveTask(null, null);
    setTimerLastSavedChunks(0);
    setTimerLastAlertedChunks(0);
    
    // Safety clear of interval beep
    if (intervalAudioRef.current) {
      intervalAudioRef.current.pause();
      intervalAudioRef.current.currentTime = 0;
    }
    setIsIntervalRinging(false);
    isIntervalRingingRef.current = false;
  };

  // Main tick interval
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timerEndAt) {
      interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.floor((timerEndAt - now) / 1000);
        const isOwner = timerDeviceId === getDeviceId();

        if (timerInitialMins) {
          const elapsedSeconds = (timerInitialMins * 60) - remaining;
          if (elapsedSeconds >= 0) {
            const chunks = Math.floor(elapsedSeconds / 300); // 5 minutes = 300 seconds
            if (chunks > savedChunksRef.current) {
              // Only owner saves chunks to prevent duplication
              if (isOwner) {
                const diff = chunks - savedChunksRef.current;
                const minsToSave = diff * 5;
                const today = getLocalDateString();
                addMins(today, minsToSave);
                if (activeTaskId) {
                  updateTaskDuration(activeTaskId, minsToSave);
                }
                setTimerLastSavedChunks(chunks);
              }
              // Local state updates instantly to keep UI in sync
              savedChunksRef.current = chunks;
            }

            // Interval Alert Beep
            if (activeTaskId && isTaskIntervalAlertEnabled && taskIntervalAlertMins > 0 && remaining > 0) {
              const alertIntervalSecs = taskIntervalAlertMins * 60;

              if (
                alertedChunksRef.current === 0 || 
                lastIntervalAlertMinsRef.current !== taskIntervalAlertMins ||
                lastIsIntervalEnabledRef.current !== isTaskIntervalAlertEnabled ||
                remaining > alertedChunksRef.current + alertIntervalSecs + 5
              ) {
                // Initialize or handle timer time increases or interval changes
                let nextAlert = remaining - alertIntervalSecs;
                if (nextAlert === 0) nextAlert = -1; // Prevent beep precisely at 0 (timer end)
                
                alertedChunksRef.current = nextAlert;
                lastIntervalAlertMinsRef.current = taskIntervalAlertMins;
                lastIsIntervalEnabledRef.current = isTaskIntervalAlertEnabled;
                if (isOwner) {
                  setTimerLastAlertedChunks(nextAlert);
                }
              } else if (remaining <= alertedChunksRef.current) {
                // Crossed a boundary downwards!
                let nextAlert = remaining - alertIntervalSecs;
                if (nextAlert === 0) nextAlert = -1;
                
                alertedChunksRef.current = nextAlert;
                
                // Only the device that started it (owner) will ring, preventing background ghosts on other laptops
                if (isOwner) {
                  setTimerLastAlertedChunks(nextAlert);
                  if (enableAlarmSound || enableAlarmVibration) {
                    console.log(`[AUDIO DEBUG] Interval beep triggered. Next alert at ${nextAlert}s.`);
                    setIsIntervalRinging(true);
                    isIntervalRingingRef.current = true;
                    
                    if (enableAlarmSound && intervalAudioRef.current) {
                      const vol = alarmVolume !== undefined ? alarmVolume : 1;
                      intervalAudioRef.current.volume = (vol > 1 ? vol / 100 : vol) * 0.4; // Slightly lower volume for the interval beep
                      intervalAudioRef.current.currentTime = 0;
                      intervalAudioRef.current.play().catch(e => console.log('Interval beep failed:', e));
                    }
                    
                    if (enableAlarmVibration) {
                      if (typeof navigator !== 'undefined' && navigator.vibrate) {
                        try { navigator.vibrate([300, 200, 300, 200, 300]); } catch (e) {}
                      }
                    }

                    const duration = taskIntervalRingSecs ? taskIntervalRingSecs * 1000 : 1500;
                    setTimeout(() => {
                      if (intervalAudioRef.current) {
                        intervalAudioRef.current.pause();
                      }
                      setIsIntervalRinging(false);
                      isIntervalRingingRef.current = false;
                    }, duration);
                  }
                }
              }
            }
          }
        }

        const elapsedSinceInteraction = Math.floor((now - lastInteractionTime) / 1000);
        if (elapsedSinceInteraction >= 7200 && isOwner) {
          // Idle for 2 hours while running, auto pause! (Only owner evaluates this to avoid random cross-device pauses)
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
          
          if (isOwner) {
            setTimerEndAt(null);
            setTimerPausedLeft(null);
          }

          // Force stop any lingering interval beep
          if (intervalAudioRef.current) {
            intervalAudioRef.current.pause();
            intervalAudioRef.current.currentTime = 0;
          }
          setIsIntervalRinging(false);
          isIntervalRingingRef.current = false;

          if (isOwner && now - timerEndAt < 120000) {
            playAlarm();
          }

          // Log to history
          if (timerInitialMins && timerInitialMins > 0) {
            if (isOwner) {
              const today = getLocalDateString();
              // Calculate any remaining unsaved minutes for this session
              const savedMins = savedChunksRef.current * 5;
              const finalUnsavedMins = Math.max(0, timerInitialMins - savedMins);
              if (finalUnsavedMins > 0) {
                addMins(today, finalUnsavedMins);
                if (activeTaskId) {
                  updateTaskDuration(activeTaskId, finalUnsavedMins);
                }
              }
              setTimerLastSavedChunks(0);
              setTimerLastAlertedChunks(0);
              if (activeTaskId) {
                setActiveTask(null, null);
              }
              setTimerInitialMins(null);
            }
            savedChunksRef.current = 0;
          }

          // Show quote popup
          if (isOwner) {
            fetchQuote().then(q => showQuotePopup(q));
          }
        } else {
          setLocalTimeLeft(remaining);
        }
      }, 250); // High frequency check for smooth local UI update
    }

    return () => clearInterval(interval);
  }, [timerEndAt, timerInitialMins, timerLastSavedChunks, timerLastAlertedChunks, taskIntervalAlertMins, addMins, setTimerEndAt, setTimerPausedLeft, setTimerInitialMins, setTimerLastSavedChunks, setTimerLastAlertedChunks, showQuotePopup, activeTaskId, updateTaskDuration, setActiveTask, alarmSound, alarmVolume, enableAlarmSound, lastInteractionTime, isTaskIntervalAlertEnabled, taskIntervalRingSecs, timerDeviceId]);

  // Listen for timer triggers from other components
  useEffect(() => {
    if (timerTrigger) {
      const state = useDashboardStore.getState();
      if (timerTrigger.taskId && timerTrigger.taskId === state.activeTaskId) {
        if (state.timerPausedLeft !== null) {
          setTimerEndAt(Date.now() + state.timerPausedLeft * 1000);
          setTimerPausedLeft(null);
        }
        useDashboardStore.setState({ timerTrigger: null });
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
      useDashboardStore.setState({ timerTrigger: null });
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
    console.log('[AUDIO DEBUG] playAlarm triggered: Main timer finished.');
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

  const stopIntervalBeep = () => {
    if (intervalAudioRef.current) {
      intervalAudioRef.current.pause();
      intervalAudioRef.current.currentTime = 0;
    }
    setIsIntervalRinging(false);
    isIntervalRingingRef.current = false;
  };

  const startTimer = (seconds: number, isTask: boolean = false) => {
    if (!isTask) {
      saveAndClearActiveTaskTimer();
    }
    setTimerInitialMins(Math.round(seconds / 60));
    setTimerPausedLeft(null);
    setTimerEndAt(Date.now() + seconds * 1000);
    savedChunksRef.current = 0;
    setTimerLastSavedChunks(0);
    setTimerLastAlertedChunks(0);
    setTimerDeviceId(getDeviceId());
    stopAlarm();
    updateInteraction();

    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setTimeout(() => {
        useDashboardStore.setState({ isTimerOpen: false });
      }, 3000);
    }

    // Unlock audio for mobile browsers during this user interaction
    // We unlock silently by setting volume to 0. Real alarms will reset the volume before playing.
    if (audioRef.current && enableAlarmSound) {
      isUnlockingAudioRef.current = true;
      audioRef.current.volume = 0;
      audioRef.current.play().then(() => {
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
          isUnlockingAudioRef.current = false;
        }, 50); // Silent unlock
      }).catch(e => {
        console.log('Audio unlock failed:', e);
        isUnlockingAudioRef.current = false;
      });
    }

    if (intervalAudioRef.current && enableAlarmSound) {
      intervalAudioRef.current.volume = 0;
      intervalAudioRef.current.play().then(() => {
        setTimeout(() => {
          if (intervalAudioRef.current) {
            intervalAudioRef.current.pause();
            intervalAudioRef.current.currentTime = 0;
          }
        }, 50);
      }).catch(e => console.log('Interval Audio unlock failed:', e));
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
      stopIntervalBeep();

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
      setTimerDeviceId(getDeviceId());

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        scheduleNotification(newEndAt);
      }
    }
  };

  const resetTimer = () => {
    saveAndClearActiveTaskTimer();
    savedChunksRef.current = 0;
    setTimerEndAt(null);
    setTimerPausedLeft(null);
    setTimerInitialMins(null);
    setTimerDeviceId(null);
    stopAlarm();
    stopIntervalBeep();
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

  const elapsedSecs = timerInitialMins ? Math.max(0, (timerInitialMins * 60) - localTimeLeft) : 0;
  const doneMins = Math.floor(elapsedSecs / 60);

  return (
    <DraggableWidget id="timer">
      <div
        onPointerDown={updateInteraction}
        className={`relative pointer-events-auto select-none ${isTimerOpen || isAlarmPlaying || isIntervalRinging ? '' : 'hidden'}`}
      >
        <div className="w-64 rounded-3xl glass-panel border border-white/20 p-3 text-white flex flex-col gap-2 shadow-2xl">
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
                <div className="absolute right-1 top-1 mt-[20px] ml-[5px] -translate-y-1/2 flex flex-col gap-1.5">
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
                        setTimerDeviceId(getDeviceId());
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
          ) : isIntervalRinging ? (
            <button
              onClick={() => {
                if (intervalAudioRef.current) {
                  intervalAudioRef.current.pause();
                  intervalAudioRef.current.currentTime = 0;
                }
                setIsIntervalRinging(false);
                isIntervalRingingRef.current = false;
              }}
              className="w-full py-2 px-3 flex flex-col items-center justify-center gap-0.5 bg-sky-500/80 hover:bg-sky-500 rounded-xl transition-colors animate-pulse shadow-lg"
            >
              <span className="text-[10px] uppercase tracking-wider font-semibold text-sky-100/90">
                {taskIntervalAlertMins || 5}m Span ({doneMins >= 60 ? Math.floor(doneMins / 60) + "h " + (doneMins % 60) + "m" : doneMins + "m"} / {(timerInitialMins || 0) >= 60 ? Math.floor((timerInitialMins || 0) / 60) + "h " + ((timerInitialMins || 0) % 60) + "m" : (timerInitialMins || 0) + "m"})
              </span>
              <span className="text-base font-bold tracking-wide flex items-center gap-1 text-white">
                <Check size={18} strokeWidth={2.5} /> Okay
              </span>
            </button>
          ) : (
            <>
              {/* Controls */}
              {!isEditingTime && (timerEndAt || timerPausedLeft) && timerDeviceId === getDeviceId() && (
                <div className="flex justify-center gap-2">
                  <button
                    onClick={togglePause}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                    title={timerEndAt ? "Pause" : "Resume"}
                  >
                    {timerEndAt ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                  <button
                    onClick={resetTimer}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                    title="Stop Timer"
                  >
                    <Square size={20} className="fill-current" />
                  </button>
                </div>
              )}

              {/* Custom Input */}
              {!timerEndAt && !timerPausedLeft && localTimeLeft === 0 && !isEditingTime && (
                <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 group">
                      <span className="absolute -top-2 left-2 px-1 bg-black/60 backdrop-blur-md rounded-md text-[8px] font-bold tracking-widest text-white/50 uppercase pointer-events-none z-10 transition-colors group-hover:text-blue-300">Set Time</span>
                      <input
                        type="time"
                        className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-blue-500/50 rounded-lg px-2 py-1.5 text-sm outline-none transition-all placeholder:text-white/20 text-white/90 shadow-inner [color-scheme:dark]"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const timeValue = e.target.value;
                          if (!timeValue) return;
                          const [hours, minutes] = timeValue.split(':').map(Number);
                          const now = new Date();
                          const targetDate = new Date();
                          targetDate.setHours(hours, minutes, 0, 0);
                          if (targetDate < now) {
                            targetDate.setDate(targetDate.getDate() + 1);
                          }
                          const diffInMs = targetDate.getTime() - now.getTime();
                          const diffInMins = Math.floor(diffInMs / 1000 / 60);
                          setCustomMins(diffInMins);
                        }}
                      />
                    </div>

                    <span className="text-[9px] font-bold text-white/30 uppercase">or</span>

                    <div className="relative flex-1 group">
                      <span className="absolute -top-2 left-2 px-1 bg-black/60 backdrop-blur-md rounded-md text-[8px] font-bold tracking-widest text-white/50 uppercase pointer-events-none z-10 transition-colors group-hover:text-blue-300">Minutes</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={customMins}
                        onChange={(e) => setCustomMins(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCustomStart()}
                        className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-blue-500/50 rounded-lg px-2 py-1.5 text-sm text-center outline-none transition-all placeholder:text-white/20 text-white/90 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        min="1"
                      />
                    </div>

                    <button
                      onClick={handleCustomStart}
                      className="px-2.5 py-1.5 bg-blue-500/80 hover:bg-blue-500 rounded-lg text-white transition-all active:scale-95 shadow-md shrink-0 flex items-center justify-center border border-blue-400/30 hover:border-transparent"
                      title="Start custom timer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Hidden Audio Elements */}
          <audio
            ref={audioRef}
            src={resolvedAlarmUrl || alarmSound}
            loop
            preload="auto"
            onError={(e) => {
              useDashboardStore.getState().setAlarmSound('/ringtones/alarm.mp3');
            }}
            onPlay={(e) => {
              // Prevent Lively Wallpaper / Chromium from auto-resuming media on focus
              const isAlarmPlaying = useDashboardStore.getState().isAlarmPlaying;
              if (!isAlarmPlaying && !isUnlockingAudioRef.current) {
                console.log('[AUDIO DEBUG] Blocked auto-resume on MAIN alarm. isAlarmPlaying:', isAlarmPlaying, 'isUnlockingAudio:', isUnlockingAudioRef.current);
                e.currentTarget.pause();
                e.currentTarget.currentTime = 0;
              } else {
                console.log('[AUDIO DEBUG] Allowed MAIN alarm play. isAlarmPlaying:', isAlarmPlaying, 'isUnlockingAudio:', isUnlockingAudioRef.current);
              }
            }}
          />
          <audio
            ref={intervalAudioRef}
            src={resolvedAlarmUrl || alarmSound}
            preload="auto"
            onError={(e) => {
              useDashboardStore.getState().setAlarmSound('/ringtones/alarm.mp3');
            }}
            onPlay={(e) => {
              if (!isIntervalRingingRef.current && !isUnlockingAudioRef.current) {
                console.log('[AUDIO DEBUG] Blocked auto-resume on INTERVAL beep. isIntervalRinging:', isIntervalRingingRef.current, 'isUnlockingAudio:', isUnlockingAudioRef.current);
                e.currentTarget.pause();
                e.currentTarget.currentTime = 0;
              } else {
                console.log('[AUDIO DEBUG] Allowed INTERVAL beep play. isIntervalRinging:', isIntervalRingingRef.current, 'isUnlockingAudio:', isUnlockingAudioRef.current);
              }
            }}
          />
        </div>
      </div>
    </DraggableWidget>
  );
}
