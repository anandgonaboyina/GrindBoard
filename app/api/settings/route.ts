import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

const authenticate = (request: Request) => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (error) {
    return null;
  }
};

export async function GET(request: Request) {
  try {
    const user = authenticate(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    const settingsRecord = await db.collection('Settings').findOne({ userId: user.userId });
    
    if (!settingsRecord) {
      return NextResponse.json({ data: null });
    }

    const { _id, userId, ...coreData } = settingsRecord as any;
    return NextResponse.json({ data: coreData });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = authenticate(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const client = await clientPromise;
    const db = client.db();

    const newLastModified = Date.now();
    
    const displaySettings: Record<string, any> = {};
    const generalSettings: Record<string, any> = {};
    const rootSettings: Record<string, any> = {};

    Object.keys(body).forEach(key => {
      if ((key.startsWith('show') || key.startsWith('hide') || key.startsWith('is')) && key !== 'hideConfig' && key !== 'mobileHideConfig') {
        displaySettings[`displaySettings.${key}`] = body[key];
      } else if (typeof body[key] === 'string' || typeof body[key] === 'number' || typeof body[key] === 'boolean' || body[key] === null) {
        generalSettings[`generalSettings.${key}`] = body[key];
      } else {
        rootSettings[key] = body[key];
      }
    });

    const updatePayload = { 
      ...displaySettings, 
      ...generalSettings, 
      ...rootSettings, 
      lastModified: newLastModified 
    };

    await db.collection('Settings').updateOne(
      { userId: user.userId },
      { 
        $set: updatePayload,
        $setOnInsert: { userId: user.userId }
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, lastModified: newLastModified });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
