import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function GET() {
  const cfg = cloudinary.config();
  return NextResponse.json({
    cloud_name: !!cfg.cloud_name,
    api_key: !!cfg.api_key,
    api_secret: !!cfg.api_secret,
    api_key_len: (cfg.api_key || '').length,
    env_cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
    env_api_key: !!process.env.CLOUDINARY_API_KEY,
    env_api_secret: !!process.env.CLOUDINARY_API_SECRET,
  });
}
