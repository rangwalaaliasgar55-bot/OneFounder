---
name: Auth root causes fixed
description: Two independent bugs caused all Better Auth 500/404 errors on Replit local PostgreSQL
---

## Bug 1 — Wrong database driver

**Rule:** Never use `@neondatabase/serverless` (neon-http) with a local or standard PostgreSQL URL. The Neon HTTP driver only works with Neon cloud endpoints.

**Why:** Replit's built-in PostgreSQL uses the connection string `postgres://postgres:password@helium/heliumdb?sslmode=disable`. The `neon()` function from `@neondatabase/serverless` attempts HTTP requests to what it expects to be a Neon serverless endpoint — it silently fails for a standard PG host, causing every DB call to throw a 500.

**How to apply:** Use `postgres` (postgres.js) + `drizzle-orm/postgres-js` for any standard PostgreSQL (Replit, Railway, Supabase direct, etc.). Only use `@neondatabase/serverless` when `DATABASE_URL` contains a Neon cloud host.

```ts
// CORRECT for Replit local PG
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
const client = postgres(DATABASE_URL, { ssl: false })
export const db = drizzle(client, { schema })
```

## Bug 2 — Express app.use strips URL prefix; app.all does not

**Rule:** Mount Better Auth with `app.all('/auth/*', toNodeHandler(auth))`, NOT `app.use('/auth', toNodeHandler(auth))`.

**Why:** `app.use('/auth', handler)` strips the `/auth` prefix from `req.url` before calling the handler. So Better Auth receives `/sign-up/email` instead of `/auth/sign-up/email`. Since Better Auth has `basePath: '/auth'`, it looks for `/auth/sign-up/email` but sees `/sign-up/email` → returns 404. `app.all('/auth/*', handler)` does NOT strip the prefix — Better Auth receives the full `/auth/sign-up/email` path and matches correctly.

**How to apply:**
```ts
// server/index.ts — CORRECT
app.all('/auth/*', toNodeHandler(auth))

// server/auth.ts — keep basePath matching the mount path
export const auth = betterAuth({ basePath: '/auth', ... })
```

## Bug 3 — BETTER_AUTH_URL pointed to backend port, not frontend domain

**Rule:** `BETTER_AUTH_URL` / `baseURL` must be the URL the browser sees for the app, not the backend port.

**Why:** In Replit, the browser accesses `https://[REPLIT_DEV_DOMAIN]` which Vite (port 5000) proxies to port 3001. If `baseURL` is `http://localhost:3001`, cookies are scoped to `localhost:3001` which the browser can't set from the proxy domain.

**How to apply:** Resolve dynamically in auth.ts:
```ts
const baseURL = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : process.env.CLIENT_URL || 'http://localhost:5000'
```
