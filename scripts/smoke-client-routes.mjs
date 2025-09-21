#!/usr/bin/env node
// Simple smoke test for client routes to ensure pages render and router wiring is correct.
// Usage: node scripts/smoke-client-routes.mjs [BASE_URL]
// BASE_URL defaults to process.env.BASE_URL or http://localhost:5173

import http from "node:http";
import https from "node:https";
import { URL } from "node:url";

const BASE_URL =
  process.argv[2] || process.env.BASE_URL || "http://localhost:5173";

const routes = [
  { path: "/", expect: ["Investment", "Dashboard"] },
  { path: "/client/investments", expect: ["Investments", "Active", "History"] },
  { path: "/investment-history", expect: ["Investments", "History"] },
  { path: "/track-investment", expect: ["Track Investment"] },
  { path: "/investment-calculator", expect: ["Investment", "Calculator"] },
];

function fetchText(urlStr) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const mod = u.protocol === "https:" ? https : http;
    const req = mod.request(
      {
        method: "GET",
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          resolve({ status: res.statusCode || 0, body });
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

(async () => {
  let failed = 0;
  for (const r of routes) {
    const url = new URL(r.path, BASE_URL).toString();
    process.stdout.write(`GET ${url} ... `);
    try {
      const { status, body } = await fetchText(url);
      if (status >= 400) {
        console.log(`FAIL (${status})`);
        failed++;
        continue;
      }
      const ok = r.expect.every((needle) => body.includes(needle));
      if (!ok) {
        console.log(
          `WARN (${status}) missing markers: ${r.expect.filter((n) => !body.includes(n)).join(", ")}`
        );
      } else {
        console.log(`OK (${status})`);
      }
    } catch (e) {
      console.log(`ERROR ${e?.message}`);
      failed++;
    }
  }
  if (failed > 0) {
    console.error(`\nSmoke test finished with ${failed} failing route(s).`);
    process.exit(1);
  } else {
    console.log("\nSmoke test passed for all routes.");
  }
})();
