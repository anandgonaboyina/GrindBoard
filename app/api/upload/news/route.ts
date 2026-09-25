import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import jwt from 'jsonwebtoken';

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
    const action = formData.get('action'); 
    const folderName = (formData.get('folder') as string) || 'grindboard-News';

    if (action === 'delete') {
      const oldUrl = formData.get('oldUrl') as string;
      if (oldUrl && oldUrl.includes('res.cloudinary.com')) {
        
        // Check if it's a video so Cloudinary knows how to delete it
        const isVideo = oldUrl.match(/\.(mp4|webm|mov|ogg)(\?.*)?$/i);
        const resourceType = isVideo ? 'video' : 'image';

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
          console.log(`Attempting to delete Cloudinary ${resourceType} with public ID: ${fullPublicId}`);
          const result = await cloudinary.uploader.destroy(fullPublicId, { resource_type: resourceType });
          console.log(`Delete result for ${fullPublicId}:`, result);
        } catch (err) {
          console.error(`Cloudinary delete error for ${fullPublicId}:`, err);
        }
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'upload') {
      const file = formData.get('file') as File;
      
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
            folder: folderName,
            resource_type: 'auto', // CRITICAL: Allows videos, raw SVGs, and images
            // Removed news posts stay original size/ratio)
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });

      //  Return public_id so the frontend can delete it later
      return NextResponse.json({ 
        url: (uploadResult as any).secure_url,
        public_id: (uploadResult as any).public_id 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error("News Upload API Error:", error);
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}