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
    const fetchType = searchParams.get('type') || 'all'; // NEW: Get requested type

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

    const { ObjectId } = require('mongodb');
    let friendObjId = null;
    try { friendObjId = new ObjectId(friendId); } catch (e) { }

    const safeUserQuery = friendObjId
      ? { $or: [{ userId: friendId }, { userId: friendObjId }] }
      : { userId: friendId };

    const userQuery = friendObjId ? { _id: friendObjId } : { _id: friendId };

    // 🚀 PARALLEL QUERIES: Only fetch exactly what the frontend asked for!
    const [
      friendAccount,
      friendDashboard,
      settingsRecord,
      tasksRecord,
      statsRecord,
      dailyRoutineRecord,
      timetableRecord
    ] = await Promise.all([
      db.collection('User').findOne(userQuery),
      db.collection('DashboardStorage').findOne(safeUserQuery), // Legacy fallback

      (fetchType === 'timetable' || fetchType === 'all')
        ? db.collection('Settings').findOne(safeUserQuery) : Promise.resolve(null),

      (fetchType === 'tasks' || fetchType === 'all')
        ? db.collection('Tasks').findOne(safeUserQuery) : Promise.resolve(null),

      (fetchType === 'stats' || fetchType === 'all')
        ? db.collection('Stats').findOne(safeUserQuery) : Promise.resolve(null),

      (fetchType === 'stats' || fetchType === 'all')
        ? db.collection('DailyRoutine').findOne(safeUserQuery) : Promise.resolve(null),

      (fetchType === 'timetable' || fetchType === 'all')
        ? db.collection('timetables').findOne(safeUserQuery) : Promise.resolve(null)
    ]);

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

      if (settingsRecord) {
        ['widgetOffsets', 'clockOffsets', 'lockedWidgets', 'hiddenWallpapers', 'customDesktopWallpapers', 'customMobileWallpapers'].forEach(key => {
          if (settingsRecord[key] !== undefined) parsedData[key] = settingsRecord[key];
        });
      }

      if (tasksRecord) {
        ['tasks', 'tomorrowTasks', 'taskGroupNames', 'countdowns', 'deadlines', 'syntheticDeadlines'].forEach(key => {
          if (tasksRecord[key] !== undefined) parsedData[key] = tasksRecord[key];
        });
      }

      if (statsRecord) {
        ['history', 'stopwatchSessions'].forEach(key => {
          if (statsRecord[key] !== undefined) parsedData[key] = statsRecord[key];
        });
        if (statsRecord.dailyTimes !== undefined) parsedData.dailyTimes = statsRecord.dailyTimes;
      }

      if (dailyRoutineRecord) {
        if (dailyRoutineRecord.dailyTimes !== undefined) parsedData.dailyTimes = dailyRoutineRecord.dailyTimes;
      }
    }

    // FORCE TIMETABLE OVERWRITE
    if (timetableRecord) {
      ['timetableGrid', 'timetableColors', 'weekdayTimes', 'weekendTimes', 'timetableStartTime', 'timetableWeekendStartTime', 'useTimetableRange'].forEach(key => {
        if (timetableRecord[key] !== undefined) parsedData[key] = timetableRecord[key];
      });
    }

    const isTaskSharingEnabled = friendship.taskSharing?.[friendId] !== false && friendship.taskSharing?.[friendId?.toString()] !== false;

    let finalTasks = isTaskSharingEnabled ? (parsedData.tasks || []) : undefined;
    let finalTomorrowTasks = isTaskSharingEnabled ? (parsedData.tomorrowTasks || []) : undefined;

    if (finalTasks && finalTomorrowTasks) {
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
      useTimetableRange: parsedData.useTimetableRange || false,
      lastLogin: friendAccount?.lastLogin || null,
      createdAt: friendAccount?.createdAt || null
    };

    return NextResponse.json({ stats: publicStats });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}