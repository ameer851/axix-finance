#!/usr/bin/env node

/**
 * Axix Finance - Production Cleanup Script
 * 
 * This script helps clean up test files and other unnecessary files
 * before deploying to production.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🧹 Axix Finance - Production Cleanup Tool\n');

// Files to clean up
const filesToClean = [
  'test-deposit-email.js',
  'test-email.mjs',
  'scripts/test-admin-api.js',
  'scripts/api-debug.js',
  'scripts/api-debug-utils.js'
];

// Print files to be removed
console.log('The following files will be removed:');
filesToClean.forEach(file => {
  console.log(`- ${file}`);
});

// Confirm before proceeding
rl.question('\n➡️  Do you want to proceed with removal? (yes/no): ', (answer) => {
  if (answer.toLowerCase() !== 'yes') {
    console.log('Operation cancelled. No files were removed.');
    rl.close();
    process.exit(0);
  }
  
  console.log('\n🔧 Removing files...');
  
  // Remove each file
  let removedCount = 0;
  let errorCount = 0;
  
  filesToClean.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ Removed: ${file}`);
        removedCount++;
        
        // If file was tracked by git, stage the removal
        try {
          execSync(`git rm --cached "${file}"`, { stdio: 'pipe' });
          console.log(`  - Also removed from git tracking`);
        } catch (gitError) {
          // File might not be tracked by git, which is fine
        }
      } else {
        console.log(`⚠️ File not found: ${file}`);
      }
    } catch (error) {
      console.error(`❌ Error removing ${file}: ${error.message}`);
      errorCount++;
    }
  });
  
  console.log(`\n🏁 Cleanup complete: ${removedCount} files removed, ${errorCount} errors`);
  
  if (removedCount > 0) {
    // Suggest committing the changes
    console.log('\n🔍 Recommendation:');
    console.log('Commit these changes before deploying:');
    console.log('git add .');
    console.log('git commit -m "Remove test files and prepare for production"');
  }
  
  rl.close();
});
