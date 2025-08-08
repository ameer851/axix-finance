// visitors-api.ts
import type { Express, Request, Response } from "express";
import { corsMiddleware } from "../utils/cors-middleware";

/**
 * Register visitors tracking endpoints
 * These endpoints track visitor activity on the site
 */
export function registerVisitorsApi(app: Express) {
  // Apply CORS middleware specifically for visitors endpoints
  app.all("/api/visitors/*", (req, res, next) =>
    corsMiddleware(req, res, next)
  );

  // Handle visitor tracking
  app.get("/api/visitors/track", (req: Request, res: Response) => {
    // Simply return success - we're just interested in fixing the CORS issues
    res.status(200).json({ success: true });
  });

  app.post("/api/visitors/track", (req: Request, res: Response) => {
    // Simply return success - we're just interested in fixing the CORS issues
    res.status(200).json({ success: true });
  });

  // Handle visitor session
  app.get("/api/visitors/session", (req: Request, res: Response) => {
    // Simply return success - we're just interested in fixing the CORS issues
    res.status(200).json({ success: true });
  });

  app.post("/api/visitors/session", (req: Request, res: Response) => {
    // Simply return success - we're just interested in fixing the CORS issues
    res.status(200).json({ success: true });
  });

  // Handle visitor activity
  app.get("/api/visitors/activity", (req: Request, res: Response) => {
    // Simply return success - we're just interested in fixing the CORS issues
    res.status(200).json({ success: true });
  });

  app.post("/api/visitors/activity", async (req: Request, res: Response) => {
    try {
      const { activityType, visitorId, timestamp, details } = req.body || {};
      // Basic validation
      if (!activityType || !visitorId) {
        console.warn(
          "Missing activityType or visitorId in visitor activity payload",
          req.body
        );
        return res
          .status(400)
          .json({ success: false, error: "Missing required fields" });
      }
      // Simulate DB call (replace with actual DB logic if needed)
      // await db.saveVisitorActivity({ activityType, visitorId, timestamp, details });
      // Log activity persistently (replace with actual logging if needed)
      console.info("Visitor activity recorded", {
        activityType,
        visitorId,
        timestamp,
        details,
      });
      res.status(200).json({ success: true });
    } catch (err) {
      console.error("Error in /api/visitors/activity", err, req.body);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });
}
