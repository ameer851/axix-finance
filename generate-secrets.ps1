# Generate Secure Secrets for Axix Finance Deployment
# Run this script in PowerShell to generate required secrets

Write-Host "🔐 Generating Secure Secrets for Axix Finance" -ForegroundColor Green
Write-Host "=" * 50

# Load System.Web assembly for password generation
Add-Type -AssemblyName System.Web

# Generate JWT Secret (32 characters)
$jwtSecret = [System.Web.Security.Membership]::GeneratePassword(32, 0)
Write-Host "JWT_SECRET:" -ForegroundColor Yellow
Write-Host $jwtSecret -ForegroundColor White
Write-Host ""

# Generate Session Secret (32 characters) 
$sessionSecret = [System.Web.Security.Membership]::GeneratePassword(32, 0)
Write-Host "SESSION_SECRET:" -ForegroundColor Yellow
Write-Host $sessionSecret -ForegroundColor White
Write-Host ""

# Display current Gmail configuration
Write-Host "📧 Current Email Configuration:" -ForegroundColor Blue
Write-Host "SMTP_USER: aliyuamir607@gmail.com" -ForegroundColor White
Write-Host "SMTP_PASSWORD: gneq baka zsjn edto" -ForegroundColor White
Write-Host ""

Write-Host "⚠️  IMPORTANT SECURITY NOTES:" -ForegroundColor Red
Write-Host "1. Keep these secrets secure and private" -ForegroundColor White
Write-Host "2. Never commit secrets to version control" -ForegroundColor White
Write-Host "3. Use these in your Render environment variables" -ForegroundColor White
Write-Host "4. Your Gmail App Password is already configured" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Ready for deployment!" -ForegroundColor Green
Write-Host "Copy these values to your Render environment variables" -ForegroundColor White

# Optional: Save to temporary file
$secretsFile = "deployment-secrets.txt"
$secretsContent = @"
# Axix Finance Deployment Secrets
# Generated on $(Get-Date)
# DO NOT COMMIT THIS FILE TO VERSION CONTROL

JWT_SECRET=$jwtSecret
SESSION_SECRET=$sessionSecret

# Email Configuration (already configured)
SMTP_USER=aliyuamir607@gmail.com
SMTP_PASSWORD=gneq baka zsjn edto
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_FROM=support@axix-finance.com

# Database (will be provided by Render)
DATABASE_URL=<insert-render-postgres-url>

# URLs (update with your actual domain)
CLIENT_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com
CONTACT_EMAIL=support@your-domain.com
"@

$secretsContent | Out-File -FilePath $secretsFile -Encoding UTF8
Write-Host ""
Write-Host "💾 Secrets saved to: $secretsFile" -ForegroundColor Cyan
Write-Host "Remember to delete this file after deployment!" -ForegroundColor Red
