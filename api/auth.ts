import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { authenticate } from "../server/auth";

const app = express();

// Initialize the auth middleware
let authInitialized = false;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!authInitialized) {
    // Initialize auth middleware as needed
    authInitialized = true;
  }

  // For direct auth endpoints like /api/auth/login, /api/auth/register
  // We can handle them here directly, or pass to the main server
  
  // Redirect to main server handler
  return res.status(307).setHeader("Location", "/api/server").end();
}
