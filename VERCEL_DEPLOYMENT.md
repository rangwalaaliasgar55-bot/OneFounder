# 🚀 Vercel Deployment Guide

## ⚠️ Critical: Environment Variables Required

**Vercel does NOT read `.env` files from your repository.** You must add environment variables in the Vercel dashboard.

---

## Step-by-Step Setup

### 1. Go to Vercel Dashboard

1. Open [vercel.com/dashboard](https://vercel.com/dashboard)
2. Find your **OneFounder** project
3. Click on the project name

### 2. Add Environment Variables

1. Click **Settings** tab
2. Click **Environment Variables** in the left sidebar
3. Add each variable below:

#### Required Variables

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEON_DATABASE_URL` | `postgresql://neondb_owner:npg_XZ7yPtdYE6Mf@ep-dry-hill-apm4l92t-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require` | Production, Preview, Development |
| `BETTER_AUTH_SECRET` | `e1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2` | Production, Preview, Development |
| `BETTER_AUTH_URL` | `https://onefounder.vercel.app` | Production |
| `BETTER_AUTH_URL` | `https://onefounder-<hash>.vercel.app` | Preview |
| `CLIENT_URL` | `https://onefounder.vercel.app` | Production |
| `CLIENT_URL` | `https://onefounder-<hash>.vercel.app` | Preview |
| `NODE_ENV` | `production` | Production |

#### Optional Variables (for social login)

| Variable | Value |
|----------|-------|
| `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth Client Secret |
| `GITHUB_CLIENT_ID` | Your GitHub OAuth Client ID |
| `GITHUB_CLIENT_SECRET` | Your GitHub OAuth Client Secret |

### 3. How to Add Each Variable

1. Click **Add** button
2. Enter the **Key** (e.g., `NEON_DATABASE_URL`)
3. Enter the **Value** (the actual database URL)
4. Select **Environments** (check Production, Preview, Development)
5. Click **Save**

### 4. Redeploy

After adding all variables:

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **⋯** (three dots menu)
4. Click **Redeploy**
5. Check **Use existing Build Cache**
6. Click **Redeploy**

---

## Common Issues

### ❌ "DATABASE_URL is missing"

**Cause:** Environment variable not set in Vercel

**Fix:** Add `NEON_DATABASE_URL` or `DATABASE_URL` to Vercel environment variables

### ❌ "BETTER_AUTH_SECRET env var is required"

**Cause:** Auth secret not set

**Fix:** Add `BETTER_AUTH_SECRET` to Vercel environment variables

### ❌ CORS Errors

**Cause:** `CLIENT_URL` doesn't match your Vercel domain

**Fix:** Set `CLIENT_URL` to your exact Vercel domain (e.g., `https://onefounder.vercel.app`)

### ❌ Sign-in Not Working

**Cause:** Missing auth environment variables

**Fix:** Ensure these are set:
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `CLIENT_URL`

---

## Verify Your Setup

### Check Environment Variables

In Vercel Dashboard → Settings → Environment Variables, you should see:

```
✅ NEON_DATABASE_URL = postgresql://...
✅ BETTER_AUTH_SECRET = e1b2c3d4...
✅ BETTER_AUTH_URL = https://onefounder.vercel.app
✅ CLIENT_URL = https://onefounder.vercel.app
✅ NODE_ENV = production
```

### Test the Deployment

1. Visit your Vercel URL: `https://onefounder.vercel.app`
2. Click **Get Started** to sign up
3. Try signing in with your credentials

---

## Troubleshooting

### View Logs

1. Go to Vercel Dashboard → Your Project
2. Click **Deployments** tab
3. Click on the latest deployment
4. Click **Functions** tab
5. Check for error messages

### Common Log Errors

```
Error: DATABASE_URL is missing
→ Add NEON_DATABASE_URL to environment variables

Error: BETTER_AUTH_SECRET env var is required
→ Add BETTER_AUTH_SECRET to environment variables

Error: Not allowed by CORS
→ Check CLIENT_URL matches your domain
```

---

## Quick Fix Checklist

- [ ] Added `NEON_DATABASE_URL` to Vercel
- [ ] Added `BETTER_AUTH_SECRET` to Vercel
- [ ] Added `BETTER_AUTH_URL` to Vercel
- [ ] Added `CLIENT_URL` to Vercel
- [ ] Added `NODE_ENV=production` to Vercel
- [ ] Redeployed after adding variables
- [ ] Can access the site at Vercel URL
- [ ] Can sign up/sign in

---

## Need Help?

1. Check Vercel deployment logs
2. Verify all environment variables are set
3. Ensure you redeployed after adding variables
4. Test with the Vercel preview URL first

---

## Your Current Setup

**Repository:** https://github.com/rangwalaaliasgar55-bot/OneFounder
**Vercel URL:** https://onefounder.vercel.app
**Database:** Neon PostgreSQL

**Required Environment Variables:**
```
NEON_DATABASE_URL=postgresql://neondb_owner:npg_XZ7yPtdYE6Mf@ep-dry-hill-apm4l92t-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require
BETTER_AUTH_SECRET=e1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2
BETTER_AUTH_URL=https://onefounder.vercel.app
CLIENT_URL=https://onefounder.vercel.app
NODE_ENV=production
```

Add these to Vercel → Settings → Environment Variables, then redeploy!
