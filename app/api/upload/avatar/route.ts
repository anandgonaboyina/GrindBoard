import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import jwt from 'jsonwebtoken';

// Explicitly configuring Cloudinary using the environment variable the user provides
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    url: process.env.CLOUDINARY_URL
  });
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse FormData
    const formData = await req.formData();
    const action = formData.get('action'); // "upload" or "delete"

    if (action === 'delete') {
      const oldUrl = formData.get('oldUrl') as string;
      if (oldUrl && oldUrl.includes('res.cloudinary.com')) {
        // Extract public_id
        const parts = oldUrl.split('/');
        const uploadIndex = parts.indexOf('upload');
        let fullPublicId = '';
        if (uploadIndex !== -1) {
          let pathParts = parts.slice(uploadIndex + 1);
          if (pathParts[0].match(/^v\d+$/)) {
            pathParts.shift();
          }
          const fileWithExt = pathParts.join('/');
          fullPublicId = fileWithExt.substring(0, fileWithExt.lastIndexOf('.'));
        } else {
          const filename = parts[parts.length - 1];
          const publicId = filename.split('.')[0];
          const folder = parts[parts.length - 2];
          fullPublicId = `${folder}/${publicId}`;
        }
        
        try {
          console.log(`Attempting to delete Cloudinary image with public ID: ${fullPublicId}`);
          const result = await cloudinary.uploader.destroy(fullPublicId);
          console.log(`Delete result for ${fullPublicId}:`, result);
        } catch (err) {
          console.error(`Cloudinary delete error for ${fullPublicId}:`, err);
        }
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'upload') {
      const file = formData.get('file') as File;
      const oldUrl = formData.get('oldUrl') as string;
      
      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }

      // Read file into buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Cloudinary using a stream
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'Grindboard_avatars',
            transformation: [{ width: 500, height: 500, crop: 'limit' }],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });

      return NextResponse.json({ url: (uploadResult as any).secure_url });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error("Avatar Upload API Error:", error);
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
