# Vercel Deployment Guide for Axix Finance

This document provides step-by-step instructions for deploying Axix Finance on Vercel.

## Prerequisites

- A GitHub account with your Axix Finance repository
- A Vercel account (sign up at https://vercel.com)
- A Supabase account (sign up at https://supabase.com)
- A Resend account for email services (sign up at https://resend.com)

## Step 1: Prepare Your Repository

Ensure your repository has the following files:
- `vercel.json` (deployment configuration)
- `.env.example` (template for environment variables)
- A proper `.gitignore` file that excludes sensitive information

## Step 2: Connect Your Repository to Vercel

1. Log in to your Vercel account
2. Click on "Add New" > "Project"
3. Select your GitHub repository
4. Click "Import"

## Step 3: Configure Project Settings

1. **Framework Preset**: Select "Other" (our vercel.json handles this)
2. **Build Command**: Use the default from vercel.json (`npm run build`)
3. **Output Directory**: Use the default from vercel.json (`dist`)
4. **Install Command**: Use the default from vercel.json (`npm install`)

## Step 4: Set Environment Variables

Add the following environment variables:

```
SUPABASE_PROJECT_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Axix Finance
DATABASE_URL=postgres://postgres:[PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
NODE_ENV=production
```

## Step 5: Deploy

1. Click "Deploy"
2. Wait for the deployment to complete
3. Access your deployed application at the provided URL

## Step 6: Verify Deployment

1. Test user registration and login
2. Test deposit and withdrawal flows
3. Check email functionality
4. Verify database connections

## Troubleshooting

### Database Connection Issues
- Check that your DATABASE_URL is correct
- Ensure your Supabase project is running
- Verify that migrations have been applied

### Email Issues
- Check that your RESEND_API_KEY is valid
- Verify that EMAIL_FROM is a valid email address
- Check email logs in the Resend dashboard

### Build Failures
- Review build logs in Vercel
- Ensure all dependencies are properly installed
- Check for any syntax errors or import issues

## Maintaining Your Deployment

- Set up automatic deployments from your main branch
- Configure preview deployments for pull requests
- Regularly update dependencies
- Monitor application logs and performance

For additional help, refer to the [Vercel documentation](https://vercel.com/docs) or [contact support](https://vercel.com/help).
