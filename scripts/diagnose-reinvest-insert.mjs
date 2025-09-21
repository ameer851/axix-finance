#!/usr/bin/env node
import { createInvestmentFromTransaction } from "../server/investmentService.js";
import { supabase } from "../server/supabase.js";

async function main() {
  const txId = Number(process.argv[2]);
  if (!txId) {
    console.log(
      "Usage: node scripts/diagnose-reinvest-insert.mjs <transactionId>"
    );
    process.exit(1);
  }
  const { data: tx, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", txId)
    .single();
  if (error || !tx) {
    console.error("Transaction not found:", error);
    process.exit(2);
  }
  console.log("Transaction:", {
    id: tx.id,
    user_id: tx.user_id,
    plan_name: tx.plan_name,
    plan_duration: tx.plan_duration,
    created_at: tx.created_at,
  });
  const inv = await createInvestmentFromTransaction(txId);
  console.log("createInvestmentFromTransaction result:", inv);
}

main().catch((e) => {
  console.error(e);
  process.exit(99);
});
