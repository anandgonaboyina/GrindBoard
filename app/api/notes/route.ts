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

        // Grab local timestamp from URL
        const url = new URL(request.url);
        const localModified = parseInt(url.searchParams.get('localModified') || '0', 10);

        const client = await clientPromise;
        const db = client.db();

        const doc = await db.collection('Notes').findOne({ userId: user.userId });
        const cloudLastModified = doc?.lastModified || 0;

        // FAST EXIT: If local notes match or are newer than cloud, send tiny upToDate response
        if (localModified >= cloudLastModified && cloudLastModified > 0) {
            return NextResponse.json({ upToDate: true, lastModified: cloudLastModified });
        }

        return NextResponse.json({ success: true, data: doc || { notes: [] } });
    } catch (error) {
        console.error('Error fetching notes:', error);
        return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const user = authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const client = await clientPromise;
        const db = client.db();
        const collection = db.collection('Notes');

        // 1. Ensure document exists
        await collection.updateOne(
            { userId: user.userId },
            { $setOnInsert: { notes: [], lastModified: Date.now() } },
            { upsert: true }
        );

        // 2. ATOMIC OFFLINE QUEUE PROCESSOR
        if (body.actions && Array.isArray(body.actions) && body.actions.length > 0) {
            const bulkOps: any[] = [];

            for (const action of body.actions) {
                if (action.type === 'ADD_NOTE') {
                    bulkOps.push({
                        updateOne: {
                            filter: { userId: user.userId },
                            // Uses $position: 0 to match your frontend logic of adding new notes to the top of the list
                            update: { $push: { notes: {$each: [action.note], $position: 0 } },$set: { lastModified: Date.now() } }
                        }
                    });
                } 
                else if (action.type === 'UPDATE_NOTE_TITLE') {
                    bulkOps.push({
                        updateOne: {
                            filter: { userId: user.userId },
                            update: { $set: { "notes.$[elem].title": action.title, lastModified: Date.now() } },
                            arrayFilters: [{ "elem.id": action.noteId }]
                        }
                    });
                } 
                else if (action.type === 'UPDATE_NOTE_ENTRY') {
                    // Dynamically set OR delete the specific date key inside the entries object
                    const updateOp: any = { $set: { lastModified: Date.now() } };
                    
                    if (action.content === null) {
                        updateOp.$unset = { [`notes.$[elem].entries.${action.date}`]: "" };
                    } else {
                        updateOp.$set[`notes.$[elem].entries.${action.date}`] = action.content;
                    }

                    bulkOps.push({
                        updateOne: {
                            filter: { userId: user.userId },
                            update: updateOp,
                            arrayFilters: [{ "elem.id": action.noteId }]
                        }
                    });
                } 
                else if (action.type === 'DELETE_NOTE') {
                    bulkOps.push({
                        updateOne: {
                            filter: { userId: user.userId },
                            update: { $pull: { notes: { id: action.noteId } },$set: { lastModified: Date.now() } }
                        }
                    });
                } 
                else if (action.type === 'REPLACE_ALL') {
                    bulkOps.push({
                        updateOne: {
                            filter: { userId: user.userId },
                            update: { $set: { notes: action.notes, lastModified: Date.now() } }
                        }
                    });
                }
            }

            if (bulkOps.length > 0) {
                await collection.bulkWrite(bulkOps);
            }
            
            return NextResponse.json({ success: true, message: 'Queue processed atomically' });
        }

        // 3. FALLBACK FOR INSTANT SAVES
        if (body.notes && Array.isArray(body.notes)) {
            await collection.updateOne(
                { userId: user.userId },
                { $set: { notes: body.notes, lastModified: body.lastModified || Date.now() } }
            );
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'No valid actions or updates provided' }, { status: 400 });

    } catch (error) {
        console.error('Error forcefully saving notes:', error);
        return NextResponse.json({ error: 'Failed to update notes' }, { status: 500 });
    }
}