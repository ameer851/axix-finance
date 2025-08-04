#!/usr/bin/env node

/**
 * Production Environment Validation
 * 
 * This script validates that all required environment variables are set
 * correctly for the production environment.
 */

function checkEnvironmentVariables() {
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'DATABASE_URL',
    'SESSION_SECRET',
    'JWT_SECRET'
  ];
  
  const missingVars = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`  - ${varName}`));
    process.exit(1);
  }
  
  console.log('✅ All required environment variables are set');
  
  // Validate Supabase URL and keys format
  if (!process.env.SUPABASE_URL.includes('supabase.co')) {
    console.error('❌ SUPABASE_URL does not look valid');
    process.exit(1);
  }
  
  if (!process.env.SUPABASE_ANON_KEY.startsWith('eyJ')) {
    console.error('❌ SUPABASE_ANON_KEY does not look valid');
    process.exit(1);
  }
  
  console.log('✅ Supabase configuration appears valid');
}

checkEnvironmentVariables();
