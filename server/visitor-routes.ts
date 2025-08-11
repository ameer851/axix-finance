import { Request, Response, Router } from "express";

// Lightweight in-memory visitor tracking for development.
// In production this should use persistent storage and pruning.
interface VisitorSession {
  id: string;
  createdAt: number;
  lastActivity: number;
  pageViews: number;
  lastPage?: string;
  userAgent?: string;
  language?: string;
  timezone?: string;
  screen?: any;
  viewport?: any;
}

const visitors = new Map<string, VisitorSession>();

function getClientKey(req: Request) {
  const sid = (req as any).sessionID;
  if (sid) return `sid:${sid}`;
  const ip = (
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "?"
  ).toString();
  const ua = (req.headers["user-agent"] || "?").toString();
  return `ipua:${ip}|${ua}`;
}

export const visitorRouter = Router();

visitorRouter.post("/session", (req: Request, res: Response) => {
  try {
    const key = getClientKey(req);
    let sess = visitors.get(key);
    if (!sess) {
      sess = {
        id: key,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        pageViews: 0,
        userAgent: req.body?.userAgent || (req.headers["user-agent"] as string),
        language: req.body?.language,
        timezone: req.body?.timezone,
        screen: req.body?.screen,
        viewport: req.body?.viewport,
      };
      visitors.set(key, sess);
    } else {
      sess.lastActivity = Date.now();
    }
    res.json({ ok: true, sessionId: sess.id, createdAt: sess.createdAt });
  } catch (e) {
    console.error("Visitor session init error", e);
    res
      .status(500)
      .json({ ok: false, message: "Failed to init visitor session" });
  }
});

visitorRouter.post("/track", (req: Request, res: Response) => {
  try {
    const key = getClientKey(req);
    let sess = visitors.get(key);
    if (!sess) {
      sess = {
        id: key,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        pageViews: 0,
      };
      visitors.set(key, sess);
    }
    sess.pageViews += 1;
    sess.lastActivity = Date.now();
    sess.lastPage = req.body?.page;
    res.json({ ok: true, pageViews: sess.pageViews, lastPage: sess.lastPage });
  } catch (e) {
    console.error("Visitor track error", e);
    res.status(500).json({ ok: false, message: "Failed to track page" });
  }
});

visitorRouter.put("/activity", (req: Request, res: Response) => {
  try {
    const key = getClientKey(req);
    const sess = visitors.get(key);
    if (sess) {
      sess.lastActivity = Date.now();
      res.json({ ok: true, lastActivity: sess.lastActivity });
    } else {
      console.warn("[visitors] activity 404 for key", key);
      res.status(404).json({ ok: false, message: "Session not found" });
    }
  } catch (e) {
    console.error("Visitor activity error", e);
    res.status(500).json({ ok: false, message: "Failed to update activity" });
  }
});

// Provide GET variant in case client mistakenly uses GET
visitorRouter.get("/activity", (req: Request, res: Response) => {
  const key = getClientKey(req);
  const sess = visitors.get(key);
  if (sess) {
    return res.json({ ok: true, lastActivity: sess.lastActivity });
  }
  return res.status(404).json({ ok: false, message: "Session not found" });
});

visitorRouter.delete("/session", (req: Request, res: Response) => {
  try {
    const key = getClientKey(req);
    visitors.delete(key);
    res.json({ ok: true });
  } catch (e) {
    console.error("Visitor end session error", e);
    res
      .status(500)
      .json({ ok: false, message: "Failed to end visitor session" });
  }
});

visitorRouter.get("/summary", (_req: Request, res: Response) => {
  const now = Date.now();
  const active = Array.from(visitors.values()).filter(
    (v) => now - v.lastActivity < 5 * 60 * 1000
  );
  res.json({
    ok: true,
    totalSessions: visitors.size,
    activeSessions: active.length,
  });
});
