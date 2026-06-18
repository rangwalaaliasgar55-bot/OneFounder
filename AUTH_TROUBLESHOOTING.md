# 🔐 OneFounder Authentication Troubleshooting

## Quick Fix for Sign-In Issues

### 1. Check Your `.env` File

Make sure these variables are set in your `.env`:

```env
# REQUIRED for sign-in to work
BETTER_AUTH_SECRET=<64-char-random-secret>
BETTER_AUTH_URL=http://localhost:3001
CLIENT_URL=http://localhost:5000
DATABASE_URL=<your-postgresql-connection-string>
NODE_ENV=development
PORT=3001
```

### 2. Generate BETTER_AUTH_SECRET

```bash
# Generate a secure secret
openssl rand -hex 32
```

Copy the output and paste it as your `BETTER_AUTH_SECRET`.

### 3. Verify Database Connection

```bash
# Push the database schema
npm run db:push

# Check if tables were created
npm run db:studio
```

### 4. Start the Application

```bash
npm run dev
```

This starts:
- Backend: http://localhost:3001
- Frontend: http://localhost:5000

### 5. Test Sign-In

1. Open http://localhost:5000
2. Click "Get Started" to sign up
3. Enter any email/password
4. You should be redirected to the dashboard

---

## Common Issues & Solutions

### ❌ "BETTER_AUTH_SECRET env var is required"

**Solution:** Add `BETTER_AUTH_SECRET` to your `.env` file:
```bash
echo "BETTER_AUTH_SECRET=$(openssl rand -hex 32)" >> .env
```

### ❌ "Login failed" or "Request failed"

**Causes:**
- Missing environment variables
- Database not connected
- CORS issues

**Solution:**
1. Check server logs for errors
2. Verify all `.env` variables are set
3. Run `npm run db:push` to sync database

### ❌ CORS Errors in Browser Console

**Solution:** Ensure `CLIENT_URL` matches your frontend URL:
```env
CLIENT_URL=http://localhost:5000  # Must match Vite dev server
```

### ❌ Session Not Persisting

**Causes:**
- Cookies not being set
- HTTPS required in production

**Solution:**
- In development, use `http://localhost:5000` (not `127.0.0.1`)
- In production, ensure HTTPS is enabled

### ❌ Social Login Not Working

**Solution:** Configure OAuth credentials:
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

---

## Testing Authentication

### Manual Test

1. **Sign Up:**
   - Go to http://localhost:5000
   - Click "Get Started"
   - Enter name, email, password
   - Should redirect to dashboard

2. **Sign In:**
   - Go to http://localhost:5000
   - Click "Sign In"
   - Enter email/password
   - Should redirect to dashboard

3. **Session Check:**
   - Open browser DevTools → Application → Cookies
   - Should see `better-auth.session_token`

### API Test

```bash
# Test sign-up
curl -X POST http://localhost:3001/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Test sign-in
curl -X POST http://localhost:3001/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test session
curl http://localhost:3001/auth/get-session
```

---

## Development Tips

### Reset Database

```bash
# Drop all tables and recreate
npm run db:push --force
```

### View Database

```bash
# Open Drizzle Studio
npm run db:studio
```

### Check Server Logs

Look for these in your terminal:
- `🚀 OneFounder server running on port 3001`
- Any error messages about missing env vars
- Database connection errors

### Enable Debug Mode

Add to `.env`:
```env
DEBUG=better-auth:*
```

---

## Production Deployment

For Vercel/Replit, set these environment variables:

```env
BETTER_AUTH_SECRET=<generate-new-secret>
BETTER_AUTH_URL=https://your-domain.vercel.app
CLIENT_URL=https://your-domain.vercel.app
DATABASE_URL=<production-database-url>
NODE_ENV=production
```

**Important:** Use HTTPS in production!

---

## Still Having Issues?

1. Check the [GitHub Issues](https://github.com/rangwalaaliasgar55-bot/OneFounder/issues)
2. Review server logs for specific error messages
3. Verify database connection with `npm run db:studio`
4. Test API endpoints with curl commands above
