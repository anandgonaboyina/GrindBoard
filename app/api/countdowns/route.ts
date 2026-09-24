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

// ---------------------------------------------------------------------------
//  TRUE ATOMIC DOT-NOTATION FLATTENER (Backdoor Protection)
// Protects nested objects from being completely overwritten by partial payloads
// ---------------------------------------------------------------------------
function buildDotNotation(updates: any) {
    const flattened: Record<string, any> = {};
    for (const key in updates) {
        const val = updates[key];
        // Flatten nested setting objects so MongoDB updates them safely
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
            for (const subKey in val) {
                flattened[`${key}.${subKey}`] = val[subKey];
            }
        } else {
            // Arrays and primitive values map normally
            flattened[key] = val;
        }
    }
    return flattened;
}

export async function GET(request: Request) {
    try {
        const user = authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const client = await clientPromise;
        const db = client.db();
        
        const record = await db.collection('Countdowns').findOne({ userId: user.userId });
        
        if (!record) return NextResponse.json({ data: null });

        const { _id, userId, ...coreData } = record as any;
        return NextResponse.json({ success: true, data: coreData });
    } catch (error) {
        console.error('Error fetching countdowns:', error);
        return NextResponse.json({ error: 'Failed to fetch countdowns' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const user = authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const client = await clientPromise;
        const db = client.db();
        const collection = db.collection('Countdowns');

        // 1. Ensure document exists
        await collection.updateOne(
            { userId: user.userId },
            { $setOnInsert: { countdowns: [], lastModified: Date.now() } },
            { upsert: true }
        );

        // 2. ATOMIC OFFLINE QUEUE PROCESSOR
        if (body.actions && Array.isArray(body.actions) && body.actions.length > 0) {
            const bulkOps: any[] = [];

            for (const action of body.actions) {
                if (action.type === 'ADD_COUNTDOWN') {
                    bulkOps.push({
                        updateOne: {
                            filter: { userId: user.userId },
                            update: { $push: { countdowns: action.countdown },$set: { lastModified: Date.now() } }
                        }
                    });
                } 
                else if (action.type === 'UPDATE_COUNTDOWN') {
                    const setObj: Record<string, any> = { lastModified: Date.now() };
                    for (const key in action.updates) {
                        setObj[`countdowns.$[elem].${key}`] = action.updates[key];
                    }

                    bulkOps.push({
                        updateOne: {
                            filter: { userId: user.userId },
                            update: { $set: setObj },
                            arrayFilters: [{ "elem.id": action.countdownId }]
                        }
                    });
                } 
                else if (action.type === 'DELETE_COUNTDOWN') {
                    bulkOps.push({
                        updateOne: {
                            filter: { userId: user.userId },
                            update: { $pull: { countdowns: { id: action.countdownId } },$set: { lastModified: Date.now() } }
                        }
                    });
                } 
                else if (action.type === 'REPLACE_ALL') {
                    bulkOps.push({
                        updateOne: {
                            filter: { userId: user.userId },
                            update: { $set: { countdowns: action.countdowns, lastModified: Date.now() } }
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
            //  SEAL THE BACKDOOR: Sanitize and flatten nested updates
            const safeUpdates = { ...body.updates };
            delete safeUpdates._id;
            delete safeUpdates.userId;

            const dotNotationUpdates = buildDotNotation(safeUpdates);

            await collection.updateOne(
                { userId: user.userId },
                { $set: { ...dotNotationUpdates, lastModified: Date.now() } }
            );
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'No valid actions or updates provided' }, { status: 400 });

    } catch (error) {
        console.error('Error updating countdowns:', error);
        return NextResponse.json({ error: 'Failed to update countdowns' }, { status: 500 });
    }
}