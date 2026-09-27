import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export async function GET(request: Request) {
  try {
    // 1. Verify Authentication & Extract Requester
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // The ID of the person making the request
    const requesterId = decoded.id || decoded.userId;

    // 2. Extract Target User ID (The Rival) from URL
    const url = new URL(request.url);
    const targetId = url.searchParams.get('id');

    if (!targetId) {
      return NextResponse.json({ success: false, error: 'Invalid Target User ID' }, { status: 400 });
    }

    // 3. Connect to DB
    const client = await clientPromise;
    const db = client.db();

    // ====================================================================
    // 4. THE GRIND WALL (BACKEND VERIFICATION)
    // ====================================================================
    // if the requester is trying to view someone else's stats
    if (requesterId !== targetId) {
      const requesterStats = await db.collection('Stats').findOne({
        $or: [
          { userId: requesterId },
          { userId: ObjectId.isValid(requesterId) ? new ObjectId(requesterId) : requesterId }
        ]
      });

      // Generate today's date strings (Handling both UTC and IST timezones safely)
      const todayUtc = new Date().toISOString().split('T')[0];
      const todayIstObj = new Date(new Date().getTime() + (330 * 60 * 1000));
      const todayIst = todayIstObj.toISOString().split('T')[0];

      const history = requesterStats?.history || {};
      const todayMins = Math.max((history[todayUtc] || 0), (history[todayIst] || 0));

      if (todayMins < 180) {
        //  lock: refuses to send the data
        return NextResponse.json({ 
          success: false, 
          error: 'Access Denied: You must complete 3 hours of focus today before viewing Rivals.' 
        }, { status: 403 });
      }
    }

    // 5. Query the separate "Stats" collection for the Rival's data!
    const targetStats = await db.collection('Stats').findOne({
      $or: [
        { userId: targetId },
        { userId: ObjectId.isValid(targetId) ? new ObjectId(targetId) : targetId }
      ]
    });

    if (!targetStats) {
      // have no stats yet, return empty data so UI doesn't break
      return NextResponse.json({ 
        success: true, 
        history: {},
        dailyTimes: {}
      });
    }

    return NextResponse.json({ 
      success: true, 
      history: targetStats.history || {},
      dailyTimes: targetStats.dailyTimes || {}
    });

  } catch (error) {
    console.error('Failed to fetch public stats:', error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}