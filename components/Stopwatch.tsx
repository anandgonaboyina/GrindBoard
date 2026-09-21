'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAudioUrl } from '@/hooks/useAudioUrl';
import { useDashboardStore } from '@/store/dashboardStore';
import { Play, Pause, Square, Trash2, Check, BellRing, ChevronUp, ChevronDown, X } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { getLocalDateString } from '@/utils/date';
import { getDeviceId } from '@/utils/deviceId';
import Tooltip from './Tooltip';

const haltAudio = (audioEl: HTMLAudioElement | null) => {
  if (!audioEl) return;
  try { audioEl.pause(); audioEl.currentTime = 0; audioEl.removeAttribute('src'); audioEl.load(); } catch (e) {}
  if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
    try { navigator.mediaSession.playbackState = 'none'; } catch (e) {}
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

  const intervalAudioRef = useRef<HTMLAudioElement | null>(null);
  const resolvedAlarmUrl = useAudioUrl(store.alarmSound);
  const stopwatchAlertedChunksRef = useRef<number>(0);
  const lastTickTimeRef = useRef<number>(Date.now());

  // Handle sleep/wake and settings modal audio cleanup
  useEffect(() => {
    const handleSleepWakeCleanup = () => { if (!useDashboardStore.getState().isAlarmPlaying) haltAudio(intervalAudioRef.current); };
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleSleepWakeCleanup); document.addEventListener('visibilitychange', handleSleepWakeCleanup);
      return () => { window.removeEventListener('focus', handleSleepWakeCleanup); document.removeEventListener('visibilitychange', handleSleepWakeCleanup); };
    }
  }, []);

  useEffect(() => { if (store.isSettingsOpen) haltAudio(intervalAudioRef.current); }, [store.isSettingsOpen]);

  // Interval Audio Playback
  useEffect(() => {
    if (intervalAudioRef.current) {
      if (isIntervalRinging && store.enableAlarmSound) {
        intervalAudioRef.current.muted = false;
        intervalAudioRef.current.volume = ((store.alarmVolume || 1) > 1 ? (store.alarmVolume || 1) / 100 : (store.alarmVolume || 1)) * 0.4;
        intervalAudioRef.current.currentTime = 0;
        intervalAudioRef.current.play().catch(e => console.error(e));
        if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) try { navigator.mediaSession.playbackState = 'playing'; } catch (e) {}
      } else haltAudio(intervalAudioRef.current);
    }
  }, [isIntervalRinging, store.enableAlarmSound, store.alarmVolume, resolvedAlarmUrl, store.alarmSound]);

  const updateInteraction = () => { if (typeof window !== 'undefined') localStorage.setItem('stopwatch_last_active', Date.now().toString()); };

  // Initialization & Cloud Sync checks
  useEffect(() => {
    const pausedSecs = typeof window !== 'undefined' ? localStorage.getItem('stopwatch_paused_secs') : null;
    if (store.stopwatchStartTime) {
      const now = Date.now();
      const lastActive = parseInt((typeof window !== 'undefined' ? localStorage.getItem('stopwatch_last_active') : null) || now.toString());
      const isOwner = store.stopwatchDeviceId === getDeviceId();

      if (Math.floor((now - lastActive) / 1000) >= 3600 && isOwner && store.stopwatchAddToStats) {
        const cappedElapsed = Math.max(0, Math.floor((lastActive - store.stopwatchStartTime) / 1000));
        setIsRunning(false); setElapsedSecs(cappedElapsed); setPausedAtString(new Date(lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setShowContinuePrompt(true); useDashboardStore.setState({ isStopwatchOpen: true });
        if (typeof window !== 'undefined') localStorage.setItem('stopwatch_paused_secs', cappedElapsed.toString());
        store.setStopwatchStartTime(null); store.setStopwatchDeviceId(null);
      } else {
        if (Math.floor((now - lastActive) / 1000) >= 3600 && isOwner && !store.stopwatchAddToStats && typeof window !== 'undefined') localStorage.setItem('stopwatch_tainted', 'true');
        setIsRunning(true); setElapsedSecs(Math.max(0, Math.floor((now - store.stopwatchStartTime) / 1000)));
      }
    } else if (pausedSecs) {
      setIsRunning(false); setElapsedSecs(Math.max(0, parseInt(pausedSecs)));
    } else {
      setIsRunning(false); setElapsedSecs(0);
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
        const lastActive = parseInt((typeof window !== 'undefined' ? localStorage.getItem('stopwatch_last_active') : null) || now.toString());
        const isOwner = store.stopwatchDeviceId === getDeviceId();
        const currentElapsed = Math.max(0, Math.floor((now - store.stopwatchStartTime!) / 1000));

        if (Math.floor((now - lastActive) / 1000) >= 3600 && isOwner) {
          if (store.stopwatchAddToStats) {
            const cappedElapsed = Math.max(0, Math.floor((lastActive - store.stopwatchStartTime!) / 1000));
            setIsRunning(false); useDashboardStore.setState({ isStopwatchOpen: true });
            setPausedAtString(new Date(lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            setShowContinuePrompt(true); updateInteraction();

            const chunks = Math.floor(cappedElapsed / 300);
            if (chunks > store.stopwatchLastSavedChunks) {
              store.addMins(getLocalDateString(), (chunks - store.stopwatchLastSavedChunks) * 5);
              store.setStopwatchLastSavedChunks(chunks);
            }
            if (typeof window !== 'undefined') localStorage.setItem('stopwatch_paused_secs', cappedElapsed.toString());
            store.setStopwatchStartTime(null); store.setStopwatchDeviceId(null); setElapsedSecs(cappedElapsed);
            return;
          } else if (typeof window !== 'undefined') localStorage.setItem('stopwatch_tainted', 'true');
        }

        setElapsedSecs(currentElapsed);
        if (typeof window !== 'undefined') localStorage.setItem('stopwatch_last_active', now.toString());

        if (systemJustWoke) {
          if (store.isStopwatchIntervalEnabled && store.stopwatchIntervalMins > 0) stopwatchAlertedChunksRef.current = Math.floor(currentElapsed / (store.stopwatchIntervalMins * 60));
          return;
        }

        if (store.stopwatchAddToStats && isOwner) {
          const chunks = Math.floor(currentElapsed / 300);
          if (chunks > store.stopwatchLastSavedChunks) {
            store.addMins(getLocalDateString(), (chunks - store.stopwatchLastSavedChunks) * 5);
            store.setStopwatchLastSavedChunks(chunks);
          }
        }

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
  }, [isRunning, store.stopwatchStartTime, store.stopwatchAddToStats, store.stopwatchLastSavedChunks, store.isStopwatchIntervalEnabled, store.stopwatchIntervalMins, store.enableAlarmSound, store.enableAlarmVibration, store.alarmVolume, store.taskIntervalRingSecs]);

  const handleStart = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isRunning) {
      if (elapsedSecs === 0) { store.setStopwatchLastSavedChunks(0); stopwatchAlertedChunksRef.current = 0; }
      store.setStopwatchStartTime(Date.now() - elapsedSecs * 1000); store.setStopwatchDeviceId(getDeviceId()); setIsRunning(true);
      if (typeof window !== 'undefined') localStorage.removeItem('stopwatch_paused_secs');
      updateInteraction();
      if (typeof window !== 'undefined' && window.innerWidth < 768) setTimeout(() => useDashboardStore.setState({ isStopwatchOpen: false }), 3000);

      // Web Audio Unlock
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
    if (elapsedSecs >= 300 && saveToStats && store.stopwatchDeviceId === getDeviceId()) {
      const finalUnsavedMins = Math.max(0, Math.floor(elapsedSecs / 60) - (store.stopwatchLastSavedChunks * 5));
      if (finalUnsavedMins > 0) store.addMins(getLocalDateString(), finalUnsavedMins);
    }
    setIsRunning(false); setElapsedSecs(0); store.setStopwatchStartTime(null); store.setStopwatchDeviceId(null); store.setStopwatchLastSavedChunks(0); stopwatchAlertedChunksRef.current = 0;
    if (typeof window !== 'undefined') { localStorage.removeItem('stopwatch_paused_secs'); localStorage.removeItem('stopwatch_last_active'); localStorage.removeItem('stopwatch_tainted'); }
    haltAudio(intervalAudioRef.current); setIsIntervalRinging(false); useDashboardStore.getState().forceInstantSave();
  };

  const toggleStatsCheckbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!store.stopwatchAddToStats && typeof window !== 'undefined' && localStorage.getItem('stopwatch_tainted') === 'true') return alert('Cannot enable: this session was left running unattended for over 1 hour. Please stop and start a new session to log focus time.');
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

              {/* Interval Settings seamlessly integrated with bottom edge */}
              <div className="flex items-center justify-between gap-1 mt-2 pt-2.5 pb-2.5 px-3 -mx-3 -mb-3 bg-black/40 border-t border-white/10 w-[calc(100%+1.5rem)]">
                <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => store.setIsStopwatchIntervalEnabled(!store.isStopwatchIntervalEnabled)}>
                  <BellRing size={12} className={store.isStopwatchIntervalEnabled ? "text-sky-400" : "text-white/40"} />
                  <span className="text-[10px] font-bold text-white/70 tracking-wide">Interval</span>
                  <button className={`relative inline-flex h-3.5 w-6 items-center rounded-full transition-colors ml-1 ${store.isStopwatchIntervalEnabled ? 'bg-sky-500' : 'bg-white/20'}`}>
                    <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${store.isStopwatchIntervalEnabled ? 'translate-x-3' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                {store.isStopwatchIntervalEnabled ? (
                  <div className="flex items-center gap-1">
                    <input type="number" value={store.stopwatchIntervalMins || ''} onChange={e => store.setStopwatchIntervalMins(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0))} className="w-8 bg-black/50 border border-white/20 rounded px-1 py-0.5 text-[10px] text-center font-bold text-sky-300 outline-none focus:border-sky-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none shadow-inner" min="1" />
                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Min</span>
                  </div>
                ) : <span className="text-[8px] font-bold text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wide">Beep Off</span>}
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
    </div>
  );
}