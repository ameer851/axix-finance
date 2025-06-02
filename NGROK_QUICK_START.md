# 🚀 Quick Start Guide: Share CaraxFinance with Client via ngrok

## 📋 Step-by-Step Instructions

### 1. Install ngrok (One-time setup)
1. **Download ngrok:**
   - Go to: https://ngrok.com/download
   - Download the Windows version
   - Extract `ngrok.exe` to `C:\ngrok\` (or any folder you prefer)

2. **Add to PATH:**
   - Press `Win + R`, type `sysdm.cpl`, press Enter
   - Click "Environment Variables"
   - Under "System Variables", find "Path" and click "Edit"
   - Click "New" and add the path where you extracted ngrok (e.g., `C:\ngrok\`)
   - Click OK to save

3. **Create ngrok Account (Free):**
   - Go to: https://dashboard.ngrok.com/signup
   - Sign up for free
   - Copy your authtoken from the dashboard

4. **Authenticate ngrok:**
   ```powershell
   ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
   ```

### 2. Update ngrok Configuration
Edit the `ngrok.yml` file in your project and replace `YOUR_AUTHTOKEN_HERE` with your actual token.

### 3. Start Your Application
```powershell
cd c:\Users\BABA\Documents\CaraxFinance
npm run dev
```
Wait for the message: "Server running on http://localhost:4000"

### 4. Start ngrok Tunnel
In a new PowerShell window:
```powershell
cd c:\Users\BABA\Documents\CaraxFinance
.\start-ngrok.ps1
```

Or use the batch file:
```cmd
start-ngrok.bat
```

### 5. Share with Client
Once ngrok starts, you'll see output like:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:4000
```

**Share the HTTPS URL with your client:** `https://abc123.ngrok.io`

## 🔐 Client Access Information

**Website URL:** The ngrok HTTPS URL (e.g., https://abc123.ngrok.io)

**Admin Login:**
- Username: `admin`
- Password: `Carax@admin123!`
- Email: `admin@caraxfinance.com`

**User Registration:** Clients can register new accounts directly on the website

## 🛡️ Security Notes
- ✅ CORS has been configured to allow ngrok domains
- ✅ HTTPS is enforced for secure connections
- ✅ Admin credentials are secure
- ⚠️ Free ngrok URLs change each restart
- 💡 For persistent URLs, consider upgrading to ngrok Pro

## 🔧 Troubleshooting

### "ngrok not found" Error
- Make sure ngrok is installed and added to your PATH
- Restart PowerShell after adding to PATH

### "Application not running" Error
- Make sure `npm run dev` is running first
- Check that the app is accessible at http://localhost:4000

### CORS Errors
- The server has been updated to allow ngrok domains
- If issues persist, restart the server after making changes

## 📞 Support
- ngrok documentation: https://ngrok.com/docs
- ngrok dashboard: https://dashboard.ngrok.com
- Check ngrok tunnel status: https://localhost:4040 (ngrok web interface)
