export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

const authenticate = (request: Request) => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as { userId: string };
  } catch { return null; }
};

export async function GET(request: Request) {
  try {
    const user = authenticate(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const client = await clientPromise;
    const db = client.db();
    const record = await db.collection('Roadmaps').findOne({ userId: user.userId });

    return NextResponse.json({ success: true, data: { roadmaps: record?.roadmaps || [] } });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch roadmaps' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = authenticate(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('Roadmaps');

    if (body.actions && Array.isArray(body.actions)) {
      for (const action of body.actions) {
        if (action.type === 'REPLACE_ALL') {
          await collection.updateOne(
            { userId: user.userId },
            { 
              $set: { roadmaps: action.roadmaps, lastModified: Date.now() },
              $setOnInsert: { userId: user.userId }
            },
            { upsert: true }
          );
        }
      }
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'No actions provided' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update roadmaps' }, { status: 500 });
  }
}