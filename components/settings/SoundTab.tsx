'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { Info, Music, Play, Pause, Upload, Trash2, Volume2, Bell, Vibrate, Clock } from 'lucide-react';
import { saveAudioToDB, deleteAudioFromDB } from '@/lib/indexedDB';
import { getResolvedAudioUrl } from '@/hooks/useAudioUrl';
import ScrollableWithArrows from '../ScrollableWithArrows';

const DEFAULT_ALARM_SOUNDS = [
  { id: 'naruto', name: 'Naruto BGM (Default)', url: '/ringtones/narutoBGM.mp3' },
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
    <div className="flex flex-col gap-3 md:gap-4 h-full pb-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-1">
        <div className="flex flex-col">
          <h3 className="text-sm md:text-base font-bold text-white tracking-tight">Sound Settings</h3>
          <p className="text-white/50 text-[10px] md:text-[11px] leading-snug break-words mt-0.5">Configure audio ringtones, alarm durations, and focus interval beeps.</p>
        </div>
        <button onClick={() => setInfoModalKey('sound')} className="hidden md:flex p-1.5 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-all hover:scale-105 shrink-0 shadow-sm">
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {/* SECTION 1: DEFAULT ALARM RINGTONES */}
        <div className="flex flex-col gap-1.5 p-2 md:p-2.5 rounded-xl bg-white/[0.02] border border-white/10 shadow-sm">
          <div className="flex items-center justify-between px-1 pb-1.5 border-b border-white/5 gap-2">
            <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-blue-400 flex items-center gap-1.5 break-words">
              <Music className="w-3.5 h-3.5" /> Default Ringtones
            </h4>
            <span className="text-[8px] md:text-[9px] text-white/30 italic break-words text-right">Drag to scroll</span>
          </div>

          <div className="h-[26vh] md:h-48 rounded-lg bg-black/30 border border-white/5 overflow-hidden relative mt-0.5">
            <ScrollableWithArrows className="p-1.5 flex flex-col gap-1" downArrowOffset="bottom-2">
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
                    className={`group flex items-center justify-between p-2 md:p-2.5 rounded-lg border transition-all select-none cursor-pointer ${isActive
                        ? 'bg-blue-600/10 border-blue-500/40 text-blue-50 shadow-sm'
                        : 'bg-black/20 border-transparent hover:bg-white/5 text-white/70 hover:text-white'
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2 flex-1">
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${isActive ? 'border-blue-400 bg-blue-500/20' : 'border-white/20 group-hover:border-white/40'}`}>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[10px] md:text-[11px] font-bold break-words leading-tight truncate">{sound.name}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePreviewAudio(sound.url);
                      }}
                      className={`p-1.5 md:p-2 rounded-lg border transition-all shrink-0 flex items-center justify-center cursor-pointer ${isPreviewing ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80 hover:text-white'}`}
                    >
                      {isPreviewing ? <Pause className="w-3 h-3 animate-pulse" /> : <Play className="w-3 h-3" />}
                    </button>
                  </div>
                );
              })}
            </ScrollableWithArrows>
          </div>
        </div>

        {/* SECTION 2: CUSTOM RINGTONES */}
        <div className="flex flex-col gap-1.5 p-2 md:p-2.5 rounded-xl bg-white/[0.02] border border-white/10 shadow-sm">
          <div className="flex items-center justify-between px-1 pb-1.5 border-b border-white/5 gap-2">
            <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-purple-400 flex items-center gap-1.5 break-words">
              <Upload className="w-3.5 h-3.5" /> Custom Ringtones
            </h4>

            <input type="file" ref={audioFileInputRef} onChange={handleAudioUpload} accept="audio/*" className="hidden" />

            <button
              type="button"
              onClick={() => audioFileInputRef.current?.click()}
              disabled={(customAlarmSounds || []).length >= 3}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[9px] md:text-[10px] font-bold transition-all border shrink-0 cursor-pointer ${(customAlarmSounds || []).length >= 3
                  ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                  : 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-purple-300 hover:text-white hover:scale-105 active:scale-95'
                }`}
            >
              <Upload className="w-3 h-3" />
              <span>Upload ({(customAlarmSounds || []).length}/3)</span>
            </button>
          </div>

          <div className="flex flex-col gap-1 mt-0.5">
            {(customAlarmSounds || []).length === 0 ? (
              <div className="p-4 text-center border border-dashed border-white/10 rounded-lg text-white/40 text-[9px] md:text-[10px] bg-black/20 break-words font-medium">
                No custom ringtones uploaded yet. Max 3 files.
              </div>
            ) : (
              (customAlarmSounds || []).map((sound) => {
                const isActive = alarmSound === sound.url;
                const isPreviewing = previewingAudioUrl === sound.url;
                return (
                  <div
                    key={sound.id}
                    className={`group flex items-center justify-between p-2 md:p-2.5 rounded-lg border transition-all ${isActive
                        ? 'bg-purple-500/10 border-purple-500/40 shadow-sm'
                        : 'bg-black/20 border-white/5 hover:border-white/10 hover:bg-black/40'
                      }`}
                  >
                    <div
                      className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 pr-2"
                      onClick={() => {
                        stopPreviewAudio();
                        setAlarmSound(sound.url);
                      }}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${isActive ? 'border-purple-400 bg-purple-500/20' : 'border-white/20 group-hover:border-white/40'}`}>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-[10px] md:text-[11px] font-bold break-words leading-tight truncate ${isActive ? 'text-purple-100' : 'text-white/80'}`}>{sound.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleTogglePreviewAudio(sound.url)}
                        className={`p-1.5 md:p-2 rounded-lg border transition-all cursor-pointer ${isPreviewing ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80 hover:text-white'}`}
                      >
                        {isPreviewing ? <Pause className="w-3 h-3 animate-pulse" /> : <Play className="w-3 h-3" />}
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
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SECTION 3: ALARM DURATION & SOUND TOGGLES */}
        <div className="flex flex-col gap-1.5 p-2 md:p-2.5 rounded-xl bg-white/[0.02] border border-white/10 shadow-sm">
          <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5 px-1 pb-1.5 border-b border-white/5">
            <Volume2 className="w-3.5 h-3.5" /> Alarm & Duration
          </h4>

          <div className="flex flex-col gap-1 mt-0.5">
            {/* Auto Stop Timer */}
            <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-black/30 border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col min-w-0">
                  <label className="text-[10px] md:text-[11px] font-bold text-white/90 break-words flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-amber-400" /> Auto Stop Timer
                  </label>
                  <p className="text-[9px] text-white/50 leading-snug break-words mt-0.5">How long the alarm rings before stopping.</p>
                </div>
                
                {/* Custom Numeric Input combined with Badge styling */}
                <div className="flex items-center bg-amber-500/10 border border-amber-500/30 rounded-md overflow-hidden focus-within:border-amber-400/80 transition-colors shrink-0">
                  <input
                    type="number"
                    value={alarmDurationSecs === undefined ? 60 : alarmDurationSecs}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setAlarmDurationSecs(isNaN(val) ? 0 : val);
                    }}
                    onBlur={(e) => {
                      let val = parseInt(e.target.value);
                      if (isNaN(val) || val < 5) setAlarmDurationSecs(5);
                      else if (val > 120) setAlarmDurationSecs(120);
                    }}
                    className="w-8 h-6 bg-transparent text-[10px] md:text-[11px] text-amber-300 font-mono font-bold text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[9px] text-amber-500 font-bold font-mono pr-1.5 select-none">s</span>
                </div>
              </div>
              <input
                type="range" min="5" max="120" step="5"
                value={alarmDurationSecs || 60}
                onChange={(e) => setAlarmDurationSecs(parseInt(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <div className="flex justify-between text-[8px] md:text-[9px] font-bold text-white/30 px-1">
                <span>5s</span><span>60s</span><span>120s</span>
              </div>
            </div>

            {/* Enable Sound */}
            <div className="group flex flex-row items-center justify-between p-2.5 rounded-lg bg-black/30 border border-white/5 gap-3 hover:border-white/10 transition-colors cursor-pointer" onClick={() => setEnableAlarmSound(!enableAlarmSound)}>
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <Music className={`w-3.5 h-3.5 shrink-0 transition-colors ${enableAlarmSound ? 'text-blue-400' : 'text-white/30 group-hover:text-white/50'}`} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] md:text-[11px] font-bold text-white/90 break-words">Enable Alarm Sound</span>
                  <p className="text-[9px] text-white/50 leading-snug break-words">Play ringtone when timer completes.</p>
                </div>
              </div>
              <button className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors shrink-0 outline-none ${enableAlarmSound ? 'bg-blue-500' : 'bg-white/10 group-hover:bg-white/20'}`}>
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${enableAlarmSound ? 'translate-x-4' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Enable Vibrate */}
            <div className="group flex flex-row items-center justify-between p-2.5 rounded-lg bg-black/30 border border-white/5 gap-3 hover:border-white/10 transition-colors cursor-pointer" onClick={() => setEnableAlarmVibration(!enableAlarmVibration)}>
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <Vibrate className={`w-3.5 h-3.5 shrink-0 transition-colors ${enableAlarmVibration ? 'text-blue-400' : 'text-white/30 group-hover:text-white/50'}`} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] md:text-[11px] font-bold text-white/90 break-words">Enable Device Vibration</span>
                  <p className="text-[9px] text-white/50 leading-snug break-words">Vibrate supported devices on timer end.</p>
                </div>
              </div>
              <button className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors shrink-0 outline-none ${enableAlarmVibration ? 'bg-blue-500' : 'bg-white/10 group-hover:bg-white/20'}`}>
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${enableAlarmVibration ? 'translate-x-4' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 4: TASK TIMER INTERVAL ALERTS */}
        <div className="flex flex-col gap-1.5 p-2 md:p-2.5 rounded-xl bg-white/[0.02] border border-white/10 shadow-sm">
          <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5 px-1 pb-1.5 border-b border-white/5">
            <Bell className="w-3.5 h-3.5" /> Interval Focus Beeps
          </h4>

          <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-black/30 border border-white/5 hover:border-white/10 transition-colors mt-0.5">
            
            {/* Alert Frequency */}
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col min-w-0">
                  <label className="text-[10px] md:text-[11px] font-bold text-white/90 break-words">Alert Frequency</label>
                  <p className="text-[9px] text-white/50 leading-snug break-words mt-0.5">Plays a short beep every X mins during active tasks.</p>
                </div>
                
                {/* Custom Numeric Input */}
                <div className="flex items-center bg-cyan-500/10 border border-cyan-500/30 rounded-md overflow-hidden focus-within:border-cyan-400/80 transition-colors shrink-0">
                  <input
                    type="number"
                    value={taskIntervalAlertMins === undefined ? 10 : taskIntervalAlertMins}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setTaskIntervalAlertMins(isNaN(val) ? 0 : val);
                    }}
                    onBlur={(e) => {
                      let val = parseInt(e.target.value);
                      if (isNaN(val) || val < 1) setTaskIntervalAlertMins(1);
                      else if (val > 60) setTaskIntervalAlertMins(60);
                    }}
                    className="w-7 h-6 bg-transparent text-[10px] md:text-[11px] text-cyan-300 font-mono font-bold text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[9px] text-cyan-500 font-bold font-mono pr-1.5 select-none">m</span>
                </div>
              </div>
              
              <input
                type="range" min="1" max="60" step="1"
                value={taskIntervalAlertMins || 10}
                onChange={(e) => setTaskIntervalAlertMins(parseInt(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[8px] md:text-[9px] font-bold text-white/30 px-1">
                <span>1m</span><span>30m</span><span>60m</span>
              </div>
            </div>

            <div className="h-px bg-white/5 w-full my-1.5" />

            {/* Beep Duration */}
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col min-w-0">
                  <label className="text-[10px] md:text-[11px] font-bold text-white/90 break-words">Beep Duration</label>
                  <p className="text-[9px] text-white/50 leading-snug break-words mt-0.5">How long the interval rings before stopping.</p>
                </div>
                
                {/* Custom Numeric Input */}
                <div className="flex items-center bg-cyan-500/10 border border-cyan-500/30 rounded-md overflow-hidden focus-within:border-cyan-400/80 transition-colors shrink-0">
                  <input
                    type="number"
                    value={taskIntervalRingSecs === undefined ? 10 : taskIntervalRingSecs}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setTaskIntervalRingSecs(isNaN(val) ? 0 : val);
                    }}
                    onBlur={(e) => {
                      let val = parseInt(e.target.value);
                      if (isNaN(val) || val < 1) setTaskIntervalRingSecs(1);
                      else if (val > 30) setTaskIntervalRingSecs(30);
                    }}
                    className="w-7 h-6 bg-transparent text-[10px] md:text-[11px] text-cyan-300 font-mono font-bold text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[9px] text-cyan-500 font-bold font-mono pr-1.5 select-none">s</span>
                </div>
              </div>
              
              <input
                type="range" min="1" max="30" step="1"
                value={taskIntervalRingSecs || 10}
                onChange={(e) => setTaskIntervalRingSecs(parseInt(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[8px] md:text-[9px] font-bold text-white/30 px-1">
                <span>1s</span><span>15s</span><span>30s</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
});