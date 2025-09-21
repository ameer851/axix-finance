Param(
  [Alias('user-email')][string]$UserEmail,
  [Alias('user')][string]$UserUid,
  [Alias('user-id')][int]$UserId,
  [int]$Amount = 500,
  [int]$Duration = 3,
  [double]$DailyPct = 2
)

Write-Host "[1/6] Verifying env vars (.env should contain SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)" -ForegroundColor Cyan
if (-not (Test-Path -Path (Join-Path -Path (Join-Path -Path $PSScriptRoot -ChildPath '..') -ChildPath '.env'))) {
  Write-Warning ".env not found at repo root; scripts will fail to connect unless env vars are in the environment."
}

Write-Host "[2/6] Creating test investment (first-today)" -ForegroundColor Cyan
$args = @()
if ($UserEmail) { $args += @('--user-email', $UserEmail) }
if ($UserUid)   { $args += @('--user', $UserUid) }
if ($UserId)    { $args += @('--user-id', $UserId) }
$args += @('--amount', "$Amount", '--plan', 'STARTER PLAN', '--duration', "$Duration", '--daily', "$DailyPct", '--total', '106', '--first-today')
node (Join-Path $PSScriptRoot 'create-test-investment.mjs') @args
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[3/6] Applying daily returns (run #1)" -ForegroundColor Cyan
$applyPath = Join-Path $PSScriptRoot 'apply-returns-runner.ts'
npx tsx $applyPath
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[4/6] Checking investments state" -ForegroundColor Cyan
node (Join-Path $PSScriptRoot 'check-investments.js')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[5/6] Applying daily returns again (optional run #2 to simulate next day)" -ForegroundColor Cyan
Write-Host "Note: For a true next-day test, adjust first_profit_date or wait until UTC SOD." -ForegroundColor Yellow
$applyPath2 = Join-Path $PSScriptRoot 'apply-returns-runner.ts'
npx tsx $applyPath2

Write-Host "[6/6] Final check" -ForegroundColor Cyan
node (Join-Path $PSScriptRoot 'check-investments.js')
Write-Host "Done." -ForegroundColor Green
