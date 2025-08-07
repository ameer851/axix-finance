import type { VercelRequest, VercelResponse } from "@vercel/node";
import cors from "cors";
import express from "express";
import { registerRoutes } from "./routes";

// Create Express app
const app = express();

// CORS configuration
const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    const allowedOrigins = [
      "http://localhost:4000",
      "https://axix-finance.vercel.app",
      "https://www.axixfinance.com",
      "https://axixfinance.com",
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Enable JSON parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Register all routes
registerRoutes(app);

// Export handler for Vercel
export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req as any, res as any);
}
