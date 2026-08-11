import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCredentials } from '@/lib/auth/verifyAdminCredentials';
import { signMobileToken } from '@/lib/api/verifyMobileAuth';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = body?.email;
  const password = body?.password;
  const token2FA = body?.token2FA;

  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'email and password required' }, { status: 400 });
  }

  const result = await verifyAdminCredentials({ email, password, token2FA });

  if ('error' in result) {
    if (result.error === 'requires2FA') {
      return NextResponse.json({ requires2FA: true });
    }
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const { token, expiresAt } = await signMobileToken(result.admin);
  return NextResponse.json({ token, expiresAt, admin: result.admin });
}
