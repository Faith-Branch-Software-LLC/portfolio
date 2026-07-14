import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import cloudinary from '@/lib/cloudinary';

export async function GET() {
  const buf = await readFile(path.join(process.cwd(), 'public', 'images', 'Easter-selfie.jpeg'));

  const cfg = cloudinary.config();

  let uploadResult: unknown = null;
  try {
    uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: 'test-debug', resource_type: 'image' }, (error, result) => {
          if (error || !result) return reject(error);
          resolve(result.secure_url);
        })
        .end(buf);
    });
  } catch (error) {
    uploadResult = { error: error instanceof Error ? error.message : String(error) };
  }

  return NextResponse.json({
    bufBytes: buf.length,
    cloud_name: !!cfg.cloud_name,
    api_key: !!cfg.api_key,
    api_secret: !!cfg.api_secret,
    uploadResult,
  });
}
