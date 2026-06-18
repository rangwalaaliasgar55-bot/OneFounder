#!/bin/bash

echo "🔍 OneFounder Auth Setup Verification"
echo "======================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# Source .env
source .env

# Check required variables
echo "📋 Checking environment variables..."
echo ""

REQUIRED_VARS=(
    "DATABASE_URL"
    "BETTER_AUTH_SECRET"
    "BETTER_AUTH_URL"
    "CLIENT_URL"
)

ALL_SET=true
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ $var is NOT set"
        ALL_SET=false
    else
        echo "✅ $var is set"
    fi
done

echo ""

if [ "$ALL_SET" = false ]; then
    echo "❌ Some required variables are missing!"
    echo "Please update your .env file"
    exit 1
fi

echo "✅ All required variables are set!"
echo ""

# Check secret length
SECRET_LEN=${#BETTER_AUTH_SECRET}
if [ "$SECRET_LEN" -lt 32 ]; then
    echo "⚠️  BETTER_AUTH_SECRET is only $SECRET_LEN chars (recommended: 64+)"
else
    echo "✅ BETTER_AUTH_SECRET length: $SECRET_LEN chars"
fi

echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
fi

echo ""
echo "🚀 Ready to start! Run:"
echo "   npm run dev"
echo ""
echo "📝 Test credentials:"
echo "   Sign up with any email/password on http://localhost:5000"
echo ""
