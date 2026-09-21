export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Timetable from '@/models/Timetable';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

const authenticate = (request: Request) => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
};

export async function GET(request: Request) {
  try {
    const user = authenticate(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const timetable = await Timetable.findOne({ userId: user.userId });
    return NextResponse.json({ success: true, data: timetable });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch timetable' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = authenticate(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    await dbConnect();

    // 1. Ensure document exists
    await Timetable.updateOne(
      { userId: user.userId },
      { $setOnInsert: { lastModified: Date.now() } },
      { upsert: true }
    );

    // 2. ATOMIC OFFLINE QUEUE PROCESSOR
    if (body.actions && Array.isArray(body.actions) && body.actions.length > 0) {
      const bulkOps: any[] = [];

      for (const action of body.actions) {
        if (action.type === 'UPDATE_TIMETABLE') {
          // Dynamically sets exactly what was changed (supports dot notation like "timetableGrid.Mon.09:00 AM")
          bulkOps.push({
            updateOne: {
              filter: { userId: user.userId },
              update: { $set: { ...action.updates, lastModified: Date.now() } }
            }
          });
        }
      }

      if (bulkOps.length > 0) {
        await Timetable.bulkWrite(bulkOps as any);
      }
      
      return NextResponse.json({ success: true, message: 'Queue processed atomically' });
    }

    // 3. FALLBACK FOR INSTANT SAVES
    if (body.updates) {
      const updatedTimetable = await Timetable.findOneAndUpdate(
        { userId: user.userId },
        { $set: { ...body.updates, lastModified: Date.now() } },
        { new: true }
      );
      return NextResponse.json({ success: true, data: updatedTimetable });
    }

    return NextResponse.json({ error: 'No valid actions or updates provided' }, { status: 400 });

  } catch (error) {
    console.error('Error updating timetable:', error);
    return NextResponse.json({ error: 'Failed to update timetable' }, { status: 500 });
  }
}