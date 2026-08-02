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

    const streak = user.streak || { startDay: dateStr, lastDay: dateStr };
    
    const reqDate = new Date(dateStr);
    const lastDayDate = new Date(streak.lastDay);
    
    // Calculate difference in days by ignoring timezones and just using the UTC dates created from YYYY-MM-DD
    const diffTime = reqDate.getTime() - lastDayDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    let updated = false;

    if (diffDays === 1) {
      // Continous day
      streak.lastDay = dateStr;
      updated = true;
    } else if (diffDays > 1) {
      // Streak broken, reset to today
      streak.startDay = dateStr;
      streak.lastDay = dateStr;
      updated = true;
    } else if (diffDays === 0) {
      // Already updated today, but just in case startDay is missing
      if (!streak.startDay) {
        streak.startDay = dateStr;
        updated = true;
      }
    } else {
       // diffDays < 0 (updating a past day?), generally ignore
       if (!streak.startDay) {
         streak.startDay = dateStr;
         updated = true;
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
