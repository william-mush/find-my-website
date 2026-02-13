/**
 * NextAuth.js Configuration
 * Supports email/password + OAuth (Google, GitHub)
 * Same email can login through any method
 */

import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db';
import { users, accounts, sessions, verificationTokens } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),

  providers: [
    // Google OAuth
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // Allow same email across providers
    }),

    // GitHub OAuth
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // Allow same email across providers
    }),

    // Email/Password (Credentials)
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        // Find user by email
        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1);

        if (!user || user.length === 0) {
          throw new Error('No user found with this email');
        }

        const existingUser = user[0];

        // Check if user has a password (registered via email/password)
        if (!existingUser.password) {
          throw new Error('Please sign in with the provider you used to register (Google or GitHub)');
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          existingUser.password
        );

        if (!passwordMatch) {
          throw new Error('Incorrect password');
        }

        // Return user object
        return {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          image: existingUser.image,
        };
      },
    }),
  ],

  session: {
    strategy: 'jwt', // Use JWT for sessions (better for serverless)
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/new-user',
  },

  callbacks: {
    async signIn() {
      // Allow all sign-ins (email linking handled by allowDangerousEmailAccountLinking)
      return true;
    },

    async jwt({ token, user }) {
      // Add user ID to token on initial sign in
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      // Add user ID to session
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  events: {
    async createUser({ user }) {
      console.log(`[Auth] New user created: ${user.email}`);
    },
    async signIn({ user, account }) {
      console.log(`[Auth] User signed in: ${user.email} via ${account?.provider}`);
    },
  },

  debug: process.env.NODE_ENV === 'development',
});
