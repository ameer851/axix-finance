# Supabase Setup Guide for Axix Finance

## 🎯 Quick Supabase Setup (Free Tier)

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up with GitHub
3. Click "New Project"
4. Fill in:
   - **Name**: axix-finance
   - **Database Password**: Generate strong password
   - **Region**: Choose closest to your users
   - **Plan**: Free tier

### Step 2: Get Database Connection
1. Go to Project Settings → Database
2. Copy the connection string:
   ```
   postgresql://postgres:[password]@[host]:5432/postgres
   ```

### Step 3: Run Database Migrations
```powershell
# Set your Supabase database URL
$env:DATABASE_URL="your-supabase-connection-string"

# Run migrations
npm run db:push
```

### Step 4: Set Up Row Level Security (Optional)
Supabase has built-in RLS for extra security:

```sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for user data access
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id::text);

-- Apply to other tables as needed
```

## 🔧 Environment Configuration for Supabase

### For Railway Backend:
```bash
NODE_ENV=production
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
JWT_SECRET=your-32-char-secret
SESSION_SECRET=your-32-char-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASSWORD=your-gmail-app-password
EMAIL_FROM=support@your-domain.com
CLIENT_URL=https://your-app.vercel.app
CORS_ORIGIN=https://your-app.vercel.app
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

## 📊 Supabase Free Tier Limits

| Resource | Free Tier | Paid Tier ($25/month) |
|----------|-----------|----------------------|
| Database | 500MB | 8GB |
| Bandwidth | 2GB | 250GB |
| API Requests | 50,000/month | 5,000,000/month |
| Auth Users | 50,000 MAU | 100,000 MAU |
| Storage | 1GB | 100GB |

## 🚀 Quick Railway + Supabase Deployment

### 1. Prepare Your Repository
```powershell
# Add railway.json and update package.json
git add .
git commit -m "Add Railway configuration for budget deployment"
git push origin main
```

### 2. Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Click "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect and deploy

### 3. Add Environment Variables in Railway
```bash
DATABASE_URL=your-supabase-connection-string
NODE_ENV=production
# ... other variables from above
```

### 4. Deploy Frontend to Vercel
```powershell
# Update environment variables
VITE_API_URL=https://your-app.railway.app
```

## 💰 Cost Breakdown (Budget Setup)

### Monthly Costs:
- **Supabase**: $0 (Free tier)
- **Railway**: $0 (Free tier - 500 hours)
- **Vercel**: $0 (Free tier)
- **Domain**: $1/month ($12/year)

### **Total: $1/month or $12/year**

### When You Need to Scale:
- **Railway Pro**: $5/month (unlimited hours)
- **Supabase Pro**: $25/month (when you hit 500MB limit)
- **Total when scaling**: $31/month

## 🔄 Migration Script from Render to Railway

```powershell
# Create migration script
# This will help you move from expensive Render to budget Railway

# 1. Export current database
pg_dump $RENDER_DATABASE_URL > backup.sql

# 2. Import to Supabase
psql $SUPABASE_DATABASE_URL < backup.sql

# 3. Update environment variables
# 4. Deploy to Railway
# 5. Update DNS to point to Railway
```

## 🛡️ Security Best Practices for Budget Setup

1. **Enable RLS in Supabase** for data protection
2. **Use strong JWT secrets** (32+ characters)
3. **Enable CORS protection** in your app
4. **Use environment variables** for all secrets
5. **Regular database backups** (Supabase auto-backups)

## 📈 Monitoring Your Budget Setup

### Railway Monitoring:
- Check execution hours in dashboard
- Monitor memory usage
- Set up alerts for limit approaching

### Supabase Monitoring:
- Database size in dashboard
- API request usage
- Bandwidth consumption

### Free Monitoring Tools:
- **UptimeRobot**: Free uptime monitoring
- **Google Analytics**: Free website analytics
- **Supabase Logs**: Built-in error logging

Your $250 budget will last **20+ years** with this setup! 🎉
