'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { useTaskStore, pushTasksToDB } from '@/store/taskStore';
import { useTimetableStore, pushTimetableToDB } from '@/store/timetableStore';
import { useNoteStore } from '@/store/noteStore';
import { Info, Lightbulb, UploadCloud, CalendarDays, Download, Upload, CheckSquare, Trash2 } from 'lucide-react';

interface DataBackupTabProps {
  setInfoModalKey: (key: string) => void;
  showAlertModal: (title: string, message: React.ReactNode, onConfirm?: () => void) => void;
  setConfirmModal: (modal: any) => void;
}

export default React.memo(function DataBackupTab({ setInfoModalKey, showAlertModal, setConfirmModal }: DataBackupTabProps) {
  const [isProcessingBackup, setIsProcessingBackup] = useState(false);
  const clearAllData = useDashboardStore((state) => state.clearAllData);

  const processBackupDownload = useCallback((data: any, filename: string, typeName: string) => {
    setIsProcessingBackup(true);

    setTimeout(() => {
      const isWebView2 = typeof window !== 'undefined' && ((window as any).chrome?.webview !== undefined || navigator.userAgent.includes('wv') || navigator.userAgent.includes('Lively'));

      if (isWebView2) {
        fetch('/api/download-echo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: JSON.stringify(data, null, 2),
            name: filename,
            type: typeName
          })
        }).then(res => res.json()).then(result => {
          if (result.success && result.id) {
            window.open(window.location.origin + '/download.html?apiId=' + result.id + '&type=' + encodeURIComponent(typeName), '_blank');
          } else {
            showAlertModal('Download Error', 'Failed to prepare download.');
          }
        }).catch(() => {
          const encoded = encodeURIComponent(JSON.stringify(data, null, 2));
          const url = new URL(window.location.origin + '/download.html');
          url.searchParams.set('data', encoded);
          url.searchParams.set('name', filename.replace('.json', ''));
          url.searchParams.set('type', typeName);
          window.open(url.toString(), '_blank');
        }).finally(() => {
          setIsProcessingBackup(false);
        });
      } else {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", filename);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        setIsProcessingBackup(false);
      }
    }, 50);
  }, [showAlertModal]);

  const showBackupModal = useCallback((title: string, filename: string, typeName: string, itemsDesc: string, getData: () => any) => {
    setConfirmModal({
      isOpen: true,
      title: title,
      message: (
        <div className="flex flex-col gap-3 text-sm text-white/80">
          <p>Your backup file (<code className="text-orange-300 text-xs px-1 bg-black/30 rounded">{filename}</code>) will be saved to your PC's <strong>Downloads</strong> folder.</p>
          <div className="p-2 bg-black/30 border border-white/10 rounded-lg text-xs leading-relaxed text-white/60">
            <strong>Will include:</strong> {itemsDesc}
          </div>
          {typeof window !== 'undefined' && ((window as any).chrome?.webview !== undefined || navigator.userAgent.includes('wv') || navigator.userAgent.includes('Lively')) && (
            <p className="text-[11px] text-blue-300 bg-blue-500/10 p-2 rounded mt-1 border border-blue-500/20">
              ℹ️ Since you are using Lively Wallpaper, your default browser will briefly open to process the download safely.
            </p>
          )}
        </div>
      ),
      confirmText: 'Download',
      onConfirm: () => {
        processBackupDownload(getData(), filename, typeName);
        setConfirmModal((prev: any) => ({ ...prev, isOpen: false }));
      }
    });
  }, [processBackupDownload, setConfirmModal]);

  const handleBackupPlanYourDay = useCallback(() => {
    showBackupModal(
      'Backup Plan Your Day',
      'plan_your_day_backup.json',
      'Plan Your Day Backup',
      'All your created tasks (both Today and Tomorrow), time remaining, completion times, interval duration, and task alert beep settings.',
      () => {
        const taskState = useTaskStore.getState();
        const dashboardState = useDashboardStore.getState();
        return {
          tasks: taskState.tasks || [],
          tomorrowTasks: taskState.tomorrowTasks || [],
          tasksDate: taskState.tasksDate,
          taskGroupNames: taskState.taskGroupNames || ['Core Tasks', 'Daily Routine', 'Milestones'],
          taskIntervalAlertMins: dashboardState.taskIntervalAlertMins || 10,
          taskIntervalRingSecs: dashboardState.taskIntervalRingSecs || 10,
          isTaskIntervalAlertEnabled: dashboardState.isTaskIntervalAlertEnabled || false,
        };
      }
    );
  }, [showBackupModal]);

  const handleRestorePlanYourDay = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingBackup(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const taskPayload = {
          tasks: data.tasks || [],
          tomorrowTasks: data.tomorrowTasks || [],
          tasksDate: data.tasksDate || new Date().toISOString().split('T')[0],
          taskGroupNames: data.taskGroupNames || ['Core Tasks', 'Daily Routine', 'Milestones']
        };

        useTaskStore.setState(taskPayload);
        pushTasksToDB(taskPayload);

        useDashboardStore.setState({
          taskIntervalAlertMins: data.taskIntervalAlertMins || 10,
          taskIntervalRingSecs: data.taskIntervalRingSecs || 10,
          isTaskIntervalAlertEnabled: data.isTaskIntervalAlertEnabled || false,
        });
        useDashboardStore.getState().forceInstantSave();

        showAlertModal('Data Restored', 'Plan Your Day data restored successfully!');
      } catch (err) {
        showAlertModal('Restore Failed', 'Failed to parse backup file.');
      } finally {
        setIsProcessingBackup(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [showAlertModal]);

  const handleBackupNotes = useCallback(() => {
    showBackupModal(
      'Backup Notes',
      'notes_backup.json',
      'Notes Backup',
      'All your personal notes, ideas, and saved HTML content inside the notepad.',
      () => useNoteStore.getState().notes || []
    );
  }, [showBackupModal]);

  const handleRestoreNotes = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingBackup(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data)) {
          useNoteStore.getState().setNotes(data);
          showAlertModal('Data Restored', 'Notes restored successfully!');
        } else {
          showAlertModal('Restore Failed', 'Invalid format for notes backup.');
        }
      } catch (err) {
        showAlertModal('Restore Failed', 'Failed to parse backup file.');
      } finally {
        setIsProcessingBackup(false);
        useDashboardStore.getState().forceInstantSave();
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [showAlertModal]);

  const handleBackupSettings = useCallback(() => {
    showBackupModal(
      'Backup Settings',
      'settings_backup.json',
      'Settings Backup',
      'App theme, clocks, panic mode configs, focus mode settings, quote settings, and layout visibilities (excludes heavy data like stats and histories).',
      () => {
        const state = useDashboardStore.getState();
        const EXCLUDED_KEYS = ['history', 'healthData', 'tasks', 'tomorrowTasks', 'notes', 'timetableGrid', 'timetableColors', 'stopwatchSessions', 'deadlines', 'syntheticDeadlines', 'activeTaskId'];
        const settingsData: any = {};
        Object.keys(state).forEach(key => {
          if (typeof (state as any)[key] !== 'function' && !EXCLUDED_KEYS.includes(key)) {
            settingsData[key] = (state as any)[key];
          }
        });
        return settingsData;
      }
    );
  }, [showBackupModal]);

  const handleRestoreSettings = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingBackup(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const EXCLUDED_KEYS = ['history', 'healthData', 'tasks', 'tomorrowTasks', 'notes', 'timetableGrid', 'timetableColors', 'stopwatchSessions', 'deadlines', 'syntheticDeadlines', 'activeTaskId'];
        const restoreData: any = {};
        Object.keys(data).forEach(key => {
          if (!EXCLUDED_KEYS.includes(key)) {
            restoreData[key] = data[key];
          }
        });
        useDashboardStore.setState(restoreData);
        showAlertModal('Data Restored', 'Settings restored successfully!');
      } catch (err) {
        showAlertModal('Restore Failed', 'Failed to parse backup file.');
      } finally {
        setIsProcessingBackup(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [showAlertModal]);

  const handleBackupTimetable = useCallback(() => {
    showBackupModal(
      'Backup Timetable',
      'timetable_backup.json',
      'Timetable Backup',
      'Your weekly schedule, grid layout, times, and colors.',
      () => {
        const state = useTimetableStore.getState();
        return {
          timetableGrid: state.timetableGrid,
          timetableColors: state.timetableColors,
          weekdayTimes: state.weekdayTimes,
          weekendTimes: state.weekendTimes,
          timetableStartTime: state.timetableStartTime,
          timetableWeekendStartTime: state.timetableWeekendStartTime,
        };
      }
    );
  }, [showBackupModal]);

  const handleRestoreTimetable = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingBackup(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);

        if (data.timetableGrid) {
          const restoredPayload = {
            timetableGrid: data.timetableGrid || {},
            timetableColors: data.timetableColors || {},
            weekdayTimes: data.weekdayTimes || [],
            weekendTimes: data.weekendTimes || [],
            timetableStartTime: data.timetableStartTime || 540,
            timetableWeekendStartTime: data.timetableWeekendStartTime || 540,
          };

          useTimetableStore.setState(restoredPayload);
          pushTimetableToDB(restoredPayload);

          showAlertModal('Data Restored', 'Timetable restored successfully!');
        } else {
          showAlertModal('Restore Failed', 'Invalid backup file format for Timetable.');
        }
      } catch (err) {
        showAlertModal('Restore Failed', 'Failed to parse backup file.');
      } finally {
        setIsProcessingBackup(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [showAlertModal]);

  const handleExportData = useCallback(() => {
    showBackupModal(
      'Full Dashboard Backup',
      'dashboard_full_backup.json',
      'Full Backup',
      'All your settings, tasks, timetables, statistics, history, and notes.',
      () => {
        return {
          version: 2,
          state: useDashboardStore.getState()
        };
      }
    );
  }, [showBackupModal]);

  const handleImportData = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const token = localStorage.getItem('dashboard_sync_token');
      if (!token) {
        showAlertModal('Login Required', 'You must be logged in to import data. Please login via the Connect tab.');
        e.target.value = '';
        return;
      }

      const text = await file.text();
      const parsed = JSON.parse(text);

      if (typeof parsed !== 'object' || parsed === null || !('state' in parsed)) {
        showAlertModal('Invalid Backup', 'Invalid backup file. Missing required dashboard data structure.');
        e.target.value = '';
        return;
      }

      if (parsed.state) {
        delete parsed.state.history;
        delete parsed.state.dailyTimes;
        delete parsed.state.stopwatchSessions;
        delete parsed.state.timerLastSavedChunks;
      }

      const processImportData = async (isMerge: boolean) => {
        try {
          let finalData = parsed;

          const parsedTasks = parsed.state.tasks || [];
          const parsedNotes = parsed.state.notes || [];

          if (parsedTasks.length > 0) {
            const currentTasks = isMerge ? (useTaskStore.getState().tasks || []) : [];
            useTaskStore.getState().setTasks([...currentTasks, ...parsedTasks].filter((t, i, a) => a.findIndex(x => x.id === t.id) === i));
          }
          if (parsedNotes.length > 0) {
            const currentNotes = isMerge ? (useNoteStore.getState().notes || []) : [];
            useNoteStore.getState().setNotes([...currentNotes, ...parsedNotes].filter((t, i, a) => a.findIndex(x => x.id === t.id) === i));
          }

          delete parsed.state.tasks;
          delete parsed.state.notes;
          delete parsed.state.timetableGrid;

          if (isMerge) {
            const currentState = useDashboardStore.getState();
            finalData = {
              version: parsed.version || 2,
              state: {
                ...currentState,
                ...parsed.state,
                countdowns: [...(currentState.countdowns || []), ...(parsed.state.countdowns || [])].filter((t, i, a) => a.findIndex(x => x.id === t.id) === i),
                deadlines: [...(currentState.deadlines || []), ...(parsed.state.deadlines || [])].filter((t, i, a) => a.findIndex(x => x.id === t.id) === i),
                roadmaps: [...(currentState.roadmaps || []), ...(parsed.state.roadmaps || [])].filter((t, i, a) => a.findIndex(x => x.id === t.id) === i),
              }
            };
          }

          const res = await fetch('/api/store', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ data: finalData })
          });

          if (res.ok) {
            showAlertModal('Import Successful', 'Data backup imported successfully! Reloading application...', () => window.location.reload());
          } else {
            showAlertModal('Import Failed', 'Import failed. Server rejected the data.');
          }
        } catch (err) {
          console.error(err);
          showAlertModal('Import Failed', 'Invalid JSON file format.');
        } finally {
          setIsProcessingBackup(false);
        }
      };

      setConfirmModal({
        isOpen: true,
        title: 'Restore Backup',
        message: 'Do you want to MERGE this backup with your current data?\n\n• Merge: Combine old and new data without losing existing settings.\n• Overwrite: Wipe existing data and replace it entirely with the backup.',
        confirmText: 'Merge',
        cancelText: 'Overwrite',
        onConfirm: () => processImportData(true),
        onCancel: () => processImportData(false),
      });

    } catch (err) {
      console.error(err);
      showAlertModal('Import Failed', 'Invalid JSON file format.');
      setIsProcessingBackup(false);
    }
    e.target.value = '';
  }, [showAlertModal, setConfirmModal]);

  // Optimized: Memoize the list of backup options so they don't rebuild every render
  const backupItems = useMemo(() => [
    { title: 'Global Backup', desc: 'Export/Import complete local JSON.', icon: UploadCloud, color: 'green', onBackup: handleExportData, onRestore: handleImportData },
    { title: 'Plan Your Day', desc: 'Backup/Restore tasks & time intervals.', icon: UploadCloud, color: 'pink', onBackup: handleBackupPlanYourDay, onRestore: handleRestorePlanYourDay },
    { title: 'Quick Notes', desc: 'Backup/Restore all your text notes.', icon: UploadCloud, color: 'yellow', onBackup: handleBackupNotes, onRestore: handleRestoreNotes },
    { title: 'Settings', desc: 'Backup/Restore dashboard preferences.', icon: UploadCloud, color: 'blue', onBackup: handleBackupSettings, onRestore: handleRestoreSettings },
    { title: 'Timetable', desc: 'Backup/Restore your weekly schedule.', icon: CalendarDays, color: 'violet', onBackup: handleBackupTimetable, onRestore: handleRestoreTimetable },
  ], [handleExportData, handleImportData, handleBackupPlanYourDay, handleRestorePlanYourDay, handleBackupNotes, handleRestoreNotes, handleBackupSettings, handleRestoreSettings, handleBackupTimetable, handleRestoreTimetable]);

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <div className="flex items-start justify-between gap-2 px-1">
        <div className="flex flex-col">
          <h3 className="text-sm md:text-base font-bold text-white/90">Data & Backup</h3>
          <p className="text-white/50 text-[10px] md:text-[11px] leading-snug break-words mt-0.5">Manage your local storage data safely.</p>
        </div>
        <button onClick={() => setInfoModalKey('backup')} className="hidden md:flex p-1.5 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-colors shrink-0">
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3 bg-pink-500/10 border border-blue-500/20 rounded-xl shadow-sm">
        <div className="flex items-start gap-2.5">
          <div className="bg-yellow-500/20 p-1.5 rounded-lg shrink-0 mt-0.5">
            <Lightbulb className="text-white-400 w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <h4 className="font-bold text-[11px] md:text-xs text-blue-300 break-words">Pro-Tip:  You can share your schedules!, Plan your day! or Notes together with friends!</h4>
            <p className="text-[9px] md:text-[10px] text-white/70 mt-1 leading-snug break-words">
              <strong className="text-white"> Did you know?</strong> 
              You can easily share your timetables and tasks with friends or comrades! 
              Whether you want to coordinate a study routine or sync up your holiday schedules, 
              just export your setup so they can import it and plan their day exactly like you in one click
            </p>
          </div>
        </div>
      </div>
      <div className="p-3 bg-pink-500/10 border border-blue-500/20 rounded-xl shadow-sm">
        <div className="flex items-start gap-2.5">
          <div className="bg-yellow-500/20 p-1.5 rounded-lg shrink-0 mt-0.5">
            <Lightbulb className="text-white-400 w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <h4 className="font-bold text-[11px] md:text-xs text-blue-300 break-words">Pro-Tip: Use Backup & Restore to switch schedules or Plan your day! </h4>
            <p className="text-[9px] md:text-[10px] text-white/70 mt-1 leading-snug break-words">
              <strong className="text-white"> Did you know?</strong> 
              You can use backups to completely change how you plan your day. 
              Save your current college timetable, reset, and create a brand-new routine to organize your tasks for the holidays. 
              Simply restore either backup anytime to switch your setup and track your schedule instantly!
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 md:gap-2.5 mt-1">
        {backupItems.map((item, idx) => (
          <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10 gap-3 shadow-sm hover:bg-white/[0.05] transition-colors">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className={`p-1.5 rounded-lg bg-${item.color}-500/10 text-${item.color}-400 shrink-0 mt-0.5`}>
                <item.icon className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <h4 className={`font-bold text-[11px] md:text-xs whitespace-nowrap text-${item.color}-300`}>{item.title}</h4>
                <p className="text-[9px] md:text-[10px] text-white/50 leading-snug break-words mt-0.5">{item.desc}</p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto mt-1 sm:mt-0">
              <button
                onClick={item.onBackup}
                disabled={isProcessingBackup}
                className="flex-1 sm:flex-none justify-center px-3 py-2 bg-black/40 hover:bg-black/60 rounded-lg text-[9px] md:text-[10px] font-bold border border-white/10 flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-inner"
              >
                <Download className="w-3.5 h-3.5 text-white/60" /> {isProcessingBackup ? '...' : 'Backup'}
              </button>
              <label className={`flex-1 sm:flex-none justify-center px-3 py-2 bg-${item.color}-500/10 hover:bg-${item.color}-500/20 text-${item.color}-200 rounded-lg text-[9px] md:text-[10px] font-bold border border-${item.color}-500/20 flex items-center gap-1.5 transition-all shadow-sm ${isProcessingBackup ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                <Upload className="w-3.5 h-3.5" /> {isProcessingBackup ? '...' : 'Restore'}
                <input type="file" className="hidden" accept=".json" onChange={(e) => { setIsProcessingBackup(true); item.onRestore(e); }} disabled={isProcessingBackup} />
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="my-1 border-t border-white/5" />

      {/* Dangerous Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 gap-3 shadow-sm">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 shrink-0 mt-0.5">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <h4 className="font-bold text-[11px] md:text-xs text-orange-300 break-words">Clear Tasks & Plans</h4>
            <p className="text-[9px] md:text-[10px] text-white/50 leading-snug break-words mt-0.5">Instantly delete all tasks and plans globally.</p>
          </div>
        </div>
        <button
          onClick={() => {
            setConfirmModal({
              isOpen: true,
              title: 'Clear Tasks & Plans',
              message: 'Are you sure you want to completely clear all your tasks, tomorrow tasks, and plans? This action will permanently remove them from the cloud and cannot be undone.',
              isDestructive: true,
              onConfirm: () => {
                useTaskStore.setState({ tasks: [], tomorrowTasks: [] });
                pushTasksToDB({ tasks: [], tomorrowTasks: [] });
                useDashboardStore.getState().forceInstantSave();
                showAlertModal('Cleared Successfully', 'All tasks and plans have been deleted. Refreshing...');
              }
            });
          }}
          className="w-full sm:w-auto justify-center px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 rounded-lg text-[10px] font-bold border border-orange-500/40 flex items-center gap-1.5 whitespace-nowrap transition-colors shadow-sm"
        >
          Clear Tasks
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 gap-3 shadow-sm">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 shrink-0 mt-0.5">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <h4 className="font-bold text-[11px] md:text-xs text-purple-300 break-words">Reset Timetable</h4>
            <p className="text-[9px] md:text-[10px] text-white/50 leading-snug break-words mt-0.5">Wipe existing schedule and colors to defaults.</p>
          </div>
        </div>
        <button
          onClick={() => {
            setConfirmModal({
              isOpen: true,
              title: 'Reset Timetable',
              message: 'Are you sure you want to completely reset your Timetable to default? This cannot be undone.',
              isDestructive: true,
              onConfirm: () => {
                useTimetableStore.getState().resetTimetable();
                showAlertModal('Reset Complete', 'Timetable reset successfully');
              }
            });
          }}
          className="w-full sm:w-auto justify-center px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 rounded-lg text-[10px] font-bold border border-purple-500/40 flex items-center gap-1.5 whitespace-nowrap transition-colors shadow-sm"
        >
          Reset Schedule
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/20 gap-3 shadow-sm mt-1">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400 shrink-0 mt-0.5">
            <Trash2 className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <h4 className="font-bold text-[11px] md:text-xs text-red-400 break-words">Factory Reset Profile</h4>
            <p className="text-[9px] md:text-[10px] text-red-200/60 leading-snug break-words mt-0.5">Delete ALL tasks, notes, and history permanently.</p>
          </div>
        </div>
        <button
          onClick={() => {
            setConfirmModal({
              isOpen: true,
              title: 'Factory Reset Profile',
              message: 'Are you absolutely sure you want to delete all tasks, notes, history, and settings? This action cannot be undone.',
              requireText: 'delete all',
              isDestructive: true,
              onConfirm: async () => {
                await clearAllData();
              }
            });
          }}
          className="w-full sm:w-auto justify-center px-4 py-2 bg-red-600/30 hover:bg-red-600 text-white rounded-lg text-[10px] font-bold border border-red-500/50 flex items-center gap-1.5 whitespace-nowrap transition-all shadow-md active:scale-95"
        >
          <Trash2 className="w-3.5 h-3.5" /> Reset Everything
        </button>
      </div>
    </div>
  );
});