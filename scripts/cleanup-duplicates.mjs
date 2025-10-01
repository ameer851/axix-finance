#!/usr/bin/env node
// Clean up duplicate investment returns before applying fix
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

async function main() {
  console.log("=== CLEANING UP DUPLICATE INVESTMENT RETURNS ===\n");
  
  // Find all duplicate return entries (same investment_id + return_date)
  const { data: duplicates, error } = await supabase.rpc('find_duplicate_returns', {});
  
  if (error) {
    console.error("Error finding duplicates with RPC, trying manual approach...");
    
    // Manual approach: find duplicates by grouping
    const { data: allReturns, error: returnsError } = await supabase
      .from("investment_returns")
      .select("id, investment_id, return_date, created_at")
      .order("investment_id", { ascending: true })
      .order("return_date", { ascending: true })
      .order("created_at", { ascending: true });
      
    if (returnsError) {
      console.error("Error fetching returns:", returnsError);
      return;
    }
    
    // Group by investment_id + return_date
    const groups = {};
    allReturns.forEach(ret => {
      const key = `${ret.investment_id}-${ret.return_date}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(ret);
    });
    
    // Find groups with duplicates
    const duplicateGroups = Object.values(groups).filter(group => group.length > 1);
    
    console.log(`Found ${duplicateGroups.length} groups with duplicates`);
    
    let totalDeleted = 0;
    
    for (const group of duplicateGroups) {
      console.log(`\nGroup: Investment ${group[0].investment_id} on ${group[0].return_date} (${group.length} entries)`);
      
      // Keep the first one (earliest created_at), delete the rest
      const toKeep = group[0];
      const toDelete = group.slice(1);
      
      console.log(`  Keeping: ID ${toKeep.id} (created: ${toKeep.created_at})`);
      
      for (const dup of toDelete) {
        console.log(`  Deleting: ID ${dup.id} (created: ${dup.created_at})`);
        
        const { error: deleteError } = await supabase
          .from("investment_returns")
          .delete()
          .eq("id", dup.id);
          
        if (deleteError) {
          console.error(`    Error deleting ID ${dup.id}:`, deleteError);
        } else {
          console.log(`    ✓ Deleted ID ${dup.id}`);
          totalDeleted++;
        }
      }
    }
    
    console.log(`\n=== CLEANUP COMPLETE ===`);
    console.log(`Total duplicates deleted: ${totalDeleted}`);
    
    // Now try to add the unique constraint
    console.log("\nAdding unique constraint to prevent future duplicates...");
    const { error: constraintError } = await supabase.rpc('exec_sql', {
      sql: `CREATE UNIQUE INDEX IF NOT EXISTS idx_investment_returns_unique_per_day 
            ON investment_returns (investment_id, return_date);`
    });
    
    if (constraintError) {
      console.log("Could not add constraint via RPC, will need manual migration");
      console.log("Run this SQL manually in Supabase:");
      console.log("CREATE UNIQUE INDEX IF NOT EXISTS idx_investment_returns_unique_per_day ON investment_returns (investment_id, return_date);");
    } else {
      console.log("✓ Unique constraint added successfully");
    }
  }
}

main().catch(console.error);