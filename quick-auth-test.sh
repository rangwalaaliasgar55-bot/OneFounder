#!/bin/bash

echo "🧪 Quick Authentication Test"
echo "============================"
echo ""

# Source .env
source .env

# Test 1: Check if server is running
echo "1️⃣  Checking if server is running..."
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Server is running on port 3001"
else
    echo "❌ Server is not running"
    echo "   Start it with: npm run dev:server"
    exit 1
fi

echo ""

# Test 2: Test sign-up endpoint
echo "2️⃣  Testing sign-up endpoint..."
SIGNUP_RESPONSE=$(curl -s -X POST http://localhost:3001/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}')

if echo "$SIGNUP_RESPONSE" | grep -q "error"; then
    echo "⚠️  Sign-up response: $SIGNUP_RESPONSE"
else
    echo "✅ Sign-up endpoint is working"
fi

echo ""

# Test 3: Test sign-in endpoint
echo "3️⃣  Testing sign-in endpoint..."
SIGNIN_RESPONSE=$(curl -s -X POST http://localhost:3001/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}')

if echo "$SIGNIN_RESPONSE" | grep -q "error"; then
    echo "⚠️  Sign-in response: $SIGNIN_RESPONSE"
else
    echo "✅ Sign-in endpoint is working"
fi

echo ""

# Test 4: Test session endpoint
echo "4️⃣  Testing session endpoint..."
SESSION_RESPONSE=$(curl -s http://localhost:3001/auth/get-session)

if echo "$SESSION_RESPONSE" | grep -q "error"; then
    echo "⚠️  Session response: $SESSION_RESPONSE"
else
    echo "✅ Session endpoint is working"
fi

echo ""
echo "🎯 Next Steps:"
echo "   1. Open http://localhost:5000 in your browser"
echo "   2. Click 'Get Started' to sign up"
echo "   3. You should be able to sign in now!"
echo ""
