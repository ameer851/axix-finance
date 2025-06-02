@echo off
echo 🔍 Testing ngrok setup...
echo.

echo 1. Checking if ngrok.exe exists...
if exist "ngrok v3\ngrok.exe" (
    echo ✅ ngrok.exe found
) else (
    echo ❌ ngrok.exe not found
    pause
    exit
)

echo.
echo 2. Testing ngrok version...
"ngrok v3\ngrok.exe" version

echo.
echo 3. Checking if server is running on port 4000...
netstat -an | findstr :4000 >nul
if %errorlevel%==0 (
    echo ✅ Server is running on port 4000
) else (
    echo ❌ Server not found on port 4000
    echo Make sure your server is running first!
)

echo.
echo 📋 Ready to start tunnel? 
echo Run: start-tunnel.bat
pause
