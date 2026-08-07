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

    // 1. Fetch all users
    const users = await db.collection('User').find({}, {
      projection: { password: 0, email: 0 }
    }).toArray();

    // 2. Fetch friendships of current user
    const friendships = await db.collection('Friendship').find({
      $or: [
        { senderId: decoded.userId },
        { receiverId: decoded.userId }
      ],
      status: 'ACCEPTED'
    }).toArray();

    const friendIds = new Set(friendships.map(f => 
      f.senderId === decoded.userId ? f.receiverId : f.senderId
    ));

    // 3. Fetch all stats to get history
    const stats = await db.collection('Stats').find({}, {
      projection: { userId: 1, history: 1 }
    }).toArray();

    // 4. Fetch all daily routines to get wake/sleep times
    const dailyRoutines = await db.collection('DailyRoutine').find({}, {
      projection: { userId: 1, dailyTimes: 1 }
    }).toArray();

    const userHistories: Record<string, Record<string, number>> = {};
    const userDailyTimes: Record<string, Record<string, any>> = {};
    
    stats.forEach(stat => {
      userHistories[stat.userId] = stat.history || {};
    });

    dailyRoutines.forEach(routine => {
      userDailyTimes[routine.userId] = routine.dailyTimes || {};
    });

    const getLocalDateString = (d: Date) => {
      const offset = d.getTimezoneOffset();
      const localDate = new Date(d.getTime() - (offset * 60 * 1000));
      return localDate.toISOString().split('T')[0];
    };

    const todayDate = new Date();
    const todayStr = getLocalDateString(todayDate);

    // This Week (Mon-Sun)
    const thisWeekDays: string[] = [];
    let currentDayOfWeek = todayDate.getDay() === 0 ? 7 : todayDate.getDay();
    let mondayDate = new Date(todayDate);
    mondayDate.setDate(todayDate.getDate() - currentDayOfWeek + 1);
    for (let i = 0; i < 7; i++) {
      const d = new Date(mondayDate); d.setDate(mondayDate.getDate() + i); thisWeekDays.push(getLocalDateString(d));
    }

    // Last Week (Mon-Sun of previous week)
    const lastWeekDays: string[] = [];
    const lastWeekMonday = new Date(mondayDate);
    lastWeekMonday.setDate(mondayDate.getDate() - 7);
    for (let i = 0; i < 7; i++) {
      const d = new Date(lastWeekMonday); d.setDate(lastWeekMonday.getDate() + i); lastWeekDays.push(getLocalDateString(d));
    }

    // This Month
    const thisMonthDays: string[] = [];
    let lastDayOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= lastDayOfMonth; i++) {
      const d = new Date(todayDate.getFullYear(), todayDate.getMonth(), i); thisMonthDays.push(getLocalDateString(d));
    }

    // Last Month
    const lastMonthDays: string[] = [];
    const prevMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() - 1, 1);
    const lastDayOfPrevMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= lastDayOfPrevMonth; i++) {
      const d = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), i); lastMonthDays.push(getLocalDateString(d));
    }

    const leaderboard = users.map((u, index) => {
      const uIdStr = u._id.toString();
      const history = userHistories[uIdStr] || {};
      const dailyTimes = userDailyTimes[uIdStr] || {};
      
      const yesterdayDate = new Date(todayDate);
      yesterdayDate.setDate(todayDate.getDate() - 1);
      const yesterdayStr = getLocalDateString(yesterdayDate);
      
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
        const y10pm = new Date(yesterdayDate);
        y10pm.setHours(22, 0, 0, 0);
        yesterdayBedTime = y10pm.getTime();
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
        const sortedDates = Object.keys(history).sort((a, b) => a.localeCompare(b));
        
        for (let i = 0; i < sortedDates.length; i++) {
          const dStr = sortedDates[i];
          if (history[dStr] >= 60) {
            if (i > 0) {
              const prevDate = new Date(sortedDates[i-1]);
              const currDate = new Date(dStr);
              const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
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

        const streakCheckDate = new Date(todayDate);
        streakCheckDate.setHours(0,0,0,0);
        
        let activeDate = new Date(streakCheckDate);
        if (!history[todayStr] || history[todayStr] < 60) {
          activeDate.setDate(activeDate.getDate() - 1);
        }

        while (true) {
          const activeStr = `${activeDate.getFullYear()}-${String(activeDate.getMonth() + 1).padStart(2, '0')}-${String(activeDate.getDate()).padStart(2, '0')}`;
          if (history[activeStr] && history[activeStr] >= 60) {
            currentStreak++;
            activeDate.setDate(activeDate.getDate() - 1);
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
