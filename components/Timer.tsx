'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Play, Pause, Square, VolumeX, Check, ChevronUp, ChevronDown, BellRing, Clock, X, Loader2 } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboardStore';
import { useTaskStore } from '@/store/taskStore';
import { fetchQuote } from '@/utils/quoteEngine';
import { getLocalDateString } from '@/utils/date';
import { useAudioUrl } from '@/hooks/useAudioUrl';
import { getDeviceId } from '@/utils/deviceId';
import { triggerInstantSave, checkTimerStillActiveInDB } from '@/store/dashboardStore/sync';
import Tooltip from './Tooltip';
import ConfirmationModal from './ConfirmationModal';

// Helper to safely stop audio and update OS media session state
const haltAudio = (audioEl: HTMLAudioElement | null) => {
  if (!audioEl) return;
  try { audioEl.pause(); audioEl.currentTime = 0; audioEl.removeAttribute('src'); audioEl.load(); } catch (e) {}
  if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
    try { navigator.mediaSession.playbackState = 'none'; } catch (e) {}
  }
};

export default function Timer() {
  const store = useDashboardStore();
  const { updateTaskDuration: updateLocalTaskDuration } = useTaskStore();
  const resolvedAlarmUrl = useAudioUrl(store.alarmSound);

  const audioRef = useRef<HTMLAudioElement>(null);
  const intervalAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const [customMins, setCustomMins] = useState<string>('');
  const [isIntervalRinging, setIsIntervalRinging] = useState(false);
  const [localTimeLeft, setLocalTimeLeft] = useState(0);

  const savedChunksRef = useRef(store.timerLastSavedChunks);
  const alertedChunksRef = useRef(store.timerLastAlertedChunks);
  const isIntervalRingingRef = useRef(false);
  const lastIntervalAlertMinsRef = useRef(store.taskIntervalAlertMins);
  const lastIsIntervalEnabledRef = useRef(store.isTaskIntervalAlertEnabled);
  const lastTickTimeRef = useRef<number>(Date.now());
  const systemWakeTimeRef = useRef<number>(0);
  const lastInteractionTimeRef = useRef(typeof window !== 'undefined' ? parseInt(localStorage.getItem('timer_last_active') || Date.now().toString()) : Date.now());

  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editHours, setEditHours] = useState('00');
  const [editMins, setEditMins] = useState('25');
  const [selectedHr, setSelectedHr] = useState('12');
  const [selectedMin, setSelectedMin] = useState('00');
  const [selectedAmPm, setSelectedAmPm] = useState('AM');
  const [highlightedField, setHighlightedField] = useState<'clock' | 'minutes' | null>(null);
  const [isClockModalOpen, setIsClockModalOpen] = useState(false);

  const [showContinuePrompt, setShowContinuePrompt] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [pausedAtString, setPausedAtString] = useState<string>('');

  useEffect(() => {
    const d = new Date();
    let h = d.getHours();
    setSelectedAmPm(h >= 12 ? 'PM' : 'AM');
    setSelectedHr((h % 12 || 12).toString().padStart(2, '0'));
    setSelectedMin(d.getMinutes().toString().padStart(2, '0'));
  }, []);

  // Suppress harmless Web Audio play() NotSupported errors
  useEffect(() => {
    const handler = (e: PromiseRejectionEvent) => {
      const err = String(e.reason?.name || e.reason?.message || e.reason);
      if (err.includes('NotSupportedError') || err.includes('no supported sources')) {
        e.preventDefault(); e.stopImmediatePropagation();
      }
    };
    if (typeof window !== 'undefined') window.addEventListener('unhandledrejection', handler, { capture: true });
    return () => window.removeEventListener('unhandledrejection', handler, { capture: true });
  }, []);

  useEffect(() => { savedChunksRef.current = store.timerLastSavedChunks; }, [store.timerLastSavedChunks]);
  useEffect(() => { alertedChunksRef.current = store.timerLastAlertedChunks; }, [store.timerLastAlertedChunks]);

  useEffect(() => {
    setLocalTimeLeft(store.timerEndAt ? Math.max(0, Math.floor((store.timerEndAt - Date.now()) / 1000)) : (store.timerPausedLeft || 0));
  }, [store.timerEndAt, store.timerPausedLeft]);

  const updateInteraction = () => {
    const now = Date.now();
    lastInteractionTimeRef.current = now;
    if (typeof window !== 'undefined') localStorage.setItem('timer_last_active', now.toString());
  };

  const stopAlarm = async () => {
    store.setIsAlarmPlaying(false);
    haltAudio(audioRef.current);
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try { (await navigator.serviceWorker.ready).getNotifications({ tag: 'alarm-alert' } as any).then(n => n.forEach(x => x.close())); } catch (e) {}
    }
  };

  const stopIntervalBeep = () => {
    haltAudio(intervalAudioRef.current);
    setIsIntervalRinging(false);
    isIntervalRingingRef.current = false;
  };

  const saveAndClearActiveTaskTimer = () => {
    if (store.timerInitialMins && (store.timerEndAt || store.timerPausedLeft !== null)) {
      const currentRemaining = store.timerEndAt ? Math.max(0, Math.floor((store.timerEndAt - Date.now()) / 1000)) : store.timerPausedLeft!;
      const elapsedMins = Math.floor(((store.timerInitialMins * 60) - currentRemaining) / 60);
      const finalUnsavedMins = Math.max(0, elapsedMins - (savedChunksRef.current * 5));

      if (finalUnsavedMins > 0) {
        store.addMins(getLocalDateString(), finalUnsavedMins);
        if (store.activeTaskId) {
          store.updateTaskDuration(store.activeTaskId, finalUnsavedMins);
          updateLocalTaskDuration(store.activeTaskId, finalUnsavedMins);
          store.incrementGroupTaskTimeSpent(store.activeTaskId, finalUnsavedMins);
        }
        triggerInstantSave();
      }
    }
    savedChunksRef.current = 0;
    store.setActiveTask(null, null);
    store.setTimerLastSavedChunks(0);
    store.setTimerLastAlertedChunks(0);
    store.setTimerInitialMins(null);
    stopIntervalBeep();
  };

  useEffect(() => {
    const handleSleepWakeCleanup = () => {
      systemWakeTimeRef.current = Date.now();
      const st = useDashboardStore.getState();
      if (!st.isAlarmPlaying || (st.timerEndAt && Date.now() - st.timerEndAt > 15000)) {
        if (st.isAlarmPlaying) st.setIsAlarmPlaying(false);
        stopAlarm();
        stopIntervalBeep();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleSleepWakeCleanup);
      document.addEventListener('visibilitychange', handleSleepWakeCleanup);
      return () => { window.removeEventListener('focus', handleSleepWakeCleanup); document.removeEventListener('visibilitychange', handleSleepWakeCleanup); };
    }
  }, []);

  useEffect(() => {
    if (store.isSettingsOpen) {
      if (useDashboardStore.getState().isAlarmPlaying) useDashboardStore.getState().setIsAlarmPlaying(false);
      stopAlarm(); stopIntervalBeep();
    }
  }, [store.isSettingsOpen]);

  // Main Tick Interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (store.timerEndAt) {
      if (!lastTickTimeRef.current || Math.abs(Date.now() - lastTickTimeRef.current) > 60000) lastTickTimeRef.current = Date.now();
      
      interval = setInterval(() => {
        const now = Date.now();
        const wasSleeping = (now - (lastTickTimeRef.current || now)) > 60000;
        lastTickTimeRef.current = now;
        const remaining = Math.floor((store.timerEndAt! - now) / 1000);
        const isOwner = store.timerDeviceId === getDeviceId();

        if (wasSleeping) {
          const actvMins = store.activeTaskId ? store.taskIntervalAlertMins : store.timerIntervalMins;
          if (actvMins > 0 && store.timerInitialMins) alertedChunksRef.current = Math.floor(Math.max(0, (store.timerInitialMins * 60) - remaining) / (actvMins * 60));
          return;
        }

        if (Math.floor((now - lastInteractionTimeRef.current) / 1000) >= 7200 && isOwner && lastInteractionTimeRef.current < store.timerEndAt!) {
          const actRem = Math.max(0, Math.floor((store.timerEndAt! - lastInteractionTimeRef.current) / 1000));
          if (store.timerInitialMins) {
            const chunksAtPause = Math.floor(Math.max(0, (store.timerInitialMins * 60) - actRem) / 300);
            if (chunksAtPause > savedChunksRef.current) {
              const diffMins = (chunksAtPause - savedChunksRef.current) * 5;
              store.addMins(getLocalDateString(), diffMins);
              if (store.activeTaskId) {
                store.updateTaskDuration(store.activeTaskId, diffMins);
                updateLocalTaskDuration(store.activeTaskId, diffMins);
                store.incrementGroupTaskTimeSpent(store.activeTaskId, diffMins);
              }
              store.setTimerLastSavedChunks(chunksAtPause);
              savedChunksRef.current = chunksAtPause;
            }
          }
          store.setTimerPausedLeft(actRem);
          store.setTimerEndAt(null);
          setPausedAtString(new Date(lastInteractionTimeRef.current).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          setShowContinuePrompt(true);
          updateInteraction();
          return;
        }

        if (store.timerInitialMins) {
          const elapsedSecs = (store.timerInitialMins * 60) - remaining;
          if (elapsedSecs >= 0) {
            const chunks = Math.floor(elapsedSecs / 300);
            if (chunks > savedChunksRef.current) {
              if (isOwner) {
                const diffMins = (chunks - savedChunksRef.current) * 5;
                savedChunksRef.current = chunks;
                store.addMins(getLocalDateString(), diffMins);
                if (store.activeTaskId) {
                  store.updateTaskDuration(store.activeTaskId, diffMins);
                  updateLocalTaskDuration(store.activeTaskId, diffMins);
                  store.incrementGroupTaskTimeSpent(store.activeTaskId, diffMins);
                }
                store.setTimerLastSavedChunks(chunks);
                triggerInstantSave();
              } else savedChunksRef.current = chunks;
            }

            if (remaining > 5 && !wasSleeping) {
              const isIntvActive = store.activeTaskId ? (store.isTaskIntervalAlertEnabled && store.taskIntervalAlertMins > 0) : (store.isTimerIntervalEnabled && store.timerIntervalMins > 0);
              const intvMins = store.activeTaskId ? store.taskIntervalAlertMins : store.timerIntervalMins;
              if (isIntvActive) {
                const curChunk = Math.floor(elapsedSecs / (intvMins * 60));
                if (lastIntervalAlertMinsRef.current !== intvMins || lastIsIntervalEnabledRef.current !== isIntvActive) {
                  lastIntervalAlertMinsRef.current = intvMins; lastIsIntervalEnabledRef.current = isIntvActive; alertedChunksRef.current = curChunk;
                } else if (curChunk > alertedChunksRef.current && curChunk > 0) {
                  alertedChunksRef.current = curChunk;
                  if (isOwner) {
                    store.setTimerLastAlertedChunks(curChunk);
                    if (store.enableAlarmSound || store.enableAlarmVibration) {
                      setIsIntervalRinging(true); isIntervalRingingRef.current = true; useDashboardStore.setState({ isTimerOpen: true });
                      if (store.enableAlarmVibration && typeof navigator !== 'undefined' && navigator.vibrate) try { navigator.vibrate([300, 200, 300, 200, 300]); } catch (e) {}
                      setTimeout(() => { setIsIntervalRinging(false); isIntervalRingingRef.current = false; }, (store.taskIntervalRingSecs || 1.5) * 1000);
                    }
                  }
                }
              }
            }
          }
        }

        if (remaining <= 0) {
          clearInterval(interval);
          setLocalTimeLeft(0);
          store.setTimerEndAt(null);
          store.setTimerPausedLeft(null);
          stopIntervalBeep();

          if (isOwner && !wasSleeping) playAlarm();
          if (store.timerInitialMins && store.timerInitialMins > 0 && isOwner) {
            const finalMins = Math.max(0, store.timerInitialMins - (savedChunksRef.current * 5));
            if (finalMins > 0) {
              store.addMins(getLocalDateString(), finalMins);
              if (store.activeTaskId) {
                store.updateTaskDuration(store.activeTaskId, finalMins);
                updateLocalTaskDuration(store.activeTaskId, finalMins);
                store.incrementGroupTaskTimeSpent(store.activeTaskId, finalMins);
              }
              triggerInstantSave();
            }
            savedChunksRef.current = 0;
            fetchQuote().then(q => store.showQuotePopup(q));
          }
        } else setLocalTimeLeft(remaining);

        if (typeof window !== 'undefined') localStorage.setItem('timer_last_active', now.toString());
      }, 250);
    }
    return () => clearInterval(interval);
  }, [store]);

  // Cross-device timer sync: after 5 min, poll DB every 60s to detect if timer was stopped on another device
  useEffect(() => {
    if (!store.timerEndAt || !store.timerInitialMins) return;
    const isOwner = store.timerDeviceId === getDeviceId();
    if (!isOwner) return; // Only the owner device polls

    // Only start polling after 5 minutes have elapsed (avoid false positives on quick stops)
    const timerStartedAt = store.timerEndAt - (store.timerInitialMins * 60 * 1000);
    const elapsedMs = Date.now() - timerStartedAt;
    const FIVE_MINS_MS = 5 * 60 * 1000;
    const initialDelay = Math.max(0, FIVE_MINS_MS - elapsedMs);

    let pollInterval: NodeJS.Timeout | null = null;

    const startPolling = () => {
      pollInterval = setInterval(async () => {
        const st = useDashboardStore.getState();
        // Stop polling if timer ended naturally
        if (!st.timerEndAt && st.timerPausedLeft === null) {
          if (pollInterval) clearInterval(pollInterval);
          return;
        }

        const status = await checkTimerStillActiveInDB('timer');
        if (status === 'stopped') {
          // Cloud says no timer — another device stopped it
          if (pollInterval) clearInterval(pollInterval);
          const currentSt = useDashboardStore.getState();
          if (currentSt.timerEndAt) {
            // Save chunks up to now before discarding
            const remaining = Math.max(0, Math.floor((currentSt.timerEndAt - Date.now()) / 1000));
            if (currentSt.timerInitialMins) {
              const elapsedSecs = (currentSt.timerInitialMins * 60) - remaining;
              const chunks = Math.floor(Math.max(0, elapsedSecs) / 300);
              if (chunks > savedChunksRef.current) {
                const diffMins = (chunks - savedChunksRef.current) * 5;
                currentSt.addMins(getLocalDateString(), diffMins);
                savedChunksRef.current = chunks;
                currentSt.setTimerLastSavedChunks(chunks);
              }
            }
            // Clear timer state — other device ended it
            currentSt.setTimerEndAt(null);
            currentSt.setTimerPausedLeft(null);
            currentSt.clearTimerState();
            setShowContinuePrompt(true);
            setPausedAtString('another device');
            triggerInstantSave();
          }
        }
        // If 'active' or 'unknown' — continue as normal
      }, 60 * 1000); // poll every 60 seconds
    };

    const delayTimeout = setTimeout(startPolling, initialDelay);

    return () => {
      clearTimeout(delayTimeout);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [store.timerEndAt, store.timerDeviceId, store.timerInitialMins]);

  useEffect(() => {
    if (store.timerTrigger) {
      if (store.timerTrigger.taskId && store.timerTrigger.taskId === store.activeTaskId && store.timerPausedLeft !== null) {
        store.setTimerEndAt(Date.now() + store.timerPausedLeft * 1000);
        store.setTimerPausedLeft(null);
        lastTickTimeRef.current = Date.now();
      } else {
        saveAndClearActiveTaskTimer();
        if (store.timerTrigger.taskId) store.setActiveTask(store.timerTrigger.taskId, store.timerTrigger.taskTitle || null);
        startTimer(store.timerTrigger.mins * 60, !!store.timerTrigger.taskId);
      }
      useDashboardStore.setState({ timerTrigger: null });
    }
  }, [store.timerTrigger]);

  useEffect(() => {
    let vibe: NodeJS.Timeout;
    if (store.isAlarmPlaying && store.enableAlarmVibration && typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([500, 500, 500, 500, 500]); vibe = setInterval(() => { try { navigator.vibrate([500, 500, 500, 500, 500]); } catch(e){} }, 2500); } catch(e){}
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) try { navigator.vibrate(0); } catch(e){}
    return () => { if (vibe) clearInterval(vibe); if (typeof navigator !== 'undefined' && navigator.vibrate) try { navigator.vibrate(0); } catch(e){} };
  }, [store.isAlarmPlaying, store.enableAlarmVibration]);

  useEffect(() => {
    if (audioRef.current) {
      if (store.isAlarmPlaying && store.enableAlarmSound) {
        audioRef.current.muted = false; audioRef.current.volume = (store.alarmVolume || 1) > 1 ? (store.alarmVolume || 1)/100 : (store.alarmVolume || 1);
        audioRef.current.play().catch(e => console.error(e));
      } else haltAudio(audioRef.current);
    }
  }, [store.isAlarmPlaying, store.enableAlarmSound, store.alarmVolume, resolvedAlarmUrl]);

  useEffect(() => {
    if (intervalAudioRef.current) {
      if (isIntervalRinging && store.enableAlarmSound) {
        intervalAudioRef.current.muted = false; intervalAudioRef.current.volume = ((store.alarmVolume || 1) > 1 ? (store.alarmVolume || 1)/100 : (store.alarmVolume || 1)) * 0.4;
        intervalAudioRef.current.currentTime = 0; intervalAudioRef.current.play().catch(e => console.error(e));
      } else haltAudio(intervalAudioRef.current);
    }
  }, [isIntervalRinging, store.enableAlarmSound, store.alarmVolume, resolvedAlarmUrl]);

  const getAlarmTitle = () => store.enableAlarmSound && store.enableAlarmVibration ? 'PWA_ALARM_RING_VIBRATE' : store.enableAlarmSound ? 'PWA_ALARM_RING' : store.enableAlarmVibration ? 'PWA_ALARM_VIBRATE' : 'PWA_ALARM_TRIGGER';

  const playAlarm = async () => {
    store.setIsAlarmPlaying(true); useDashboardStore.setState({ isTimerOpen: true });
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const opts = { body: 'Focus session ended.', icon: '/icon-192x192.png', vibrate: store.enableAlarmVibration ? [500,500,500,500,500] : undefined, silent: !store.enableAlarmSound, requireInteraction: true, tag: 'alarm-alert', renotify: true } as any;
        if ('serviceWorker' in navigator) (await navigator.serviceWorker.ready).showNotification(getAlarmTitle(), opts);
        else new Notification(getAlarmTitle(), opts);
      } catch (e) {}
    }
    setTimeout(() => useDashboardStore.getState().setIsAlarmPlaying(false), (store.alarmDurationSecs || 60) * 1000);
  };

  const startTimer = (seconds: number, isTask = false) => {
    if (!isTask) saveAndClearActiveTaskTimer();
    store.setTimerInitialMins(Math.round(seconds / 60)); store.setTimerPausedLeft(null); store.setTimerEndAt(Date.now() + seconds * 1000);
    savedChunksRef.current = 0; alertedChunksRef.current = 0; lastIntervalAlertMinsRef.current = 0; lastIsIntervalEnabledRef.current = false;
    store.setTimerLastSavedChunks(0); store.setTimerLastAlertedChunks(0); store.setTimerDeviceId(getDeviceId()); lastTickTimeRef.current = Date.now();
    stopAlarm(); updateInteraction();

    if (typeof window !== 'undefined' && window.innerWidth < 768) setTimeout(() => useDashboardStore.setState({ isTimerOpen: false }), 3000);
    if (store.enableAlarmSound && typeof window !== 'undefined') {
      try { const AudioCtx = window.AudioContext || (window as any).webkitAudioContext; if (AudioCtx) { const ctx = new AudioCtx(); if (ctx.state === 'suspended') ctx.resume(); ctx.createBufferSource().start(0); } } catch (e) {}
    }
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') scheduleNotification(Date.now() + seconds * 1000);
  };

  const scheduleNotification = async (targetTime: number) => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && (window as any).TimestampTrigger) {
      try { (await navigator.serviceWorker.ready).showNotification(getAlarmTitle(), { body: 'Session ended.', icon: '/icon-192x192.png', silent: !store.enableAlarmSound, requireInteraction: true, tag: 'alarm-alert', showTrigger: new (window as any).TimestampTrigger(targetTime) } as any); } catch (e) {}
    }
  };

  const togglePause = () => {
    if (store.timerEndAt) {
      store.setTimerPausedLeft(localTimeLeft); store.setTimerEndAt(null); stopIntervalBeep();
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) navigator.serviceWorker.ready.then(async r => { try { (await r.getNotifications({ tag: 'alarm-alert', includeTriggered: true } as any)).forEach(n => n.close()); } catch(e){} });
    } else if (store.timerPausedLeft !== null) {
      const newEndAt = Date.now() + store.timerPausedLeft * 1000;
      store.setTimerEndAt(newEndAt); store.setTimerPausedLeft(null); store.setTimerDeviceId(getDeviceId()); lastTickTimeRef.current = Date.now();
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') scheduleNotification(newEndAt);
    }
  };

  const handleStopClick = async () => {
    if (!store.timerInitialMins || typeof window === 'undefined') { saveAndClearActiveTaskTimer(); return stopAlarm(); }
    
    // We previously checked the cloud here to see if timerEndAt === null,
    // but if the user stops the timer within 2 seconds of starting it,
    // the start action hasn't synced yet, causing a false positive "Ended on another device" error.
    // Trusting the local state is safer and prevents this race condition.
    
    saveAndClearActiveTaskTimer(); 
    store.clearTimerState(); 
    stopAlarm(); 
    stopIntervalBeep();
  };

  const handleCustomStart = () => {
    let m = parseInt(customMins);
    if (!isNaN(m) && m > 0) { startTimer(Math.min(m, 720) * 60); setCustomMins(''); }
  };

  const formatTime = (sec: number) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return sec >= 3600 ? `${pad(Math.floor(sec/3600))}:${pad(Math.floor((sec%3600)/60))}:${pad(sec%60)}` : `${pad(Math.floor(sec/60))}:${pad(sec%60)}`;
  };

  const adjustEditTime = (t: 'h' | 'm', d: number) => {
    let h = parseInt(editHours) || 0, m = parseInt(editMins) || 0;
    if (t === 'h') h = Math.max(0, Math.min(99, h + d));
    else { m += d; if (m >= 60) { h += Math.floor(m/60); m = m%60; } else if (m < 0) { if (h > 0) { h -= 1; m = 60 + (m%60); } else m = 0; } }
    setEditHours(h.toString().padStart(2, '0')); setEditMins(m.toString().padStart(2, '0'));
    setCustomMins((h * 60 + m) > 0 ? (h * 60 + m).toString() : '');
  };

  const handleEditChange = (val: string, t: 'h' | 'm') => {
    let n = parseInt(val); if (isNaN(n)) return t==='h' ? setEditHours('') : setEditMins('');
    if (t === 'h') setEditHours(Math.max(0, Math.min(99, n)).toString().padStart(2, '0'));
    else { let h = parseInt(editHours) || 0; if (n >= 60) { h += Math.floor(n/60); n = n%60; setEditHours(h.toString().padStart(2, '0')); } setEditMins(n.toString().padStart(2, '0')); }
    setCustomMins((parseInt(editHours||'0') * 60 + parseInt(editMins||'0')) > 0 ? (parseInt(editHours||'0') * 60 + parseInt(editMins||'0')).toString() : '');
  };

  const saveEditor = () => {
    const newRem = (parseInt(editHours) || 0) * 3600 + (parseInt(editMins) || 0) * 60;
    if (store.timerInitialMins) store.setTimerInitialMins(Math.max(0, Math.round((((store.timerInitialMins * 60) - localTimeLeft) + newRem) / 60)));
    store.setTimerPausedLeft(newRem); setIsEditingTime(false);
  };

  const updateTargetTime = (hStr: string, mStr: string, ampm: string) => {
    let h = parseInt(hStr); if (ampm === 'PM' && h < 12) h += 12; if (ampm === 'AM' && h === 12) h = 0;
    const t = new Date(); t.setHours(h, parseInt(mStr), 0, 0); if (t < new Date()) t.setDate(t.getDate() + 1);
    const m = Math.min(720, Math.floor((t.getTime() - Date.now()) / 60000));
    setCustomMins(m.toString()); setEditHours(Math.floor(m/60).toString().padStart(2,'0')); setEditMins((m%60).toString().padStart(2,'0'));
    setHighlightedField('minutes'); setTimeout(() => setHighlightedField(null), 1800);
  };

  const handleCustomMinsChange = (v: string) => {
    let m = parseInt(v); if (!isNaN(m) && m > 720) m = 720; setCustomMins(isNaN(m) ? '' : m.toString());
    if (!isNaN(m) && m > 0) {
      setEditHours(Math.floor(m/60).toString().padStart(2,'0')); setEditMins((m%60).toString().padStart(2,'0'));
      const t = new Date(Date.now() + m * 60000); let h = t.getHours(); setSelectedAmPm(h >= 12 ? 'PM' : 'AM');
      setSelectedHr((h % 12 || 12).toString().padStart(2, '0')); setSelectedMin(t.getMinutes().toString().padStart(2, '0'));
      setHighlightedField('clock'); setTimeout(() => setHighlightedField(null), 1800);
    }
  };

  const doneMins = Math.floor((store.timerInitialMins ? Math.max(0, (store.timerInitialMins * 60) - localTimeLeft) : 0) / 60);
  const displayTaskTitle = store.activeTaskTitle ? store.activeTaskTitle.replace(/^👥\s*\[Group:[^\]]+\]\s*/i, '') : null;

  return (
    <>
      <div onPointerDown={updateInteraction} className={`relative pointer-events-auto select-none ${store.isTimerOpen || store.isAlarmPlaying || isIntervalRinging ? '' : 'hidden'}`}>
        <div className="w-64 rounded-3xl glass-panel border border-white/20 text-white flex flex-col shadow-2xl overflow-hidden relative">
          
          <div className="pt-1 px-3 pb-1 flex justify-center items-center w-full border-b border-white/10 bg-black/40">
            <Tooltip text={displayTaskTitle || 'Timer'} position="bottom">
              <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold tracking-wider text-blue-300 uppercase max-w-full text-center flex items-center justify-center gap-1.5 whitespace-normal break-words leading-tight">
                {displayTaskTitle ? <><span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shrink-0"></span><span>{displayTaskTitle}</span></> : <span className="font-black text-blue-400 tracking-widest">Timer</span>}
              </span>
            </Tooltip>
          </div>

          <div className="p-3 flex flex-col gap-2 cursor-default">
            <div className="text-center min-h-[60px] flex flex-col items-center justify-center relative">
              <div className="flex items-center justify-center w-full relative">
                {!store.timerEndAt && !store.timerPausedLeft && localTimeLeft === 0 && !isEditingTime && !store.isAlarmPlaying && (
                  <div className="absolute right-1 top-1 mt-[18px] ml-[5px] -translate-y-1/2 flex flex-col gap-1">
                    {[5, 15, 25].map(p => <button key={p} onClick={() => startTimer(p * 60)} className="w-8 py-0.5 text-xs bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/20 font-medium">{p}m</button>)}
                  </div>
                )}
                {isEditingTime ? (
                  <div className="flex items-center justify-center gap-1">
                    <div className="flex flex-col items-center">
                      <button onClick={() => adjustEditTime('h', 1)} className="hover:text-blue-400 p-0.5 active:scale-90"><ChevronUp size={20} /></button>
                      <input type="number" value={editHours} onChange={e => handleEditChange(e.target.value, 'h')} onKeyDown={e => e.key === 'Enter' && saveEditor()} className="w-14 bg-transparent text-4xl sm:text-5xl font-light tabular-nums text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none selection:bg-white/20" min="0" max="99" />
                      <button onClick={() => adjustEditTime('h', -1)} className="hover:text-blue-400 p-0.5 active:scale-90"><ChevronDown size={20} /></button>
                      <span className="text-[10px] font-bold text-blue-300/70 uppercase tracking-widest mt-0.5">hr</span>
                    </div>
                    <span className="text-4xl sm:text-5xl font-light opacity-50 mb-4">:</span>
                    <div className="flex flex-col items-center">
                      <button onClick={() => adjustEditTime('m', 1)} className="hover:text-blue-400 p-0.5 active:scale-90"><ChevronUp size={20} /></button>
                      <input type="number" value={editMins} onChange={e => handleEditChange(e.target.value, 'm')} onKeyDown={e => e.key === 'Enter' && saveEditor()} className="w-14 bg-transparent text-4xl sm:text-5xl font-light tabular-nums text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none selection:bg-white/20" min="0" />
                      <button onClick={() => adjustEditTime('m', -1)} className="hover:text-blue-400 p-0.5 active:scale-90"><ChevronDown size={20} /></button>
                      <span className="text-[10px] font-bold text-blue-300/70 uppercase tracking-widest mt-0.5">min</span>
                    </div>
                    <button onClick={saveEditor} className="ml-2 p-2 bg-sky-500 hover:bg-sky-400 rounded-xl transition-all shadow-md active:scale-95 text-white flex items-center justify-center self-center"><Check size={18} /></button>
                  </div>
                ) : <div className="text-5xl font-light tracking-widest tabular-nums drop-shadow-md">{formatTime(localTimeLeft)}</div>}
              </div>
            </div>

            {isIntervalRinging && (
              <div className="w-full my-2">
                <button onClick={stopIntervalBeep} className="w-full py-2 px-3 flex flex-col items-center justify-center gap-0.5 bg-sky-500 hover:bg-sky-400 rounded-xl animate-pulse shadow-lg active:scale-95 border border-sky-300/40">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-sky-100/90">{store.activeTaskId ? (store.taskIntervalAlertMins || 5) : (store.timerIntervalMins || 5)}m Span ({doneMins >= 60 ? Math.floor(doneMins / 60) + "h " + (doneMins % 60) + "m" : doneMins + "m"} / {(store.timerInitialMins || 0) >= 60 ? Math.floor((store.timerInitialMins || 0) / 60) + "h " + ((store.timerInitialMins || 0) % 60) + "m" : (store.timerInitialMins || 0) + "m"})</span>
                  <span className="text-base font-bold tracking-wide flex items-center gap-1 text-white"><Check size={18} strokeWidth={2.5} /> Okay</span>
                </button>
              </div>
            )}

            {store.isAlarmPlaying && (
              showContinuePrompt ? (
                <div className="flex flex-col items-center gap-3 w-full py-2">
                  <p className="text-sm font-semibold text-amber-300">Session paused (Away)</p>
                  <div className="flex gap-2 w-full">
                    <button onClick={() => { store.setIsAlarmPlaying(false); setShowResumeModal(true); }} className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 rounded-lg text-xs font-bold transition-colors">I was away</button>
                    <button onClick={() => { setShowContinuePrompt(false); store.setIsAlarmPlaying(false); }} className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors">Stop</button>
                  </div>
                </div>
              ) : <button onClick={stopAlarm} className="w-full py-2 flex items-center justify-center gap-2 bg-red-500/80 hover:bg-red-500 rounded-xl font-medium transition-colors animate-pulse"><VolumeX size={20} /> STOP TIMER</button>
            )}

            {!isIntervalRinging && !store.isAlarmPlaying && !isEditingTime && (store.timerEndAt || store.timerPausedLeft) && (
              <div className="flex justify-center gap-2">
                <Tooltip text={store.timerEndAt ? "Pause" : "Resume"} position="top">
                  <button onClick={togglePause} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors border border-white/10 shadow-sm">{store.timerEndAt ? <Pause size={20} /> : <Play size={20} />}</button>
                </Tooltip>
                <Tooltip text="Stop Timer" position="top">
                  <button onClick={handleStopClick} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors border border-white/10 shadow-sm"><Square size={20} className="fill-current" /></button>
                </Tooltip>
              </div>
            )}

            {!store.timerEndAt && !store.timerPausedLeft && localTimeLeft === 0 && !isEditingTime && !store.isAlarmPlaying && (
              <div className="flex flex-col gap-1.5 pt-1.5 border-t border-white/10">
                <div className="flex items-center gap-1.5">
                  <Tooltip text="Set target end clock time" position="top" className="flex-1">
                    <button onClick={() => setIsClockModalOpen(true)} className={`w-full border rounded-xl px-2 py-1.5 text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-inner shrink-0 truncate cursor-pointer ${highlightedField === 'clock' ? 'ring-2 ring-sky-400 border-sky-400 bg-sky-500/40 text-white shadow-[0_0_15px_rgba(56,189,248,0.8)] animate-pulse' : 'bg-white/10 hover:bg-white/20 border-white/20 hover:border-sky-400/60 text-sky-200'}`}>
                      <Clock size={13} className={highlightedField === 'clock' ? 'text-white shrink-0' : 'text-sky-300 shrink-0'} />
                      <span className="truncate tracking-wide">{selectedHr}:{selectedMin} {selectedAmPm}</span>
                    </button>
                  </Tooltip>
                  <span className="text-[10px] font-black text-white/70 uppercase px-0.5 shrink-0 select-none tracking-wider">OR</span>
                  <input type="number" placeholder="Mins" value={customMins} onChange={e => handleCustomMinsChange(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCustomStart()} className={`w-16 border rounded-xl px-1.5 py-1.5 text-xs font-black text-center outline-none transition-all placeholder:text-white/40 text-white shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none ${highlightedField === 'minutes' ? 'ring-2 ring-sky-400 border-sky-400 bg-sky-500/40 text-white shadow-[0_0_15px_rgba(56,189,248,0.8)] animate-pulse' : 'bg-white/10 border-white/20 focus:border-sky-400'}`} min="1" />
                  <Tooltip text="Start timer" position="top">
                    <button onClick={handleCustomStart} className="p-1.5 bg-sky-500 hover:bg-sky-400 rounded-lg text-white transition-all active:scale-95 shadow-md shrink-0 flex items-center justify-center border border-sky-400/30"><Play className="w-3.5 h-3.5 fill-current" /></button>
                  </Tooltip>
                </div>
              </div>
            )}

            {!store.activeTaskId && !isEditingTime && !store.isAlarmPlaying && !isIntervalRinging && (
              <div className="flex items-center justify-between gap-1 mt-2 pt-2.5 pb-2.5 px-3 -mx-3 -mb-3 bg-black/40 border-t border-white/10">
                <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => store.setIsTimerIntervalEnabled(!store.isTimerIntervalEnabled)}>
                  <BellRing size={12} className={store.isTimerIntervalEnabled ? "text-sky-400" : "text-white/40"} />
                  <span className="text-[10px] font-bold text-white/70 tracking-wide">Interval</span>
                  <button className={`relative inline-flex h-3.5 w-6 items-center rounded-full transition-colors ml-1 ${store.isTimerIntervalEnabled ? 'bg-sky-500' : 'bg-white/20'}`}>
                    <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${store.isTimerIntervalEnabled ? 'translate-x-3' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                {store.isTimerIntervalEnabled ? (
                  <div className="flex items-center gap-1">
                  <input 
                    type="number" 
                    value={store.timerIntervalMins || ''} 
                    onChange={e => store.setTimerIntervalMins(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0))} 
                    className="w-8 bg-black/50 border border-white/20 rounded px-1 py-0.5 text-[12px] text-center font-bold text-sky-300 outline-none focus:border-sky-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner" 
                    min="1" 
                  />

                    <span className="text-[12px] font-bold text-white/50 uppercase tracking-widest">Min</span>
                  </div>
                ) : <span className="text-[12px] font-bold text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wide">Beep Off</span>}
              </div>
            )}
          </div>

          {store.isAlarmPlaying && <audio ref={audioRef} src={resolvedAlarmUrl || (store.alarmSound?.startsWith('custom-audio-') ? undefined : (store.alarmSound || '/ringtones/narutoBGM.mp3'))} loop preload="none" />}
          {isIntervalRinging && <audio ref={intervalAudioRef} src={resolvedAlarmUrl || (store.alarmSound?.startsWith('custom-audio-') ? undefined : (store.alarmSound || '/ringtones/narutoBGM.mp3'))} preload="none" />}
        </div>
      </div>

      <TargetClockModal isOpen={isClockModalOpen} onClose={() => setIsClockModalOpen(false)} initialHr={selectedHr} initialMin={selectedMin} initialAmPm={selectedAmPm} onConfirm={(h: string, m: string, ampm: string) => { setSelectedHr(h); setSelectedMin(m); setSelectedAmPm(ampm); updateTargetTime(h, m, ampm); }} />

      <ConfirmationModal
        isOpen={showResumeModal}
        onClose={() => setShowResumeModal(false)}
        title="Resume Session"
        message={<div className="flex flex-col gap-2"><p className="text-white/80">You were away for an extended period of time.</p><p className="text-white">Your session paused automatically at <strong className="text-blue-300">({pausedAtString || 'your last active time'})</strong>, <strong className="text-amber-400 font-bold">no extra hours added</strong> while away.</p><p className="text-white/80 mt-2">Do you want to continue your session from exactly where you left off?</p></div>}
        confirmText="Yes, Continue" cancelText="Cancel"
        onConfirm={() => { setShowContinuePrompt(false); setShowResumeModal(false); if (store.timerPausedLeft !== null) { store.setTimerEndAt(Date.now() + store.timerPausedLeft * 1000); store.setTimerPausedLeft(null); store.setTimerDeviceId(getDeviceId()); updateInteraction(); } }}
      />

    </>
  );
}

const Column = ({ val, lbl, onUp, onDown, isPeriod, onTog }: any) => (
  <div className="flex flex-col items-center">
    <button onClick={onUp} className="p-1 hover:text-sky-400 text-white/70 active:scale-90 transition-colors"><ChevronUp size={22} /></button>
    {isPeriod ? <button onClick={onTog} className="px-2.5 py-1 my-1 text-xs font-bold rounded-lg bg-sky-500 text-white shadow-md transition-all active:scale-95">{val}</button> : <span className="text-2xl font-mono font-bold text-white my-1 tabular-nums">{val}</span>}
    <button onClick={onDown} className="p-1 hover:text-sky-400 text-white/70 active:scale-90 transition-colors"><ChevronDown size={22} /></button>
    <span className="text-[9px] font-bold text-white/40 uppercase mt-0.5">{lbl}</span>
  </div>
);

function TargetClockModal({ isOpen, onClose, initialHr, initialMin, initialAmPm, onConfirm }: any) {
  const [hr, setHr] = useState(initialHr); const [min, setMin] = useState(initialMin); const [ampm, setAmPm] = useState(initialAmPm);
  useEffect(() => { if (isOpen) { const d = new Date(); let h = d.getHours(); setAmPm(h >= 12 ? 'PM' : 'AM'); setHr((h % 12 || 12).toString().padStart(2, '0')); setMin(d.getMinutes().toString().padStart(2, '0')); } }, [isOpen]);
  if (!isOpen || typeof document === 'undefined') return null;

  const adjH = (d: number) => { let h = parseInt(hr) + d; if (h > 12) h = 1; if (h < 1) h = 12; setHr(h.toString().padStart(2, '0')); };
  const adjM = (d: number) => { let m = parseInt(min) + d; if (m > 59) m = 0; if (m < 0) m = 59; setMin(m.toString().padStart(2, '0')); };

  let h = parseInt(hr); if (ampm === 'PM' && h < 12) h += 12; if (ampm === 'AM' && h === 12) h = 0;
  const t = new Date(); t.setHours(h, parseInt(min), 0, 0); if (t < new Date()) t.setDate(t.getDate() + 1);
  const diff = Math.min(720, Math.floor((t.getTime() - Date.now()) / 60000));

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-[#121218] border border-sky-500/30 w-full max-w-xs rounded-2xl p-4 shadow-2xl text-white flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2"><Clock size={18} className="text-sky-400" /><h3 className="text-sm font-black uppercase tracking-wider text-white">Set Target End Time</h3></div>
          <button onClick={onClose} className="p-1 text-white/50 hover:text-white rounded-lg"><X size={16} /></button>
        </div>
        <div className="grid grid-cols-3 gap-2 bg-black/40 p-3 rounded-xl border border-white/10 items-center">
          <Column val={hr} lbl="Hour" onUp={() => adjH(1)} onDown={() => adjH(-1)} />
          <Column val={min} lbl="Min" onUp={() => adjM(1)} onDown={() => adjM(-1)} />
          <Column val={ampm} lbl="Period" onUp={() => setAmPm(ampm === 'AM' ? 'PM' : 'AM')} onDown={() => setAmPm(ampm === 'AM' ? 'PM' : 'AM')} isPeriod onTog={() => setAmPm(ampm === 'AM' ? 'PM' : 'AM')} />
        </div>
        <div className="text-center bg-sky-500/10 border border-sky-500/20 py-2 px-3 rounded-xl text-xs font-bold text-sky-300">Duration: {diff >= 60 ? `${Math.floor(diff/60)}h ${diff%60}m` : `${diff}m`} (Target: {hr}:{min} {ampm})</div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors">Cancel</button>
          <button onClick={() => { onConfirm(hr, min, ampm); onClose(); }} className="flex-1 py-2 bg-sky-500 hover:bg-sky-600 rounded-xl text-xs font-bold text-white shadow-lg">Set Target</button>
        </div>
      </div>
    </div>, document.body
  );
}