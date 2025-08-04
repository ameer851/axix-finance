# Vercel Deployment Fixes

## August 4, 2025 Updates

### Node.js Version Update

- Updated Node.js version from `18.x` to `22.x` in `package.json` to meet Vercel's requirements
- Node.js 18.x is being deprecated by Vercel as of September 1, 2025

### Build Configuration Updates

- Modified build output directory from `dist` to `public` to comply with Vercel expectations
- Updated `vite.config.ts` to allow build command to override the output directory
- Updated `vercel.json` to point to the correct output directory
- Modified build scripts in `package.json` to ensure consistent output paths

### Dependency Warnings

Note that the following dependencies require Node.js 20.x or higher:

- `react-router@7.6.0` (requires Node.js >=20.0.0)
- `react-router-dom@7.6.0` (requires Node.js >=20.0.0)
- `undici@7.13.0` (requires Node.js >=20.18.1)

These dependency warnings should be resolved with the upgrade to Node.js 22.x.

## How to Verify the Changes

1. Run a local build: `npm run build`
2. Verify that the output is generated in the `public` directory
3. Deploy to Vercel: `npm run deploy:vercel`

## Additional Notes

- The Vercel build process now uses the `public` directory as the output directory
- API routes are handled by the serverless functions in the `/api` directory
- The build process now correctly generates the frontend assets in the `public` directory
