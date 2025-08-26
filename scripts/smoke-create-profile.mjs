#!/usr/bin/env node
import crypto from "node:crypto";

const uid =
  (crypto.randomUUID && crypto.randomUUID()) ||
  ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (c ^ (crypto.randomBytes(1)[0] & (15 >> (c / 4)))).toString(16)
  );
const ts = new Date()
  .toISOString()
  .replace(/[-:TZ.]/g, "")
  .slice(0, 14);
const email = `test+${ts}@axix-finance.co`;
const username = `test${ts}`;

const payload = { uid, email, username, firstName: "Test", lastName: "User" };

async function main() {
  try {
    const resp = await fetch(
      "https://axix-finance.fly.dev/api/auth/create-profile",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const text = await resp.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
    console.log(JSON.stringify({ status: resp.status, json }, null, 2));
  } catch (e) {
    console.error("Smoke test failed:", e.message || String(e));
    process.exit(1);
  }
}

main();
