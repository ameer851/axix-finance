#!/usr/bin/env powershell
# Budget Deployment Setup Script for Axix Finance
# This script helps you deploy to Railway + Supabase (Budget Option)

Write-Host "🎯 Axix Finance - Budget Deployment Setup" -ForegroundColor Green
Write-Host "Total estimated cost: ~$12/year (vs $180/year with Render)" -ForegroundColor Yellow
Write-Host ""

# Check if required files exist
$requiredFiles = @(
    ".env",
    "package.json",
    "railway.json"
)

foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ Missing required file: $file" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Required files found" -ForegroundColor Green

# Check .env configuration
$envContent = Get-Content .env -Raw
$requiredEnvVars = @(
    "DATABASE_URL",
    "JWT_SECRET", 
    "SESSION_SECRET",
    "SMTP_USER",
    "SMTP_PASSWORD"
)

$missingVars = @()
foreach ($var in $requiredEnvVars) {
    if ($envContent -notmatch "$var=.+" -or $envContent -match "$var=your-") {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "❌ Missing or incomplete environment variables:" -ForegroundColor Red
    foreach ($var in $missingVars) {
        Write-Host "   - $var" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "📋 Please update your .env file with proper values" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Environment variables configured" -ForegroundColor Green

# Generate secrets if needed
Write-Host ""
Write-Host "🔐 Checking secrets..." -ForegroundColor Cyan

if ($envContent -match "JWT_SECRET=your-" -or $envContent -match "SESSION_SECRET=your-") {
    Write-Host "🔑 Generating new secrets..." -ForegroundColor Yellow
    
    # Generate 32-character secrets
    Add-Type -AssemblyName System.Web
    $jwtSecret = [System.Web.Security.Membership]::GeneratePassword(32, 0)
    $sessionSecret = [System.Web.Security.Membership]::GeneratePassword(32, 0)
    
    Write-Host "Generated JWT_SECRET: $jwtSecret" -ForegroundColor Green
    Write-Host "Generated SESSION_SECRET: $sessionSecret" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Please update your .env file with these secrets" -ForegroundColor Yellow
}

# Check build
Write-Host ""
Write-Host "🔨 Testing build..." -ForegroundColor Cyan

try {
    npm run build
    Write-Host "✅ Build successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Build failed. Please fix build errors before deploying" -ForegroundColor Red
    exit 1
}

# Deployment instructions
Write-Host ""
Write-Host "🚀 Ready for Budget Deployment!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. 📊 Set up Supabase database (Free):" -ForegroundColor White
Write-Host "   → Go to https://supabase.com" -ForegroundColor Gray
Write-Host "   → Create new project" -ForegroundColor Gray
Write-Host "   → Copy database URL to .env" -ForegroundColor Gray
Write-Host ""
Write-Host "2. 🚂 Deploy backend to Railway (Free):" -ForegroundColor White
Write-Host "   → Go to https://railway.app" -ForegroundColor Gray
Write-Host "   → Connect GitHub repository" -ForegroundColor Gray
Write-Host "   → Add environment variables" -ForegroundColor Gray
Write-Host ""
Write-Host "3. ▲ Deploy frontend to Vercel (Free):" -ForegroundColor White
Write-Host "   → Go to https://vercel.com" -ForegroundColor Gray
Write-Host "   → Import project from GitHub" -ForegroundColor Gray
Write-Host "   → Set VITE_API_URL to Railway URL" -ForegroundColor Gray
Write-Host ""
Write-Host "4. 🌐 Configure custom domain:" -ForegroundColor White
Write-Host "   → Buy domain (~$12/year)" -ForegroundColor Gray
Write-Host "   → Configure DNS in Vercel" -ForegroundColor Gray
Write-Host ""
Write-Host "💰 Total annual cost: ~$12 (vs $180 with Render)" -ForegroundColor Green
Write-Host "📚 See BUDGET-DEPLOYMENT.md for detailed instructions" -ForegroundColor Yellow
