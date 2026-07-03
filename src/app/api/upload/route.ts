import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary Configuration using user-provided credentials
cloudinary.config({
  cloud_name: 'dxwge5g8f',
  api_key: '494771295211775',
  api_secret: 'pj8-VbmvNicNHAQqDVMtS7IU56w'
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert File object to Node Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Stream upload to Cloudinary
    const result: any = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: 'image', folder: 'reserveze_services' },
        (error, result) => {
          if (error) {
            console.error('Cloudinary stream error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(buffer);
    });

    return NextResponse.json({ 
      success: true, 
      url: result.secure_url,
      public_id: result.public_id
    });
  } catch (error: any) {
    console.error('Image upload failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Image upload failed' 
    }, { status: 500 });
  }
}
