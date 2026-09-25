import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';


const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

const authenticate = (request: Request) => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
    return decoded;
  } catch (err) {
    return null;
  }
};

function mergeArraysByIdServer(incoming: any[] = [], existing: any[] = []) {
  if (!Array.isArray(incoming)) incoming = [];
  if (!Array.isArray(existing)) existing = [];
  if (incoming.length === 0) return existing;
  if (existing.length === 0) return incoming;

  const map = new Map();
  existing.forEach(item => {
    if (item && item.id !== undefined) map.set(item.id, item);
  });
  incoming.forEach(item => {
    if (item && item.id !== undefined) {
      const prev = map.get(item.id);
      map.set(item.id, prev ? { ...prev, ...item } : item);
    }
  });
  return Array.from(map.values());
}

const TIMETABLE_KEYS = ['timetableGrid', 'timetableColors', 'weekdayTimes', 'weekendTimes', 'timetableStartTime', 'timetableWeekendStartTime'];

const SETTING_ARRAY_KEYS = [
  'customDesktopWallpapers', 'customMobileWallpapers', 'hiddenWallpapers',
  'activeDesktopCustomIndex', 'activeMobileCustomIndex', 'customLocalWallpaperName',
  'widgetOffsets', 'clockOffsets', 'lockedWidgets',
  'panicWallpaperSwitch', 'enableAlarmSound', 'enableAlarmVibration', 'enablePanicButton',
  'manifestationDesktopPhotos', 'manifestationMobilePhotos',
  'activeManifestationDesktopIndex', 'activeManifestationMobileIndex',
  'manifestationCustomQuotes', 'customQuotes', 'customAlarmSounds',
  'showManifestationBoard', 'hasSeenOnboarding',
  'hideConfig', 'mobileHideConfig', 'panicButtonMode', 'panicShortcutKey', 'focusShortcutKey',
  'selectedSound', 'alarmVolume', 'dashboardScale', 'mobileDashboardScale', 'dockScale',
  'dockOffset', 'rightWidgetsOffset', 'enableRightToolbarPeek', 'autoOpenCountdowns',
  'activeTheme', 'clockStyle', 'fontFamily', 'soundEffectVolume', 'currentBgType',
  'selectedLocalWallpaperName',
  ...TIMETABLE_KEYS
];

const TASK_KEYS = ['tasks', 'tomorrowTasks', 'tasksDate', 'taskGroupNames', 'plans'];
const COUNTDOWN_KEYS = ['countdowns'];
const DEADLINE_KEYS = ['deadlines', 'syntheticDeadlines', 'deadlineAlertDays', 'dismissedDeadlineAlerts', 'disableDeadlineLockOnToday', 'hideYouInLeaderboard'];
const STATS_KEYS = ['history', 'stopwatchSessions'];
const DAILY_ROUTINE_KEYS = ['dailyTimes'];

export async function GET(request: Request) {
  try {
    const user = authenticate(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const localModified = parseInt(url.searchParams.get('localModified') || '0', 10);

    const client = await clientPromise;
    const db = client.db();

    // PHASE 1: LIGHTWEIGHT HEAD CHECK
    // Only fetch the 'lastModified' field. This uses indexes and returns kilobytes of data instead of megabytes.
    const projectionOnlyLastModified = { projection: { lastModified: 1 } };
    
    const [
      existingMeta, notesMeta, settingsMeta, tasksMeta, roadmapsMeta, 
      statsMeta, dailyRoutineMeta, timetableMeta, deadlinesMeta, countdownsMeta
    ] = await Promise.all([
      db.collection('DashboardStorage').findOne({ userId: user.userId }, projectionOnlyLastModified),
      db.collection('Notes').findOne({ userId: user.userId }, projectionOnlyLastModified),
      db.collection('Settings').findOne({ userId: user.userId }, projectionOnlyLastModified),
      db.collection('Tasks').findOne({ userId: user.userId }, projectionOnlyLastModified),
      db.collection('Roadmaps').findOne({ userId: user.userId }, projectionOnlyLastModified),
      db.collection('Stats').findOne({ userId: user.userId }, projectionOnlyLastModified),
      db.collection('DailyRoutine').findOne({ userId: user.userId }, projectionOnlyLastModified),
      db.collection('Timetable').findOne({ userId: user.userId }, projectionOnlyLastModified),
      db.collection('Deadlines').findOne({ userId: user.userId }, projectionOnlyLastModified),
      db.collection('Countdowns').findOne({ userId: user.userId }, projectionOnlyLastModified)
    ]);

    const cloudLastModified = Math.max(
      existingMeta?.lastModified ? Number(existingMeta.lastModified) : 0,
      notesMeta?.lastModified ? Number(notesMeta.lastModified) : 0,
      settingsMeta?.lastModified ? Number(settingsMeta.lastModified) : 0,
      tasksMeta?.lastModified ? Number(tasksMeta.lastModified) : 0,
      roadmapsMeta?.lastModified ? Number(roadmapsMeta.lastModified) : 0,
      statsMeta?.lastModified ? Number(statsMeta.lastModified) : 0,
      dailyRoutineMeta?.lastModified ? Number(dailyRoutineMeta.lastModified) : 0,
      timetableMeta?.lastModified ? Number(timetableMeta.lastModified) : 0,
      deadlinesMeta?.lastModified ? Number(deadlinesMeta.lastModified) : 0,
      countdownsMeta?.lastModified ? Number(countdownsMeta.lastModified) : 0
    );

    //  FAST EXIT: If the client already has the latest data, instantly return.
    // This instantly unmounts the loading screen on the frontend!
    if (localModified >= cloudLastModified && cloudLastModified > 0) {
      return NextResponse.json({ 
        upToDate: true, 
        lastModified: cloudLastModified 
      });
    }

    if (!existingMeta && !notesMeta && !settingsMeta && !tasksMeta && !roadmapsMeta && !statsMeta && !dailyRoutineMeta && !timetableMeta) {
      return NextResponse.json({ data: null, lastModified: cloudLastModified });
    }

    //  PHASE 2: HEAVY DATA FETCH
    // We only reach this point if the cloud has newer data than the local device.
    const [
      existing, notesRecord, settingsRecord, tasksRecord, roadmapsRecord, 
      statsRecord, dailyRoutineRecord, timetableRecord, deadlinesRecord, countdownsRecord
    ] = await Promise.all([
      db.collection('DashboardStorage').findOne({ userId: user.userId }),
      db.collection('Notes').findOne({ userId: user.userId }),
      db.collection('Settings').findOne({ userId: user.userId }),
      db.collection('Tasks').findOne({ userId: user.userId }),
      db.collection('Roadmaps').findOne({ userId: user.userId }),
      db.collection('Stats').findOne({ userId: user.userId }),
      db.collection('DailyRoutine').findOne({ userId: user.userId }),
      db.collection('Timetable').findOne({ userId: user.userId }),
      db.collection('Deadlines').findOne({ userId: user.userId }),
      db.collection('Countdowns').findOne({ userId: user.userId })
    ]);

    let returnedData: any = null;
    
    // Backwards compatibility for old stringified format
    if (existing && existing.data && typeof existing.data === 'string') {
      try { returnedData = JSON.parse(existing.data); } catch (e) { returnedData = { state: {} }; }
      returnedData.state = returnedData.state || {};
      
      if (notesRecord?.notes) returnedData.state.notes = notesRecord.notes;
      
      if (settingsRecord) {
        returnedData.state = { ...returnedData.state, ...(settingsRecord.displaySettings || {}), ...(settingsRecord.generalSettings || {}) };
        SETTING_ARRAY_KEYS.forEach(key => { if (settingsRecord[key] !== undefined) returnedData.state[key] = settingsRecord[key]; });
      }
      if (tasksRecord) { TASK_KEYS.forEach(key => { if (tasksRecord[key] !== undefined) returnedData.state[key] = tasksRecord[key]; }); }
      if (roadmapsRecord?.roadmaps) returnedData.state.roadmaps = roadmapsRecord.roadmaps;
      if (statsRecord) { STATS_KEYS.forEach(key => { if (statsRecord[key] !== undefined) returnedData.state[key] = statsRecord[key]; }); }
      if (dailyRoutineRecord) { DAILY_ROUTINE_KEYS.forEach(key => { if (dailyRoutineRecord[key] !== undefined) returnedData.state[key] = dailyRoutineRecord[key]; }); }
      if (statsRecord?.dailyTimes !== undefined && returnedData.state.dailyTimes === undefined) returnedData.state.dailyTimes = statsRecord.dailyTimes;
      if (timetableRecord) { TIMETABLE_KEYS.forEach(key => { if (timetableRecord[key] !== undefined) returnedData.state[key] = timetableRecord[key]; }); }
      if (deadlinesRecord) { DEADLINE_KEYS.forEach(key => { if (deadlinesRecord[key] !== undefined) returnedData.state[key] = deadlinesRecord[key]; }); }
      if (countdownsRecord) { COUNTDOWN_KEYS.forEach(key => { if (countdownsRecord[key] !== undefined) returnedData.state[key] = countdownsRecord[key]; }); }
    } else {
      const { _id, userId, lastModified, updatedAt, version, displaySettings: legacyDS, generalSettings: legacyGS, ...coreData } = (existing || {}) as any;
      const reconstructedState = {
        ...coreData,
        ...(settingsRecord?.displaySettings || legacyDS || {}),
        ...(settingsRecord?.generalSettings || legacyGS || {})
      };

      SETTING_ARRAY_KEYS.forEach(key => { if (settingsRecord?.[key] !== undefined) reconstructedState[key] = settingsRecord[key]; });
      TASK_KEYS.forEach(key => { if (tasksRecord?.[key] !== undefined) reconstructedState[key] = tasksRecord[key]; });
      STATS_KEYS.forEach(key => { if (statsRecord?.[key] !== undefined) reconstructedState[key] = statsRecord[key]; });
      DAILY_ROUTINE_KEYS.forEach(key => { if (dailyRoutineRecord?.[key] !== undefined) reconstructedState[key] = dailyRoutineRecord[key]; });
      if (statsRecord?.dailyTimes !== undefined && reconstructedState.dailyTimes === undefined) reconstructedState.dailyTimes = statsRecord.dailyTimes;
      TIMETABLE_KEYS.forEach(key => { if (timetableRecord?.[key] !== undefined) reconstructedState[key] = timetableRecord[key]; });
      DEADLINE_KEYS.forEach(key => { if (deadlinesRecord?.[key] !== undefined) reconstructedState[key] = deadlinesRecord[key]; });
      COUNTDOWN_KEYS.forEach(key => { if (countdownsRecord?.[key] !== undefined) reconstructedState[key] = countdownsRecord[key]; });

      if (notesRecord?.notes) reconstructedState.notes = notesRecord.notes;
      if (roadmapsRecord?.roadmaps) reconstructedState.roadmaps = roadmapsRecord.roadmaps;

      returnedData = { state: reconstructedState, version: version || 2 };
    }

    return NextResponse.json({ data: returnedData, lastModified: cloudLastModified });
  } catch (error) {
    console.error('Error reading store from DB:', error);
    return NextResponse.json({ error: 'Failed to read store' }, { status: 500 });
  }
}
export async function POST(request: Request) {
  try {
    const user = authenticate(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const payload = await request.json();
    const { data: body, lastModified: incomingLastModified, modifiedCollections = [], modifiedKeys = [], isFullSync = false, incrementHistory } = payload;

    const client = await clientPromise;
    const db = client.db();

    // Support both direct { clearAll: true } and wrapped versions
    if (payload.clearAll === true || (payload.data && payload.data.clearAll === true)) {
      await Promise.all([
        db.collection('DashboardStorage').deleteOne({ userId: user.userId }),
        db.collection('Settings').deleteOne({ userId: user.userId }),
        db.collection('Notes').deleteOne({ userId: user.userId }),
        db.collection('Tasks').deleteOne({ userId: user.userId }),
        db.collection('Roadmaps').deleteOne({ userId: user.userId }),
        db.collection('Stats').deleteOne({ userId: user.userId }),
        db.collection('DailyRoutine').deleteOne({ userId: user.userId }),
        db.collection('Timetable').deleteOne({ userId: user.userId }),
        db.collection('Deadlines').deleteOne({ userId: user.userId })
      ]);
      return NextResponse.json({ success: true, message: 'All data cleared' });
    }

    if (!body) return NextResponse.json({ error: 'No data provided' }, { status: 400 });

    const fetchAll = isFullSync || body?.forceSync || modifiedCollections.length === 0;

    // We still fetch collections to resolve 409 Conflicts cleanly, 
    // and for complex manual merges like Roadmaps Arrays
    const [
      existing, existingNotes, existingSettings, existingTasks, 
      existingRoadmaps, existingStats, existingDailyRoutine, 
      existingTimetable, existingDeadlines, existingCountdowns
    ] = await Promise.all([
      (fetchAll || modifiedCollections.includes('DashboardStorage') || modifiedCollections.includes('Settings')) 
        ? db.collection('DashboardStorage').findOne({ userId: user.userId }) : Promise.resolve(null),
      (fetchAll || modifiedCollections.includes('Notes')) 
        ? db.collection('Notes').findOne({ userId: user.userId }) : Promise.resolve(null),
      (fetchAll || modifiedCollections.includes('Settings')) 
        ? db.collection('Settings').findOne({ userId: user.userId }) : Promise.resolve(null),
      (fetchAll || modifiedCollections.includes('Tasks')) 
        ? db.collection('Tasks').findOne({ userId: user.userId }) : Promise.resolve(null),
      (fetchAll || modifiedCollections.includes('Roadmaps')) 
        ? db.collection('Roadmaps').findOne({ userId: user.userId }) : Promise.resolve(null),
      (fetchAll || modifiedCollections.includes('Stats')) 
        ? db.collection('Stats').findOne({ userId: user.userId }) : Promise.resolve(null),
      (fetchAll || modifiedCollections.includes('DailyRoutine')) 
        ? db.collection('DailyRoutine').findOne({ userId: user.userId }) : Promise.resolve(null),
      (fetchAll || modifiedCollections.includes('Timetable')) 
        ? db.collection('Timetable').findOne({ userId: user.userId }) : Promise.resolve(null),
      (fetchAll || modifiedCollections.includes('Deadlines')) 
        ? db.collection('Deadlines').findOne({ userId: user.userId }) : Promise.resolve(null),
      (fetchAll || modifiedCollections.includes('Countdowns')) 
        ? db.collection('Countdowns').findOne({ userId: user.userId }) : Promise.resolve(null)
    ]);

    let existingCloudData: any = null;
    if (existing || existingNotes || existingSettings || existingTasks || existingRoadmaps || existingStats || existingDailyRoutine || existingTimetable || existingDeadlines || existingCountdowns) {
      if (existing && existing.data && typeof existing.data === 'string') {
        try { existingCloudData = JSON.parse(existing.data); } catch (e) { existingCloudData = { state: {} }; }
        existingCloudData.state = existingCloudData.state || {};
        
        if (existingNotes?.notes) existingCloudData.state.notes = existingNotes.notes;
        
        if (existingSettings) {
          existingCloudData.state = { ...existingCloudData.state, ...(existingSettings.displaySettings || {}), ...(existingSettings.generalSettings || {}) };
          SETTING_ARRAY_KEYS.forEach(key => { if (existingSettings[key] !== undefined) existingCloudData.state[key] = existingSettings[key]; });
        }
        if (existingRoadmaps?.roadmaps) existingCloudData.state.roadmaps = existingRoadmaps.roadmaps;
        if (existingStats) { STATS_KEYS.forEach(key => { if (existingStats[key] !== undefined) existingCloudData.state[key] = existingStats[key]; }); }
        if (existingDailyRoutine) { DAILY_ROUTINE_KEYS.forEach(key => { if (existingDailyRoutine[key] !== undefined) existingCloudData.state[key] = existingDailyRoutine[key]; }); }
        if (existingStats?.dailyTimes !== undefined && existingCloudData.state.dailyTimes === undefined) existingCloudData.state.dailyTimes = existingStats.dailyTimes;
        if (existingTimetable) { TIMETABLE_KEYS.forEach(key => { if (existingTimetable[key] !== undefined) existingCloudData.state[key] = existingTimetable[key]; }); }
        if (existingDeadlines) { DEADLINE_KEYS.forEach(key => { if (existingDeadlines[key] !== undefined) existingCloudData.state[key] = existingDeadlines[key]; }); }
        if (existingCountdowns) { COUNTDOWN_KEYS.forEach(key => { if (existingCountdowns[key] !== undefined) existingCloudData.state[key] = existingCountdowns[key]; }); }
      } else {
        const { _id, userId, lastModified, updatedAt, version, displaySettings: legacyDS, generalSettings: legacyGS, ...coreData } = (existing || {}) as any;
        const reconstructedState = {
          ...coreData,
          ...(existingSettings?.displaySettings || legacyDS || {}),
          ...(existingSettings?.generalSettings || legacyGS || {})
        };

        SETTING_ARRAY_KEYS.forEach(key => { if (existingSettings?.[key] !== undefined) reconstructedState[key] = existingSettings[key]; });
        TASK_KEYS.forEach(key => { if (existingTasks?.[key] !== undefined) reconstructedState[key] = existingTasks[key]; });
        STATS_KEYS.forEach(key => { if (existingStats?.[key] !== undefined) reconstructedState[key] = existingStats[key]; });
        DAILY_ROUTINE_KEYS.forEach(key => { if (existingDailyRoutine?.[key] !== undefined) reconstructedState[key] = existingDailyRoutine[key]; });
        if (existingStats?.dailyTimes !== undefined && reconstructedState.dailyTimes === undefined) reconstructedState.dailyTimes = existingStats.dailyTimes;
        if (existingNotes?.notes) reconstructedState.notes = existingNotes.notes;
        if (existingRoadmaps?.roadmaps) reconstructedState.roadmaps = existingRoadmaps.roadmaps;
        DEADLINE_KEYS.forEach(key => { if (existingDeadlines?.[key] !== undefined) reconstructedState[key] = existingDeadlines[key]; });
        COUNTDOWN_KEYS.forEach(key => { if (existingCountdowns?.[key] !== undefined) reconstructedState[key] = existingCountdowns[key]; });
        
        existingCloudData = { state: reconstructedState, version: version || 2 };
      }
    }

    const cloudLastModified = Math.max(
      existing?.lastModified ? Number(existing.lastModified) : 0,
      existingNotes?.lastModified ? Number(existingNotes.lastModified) : 0,
      existingSettings?.lastModified ? Number(existingSettings.lastModified) : 0,
      existingTasks?.lastModified ? Number(existingTasks.lastModified) : 0,
      existingRoadmaps?.lastModified ? Number(existingRoadmaps.lastModified) : 0,
      existingDailyRoutine?.lastModified ? Number(existingDailyRoutine.lastModified) : 0,
      existingTimetable?.lastModified ? Number(existingTimetable.lastModified) : 0,
      existingDeadlines?.lastModified ? Number(existingDeadlines.lastModified) : 0
    );

    let hasConflict = false;
    if (!body.forceSync) {
      if (isFullSync) {
        if (cloudLastModified > incomingLastModified && (existing || existingNotes || existingSettings || existingTasks || existingRoadmaps || existingStats || existingDailyRoutine || existingTimetable || existingDeadlines)) {
          hasConflict = true;
        }
      } else {
        if (modifiedCollections.includes('Tasks') && existingTasks?.lastModified > incomingLastModified) hasConflict = true;
        if (modifiedCollections.includes('Notes') && existingNotes?.lastModified > incomingLastModified) hasConflict = true;
        if (modifiedCollections.includes('Roadmaps') && existingRoadmaps?.lastModified > incomingLastModified) hasConflict = true;
        if (modifiedCollections.includes('Settings') && existingSettings?.lastModified > incomingLastModified) hasConflict = true;
        if (modifiedCollections.includes('DailyRoutine') && existingDailyRoutine?.lastModified > incomingLastModified) hasConflict = true;
        if (modifiedCollections.includes('Timetable') && existingTimetable?.lastModified > incomingLastModified) hasConflict = true;
        if (modifiedCollections.includes('Deadlines') && existingDeadlines?.lastModified > incomingLastModified) hasConflict = true;
      }
    }

    if (hasConflict) {
      const mc: string[] = (modifiedCollections && Array.isArray(modifiedCollections)) ? modifiedCollections : [];
      const COLLECTION_KEY_MAP: Record<string, string[]> = {
        'Settings': [
          'wallpaper', 'bgIndex', 'currentBgType', 'lockedWallpaper', 'theme', 'is24HourClock',
          'dashboardScale', 'mobileDashboardScale', 'dockScale', 'dockOffset', 'panicShortcutKey',
          'panicWallpaperSwitch', 'hideConfig', 'mobileHideConfig', 'clockOffsets', 'widgetOffsets',
          'clockStyle', 'fontFamily', 'activeTheme', 'soundEffectVolume', 'selectedSound', 'alarmVolume',
          'enableAlarmSound', 'enableAlarmVibration', 'isTimerIntervalEnabled', 'timerIntervalMins',
          'isTaskIntervalAlertEnabled', 'taskIntervalAlertMins', 'taskIntervalRingSecs',
          'isStopwatchIntervalEnabled', 'stopwatchIntervalMins', 'stopwatchAddToStats',
          'showTimer', 'showStopwatch', 'showCountdowns', 'showDeadlines', 'showNotes',
          'showPlans', 'showStats', 'showLeaderboard', 'showTimetable', 'showNews',
          'customDesktopWallpapers', 'customMobileWallpapers', 'hiddenWallpapers',
          'manifestationDesktopPhotos', 'manifestationMobilePhotos', 'manifestationCustomQuotes',
          'customQuotes', 'customAlarmSounds', 'lockedWidgets', 'rightWidgetsOffset',
          'enableRightToolbarPeek', 'autoOpenCountdowns', 'selectedLocalWallpaperName',
        ],
        'Tasks': ['activeTaskId', 'activeTaskTitle', 'plans', 'tasks', 'tomorrowTasks', 'tasksDate', 'taskGroupNames'],
        'DailyRoutine': ['dailyTimes'],
        'Deadlines': ['deadlines', 'syntheticDeadlines', 'deadlineAlertDays', 'dismissedDeadlineAlerts', 'disableDeadlineLockOnToday', 'hideYouInLeaderboard'],
        'Countdowns': ['countdowns'],
        'Timetable': ['timetableGrid', 'timetableColors', 'weekdayTimes', 'weekendTimes', 'timetableStartTime', 'timetableWeekendStartTime'],
        'Notes': ['notes'],
        'Roadmaps': ['roadmaps'],
        'Stats': ['history'],
      };

      let filteredState: Record<string, any> = {};
      if (mc.length > 0 && existingCloudData?.state) {
        mc.forEach(col => {
          const keys = COLLECTION_KEY_MAP[col] || [];
          keys.forEach(key => {
            if (existingCloudData.state[key] !== undefined) filteredState[key] = existingCloudData.state[key];
          });
        });
      } else {
        filteredState = existingCloudData?.state || {};
      }

      return NextResponse.json({
        conflict: true,
        cloudData: { state: filteredState, version: existingCloudData?.version || 2 },
        cloudLastModified: cloudLastModified
      }, { status: 409 });
    }

    const { state, version } = body;

    // CRITICAL: Strip any base64 strings from local IndexedDB media arrays.
    const LOCAL_MEDIA_ARRAY_KEYS = [
      'customDesktopWallpapers', 'customMobileWallpapers',
      'manifestationDesktopPhotos', 'manifestationMobilePhotos',
    ];
    if (state) {
      LOCAL_MEDIA_ARRAY_KEYS.forEach(key => {
        if (Array.isArray(state[key])) {
          state[key] = (state[key] as string[]).filter((v: string) => typeof v === 'string' && !v.startsWith('data:'));
        }
      });
      if (typeof state.peekModeWallpaper === 'string' && state.peekModeWallpaper.startsWith('data:')) {
        delete state.peekModeWallpaper;
      }
    }

    // Sort incoming data into buckets
    const tasksSpecificData: Record<string, any> = {};
    const unsetTasksKeys: Record<string, string> = {};
    TASK_KEYS.forEach(key => {
      if (state && state[key] !== undefined) { tasksSpecificData[key] = state[key]; delete state[key]; }
      unsetTasksKeys[key] = "";
    });

    const statsSpecificData: Record<string, any> = {};
    const unsetStatsKeys: Record<string, string> = {};
    STATS_KEYS.forEach(key => {
      if (state && state[key] !== undefined) { statsSpecificData[key] = state[key]; delete state[key]; }
      unsetStatsKeys[key] = "";
    });

    const dailyRoutineSpecificData: Record<string, any> = {};
    const unsetDailyRoutineKeys: Record<string, string> = {};
    DAILY_ROUTINE_KEYS.forEach(key => {
      if (state && state[key] !== undefined) { dailyRoutineSpecificData[key] = state[key]; delete state[key]; }
      unsetDailyRoutineKeys[key] = "";
    });

    const deadlineSpecificData: Record<string, any> = {};
    const unsetDeadlineKeys: Record<string, string> = {};
    DEADLINE_KEYS.forEach(key => {
      if (state && state[key] !== undefined) { deadlineSpecificData[key] = state[key]; delete state[key]; }
      unsetDeadlineKeys[key] = "";
    });

    const settingsSpecificData: Record<string, any> = {};
    SETTING_ARRAY_KEYS.forEach(key => {
      if (state && state[key] !== undefined) {
        if (isFullSync || modifiedKeys.includes(key)) settingsSpecificData[key] = state[key];
        delete state[key];
      }
    });

    const displaySettings: Record<string, any> = {};
    const generalSettings: Record<string, any> = {};
    const coreData: Record<string, any> = {};

    Object.keys(state || {}).forEach(key => {
      if ((key.startsWith('show') || key.startsWith('hide') || key.startsWith('is')) && key !== 'hideConfig' && key !== 'mobileHideConfig') {
        displaySettings[key] = state[key];
      } else if (typeof state[key] === 'string' || typeof state[key] === 'number' || typeof state[key] === 'boolean' || state[key] === null) {
        generalSettings[key] = state[key];
      } else {
        coreData[key] = state[key];
      }
    });

    const { notes, roadmaps, ...restCoreData } = coreData;
    const unsetLegacyKeys: Record<string, string> = { notes: "", roadmaps: "", displaySettings: "", generalSettings: "", ...unsetTasksKeys, ...unsetStatsKeys, ...unsetDailyRoutineKeys, ...unsetDeadlineKeys };
    const newLastModified = Date.now();

    // ------------------------------------------------------------------------------------
    // TRUE ATOMIC DOT-NOTATION UPDATES (Eliminates full overwrites & race conditions)
    // ------------------------------------------------------------------------------------

    // 1. Deadlines Update
    if (isFullSync || modifiedCollections.includes('Deadlines')) {
      let deadlineSetQuery: Record<string, any> = { lastModified: newLastModified };
      Object.keys(deadlineSpecificData).forEach(k => deadlineSetQuery[k] = deadlineSpecificData[k]);
      
      if (Object.keys(deadlineSetQuery).length > 1) {
        await db.collection('Deadlines').updateOne(
          { userId: user.userId },
          { $set: deadlineSetQuery,$setOnInsert: { userId: user.userId } },
          { upsert: true }
        );
      }
    }

    // 2. DashboardStorage (Core Data)
    if (isFullSync || modifiedCollections.includes('DashboardStorage') || modifiedCollections.includes('Settings')) {
      let coreSetQuery: Record<string, any> = { lastModified: newLastModified, updatedAt: new Date() };
      if (version) coreSetQuery.version = version;
      if (user.username) coreSetQuery.username = user.username;
      
      Object.keys(restCoreData).forEach(k => coreSetQuery[k] = restCoreData[k]);

      const updateOp: any = { $set: coreSetQuery,$setOnInsert: { userId: user.userId } };
      if (Object.keys(unsetLegacyKeys).length > 0) updateOp.$unset = unsetLegacyKeys;

      await db.collection('DashboardStorage').updateOne({ userId: user.userId }, updateOp, { upsert: true });
    }

    // 3.  SETTINGS (The ultimate atomic solution using Dot Notation)
    if (isFullSync || modifiedCollections.includes('Settings')) {
      let settingsSetQuery: Record<string, any> = { lastModified: newLastModified };

      // Safely drill into objects instead of rewriting them completely!
      Object.keys(displaySettings).forEach(k => settingsSetQuery[`displaySettings.${k}`] = displaySettings[k]);
      Object.keys(generalSettings).forEach(k => settingsSetQuery[`generalSettings.${k}`] = generalSettings[k]);
      
      Object.keys(settingsSpecificData).forEach(k => {
        const val = settingsSpecificData[k];
        // Deep nested update for specific config objects to preserve other keys
        if (['hideConfig', 'mobileHideConfig', 'clockOffsets', 'widgetOffsets'].includes(k) && typeof val === 'object' && val !== null && !Array.isArray(val)) {
          Object.keys(val).forEach(subKey => {
            settingsSetQuery[`${k}.${subKey}`] = val[subKey];
          });
        } else {
          // Arrays and entire objects (like timetableGrid) are replaced natively
          settingsSetQuery[k] = val;
        }
      });

      if (Object.keys(settingsSetQuery).length > 1) {
        await db.collection('Settings').updateOne(
          { userId: user.userId },
          { $set: settingsSetQuery,$setOnInsert: { userId: user.userId } },
          { upsert: true }
        );
      }
    }

    // 4. Tasks
    if ((isFullSync || modifiedCollections.includes('Tasks')) && Object.keys(tasksSpecificData).length > 0) {
      let tasksSetQuery: Record<string, any> = { lastModified: newLastModified };
      Object.keys(tasksSpecificData).forEach(k => tasksSetQuery[k] = tasksSpecificData[k]);

      await db.collection('Tasks').updateOne(
        { userId: user.userId },
        { $set: tasksSetQuery,$setOnInsert: { userId: user.userId } },
        { upsert: true }
      );
    }

    // 5. Notes (Replaced fully if provided)
    if ((isFullSync || modifiedCollections.includes('Notes')) && notes !== undefined) {
      await db.collection('Notes').updateOne(
        { userId: user.userId },
        { $set: { notes: notes, lastModified: newLastModified },$setOnInsert: { userId: user.userId } },
        { upsert: true }
      );
    }

    // 6. Roadmaps (Still requires manual merging based on internal IDs)
    if ((isFullSync || modifiedCollections.includes('Roadmaps')) && roadmaps !== undefined) {
      let roadmapsToSave = roadmaps;
      if (existingRoadmaps && Array.isArray(existingRoadmaps.roadmaps) && existingRoadmaps.roadmaps.length > 0) {
        if (!Array.isArray(roadmaps) || roadmaps.length === 0) roadmapsToSave = existingRoadmaps.roadmaps;
        else roadmapsToSave = mergeArraysByIdServer(roadmaps, existingRoadmaps.roadmaps);
      }
      await db.collection('Roadmaps').updateOne(
        { userId: user.userId },
        { $set: { roadmaps: roadmapsToSave, lastModified: newLastModified },$setOnInsert: { userId: user.userId } },
        { upsert: true }
      );
    }

    // 7. Stats
    if (isFullSync || modifiedCollections.includes('Stats')) {
      const statsSetQuery: Record<string, any> = { lastModified: newLastModified };
      Object.keys(statsSpecificData).forEach(k => {
        if (k !== 'history') statsSetQuery[k] = statsSpecificData[k];
      });

      if (Object.keys(statsSetQuery).length > 1) {
        await db.collection('Stats').updateOne(
          { userId: user.userId },
          { $set: statsSetQuery,$setOnInsert: { userId: user.userId } },
          { upsert: true }
        );
      }
    }

    // 8.  DailyRoutines (Deep nested dot notation to protect logged timestamps)
    if ((isFullSync || modifiedCollections.includes('DailyRoutine')) && Object.keys(dailyRoutineSpecificData).length > 0) {
      let dailySetQuery: Record<string, any> = { lastModified: newLastModified };
      Object.keys(dailyRoutineSpecificData).forEach(k => {
        if (k !== 'dailyTimes') dailySetQuery[k] = dailyRoutineSpecificData[k];
      });

      const incomingDailyTimes = dailyRoutineSpecificData.dailyTimes || {};
      Object.keys(incomingDailyTimes).forEach(dateKey => {
        const incDate = incomingDailyTimes[dateKey];
        Object.keys(incDate).forEach(field => {
          // If a protected timestamp field comes in falsy, we skip it, making it impossible to accidentally delete
          if (['wakeupTime', 'workStartedTime', 'sleepTime', 'bedTime'].includes(field)) {
            if (incDate[field]) dailySetQuery[`dailyTimes.${dateKey}.${field}`] = incDate[field];
          } else {
            dailySetQuery[`dailyTimes.${dateKey}.${field}`] = incDate[field];
          }
        });
      });

      if (Object.keys(dailySetQuery).length > 1) {
        await db.collection('DailyRoutine').updateOne(
          { userId: user.userId },
          { $set: dailySetQuery,$setOnInsert: { userId: user.userId } },
          { upsert: true }
        );
      }
    }

    // Update active status
    let userQuery: any;
    try { userQuery = { _id: new ObjectId(user.userId) }; } catch { userQuery = { _id: user.userId }; }
    await db.collection('User').updateOne(userQuery, { $set: { lastActiveAt: new Date() } });

    const responseObj: any = { success: true, lastModified: newLastModified };
    if (incrementHistory) {
      const latestStats = await db.collection('Stats').findOne({ userId: user.userId });
      if (latestStats?.history) responseObj.updatedHistory = latestStats.history;
    }
    
    return NextResponse.json(responseObj);
  } catch (error) {
    console.error('Error writing store to DB:', error);
    return NextResponse.json({ error: 'Failed to write store' }, { status: 500 });
  }
}

export async function HEAD(request: Request) {
  // Lightning-fast, auth-free response specifically for the ConnectionStatusToast ping
  return new NextResponse(null, { status: 200 });
}