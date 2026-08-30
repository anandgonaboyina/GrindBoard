'use client';
import { useState, useEffect, useRef } from 'react';
import { useAudioUrl } from '@/hooks/useAudioUrl';
import { useDashboardStore } from '@/store/dashboardStore';
import { Play, Pause, Square, History, Trash2, ChevronLeft, Check, BellRing } from 'lucide-react';
import DraggableWidget from './DraggableWidget';
import ConfirmationModal from './ConfirmationModal';
import { getLocalDateString } from '@/utils/date';
import { getDeviceId } from '@/utils/deviceId';
import Tooltip from './Tooltip';

export default function Stopwatch() {
  const {
    isStopwatchOpen, stopwatchStartTime, setStopwatchStartTime, stopwatchLastSavedChunks, setStopwatchLastSavedChunks,
    addMins, stopwatchAddToStats, setStopwatchAddToStats, stopwatchDeviceId, setStopwatchDeviceId,
    isStopwatchIntervalEnabled, setIsStopwatchIntervalEnabled, stopwatchIntervalMins, setStopwatchIntervalMins,
    enableAlarmSound, enableAlarmVibration, alarmSound, alarmVolume, taskIntervalRingSecs
  } = useDashboardStore();

  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);
  const [isIntervalRinging, setIsIntervalRinging] = useState(false);
  const [isUnlockingAudio, setIsUnlockingAudio] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  const intervalAudioRef = useRef<HTMLAudioElement | null>(null);
  const resolvedAlarmUrl = useAudioUrl(alarmSound);
  const stopwatchAlertedChunksRef = useRef<number>(0);
  const lastTickTimeRef = useRef<number>(Date.now());
  const systemWakeTimeRef = useRef<number>(0);
  const isSettingsOpen = useDashboardStore((state) => state.isSettingsOpen);

  // Window Focus / Visibility Change Cleanup: Ensure no stray audio plays when laptop wakes up from sleep
  useEffect(() => {
    const handleSleepWakeCleanup = () => {
      systemWakeTimeRef.current = Date.now();
      const isAlarm = useDashboardStore.getState().isAlarmPlaying;
      if (!isAlarm) {
        if (intervalAudioRef.current) {
          intervalAudioRef.current.pause();
          intervalAudioRef.current.currentTime = 0;
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleSleepWakeCleanup);
      document.addEventListener('visibilitychange', handleSleepWakeCleanup);
      return () => {
        window.removeEventListener('focus', handleSleepWakeCleanup);
        document.removeEventListener('visibilitychange', handleSleepWakeCleanup);
      };
    }
  }, []);

  // Forcibly stop audio when settings modal is opened
  useEffect(() => {
    if (isSettingsOpen) {
      if (intervalAudioRef.current) {
        intervalAudioRef.current.pause();
        intervalAudioRef.current.currentTime = 0;
      }
    }
  }, [isSettingsOpen]);

  // Handle Interval Audio playback reacting to isIntervalRinging state
  useEffect(() => {
    if (intervalAudioRef.current) {
      if (isIntervalRinging && enableAlarmSound) {
        intervalAudioRef.current.muted = false;
        const vol = alarmVolume !== undefined ? alarmVolume : 1;
        intervalAudioRef.current.volume = (vol > 1 ? vol / 100 : vol) * 0.4;
        intervalAudioRef.current.currentTime = 0;
        console.log('[AUDIO DEBUG] Playing stopwatch interval audio via useEffect...');
        intervalAudioRef.current.play().then(() => console.log('[AUDIO DEBUG] Stopwatch interval audio play success')).catch(e => console.error('[AUDIO DEBUG] Stopwatch interval beep failed:', e));
        if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
          try { navigator.mediaSession.playbackState = 'playing'; } catch (e) {}
        }
      } else {
        try {
          intervalAudioRef.current.pause();
          intervalAudioRef.current.currentTime = 0;
          intervalAudioRef.current.removeAttribute('src');
          intervalAudioRef.current.load();
        } catch (e) {}
        if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
          try { navigator.mediaSession.playbackState = 'none'; } catch (e) {}
        }
      }
    }
  }, [isIntervalRinging, enableAlarmSound, alarmVolume, resolvedAlarmUrl, alarmSound]);

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
      const isOwner = stopwatchDeviceId === getDeviceId();

      if (timeSinceActive >= 7200 && isOwner) {
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
        setStopwatchDeviceId(null);
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
      lastTickTimeRef.current = Date.now();
      interval = setInterval(() => {
        const now = Date.now();
        const gap = now - (lastTickTimeRef.current || now);
        lastTickTimeRef.current = now;
        const wasSleeping = gap > 3000;
        const systemJustWoke = wasSleeping;

        const stored = typeof window !== 'undefined' ? localStorage.getItem('stopwatch_last_active') : null;
        const lastActive = stored ? parseInt(stored) : now;
        const timeSinceActive = Math.floor((now - lastActive) / 1000);
        const isOwner = stopwatchDeviceId === getDeviceId();

        if (timeSinceActive >= 7200 && isOwner) {
          setIsRunning(false);
          if (!systemJustWoke && now - (lastActive + 7200000) < 120000) {
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
          setStopwatchDeviceId(null);
          setElapsedSecs(cappedElapsed);
          return;
        }

        const currentElapsed = Math.max(0, Math.floor((now - stopwatchStartTime) / 1000));
        setElapsedSecs(currentElapsed);

        if (systemJustWoke) {
          // If system slept or just woke up, sync interval alerted chunks without ringing audio
          if (isStopwatchIntervalEnabled && stopwatchIntervalMins > 0) {
            const alertIntervalSecs = stopwatchIntervalMins * 60;
            stopwatchAlertedChunksRef.current = Math.floor(currentElapsed / alertIntervalSecs);
          }
          return;
        }

        if (stopwatchAddToStats && isOwner) {
          const chunks = Math.floor(currentElapsed / 300); // 5 minutes = 300 seconds
          if (chunks > stopwatchLastSavedChunks) {
            const diff = chunks - stopwatchLastSavedChunks;
            const minsToSave = diff * 5;
            const today = getLocalDateString();
            addMins(today, minsToSave);
            setStopwatchLastSavedChunks(chunks);
          }
        }

        if (isStopwatchIntervalEnabled && stopwatchIntervalMins > 0 && currentElapsed > 0) {
          const alertIntervalSecs = stopwatchIntervalMins * 60;
          const chunks = Math.floor(currentElapsed / alertIntervalSecs);
          if (chunks > stopwatchAlertedChunksRef.current) {
            stopwatchAlertedChunksRef.current = chunks;
            if (isOwner) {
              if (enableAlarmSound || enableAlarmVibration) {
                setIsIntervalRinging(true);
                useDashboardStore.setState({ isStopwatchOpen: true });
                if (enableAlarmVibration && typeof navigator !== 'undefined' && navigator.vibrate) {
                  try { navigator.vibrate([300, 200, 300, 200, 300]); } catch (e) { }
                }
                const duration = taskIntervalRingSecs ? taskIntervalRingSecs * 1000 : 1500;
                setTimeout(() => {
                  setIsIntervalRinging(false);
                }, duration);
              }
            }
          }
        }
      }, 250);
    }
    return () => clearInterval(interval);
  }, [isRunning, stopwatchStartTime, stopwatchAddToStats, stopwatchLastSavedChunks, isStopwatchIntervalEnabled, stopwatchIntervalMins, enableAlarmSound, enableAlarmVibration, alarmVolume, taskIntervalRingSecs]);

  const handleStart = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isRunning) {
      if (elapsedSecs === 0) {
        setStopwatchLastSavedChunks(0);
        stopwatchAlertedChunksRef.current = 0;
      }
      setStopwatchStartTime(Date.now() - elapsedSecs * 1000);
      setStopwatchDeviceId(getDeviceId());
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

      // Unlock audio using Web Audio API (does NOT create/register HTMLMediaElements with OS MediaSession)
      if (enableAlarmSound && typeof window !== 'undefined') {
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            if (ctx.state === 'suspended') ctx.resume();
            const buffer = ctx.createBuffer(1, 1, 22050);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start(0);
          }
        } catch (e) {
          console.log('Stopwatch Web Audio unlock:', e);
        }
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
    if (!stopwatchAddToStats && elapsedSecs >= 300) {
      setConfirmModal({
        isOpen: true,
        title: 'Discard Session?',
        message: 'You have chosen not to add this session to your stats. The recorded time will be discarded permanently.',
        isDestructive: true,
        onConfirm: () => {
          finalizeStop(false);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else {
      finalizeStop(stopwatchAddToStats);
    }
  };

  const finalizeStop = (saveToStats: boolean) => {
    const isOwner = stopwatchDeviceId === getDeviceId();
    // Only save partial final minutes if the total elapsed time is >= 5 minutes (300 secs)
    if (elapsedSecs >= 300 && saveToStats && isOwner) {
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
    setStopwatchDeviceId(null);
    setStopwatchLastSavedChunks(0);
    stopwatchAlertedChunksRef.current = 0;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('stopwatch_paused_secs');
      localStorage.removeItem('stopwatch_last_active');
    }
    if (intervalAudioRef.current) {
      intervalAudioRef.current.pause();
      intervalAudioRef.current.currentTime = 0;
    }
    setIsIntervalRinging(false);
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

        <div className="w-48 rounded-3xl glass-panel border border-white/20 text-white flex flex-col min-h-[90px] overflow-hidden relative">
          {/* Header Title Bar (Flex Sibling) */}
          <div
            className="pt-1 px-3 pb-1 flex justify-center items-center w-full border-b border-white/10 bg-black/40"
            onPointerDown={updateInteraction}
          >
            <span
              className="px-2 py-0.5 rounded-md text-[10px] sm:text-[10.5px] font-bold tracking-wider text-blue-400 uppercase max-w-full text-center flex items-center justify-center gap-1.5 whitespace-normal break-words leading-tight"
            >
              <span className="font-black text-blue-400 uppercase tracking-widest">Stopwatch</span>
            </span>
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
                      setStopwatchDeviceId(getDeviceId());
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
                    <Tooltip text="Start Stopwatch" position="top">
                      <button
                        onClick={handleStart}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg transition-all hover:scale-105 active:scale-95"
                      >
                        <Play fill="currentColor" size={14} className="ml-0.5" />
                      </button>
                    </Tooltip>
                  ) : (
                    <Tooltip text="Pause Stopwatch" position="top">
                      <button
                        onClick={handlePause}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg transition-all hover:scale-105 active:scale-95"
                      >
                        <Pause fill="currentColor" size={14} />
                      </button>
                    </Tooltip>
                  )}
                  <Tooltip text="Stop & Save" position="top">
                    <button
                      onClick={handleStop}
                      disabled={elapsedSecs === 0}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                    >
                      <Square fill="currentColor" size={12} />
                    </button>
                  </Tooltip>
                </div>

                <div className="flex items-center justify-start gap-1 pt-1 border-t border-white/5 w-full">
                  <div className="flex items-center gap-1 cursor-pointer" onClick={() => setIsStopwatchIntervalEnabled(!isStopwatchIntervalEnabled)}>
                    <BellRing size={12} className={isStopwatchIntervalEnabled ? "text-sky-300" : "text-white/40"} />
                    <span className="text-[9px] font-medium text-white/70">Interval</span>
                    <button
                      className={`relative inline-flex h-3 w-5 items-center rounded-full transition-colors shrink-0 ml-0.5 ${isStopwatchIntervalEnabled ? 'bg-sky-500' : 'bg-white/20'}`}
                    >
                      <span className={`inline-block h-2 w-2 transform rounded-full bg-white transition-transform ${isStopwatchIntervalEnabled ? 'translate-x-2.5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  {isStopwatchIntervalEnabled ? (
                    <div className="flex items-center gap-1 pl-1.5 ml-0.5 border-l border-white/10">
                      <input
                        type="number"
                        value={stopwatchIntervalMins || ''}
                        onChange={(e) => {
                          if (e.target.value === '') {
                            setStopwatchIntervalMins(0);
                          } else {
                            const parsed = parseInt(e.target.value);
                            if (!isNaN(parsed) && parsed >= 0) {
                              setStopwatchIntervalMins(parsed);
                            }
                          }
                        }}
                        className="w-7 bg-black/40 border border-white/20 rounded px-1 py-0.5 text-[9px] text-center font-bold text-sky-300 outline-none focus:border-sky-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
                        min="1"
                      />
                      <span className="text-[8px] font-bold text-white/40">min</span>
                    </div>
                  ) : (
                    <div className="flex items-center pl-1.5 ml-0.5 border-l border-white/10">
                      <span className="text-[8px] font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-1.5 py-0.5 rounded-md shadow-sm">Beep alert off</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {isIntervalRinging && (
            <audio
              ref={intervalAudioRef}
              src={resolvedAlarmUrl || (alarmSound?.startsWith('custom-audio-') ? undefined : alarmSound) || '/ringtones/narutoBGM.mp3'}
              preload="none"
              onError={(e) => {
                console.log('Stopwatch interval alarm audio failed to load:', e);
                const target = e.currentTarget as HTMLAudioElement;
                if (!target.src.endsWith('/ringtones/narutoBGM.mp3')) {
                  target.src = '/ringtones/narutoBGM.mp3';
                }
              }}
            />
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        isDestructive={confirmModal.isDestructive}
        confirmText="Discard Session"
      />
    </DraggableWidget>
  );
}
