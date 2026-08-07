import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const news = await db.collection('News').find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ news });
  } catch (error) {
    console.error('Failed to fetch news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify admin
    const client = await clientPromise;
    const db = client.db();
    const user = await db.collection('User').findOne({ username: decoded.username });
    if (!user || (user.isAdmin !== true && user.isAdmin !== "true")) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, broadcastDate, media } = body;

    if (!title || !content || !broadcastDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newPost = {
      title,
      content,
      broadcastDate,
      media: media || {},
      createdAt: Date.now()
    };

    const result = await db.collection('News').insertOne(newPost);

    return NextResponse.json({ success: true, post: { ...newPost, _id: result.insertedId } });
  } catch (error) {
    console.error('Failed to create news:', error);
    return NextResponse.json({ error: 'Failed to create news' }, { status: 500 });
  }
}
