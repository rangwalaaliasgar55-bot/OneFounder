# Vercel Environment Variables Setup (Free - No Domain Required)

## Step 1: Go to Vercel Dashboard

1. Open [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your **OneFounder** project
3. Go to **Settings** -> **Environment Variables**

## Step 2: Add These Variables

Click **Add** for each variable:

### Required for Database Connection

```
Key: NEON_DATABASE_URL
Value: postgresql://neondb_owner:npg_XZ7yPtdYE6Mf@ep-dry-hill-apm4l92t-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require
Environments: Production, Preview, Development
```

### Required for Authentication

```
Key: BETTER_AUTH_SECRET
Value: e1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2
Environments: Production, Preview, Development
```

### Required for Server

```
Key: NODE_ENV
Value: production
Environments: Production
```

## Step 3: Find Your Vercel URL

Your Vercel URL is FREE and looks like:
- `onefoundr-xxxxx.vercel.app` (auto-generated)
- OR `onefoundr.vercel.app` (if available)

To find it:
1. Go to Vercel Dashboard -> Your Project
2. Look at the top for the URL (e.g., `https://onefoundr-abc123.vercel.app`)
3. Copy this URL

## Step 4: Add URL Variables

Add these with YOUR Vercel URL:

```
Key: BETTER_AUTH_URL
Value: https://onefoundr-abc123.vercel.app  (replace with your URL)
Environments: Production, Preview
```

```
Key: CLIENT_URL
Value: https://onefoundr-abc123.vercel.app  (replace with your URL)
Environments: Production, Preview
```

## Step 5: Redeploy

1. Go to **Deployments** tab
2. Click **...** on the latest deployment
3. Click **Redeploy**
4. Check **Use existing Build Cache**
5. Click **Redeploy**

## Important Notes

- You do NOT need to buy a domain
- Vercel provides a FREE domain automatically
- The URL is shown at the top of your project page
- Use that URL for BETTER_AUTH_URL and CLIENT_URL

## After Redeploy

1. Wait for deployment to complete
2. Open your Vercel URL (e.g., `https://onefoundr-abc123.vercel.app`)
3. Try to sign in with:
   - Email: admin@onefounder.com
   - Password: aliasgar134

## Still Having Issues?

1. Check Vercel function logs (Dashboard -> Your Project -> Logs)
2. Make sure ALL environment variables are set
3. Make sure you redeployed after adding variables
4. The URL must match exactly (including https://)
