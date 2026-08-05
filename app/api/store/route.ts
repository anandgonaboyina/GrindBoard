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

export async function GET(request: Request) {
  try {
    const user = authenticate(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    const existing = await db.collection('DashboardStorage').findOne({ userId: user.userId });
    const notesRecord = await db.collection('Notes').findOne({ userId: user.userId });
    const settingsRecord = await db.collection('Settings').findOne({ userId: user.userId });
    const tasksRecord = await db.collection('Tasks').findOne({ userId: user.userId });
    const roadmapsRecord = await db.collection('Roadmaps').findOne({ userId: user.userId });
    const statsRecord = await db.collection('Stats').findOne({ userId: user.userId });
    const dailyRoutineRecord = await db.collection('DailyRoutine').findOne({ userId: user.userId });
    
    if (!existing && !notesRecord && !settingsRecord && !tasksRecord && !roadmapsRecord && !statsRecord && !dailyRoutineRecord) {
      return NextResponse.json({ data: null, lastModified: 0 });
    }

    const SETTING_ARRAY_KEYS = [
      'customDesktopWallpapers', 'customMobileWallpapers', 'hiddenWallpapers', 
      'timetableGrid', 'timetableColors', 'widgetOffsets', 'clockOffsets', 'lockedWidgets',
      'panicWallpaperSwitch', 'enableAlarmSound', 'enableAlarmVibration', 'enablePanicButton', 'enableRightToolbarPeek'
    ];
    
    const TASK_KEYS = ['tasks', 'countdowns', 'plans', 'deadlines', 'syntheticDeadlines', 'deadlineAlertDays', 'dismissedDeadlineAlerts'];
    const STATS_KEYS = ['history', 'stopwatchSessions'];
    const DAILY_ROUTINE_KEYS = ['dailyTimes'];

    let returnedData: any = null;
    // Backwards compatibility for old stringified format
    if (existing && existing.data && typeof existing.data === 'string') {
      try {
        returnedData = JSON.parse(existing.data);
      } catch (e) {
        returnedData = { state: {} };
      }
      returnedData.state = returnedData.state || {};
      if (notesRecord && notesRecord.notes) {
        returnedData.state.notes = notesRecord.notes;
      }
      if (settingsRecord) {
        returnedData.state = {
          ...returnedData.state,
          ...(settingsRecord.displaySettings || {}),
          ...(settingsRecord.generalSettings || {})
        };
        SETTING_ARRAY_KEYS.forEach(key => {
          if (settingsRecord[key] !== undefined) returnedData.state[key] = settingsRecord[key];
        });
      }
      if (tasksRecord) {
        TASK_KEYS.forEach(key => {
          if (tasksRecord[key] !== undefined) returnedData.state[key] = tasksRecord[key];
        });
      }
      if (roadmapsRecord && roadmapsRecord.roadmaps) {
        returnedData.state.roadmaps = roadmapsRecord.roadmaps;
      }
      if (statsRecord) {
        STATS_KEYS.forEach(key => {
          if (statsRecord[key] !== undefined) returnedData.state[key] = statsRecord[key];
        });
      }
      if (dailyRoutineRecord) {
        DAILY_ROUTINE_KEYS.forEach(key => {
          if (dailyRoutineRecord[key] !== undefined) returnedData.state[key] = dailyRoutineRecord[key];
        });
      }
      // Backward compatibility: If dailyTimes is still inside Stats, grab it
      if (statsRecord && statsRecord.dailyTimes !== undefined && returnedData.state.dailyTimes === undefined) {
        returnedData.state.dailyTimes = statsRecord.dailyTimes;
      }
    } else if (existing || settingsRecord || tasksRecord || roadmapsRecord || statsRecord || dailyRoutineRecord) {
      const { _id, userId, lastModified, updatedAt, version, displaySettings: legacyDS, generalSettings: legacyGS, ...coreData } = (existing || {}) as any;
      const reconstructedState = {
        ...coreData,
        ...(settingsRecord?.displaySettings || legacyDS || {}),
        ...(settingsRecord?.generalSettings || legacyGS || {})
      };
      
      SETTING_ARRAY_KEYS.forEach(key => {
        if (settingsRecord && settingsRecord[key] !== undefined) {
          reconstructedState[key] = settingsRecord[key];
        }
      });

      TASK_KEYS.forEach(key => {
        if (tasksRecord && tasksRecord[key] !== undefined) {
          reconstructedState[key] = tasksRecord[key];
        }
      });

      STATS_KEYS.forEach(key => {
        if (statsRecord && statsRecord[key] !== undefined) {
          reconstructedState[key] = statsRecord[key];
        }
      });

      DAILY_ROUTINE_KEYS.forEach(key => {
        if (dailyRoutineRecord && dailyRoutineRecord[key] !== undefined) {
          reconstructedState[key] = dailyRoutineRecord[key];
        }
      });
      // Backward compatibility: If dailyTimes is still inside Stats, grab it
      if (statsRecord && statsRecord.dailyTimes !== undefined && reconstructedState.dailyTimes === undefined) {
        reconstructedState.dailyTimes = statsRecord.dailyTimes;
      }
      
      if (notesRecord && notesRecord.notes) {
        reconstructedState.notes = notesRecord.notes;
      }

      if (roadmapsRecord && roadmapsRecord.roadmaps) {
        reconstructedState.roadmaps = roadmapsRecord.roadmaps;
      }
      
      returnedData = {
        state: reconstructedState,
        version: version || 2
      };
    } else {
      returnedData = { state: { notes: notesRecord?.notes || [] }, version: 2 };
    }
    
    const cloudLastModified = Math.max(
      existing?.lastModified ? Number(existing.lastModified) : 0,
      notesRecord?.lastModified ? Number(notesRecord.lastModified) : 0,
      settingsRecord?.lastModified ? Number(settingsRecord.lastModified) : 0,
      tasksRecord?.lastModified ? Number(tasksRecord.lastModified) : 0,
      roadmapsRecord?.lastModified ? Number(roadmapsRecord.lastModified) : 0,
      statsRecord?.lastModified ? Number(statsRecord.lastModified) : 0,
      dailyRoutineRecord?.lastModified ? Number(dailyRoutineRecord.lastModified) : 0
    );

    console.log('GET /api/store returning for user', user.userId, ':', { 
      hasExisting: !!existing, 
      hasSettings: !!settingsRecord,
      hasTasks: !!tasksRecord,
      hitElseBlock: !(existing || settingsRecord || tasksRecord || roadmapsRecord || statsRecord || dailyRoutineRecord)
    });
    return NextResponse.json({ 
      data: returnedData,
      lastModified: cloudLastModified
    });
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

    const body = await request.json();
    const incomingLastModified = body.lastModified || Date.now();

    const client = await clientPromise;
    const db = client.db();

    const existing = await db.collection('DashboardStorage').findOne({ userId: user.userId });
    const existingNotes = await db.collection('Notes').findOne({ userId: user.userId });
    const existingSettings = await db.collection('Settings').findOne({ userId: user.userId });
    const existingTasks = await db.collection('Tasks').findOne({ userId: user.userId });
    const existingRoadmaps = await db.collection('Roadmaps').findOne({ userId: user.userId });
    const existingStats = await db.collection('Stats').findOne({ userId: user.userId });
    const existingDailyRoutine = await db.collection('DailyRoutine').findOne({ userId: user.userId });

    const SETTING_ARRAY_KEYS = [
      'customDesktopWallpapers', 'customMobileWallpapers', 'hiddenWallpapers', 
      'timetableGrid', 'timetableColors', 'widgetOffsets', 'clockOffsets', 'lockedWidgets',
      'panicWallpaperSwitch', 'enableAlarmSound', 'enableAlarmVibration', 'enablePanicButton', 'enableRightToolbarPeek'
    ];
    
    const TASK_KEYS = ['tasks', 'countdowns', 'plans', 'deadlines', 'syntheticDeadlines', 'deadlineAlertDays', 'dismissedDeadlineAlerts'];
    const STATS_KEYS = ['history', 'stopwatchSessions'];
    const DAILY_ROUTINE_KEYS = ['dailyTimes'];

    let existingCloudData: any = null;
    if (existing || existingNotes || existingSettings || existingTasks || existingRoadmaps || existingStats || existingDailyRoutine) {
      if (existing && existing.data && typeof existing.data === 'string') {
        try {
          existingCloudData = JSON.parse(existing.data);
        } catch (e) {
          existingCloudData = { state: {} };
        }
        existingCloudData.state = existingCloudData.state || {};
        if (existingNotes && existingNotes.notes) {
          existingCloudData.state.notes = existingNotes.notes;
        }
        if (existingSettings) {
          existingCloudData.state = {
            ...existingCloudData.state,
            ...(existingSettings.displaySettings || {}),
            ...(existingSettings.generalSettings || {})
          };
          SETTING_ARRAY_KEYS.forEach(key => {
            if (existingSettings[key] !== undefined) existingCloudData.state[key] = existingSettings[key];
          });
        }
        if (existingRoadmaps && existingRoadmaps.roadmaps) {
          existingCloudData.state.roadmaps = existingRoadmaps.roadmaps;
        }
        if (existingStats) {
          STATS_KEYS.forEach(key => {
            if (existingStats[key] !== undefined) existingCloudData.state[key] = existingStats[key];
          });
        }
        if (existingDailyRoutine) {
          DAILY_ROUTINE_KEYS.forEach(key => {
            if (existingDailyRoutine[key] !== undefined) existingCloudData.state[key] = existingDailyRoutine[key];
          });
        }
        if (existingStats && existingStats.dailyTimes !== undefined && existingCloudData.state.dailyTimes === undefined) {
          existingCloudData.state.dailyTimes = existingStats.dailyTimes;
        }
      } else {
        const { _id, userId, lastModified, updatedAt, version, displaySettings: legacyDS, generalSettings: legacyGS, ...coreData } = (existing || {}) as any;
        const reconstructedState = {
          ...coreData,
          ...(existingSettings?.displaySettings || legacyDS || {}),
          ...(existingSettings?.generalSettings || legacyGS || {})
        };
        
        SETTING_ARRAY_KEYS.forEach(key => {
          if (existingSettings && existingSettings[key] !== undefined) {
            reconstructedState[key] = existingSettings[key];
          }
        });

        TASK_KEYS.forEach(key => {
          if (existingTasks && existingTasks[key] !== undefined) {
            reconstructedState[key] = existingTasks[key];
          }
        });

        STATS_KEYS.forEach(key => {
          if (existingStats && existingStats[key] !== undefined) {
            reconstructedState[key] = existingStats[key];
          }
        });
        
        DAILY_ROUTINE_KEYS.forEach(key => {
          if (existingDailyRoutine && existingDailyRoutine[key] !== undefined) {
            reconstructedState[key] = existingDailyRoutine[key];
          }
        });
        
        if (existingStats && existingStats.dailyTimes !== undefined && reconstructedState.dailyTimes === undefined) {
          reconstructedState.dailyTimes = existingStats.dailyTimes;
        }

        if (existingNotes && existingNotes.notes) {
          reconstructedState.notes = existingNotes.notes;
        }
        if (existingRoadmaps && existingRoadmaps.roadmaps) {
          reconstructedState.roadmaps = existingRoadmaps.roadmaps;
        }
        existingCloudData = { state: reconstructedState, version: version || 2 };
      }
    }

    const cloudLastModified = Math.max(
      existing?.lastModified ? Number(existing.lastModified) : 0,
      existingNotes?.lastModified ? Number(existingNotes.lastModified) : 0,
      existingSettings?.lastModified ? Number(existingSettings.lastModified) : 0,
      existingTasks?.lastModified ? Number(existingTasks.lastModified) : 0,
      existingRoadmaps?.lastModified ? Number(existingRoadmaps.lastModified) : 0,
      existingStats?.lastModified ? Number(existingStats.lastModified) : 0,
      existingDailyRoutine?.lastModified ? Number(existingDailyRoutine.lastModified) : 0
    );

    const modifiedCollections = body.modifiedCollections;
    const isFullSync = !modifiedCollections || modifiedCollections.length === 0;

    let hasConflict = false;
    if (!body.forceSync) {
      if (isFullSync) {
        if (cloudLastModified > incomingLastModified && (existing || existingNotes || existingSettings || existingTasks || existingRoadmaps || existingStats || existingDailyRoutine)) {
          hasConflict = true;
        }
      } else {
        if (modifiedCollections.includes('Tasks') && existingTasks?.lastModified > incomingLastModified) hasConflict = true;
        if (modifiedCollections.includes('Notes') && existingNotes?.lastModified > incomingLastModified) hasConflict = true;
        if (modifiedCollections.includes('Roadmaps') && existingRoadmaps?.lastModified > incomingLastModified) hasConflict = true;
        if (modifiedCollections.includes('Stats') && existingStats?.lastModified > incomingLastModified) hasConflict = true;
        if (modifiedCollections.includes('Settings') && existingSettings?.lastModified > incomingLastModified) hasConflict = true;
        if (modifiedCollections.includes('DailyRoutine') && existingDailyRoutine?.lastModified > incomingLastModified) hasConflict = true;
      }
    }

    if (hasConflict) {
      return NextResponse.json({ 
        conflict: true, 
        cloudData: existingCloudData,
        cloudLastModified: cloudLastModified
      }, { status: 409 });
    }
    
    if (body.clearAll === true) {
      // Complete account reset requested (clearAllData)
      await Promise.all([
        db.collection('DashboardStorage').deleteOne({ userId: user.userId }),
        db.collection('Settings').deleteOne({ userId: user.userId }),
        db.collection('Notes').deleteOne({ userId: user.userId }),
        db.collection('Tasks').deleteOne({ userId: user.userId }),
        db.collection('Roadmaps').deleteOne({ userId: user.userId }),
        db.collection('Stats').deleteOne({ userId: user.userId }),
        db.collection('DailyRoutine').deleteOne({ userId: user.userId })
      ]);
      return NextResponse.json({ success: true, message: 'All data cleared' });
    }
    
    if (!body.data) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    // Group settings efficiently
    const { state, version } = body.data;
    
    const tasksSpecificData: Record<string, any> = {};
    const unsetTasksKeys: Record<string, string> = {};

    TASK_KEYS.forEach(key => {
      if (state && state[key] !== undefined) {
        tasksSpecificData[key] = state[key];
        delete state[key]; // Extract from state BEFORE it hits generalSettings/coreData
      }
      unsetTasksKeys[key] = ""; // Ensure removed from monolithic
    });

    const statsSpecificData: Record<string, any> = {};
    const unsetStatsKeys: Record<string, string> = {};

    STATS_KEYS.forEach(key => {
      if (state && state[key] !== undefined) {
        statsSpecificData[key] = state[key];
        delete state[key]; // Extract from state BEFORE it hits generalSettings/coreData
      }
      unsetStatsKeys[key] = ""; // Ensure removed from monolithic
    });

    const dailyRoutineSpecificData: Record<string, any> = {};
    const unsetDailyRoutineKeys: Record<string, string> = {};

    DAILY_ROUTINE_KEYS.forEach(key => {
      if (state && state[key] !== undefined) {
        dailyRoutineSpecificData[key] = state[key];
        delete state[key]; // Extract from state BEFORE it hits generalSettings/coreData
      }
      unsetDailyRoutineKeys[key] = ""; // Ensure removed from monolithic
    });

    const displaySettings: Record<string, any> = {};
    const generalSettings: Record<string, any> = {};
    const coreData: Record<string, any> = {};

    Object.keys(state || {}).forEach(key => {
      if (key.startsWith('show') || key.startsWith('hide') || key.startsWith('is')) {
        displaySettings[key] = state[key];
      } else if (typeof state[key] === 'string' || typeof state[key] === 'number') {
        generalSettings[key] = state[key];
      } else {
        coreData[key] = state[key]; // Arrays and nested objects
      }
    });


    const { notes, roadmaps, ...restCoreData } = coreData;

    const settingsSpecificData: Record<string, any> = {};
    const unsetLegacyKeys: Record<string, string> = { notes: "", roadmaps: "", displaySettings: "", generalSettings: "", ...unsetTasksKeys, ...unsetStatsKeys, ...unsetDailyRoutineKeys };

    SETTING_ARRAY_KEYS.forEach(key => {
      if (restCoreData[key] !== undefined) {
        settingsSpecificData[key] = restCoreData[key];
        delete restCoreData[key]; // Extract from monolithic doc
      }
      unsetLegacyKeys[key] = ""; // Ensure removed from monolithic doc during migration
    });

    const newLastModified = Date.now();
    
    // 1. Update Monolithic Document (Now much lighter)
    if (isFullSync || modifiedCollections.includes('DashboardStorage') || modifiedCollections.includes('Settings')) {
      const updateDoc = {
        version: version || 2,
        username: user.username,
        lastModified: newLastModified,
        updatedAt: new Date(),
        ...restCoreData
      };

      await db.collection('DashboardStorage').updateOne(
        { userId: user.userId },
        { 
          $set: updateDoc,
          $unset: unsetLegacyKeys,
          $setOnInsert: { userId: user.userId }
        },
        { upsert: true }
      );
    }

    // 2. Save Settings to the isolated Settings collection
    if (isFullSync || modifiedCollections.includes('Settings')) {
      const settingsDoc = {
        displaySettings,
        generalSettings,
        ...settingsSpecificData,
        lastModified: newLastModified
      };

      await db.collection('Settings').updateOne(
        { userId: user.userId },
        { 
          $set: settingsDoc,
          $setOnInsert: { userId: user.userId }
        },
        { upsert: true }
      );
    }

    // 3. Save Tasks to the isolated Tasks collection
    if ((isFullSync || modifiedCollections.includes('Tasks')) && Object.keys(tasksSpecificData).length > 0) {
      const tasksDoc = { ...tasksSpecificData, lastModified: newLastModified };
      await db.collection('Tasks').updateOne(
        { userId: user.userId },
        { 
          $set: tasksDoc,
          $setOnInsert: { userId: user.userId }
        },
        { upsert: true }
      );
    }

    // 4. Save Notes to the isolated Notes collection
    if ((isFullSync || modifiedCollections.includes('Notes')) && notes !== undefined) {
      await db.collection('Notes').updateOne(
        { userId: user.userId },
        { 
          $set: { notes, lastModified: newLastModified },
          $setOnInsert: { userId: user.userId }
        },
        { upsert: true }
      );
    }
    
    // 5. Save Roadmaps to the isolated Roadmaps collection
    if ((isFullSync || modifiedCollections.includes('Roadmaps')) && roadmaps !== undefined) {
      await db.collection('Roadmaps').updateOne(
        { userId: user.userId },
        { 
          $set: { roadmaps, lastModified: newLastModified },
          $setOnInsert: { userId: user.userId }
        },
        { upsert: true }
      );
    }
    
    // 6. Save Stats to the isolated Stats collection
    if ((isFullSync || modifiedCollections.includes('Stats')) && Object.keys(statsSpecificData).length > 0) {
      const statsDoc: any = { ...statsSpecificData, lastModified: newLastModified };
      
      if (existingStats && existingStats.history) {
        const incomingHistory = statsDoc.history || {};
        const serverHistory = existingStats.history;
        const mergedHistory = { ...serverHistory };
        
        Object.keys(incomingHistory).forEach(date => {
          const inc = incomingHistory[date] || 0;
          const srv = serverHistory[date] || 0;
          if (inc > srv) {
            mergedHistory[date] = inc;
          } else if (srv > inc && inc > 0) {
            mergedHistory[date] = srv + inc;
          }
        });
        statsDoc.history = mergedHistory;
      }
      
      await db.collection('Stats').updateOne(
        { userId: user.userId },
        { 
          $set: statsDoc,
          $setOnInsert: { userId: user.userId }
        },
        { upsert: true }
      );
    }
    
    // 7. Save DailyRoutines to the isolated DailyRoutine collection
    if ((isFullSync || modifiedCollections.includes('DailyRoutine')) && Object.keys(dailyRoutineSpecificData).length > 0) {
      const dailyRoutineDoc = { ...dailyRoutineSpecificData, lastModified: newLastModified };
      await db.collection('DailyRoutine').updateOne(
        { userId: user.userId },
        { 
          $set: dailyRoutineDoc,
          $setOnInsert: { userId: user.userId }
        },
        { upsert: true }
      );
    }
    
    // Auto-update the active status in the Users collection
    await db.collection('User').updateOne(
      { _id: new ObjectId(user.userId) },
      { $set: { lastActiveAt: new Date() } }
    );


    return NextResponse.json({ success: true, lastModified: newLastModified });
  } catch (error) {
    console.error('Error writing store to DB:', error);
    return NextResponse.json({ error: 'Failed to write store' }, { status: 500 });
  }
}
