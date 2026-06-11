import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const DATABASE_URL = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('NEON_DATABASE_URL is missing. Please add it to your Replit Secrets.')
}

const sql = neon(DATABASE_URL)

export const db = drizzle(sql, { schema })
export { schema }