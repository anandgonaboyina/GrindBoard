import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { deleteInactiveUsers } from '@/lib/cleanup';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string, username: string };
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Fire and forget cleanup
    deleteInactiveUsers().catch(console.error);

    // 🚀 THE MAGIC FIX: Fire ALL 4 database queries simultaneously
    // This cuts the database wait time by up to 75%
    const [users, friendships, stats, dailyRoutines] = await Promise.all([
      db.collection('User').find({}, { 
        projection: { _id: 1, username: 1, alias: 1, profilePicture: 1 } // Only grab exactly what we need
      }).toArray(),
      
      db.collection('Friendship').find({
        $or: [
          { senderId: decoded.userId },
          { receiverId: decoded.userId }
        ],
        status: 'ACCEPTED'
      }).toArray(),
      
      db.collection('Stats').find({}, { 
        projection: { userId: 1, history: 1 } 
      }).toArray(),
      
      db.collection('DailyRoutine').find({}, { 
        projection: { userId: 1, dailyTimes: 1 } 
      }).toArray()
    ]);

    const friendIds = new Set(friendships.map(f => 
      f.senderId === decoded.userId ? f.receiverId : f.senderId
    ));

    const userHistories: Record<string, Record<string, number>> = {};
    const userDailyTimes: Record<string, Record<string, any>> = {};
    
    stats.forEach(stat => {
      userHistories[stat.userId] = stat.history || {};
    });

    dailyRoutines.forEach(routine => {
      userDailyTimes[routine.userId] = routine.dailyTimes || {};
    });

    const url = new URL(request.url);
    const clientOffsetParam = url.searchParams.get('offset');
    const clientOffset = clientOffsetParam ? parseInt(clientOffsetParam, 10) : new Date().getTimezoneOffset();

    const now = Date.now();
    const localMs = now - (clientOffset * 60 * 1000);
    const getStr = (ms: number) => new Date(ms).toISOString().split('T')[0];
    const todayStr = getStr(localMs);

    const localDate = new Date(localMs);
    const year = localDate.getUTCFullYear();
    const month = localDate.getUTCMonth();
    const date = localDate.getUTCDate();
    const day = localDate.getUTCDay();

    // This Week (Mon-Sun)
    const thisWeekDays: string[] = [];
    let currentDayOfWeek = day === 0 ? 7 : day;
    const mondayMs = Date.UTC(year, month, date - currentDayOfWeek + 1);
    for (let i = 0; i < 7; i++) {
      thisWeekDays.push(getStr(mondayMs + i * 86400000));
    }

    // Last Week (Mon-Sun)
    const lastWeekDays: string[] = [];
    const lastWeekMondayMs = mondayMs - 7 * 86400000;
    for (let i = 0; i < 7; i++) {
      lastWeekDays.push(getStr(lastWeekMondayMs + i * 86400000));
    }

    // This Month
    const thisMonthDays: string[] = [];
    const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    for (let i = 1; i <= lastDayOfMonth; i++) {
      thisMonthDays.push(getStr(Date.UTC(year, month, i)));
    }

    // Last Month
    const lastMonthDays: string[] = [];
    const lastDayOfPrevMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    for (let i = 1; i <= lastDayOfPrevMonth; i++) {
      lastMonthDays.push(getStr(Date.UTC(year, month - 1, i)));
    }

    const leaderboard = users.map((u, index) => {
      const uIdStr = u._id.toString();
      const history = userHistories[uIdStr] || {};
      const dailyTimes = userDailyTimes[uIdStr] || {};
      
      const yesterdayMs = localMs - 86400000;
      const yesterdayStr = getStr(yesterdayMs);
      const todayDaily = dailyTimes[todayStr] || {};
      
      let userBedTime = 0;
      Object.values(dailyTimes).forEach((daily: any) => {
        if (daily.bedTime && daily.bedTime > userBedTime) {
          userBedTime = daily.bedTime;
        }
      });
      if (userBedTime === 0) userBedTime = null as any;

      const yesterdayDaily = dailyTimes[yesterdayStr] || {};
      let yesterdayBedTime = yesterdayDaily.bedTime || null;
      if (!yesterdayBedTime) {
        const yDate = new Date(yesterdayMs);
        const yYear = yDate.getUTCFullYear();
        const yMonth = yDate.getUTCMonth();
        const yDay = yDate.getUTCDate();
        
        const y10pmLocalMapped = Date.UTC(yYear, yMonth, yDay, 22, 0, 0, 0);
        yesterdayBedTime = y10pmLocalMapped + (clientOffset * 60 * 1000);
      }

      const todayFocused = history[todayStr] || 0;
      const yesterdayFocused = history[yesterdayStr] || 0;
      const thisWeekFocused = thisWeekDays.reduce((acc, date) => acc + (history[date] || 0), 0);
      const lastWeekFocused = lastWeekDays.reduce((acc, date) => acc + (history[date] || 0), 0);
      const thisMonthFocused = thisMonthDays.reduce((acc, date) => acc + (history[date] || 0), 0);
      const lastMonthFocused = lastMonthDays.reduce((acc, date) => acc + (history[date] || 0), 0);

      const isMe = uIdStr === decoded.userId;
      const isFriend = friendIds.has(uIdStr);
      
      let displayName = `User${index + 1000}`;
      if (isMe) {
        displayName = u.alias ? `${u.alias} (You)` : `${u.username} (You)`;
      } else if (isFriend) {
        displayName = u.alias ? `${u.alias} (${u.username})` : u.username;
      } else if (u.alias) {
        displayName = u.alias;
      }

      let currentStreak = 0;
      let maxStreak = 0;
      
      if (Object.keys(history).length > 0) {
        let tempStreak = 0;
        const sortedDates = Object.keys(history).sort(); // String sort is slightly faster here
        
        for (let i = 0; i < sortedDates.length; i++) {
          const dStr = sortedDates[i];
          if (history[dStr] >= 60) {
            if (i > 0) {
              const prevDate = new Date(sortedDates[i-1]);
              const currDate = new Date(dStr);
              const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / 86400000);
              if (diffDays === 1) {
                tempStreak++;
              } else {
                tempStreak = 1;
              }
            } else {
              tempStreak = 1;
            }
            if (tempStreak > maxStreak) maxStreak = tempStreak;
          } else {
            tempStreak = 0;
          }
        }

        let activeMs = localMs;
        if (!history[todayStr] || history[todayStr] < 60) {
          activeMs -= 86400000;
        }

        while (true) {
          const activeStr = getStr(activeMs);
          if (history[activeStr] && history[activeStr] >= 60) {
            currentStreak++;
            activeMs -= 86400000;
          } else {
            break;
          }
        }
        
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      }

      return {
        id: uIdStr,
        displayName,
        isMe,
        todayFocused,
        yesterdayFocused,
        thisWeekFocused,
        lastWeekFocused,
        thisMonthFocused,
        lastMonthFocused,
        wakeupTime: todayDaily.wakeupTime || null,
        workStartedTime: todayDaily.workStartedTime || null,
        bedTime: userBedTime,
        yesterdayBedTime: yesterdayBedTime,
        profilePicture: u.profilePicture || null,
        streak: currentStreak,
        maxStreak: maxStreak
      };
    });

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}