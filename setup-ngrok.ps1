Write-Host "🚀 CaraxFinance - NgRok Quick Setup" -ForegroundColor Green
Write-Host ""

Set-Location "c:\Users\BABA\Documents\CaraxFinance"

Write-Host "📋 Step 1: Checking if your CaraxFinance application is running..." -ForegroundColor Yellow
Write-Host "Your app should be running on http://localhost:4000" -ForegroundColor White
Write-Host ""

# Check if port 4000 is in use
$port4000 = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue
if ($port4000) {
    Write-Host "✅ Application appears to be running on port 4000" -ForegroundColor Green
} else {
    Write-Host "⚠️  Application not detected on port 4000" -ForegroundColor Red
    Write-Host "💡 Please start your application first with: npm run dev" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Do you want to continue anyway? (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit
    }
}

Write-Host ""
Write-Host "📡 Step 2: Starting NgRok tunnel..." -ForegroundColor Yellow
Write-Host "This will create a public URL for your CaraxFinance application" -ForegroundColor White
Write-Host ""

# Navigate to ngrok directory and start tunnel
Set-Location "ngrok v3"
Write-Host "🔗 Creating secure tunnel..." -ForegroundColor Cyan
& ".\ngrok.exe" http 4000
