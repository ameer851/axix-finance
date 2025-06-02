# CaraxFinance ngrok Startup Script
Write-Host "🚀 Starting CaraxFinance with ngrok tunnel..." -ForegroundColor Green
Write-Host ""

# Check if ngrok is installed
try {
    $null = Get-Command ngrok -ErrorAction Stop
    Write-Host "✅ ngrok found" -ForegroundColor Green
} catch {
    Write-Host "❌ ngrok is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please follow the installation guide in NGROK_SETUP.md" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if the application is running on port 4000
Write-Host "🔍 Checking if application is running on port 4000..." -ForegroundColor Cyan
$portCheck = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue
if (-not $portCheck) {
    Write-Host "⚠️ Application doesn't seem to be running on port 4000" -ForegroundColor Yellow
    Write-Host "Please start your CaraxFinance application first with: npm run dev" -ForegroundColor Yellow
    Write-Host "Then run this script again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Application detected on port 4000" -ForegroundColor Green
Write-Host ""

# Display admin credentials
Write-Host "📋 Admin Credentials:" -ForegroundColor Magenta
Write-Host "   Username: admin" -ForegroundColor White
Write-Host "   Password: Carax@admin123!" -ForegroundColor White
Write-Host "   Email: admin@caraxfinance.com" -ForegroundColor White
Write-Host ""

Write-Host "🔗 Once ngrok starts, share the HTTPS URL with your client" -ForegroundColor Cyan
Write-Host "🛡️  The tunnel will remain active until you close this window" -ForegroundColor Cyan
Write-Host ""

# Check if ngrok config exists
if (Test-Path "ngrok.yml") {
    Write-Host "📁 Using configuration file: ngrok.yml" -ForegroundColor Green
    Write-Host "🌐 Starting ngrok tunnel..." -ForegroundColor Green
    Write-Host ""
    
    # Start ngrok with configuration
    & ngrok start caraxfinance --config=ngrok.yml
} else {
    Write-Host "📁 Configuration file not found, using basic setup" -ForegroundColor Yellow
    Write-Host "🌐 Starting ngrok tunnel..." -ForegroundColor Green
    Write-Host ""
    
    # Start basic ngrok tunnel
    & ngrok http 4000
}
