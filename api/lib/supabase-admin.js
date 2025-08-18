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

// api/lib/supabase-admin.ts
var supabase_admin_exports = {};
__export(supabase_admin_exports, {
  supabase: () => supabase
});
module.exports = __toCommonJS(supabase_admin_exports);
var import_supabase_js = require("@supabase/supabase-js");
var SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
var SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
  throw new Error("Supabase service role key is required");
}
if (!SUPABASE_URL) {
  console.error("Missing SUPABASE_URL environment variable");
  throw new Error("Supabase URL is required");
}
var supabase = (0, import_supabase_js.createClient)(
  SUPABASE_URL,
  SERVICE_ROLE_KEY,
  // This should be set in Vercel environment variables
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  supabase
});
