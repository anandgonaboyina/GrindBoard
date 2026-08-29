import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
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
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    
    let queryObj = {};
    if (query && query.length > 0) {
      queryObj = { title: { $regex: query, $options: 'i' } };
    }

    const client = await clientPromise;
    const db = client.db();

    const groups = await db.collection('Group')
      .find(queryObj)
      .sort({ createdAt: -1 })
      .project({ title: 1, description: 1, adminId: 1, members: 1, tasks: 1, completions: 1, tabNames: 1, isPrivate: 1, allowJoinRequests: 1 })
      .limit(20)
      .toArray();

    const user = await getUserFromToken(req);
    let friendIds = new Set<string>();
    
    if (user) {
      const friendships = await db.collection('Friendship').find({
        $or: [
          { senderId: user.userId },
          { receiverId: user.userId }
        ],
        status: 'ACCEPTED'
      }).toArray();
      friendIds = new Set(friendships.map(f => 
        f.senderId === user.userId ? f.receiverId : f.senderId
      ));
    }

    const users = await db.collection('User').find({}, {
      projection: { password: 0, email: 0 }
    }).toArray();

    const userIndexMap: Record<string, number> = {};
    const userAliasMap: Record<string, string> = {};
    const userNameMap: Record<string, string> = {};
    const userPicMap: Record<string, string> = {};
    users.forEach((u, index) => {
      userIndexMap[u._id.toString()] = index;
      if (u.alias) userAliasMap[u._id.toString()] = u.alias;
      userNameMap[u._id.toString()] = u.username;
      userPicMap[u._id.toString()] = u.profilePicture || u.avatarUrl || '';
    });

    const safeGroups = groups.map(g => {
        const processedMembers = (g.members || []).map((member: any) => {
            const memberIdStr = member.userId;
            const isMe = user ? (memberIdStr === user.userId) : false;
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
                username: displayName,
                avatarUrl: member.avatarUrl || userPicMap[memberIdStr] || '',
                isMe
            };
        });

        return {
            _id: g._id,
            title: g.title,
            description: g.description,
            adminId: g.adminId,
            memberCount: processedMembers.length,
            members: processedMembers,
            tasks: g.tasks || [],
            completions: g.completions || {},
            tabNames: g.tabNames || ['Tab 1', 'Tab 2', 'Tab 3'],
            isPrivate: g.isPrivate || false,
            allowJoinRequests: g.allowJoinRequests !== undefined ? g.allowJoinRequests : true
        };
    });

    return NextResponse.json({ groups: safeGroups });
  } catch (error) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
