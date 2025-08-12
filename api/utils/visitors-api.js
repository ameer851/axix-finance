"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// api/utils/visitors-api.ts
var visitors_api_exports = {};
__export(visitors_api_exports, {
  registerVisitorsApi: () => registerVisitorsApi
});
module.exports = __toCommonJS(visitors_api_exports);

// api/utils/cors-middleware.ts
function corsMiddleware(req, res, next) {
  const allowedOrigins = [
    "https://www.axixfinance.com",
    "https://axixfinance.com",
    "https://axix-finance.vercel.app",
    "http://localhost:4000",
    // Add local development
    "http://localhost:3000",
    process.env.VITE_FRONTEND_URL || "",
    process.env.FRONTEND_URL || "",
    process.env.CLIENT_URL || "",
    process.env.SITE_URL || ""
  ].filter((origin2) => origin2);
  const origin = req.headers.origin;
  if (process.env.NODE_ENV === "development" && origin?.includes("localhost")) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,HEAD,PUT,PATCH,POST,DELETE"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    return next();
  }
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigins[0] || "*");
  }
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  try {
    const url = req.url;
    if (typeof url === "string" && url.includes("/api/translate-log")) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Credentials", "false");
    }
  } catch {
  }
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
}

// api/utils/visitors-api.ts
function registerVisitorsApi(app) {
  app.all(
    "/api/visitors/*",
    (req, res, next) => corsMiddleware(req, res, next)
  );
  app.get("/api/visitors/track", (req, res) => {
    res.status(200).json({ success: true });
  });
  app.post("/api/visitors/track", (req, res) => {
    res.status(200).json({ success: true });
  });
  app.get("/api/visitors/session", (req, res) => {
    res.status(200).json({ success: true });
  });
  app.post("/api/visitors/session", (req, res) => {
    res.status(200).json({ success: true });
  });
  app.delete("/api/visitors/session", (req, res) => {
    res.status(200).json({ success: true });
  });
  app.get("/api/visitors/activity", (req, res) => {
    res.status(200).json({ success: true });
  });
  app.put("/api/visitors/activity", (req, res) => {
    res.status(200).json({ success: true });
  });
  app.post("/api/visitors/activity", async (req, res) => {
    try {
      const { activityType, visitorId, timestamp, details } = req.body || {};
      if (!activityType || !visitorId) {
        console.warn(
          "Missing activityType or visitorId in visitor activity payload",
          req.body
        );
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }
      console.info("Visitor activity recorded", {
        activityType,
        visitorId,
        timestamp,
        details
      });
      res.status(200).json({ success: true });
    } catch (err) {
      console.error("Error in /api/visitors/activity", err, req.body);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  registerVisitorsApi
});
