/**
 * This file is a simplified adapter for Vercel deployment
 * It redirects API requests to the serverless functions
 */

// Just export a dummy function for Vercel
export default function vercelBuild() {
  return {
    success: true,
    message:
      "This is just a placeholder for Vercel build. The actual API is served through serverless functions.",
  };
}
