# Quick Deployment Checklist for Axix Finance

## ✅ Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] `.env` file configured with production values
- [ ] Gmail App Password generated and configured
- [ ] Strong JWT_SECRET and SESSION_SECRET generated
- [ ] Domain name purchased and ready

### 2. Code Repository
- [ ] All code committed to GitHub
- [ ] Repository is public or accessible to Render/Vercel
- [ ] `render.yaml` and `vercel.json` files are in place

### 3. Database Preparation
- [ ] PostgreSQL database will be created on Render
- [ ] Database migrations are ready (automatic via postbuild script)

## 🚀 Deployment Steps

### Step 1: Deploy Backend to Render
1. **Create Database:**
   - Go to https://dashboard.render.com
   - Click "New" → "PostgreSQL"
   - Name: `axix-finance-db`
   - Plan: Starter ($7/month)
   - Save the connection string

2. **Create Web Service:**
   - Click "New" → "Web Service"
   - Connect your GitHub repo
   - Name: `axix-finance-api`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **Set Environment Variables:**
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<from-step-1>
   JWT_SECRET=<32-char-secret>
   SESSION_SECRET=<32-char-secret>
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=aliyuamir607@gmail.com
   SMTP_PASSWORD=<your-gmail-app-password>
   EMAIL_FROM=support@axix-finance.com
   CLIENT_URL=https://your-domain.com
   CORS_ORIGIN=https://your-domain.com
   CONTACT_EMAIL=support@axix-finance.com
   ```

### Step 2: Deploy Frontend to Vercel
1. **Import Project:**
   - Go to https://vercel.com/dashboard
   - Click "New Project"
   - Import from GitHub

2. **Configure Build:**
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Set Environment Variables:**
   ```
   VITE_API_URL=https://your-render-app.onrender.com
   VITE_FRONTEND_URL=https://your-domain.com
   ```

### Step 3: Configure Custom Domain
1. **In Vercel:**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Configure DNS as instructed

2. **Update URLs:**
   - Update `CLIENT_URL` and `CORS_ORIGIN` in Render
   - Update `VITE_FRONTEND_URL` in Vercel

## 🔧 Required Secrets to Generate

### JWT Secret (32+ characters):
```powershell
# Generate in PowerShell:
[System.Web.Security.Membership]::GeneratePassword(32, 0)
```

### Session Secret (32+ characters):
```powershell
# Generate in PowerShell:
[System.Web.Security.Membership]::GeneratePassword(32, 0)
```

## 📧 Gmail App Password Setup

1. **Enable 2FA on Gmail:**
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password:**
   - In Security settings, find "App passwords"
   - Select "Mail" and "Other device"
   - Name it "Axix Finance"
   - Use the 16-character password in `SMTP_PASSWORD`

## 🧪 Testing Your Deployment

### Backend Health Check:
```
GET https://your-render-app.onrender.com/api/health
Expected: {"status":"ok","serverTime":"..."}
```

### Frontend Loading:
```
Visit: https://your-domain.com
Expected: Application loads successfully
```

### Email Service Test:
```powershell
# Test email service after deployment
npm run email:diagnose:prod
```

## 💰 Cost Breakdown
- **Render (Backend + Database)**: $14/month
- **Vercel (Frontend)**: Free
- **Domain**: ~$12/year
- **Total**: ~$180/year

## 🆘 Troubleshooting

### Common Issues:
1. **CORS Errors**: Check `CORS_ORIGIN` matches frontend URL exactly
2. **Database Connection**: Verify `DATABASE_URL` is correct
3. **Email Issues**: Test Gmail App Password locally first
4. **Build Failures**: Check logs in Render/Vercel dashboards

### Support Resources:
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Email Diagnostic: `npm run email:diagnose:prod`

## 🎯 Final Steps After Deployment

1. **Test User Registration**: Verify email verification works
2. **Test Core Features**: Login, transactions, dashboard
3. **Monitor Logs**: Check for any errors in production
4. **Set Up Monitoring**: Consider adding error tracking (Sentry)
5. **Backup Strategy**: Regular database backups via Render

Your Axix Finance application will be live and ready for users! 🚀
