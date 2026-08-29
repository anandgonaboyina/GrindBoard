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

    if (group.pendingDeletion && group.pendingDeletion.scheduledAt) {
      if (new Date(group.pendingDeletion.scheduledAt).getTime() <= Date.now()) {
        await db.collection('Group').deleteOne({ _id: groupId });
        await db.collection('GroupRequest').deleteMany({ groupId: groupId.toString() });
        return NextResponse.json({ error: 'Group expired and deleted' }, { status: 404 });
      }
    }

    const userMap = new Map();
    const groupUserIds = group.members.map((m: any) => m.userId);
    const groupUsers = await db.collection('User').find({
      $or: [
        { _id: { $in: groupUserIds.map((id: string) => { try { return new ObjectId(id); } catch { return id; } }) } },
        { userId: { $in: groupUserIds } }
      ]
    }).toArray();

    groupUsers.forEach((u: any) => {
      const pic = u.profilePicture || u.avatarUrl || u.avatar || '';
      userMap.set(u._id.toString(), pic);
      if (u.userId) userMap.set(u.userId, pic);
    });

    const enrichedMembers = group.members.map((m: any) => ({
      ...m,
      avatarUrl: m.avatarUrl || userMap.get(m.userId) || '',
      isMe: m.userId === user.userId
    }));

    return NextResponse.json({ group: { ...group, members: enrichedMembers } });
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
            const targetUserId = body.targetUserId || user.userId;
            await db.collection('Group').updateOne(
                { _id: groupId },
                { $set: { [`memberTasks.${targetUserId}`]: body.tasks } }
            );
            return NextResponse.json({ success: true });
        }

        if (body.action === 'update_group_tab_names') {
            await db.collection('Group').updateOne(
                { _id: groupId },
                { $set: { tabNames: body.tabNames } }
            );
            return NextResponse.json({ success: true });
        }

        if (body.action === 'update_tab_names') {
            const targetUserId = body.targetUserId || user.userId;
            await db.collection('Group').updateOne(
                { _id: groupId },
                { 
                  $set: { 
                    [`memberTabNames.${targetUserId}`]: body.tabNames
                  } 
                }
            );
            return NextResponse.json({ success: true });
        }

        if (body.action === 'update_info') {
            if (group.adminId !== user.userId) {
                return NextResponse.json({ error: 'Only admin can edit group info' }, { status: 403 });
            }
            await db.collection('Group').updateOne(
                { _id: groupId },
                {
                  $set: {
                    title: body.title,
                    description: body.description,
                    isPrivate: body.isPrivate,
                    allowJoinRequests: body.allowJoinRequests !== undefined ? body.allowJoinRequests : true,
                    avatarUrl: body.avatarUrl !== undefined ? body.avatarUrl : (group.avatarUrl || '')
                  }
                }
            );
            return NextResponse.json({ success: true });
        }

        if (body.action === 'update_completion') {
            const { dateStr, taskId, completed, timeSpent, targetUserId: bodyTargetUserId } = body;
            const targetUserId = bodyTargetUserId || user.userId;
            const updatePath = `completions.${targetUserId}.${dateStr}.${taskId}`;
            await db.collection('Group').updateOne(
                { _id: groupId },
                { $set: { [updatePath]: { completed, timeSpent } } }
            );
            return NextResponse.json({ success: true });
        }

        if (body.action === 'grant_edit' || body.action === 'toggle_admin_rights') {
            if (group.adminId !== user.userId) {
                return NextResponse.json({ error: 'Only primary admin can grant admin permissions' }, { status: 403 });
            }
            const { targetUserId, canEdit, isCoAdmin } = body;
            const makeCoAdmin = isCoAdmin !== undefined ? isCoAdmin : canEdit;
            await db.collection('Group').updateOne(
                { _id: groupId, 'members.userId': targetUserId },
                { 
                    $set: { 
                        'members.$.canEdit': makeCoAdmin,
                        'members.$.role': makeCoAdmin ? 'co-admin' : 'member'
                    } 
                }
            );
            return NextResponse.json({ success: true });
        }

        if (body.action === 'edit_group_task_duration') {
            const { taskId, duration, targetUserId: bodyTargetUserId } = body;
            const targetUserId = bodyTargetUserId || user.userId;
            const userTasks = group.memberTasks?.[targetUserId] || group.tasks || [];
            const updatedUserTasks = userTasks.map((t: any) => t.id === taskId ? { ...t, duration } : t);
            await db.collection('Group').updateOne(
                { _id: groupId },
                { $set: { [`memberTasks.${targetUserId}`]: updatedUserTasks } }
            );
            return NextResponse.json({ success: true });
        }

        if (body.action === 'edit_group_task_title') {
            const { taskId, title, targetUserId: bodyTargetUserId } = body;
            const targetUserId = bodyTargetUserId || user.userId;
            const userTasks = group.memberTasks?.[targetUserId] || group.tasks || [];
            const updatedUserTasks = userTasks.map((t: any) => t.id === taskId ? { ...t, title } : t);
            await db.collection('Group').updateOne(
                { _id: groupId },
                { $set: { [`memberTasks.${targetUserId}`]: updatedUserTasks } }
            );
            return NextResponse.json({ success: true });
        }

        if (body.action === 'exit_group' || body.action === 'remove_member') {
            const targetUserId = body.action === 'exit_group' ? user.userId : body.targetUserId;
            const targetUsername = body.action === 'exit_group' ? user.username : (group.members.find((m: any) => m.userId === targetUserId)?.username || '');
            if (group.adminId !== user.userId && user.userId !== targetUserId) {
                return NextResponse.json({ error: 'No permission' }, { status: 403 });
            }

            const remainingMembers = group.members.filter((m: any) => m.userId !== targetUserId);

            if (remainingMembers.length === 0) {
                // Delete group if no members remain
                await db.collection('Group').deleteOne({ _id: groupId });
                await db.collection('GroupRequest').deleteMany({ groupId: groupId.toString() });
                return NextResponse.json({ success: true, groupDeleted: true });
            }

            const unsetFields: any = {
                [`completions.${targetUserId}`]: "",
                [`memberTasks.${targetUserId}`]: "",
                [`memberTabNames.${targetUserId}`]: ""
            };
            if (targetUsername) {
                unsetFields[`completions.${targetUsername}`] = "";
                unsetFields[`memberTasks.${targetUsername}`] = "";
                unsetFields[`memberTabNames.${targetUsername}`] = "";
            }

            let updatePayload: any = {
                $pull: { members: { userId: targetUserId } },
                $unset: unsetFields
            };

            // If admin exits, transfer admin status to co-admin first as priority, or fallback to first member
            if (group.adminId === targetUserId && remainingMembers.length > 0) {
                const coAdmin = remainingMembers.find((m: any) => m.role === 'co-admin' || m.role === 'admin' || m.canEdit);
                const newAdmin = coAdmin || remainingMembers[0];
                const updatedMembers = remainingMembers.map((m: any) => m.userId === newAdmin.userId ? { ...m, role: 'admin', canEdit: true } : m);
                
                updatePayload = {
                    $set: {
                        adminId: newAdmin.userId,
                        members: updatedMembers,
                        pendingDeletion: {
                            scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                            requestedBy: targetUserId,
                            previousAdminUsername: member.username
                        }
                    },
                    $unset: unsetFields
                };
            }

            await db.collection('Group').updateOne({ _id: groupId }, updatePayload);
            await db.collection('GroupRequest').deleteMany({ groupId: groupId.toString(), userId: targetUserId });
            return NextResponse.json({ success: true });
        }

        if (body.action === 'claim_leadership') {
            await db.collection('Group').updateOne(
                { _id: groupId, 'members.userId': user.userId },
                {
                    $set: { adminId: user.userId, 'members.$.role': 'admin', 'members.$.canEdit': true },
                    $unset: { pendingDeletion: "" }
                }
            );
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
