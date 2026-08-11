import { createHash } from 'crypto';
import { prisma } from '../db';
import * as OTPAuth from 'otpauth';

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

type Admin = { id: string; name: string; email: string };

type VerifyResult =
  | { admin: Admin }
  | { error: 'invalid' }
  | { error: 'requires2FA' };

export async function verifyAdminCredentials({
  email,
  password,
  token2FA,
}: {
  email: string;
  password: string;
  token2FA?: string;
}): Promise<VerifyResult> {
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) return { error: 'invalid' };

  const hashedPassword = hashPassword(password);
  if (hashedPassword !== admin.password) return { error: 'invalid' };

  if (admin.setup2FA && admin.token2FA) {
    if (!token2FA) return { error: 'requires2FA' };

    const totp = new OTPAuth.TOTP({
      issuer: 'PortfolioAdmin',
      label: admin.id,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: admin.token2FA,
    });
    const isValid = totp.validate({ token: token2FA }) !== null;
    if (!isValid) return { error: 'invalid' };
  }

  await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLogin: new Date() },
  });

  return { admin: { id: admin.id, name: admin.name, email: admin.email } };
}
