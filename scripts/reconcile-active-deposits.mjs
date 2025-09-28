#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    const v = argv[i + 1];
    if (k?.startsWith("--")) {
      const name = k.slice(2);
      if (v && !v.startsWith("--")) {
        args[name] = v;
        i++;
      } else {
        args[name] = true;
      }
    }
  }
  return args;
}

function jlog(fields) {
  try {
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        script: "reconcile-active-deposits",
        ...fields,
      })
    );
  } catch {
    console.log(fields);
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const apply =
    !!args.apply || String(args.apply || "").toLowerCase() === "true";
  const uid = args.uid || args.user || args.userId || args.user_id;
  const idArg = args.id ? Number(args.id) : undefined;
  if (!uid && !idArg) {
    console.error(
      "Usage: node scripts/reconcile-active-deposits.mjs --uid <auth-uid> | --id <numeric-id> [--apply]"
    );
    process.exit(1);
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Resolve user
  let userRow;
  if (idArg) {
    const { data, error } = await supabase
      .from("users")
      .select("id, uid, email, balance, active_deposits, earned_money")
      .eq("id", idArg)
      .maybeSingle();
    if (error) throw new Error("Fetch user by id failed: " + error.message);
    userRow = data;
  } else {
    const { data, error } = await supabase
      .from("users")
      .select("id, uid, email, balance, active_deposits, earned_money")
      .eq("uid", uid)
      .maybeSingle();
    if (error) throw new Error("Fetch user by uid failed: " + error.message);
    userRow = data;
  }
  if (!userRow) {
    jlog({ event: "user_not_found" });
    process.exit(0);
  }
  const userId = Number(userRow.id);

  // Sum active principals
  const { data: active, error: actErr } = await supabase
    .from("investments")
    .select("principal_amount")
    .eq("user_id", userId)
    .eq("status", "active");
  if (actErr)
    throw new Error("Fetch active investments failed: " + actErr.message);

  const sumActive = (active || []).reduce(
    (acc, r) => acc + Number(r.principal_amount || 0),
    0
  );
  const current = Number(userRow.active_deposits || 0);

  jlog({
    event: "computed",
    userId,
    currentActiveDeposits: current,
    expectedActiveDeposits: Number(sumActive.toFixed(8)),
  });

  if (Math.abs(sumActive - current) < 1e-8) {
    jlog({ event: "ok", message: "No change needed" });
    return;
  }

  if (!apply) {
    jlog({
      event: "dry_run",
      diff: Number((sumActive - current).toFixed(8)),
      note: "Run with --apply to update users.active_deposits",
    });
    return;
  }

  const { error: upErr } = await supabase
    .from("users")
    .update({ active_deposits: sumActive })
    .eq("id", userId);
  if (upErr)
    throw new Error("Update users.active_deposits failed: " + upErr.message);

  jlog({
    event: "updated",
    userId,
    active_deposits: Number(sumActive.toFixed(8)),
  });
}

main().catch((e) => {
  jlog({ event: "fatal", error: e.message });
  process.exit(1);
});
