import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const client = await clientPromise;
    const db = client.db();
    const user = await db.collection('User').findOne({ username: decoded.username });
    if (user && (user.isAdmin === true || user.isAdmin === "true")) {
      return decoded;
    }
  } catch (e) { }
  return null;
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { title, content, broadcastDate, media } = body;

    const client = await clientPromise;
    const db = client.db();

    await db.collection('News').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { title, content, broadcastDate, media } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update news:', error);
    return NextResponse.json({ error: 'Failed to update news' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const client = await clientPromise;
    const db = client.db();

    await db.collection('News').deleteOne({ _id: new ObjectId(params.id) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete news:', error);
    return NextResponse.json({ error: 'Failed to delete news' }, { status: 500 });
  }
}
