export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

const authenticate = (request: Request) => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
  } catch (err) {
    return null;
  }
};

export async function GET(request: Request) {
  try {
    const user = authenticate(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const client = await clientPromise;
    const db = client.db();

    const dbUser = await db.collection('User').findOne({ _id: new ObjectId(user.userId) });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const received = await db.collection('Friendship').find({ receiverId: user.userId }).toArray();
    const sent = await db.collection('Friendship').find({ senderId: user.userId }).toArray();

    const allUserIds = new Set([
      ...received.map(f => f.senderId?.toString()),
      ...sent.map(f => f.receiverId?.toString())
    ]);

    const users = await db.collection('User').find({
      _id: { $in: Array.from(allUserIds).filter(Boolean).map(id => new ObjectId(id as string)) }
    }).project({ _id: 1, username: 1, alias: 1, lastLogin: 1, profilePicture: 1, lastActiveAt: 1 }).toArray();

    const userMap = new Map(users.map(u => {
      const idStr = u._id.toString();
      let lastActive = null;
      if (u.lastActiveAt) {
        lastActive = new Date(u.lastActiveAt).getTime();
      } else if (u.lastLogin) {
        lastActive = new Date(u.lastLogin).getTime();
      }
      return [idStr, { 
        id: idStr, 
        username: u.username,
        alias: u.alias || '',
        profilePicture: u.profilePicture || null,
        lastActive
      }];
    }));

    const pendingRequests = received
      .filter(f => f.status === 'PENDING')
      .map(f => ({ id: f._id.toString(), user: userMap.get(f.senderId?.toString()) }))
      .filter(f => f.user);
      
    const sentRequests = sent
      .filter(f => f.status === 'PENDING')
      .map(f => ({ id: f._id.toString(), user: userMap.get(f.receiverId?.toString()) }))
      .filter(f => f.user);
    
    const acceptedFriends = [
      ...received.filter(f => f.status === 'ACCEPTED').map(f => ({ id: f._id.toString(), user: userMap.get(f.senderId?.toString()), taskSharing: f.taskSharing || {} })),
      ...sent.filter(f => f.status === 'ACCEPTED').map(f => ({ id: f._id.toString(), user: userMap.get(f.receiverId?.toString()), taskSharing: f.taskSharing || {} }))
    ].filter(f => f.user);

    return NextResponse.json({ pendingRequests, sentRequests, acceptedFriends });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = authenticate(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { receiverId } = await request.json();
    if (!receiverId || receiverId === user.userId) return NextResponse.json({ error: 'Invalid receiver' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db();

    const existing = await db.collection('Friendship').findOne({
      $or: [
        { senderId: user.userId, receiverId },
        { senderId: receiverId, receiverId: user.userId }
      ]
    });

    if (existing) return NextResponse.json({ error: 'Friendship already exists' }, { status: 400 });

    const result = await db.collection('Friendship').insertOne({
      senderId: user.userId,
      receiverId,
      status: 'PENDING',
      createdAt: new Date()
    });

    return NextResponse.json({ success: true, friendship: { id: result.insertedId } });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send request' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = authenticate(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { friendshipId, status, taskSharing } = await request.json();

    const client = await clientPromise;
    const db = client.db();

    const friendship = await db.collection('Friendship').findOne({ _id: new ObjectId(friendshipId) });
    
    if (taskSharing !== undefined) {
      if (!friendship || (friendship.senderId?.toString() !== user.userId && friendship.receiverId?.toString() !== user.userId)) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
      }
      const updateKey = `taskSharing.${user.userId}`;
      await db.collection('Friendship').updateOne(
        { _id: new ObjectId(friendshipId) },
        { $set: { [updateKey]: taskSharing } }
      );
      return NextResponse.json({ success: true });
    }

    if (!friendship || friendship.receiverId?.toString() !== user.userId) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    if (status === 'REJECTED') {
      await db.collection('Friendship').deleteOne({ _id: new ObjectId(friendshipId) });
    } else {
      await db.collection('Friendship').updateOne(
        { _id: new ObjectId(friendshipId) },
        { $set: { status: 'ACCEPTED' } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = authenticate(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const friendshipId = searchParams.get('id');

    if (!friendshipId) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db();

    const friendship = await db.collection('Friendship').findOne({ _id: new ObjectId(friendshipId) });
    if (!friendship || (friendship.senderId?.toString() !== user.userId && friendship.receiverId?.toString() !== user.userId)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    await db.collection('Friendship').deleteOne({ _id: new ObjectId(friendshipId) });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete friend' }, { status: 500 });
  }
}
