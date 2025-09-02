#!/bin/bash

# Fly.io Cron Job Setup for Automatic Investment Returns
# This script helps you set up daily investment returns processing on Fly.io

echo "🚀 Setting up Fly.io cron job for automatic investment returns..."

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo "❌ Fly.io CLI is not installed. Please install it first:"
    echo "   curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Check if logged in to Fly.io
if ! fly auth whoami &> /dev/null; then
    echo "❌ You're not logged in to Fly.io. Please run:"
    echo "   fly auth login"
    exit 1
fi

echo "✅ Fly.io CLI is ready"

# Get the app name
APP_NAME=$(fly apps list --json | jq -r '.[0].name' 2>/dev/null || echo "")

if [ -z "$APP_NAME" ]; then
    echo "❌ No Fly.io apps found. Please create an app first:"
    echo "   fly launch"
    exit 1
fi

echo "📱 Found app: $APP_NAME"

# Create the cron job machine
echo "⏰ Creating daily investment returns cron job..."

fly machines run \
  --app "$APP_NAME" \
  --schedule "0 2 * * *" \
  --name "daily-investment-returns" \
  --env NODE_ENV=production \
  --env SUPABASE_URL="$SUPABASE_URL" \
  --env SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  --command "node scripts/auto-investment-processor.js" \
  --detach

if [ $? -eq 0 ]; then
    echo "✅ Cron job created successfully!"
    echo ""
    echo "📊 To monitor the cron job:"
    echo "   fly machines list --app $APP_NAME"
    echo "   fly logs --app $APP_NAME --instance daily-investment-returns"
    echo ""
    echo "🔄 The investment returns processor will run daily at 2:00 AM UTC"
else
    echo "❌ Failed to create cron job. Please check your Fly.io configuration."
    exit 1
fi</content>
<parameter name="filePath">c:\Users\BABA\Documents\AxixFinance\scripts\setup-fly-cron.sh
