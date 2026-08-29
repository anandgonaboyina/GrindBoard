import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Delete user from User collection
    await db.collection('User').deleteOne({ _id: new ObjectId(decoded.userId) });

    // Delete related data
    await db.collection('DashboardStorage').deleteOne({ userId: decoded.userId });
    await db.collection('HealthRecord').deleteMany({ userId: decoded.userId });
    await db.collection('Friendship').deleteMany({
      $or: [
        { senderId: decoded.userId },
        { receiverId: decoded.userId }
      ]
    });

    // Clean up Group data: remove user from members, remove completions, transfer admin or delete group
    await db.collection('GroupRequest').deleteMany({
      $or: [
        { userId: decoded.userId }
      ]
    });

    const userGroups = await db.collection('Group').find({
      'members.userId': decoded.userId
    }).toArray();

    for (const grp of userGroups) {
      const remainingMembers = grp.members.filter((m: any) => m.userId !== decoded.userId);
      if (remainingMembers.length === 0) {
        await db.collection('Group').deleteOne({ _id: grp._id });
        await db.collection('GroupRequest').deleteMany({ groupId: grp._id.toString() });
      } else {
        let updatePayload: any = {
          $pull: { members: { userId: decoded.userId } },
          $unset: { [`completions.${decoded.userId}`]: "" }
        };
        if (grp.adminId === decoded.userId) {
          const nextAdmin = remainingMembers[0];
          const updatedMembers = remainingMembers.map((m: any) => m.userId === nextAdmin.userId ? { ...m, role: 'admin', canEdit: true } : m);
          updatePayload = {
            $set: {
              adminId: nextAdmin.userId,
              members: updatedMembers,
              pendingDeletion: {
                scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                requestedBy: decoded.userId,
                previousAdminUsername: decoded.username
              }
            },
            $unset: { [`completions.${decoded.userId}`]: "" }
          };
        }
        await db.collection('Group').updateOne({ _id: grp._id }, updatePayload);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
