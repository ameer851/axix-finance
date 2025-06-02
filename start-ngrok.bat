@echo off
echo 🚀 Starting CaraxFinance with ngrok tunnel...
echo.

REM Check if ngrok is installed
where ngrok >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ngrok is not installed or not in PATH
    echo Please follow the installation guide in NGROK_SETUP.md
    pause
    exit /b 1
)

REM Check if the application is already running
echo 🔍 Checking if application is running on port 4000...
netstat -an | find "4000" >nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Application doesn't seem to be running on port 4000
    echo Please start your CaraxFinance application first with: npm run dev
    echo Then run this script again.
    pause
    exit /b 1
)

echo ✅ Application detected on port 4000
echo.

REM Start ngrok tunnel
echo 🌐 Starting ngrok tunnel...
echo.
echo 📋 Admin Credentials:
echo    Username: admin
echo    Password: Carax@admin123!
echo    Email: admin@caraxfinance.com
echo.
echo 🔗 Once ngrok starts, share the HTTPS URL with your client
echo 🛡️  The tunnel will remain active until you close this window
echo.

REM Start ngrok with the configuration
ngrok start caraxfinance --config=ngrok.yml
