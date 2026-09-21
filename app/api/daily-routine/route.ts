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
        
        const record = await db.collection('DailyRoutine').findOne({ userId: user.userId });
        
        if (!record) return NextResponse.json({ data: null });

        const { _id, userId, ...coreData } = record as any;
        return NextResponse.json({ success: true, data: coreData });
    } catch (error) {
        console.error('Error fetching DailyRoutine:', error);
        return NextResponse.json({ error: 'Failed to fetch DailyRoutine' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const user = authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const client = await clientPromise;
        const db = client.db();
        const collection = db.collection('DailyRoutine');

        // 1. Ensure document exists
        await collection.updateOne(
            { userId: user.userId },
            { $setOnInsert: { dailyTimes: {}, lastModified: Date.now() } },
            { upsert: true }
        );

        // 2. ATOMIC OFFLINE QUEUE PROCESSOR
        if (body.actions && Array.isArray(body.actions) && body.actions.length > 0) {
            const bulkOps: any[] = [];

            for (const action of body.actions) {
                if (action.type === 'UPDATE_DAILY_TIME') {
                    // Uses dot notation to safely set just the specific timestamp (e.g. "dailyTimes.2026-09-21.wakeupTime")
                    bulkOps.push({
                        updateOne: {
                            filter: { userId: user.userId },
                            update: { 
                                $set: { 
                                    [`dailyTimes.${action.dateKey}.${action.field}`]: action.timestamp,
                                    lastModified: Date.now()
                                } 
                            }
                        }
                    });
                } 
                else if (action.type === 'REPLACE_ALL') {
                    bulkOps.push({
                        updateOne: {
                            filter: { userId: user.userId },
                            update: { $set: { dailyTimes: action.dailyTimes, lastModified: Date.now() } }
                        }
                    });
                }
            }

            if (bulkOps.length > 0) {
                // Cast to any to bypass strict TS Document validation
                await collection.bulkWrite(bulkOps as any);
            }
            
            return NextResponse.json({ success: true, message: 'Queue processed atomically' });
        }

        // 3. FALLBACK FOR INSTANT SAVES
        if (body.updates) {
            await collection.updateOne(
                { userId: user.userId },
                { $set: { ...body.updates, lastModified: Date.now() } }
            );
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'No valid actions or updates provided' }, { status: 400 });

    } catch (error) {
        console.error('Error updating DailyRoutine:', error);
        return NextResponse.json({ error: 'Failed to update DailyRoutine' }, { status: 500 });
    }
}