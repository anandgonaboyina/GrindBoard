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
    if (!body.updates) return NextResponse.json({ error: 'No updates provided' }, { status: 400 });

    await dbConnect();
    const updatedTimetable = await Timetable.findOneAndUpdate(
      { userId: user.userId },
      { $set: body.updates, lastModified: Date.now() },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: updatedTimetable });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update timetable' }, { status: 500 });
  }
}