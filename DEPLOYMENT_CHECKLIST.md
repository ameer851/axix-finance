# Deployment Checklist

## Pre-deployment Steps

### 1. Environment Configuration
- [ ] Set NODE_ENV=production
- [ ] Configure production database URL
- [ ] Set secure session secret
- [ ] Configure SMTP settings (Brevo)
- [ ] Set correct CORS origin
- [ ] Configure rate limiting

### 2. Database Setup
- [ ] Create production database
- [ ] Run migrations: `npm run db:push`
- [ ] Create admin user: `npm run create-admin`

### 3. Security
- [ ] Enable HTTPS in production
- [ ] Set secure headers
- [ ] Configure firewall rules
- [ ] Set up SSL certificates

### 4. Performance
- [ ] Enable gzip compression
- [ ] Configure CDN for static assets
- [ ] Set up database connection pooling
- [ ] Enable caching

### 5. Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure logging
- [ ] Set up uptime monitoring
- [ ] Database performance monitoring

## Build and Deploy

```bash
# 1. Install dependencies
npm ci --only=production

# 2. Build the application
npm run build:prod

# 3. Start the application
npm run start:prod
```

## Post-deployment Verification

- [ ] Check application loads correctly
- [ ] Test user registration/login
- [ ] Verify email sending works
- [ ] Test admin panel access
- [ ] Check database connectivity
- [ ] Verify all API endpoints
- [ ] Test file uploads/downloads
- [ ] Check responsive design

## Backup and Recovery

- [ ] Set up automated database backups
- [ ] Test backup restoration
- [ ] Document recovery procedures
- [ ] Set up monitoring alerts
