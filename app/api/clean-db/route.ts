import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();

    // The Magic Command: $unset removes the field entirely from EVERY user
    const result = await db.collection('User').updateMany(
      { deletionScheduledAt: { $exists: true } }, // Find all users who have this old array
      { $unset: { deletionScheduledAt: "" } }     // Nuke the field from orbit
    );

    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted the old array from ${result.modifiedCount} users!` 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clean database' }, { status: 500 });
  }
}