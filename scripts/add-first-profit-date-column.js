#!/usr/bin/env node

/**
 * Add first_profit_date column to investments table
 * This script adds the necessary column for the 24-hour profit system
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function addFirstProfitDateColumn() {
  try {
    // Load environment variables
    const dotenv = await import('dotenv');
    dotenv.config();

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Read the SQL migration file
    const sqlFilePath = path.join(__dirname, 'add-first-profit-date-column.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('🚀 Setting up complete investments tables and 24-hour profit system...');
    console.log('=' .repeat(70));
    console.log(sqlContent);
    console.log('=' .repeat(70));

    console.log('\n📋 This SQL migration will:');
    console.log('✅ Create the investments table (if not exists)');
    console.log('✅ Create the investment_returns table (if not exists)');
    console.log('✅ Add the first_profit_date column for 24-hour profit scheduling');
    console.log('✅ Create all necessary indexes for performance');
    console.log('✅ Add documentation comments');

    console.log('\n🔗 To complete the setup:');
    console.log('1. Copy the SQL above');
    console.log('2. Open your Supabase project dashboard');
    console.log('3. Go to SQL Editor');
    console.log('4. Paste and run the SQL');
    console.log('5. Verify the tables were created successfully');

    console.log('\n✅ Database migration script completed!');
    console.log('The 24-hour profit system is ready to use after running the SQL!');  } catch (error) {
    console.error('❌ Error adding first_profit_date column:', error);
    process.exit(1);
  }
}

// Run the migration
addFirstProfitDateColumn();
