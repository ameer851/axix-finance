# Vercel Deployment Instructions

## Steps for Deploying to Vercel

1. Ensure all serverless functions in the `/api` directory have correct imports for Vercel:
   - Import `VercelRequest` and `VercelResponse` from `@vercel/node`
   - Make sure functions export a default handler function

2. Check the `vercel.json` configuration:
   - Proper runtime specification: `@vercel/node@2.15.10`
   - Correct routing configuration
   - Appropriate build commands

3. Deploy using one of these methods:
   - Use GitHub integration (recommended)
   - Use Vercel CLI: `vercel --prod`

## Common Issues and Solutions

- **Function Runtime Error**: Make sure to use `@vercel/node@x.x.x` format in `vercel.json`
- **API Routes Not Working**: Check the rewrites in `vercel.json` and make sure they point to the correct serverless functions
- **Build Failures**: Check that dependencies are properly installed with `--legacy-peer-deps` if needed

## Environment Variables

Make sure to set these environment variables in the Vercel dashboard:

- `DATABASE_URL`: Your database connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `VITE_API_URL`: API URL for the client (usually `https://your-domain.vercel.app/api`)

## Testing After Deployment

1. Visit the home page to verify the client is deployed correctly
2. Test authentication (login/register)
3. Test API endpoints are working properly

## Rollback Procedure

If issues are encountered after deployment:

1. Go to the Vercel dashboard
2. Find your project
3. Navigate to the "Deployments" tab
4. Select a previous working deployment
5. Click "..." and choose "Promote to Production"
