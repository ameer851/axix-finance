#!/usr/bin/env node

/**
 * Script to activate new users who are in both Supabase Auth and public.users
 * but cannot login due to activation/verification status
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables");
  console.error("Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixNewUserLogins() {
  try {
    console.log("🔍 Checking users who can't login...");

    // Get all users from public.users table
    const { data: publicUsers, error: publicError } = await supabase
      .from("users")
      .select("*");

    if (publicError) {
      console.error("❌ Error fetching public users:", publicError);
      return;
    }

    console.log(`📊 Found ${publicUsers.length} users in public.users table`);

    // Get all users from auth.users
    const { data: authUsers, error: authError } =
      await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("❌ Error fetching auth users:", authError);
      return;
    }

    console.log(`📊 Found ${authUsers.users.length} users in auth.users`);

    // Find users who are in both but might have login issues
    let fixedCount = 0;

    for (const publicUser of publicUsers) {
      const authUser = authUsers.users.find(
        (au) => au.email === publicUser.email
      );

      if (authUser) {
        // User exists in both - check if they need activation
        const needsUpdate =
          !publicUser.is_active ||
          !publicUser.is_verified ||
          !authUser.email_confirmed_at;

        if (needsUpdate) {
          console.log(`🔧 Fixing user: ${publicUser.email}`);

          // Update public.users table
          const { error: updateError } = await supabase
            .from("users")
            .update({
              is_active: true,
              is_verified: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", publicUser.id);

          if (updateError) {
            console.error(
              `❌ Error updating public user ${publicUser.email}:`,
              updateError
            );
            continue;
          }

          // Update auth.users email confirmation if needed
          if (!authUser.email_confirmed_at) {
            const { error: authUpdateError } =
              await supabase.auth.admin.updateUserById(authUser.id, {
                email_confirm: true,
              });

            if (authUpdateError) {
              console.error(
                `❌ Error confirming email for ${publicUser.email}:`,
                authUpdateError
              );
            }
          }

          fixedCount++;
        }
      } else {
        console.log(
          `⚠️  User ${publicUser.email} exists in public.users but not in auth.users`
        );
      }
    }

    console.log(`✅ Fixed ${fixedCount} users who couldn't login`);
  } catch (error) {
    console.error("❌ Script error:", error);
  }
}

// Run the script
fixNewUserLogins();
