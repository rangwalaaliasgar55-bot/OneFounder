import 'dotenv/config'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

const DATABASE_URL = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is missing. Please add it to your Replit environment.')
}

const client = postgres(DATABASE_URL, {
  ssl: DATABASE_URL.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
})

export const db = drizzle(client, { schema })
export { schema }
