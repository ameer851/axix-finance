# Fly.io Cron Job Setup - Basic Version
Write-Host "Setting up Fly.io cron job..." -ForegroundColor Green

# Check if fly CLI is installed
$flyExists = Get-Command fly -ErrorAction SilentlyContinue
if (-not $flyExists) {
    Write-Host "Fly.io CLI is not installed" -ForegroundColor Red
    exit 1
}

Write-Host "Fly.io CLI is ready" -ForegroundColor Green

# Get the app name
$APP_NAME = "axix-finance"
Write-Host "Using app: $APP_NAME" -ForegroundColor Cyan

# Create the cron job command
$command = "fly machines run registry.fly.io/axix-finance:deployment-01K3Q7NYV52JCEDQ5WYZJMKPA9 --app $APP_NAME --schedule daily --name daily-investment-returns --env NODE_ENV=production --command 'node scripts/auto-investment-processor.js' --detach"

Write-Host "Running: $command" -ForegroundColor Gray

# Execute the command
Invoke-Expression $command

if ($LASTEXITCODE -eq 0) {
    Write-Host "Cron job created successfully!" -ForegroundColor Green
} else {
    Write-Host "Failed to create cron job" -ForegroundColor Red
    exit 1
}
