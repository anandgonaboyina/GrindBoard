const fs = require('fs');
const path = 'components/Timer.tsx';
let code = fs.readFileSync(path, 'utf8');

// Normalize to LF for matching, then we'll restore CRLF at end
const useCRLF = code.includes('\r\n');
const normalized = code.replace(/\r\n/g, '\n');

// ─── 1. Add state + refs ─────────────────────────────────────────────────────
const stateTarget = [
  `  const [showContinuePrompt, setShowContinuePrompt] = useState(false);`,
  `  const [showResumeModal, setShowResumeModal] = useState(false);`,
  `  const [pausedAtString, setPausedAtString] = useState<string>('');`
].join('\n');

const stateReplacement = [
  `  const [showContinuePrompt, setShowContinuePrompt] = useState(false);`,
  `  const [showResumeModal, setShowResumeModal] = useState(false);`,
  `  const [pausedAtString, setPausedAtString] = useState<string>('');`,
  `  const [showStillWorkingPrompt, setShowStillWorkingPrompt] = useState(false);`,
  ``,
  `  // Refs for 3-hour deadman switch`,
  `  const deadmanTriggeredAtRef = useRef<number | null>(null);`,
  `  const deadmanTimeoutRef = useRef<NodeJS.Timeout | null>(null);`
].join('\n');

if (!normalized.includes(stateTarget)) { console.error('State target not found'); process.exit(1); }
let patched = normalized.replace(stateTarget, stateReplacement);

// ─── 2. Replace main tick useEffect ──────────────────────────────────────────
const effectStart = `  // Main Tick Interval\n  useEffect(() => {`;
const effectEnd = `  }, [store]);\n`;

const startIdx = patched.indexOf(effectStart);
const endIdx = patched.indexOf(effectEnd, startIdx) + effectEnd.length;

if (startIdx === -1 || endIdx <= startIdx) { console.error('Effect bounds not found'); process.exit(1); }

const newEffect = `  // Main Tick Interval — specific primitives, NOT [store], to prevent restarts on unrelated state changes
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (store.timerEndAt) {
      if (!lastTickTimeRef.current || Math.abs(Date.now() - lastTickTimeRef.current) > 60000) lastTickTimeRef.current = Date.now();

      interval = setInterval(() => {
        const now = Date.now();
        const wasSleeping = (now - (lastTickTimeRef.current || now)) > 60000;
        lastTickTimeRef.current = now;
        const st = useDashboardStore.getState();
        const remaining = Math.floor((st.timerEndAt! - now) / 1000);
        const isOwner = st.timerDeviceId === getDeviceId();

        if (wasSleeping) {
          const actvMins = st.activeTaskId ? st.taskIntervalAlertMins : st.timerIntervalMins;
          if (actvMins > 0 && st.timerInitialMins) alertedChunksRef.current = Math.floor(Math.max(0, (st.timerInitialMins * 60) - remaining) / (actvMins * 60));
          return;
        }

        // 3-Hour Deadman Switch: trigger after 180 min of continuous running
        if (st.timerInitialMins && isOwner && !deadmanTriggeredAtRef.current) {
          const elapsedSecs = (st.timerInitialMins * 60) - remaining;
          if (elapsedSecs >= 180 * 60) {
            deadmanTriggeredAtRef.current = now;
            playAlarm();
            setShowStillWorkingPrompt(true);
            deadmanTimeoutRef.current = setTimeout(() => {
              const cst = useDashboardStore.getState();
              if (cst.timerInitialMins) {
                const cappedMins = Math.max(0, 180 - savedChunksRef.current * 5);
                if (cappedMins > 0) {
                  cst.addMins(getLocalDateString(), cappedMins);
                  if (cst.activeTaskId) {
                    cst.updateTaskDuration(cst.activeTaskId, cappedMins);
                    cst.incrementGroupTaskTimeSpent(cst.activeTaskId, cappedMins);
                  }
                  triggerInstantSave();
                }
              }
              cst.setTimerEndAt(null);
              cst.setTimerPausedLeft(null);
              setShowStillWorkingPrompt(false);
              deadmanTriggeredAtRef.current = null;
              stopAlarm();
            }, 5 * 60 * 1000);
            return;
          }
        }

        // While deadman prompt is showing, only visually tick
        if (deadmanTriggeredAtRef.current) {
          if (remaining > 0) setLocalTimeLeft(remaining);
          return;
        }

        if (st.timerInitialMins) {
          const elapsedSecs = (st.timerInitialMins * 60) - remaining;
          if (elapsedSecs >= 0) {
            const chunks = Math.floor(elapsedSecs / 300);
            if (chunks > savedChunksRef.current) {
              if (isOwner) {
                const diffMins = (chunks - savedChunksRef.current) * 5;
                savedChunksRef.current = chunks;
                st.addMins(getLocalDateString(), diffMins);
                if (st.activeTaskId) {
                  st.updateTaskDuration(st.activeTaskId, diffMins);
                  updateLocalTaskDuration(st.activeTaskId, diffMins);
                  st.incrementGroupTaskTimeSpent(st.activeTaskId, diffMins);
                }
                st.setTimerLastSavedChunks(chunks);
                triggerInstantSave();
              } else savedChunksRef.current = chunks;
            }

            if (remaining > 5 && !wasSleeping) {
              const isIntvActive = st.activeTaskId ? (st.isTaskIntervalAlertEnabled && st.taskIntervalAlertMins > 0) : (st.isTimerIntervalEnabled && st.timerIntervalMins > 0);
              const intvMins = st.activeTaskId ? st.taskIntervalAlertMins : st.timerIntervalMins;
              if (isIntvActive) {
                const curChunk = Math.floor(elapsedSecs / (intvMins * 60));
                if (lastIntervalAlertMinsRef.current !== intvMins || lastIsIntervalEnabledRef.current !== isIntvActive) {
                  lastIntervalAlertMinsRef.current = intvMins; lastIsIntervalEnabledRef.current = isIntvActive; alertedChunksRef.current = curChunk;
                } else if (curChunk > alertedChunksRef.current && curChunk > 0) {
                  alertedChunksRef.current = curChunk;
                  if (isOwner) {
                    st.setTimerLastAlertedChunks(curChunk);
                    if (st.enableAlarmSound || st.enableAlarmVibration) {
                      setIsIntervalRinging(true); isIntervalRingingRef.current = true; useDashboardStore.setState({ isTimerOpen: true });
                      if (st.enableAlarmVibration && typeof navigator !== 'undefined' && navigator.vibrate) try { navigator.vibrate([300, 200, 300, 200, 300]); } catch (e) {}
                      setTimeout(() => { setIsIntervalRinging(false); isIntervalRingingRef.current = false; }, (st.taskIntervalRingSecs || 1.5) * 1000);
                    }
                  }
                }
              }
            }
          }
        }

        if (remaining <= 0) {
          if (interval) clearInterval(interval);
          setLocalTimeLeft(0);
          st.setTimerEndAt(null);
          st.setTimerPausedLeft(null);
          stopIntervalBeep();

          if (isOwner && !wasSleeping) playAlarm();
          if (st.timerInitialMins && st.timerInitialMins > 0 && isOwner) {
            const finalMins = Math.max(0, st.timerInitialMins - (savedChunksRef.current * 5));
            if (finalMins > 0) {
              st.addMins(getLocalDateString(), finalMins);
              if (st.activeTaskId) {
                st.updateTaskDuration(st.activeTaskId, finalMins);
                updateLocalTaskDuration(st.activeTaskId, finalMins);
                st.incrementGroupTaskTimeSpent(st.activeTaskId, finalMins);
              }
              triggerInstantSave();
            }
            savedChunksRef.current = 0;
            fetchQuote().then(q => st.showQuotePopup(q));
          }
        } else setLocalTimeLeft(remaining);

        if (typeof window !== 'undefined') localStorage.setItem('timer_last_active', now.toString());
      }, 250);
    }
    return () => { if (interval) clearInterval(interval); };
  // Only re-create when key timer primitives change, NOT on every store update
  }, [store.timerEndAt, store.timerInitialMins, store.timerDeviceId]);
`;

patched = patched.slice(0, startIdx) + newEffect + patched.slice(endIdx);

// ─── 3. Add deadman modal before last closing fragment ────────────────────────
const closingFragment = `\n    </>\n  );\n}`;
const lastIdx = patched.lastIndexOf(closingFragment);
if (lastIdx === -1) { console.error('Closing fragment not found'); process.exit(1); }

const deadmanModal = `
      {/* 3-Hour Deadman Switch — "Are you still working?" */}
      {showStillWorkingPrompt && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-amber-500/40 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">⏳</div>
              <h3 className="text-white font-bold text-lg">Are you still working?</h3>
              <p className="text-white/60 text-sm mt-1">Timer has been running for <strong className="text-amber-400">3 hours</strong>. Just checking in!</p>
              <p className="text-white/40 text-xs mt-2">Auto-stops in 5 minutes if no response.</p>
            </div>
            <button
              onClick={() => {
                if (deadmanTimeoutRef.current) { clearTimeout(deadmanTimeoutRef.current); deadmanTimeoutRef.current = null; }
                deadmanTriggeredAtRef.current = null;
                setShowStillWorkingPrompt(false);
                stopAlarm();
              }}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all active:scale-95 text-sm"
            >
              ✅ Yes, I&apos;m here — Keep going!
            </button>
          </div>
        </div>,
        document.body
      )}`;

patched = patched.slice(0, lastIdx) + deadmanModal + patched.slice(lastIdx);

// Restore CRLF if needed
const result = useCRLF ? patched.replace(/\n/g, '\r\n') : patched;
fs.writeFileSync(path, result, 'utf8');
console.log('Timer.tsx patched successfully!');

