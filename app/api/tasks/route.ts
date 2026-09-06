export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

const authenticate = (request: Request) => {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    try {
        return jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as { userId: string };
    } catch {
        return null;
    }
};

export async function GET(request: Request) {
    try {
        const user = authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const client = await clientPromise;
        const db = client.db();

        const doc = await db.collection('Tasks').findOne({ userId: user.userId });

        return NextResponse.json({
            success: true,
            data: {
                tasks: doc?.tasks || [],
                tomorrowTasks: doc?.tomorrowTasks || [],
                tasksDate: doc?.tasksDate || '',
                taskGroupNames: doc?.taskGroupNames || ['Core Tasks', 'Daily Routine', 'Milestones'],
                lastModified: doc?.lastModified || 0
            }
        });
    } catch (error) {
        console.error("GET TASKS ERROR:", error);
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const user = authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        if (!body.updates) return NextResponse.json({ error: 'No updates provided' }, { status: 400 });

        const client = await clientPromise;
        const db = client.db();

        const incomingLastModified = body.updates.lastModified || Date.now();

        // 1. Fetch current DB record to check timestamps
        const existing = await db.collection('Tasks').findOne({ userId: user.userId });

        // 2. If DB has a newer timestamp than what's coming in, reject stale overwrites
        if (existing && existing.lastModified && existing.lastModified > incomingLastModified) {
            return NextResponse.json({
                success: true,
                data: existing,
                message: "Ignored stale update"
            });
        }

        // 3. Perform update if incoming data is newer or equal
        const updated = await db.collection('Tasks').findOneAndUpdate(
            { userId: user.userId },
            {
                $set: {
                    ...body.updates,
                    lastModified: incomingLastModified
                }
            },
            { upsert: true, returnDocument: 'after' }
        );

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("PATCH TASKS ERROR:", error);
        return NextResponse.json({ error: 'Failed to update tasks' }, { status: 500 });
    }
}