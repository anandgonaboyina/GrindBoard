import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

async function getUserFromToken(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const client = await clientPromise;
    const db = client.db();

    // Find groups where this user is admin
    const groups = await db.collection('Group').find({ adminId: user.userId }).toArray();
    const groupIds = groups.map(g => g._id.toString());

    // Get pending requests for these groups
    const requests = await db.collection('GroupRequest').find({
      groupId: { $in: groupIds },
      status: 'pending'
    }).toArray();

    // Get requests sent by the user
    const sentRequests = await db.collection('GroupRequest').find({
      userId: user.userId,
      status: 'pending'
    }).toArray();

    return NextResponse.json({ requests, sentRequests });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { groupId } = await req.json();
    if (!groupId) return NextResponse.json({ error: 'GroupId required' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db();

    const group = await db.collection('Group').findOne({ _id: new ObjectId(groupId) });
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const isMember = group.members.some((m: any) => m.userId === user.userId);
    if (isMember) {
        return NextResponse.json({ error: 'Already a member' }, { status: 400 });
    }

    // Instant join only if group is public (!isPrivate) AND allowJoinRequests is explicitly false
    const allowInstantJoin = !group.isPrivate && group.allowJoinRequests === false;

    if (allowInstantJoin) {
      await db.collection('Group').updateOne(
        { _id: new ObjectId(groupId) },
        {
          $push: {
            members: {
              userId: user.userId,
              username: user.username,
              role: 'member',
              canEdit: false,
              joinedAt: new Date()
            }
          },
          $unset: {
            [`completions.${user.userId}`]: "",
            [`memberTasks.${user.userId}`]: "",
            [`memberTabNames.${user.userId}`]: "",
            [`completions.${user.username}`]: "",
            [`memberTasks.${user.username}`]: "",
            [`memberTabNames.${user.username}`]: ""
          }
        } as any
      );
      await db.collection('GroupRequest').deleteMany({ groupId, userId: user.userId });
      return NextResponse.json({ success: true, joinedInstantly: true });
    }

    // Check if private group blocked requests
    if (group.isPrivate && group.allowJoinRequests === false) {
      return NextResponse.json({ error: 'Join requests are disabled for this private group' }, { status: 400 });
    }

    const existing = await db.collection('GroupRequest').findOne({
      groupId,
      userId: user.userId,
      status: 'pending'
    });

    if (existing) {
      return NextResponse.json({ error: 'Request already sent' }, { status: 400 });
    }

    await db.collection('GroupRequest').insertOne({
      groupId,
      userId: user.userId,
      username: user.username,
      groupTitle: group.title,
      status: 'pending',
      createdAt: new Date()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send request' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { requestId, status } = await req.json();
    if (!requestId || !['accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const request = await db.collection('GroupRequest').findOne({ _id: new ObjectId(requestId) });
    if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

    const group = await db.collection('Group').findOne({ _id: new ObjectId(request.groupId) });
    if (!group || group.adminId !== user.userId) {
      return NextResponse.json({ error: 'Unauthorized to handle request' }, { status: 403 });
    }

    await db.collection('GroupRequest').deleteOne({ _id: new ObjectId(requestId) });

    if (status === 'accepted') {
      await db.collection('Group').updateOne(
        { _id: new ObjectId(request.groupId) },
        {
          $push: {
            members: {
              userId: request.userId,
              username: request.username,
              role: 'member',
              canEdit: false,
              joinedAt: new Date()
            }
          },
          $unset: {
            [`completions.${request.userId}`]: "",
            [`memberTasks.${request.userId}`]: "",
            [`memberTabNames.${request.userId}`]: "",
            [`completions.${request.username}`]: "",
            [`memberTasks.${request.username}`]: "",
            [`memberTabNames.${request.username}`]: ""
          }
        } as any
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
