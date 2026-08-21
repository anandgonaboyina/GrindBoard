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

    const groups = await db.collection('Group').find({
      'members.userId': user.userId
    }).toArray();

    // 1. Fetch friendships of current user
    const friendships = await db.collection('Friendship').find({
      $or: [
        { senderId: user.userId },
        { receiverId: user.userId }
      ],
      status: 'ACCEPTED'
    }).toArray();

    const friendIds = new Set(friendships.map(f => 
      f.senderId === user.userId ? f.receiverId : f.senderId
    ));

    // 2. Fetch all users for alias and generating indexes
    const users = await db.collection('User').find({}, {
      projection: { password: 0, email: 0 }
    }).toArray();

    // Create a map for quick user lookup and stable indexing
    const userIndexMap: Record<string, number> = {};
    const userAliasMap: Record<string, string> = {};
    const userNameMap: Record<string, string> = {};
    users.forEach((u, index) => {
      userIndexMap[u._id.toString()] = index;
      if (u.alias) userAliasMap[u._id.toString()] = u.alias;
      userNameMap[u._id.toString()] = u.username;
    });

    // 3. Process groups and anonymize names
    const processedGroups = groups.map(group => {
      const processedMembers = group.members.map((member: any) => {
        const memberIdStr = member.userId;
        const isMe = memberIdStr === user.userId;
        const isFriend = friendIds.has(memberIdStr);
        const index = userIndexMap[memberIdStr] || 0;
        const alias = userAliasMap[memberIdStr];
        const realUsername = userNameMap[memberIdStr] || member.username;

        let displayName = `User${index + 1000}`;
        if (isMe) {
          displayName = alias ? `${alias} (You)` : `${realUsername} (You)`;
        } else if (isFriend) {
          displayName = alias ? `${alias} (${realUsername})` : realUsername;
        } else if (alias) {
          displayName = alias;
        }

        return {
          ...member,
          username: displayName, // Overwrite the username with the anonymous/display name
          isMe
        };
      });

      return {
        ...group,
        members: processedMembers
      };
    });

    return NextResponse.json({ groups: processedGroups });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { title, description, isPrivate, allowJoinRequests, tasks } = await req.json();
    if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db();

    const createdGroupsCount = await db.collection('Group').countDocuments({ adminId: user.userId });
    if (createdGroupsCount >= 3) {
      return NextResponse.json({ error: 'Maximum limit reached. You can only create up to 3 groups.' }, { status: 403 });
    }

    const newGroup = {
      title,
      description: description || '',
      isPrivate: isPrivate || false,
      allowJoinRequests: allowJoinRequests !== undefined ? allowJoinRequests : true,
      adminId: user.userId,
      createdAt: new Date(),
      members: [
        {
          userId: user.userId,
          username: user.username,
          role: 'admin',
          canEdit: true,
          joinedAt: new Date()
        }
      ],
      tasks: Array.isArray(tasks) ? tasks : [],
      completions: {} // user_id -> date_str -> task_id -> { completed: boolean, timeSpent: number }
    };

    const result = await db.collection('Group').insertOne(newGroup);

    return NextResponse.json({ success: true, group: { ...newGroup, _id: result.insertedId } });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}
