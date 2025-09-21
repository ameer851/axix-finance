#!/usr/bin/env node

/**
 * Create a test investment with a UTC start-of-day first_profit_date.
 *
 * Usage (PowerShell):
 *   node scripts/create-test-investment.mjs --user <USER_ID> --transaction <TX_ID> --amount 500 --plan "STARTER PLAN" --duration 3 --daily 2 --total 106
 *
 * Notes:
 * - Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env at repo root.
 * - If you don't have a transaction id, you can insert a placeholder in transactions table first.
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../.env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    const next = argv[i + 1];
    if (key.startsWith("--")) {
      const name = key.slice(2);
      if (next && !next.startsWith("--")) {
        args[name] = next;
        i++;
      } else {
        args[name] = true;
      }
    }
  }
  return args;
}

function utcStartOfDay(date = new Date()) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );
}

async function findUserByEmail(email) {
  const { data, error } = await supabase
    .from("users")
    .select("id, uid, email")
    .eq("email", email)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function findUserByUid(uid) {
  const { data, error } = await supabase
    .from("users")
    .select("id, uid, email")
    .eq("uid", uid)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function findUserById(id) {
  const { data, error } = await supabase
    .from("users")
    .select("id, uid, email")
    .eq("id", id)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function ensureTransaction(
  userUid,
  amount,
  planName,
  planDuration,
  dailyProfit,
  totalReturn
) {
  // Try with UUID first (most common), fallback to integer id if the column is integer
  const base = {
    type: "investment",
    amount: amount,
    description: `Seed transaction for ${planName}`,
    status: "completed",
    plan_name: planName,
    plan_duration: String(planDuration),
    daily_profit: dailyProfit,
    total_return: totalReturn,
  };

  // Attempt 1: assume transactions.user_id is uuid
  let ins = await supabase
    .from("transactions")
    .insert({ ...base, user_id: userUid })
    .select("id")
    .maybeSingle();
  if (!ins.error && ins.data) return ins.data.id;

  // Attempt 2: fallback to integer user id if previous failed with type error
  const isTypeErr =
    ins.error &&
    (ins.error.code === "22P02" ||
      /invalid input syntax for type (uuid|integer)/i.test(
        ins.error.message || ""
      ));
  if (isTypeErr) {
    // We need the numeric user id; fetch by uid
    const rec = await findUserByUid(userUid);
    if (!rec) throw ins.error;
    ins = await supabase
      .from("transactions")
      .insert({ ...base, user_id: rec.id })
      .select("id")
      .maybeSingle();
    if (!ins.error && ins.data) return ins.data.id;
  }
  // If still failing, throw original error
  throw ins.error || new Error("Failed to insert transaction");
}

async function main() {
  const args = parseArgs(process.argv);
  const userEmail = args["user-email"] || args.email;
  const userUidArg = args.user || args["user-uid"] || null; // UUID
  const userIdArg = args["user-id"] ? Number(args["user-id"]) : null; // integer id
  let transactionId = args.transaction ? Number(args.transaction) : null;
  const amount = args.amount ? Number(args.amount) : 500;
  const planName = args.plan || "STARTER PLAN";
  const planDuration = args.duration ? Number(args.duration) : 3;
  const dailyProfit = args.daily ? Number(args.daily) : 2;
  const totalReturn = args.total ? Number(args.total) : 106;
  const firstToday = Boolean(args["first-today"]);

  // Resolve user record (id + uid) supporting multiple identifiers
  let userRecord = null;
  if (userIdArg) {
    userRecord = await findUserById(userIdArg);
  } else if (userUidArg) {
    userRecord = await findUserByUid(userUidArg);
  } else if (userEmail) {
    console.log(`Resolving user by email: ${userEmail}`);
    userRecord = await findUserByEmail(userEmail);
  }
  if (!userRecord) {
    console.error(
      "Provide one of: --user-id <INT> | --user <UUID> | --user-email <EMAIL>"
    );
    process.exit(1);
  }

  const now = new Date();
  const startDate = now.toISOString();
  const endDate = new Date(
    now.getTime() + planDuration * 24 * 60 * 60 * 1000
  ).toISOString();
  const todaySod = utcStartOfDay(now);
  const targetFpd = firstToday
    ? todaySod
    : utcStartOfDay(new Date(now.getTime() + 24 * 60 * 60 * 1000));

  console.log("Creating test investment with:", {
    userId: userRecord.id,
    userUid: userRecord.uid,
    transactionId,
    planName,
    planDuration,
    dailyProfit,
    totalReturn,
    amount,
    first_profit_date: targetFpd.toISOString(),
    first_today: firstToday,
  });

  // Auto-create a transaction if not provided
  if (!transactionId) {
    console.log(
      "No --transaction provided; creating a placeholder transaction..."
    );
    try {
      transactionId = await ensureTransaction(
        userRecord.uid,
        amount,
        planName,
        planDuration,
        dailyProfit,
        totalReturn
      );
      console.log(`Created transaction id: ${transactionId}`);
    } catch (txErr) {
      console.error("Failed to create placeholder transaction:", txErr);
      process.exit(1);
    }
  }

  // Insert into investments with robust user_id typing: try UUID then fallback to integer
  const invBase = {
    transaction_id: transactionId,
    plan_name: planName,
    plan_duration: String(planDuration),
    daily_profit: dailyProfit,
    total_return: totalReturn,
    principal_amount: amount,
    start_date: startDate,
    end_date: endDate,
    status: "active",
    days_elapsed: 0,
    total_earned: 0,
    first_profit_date: targetFpd.toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Attempt 1: assume investments.user_id is uuid
  let inv = await supabase
    .from("investments")
    .insert({ ...invBase, user_id: userRecord.uid })
    .select()
    .maybeSingle();

  if (!inv.error && inv.data) {
    console.log("✅ Created investment:", inv.data);
    return;
  }

  // Attempt 2: fallback to integer id if previous failed with type error
  const invTypeErr =
    inv.error &&
    (inv.error.code === "22P02" ||
      /invalid input syntax for type (uuid|integer)/i.test(
        inv.error.message || ""
      ));
  if (invTypeErr) {
    inv = await supabase
      .from("investments")
      .insert({ ...invBase, user_id: userRecord.id })
      .select()
      .maybeSingle();
    if (!inv.error && inv.data) {
      console.log("✅ Created investment:", inv.data);
      return;
    }
  }

  console.error("Failed to create investment:", inv.error);
  process.exit(1);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
