import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db'
import { users, sessions, accounts, verifications } from './db/schema'
import dotenv from 'dotenv'
dotenv.config()

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET || 'onefoundr-secret-change-in-production',
  // Mount this router at /auth in Express, so internal Better Auth routes should use /auth as prefix.
  basePath: '/auth',
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    },
  },
  trustedOrigins: [
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://localhost:5173',
    process.env.CLIENT_URL || '',
  ].filter(Boolean),
})
