# Steps to Fix API Connectivity Issues

## 1. Check Your Server Status 

First, run this command to see which ports are active on your system:

```powershell
netstat -ano | findstr "3000 4000 5000"
```

You should see a server listening on port 5000 (backend) and port 4000 (frontend). If not, one or both servers aren't running.

## 2. Start Your Backend Server

If your backend server isn't running:

```powershell
cd C:\Users\BABA\Documents\CaraxFinance
npm run dev:server
```

Or if you use Docker:

```powershell
docker-compose up -d
```

## 3. Configuration Changes Applied

I've made the following changes to fix the API connectivity issues:

- Updated `client/src/config.ts` to use port 5000 for the API URL
- Updated `client/src/services/api.ts` to use port 5000 for the API_BASE_URL
- Created a CORS fix script at `scripts/cors-fix.js` you can use to update your server
- Created an API tester script at `scripts/check-api.js`

## 4. Test API Connection 

Run the API test script to check if your endpoints are working:

```powershell
cd C:\Users\BABA\Documents\CaraxFinance
node scripts/check-api.js
```

## 5. Update CORS Configuration

If you're still having CORS issues, apply the CORS fix from `scripts/cors-fix.js` to your `server/index.ts` file, then restart your server.

## 6. Browser Check

You can also test your API directly in your browser. Open:

- http://localhost:5000/api/health

If it returns JSON, your API is working. If it returns HTML, your API routes aren't set up correctly.

## 7. Common Issues & Solutions

1. **Multiple servers running**: Make sure you don't have multiple versions of the app running on different ports.

2. **Wrong API port in code**: We've fixed this, but check any other files that might have hardcoded URLs.

3. **Missing backend routes**: Make sure your API endpoints are correctly defined in the server.

4. **Authentication required**: Some endpoints might need you to be logged in. Check the API documentation.

5. **Docker networking issues**: If using Docker, ensure containers can communicate with each other.
