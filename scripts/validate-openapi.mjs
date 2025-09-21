#!/usr/bin/env node
// Lightweight OpenAPI spec validation script.
// Avoids heavy dependencies initially; performs structural checks and basic schema presence.

import fs from "fs";
import path from "path";

const SPEC_PATH = path.resolve(process.cwd(), "docs", "openapi.yaml");

function fail(msg) {
  console.error(`[openapi:fail] ${msg}`);
  process.exitCode = 1;
}

function ok(msg) {
  console.log(`[openapi:ok] ${msg}`);
}

if (!fs.existsSync(SPEC_PATH)) {
  fail(`Spec not found at ${SPEC_PATH}`);
  process.exit(1);
}

const raw = fs.readFileSync(SPEC_PATH, "utf8");
if (!/^openapi: 3\.[0-9]+\.[0-9]+/m.test(raw))
  fail("Missing or invalid openapi version header");
if (!/components:\n[\s\S]*schemas:/m.test(raw))
  fail("Missing components.schemas section");
if (!/paths:/m.test(raw)) fail("Missing paths section");
if (!/securitySchemes:/m.test(raw)) fail("Missing securitySchemes");

// Basic required operations presence
[
  "/ping",
  "/health",
  "/investments/active",
  "/admin/investments/run-daily",
].forEach((p) => {
  if (!new RegExp(p.replace(/\//g, "\\/")).test(raw))
    fail(`Path ${p} not found`);
});

ok("Structural checks passed");

// Future: integrate a full validator (swagger-parser) once dependency footprint is acceptable.
