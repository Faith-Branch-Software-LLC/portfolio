import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createHash } from 'crypto';
import { prisma } from '../db';
import * as OTPAuth from 'otpauth';

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
        token2FA: { label: '2FA Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email },
        });
        if (!admin) return null;

        const hashedPassword = hashPassword(credentials.password);
        if (hashedPassword !== admin.password) return null;

        if (admin.setup2FA) {
          if (credentials.token2FA && admin.token2FA) {
            const totp = new OTPAuth.TOTP({
              issuer: 'PortfolioAdmin',
              label: admin.id,
              algorithm: 'SHA1',
              digits: 6,
              period: 30,
              secret: admin.token2FA,
            });
            const isValid = totp.validate({ token: credentials.token2FA }) !== null;
            if (!isValid) return null;
          } else if (admin.token2FA) {
            throw new Error('Requires2FA');
          }
        }

        await prisma.admin.update({
          where: { id: admin.id },
          data: { lastLogin: new Date() },
        });

        return { id: admin.id, name: admin.name, email: admin.email };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
};

export default authOptions;
