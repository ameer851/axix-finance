# Axix Finance

## Vercel Deployment Instructions

### Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/ameer851/axix-finance.git
   cd axix-finance
   ```

2. **Run the Vercel setup script**

   ```bash
   node setup-vercel.js
   ```

3. **Deploy to Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

### Manual Setup

If you prefer to set up manually or encounter issues:

1. **Install dependencies**

   ```bash
   npm install
   npm install --save-dev @vercel/node@2.15.3
   ```

2. **Create/Update vercel.json**

   ```json
   {
     "version": 2,
     "buildCommand": "npm run build",
     "outputDirectory": "dist/public",
     "installCommand": "npm install --legacy-peer-deps",
     "functions": {
       "api/**/*": {
         "runtime": "@vercel/node@2.15.3"
       }
     },
     "rewrites": [
       {
         "source": "/api/(.*)",
         "destination": "/api/server"
       },
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```

3. **Configure Environment Variables**
   - Set up the following environment variables in your Vercel project settings:
     - `DATABASE_URL`: Your database connection string
     - `JWT_SECRET`: Secret key for token generation
     - `VITE_API_URL`: API URL (usually `https://your-domain.vercel.app/api`)
     - `NODE_ENV`: Set to `production`

### Troubleshooting

If you encounter deployment issues:

1. **Runtime Errors**: Make sure you're using `@vercel/node@2.15.3` (with the @ symbol) as the runtime
2. **Build Failures**: Check the build logs for specific errors
3. **API Not Working**: Verify the API routes are correctly set up in `vercel.json`

For more detailed instructions, see [VERCEL-DEPLOYMENT-CHECKLIST.md](./VERCEL-DEPLOYMENT-CHECKLIST.md)
