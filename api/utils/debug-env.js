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

// api/utils/debug-env.ts
var debug_env_exports = {};
__export(debug_env_exports, {
  registerDebugRoutes: () => registerDebugRoutes
});
module.exports = __toCommonJS(debug_env_exports);
function registerDebugRoutes(app) {
  app.get("/api/debug/env", (req, res) => {
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      // Show partial keys for debugging
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? `${process.env.SUPABASE_ANON_KEY.substring(0, 10)}...` : void 0,
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? `${process.env.VITE_SUPABASE_ANON_KEY.substring(0, 10)}...` : void 0,
      VITE_FRONTEND_URL: process.env.VITE_FRONTEND_URL,
      FRONTEND_URL: process.env.FRONTEND_URL,
      SITE_URL: process.env.SITE_URL,
      CLIENT_URL: process.env.CLIENT_URL
    };
    return res.status(200).json({
      env,
      headers: {
        origin: req.headers.origin,
        host: req.headers.host,
        referer: req.headers.referer
      }
    });
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  registerDebugRoutes
});
