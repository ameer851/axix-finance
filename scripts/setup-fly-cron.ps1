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
# Check if cron job already exists
$existingMachines = fly machines list --app $APP_NAME --json 2>&1
if ($LASTEXITCODE -eq 0) {
    $machines = $existingMachines | ConvertFrom-Json
    $cronJobExists = $machines | Where-Object { $_.name -eq "daily-investment-returns" }
    
    if ($cronJobExists) {
        Write-Host "Cron job 'daily-investment-returns' already exists!" -ForegroundColor Yellow
        Write-Host "To remove it and create a new one, run:" -ForegroundColor Cyan
        Write-Host "   fly machines destroy daily-investment-returns --app $APP_NAME" -ForegroundColor White
        exit 0
    }
}

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
