import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { dateStr, minutes } = await request.json();

    if (!dateStr || typeof minutes !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (minutes < 60) {
      return NextResponse.json({ message: 'No streak update needed' });
    }

    const client = await clientPromise;
    const db = client.db();
    const userObjId = new ObjectId(decoded.userId);
    
    const user = await db.collection('User').findOne({ _id: userObjId }, { projection: { streak: 1 } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let streak = user.streak;
    let updated = false;

    if (!streak) {
      // Fetch history from DashboardStorage to calculate accurate historical streaks
      const storage = await db.collection('DashboardStorage').findOne({ userId: decoded.userId }, { projection: { 'state.history': 1 } });
      const history = storage?.state?.history || {};
      
      let maxStreak = 0;
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

      // Calculate current streak tracing back from dateStr
      let currentStreak = 0;
      const reqDate = new Date(dateStr);
      reqDate.setHours(0,0,0,0);
      
      let activeDate = new Date(reqDate);
      if (!history[dateStr] || history[dateStr] < 60) {
        // Technically this API is called when minutes >= 60, but just in case
        if (minutes >= 60) {
          history[dateStr] = minutes;
        } else {
          activeDate.setDate(activeDate.getDate() - 1);
        }
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
      if (currentStreak === 0 && minutes >= 60) {
        currentStreak = 1; // At minimum 1 since they just did 60 mins
        if (maxStreak === 0) maxStreak = 1;
      }

      streak = { lastUpdate: dateStr, currentStreak, maxStreak };
      updated = true;
    } else {
      const reqDate = new Date(dateStr);
      const lastUpdateDate = new Date(streak.lastUpdate);
      
      const diffTime = reqDate.getTime() - lastUpdateDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

      if (diffDays === 1) {
        // Continuous day
        streak.currentStreak += 1;
        if (streak.currentStreak > streak.maxStreak) {
          streak.maxStreak = streak.currentStreak;
        }
        streak.lastUpdate = dateStr;
        updated = true;
      } else if (diffDays > 1) {
        // Streak broken, reset to 1
        streak.currentStreak = 1;
        streak.lastUpdate = dateStr;
        updated = true;
      } else if (diffDays === 0) {
        // Already updated today, do nothing
      } else {
         // diffDays < 0 (updating a past day?), generally ignore
      }
    }

    if (updated) {
      await db.collection('User').updateOne(
        { _id: userObjId },
        { $set: { streak } }
      );
    }

    return NextResponse.json({ streak });
  } catch (error) {
    console.error('Streak API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
