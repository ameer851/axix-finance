@echo off
echo 🚀 CaraxFinance - NgRok Quick Setup
echo.

cd /d "c:\Users\BABA\Documents\CaraxFinance"

echo 📋 Step 1: Starting your CaraxFinance application...
echo Please make sure your app is running on port 4000
echo.

echo 💡 If not already running, open another terminal and run:
echo    npm run dev
echo.

pause

echo.
echo 📡 Step 2: Starting NgRok tunnel...
echo This will create a public URL for your application
echo.

cd "ngrok v3"
echo Starting ngrok tunnel on port 4000...
.\ngrok.exe http 4000

echo.
echo 🎯 NgRok session ended. Press any key to exit.
pause
