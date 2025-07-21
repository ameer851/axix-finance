# Quick Start: $12/Year Supabase Setup 🚀

## 🎯 What You Get
- **Frontend**: Vercel (Free)
- **Backend**: Supabase Edge Functions (Free)
- **Database**: PostgreSQL with real-time (Free)
- **Auth**: Built-in authentication (Free)
- **Email**: Gmail SMTP (Free)
- **Domain**: Your choice (~$12/year)

**Total: ~$12/year!**

## ⚡ 15-Minute Setup

### Step 1: Create Supabase Project (3 minutes)
1. Go to [supabase.com](https://supabase.com/dashboard)
2. Click "New Project"
3. Name: `axix-finance`
4. Generate strong password
5. Choose region closest to users
6. Click "Create Project"

### Step 2: Install Dependencies (2 minutes)
```powershell
# Install Supabase client
npm install @supabase/supabase-js

# Install Supabase CLI globally
npm install -g supabase
```

### Step 3: Configure Project (5 minutes)
```powershell
# Run the setup script
npm run deploy:supabase
```

This script will:
- ✅ Install Supabase CLI
- ✅ Create environment files
- ✅ Link to your project
- ✅ Set up configuration

### Step 4: Database Setup (3 minutes)
1. Go to your [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)
2. Copy content from `supabase/migrations/001_initial_schema.sql`
3. Paste and click "Run"
4. ✅ Database schema created!

### Step 5: Deploy Functions (1 minute)
```powershell
# Deploy your API to Supabase Edge Functions
supabase functions deploy
```

### Step 6: Deploy Frontend (1 minute)
```powershell
# Deploy to Vercel
vercel --prod
```

## 🔧 Environment Variables

### Get from Supabase Dashboard:
1. **Project URL**: Settings → API → Project URL
2. **Anon Key**: Settings → API → Project API keys → anon/public
3. **Service Role**: Settings → API → Project API keys → service_role

### Add to Vercel:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_FRONTEND_URL=https://your-domain.vercel.app
```

## 🌐 Custom Domain Setup

### Option 1: Use Vercel Domain (Free)
- Your app: `https://axix-finance.vercel.app`
- Cost: **$0**

### Option 2: Custom Domain ($12/year)
1. Buy domain from [Namecheap](https://namecheap.com) (~$12/year)
2. In Vercel → Project Settings → Domains
3. Add your custom domain
4. Update DNS settings as instructed
5. ✅ Your app: `https://your-domain.com`

## 📧 Email Setup Options

### Option A: Supabase Auth Emails (Easiest)
- ✅ Works immediately
- ✅ No configuration needed
- ❌ Limited customization
- **Cost: $0**

### Option B: Gmail SMTP (More Control)
- ✅ Full email customization
- ✅ Branded emails
- ❌ Requires setup
- **Cost: $0**

Setup Gmail SMTP:
1. Enable 2FA on Gmail
2. Generate App Password
3. Add to Supabase Edge Function environment

## 🚀 Go Live Checklist

- [ ] Supabase project created
- [ ] Database schema deployed
- [ ] Edge Functions deployed
- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured
- [ ] Custom domain connected (optional)
- [ ] Email service tested
- [ ] User registration tested
- [ ] Core features tested

## 📊 Free Tier Limits

| Service | Free Limit | Upgrade Cost |
|---------|------------|--------------|
| Database | 500MB | $25/month |
| Edge Functions | 500K requests/month | $25/month |
| Auth | Unlimited users | Included |
| Storage | 1GB | $25/month |
| Bandwidth | 2GB/month | $25/month |

## 🎯 When to Upgrade

Upgrade to Supabase Pro ($25/month) when you hit:
- More than 500MB database storage
- More than 500K API requests/month
- More than 2GB bandwidth/month

## 💡 Pro Tips

1. **Optimize Database**: Use indexes, efficient queries
2. **Cache Data**: Reduce API calls with React Query
3. **Compress Images**: Use WebP format, optimize assets
4. **Monitor Usage**: Check Supabase dashboard regularly
5. **Real-time Features**: Use Supabase real-time for live updates

## 🆘 Need Help?

### Common Issues:
1. **CORS Errors**: Check Supabase auth settings
2. **Database Connection**: Verify environment variables
3. **Function Errors**: Check Supabase function logs
4. **Build Failures**: Check Vercel deployment logs

### Resources:
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- Your migration guide: `SUPABASE-SETUP.md`

## 🎉 You're Live!

Your Axix Finance app is now running on:
- **Modern serverless architecture**
- **Real-time database**
- **Built-in authentication**
- **Global CDN**
- **Auto-scaling**

All for just **$12/year**! 🚀

---

**Total setup time**: ~15 minutes  
**Total cost**: ~$12/year  
**Scalability**: Handle thousands of users  
**Reliability**: 99.9% uptime  
