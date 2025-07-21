# Axix Finance - Deployment Preparation Script
# This script prepares your application for deployment

Write-Host "🚀 Axix Finance - Deployment Preparation" -ForegroundColor Green
Write-Host "=" * 50

# Check if we're in the right directory
if (!(Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

Write-Host "📋 Checking deployment requirements..." -ForegroundColor Blue

# Check if .env file exists
if (!(Test-Path ".env")) {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    Write-Host "📋 Copy .env.example to .env and configure your settings" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ .env file found" -ForegroundColor Green
}

# Check if required deployment files exist
$deploymentFiles = @(
    "render.yaml",
    "vercel.json",
    ".env.example",
    "docs/deployment-guide.md"
)

foreach ($file in $deploymentFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file missing" -ForegroundColor Red
    }
}

# Check Node.js version
$nodeVersion = node --version
Write-Host "📦 Node.js version: $nodeVersion" -ForegroundColor Cyan

# Check if dependencies are installed
if (Test-Path "node_modules") {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Dependencies not installed. Running npm install..." -ForegroundColor Yellow
    npm install
}

# Build the application
Write-Host "🔨 Building application..." -ForegroundColor Blue
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed. Please fix errors before deployment." -ForegroundColor Red
    exit 1
}

# Check TypeScript
Write-Host "🔍 Checking TypeScript..." -ForegroundColor Blue
npm run check

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ TypeScript check passed" -ForegroundColor Green
} else {
    Write-Host "⚠️  TypeScript warnings/errors found. Review and fix if necessary." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 Deployment Preparation Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Blue
Write-Host "1. Generate secrets: .\generate-secrets.ps1" -ForegroundColor White
Write-Host "2. Commit and push your code to GitHub" -ForegroundColor White
Write-Host "3. Deploy backend to Render" -ForegroundColor White
Write-Host "4. Deploy frontend to Vercel" -ForegroundColor White
Write-Host "5. Configure your custom domain" -ForegroundColor White
Write-Host ""
Write-Host "📚 See DEPLOYMENT-CHECKLIST.md for detailed instructions" -ForegroundColor Cyan
