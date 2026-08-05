import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req: Request) {
  try {
    const { data, name, type } = await req.json();

    if (!data) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    // Store in a temporary collection with a TTL index (if set up) or just let it linger
    // We'll store a createdAt date so we can manually clean up if needed
    const result = await db.collection('TempExports').insertOne({
      data,
      name: name || 'backup.json',
      type: type || 'Backup',
      createdAt: new Date()
    });

    return NextResponse.json({ success: true, id: result.insertedId.toString() });
  } catch (error) {
    console.error('Temp export error:', error);
    return NextResponse.json({ error: 'Failed to process download' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response('No ID provided', { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const record = await db.collection('TempExports').findOne({ _id: new ObjectId(id) });

    if (!record) {
      return new Response('Backup expired or not found. Please try downloading again from the app.', { 
        status: 404,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Optionally delete after single use to save space
    await db.collection('TempExports').deleteOne({ _id: new ObjectId(id) });

    return new Response(record.data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${record.name}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  } catch (error) {
    console.error('Download echo GET error:', error);
    return new Response('Failed to retrieve backup', { status: 500 });
  }
}
