import { SignJWT, jwtVerify } from 'jose';

const MOBILE_TOKEN_TTL = '180d';

function secretKey(): Uint8Array {
  const secret = process.env.MOBILE_JWT_SECRET;
  if (!secret) throw new Error('MOBILE_JWT_SECRET is not set');
  return new TextEncoder().encode(secret);
}

export async function signMobileToken(admin: { id: string; email: string }): Promise<{ token: string; expiresAt: string }> {
  const expiresAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
  const token = await new SignJWT({ email: admin.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(admin.id)
    .setIssuedAt()
    .setExpirationTime(MOBILE_TOKEN_TTL)
    .sign(secretKey());
  return { token, expiresAt: expiresAt.toISOString() };
}

export async function verifyMobileAuth(req: Request): Promise<{ id: string; email: string } | null> {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') return null;
    return { id: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}
