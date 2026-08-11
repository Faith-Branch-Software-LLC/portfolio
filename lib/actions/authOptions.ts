import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyAdminCredentials } from '../auth/verifyAdminCredentials';

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

        const result = await verifyAdminCredentials({
          email: credentials.email,
          password: credentials.password,
          token2FA: credentials.token2FA,
        });

        if ('error' in result) {
          if (result.error === 'requires2FA') throw new Error('Requires2FA');
          return null;
        }

        return result.admin;
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
