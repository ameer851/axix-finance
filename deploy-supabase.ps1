# Supabase Deployment Script for Axix Finance

# Load required assembly for password generation
Add-Type -AssemblyName System.Web

Write-Host "Axix Finance - Supabase Deployment Setup" -ForegroundColor Green
Write-Host ""

# Check if Supabase CLI is installed
try {
    $supabaseVersion = supabase --version
    Write-Host "Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "Supabase CLI not found. Installing..." -ForegroundColor Red
    Write-Host "Installing Supabase CLI via npm..." -ForegroundColor Yellow
    npm install -g supabase
    Write-Host "Supabase CLI installed!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Deployment Steps:" -ForegroundColor Cyan
Write-Host "1. Create Supabase project at https://supabase.com/dashboard" -ForegroundColor White
Write-Host "2. Get your project reference ID and API keys" -ForegroundColor White
Write-Host "3. Run this script to set up local development" -ForegroundColor White
Write-Host "4. Deploy Edge Functions to Supabase" -ForegroundColor White
Write-Host "5. Deploy frontend to Vercel" -ForegroundColor White
Write-Host ""

# Check if user has created Supabase project
Write-Host "Have you created a Supabase project yet? (y/n)" -ForegroundColor Yellow
$hasProject = Read-Host
if ($hasProject -eq "n" -or $hasProject -eq "N") {
    Write-Host ""
    Write-Host "Please create a Supabase project first:" -ForegroundColor Cyan
    Write-Host "1. Go to https://supabase.com/dashboard" -ForegroundColor White
    Write-Host "2. Click 'New Project'" -ForegroundColor White
    Write-Host "3. Name: axix-finance" -ForegroundColor White
    Write-Host "4. Generate strong password" -ForegroundColor White
    Write-Host "5. Choose region closest to you" -ForegroundColor White
    Write-Host "6. Wait 2-3 minutes for creation" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run this script again!" -ForegroundColor Green
    pause
    exit
}

# Ask for Supabase project details
Write-Host ""
Write-Host "Get these from your Supabase dashboard Settings API:" -ForegroundColor Cyan
$projectRef = Read-Host "Enter your Supabase project reference ID (e.g., abc123xyz)"
$supabaseUrl = "https://$projectRef.supabase.co"
Write-Host ""
$anonKey = Read-Host "Enter your Supabase anon key"

Write-Host ""
Write-Host "Setting up environment files..." -ForegroundColor Yellow

# Create .env for Supabase
$jwtSecret = [System.Web.Security.Membership]::GeneratePassword(32, 0)
$envSupabase = @"
# Supabase Configuration
SUPABASE_URL=$supabaseUrl
SUPABASE_ANON_KEY=$anonKey
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email Configuration (if using custom email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASSWORD=your-gmail-app-password

# JWT Secret (generate a strong secret)
JWT_SECRET=$jwtSecret
"@

$envSupabase | Out-File -FilePath ".env.supabase" -Encoding UTF8
Write-Host "Created .env.supabase file" -ForegroundColor Green

# Create .env.local for Vercel (domain-free setup)
Write-Host ""
Write-Host "Do you have a custom domain? (y/n)" -ForegroundColor Yellow
$hasDomain = Read-Host

if ($hasDomain -eq "y" -or $hasDomain -eq "Y") {
    $customDomain = Read-Host "Enter your domain (e.g., axix-finance.com)"
    $frontendUrl = "https://$customDomain"
} else {
    Write-Host "Using free Vercel subdomain (you can add custom domain later)" -ForegroundColor Green
    $frontendUrl = "https://your-app.vercel.app"
    Write-Host "After Vercel deployment, you'll get your actual URL" -ForegroundColor Cyan
}

$envVercel = @"
# Vercel Environment Variables (Free Setup)
VITE_SUPABASE_URL=$supabaseUrl
VITE_SUPABASE_ANON_KEY=$anonKey
VITE_FRONTEND_URL=$frontendUrl
"@

$envVercel | Out-File -FilePath ".env.local" -Encoding UTF8
Write-Host "Created .env.local file for Vercel" -ForegroundColor Green

Write-Host ""
Write-Host "Linking to Supabase project..." -ForegroundColor Yellow

# Initialize Supabase project
try {
    supabase init
    Write-Host "Supabase project initialized" -ForegroundColor Green
} catch {
    Write-Host "Supabase already initialized or error occurred" -ForegroundColor Yellow
}

# Link to remote project
supabase link --project-ref $projectRef

Write-Host ""
Write-Host "Setting up database schema..." -ForegroundColor Yellow
Write-Host "Please run the SQL migration in your Supabase dashboard:" -ForegroundColor Cyan
Write-Host "   1. Go to https://supabase.com/dashboard/project/$projectRef/sql" -ForegroundColor White
Write-Host "   2. Copy and paste the content from supabase/migrations/001_initial_schema.sql" -ForegroundColor White
Write-Host "   3. Click 'Run' to execute the migration" -ForegroundColor White

Write-Host ""
Write-Host "Ready for deployment!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run database migration in Supabase dashboard" -ForegroundColor White
Write-Host "2. Deploy Edge Functions: supabase functions deploy" -ForegroundColor White
Write-Host "3. Deploy to Vercel: vercel --prod" -ForegroundColor White
Write-Host "4. Configure your custom domain" -ForegroundColor White
Write-Host ""
Write-Host "Total cost: $12/year (just for domain!)" -ForegroundColor Green
Write-Host ""

# Ask if user wants to deploy Edge Functions now
$deployFunctions = Read-Host "Do you want to deploy Edge Functions now? (y/n)"
if ($deployFunctions -eq "y" -or $deployFunctions -eq "Y") {
    Write-Host "Deploying Edge Functions..." -ForegroundColor Yellow
    supabase functions deploy
    Write-Host "Edge Functions deployed!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Supabase setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps for FREE deployment:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Set up database schema:" -ForegroundColor Yellow
Write-Host "   Go to https://supabase.com/dashboard/project/$projectRef/sql" -ForegroundColor White
Write-Host "   Copy content from supabase/migrations/001_initial_schema.sql" -ForegroundColor White
Write-Host "   Paste and click 'Run'" -ForegroundColor White
Write-Host ""
Write-Host "2. Deploy Edge Functions:" -ForegroundColor Yellow
Write-Host "   supabase functions deploy" -ForegroundColor White
Write-Host ""
Write-Host "3. Deploy to Vercel (FREE):" -ForegroundColor Yellow
Write-Host "   vercel" -ForegroundColor White
Write-Host ""
Write-Host "4. Add environment variables in Vercel dashboard:" -ForegroundColor Yellow
Write-Host "   (Settings Environment Variables)" -ForegroundColor White
Write-Host "   VITE_SUPABASE_URL=$supabaseUrl" -ForegroundColor White
Write-Host "   VITE_SUPABASE_ANON_KEY=your-anon-key" -ForegroundColor White
Write-Host ""
Write-Host "Total cost: $0 (completely FREE!)" -ForegroundColor Green
Write-Host "Add custom domain later for just $12/year" -ForegroundColor Cyan
Write-Host ""
Write-Host "Full guide: DEPLOY-FREE.md" -ForegroundColor Blue
