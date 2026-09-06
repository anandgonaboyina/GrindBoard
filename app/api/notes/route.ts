import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
export const dynamic = 'force-dynamic';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

const authenticate = (request: Request) => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (error) {
    return null;
  }
};

export async function GET(request: Request) {
  try {
    const user = authenticate(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Fetch the notes document for this user
    const doc = await db.collection('Notes').findOne({ userId: user.userId });

    return NextResponse.json({ success: true, data: doc || { notes: [] } });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = authenticate(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.notes || !Array.isArray(body.notes)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Authoritative overwrite of the Notes collection for this user
    await db.collection('Notes').updateOne(
      { userId: user.userId },
      {
        $set: { notes: body.notes, lastModified: body.lastModified || Date.now() },
        $setOnInsert: { userId: user.userId }
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error forcefully saving notes:', error);
    return NextResponse.json({ error: 'Failed to update notes' }, { status: 500 });
  }
}
