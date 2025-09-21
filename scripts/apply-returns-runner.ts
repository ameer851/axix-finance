#!/usr/bin/env -S node

// Lightweight runner to execute the production applyDailyReturns() without HTTP/auth.
// Usage:
//   npx tsx scripts/apply-returns-runner.ts
// Ensure .env has SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.

import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../.env") });

async function main() {
  try {
    const { applyDailyReturns } = await import(
      "../server/investmentService.ts"
    );
    console.log("Running applyDailyReturns() using server logic...\n");
    await applyDailyReturns();
    console.log("\n✅ applyDailyReturns() finished successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ applyDailyReturns() failed:", err);
    process.exit(1);
  }
}

main();
