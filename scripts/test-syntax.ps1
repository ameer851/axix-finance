# Simple test script
Write-Host "Testing PowerShell syntax..." -ForegroundColor Green

$test = "Hello World"
Write-Host $test -ForegroundColor Blue

if ($true) {
    Write-Host "If statement works" -ForegroundColor Green
} else {
    Write-Host "Else statement works" -ForegroundColor Red
}

Write-Host "Script completed successfully" -ForegroundColor Green
