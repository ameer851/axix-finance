/**
 * Vercel Adapter
 * This file helps run the API in Vercel's serverless environment
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { apiHandler } from '../api/server';

// Export the handler for Vercel
export default function handler(req: VercelRequest, res: VercelResponse) {
  return apiHandler(req, res);
}
