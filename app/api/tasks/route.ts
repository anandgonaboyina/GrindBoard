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
        const client = await clientPromise;
        const db = client.db();
        const collection = db.collection('Tasks');

        // 1. Ensure document exists so array operations don't fail on new accounts
        await collection.updateOne(
            { userId: user.userId },
            { $setOnInsert: { tasks: [], tomorrowTasks: [], taskGroupNames: ['Core Tasks', 'Daily Routine', 'Milestones'], tasksDate: '' } },
            { upsert: true }
        );

        // 2. ATOMIC OFFLINE QUEUE PROCESSOR
        if (body.actions && Array.isArray(body.actions) && body.actions.length > 0) {
            const bulkOps: any[] = [];

            for (const action of body.actions) {
                if (action.type === 'ADD_TASK') {
                    const targetArray = action.tab === 'tomorrow' ? 'tomorrowTasks' : 'tasks';
                    bulkOps.push({
                        updateOne: {
                            filter: { userId: user.userId },
                            update: { $push: { [targetArray]: action.task },$set: { lastModified: Date.now() } }
                        }
                    });
                } 
                else if (action.type === 'UPDATE_TASK') {
                    // THIS IS WHERE THE EDIT HAPPENS!
                    // It dynamically targets only the fields that changed (e.g. `duration` or `title`)
                    const targetArray = action.tab === 'tomorrow' ? 'tomorrowTasks' : 'tasks';
                    const setObj: Record<string, any> = { lastModified: Date.now() };
                    
                    for (const key in action.updates) {
                        setObj[`${targetArray}.$[elem].${key}`] = action.updates[key];
                    }

                    bulkOps.push({
                        updateOne: {
                            filter: { userId: user.userId },
                            update: { $set: setObj },
                            arrayFilters: [{ "elem.id": action.taskId }] // Finds the specific task inside the array
                        }
                    });
                } 
                else if (action.type === 'DELETE_TASK') {
                    bulkOps.push({
                        updateOne: {
                            filter: { userId: user.userId },
                            update: { 
                                $pull: { tasks: { id: action.taskId }, tomorrowTasks: { id: action.taskId } },$set: { lastModified: Date.now() }
                            }
                        }
                    });
                } 
                else if (action.type === 'REPLACE_ALL') {
                    //  SEAL THE BACKDOOR: Sanitize and flatten
                    const safeData = { ...action.data };
                    delete safeData._id;
                    delete safeData.userId;
                    const dotNotationUpdates = buildDotNotation(safeData);

                    bulkOps.push({
                        updateOne: {
                            filter: { userId: user.userId },
                            update: { $set: { ...dotNotationUpdates, lastModified: Date.now() } }
                        }
                    });
                }
            }

            if (bulkOps.length > 0) {
                await collection.bulkWrite(bulkOps);
            }
            
            return NextResponse.json({ success: true, message: 'Queue processed atomically' });
        }

        // 3. FALLBACK FOR INSTANT SAVES (If queue isn't used)
        if (body.updates) {
            //  SEAL THE BACKDOOR: Sanitize and flatten
            const safeUpdates = { ...body.updates };
            delete safeUpdates._id;
            delete safeUpdates.userId;
            const dotNotationUpdates = buildDotNotation(safeUpdates);

            const updated = await collection.findOneAndUpdate(
                { userId: user.userId },
                { $set: { ...dotNotationUpdates, lastModified: Date.now() } },
                { returnDocument: 'after' }
            );
            return NextResponse.json({ success: true, data: updated });
        }

        return NextResponse.json({ error: 'No valid actions or updates provided' }, { status: 400 });

    } catch (error) {
        console.error("PATCH TASKS ERROR:", error);
        return NextResponse.json({ error: 'Failed to update tasks' }, { status: 500 });
    }
}