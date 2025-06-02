@echo off
echo 🚀 Starting ngrok tunnel for CaraxFinance...
echo.
echo Make sure you have:
echo 1. ✅ Server running on port 4000 (RUNNING)
echo 2. ⏳ ngrok authenticated with your token
echo.
echo Starting tunnel...
echo.
powershell -Command ".'.\ngrok v3\ngrok.exe' http 4000"
