'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { Info, Music, Play, Pause, Upload, Trash2, Volume2, Bell } from 'lucide-react';
import { saveAudioToDB, deleteAudioFromDB } from '@/lib/indexedDB';
import { getResolvedAudioUrl } from '@/hooks/useAudioUrl';
import ScrollableWithArrows from '../ScrollableWithArrows';

const DEFAULT_ALARM_SOUNDS = [
  { id: 'naruto', name: 'naruto BGM ( default )', url: '/ringtones/narutoBGM.mp3' },
  { id: 'demonslayer', name: 'Demon Slayer', url: '/ringtones/Demon Slayer.mp3' },
  { id: 'fightsong', name: 'Fight Song', url: '/ringtones/Fight Song.mp3' },
  { id: 'heartbroken', name: 'Heart broken', url: '/ringtones/Heart broken.mp3' },
  { id: 'moneyheist', name: 'Moneyheist', url: '/ringtones/Moneyheist.mp3' },
  { id: 'onmyway', name: 'On My Way', url: '/ringtones/On My Way.mp3' },
  { id: 'unstoppable', name: 'Unstoppable', url: '/ringtones/Unstoppable.mp3' },
];

interface SoundTabProps {
  setInfoModalKey: (key: string) => void;
  showAlertModal: (title: string, message: React.ReactNode, onConfirm?: () => void) => void;
}

export default React.memo(function SoundTab({ setInfoModalKey, showAlertModal }: SoundTabProps) {
  const {
    alarmSound, setAlarmSound,
    customAlarmSounds, addCustomAlarmSound, deleteCustomAlarmSound,
    alarmDurationSecs, setAlarmDurationSecs,
    alarmVolume, setAlarmVolume,
    enableAlarmSound, setEnableAlarmSound,
    enableAlarmVibration, setEnableAlarmVibration,
    taskIntervalAlertMins, setTaskIntervalAlertMins,
    taskIntervalRingSecs, setTaskIntervalRingSecs
  } = useDashboardStore();

  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const [previewingAudioUrl, setPreviewingAudioUrl] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopPreviewAudio = () => {
    if (previewAudioRef.current) {
      try {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
        previewAudioRef.current.removeAttribute('src');
        previewAudioRef.current.load();
      } catch (e) { }
      previewAudioRef.current = null;
    }
    setPreviewingAudioUrl(null);
  };

  const handleTogglePreviewAudio = async (url: string) => {
    if (previewingAudioUrl === url) {
      stopPreviewAudio();
    } else {
      stopPreviewAudio();
      const resolvedUrl = await getResolvedAudioUrl(url);
      const audio = new Audio(resolvedUrl);
      const vol = alarmVolume !== undefined ? alarmVolume : 1;
      audio.volume = vol > 1 ? vol / 100 : vol;
      audio.onended = () => stopPreviewAudio();
      audio.onerror = () => stopPreviewAudio();
      audio.play().catch(e => {
        console.error("Audio preview error:", e);
        stopPreviewAudio();
      });
      previewAudioRef.current = audio;
      setPreviewingAudioUrl(url);
    }
  };

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      stopPreviewAudio();
    };
  }, []);

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if ((customAlarmSounds || []).length >= 3) {
      showAlertModal('Limit Reached', 'Maximum 3 custom ringtones allowed. Please delete an existing custom ringtone first.');
      return;
    }

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
      showAlertModal('Invalid File', 'Please select a valid audio file (MP3, WAV, OGG, M4A).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showAlertModal('File Too Large', 'Please select an audio file under 10MB.');
      return;
    }

    const audioKey = 'custom-audio-' + Date.now();
    await saveAudioToDB(audioKey, file);
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    addCustomAlarmSound(nameWithoutExt, audioKey);

    if (e.target) {
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <div className="flex items-start justify-between gap-2 px-1">
        <div className="flex flex-col">
          <h3 className="text-sm md:text-base font-bold text-white/90">Sound Settings</h3>
          <p className="text-white/50 text-[10px] md:text-[11px] leading-snug break-words mt-0.5">Configure audio ringtones, alarm durations, and focus interval beeps.</p>
        </div>
        <button onClick={() => setInfoModalKey('sound')} className="hidden md:flex p-1.5 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-colors shrink-0">
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {/* SECTION 1: DEFAULT ALARM RINGTONES */}
        <div className="flex flex-col gap-2 p-2.5 md:p-3 rounded-xl bg-white/[0.03] border border-white/10 shadow-sm">
          <div className="flex items-center justify-between px-1 pb-1 border-b border-white/5 gap-2">
            <h4 className="text-[10px] md:text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5 break-words">
              <Music className="w-3.5 h-3.5" /> Default Ringtones
            </h4>
            <span className="text-[8px] md:text-[9px] text-white/40 italic break-words text-right">Drag to scroll</span>
          </div>

          <div className="h-[28vh] md:h-52 rounded-xl bg-black/40 border border-white/10 overflow-hidden relative mt-1">
            <ScrollableWithArrows className="p-1.5 flex flex-col gap-1.5" downArrowOffset="bottom-2">
              {DEFAULT_ALARM_SOUNDS.map((sound) => {
                const isActive = alarmSound === sound.url || (sound.url === '/ringtones/narutoBGM.mp3' && alarmSound === '/ringtones/alarm.mp3');
                const isPreviewing = previewingAudioUrl === sound.url;

                return (
                  <div
                    key={sound.id}
                    onClick={() => {
                      stopPreviewAudio();
                      setAlarmSound(sound.url);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-all select-none cursor-pointer ${isActive
                        ? 'bg-blue-600/20 border-blue-500/50 text-white shadow-sm'
                        : 'bg-white/5 border-transparent hover:bg-white/10 text-white/80 hover:text-white'
                      }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 pr-2 flex-1">
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${isActive ? 'border-blue-400 bg-blue-500/30' : 'border-white/30'}`}>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[10px] md:text-xs font-bold break-words leading-tight">{sound.name}</span>
                        {isActive && <span className="text-[8px] md:text-[9px] text-blue-300 font-bold uppercase tracking-wider mt-0.5">Active Default</span>}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePreviewAudio(sound.url);
                      }}
                      className="p-1.5 md:p-2 rounded-lg bg-black/40 hover:bg-black/60 border border-white/10 text-white/80 hover:text-white transition-colors shrink-0 flex items-center justify-center cursor-pointer"
                    >
                      {isPreviewing ? <Pause className="w-3.5 h-3.5 text-yellow-300 animate-pulse" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                );
              })}
            </ScrollableWithArrows>
          </div>
        </div>

        {/* SECTION 2: CUSTOM RINGTONES */}
        <div className="flex flex-col gap-2 p-2.5 md:p-3 rounded-xl bg-white/[0.03] border border-white/10 shadow-sm">
          <div className="flex items-center justify-between px-1 pb-1 border-b border-white/5 gap-2">
            <h4 className="text-[10px] md:text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5 break-words">
              <Upload className="w-3.5 h-3.5" /> Custom Ringtones
            </h4>

            <input type="file" ref={audioFileInputRef} onChange={handleAudioUpload} accept="audio/*" className="hidden" />

            <button
              type="button"
              onClick={() => audioFileInputRef.current?.click()}
              disabled={(customAlarmSounds || []).length >= 3}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[9px] md:text-[10px] font-bold transition-all border shrink-0 cursor-pointer ${(customAlarmSounds || []).length >= 3
                  ? 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-purple-600/20 hover:bg-purple-600/40 border-purple-500/40 text-purple-200 hover:text-white'
                }`}
            >
              <Upload className="w-3 h-3" />
              <span>Upload ({(customAlarmSounds || []).length}/3)</span>
            </button>
          </div>

          <div className="flex flex-col gap-1.5 mt-1">
            {(customAlarmSounds || []).length === 0 ? (
              <div className="p-4 text-center border border-dashed border-white/10 rounded-xl text-white/40 text-[10px] md:text-xs bg-black/20 break-words">
                No custom ringtones uploaded yet. Max 3 files.
              </div>
            ) : (
              (customAlarmSounds || []).map((sound) => {
                const isActive = alarmSound === sound.url;
                const isPreviewing = previewingAudioUrl === sound.url;
                return (
                  <div
                    key={sound.id}
                    className={`flex items-center justify-between p-2 md:p-2.5 rounded-xl border transition-all ${isActive
                        ? 'bg-purple-500/10 border-purple-500/40 shadow-sm'
                        : 'bg-black/40 border-white/5 hover:border-white/10 hover:bg-black/60'
                      }`}
                  >
                    <div
                      className="flex items-start gap-2.5 cursor-pointer flex-1 min-w-0 pr-2"
                      onClick={() => {
                        stopPreviewAudio();
                        setAlarmSound(sound.url);
                      }}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${isActive ? 'border-purple-400 bg-purple-500/30' : 'border-white/30'}`}>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] md:text-[11px] font-bold break-words leading-tight text-white/90">{sound.name}</span>
                        {isActive && <span className="text-[8px] md:text-[9px] text-purple-300 font-bold uppercase tracking-wider mt-0.5">Active Custom</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleTogglePreviewAudio(sound.url)}
                        className="p-1.5 md:p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
                      >
                        {isPreviewing ? <Pause className="w-3.5 h-3.5 text-yellow-300 animate-pulse" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          stopPreviewAudio();
                          if (sound.url.startsWith('custom-audio-')) {
                            deleteAudioFromDB(sound.url);
                          }
                          deleteCustomAlarmSound(sound.id);
                        }}
                        className="p-1.5 md:p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SECTION 3: ALARM DURATION & SOUND TOGGLES */}
        <div className="flex flex-col gap-2 p-2.5 md:p-3 rounded-xl bg-white/[0.03] border border-white/10 shadow-sm">
          <h4 className="text-[10px] md:text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5 px-1 pb-1 border-b border-white/5">
            <Volume2 className="w-3.5 h-3.5" /> Alarm Duration & Toggles
          </h4>

          <div className="flex flex-col gap-1.5 mt-1">
            {/* Auto Stop Timer */}
            <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-black/40 border border-white/5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col min-w-0">
                  <label className="text-[11px] md:text-xs font-bold text-white/90 break-words">Auto Stop Timer</label>
                  <p className="text-[9px] md:text-[10px] text-white/50 leading-snug break-words mt-0.5">How long the alarm rings before stopping automatically.</p>
                </div>
                <span className="text-[9px] md:text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">{alarmDurationSecs}s</span>
              </div>
              <input
                type="range" min="5" max="120" step="5"
                value={alarmDurationSecs || 60}
                onChange={(e) => setAlarmDurationSecs(parseInt(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <div className="flex justify-between text-[8px] md:text-[9px] font-bold text-white/40">
                <span>5s</span><span>60s</span><span>120s</span>
              </div>
            </div>

            {/* Enable Sound */}
            <div className="flex flex-row items-start sm:items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 gap-3">
              <div className="flex flex-col pr-2 min-w-0">
                <span className="text-[11px] md:text-xs font-bold text-white/90 break-words">Enable Alarm Sound</span>
                <p className="text-[9px] md:text-[10px] text-white/50 leading-snug break-words mt-0.5">Play ringtone when timer completes.</p>
              </div>
              <button onClick={() => setEnableAlarmSound(!enableAlarmSound)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${enableAlarmSound ? 'bg-blue-500' : 'bg-white/20'}`}>
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${enableAlarmSound ? 'translate-x-4.5' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Enable Vibrate */}
            <div className="flex flex-row items-start sm:items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 gap-3">
              <div className="flex flex-col pr-2 min-w-0">
                <span className="text-[11px] md:text-xs font-bold text-white/90 break-words">Enable Device Vibration</span>
                <p className="text-[9px] md:text-[10px] text-white/50 leading-snug break-words mt-0.5">Vibrate supported devices on timer end.</p>
              </div>
              <button onClick={() => setEnableAlarmVibration(!enableAlarmVibration)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${enableAlarmVibration ? 'bg-blue-500' : 'bg-white/20'}`}>
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${enableAlarmVibration ? 'translate-x-4.5' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 4: TASK TIMER INTERVAL ALERTS */}
        <div className="flex flex-col gap-2 p-2.5 md:p-3 rounded-xl bg-white/[0.03] border border-white/10 shadow-sm">
          <h4 className="text-[10px] md:text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 px-1 pb-1 border-b border-white/5">
            <Bell className="w-3.5 h-3.5" /> Interval Focus Beeps
          </h4>

          <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-black/40 border border-white/5 mt-1">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col min-w-0">
                <label className="text-[11px] md:text-xs font-bold text-white/90 break-words">Alert Frequency</label>
                <p className="text-[9px] md:text-[10px] text-white/50 leading-snug break-words mt-0.5">Plays a short beep every X mins during active tasks.</p>
              </div>
              <span className="text-[9px] md:text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">{taskIntervalAlertMins}m</span>
            </div>
            <input
              type="range" min="1" max="60" step="1"
              value={taskIntervalAlertMins || 10}
              onChange={(e) => setTaskIntervalAlertMins(parseInt(e.target.value))}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-1"
            />
            <div className="flex justify-between text-[8px] md:text-[9px] font-bold text-white/40">
              <span>1m</span><span>30m</span><span>60m</span>
            </div>

            <div className="h-px bg-white/10 w-full my-1.5" />

            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col min-w-0">
                <label className="text-[11px] md:text-xs font-bold text-white/90 break-words">Beep Duration</label>
                <p className="text-[9px] md:text-[10px] text-white/50 leading-snug break-words mt-0.5">How long the interval rings before stopping.</p>
              </div>
              <span className="text-[9px] md:text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">{taskIntervalRingSecs}s</span>
            </div>
            <input
              type="range" min="1" max="30" step="1"
              value={taskIntervalRingSecs || 10}
              onChange={(e) => setTaskIntervalRingSecs(parseInt(e.target.value))}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-1"
            />
            <div className="flex justify-between text-[8px] md:text-[9px] font-bold text-white/40">
              <span>1s</span><span>15s</span><span>30s</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
});