'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAudioUrl } from '@/hooks';
import { useDashboardStore } from '@/store/dashboardStore';
import { Play, Pause, Square, Trash2, Check, BellRing, ChevronUp, ChevronDown, X } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { getLocalDateString } from '@/utils/date';
import { getDeviceId } from '@/utils/deviceId';
import Tooltip from './Tooltip';
import { checkTimerStillActiveInDB, triggerInstantSave, pushStreakToDB, forcePushTimerState } from '@/store/dashboardStore/sync';

const haltAudio = (audioEl: HTMLAudioElement | null) => {
  if (!audioEl) return;
  try { audioEl.pause(); audioEl.currentTime = 0; audioEl.removeAttribute('src'); audioEl.load(); } catch (e) {}
  if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
    try { navigator.mediaSession.playbackState = 'none'; } catch (e) {} 
  }
};

// ----------------------------------------------------------------------------------
//  THE ULTIMATE ATOMIC LOCK (Placed OUTSIDE React to prevent duplicate-mount bugs)
// ----------------------------------------------------------------------------------

const processStopwatchChunks = (currentElapsedSecs: number, forceFinalize: boolean = false) => {
  if (typeof window === 'undefined') return;
  
  const storeState = useDashboardStore.getState();
  if (!storeState.stopwatchAddToStats || storeState.stopwatchDeviceId !== getDeviceId()) return;

  const totalMinsToSave = forceFinalize 
    ? Math.floor(currentElapsedSecs / 60)         
    : Math.floor(currentElapsedSecs / 300) * 5;   

  const latestSavedChunks = storeState.stopwatchLastSavedChunks || 0;
  const savedMinsSoFar = latestSavedChunks * 5;
  
  const diffMins = totalMinsToSave - savedMinsSoFar;

  if (diffMins > 0) {
    // 1. Instantly lock the new total chunks
    storeState.setStopwatchLastSavedChunks(totalMinsToSave / 5);
    
    // DEV PROOF: Check your console! It will prove the stopwatch is only sending 5.
    console.log(` STOPWATCH EXTRACTED: Exactly ${diffMins} minutes.`);

    // 2. THE DUAL-WRITE FIX 
    // We only call addMins. If your store's addMins already updates the DB/Queue, 
    // calling pushStreakToDB here was creating the instant '10'.
    storeState.addMins(getLocalDateString(), diffMins);
    
    // pushStreakToDB(getLocalDateString(), diffMins); // <-- REMOVED TO PREVENT DOUBLE COUNT
    
    forcePushTimerState();
  }
};


export default function Stopwatch() {
  const store = useDashboardStore();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [pausedAtString, setPausedAtString] = useState<string>('');
  const [isIntervalRinging, setIsIntervalRinging] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: React.ReactNode; isDestructive?: boolean; onConfirm: () => void; }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [showStillWorkingPrompt, setShowStillWorkingPrompt] = useState(false);

  const intervalAudioRef = useRef<HTMLAudioElement | null>(null);
  const resolvedAlarmUrl = useAudioUrl(store.alarmSound);
  const stopwatchAlertedChunksRef = useRef<number>(0);
  const lastTickTimeRef = useRef<number>(Date.now());
  const deadmanTriggeredAtRef = useRef<number | null>(null);
  const deadmanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const stopIntervalBeep = () => {
    haltAudio(intervalAudioRef.current);
    setIsIntervalRinging(false);
  };

  useEffect(() => {
    const handleSleepWakeCleanup = () => { if (!useDashboardStore.getState().isAlarmPlaying) haltAudio(intervalAudioRef.current); };
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleSleepWakeCleanup); document.addEventListener('visibilitychange', handleSleepWakeCleanup);
      return () => { window.removeEventListener('focus', handleSleepWakeCleanup); document.removeEventListener('visibilitychange', handleSleepWakeCleanup); };
    }
  }, []);

  useEffect(() => { if (store.isSettingsOpen) haltAudio(intervalAudioRef.current); }, [store.isSettingsOpen]);

  useEffect(() => {
    if (intervalAudioRef.current) {
      if (isIntervalRinging && store.enableAlarmSound) {
        intervalAudioRef.current.muted = false;
        intervalAudioRef.current.volume = ((store.alarmVolume || 1) > 1 ? (store.alarmVolume || 1) / 100 : (store.alarmVolume || 1)) * 0.4;
        intervalAudioRef.current.currentTime = 0;
        intervalAudioRef.current.play().catch(error => { if (error.name !== 'NotAllowedError') console.warn("Audio playback issue:", error); });
        if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) try { navigator.mediaSession.playbackState = 'playing'; } catch (e) {}
      } else haltAudio(intervalAudioRef.current);
    }
  }, [isIntervalRinging, store.enableAlarmSound, store.alarmVolume, resolvedAlarmUrl, store.alarmSound]);

  const updateInteraction = () => { if (typeof window !== 'undefined') localStorage.setItem('stopwatch_last_active', Date.now().toString()); };

useEffect(() => {
  const pausedSecs = typeof window !== 'undefined' ? localStorage.getItem('stopwatch_paused_secs') : null;
  if (store.stopwatchStartTime) {
    setIsRunning(true); 
    setElapsedSecs(Math.max(0, Math.floor((Date.now() - store.stopwatchStartTime) / 1000)));
  } else if (pausedSecs) {
    setIsRunning(false); 
    setElapsedSecs(Math.max(0, parseInt(pausedSecs)));
  } else {
    setIsRunning(false); 
    setElapsedSecs(0);
  }
}, [store.stopwatchStartTime]);

// Main Tick Interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && store.stopwatchStartTime) {
      lastTickTimeRef.current = Date.now();
      interval = setInterval(() => {
        const now = Date.now();
        const systemJustWoke = (now - (lastTickTimeRef.current || now)) > 3000;
        lastTickTimeRef.current = now;
        const isOwner = store.stopwatchDeviceId === getDeviceId();
        const currentElapsed = Math.max(0, Math.floor((now - store.stopwatchStartTime!) / 1000));

        setElapsedSecs(currentElapsed);
        
        // Removed the 3600-second 1-hour auto-pause logic completely!

        if (systemJustWoke) {
          if (store.isStopwatchIntervalEnabled && store.stopwatchIntervalMins > 0) stopwatchAlertedChunksRef.current = Math.floor(currentElapsed / (store.stopwatchIntervalMins * 60));
          return;
        }

        // 3-Hour Deadman Switch
        if (isOwner && deadmanTriggeredAtRef.current !== -1 && currentElapsed >= 180 * 60) {
          deadmanTriggeredAtRef.current = now;
          setShowStillWorkingPrompt(true);
          if (intervalAudioRef.current && store.enableAlarmSound) {
            intervalAudioRef.current.currentTime = 0;
            intervalAudioRef.current.play().catch(() => {});
          }
          deadmanTimeoutRef.current = setTimeout(() => {
            const currentSt = useDashboardStore.getState();
            if (currentSt.stopwatchAddToStats) {
              processStopwatchChunks(180 * 60, true);
            }
            currentSt.setStopwatchStartTime(null);
            currentSt.setStopwatchDeviceId(null);
            setIsRunning(false);
            setElapsedSecs(180 * 60);
            setShowStillWorkingPrompt(false);
            deadmanTriggeredAtRef.current = null;
            haltAudio(intervalAudioRef.current);
          }, 5 * 60 * 1000);
          return;
        }

        // Ignore tick if Deadman Switch is visible but not bypassed
        if (deadmanTriggeredAtRef.current && deadmanTriggeredAtRef.current !== -1) return;

        // Standard 5-minute background save processing
        if (store.stopwatchAddToStats && isOwner) {
          processStopwatchChunks(currentElapsed, false);
        }

        // Standard Interval Ringing logic
        if (store.isStopwatchIntervalEnabled && store.stopwatchIntervalMins > 0 && currentElapsed > 0) {
          const chunks = Math.floor(currentElapsed / (store.stopwatchIntervalMins * 60));
          if (chunks > stopwatchAlertedChunksRef.current) {
            stopwatchAlertedChunksRef.current = chunks;
            if (isOwner && (store.enableAlarmSound || store.enableAlarmVibration)) {
              setIsIntervalRinging(true); useDashboardStore.setState({ isStopwatchOpen: true });
              if (store.enableAlarmVibration && typeof navigator !== 'undefined' && navigator.vibrate) try { navigator.vibrate([300, 200, 300, 200, 300]); } catch (e) {}
              setTimeout(() => setIsIntervalRinging(false), (store.taskIntervalRingSecs || 1.5) * 1000);
            }
          }
        }
      }, 250);
    }
    return () => clearInterval(interval);
  }, [isRunning, store.stopwatchStartTime, store.stopwatchAddToStats, store.isStopwatchIntervalEnabled, store.stopwatchIntervalMins, store.enableAlarmSound, store.enableAlarmVibration, store.alarmVolume, store.taskIntervalRingSecs]);
  // Cross-device stopwatch sync
  useEffect(() => {
    if (!isRunning || !store.stopwatchStartTime) return;
    const isOwner = store.stopwatchDeviceId === getDeviceId();
    if (!isOwner) return;

    const elapsedMs = Date.now() - store.stopwatchStartTime;
    const FIVE_MINS_MS = 5 * 60 * 1000;
    const initialDelay = Math.max(0, FIVE_MINS_MS - elapsedMs);

    let pollInterval: NodeJS.Timeout | null = null;

    const startPolling = () => {
      pollInterval = setInterval(async () => {
        const st = useDashboardStore.getState();
        if (!st.stopwatchStartTime) {
          if (pollInterval) clearInterval(pollInterval);
          return;
        }

        const status = await checkTimerStillActiveInDB('stopwatch');
        if (status === 'stopped') {
          if (pollInterval) clearInterval(pollInterval);
          const currentSt = useDashboardStore.getState();
          
          if (currentSt.stopwatchStartTime && currentSt.stopwatchAddToStats) {
            const elapsed = Math.max(0, Math.floor((Date.now() - currentSt.stopwatchStartTime) / 1000));
            processStopwatchChunks(elapsed, true);
          }
          
          setIsRunning(false);
          store.setStopwatchStartTime(null);
          store.setStopwatchDeviceId(null);
          setShowContinuePrompt(true);
          setPausedAtString('another device');
        }
      }, 60 * 1000);
    };

    const delayTimeout = setTimeout(startPolling, initialDelay);
    return () => {
      clearTimeout(delayTimeout);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isRunning, store.stopwatchStartTime, store.stopwatchDeviceId]);

const handleStart = (e?: React.MouseEvent) => {
  e?.stopPropagation();
  if (!isRunning) {
    if (elapsedSecs === 0) { 
      store.setStopwatchLastSavedChunks(0); 
      stopwatchAlertedChunksRef.current = 0; 
    }
    

    if (deadmanTriggeredAtRef) deadmanTriggeredAtRef.current = null;

    store.setStopwatchStartTime(Date.now() - elapsedSecs * 1000); store.setStopwatchDeviceId(getDeviceId()); setIsRunning(true);
    if (typeof window !== 'undefined') localStorage.removeItem('stopwatch_paused_secs');
    updateInteraction();
    if (typeof window !== 'undefined' && window.innerWidth < 768) setTimeout(() => useDashboardStore.setState({ isStopwatchOpen: false }), 3000);

    if (store.enableAlarmSound && typeof window !== 'undefined') {
      try { const AudioCtx = window.AudioContext || (window as any).webkitAudioContext; if (AudioCtx) { const ctx = new AudioCtx(); if (ctx.state === 'suspended') ctx.resume(); ctx.createBufferSource().start(0); } } catch (e) {}
    }
  }
};

  const handlePause = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isRunning) {
      setIsRunning(false); store.setStopwatchStartTime(null);
      if (typeof window !== 'undefined') localStorage.setItem('stopwatch_paused_secs', elapsedSecs.toString());
    }
  };

  const handleStop = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!store.stopwatchAddToStats && elapsedSecs >= 300) {
      setConfirmModal({ isOpen: true, title: 'Discard Session?', message: 'You have chosen not to add this session to your stats. The recorded time will be discarded permanently.', isDestructive: true, onConfirm: () => { finalizeStop(false); setConfirmModal(prev => ({ ...prev, isOpen: false })); } });
    } else finalizeStop(store.stopwatchAddToStats);
  };

const finalizeStop = (saveToStats: boolean) => {
  const currentSt = useDashboardStore.getState(); 
  
  const liveElapsedSecs = currentSt.stopwatchStartTime 
    ? Math.max(0, Math.floor((Date.now() - currentSt.stopwatchStartTime) / 1000)) 
    : elapsedSecs;

  if (liveElapsedSecs >= 300 && saveToStats && currentSt.stopwatchDeviceId === getDeviceId()) {
    processStopwatchChunks(liveElapsedSecs, true);
  }
  
  setIsRunning(false); setElapsedSecs(0); 
  currentSt.setStopwatchStartTime(null); 
  currentSt.setStopwatchDeviceId(null); 
  currentSt.setStopwatchLastSavedChunks(0); 
  stopwatchAlertedChunksRef.current = 0;
  if (typeof setShowStillWorkingPrompt === 'function') setShowStillWorkingPrompt(false);
  if (deadmanTimeoutRef && deadmanTimeoutRef.current) { clearTimeout(deadmanTimeoutRef.current); deadmanTimeoutRef.current = null; }
  if (deadmanTriggeredAtRef) deadmanTriggeredAtRef.current = null;
  
  if (typeof window !== 'undefined') { 
    localStorage.removeItem('stopwatch_paused_secs'); 
    localStorage.removeItem('stopwatch_last_active'); 
    localStorage.removeItem('stopwatch_tainted'); 
  }
  haltAudio(intervalAudioRef.current); setIsIntervalRinging(false); 
  
  forcePushTimerState(); 
};

const toggleStatsCheckbox = (e: React.MouseEvent) => {
  e.stopPropagation();
  store.setStopwatchAddToStats(!store.stopwatchAddToStats);
};

  const formatTime = (secs: number) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return secs >= 3600 ? `${pad(Math.floor(secs/3600))}:${pad(Math.floor((secs%3600)/60))}:${pad(secs%60)}` : `${pad(Math.floor(secs/60))}:${pad(secs%60)}`;
  };

  return (
    <div className={`relative pointer-events-auto select-none ${store.isStopwatchOpen ? '' : 'hidden'}`}>
      <div className="w-48 rounded-3xl glass-panel border border-white/20 text-white flex flex-col min-h-[90px] overflow-hidden relative shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        
        <div className="pt-1 pb-1 flex justify-center items-center w-full border-b border-white/10 bg-black/40" onPointerDown={updateInteraction}>
          <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-[10.5px] font-black tracking-widest text-blue-400 uppercase text-center flex items-center justify-center">
            Stopwatch
          </span>
        </div>

        <div className="p-3 flex flex-col gap-1 cursor-default" onPointerDown={(e) => { e.stopPropagation(); updateInteraction(); }}>
          
          {showContinuePrompt ? (
            <div className="flex flex-col items-center gap-2 w-full py-1">
              <p className="text-[10px] font-semibold text-amber-300">Session paused (Away)</p>
              <div className="flex gap-2 w-full">
                <button onClick={(e) => { e.stopPropagation(); useDashboardStore.getState().setIsAlarmPlaying(false); setShowResumeModal(true); }} className="flex-1 py-1 bg-amber-500 hover:bg-amber-600 rounded-lg text-[9px] font-bold transition-colors">I was away</button>
                <button onClick={(e) => { e.stopPropagation(); setShowContinuePrompt(false); useDashboardStore.getState().setIsAlarmPlaying(false); }} className="flex-1 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[9px] font-bold transition-colors">Stop</button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center flex flex-col items-center justify-center">
                <div className={`text-4xl font-light tracking-tighter tabular-nums drop-shadow-md transition-opacity ${isRunning ? 'opacity-100' : 'opacity-90'}`}>
                  {formatTime(elapsedSecs)}
                </div>
              </div>

              <div className="flex items-center justify-center gap-1.5 cursor-pointer opacity-70 hover:opacity-100 transition-opacity my-0.5" onClick={toggleStatsCheckbox}>
                <div className={`w-3 h-3 rounded-[3px] border flex items-center justify-center transition-colors ${store.stopwatchAddToStats ? 'bg-blue-500 border-blue-400' : 'border-white/40'}`}>
                  {store.stopwatchAddToStats && <Check size={8} className="text-white" strokeWidth={3} />}
                </div>
                <span className="text-[8px] uppercase tracking-wider font-bold">Add to Today's Focus</span>
              </div>

              {isIntervalRinging ? (
                <button onClick={stopIntervalBeep} className="w-full h-8 flex flex-row items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 rounded-xl animate-pulse shadow-lg active:scale-95 border border-sky-300/40">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-sky-100/90">{store.stopwatchIntervalMins || 5}m</span>
                  <span className="text-sm font-bold tracking-wide flex items-center gap-1 text-white"><Check size={16} strokeWidth={2.5} /> Okay</span>
                </button>
              ) : (
                <div className="flex justify-center items-center gap-2">
                  {!isRunning ? (
                    <Tooltip text="Start Stopwatch" position="top">
                      <button onClick={handleStart} className="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg transition-all hover:scale-105 active:scale-95">
                        <Play fill="currentColor" size={14} className="ml-0.5" />
                      </button>
                    </Tooltip>
                  ) : (
                    <Tooltip text="Pause Stopwatch" position="top">
                      <button onClick={handlePause} className="w-8 h-8 flex items-center justify-center rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg transition-all hover:scale-105 active:scale-95">
                        <Pause fill="currentColor" size={14} />
                      </button>
                    </Tooltip>
                  )}
                  <Tooltip text="Stop & Save" position="top">
                    <button onClick={handleStop} disabled={elapsedSecs === 0} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed">
                      <Square fill="currentColor" size={12} />
                    </button>
                  </Tooltip>
                </div>
              )}

              <div className="flex items-center justify-between gap-1 mt-0.5 pt-1 pb-1 px-3 -mx-3 -mb-3 bg-black/40 border-t border-white/10 w-[calc(100%+1.5rem)]">
                <div className="flex items-center gap-1 cursor-pointer" onClick={() => store.setIsStopwatchIntervalEnabled(!store.isStopwatchIntervalEnabled)}>
                  <BellRing size={12} className={store.isStopwatchIntervalEnabled ? "text-sky-400" : "text-white/40"} />
                  <span className="text-[10px] font-bold text-white/70 tracking-wide">Interval</span>
                  <button className={`relative inline-flex h-3.5 w-6 items-center rounded-full transition-colors ml-1 ${store.isStopwatchIntervalEnabled ? 'bg-sky-500' : 'bg-white/20'}`}>
                    <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${store.isStopwatchIntervalEnabled ? 'translate-x-3' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                {store.isStopwatchIntervalEnabled ? (
                  <div className="flex items-center gap-1">
                    <input 
                        type="number" 
                        value={store.stopwatchIntervalMins || ''} 
                        onChange={e => store.setStopwatchIntervalMins(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0))} 
                        className="w-8 bg-black/50 border border-white/20 rounded px-1 py-0.5 text-[12px] text-center font-bold text-sky-300 outline-none focus:border-sky-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner" 
                        min="1" 
                      />
                  </div>
                ) : <span className="text-[9px] font-bold text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wide">Beep Off</span>}
              </div>
            </>
          )}
        </div>

        {isIntervalRinging && (
          <audio ref={intervalAudioRef} src={resolvedAlarmUrl || (store.alarmSound?.startsWith('custom-audio-') ? undefined : store.alarmSound) || '/ringtones/narutoBGM.mp3'} preload="none" onError={(e) => { const t = e.currentTarget as HTMLAudioElement; if (!t.src.endsWith('/ringtones/narutoBGM.mp3')) t.src = '/ringtones/narutoBGM.mp3'; }} />
        )}
      </div>

      <ConfirmationModal
        isOpen={showResumeModal}
        onClose={() => setShowResumeModal(false)}
        title="Resume Session"
        message={<div className="flex flex-col gap-2"><p className="text-white/80">You were away for an extended period of time.</p><p className="text-white">Your session was automatically paused precisely at <strong className="text-blue-300">({pausedAtString || 'your last active time'})</strong>, so <strong className="text-amber-400 font-bold">no extra focus hours were added</strong> while you were gone.</p><p className="text-white/80 mt-2">Do you want to continue your session from exactly where you left off?</p></div>}
        confirmText="Yes, Continue" cancelText="Cancel"
        onConfirm={() => { setShowContinuePrompt(false); setShowResumeModal(false); if (typeof window !== 'undefined') localStorage.removeItem('stopwatch_paused_secs'); updateInteraction(); store.setStopwatchStartTime(Date.now() - elapsedSecs * 1000); store.setStopwatchDeviceId(getDeviceId()); setIsRunning(true); }}
      />
      <ConfirmationModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} isDestructive={confirmModal.isDestructive} confirmText="Discard Session" />

      {/* 3-Hour Deadman Switch: "Are you still working?" */}
      {showStillWorkingPrompt && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-amber-500/40 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">⏳</div>
              <h3 className="text-white font-bold text-lg">Are you still working?</h3>
              <p className="text-white/60 text-sm mt-1">Your stopwatch has been running for <strong className="text-amber-400">3 hours</strong>. Just checking in!</p>
              <p className="text-white/40 text-xs mt-2">Auto-stops in 5 minutes if no response.</p>
            </div>
            <button
              onClick={() => {
                if (deadmanTimeoutRef.current) { clearTimeout(deadmanTimeoutRef.current); deadmanTimeoutRef.current = null; }
                deadmanTriggeredAtRef.current = -1;
                setShowStillWorkingPrompt(false);
                haltAudio(intervalAudioRef.current);
              }}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all active:scale-95 text-sm"
            >
              ✅ Yes, I&apos;m here — Keep going!
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}