import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

const TEST_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);

export async function GET() {
  const cfg = cloudinary.config();

  let uploadResult: unknown = null;
  try {
    uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: 'test-debug', resource_type: 'image' }, (error, result) => {
          if (error || !result) return reject(error);
          resolve(result.secure_url);
        })
        .end(TEST_PNG);
    });
  } catch (error) {
    uploadResult = { error: error instanceof Error ? error.message : String(error) };
  }

  return NextResponse.json({
    cloud_name: !!cfg.cloud_name,
    api_key: !!cfg.api_key,
    api_secret: !!cfg.api_secret,
    api_key_len: (cfg.api_key || '').length,
    uploadResult,
  });
}
