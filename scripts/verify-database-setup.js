#!/usr/bin/env node

/**
 * Verify 24-hour profit system database setup
 * This script checks if the investments tables were created successfully
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyDatabaseSetup() {
  try {
    // Load environment variables
    const dotenv = await import('dotenv');
    dotenv.config();

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('🔍 Verifying 24-hour profit system database setup...\n');

    // Check if investments table exists
    try {
      const { data: investmentsData, error: investmentsError } = await supabase
        .from('investments')
        .select('id')
        .limit(1);

      if (investmentsError) {
        console.log('❌ Investments table: NOT FOUND');
        console.log(`   Error: ${investmentsError.message}`);
      } else {
        console.log('✅ Investments table: EXISTS');
      }
    } catch (error) {
      console.log('❌ Investments table: NOT FOUND');
      console.log(`   Error: ${error.message}`);
    }

    // Check if investment_returns table exists
    try {
      const { data: returnsData, error: returnsError } = await supabase
        .from('investment_returns')
        .select('id')
        .limit(1);

      if (returnsError) {
        console.log('❌ Investment_returns table: NOT FOUND');
        console.log(`   Error: ${returnsError.message}`);
      } else {
        console.log('✅ Investment_returns table: EXISTS');
      }
    } catch (error) {
      console.log('❌ Investment_returns table: NOT FOUND');
      console.log(`   Error: ${error.message}`);
    }

    // Check if first_profit_date column exists
    try {
      const { data: columnData, error: columnError } = await supabase
        .from('investments')
        .select('first_profit_date')
        .limit(1);

      if (columnError) {
        console.log('❌ first_profit_date column: NOT FOUND');
        console.log(`   Error: ${columnError.message}`);
      } else {
        console.log('✅ first_profit_date column: EXISTS');
      }
    } catch (error) {
      console.log('❌ first_profit_date column: NOT FOUND');
      console.log(`   Error: ${error.message}`);
    }

    console.log('\n📋 If any tables/columns are missing:');
    console.log('1. Run the SQL migration script: node scripts/add-first-profit-date-column.js');
    console.log('2. Copy the displayed SQL');
    console.log('3. Execute it in your Supabase SQL Editor');
    console.log('4. Run this verification script again');

    console.log('\n🎯 Next Steps:');
    console.log('✅ Database setup complete - you can now test the 24-hour profit system!');
    console.log('✅ Run: node scripts/test-24-hour-profit-system.js (optional)');

  } catch (error) {
    console.error('❌ Error verifying database setup:', error);
    process.exit(1);
  }
}

// Run the verification
verifyDatabaseSetup();
