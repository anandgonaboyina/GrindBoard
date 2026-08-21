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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const resolvedParams = await params;
    const client = await clientPromise;
    const db = client.db();
    
    const groupId = new ObjectId(resolvedParams.id);
    const group = await db.collection('Group').findOne({ _id: groupId });

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const isMember = group.members.some((m: any) => m.userId === user.userId);
    if (!isMember) {
        return NextResponse.json({ group: { _id: group._id, title: group.title, description: group.description, adminId: group.adminId } });
    }

    return NextResponse.json({ group });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const resolvedParams = await params;
    const client = await clientPromise;
    const db = client.db();
    
    const groupId = new ObjectId(resolvedParams.id);
    const group = await db.collection('Group').findOne({ _id: groupId });

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    if (group.adminId !== user.userId) {
       return NextResponse.json({ error: 'Only admin can delete' }, { status: 403 });
    }

    await db.collection('Group').deleteOne({ _id: groupId });
    await db.collection('GroupRequest').deleteMany({ groupId: groupId.toString() });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await getUserFromToken(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
    try {
        const resolvedParams = await params;
        const body = await req.json();
        const client = await clientPromise;
        const db = client.db();
        const groupId = new ObjectId(resolvedParams.id);

        const group = await db.collection('Group').findOne({ _id: groupId });
        if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

        const member = group.members.find((m: any) => m.userId === user.userId);
        if (!member) return NextResponse.json({ error: 'Not a member' }, { status: 403 });

        if (body.action === 'update_task_list') {
            if (!member.canEdit && group.adminId !== user.userId) {
                return NextResponse.json({ error: 'No edit permissions' }, { status: 403 });
            }
            await db.collection('Group').updateOne(
                { _id: groupId },
                { $set: { tasks: body.tasks } }
            );
            return NextResponse.json({ success: true });
        }

        if (body.action === 'update_tab_names') {
            if (!member.canEdit && group.adminId !== user.userId) {
                return NextResponse.json({ error: 'No edit permissions' }, { status: 403 });
            }
            await db.collection('Group').updateOne(
                { _id: groupId },
                { $set: { tabNames: body.tabNames } }
            );
            return NextResponse.json({ success: true });
        }

        if (body.action === 'update_info') {
            if (group.adminId !== user.userId) {
                return NextResponse.json({ error: 'Only admin can edit group info' }, { status: 403 });
            }
            await db.collection('Group').updateOne(
                { _id: groupId },
                { $set: { title: body.title, description: body.description, isPrivate: body.isPrivate, allowJoinRequests: body.allowJoinRequests !== undefined ? body.allowJoinRequests : true } }
            );
            return NextResponse.json({ success: true });
        }

        if (body.action === 'update_completion') {
            const { dateStr, taskId, completed, timeSpent } = body;
            const updatePath = `completions.${user.userId}.${dateStr}.${taskId}`;
            await db.collection('Group').updateOne(
                { _id: groupId },
                { $set: { [updatePath]: { completed, timeSpent } } }
            );
            return NextResponse.json({ success: true });
        }

        if (body.action === 'grant_edit') {
            if (group.adminId !== user.userId) {
                return NextResponse.json({ error: 'Only admin can grant edit permissions' }, { status: 403 });
            }
            const { targetUserId, canEdit } = body;
            await db.collection('Group').updateOne(
                { _id: groupId, 'members.userId': targetUserId },
                { $set: { 'members.$.canEdit': canEdit } }
            );
            return NextResponse.json({ success: true });
        }

        if (body.action === 'edit_group_task_duration') {
            if (group.adminId !== user.userId) {
                return NextResponse.json({ error: 'Only admin can edit task duration' }, { status: 403 });
            }
            const { taskId, duration } = body;
            await db.collection('Group').updateOne(
                { _id: groupId, 'tasks.id': taskId },
                { $set: { 'tasks.$.duration': duration } }
            );
            return NextResponse.json({ success: true });
        }

        if (body.action === 'remove_member') {
            if (group.adminId !== user.userId && user.userId !== body.targetUserId) {
                return NextResponse.json({ error: 'No permission' }, { status: 403 });
            }
            await db.collection('Group').updateOne(
                { _id: groupId },
                { $pull: { members: { userId: body.targetUserId } } } as any
            );
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
