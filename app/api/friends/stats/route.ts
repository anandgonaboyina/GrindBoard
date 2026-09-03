import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

const authenticate = (request: Request) => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
  } catch (err) {
    return null;
  }
};

export async function GET(request: Request) {
  try {
    const user = authenticate(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const friendId = searchParams.get('friendId');

    if (!friendId) return NextResponse.json({ error: 'Friend ID required' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db();

    const friendship = await db.collection('Friendship').findOne({
      status: 'ACCEPTED',
      $or: [
        { senderId: user.userId, receiverId: friendId },
        { senderId: friendId, receiverId: user.userId }
      ]
    });

    if (!friendship) return NextResponse.json({ error: 'Not friends' }, { status: 403 });

    const friendDashboard = await db.collection('DashboardStorage').findOne({ userId: friendId });
    const settingsRecord = await db.collection('Settings').findOne({ userId: friendId });
    const tasksRecord = await db.collection('Tasks').findOne({ userId: friendId });
    const statsRecord = await db.collection('Stats').findOne({ userId: friendId });
    const dailyRoutineRecord = await db.collection('DailyRoutine').findOne({ userId: friendId });
    const timetableRecord = await db.collection('Timetable').findOne({ userId: friendId });

    if (!friendDashboard && !settingsRecord && !tasksRecord && !statsRecord && !dailyRoutineRecord && !timetableRecord) {
      return NextResponse.json({ data: null });
    }

    let parsedData: any = {};
    if (friendDashboard && friendDashboard.data && typeof friendDashboard.data === 'string') {
      parsedData = JSON.parse(friendDashboard.data).state || {};
    } else {
      const { displaySettings: legacyDS, generalSettings: legacyGS, ...coreData } = (friendDashboard || {}) as any;
      parsedData = {
        ...coreData,
        ...(settingsRecord?.displaySettings || legacyDS || {}),
        ...(settingsRecord?.generalSettings || legacyGS || {})
      };

      const TIMETABLE_KEYS = [
        'timetableGrid', 'timetableColors', 'weekdayTimes', 'weekendTimes',
        'timetableStartTime', 'timetableWeekendStartTime'
      ];
      const SETTING_ARRAY_KEYS = [
        'widgetOffsets', 'clockOffsets', 'lockedWidgets',
        'hiddenWallpapers', 'customDesktopWallpapers', 'customMobileWallpapers',
        ...TIMETABLE_KEYS
      ];
      SETTING_ARRAY_KEYS.forEach(key => {
        if (settingsRecord && settingsRecord[key] !== undefined) parsedData[key] = settingsRecord[key];
      });

      const TASK_KEYS = ['tasks', 'tomorrowTasks', 'taskGroupNames', 'countdowns', 'deadlines', 'syntheticDeadlines'];
      TASK_KEYS.forEach(key => {
        if (tasksRecord && tasksRecord[key] !== undefined) parsedData[key] = tasksRecord[key];
      });

      const STATS_KEYS = ['history', 'stopwatchSessions'];
      STATS_KEYS.forEach(key => {
        if (statsRecord && statsRecord[key] !== undefined) parsedData[key] = statsRecord[key];
      });

      const DAILY_ROUTINE_KEYS = ['dailyTimes'];
      DAILY_ROUTINE_KEYS.forEach(key => {
        if (dailyRoutineRecord && dailyRoutineRecord[key] !== undefined) parsedData[key] = dailyRoutineRecord[key];
      });
      
      // Backward compat
      if (statsRecord && statsRecord.dailyTimes !== undefined && parsedData.dailyTimes === undefined) {
        parsedData.dailyTimes = statsRecord.dailyTimes;
      }
    }

    // Always merge Timetable collection fields if present (Legacy support)
    const LEGACY_TIMETABLE_KEYS = [
      'timetableGrid', 'timetableColors', 'weekdayTimes', 'weekendTimes',
      'timetableStartTime', 'timetableWeekendStartTime'
    ];
    LEGACY_TIMETABLE_KEYS.forEach(key => {
      if (timetableRecord && timetableRecord[key] !== undefined) {
        parsedData[key] = timetableRecord[key];
      }
    });

    const { ObjectId } = require('mongodb');
    let userQuery;
    try {
      userQuery = { _id: new ObjectId(friendId) };
    } catch {
      userQuery = { _id: friendId };
    }
    const friendAccount = await db.collection('User').findOne(userQuery);

    const isTaskSharingEnabled =
      friendship.taskSharing?.[friendId] !== false &&
      friendship.taskSharing?.[friendId?.toString()] !== false;

    let finalTasks = isTaskSharingEnabled ? (parsedData.tasks || []) : undefined;
    let finalTomorrowTasks = isTaskSharingEnabled ? (parsedData.tomorrowTasks || []) : undefined;

    if (finalTasks && finalTomorrowTasks) {
      // Ensure no overlap between tabs to prevent duplicate key errors (mirroring client hydration)
      const tIds = new Set(finalTasks.map((t: any) => t.id));
      finalTomorrowTasks = finalTomorrowTasks.filter((t: any) => !tIds.has(t.id));
    }

    const publicStats = {
      username: friendAccount?.username || friendId,
      history: parsedData.history || {},
      dailyTimes: parsedData.dailyTimes || {},
      tasksCompleted: finalTasks ? finalTasks.filter((t: any) => t.completed).length : 0,
      tasks: finalTasks,
      tomorrowTasks: finalTomorrowTasks,
      taskGroupNames: isTaskSharingEnabled ? (parsedData.taskGroupNames || ['Core Tasks', 'Daily Routine', 'Milestones']) : undefined,
      deadlines: parsedData.deadlines || [],
      timetableGrid: parsedData.timetableGrid || null,
      timetableColors: parsedData.timetableColors || null,
      weekdayTimes: parsedData.weekdayTimes || null,
      weekendTimes: parsedData.weekendTimes || null,
      timetableStartTime: parsedData.timetableStartTime !== undefined ? parsedData.timetableStartTime : 540,
      timetableWeekendStartTime: parsedData.timetableWeekendStartTime !== undefined ? parsedData.timetableWeekendStartTime : 540,
      lastLogin: friendAccount?.lastLogin || null,
      createdAt: friendAccount?.createdAt || null
    };

    return NextResponse.json({ stats: publicStats });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
