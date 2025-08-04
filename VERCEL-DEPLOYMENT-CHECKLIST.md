# Vercel Deployment Checklist

After pushing your changes to GitHub and triggering a new Vercel deployment, follow these steps to verify the deployment:

## 1. Check Deployment Status

1. Go to the Vercel dashboard
2. Select your project (axix-finance)
3. Check the deployment status and logs
4. Verify there are no runtime errors

## 2. Test API Endpoints

1. Test the health endpoint: `https://your-domain.vercel.app/api/health`
2. Test authentication: Login and register functions
3. Test user dashboard functionality

## 3. Verify Client App

1. Navigate to the home page
2. Check that all components load correctly
3. Verify that API requests work properly

## 4. Monitor Performance

1. Check page load times
2. Monitor API response times
3. Watch for any error reports in your logging system

## 5. Troubleshooting

If you encounter issues:

1. **Function Timeout Errors**: Consider optimizing database queries
2. **CORS Issues**: Check your API response headers
3. **Missing Environment Variables**: Verify all required variables are set in Vercel
4. **Database Connection Errors**: Check database credentials and connection strings
5. **Runtime Configuration Errors**: If you see "Function Runtimes must have a valid version", check your `vercel.json` file and make sure you're using the correct format:

   ```json
   "functions": {
     "api/**/*": {
       "runtime": "@vercel/node@2.15.3"
     }
   }
   ```

Remember to check the serverless function logs in the Vercel dashboard for detailed error information.

## 6. Required Environment Variables

Make sure these environment variables are set in your Vercel project settings:

1. `DATABASE_URL` - Your PostgreSQL connection string
2. `JWT_SECRET` - Secret key for JWT token generation
3. `VITE_API_URL` - The URL of your API (typically `https://your-domain.vercel.app/api`)
4. `NODE_ENV` - Set to `production` for production deployments

## 7. Deployment Best Practices

1. **Use GitHub Integration**: Set up automatic deployments from your GitHub repository
2. **Preview Deployments**: Test changes in preview deployments before merging to main
3. **Environment Variables**: Use different values for production and preview environments
4. **Monitoring**: Set up monitoring to be alerted of deployment failures
