# Fly.io Cron Job Setup for Automatic Investment Returns (Windows)
# This script helps you set up daily investment returns processing on Fly.io
# Run this from PowerShell in your project directory

Write-Host "🚀 Setting up Fly.io cron job for automatic investment returns..." -ForegroundColor Green

# Check if fly CLI is installed
$flyExists = Get-Command fly -ErrorAction SilentlyContinue
if (-not $flyExists) {
    Write-Host "❌ Fly.io CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   Go to: https://fly.io/docs/getting-started/installing-flyctl/" -ForegroundColor Yellow
    Write-Host "   Or run: curl -L https://fly.io/install.sh | sh" -ForegroundColor Yellow
    exit 1
}

# Check if logged in to Fly.io
try {
    fly auth whoami | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ You're not logged in to Fly.io. Please run:" -ForegroundColor Red
        Write-Host "   fly auth login" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ You're not logged in to Fly.io. Please run:" -ForegroundColor Red
    Write-Host "   fly auth login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Fly.io CLI is ready" -ForegroundColor Green

# Get the app name
try {
    $appsJson = fly apps list --json 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to get Fly.io apps list" -ForegroundColor Red
        exit 1
    }

    $apps = $appsJson | ConvertFrom-Json
    if ($apps.Count -eq 0) {
        Write-Host "❌ No Fly.io apps found. Please create an app first:" -ForegroundColor Red
        Write-Host "   fly launch" -ForegroundColor Yellow
        exit 1
    }

    $APP_NAME = $apps[0].name
} catch {
    Write-Host "❌ Error getting Fly.io apps. Using default name 'axix-finance'" -ForegroundColor Yellow
    $APP_NAME = "axix-finance"
}

Write-Host "📱 Found app: $APP_NAME" -ForegroundColor Cyan

# Load environment variables from .env file
$envFile = ".env"
$supabaseUrl = $null
$supabaseServiceKey = $null

if (Test-Path $envFile) {
    Write-Host "📄 Loading environment variables from .env file..." -ForegroundColor Blue

    $envContent = Get-Content $envFile
    foreach ($line in $envContent) {
        if ($line -match "^SUPABASE_URL=(.+)") {
            $supabaseUrl = $matches[1]
        }
        if ($line -match "^SUPABASE_SERVICE_ROLE_KEY=(.+)") {
            $supabaseServiceKey = $matches[1]
        }
    }
}

if (-not $supabaseUrl -or -not $supabaseServiceKey) {
    Write-Host "⚠️  Could not find Supabase credentials in .env file" -ForegroundColor Yellow
    Write-Host "   The cron job will use environment variables from your Fly.io app" -ForegroundColor Yellow
}

# Create the cron job machine
Write-Host "⏰ Creating daily investment returns cron job..." -ForegroundColor Magenta

$command = "fly machines run --app ""$APP_NAME"" --schedule ""0 2 * * *"" --name ""daily-investment-returns"" --env NODE_ENV=production --command ""node scripts/auto-investment-processor.js"" --detach"

if ($supabaseUrl) {
    $command += " --env SUPABASE_URL=""$supabaseUrl"""
}

if ($supabaseServiceKey) {
    $command += " --env SUPABASE_SERVICE_ROLE_KEY=""$supabaseServiceKey"""
}

Write-Host "Running: $command" -ForegroundColor Gray

# Execute the command
Invoke-Expression $command

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Cron job created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 To monitor the cron job:" -ForegroundColor Cyan
    Write-Host "   fly machines list --app $APP_NAME" -ForegroundColor White
    Write-Host "   fly logs --app $APP_NAME --instance daily-investment-returns" -ForegroundColor White
    Write-Host ""
    Write-Host "🔄 The investment returns processor will run daily at 2:00 AM UTC" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create cron job. Please check your Fly.io configuration." -ForegroundColor Red
    exit 1
}
