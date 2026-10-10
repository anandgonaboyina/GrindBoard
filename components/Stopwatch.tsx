'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAudioUrl } from '@/hooks';
import { useDashboardStore } from '@/store/dashboardStore';
import { Play, Pause, Square, Check, BellRing, Flame, Coffee } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { getLocalDateString } from '@/utils/date';
import { getDeviceId } from '@/utils/deviceId';
import Tooltip from './Tooltip';
import { forcePushTimerState } from '@/store/dashboardStore/sync';

const haltAudio = (audioEl: HTMLAudioElement | null) => {
  if (!audioEl) return;
  try { audioEl.pause(); audioEl.currentTime = 0; audioEl.removeAttribute('src'); audioEl.load(); } catch (e) {}
  if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
    try { navigator.mediaSession.playbackState = 'none'; } catch (e) {} 
  }
};

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
    storeState.setStopwatchLastSavedChunks(totalMinsToSave / 5);
    storeState.addMins(getLocalDateString(), diffMins);
    forcePushTimerState();
  }
};

// =========================================================================
// DEADMAN SWITCH LIMIT
// `180 * 60` (3 hours)!
// =========================================================================
const DEADMAN_INTERVAL_SECS = 180 * 60;  

export default function Stopwatch() {
  const store = useDashboardStore();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [showStartPrompt, setShowStartPrompt] = useState(false);
  const [isIntervalRinging, setIsIntervalRinging] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: React.ReactNode; isDestructive?: boolean; onConfirm: () => void; }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [showStillWorkingPrompt, setShowStillWorkingPrompt] = useState(false);

  const intervalAudioRef = useRef<HTMLAudioElement | null>(null);
  const resolvedAlarmUrl = useAudioUrl(store.alarmSound);
  const stopwatchAlertedChunksRef = useRef<number>(0);
  const lastTickTimeRef = useRef<number>(Date.now());
  
  const deadmanCyclesRef = useRef<number>(0);
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
      if ((isIntervalRinging || showStillWorkingPrompt) && store.enableAlarmSound) {
        intervalAudioRef.current.muted = false;
        intervalAudioRef.current.volume = ((store.alarmVolume || 1) > 1 ? (store.alarmVolume || 1) / 100 : (store.alarmVolume || 1)) * 0.4;
        intervalAudioRef.current.currentTime = 0;
        intervalAudioRef.current.play().catch(error => { if (error.name !== 'NotAllowedError') console.warn("Audio playback issue:", error); });
        if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) try { navigator.mediaSession.playbackState = 'playing'; } catch (e) {}
      } else haltAudio(intervalAudioRef.current);
    }
  }, [isIntervalRinging, showStillWorkingPrompt, store.enableAlarmSound, store.alarmVolume, resolvedAlarmUrl, store.alarmSound]);

  const updateInteraction = () => { if (typeof window !== 'undefined') localStorage.setItem('stopwatch_last_active', Date.now().toString()); };

  useEffect(() => {
    const pausedSecs = typeof window !== 'undefined' ? localStorage.getItem('stopwatch_paused_secs') : null;
    if (store.stopwatchStartTime) {
      setIsRunning(true); 
      const elapsed = Math.max(0, Math.floor((Date.now() - store.stopwatchStartTime) / 1000));
      setElapsedSecs(elapsed);
      deadmanCyclesRef.current = Math.floor(elapsed / DEADMAN_INTERVAL_SECS);
    } else if (pausedSecs) {
      setIsRunning(false); 
      const pSecs = Math.max(0, parseInt(pausedSecs));
      setElapsedSecs(pSecs);
      deadmanCyclesRef.current = Math.floor(pSecs / DEADMAN_INTERVAL_SECS);
    } else {
      setIsRunning(false); 
      setElapsedSecs(0);
      deadmanCyclesRef.current = 0;
    }
  }, [store.stopwatchStartTime]);

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
        
        if (systemJustWoke) {
          if (store.isStopwatchIntervalEnabled && store.stopwatchIntervalMins > 0) stopwatchAlertedChunksRef.current = Math.floor(currentElapsed / (store.stopwatchIntervalMins * 60));
        }

        const nextDeadmanSecs = (deadmanCyclesRef.current + 1) * DEADMAN_INTERVAL_SECS;

        if (store.stopwatchAddToStats && isOwner && currentElapsed >= nextDeadmanSecs) {
          
          if (currentElapsed > nextDeadmanSecs + (5 * 60)) {
            processStopwatchChunks(nextDeadmanSecs, true); 
            setIsRunning(false);
            store.setStopwatchStartTime(null);
            store.setStopwatchDeviceId(null);
            setElapsedSecs(nextDeadmanSecs);
            setShowStillWorkingPrompt(false);
            deadmanTriggeredAtRef.current = null;
            haltAudio(intervalAudioRef.current);
            forcePushTimerState();
            return;
          }

          if (!deadmanTriggeredAtRef.current) {
            deadmanTriggeredAtRef.current = now;
            setShowStillWorkingPrompt(true); 
            
            deadmanTimeoutRef.current = setTimeout(() => {
              processStopwatchChunks(nextDeadmanSecs, true);
              store.setStopwatchStartTime(null);
              store.setStopwatchDeviceId(null);
              setIsRunning(false);
              setElapsedSecs(nextDeadmanSecs);
              setShowStillWorkingPrompt(false);
              deadmanTriggeredAtRef.current = null;
              haltAudio(intervalAudioRef.current);
              forcePushTimerState();
            }, 5 * 60 * 1000);
          }
          return; 
        }

        if (deadmanTriggeredAtRef.current) return;

        if (store.stopwatchAddToStats && isOwner) {
          processStopwatchChunks(currentElapsed, false);
        }

        if (store.isStopwatchIntervalEnabled && store.stopwatchIntervalMins > 0 && currentElapsed > 0 && !systemJustWoke) {
          const chunks = Math.floor(currentElapsed / (store.stopwatchIntervalMins * 60));
          if (chunks > stopwatchAlertedChunksRef.current) {
            stopwatchAlertedChunksRef.current = chunks;
            if (isOwner && (store.enableAlarmSound || store.enableAlarmVibration)) {
              setIsIntervalRinging(true); 
              if (store.enableAlarmVibration && typeof navigator !== 'undefined' && navigator.vibrate) try { navigator.vibrate([300, 200, 300, 200, 300]); } catch (e) {}
              setTimeout(() => setIsIntervalRinging(false), (store.taskIntervalRingSecs || 1.5) * 1000);
            }
          }
        }
      }, 250);
    }
    return () => clearInterval(interval);
  }, [isRunning, store.stopwatchStartTime, store.stopwatchAddToStats, store.isStopwatchIntervalEnabled, store.stopwatchIntervalMins, store.enableAlarmSound, store.enableAlarmVibration, store.alarmVolume, store.taskIntervalRingSecs]);

  const handleStartClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isRunning) {
      setShowStartPrompt(true);
    }
  };

  const confirmStart = (addToStats: boolean) => {
    store.setStopwatchAddToStats(addToStats);
    setShowStartPrompt(false);
    
    if (elapsedSecs === 0) { 
      store.setStopwatchLastSavedChunks(0); 
      stopwatchAlertedChunksRef.current = 0; 
      deadmanCyclesRef.current = 0;
    }
    
    if (deadmanTriggeredAtRef) deadmanTriggeredAtRef.current = null;

    store.setStopwatchStartTime(Date.now() - elapsedSecs * 1000); 
    store.setStopwatchDeviceId(getDeviceId()); 
    setIsRunning(true);
    if (typeof window !== 'undefined') localStorage.removeItem('stopwatch_paused_secs');
    updateInteraction();
    if (typeof window !== 'undefined' && window.innerWidth < 768) setTimeout(() => useDashboardStore.setState({ isStopwatchOpen: false }), 3000);

    if (store.enableAlarmSound && typeof window !== 'undefined') {
      try { const AudioCtx = window.AudioContext || (window as any).webkitAudioContext; if (AudioCtx) { const ctx = new AudioCtx(); if (ctx.state === 'suspended') ctx.resume(); ctx.createBufferSource().start(0); } } catch (e) {}
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
    deadmanCyclesRef.current = 0;

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

  const formatTime = (secs: number) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return secs >= 3600 ? `${pad(Math.floor(secs/3600))}:${pad(Math.floor((secs%3600)/60))}:${pad(secs%60)}` : `${pad(Math.floor(secs/60))}:${pad(secs%60)}`;
  };

  return (
    <div className={`relative pointer-events-auto select-none ${store.isStopwatchOpen ? '' : 'hidden'}`}>
      <div className=" md:min-w-[160px] w-[160px]   rounded-3xl glass-panel border border-white/20 text-white flex flex-col overflow-hidden relative shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        
        <div className="pt-1 pb-1 flex justify-center items-center w-full border-b border-white/10 bg-black/40" onPointerDown={updateInteraction}>
          <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-[10.5px] font-black tracking-widest text-blue-400 uppercase text-center flex items-center justify-center">
            Stopwatch
          </span>
        </div>

        <div className="p-3 flex flex-row items-center cursor-default" onPointerDown={(e) => { e.stopPropagation(); updateInteraction(); }}>
          
          <div className="flex flex-col items-start justify-center flex-1 min-w-0">
            <div className={`text-3xl sm:text-4xl font-light tracking-tighter tabular-nums drop-shadow-md transition-opacity ${isRunning ? 'opacity-100' : 'opacity-90'}`}>
              {formatTime(elapsedSecs)}
            </div>
            
            <span className={`text-[7px] sm:text-[8px] uppercase tracking-wider font-bold mt-1 px-1.5 py-0.5 rounded border transition-colors truncate max-w-full ${store.stopwatchAddToStats ? 'text-white bg-blue-500/80 border-blue-500/30' : 'text-white bg-red-500/80 border-amber-500/30'}`}>
              {isRunning? (store.stopwatchAddToStats ? 'Adding to Focus' : 'Focus / Break Time') : 'Focus / Break'}
            </span>
          </div>
          <div className="flex flex-col items-center justify-end gap-1.5 sm:gap-2 shrink-0">
            {!isRunning ? (
              <Tooltip text="Start Stopwatch" position="top">
                <button onClick={handleStartClick} className="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg transition-all hover:scale-105 active:scale-95">
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
              <button onClick={handleStop} disabled={elapsedSecs === 0} className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-600/40 hover:bg-red-600/80 text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed">
                <Square fill="currentColor" size={12} />
              </button>
            </Tooltip>
          </div>

        </div>

        {isIntervalRinging && (
          <div className="px-3 pb-3">
            <button onClick={stopIntervalBeep} className="w-full h-8 flex flex-row items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 rounded-xl animate-pulse shadow-lg active:scale-95 border border-sky-300/40">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-sky-100/90">{store.stopwatchIntervalMins || 5}m</span>
              <span className="text-sm font-bold tracking-wide flex items-center gap-1 text-white"><Check size={16} strokeWidth={2.5} /> Okay</span>
            </button>
          </div>
        )}

        <div className="flex items-center justify-between gap-1 mt-auto pt-1.5 pb-1.5 px-3 bg-black/40 border-t border-white/10 w-full">
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
          ) : <span className="text-[10px] md:text-[9px] font-bold text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wide whitespace-nowrap">Beep Off</span>}
        </div>

        {(isIntervalRinging || showStillWorkingPrompt) && (
          <audio ref={intervalAudioRef} src={resolvedAlarmUrl || (store.alarmSound?.startsWith('custom-audio-') ? undefined : store.alarmSound) || '/ringtones/narutoBGM.mp3'} preload="none" onError={(e) => { const t = e.currentTarget as HTMLAudioElement; if (!t.src.endsWith('/ringtones/narutoBGM.mp3')) t.src = '/ringtones/narutoBGM.mp3'; }} />
        )}
      </div>

      <ConfirmationModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} isDestructive={confirmModal.isDestructive} confirmText="Discard Session" />

      {/* 3-Hour Deadman Switch: "Are you still working?" */}
      {showStillWorkingPrompt && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-amber-500/40 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">⏳</div>
              <h3 className="text-white font-bold text-lg">Are you still working?</h3>
              <p className="text-white/60 text-sm mt-1">Your stopwatch has reached a major milestone! Just checking in to ensure you aren't away.</p>
              <p className="text-white/40 text-xs mt-2">Auto-stops and saves in 5 minutes if no response.</p>
            </div>
            <button
              onClick={() => {
                if (deadmanTimeoutRef.current) { clearTimeout(deadmanTimeoutRef.current); deadmanTimeoutRef.current = null; }
                deadmanTriggeredAtRef.current = null;
                deadmanCyclesRef.current += 1; 
                setShowStillWorkingPrompt(false);
                haltAudio(intervalAudioRef.current);
              }}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all active:scale-95 text-sm"
            >
              ✅ Yes, I'm here — Keep going!
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Start Confirmation Prompt Portal */}
      {showStartPrompt && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in" onPointerDown={(e) => e.stopPropagation()}>
          <div className="bg-[#0f0f13] border border-white/10 rounded-2xl p-6 max-w-xs w-full mx-4 shadow-2xl flex flex-col gap-4">
            <div className="text-center">
              <h3 className="text-white font-bold text-base mb-1">Select Session Type</h3>
              <p className="text-white/60 text-[11px] leading-relaxed">How do you want to track this stopwatch session?</p>
            </div>
            <div className="flex flex-col gap-2.5 mt-1">
              <button onClick={() => confirmStart(true)} className="w-full py-2.5 bg-blue-500/20 border border-blue-500/40 hover:bg-blue-500 hover:border-blue-400 text-blue-200 hover:text-white font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-[11px] sm:text-xs shadow-md">
                <Flame size={14} className="text-orange-400"/> Add to Focus Hours
              </button>
              <button onClick={() => confirmStart(false)} className="w-full py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 hover:text-white font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-[11px] sm:text-xs shadow-sm">
                <Coffee size={14} className="text-amber-200/80" /> Count Rest / Break Time
              </button>
            </div>
            <button onClick={() => setShowStartPrompt(false)} className="mt-2 py-1.5 text-white/40 hover:text-white text-[10px] uppercase tracking-wider font-bold transition-colors">Cancel</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}