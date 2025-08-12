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

// api/utils/cors-middleware.ts
var cors_middleware_exports = {};
__export(cors_middleware_exports, {
  corsMiddleware: () => corsMiddleware
});
module.exports = __toCommonJS(cors_middleware_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  corsMiddleware
});
