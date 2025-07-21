# Axix Finance Deployment Guide

## Overview
This guide will help you deploy Axix Finance to production using:
- **Render** for backend API and database
- **Vercel** for frontend hosting

## Prerequisites
1. Domain name purchased and configured
2. Gmail account with App Password for email service
3. GitHub repository with your code
4. Render account (render.com)
5. Vercel account (vercel.com)

## Part 1: Backend Deployment on Render

### 1.1 Database Setup
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "PostgreSQL"
3. Configure:
   - **Name**: axix-finance-db
   - **Database**: axix_finance
   - **User**: axix_user
   - **Region**: Choose closest to your users
   - **Plan**: Starter ($7/month)
4. Click "Create Database"
5. **Save the connection string** - you'll need it

### 1.2 Backend Service Setup
1. Click "New" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: axix-finance-api
   - **Environment**: Node
   - **Region**: Same as database
   - **Branch**: main
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Starter ($7/month)

### 1.3 Environment Variables
Add these environment variables in Render:

```
NODE_ENV=production
PORT=10000
DATABASE_URL=<your-postgres-connection-string>
JWT_SECRET=<generate-32-char-secret>
SESSION_SECRET=<generate-32-char-secret>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<your-gmail@gmail.com>
SMTP_PASSWORD=<your-gmail-app-password>
EMAIL_FROM=support@your-domain.com
CLIENT_URL=https://your-domain.vercel.app
CORS_ORIGIN=https://your-domain.vercel.app
CONTACT_EMAIL=support@your-domain.com
```

**Important**: 
- Replace `<your-postgres-connection-string>` with the database URL from step 1.1
- Generate strong 32+ character secrets for JWT_SECRET and SESSION_SECRET
- Use your Gmail App Password (not regular password)

### 1.4 Deploy Backend
1. Click "Create Web Service"
2. Wait for deployment to complete
3. Note your backend URL: `https://your-app-name.onrender.com`

## Part 2: Frontend Deployment on Vercel

### 2.1 Connect Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select the root directory

### 2.2 Configure Build Settings
```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 2.3 Environment Variables
Add these in Vercel:
```
VITE_API_URL=https://your-render-app.onrender.com
VITE_FRONTEND_URL=https://your-domain.vercel.app
```

### 2.4 Deploy Frontend
1. Click "Deploy"
2. Wait for deployment to complete
3. Get your Vercel URL: `https://your-project.vercel.app`

## Part 3: Custom Domain Setup

### 3.1 Configure Domain in Vercel
1. Go to your project settings in Vercel
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

### 3.2 Update Environment Variables
After domain is configured, update these URLs:

**In Render (Backend):**
```
CLIENT_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com
```

**In Vercel (Frontend):**
```
VITE_FRONTEND_URL=https://your-domain.com
```

## Part 4: Email Service Setup

### 4.1 Gmail App Password
1. Enable 2-Factor Authentication on Gmail
2. Go to Google Account → Security → App passwords
3. Generate password for "Mail"
4. Use this password in `SMTP_PASSWORD`

### 4.2 Test Email Service
Run the email diagnostic:
```bash
npm run email:diagnose:prod
```

## Part 5: Final Configuration

### 5.1 Update Config Files
Update your configuration files with production URLs:

1. **client/src/config.ts**: Already configured for environment variables
2. **Backend CORS**: Already configured via environment variables

### 5.2 Database Migration
The database will be automatically migrated on deployment via the `postbuild` script.

## Part 6: SSL and Security

### 6.1 SSL Certificates
- **Vercel**: Automatically provides SSL certificates
- **Render**: Automatically provides SSL certificates

### 6.2 Security Headers
Your app includes security middleware (helmet.js) for production.

## Testing Your Deployment

### 6.1 Backend Health Check
Visit: `https://your-render-app.onrender.com/api/health`
Should return: `{"status":"ok","serverTime":"..."}`

### 6.2 Frontend Loading
Visit: `https://your-domain.com`
Should load your application

### 6.3 Full Application Test
1. Register a new account
2. Check if verification email is sent
3. Test login/logout
4. Test core features

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Verify CORS_ORIGIN matches your frontend URL exactly
   - Check both HTTP and HTTPS variants

2. **Database Connection**
   - Verify DATABASE_URL is correct
   - Check if database is running on Render

3. **Email Not Sending**
   - Verify Gmail App Password is correct
   - Check SMTP settings
   - Run email diagnostic script

4. **Build Failures**
   - Check build logs in Render/Vercel
   - Verify all dependencies are in package.json
   - Check for TypeScript errors

### Getting Help
- Check deployment logs in Render/Vercel dashboards
- Use the email diagnostic script: `npm run email:diagnose:prod`
- Check application logs for errors

## Cost Estimate
- **Render Starter**: $7/month (API + Database)
- **Vercel Hobby**: Free (Frontend)
- **Domain**: $10-15/year
- **Total**: ~$85-90/year

## Security Checklist
- [ ] Strong JWT_SECRET and SESSION_SECRET
- [ ] Gmail App Password (not regular password)
- [ ] HTTPS enforced on both services
- [ ] CORS properly configured
- [ ] Environment variables secured
- [ ] Database access restricted

Your Axix Finance application is now ready for production! 🚀
