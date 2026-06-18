import 'dotenv/config'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema.js'

const DATABASE_URL = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is missing. Please add it to your environment variables.\n\n' +
    'For Vercel: Go to Project Settings → Environment Variables\n' +
    'For Replit: Add to Replit Secrets\n' +
    'For local: Add to .env file\n\n' +
    'Required variables:\n' +
    '  DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require\n' +
    '  BETTER_AUTH_SECRET=<64-char-random-secret>\n' +
    '  BETTER_AUTH_URL=https://your-domain.vercel.app\n' +
    '  CLIENT_URL=https://your-domain.vercel.app'
  )
}

const client = postgres(DATABASE_URL, {
  ssl: DATABASE_URL.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
})

export const db = drizzle(client, { schema })
export { schema }
