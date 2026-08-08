import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const authenticateAdmin = (request: Request) => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as any;
    return decoded.role === 'admin' ? decoded : null;
  } catch { return null; }
};

// Public GET — returns roadmap items + user's feedback submissions
export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db();

    // Dedicated Roadmap collection (admin-managed)
    const roadmap = await db.collection('Roadmap')
      .find({})
      .sort({ priority: 1, createdAt: -1 })
      .toArray();

    const mappedRoadmap = roadmap.map(item => ({
      id: item._id.toString(),
      title: item.title,
      description: item.description,
      status: item.status, // planned | in_progress | done
      priority: item.priority,
      createdAt: item.createdAt
    }));

    return NextResponse.json({ roadmap: mappedRoadmap });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch roadmap' }, { status: 500 });
  }
}

// Admin: POST to add roadmap item
export async function POST(request: Request) {
  const admin = authenticateAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { title, description, status, priority } = await request.json();
    if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection('Roadmap').insertOne({
      title,
      description: description || '',
      status: status || 'planned',
      priority: priority || 99,
      createdAt: new Date()
    });

    return NextResponse.json({ success: true, id: result.insertedId.toString() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add roadmap item' }, { status: 500 });
  }
}

// Admin: DELETE roadmap item
export async function DELETE(request: Request) {
  const admin = authenticateAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db();

    await db.collection('Roadmap').deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete roadmap item' }, { status: 500 });
  }
}

// Admin: PATCH roadmap item
export async function PATCH(request: Request) {
  const admin = authenticateAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, title, description, status, priority } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db();

    const updateDoc: any = {};
    if (title !== undefined) updateDoc.title = title;
    if (description !== undefined) updateDoc.description = description;
    if (status !== undefined) updateDoc.status = status;
    if (priority !== undefined) updateDoc.priority = priority;

    await db.collection('Roadmap').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateDoc }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update roadmap item' }, { status: 500 });
  }
}
