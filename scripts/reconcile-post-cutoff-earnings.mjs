#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "❌ Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const CREDIT_POLICY_CUTOFF_ISO = "2025-09-18T00:00:00Z";

async function reconcile({ userId, dryRun = true } = {}) {
  try {
    const cutoffMs = new Date(CREDIT_POLICY_CUTOFF_ISO).getTime();

    let users = [];
    if (userId) {
      const { data, error } = await supabase
        .from("users")
        .select("id, balance")
        .eq("id", Number(userId))
        .limit(1);
      if (error) throw error;
      users = data || [];
    } else {
      const { data, error } = await supabase
        .from("users")
        .select("id, balance")
        .order("id", { ascending: true });
      if (error) throw error;
      users = data || [];
    }

    let totalAdjusted = 0;
    const results = [];

    for (const u of users) {
      const uid = Number(u.id);
      const { data: invs, error: invErr } = await supabase
        .from("investments")
        .select("start_date, total_earned, status")
        .eq("user_id", uid)
        .eq("status", "active");
      if (invErr) throw invErr;

      const overCredited = (invs || []).reduce((acc, inv) => {
        const sd = new Date(inv.start_date || 0).getTime();
        if (!Number.isFinite(sd)) return acc;
        if (sd >= cutoffMs) return acc + Number(inv.total_earned || 0);
        return acc;
      }, 0);

      const currentBal = Number(u.balance || 0);
      const adjustedAvailable = Math.max(
        0,
        currentBal - Number(overCredited || 0)
      );
      const delta = adjustedAvailable - currentBal; // negative if subtracting

      results.push({
        userId: uid,
        currentBal,
        overCredited,
        adjustedAvailable,
        delta,
      });

      if (!dryRun && delta !== 0) {
        const { error: updErr } = await supabase
          .from("users")
          .update({
            balance: String(adjustedAvailable),
            updated_at: new Date().toISOString(),
          })
          .eq("id", uid);
        if (updErr) throw updErr;
        try {
          await supabase.from("audit_logs").insert({
            userId: uid,
            action: "reconcile_post_cutoff",
            description: `Reconciled over-credited post-cutoff earnings: -$${Number(overCredited || 0).toFixed(2)}`,
            details: JSON.stringify({
              currentBal,
              overCredited,
              newBalance: adjustedAvailable,
            }),
          });
        } catch (e) {
          console.warn("audit log insert failed", e);
        }
      }

      totalAdjusted += -delta;
    }

    console.log(
      JSON.stringify(
        {
          dryRun: !!dryRun,
          usersProcessed: users.length,
          totalAdjusted,
          results,
        },
        null,
        2
      )
    );
  } catch (e) {
    console.error("❌ Reconciliation failed:", e);
    process.exit(1);
  }
}

// CLI args: --apply to write changes, --user <id> to target a single user
const args = process.argv.slice(2);
const dryRun = !args.includes("--apply");
const userIdx = Math.max(args.indexOf("--user"), args.indexOf("-u"));
const userId = userIdx >= 0 ? Number(args[userIdx + 1]) : undefined;

reconcile({ userId, dryRun });
