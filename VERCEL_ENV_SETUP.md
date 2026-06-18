# 🔧 Vercel Environment Variables Setup

## Critical: Add These Variables to Vercel

The sign-in error "TypeError: undefined is not iterable" is caused by missing environment variables in Vercel.

### Step 1: Go to Vercel Dashboard

1. Open [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your **OneFounder** project
3. Go to **Settings** → **Environment Variables**

### Step 2: Add These Variables

Click **Add** for each variable:

#### Required for Database Connection
```
Key: NEON_DATABASE_URL
Value: postgresql://neondb_owner:npg_XZ7yPtdYE6Mf@ep-dry-hill-apm4l92t-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require
Environments: Production, Preview, Development
```

#### Required for Authentication
```
Key: BETTER_AUTH_SECRET
Value: e1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2
Environments: Production, Preview, Development
```

```
Key: BETTER_AUTH_URL
Value: https://onefounder.vercel.app
Environments: Production
```

```
Key: CLIENT_URL
Value: https://onefounder.vercel.app
Environments: Production
```

#### Required for Server
```
Key: NODE_ENV
Value: production
Environments: Production
```

### Step 3: Redeploy

1. Go to **Deployments** tab
2. Click **⋯** on the latest deployment
3. Click **Redeploy**
4. Check **Use existing Build Cache**
5. Click **Redeploy**

---

## Why This Fixes the Error

The error "TypeError: undefined is not iterable" happens because:

1. **Database connection fails** - `NEON_DATABASE_URL` is not set
2. **Auth initialization fails** - `BETTER_AUTH_SECRET` is not set
3. **CORS fails** - `CLIENT_URL` doesn't match your domain

When these variables are missing, the server can't initialize properly, causing undefined values to be iterated.

---

## Verify Your Setup

After adding variables and redeploying:

1. Check Vercel function logs for errors
2. Try signing up at https://onefounder.vercel.app
3. Check browser console for any remaining errors

---

## Quick Checklist

- [ ] Added `NEON_DATABASE_URL` to Vercel
- [ ] Added `BETTER_AUTH_SECRET` to Vercel
- [ ] Added `BETTER_AUTH_URL` to Vercel
- [ ] Added `CLIENT_URL` to Vercel
- [ ] Added `NODE_ENV=production` to Vercel
- [ ] Redeployed after adding variables
- [ ] Can access https://onefounder.vercel.app
- [ ] Can sign up/sign in

---

## Still Having Issues?

1. Check Vercel function logs
2. Verify all environment variables are set
3. Ensure you redeployed after adding variables
4. Check browser console for specific error messages
