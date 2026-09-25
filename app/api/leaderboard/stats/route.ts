import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export async function GET(request: Request) {
  try {
    // 1. Verify Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    try {
      jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 2. Extract User ID from URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Invalid User ID' }, { status: 400 });
    }

    // 3. Connect to DB
    const client = await clientPromise;
    const db = client.db();

    // 4. Query the separate "Stats" collection using the userId!
    // We check both string and ObjectId formats just to be perfectly safe based on your DB screenshot
    const userStats = await db.collection('Stats').findOne({
      $or: [
        { userId: id },
        { userId: ObjectId.isValid(id) ? new ObjectId(id) : id }
      ]
    });

    if (!userStats) {
      // If they have no stats yet, return empty data instead of an error so the UI doesn't break
      return NextResponse.json({ 
        success: true, 
        history: {},
        dailyTimes: {}
      });
    }

    // 5. Return safe public payload
    return NextResponse.json({ 
      success: true, 
      history: userStats.history || {},
      dailyTimes: userStats.dailyTimes || {}
    });

  } catch (error) {
    console.error('Failed to fetch public stats:', error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}