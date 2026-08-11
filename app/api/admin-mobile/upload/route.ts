import { NextRequest, NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import cloudinary from '@/lib/cloudinary';

export const POST = withMobileAuth(async (req: NextRequest) => {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const folderParam = formData.get('folder');
  const folder = folderParam === 'blog' ? 'blog' : 'portfolio';

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder, resource_type: 'image' }, (error, result) => {
          if (error || !result) return reject(error);
          resolve(result as { secure_url: string });
        })
        .end(buffer);
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    console.error('Cloudinary upload failed:', error);
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
