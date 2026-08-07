import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string, username: string, role?: string };
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Fetch all users, but explicitly exclude the password field
    const users = await db.collection('User').find({}, {
      projection: { password: 0 } // 0 means exclude
    }).sort({ lastLogin: -1, createdAt: -1 }).toArray();

    // Hide aliases of other users from non-admins to preserve true anonymity
    const isSuperAdmin = decoded.role === 'admin' || decoded.username === process.env.ADMIN_USERNAME;
    const sanitizedUsers = users.map(u => {
      if (!isSuperAdmin && u._id.toString() !== decoded.userId) {
        const { alias, ...rest } = u;
        return rest;
      }
      return u;
    });

    return NextResponse.json({ users: sanitizedUsers });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string, username: string };
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { alias, profilePicture, readNewsIds } = body;

    if (alias !== undefined && typeof alias !== 'string') {
      return NextResponse.json({ error: 'Invalid alias format' }, { status: 400 });
    }
    if (profilePicture !== undefined && typeof profilePicture !== 'string') {
      return NextResponse.json({ error: 'Invalid profile picture format' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const updateFields: any = {};
    if (alias !== undefined) updateFields.alias = alias ? alias.trim() : "";
    if (profilePicture !== undefined) updateFields.profilePicture = profilePicture.trim();

    const updateOp: any = {};
    if (Object.keys(updateFields).length > 0) {
      updateOp.$set = updateFields;
    }
    
    if (readNewsIds && Array.isArray(readNewsIds)) {
      updateOp.$addToSet = { readNewsIds: { $each: readNewsIds } };
    }

    if (Object.keys(updateOp).length > 0) {
      await db.collection('User').updateOne(
        { _id: new ObjectId(decoded.userId) },
        updateOp
      );
    }

    return NextResponse.json({ success: true, ...updateFields });
  } catch (error) {
    console.error('Failed to update user profile:', error);
    return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
  }
}
