#!/usr/bin/env node

/**
 * Security Cleanup Script for Axix Finance
 * 
 * This script helps identify and clean sensitive data from the git repository.
 * IMPORTANT: This will alter git history. Make a backup before running.
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

console.log('\n🔒 Axix Finance - Security Cleanup Tool\n');
console.log('⚠️  WARNING: This script will modify git history. Make a backup before proceeding.');
console.log('⚠️  WARNING: After running this script, you will need to force push to remote repositories.');

// Confirm before proceeding
rl.question('\n➡️  Do you want to proceed? (yes/no): ', (answer) => {
  if (answer.toLowerCase() !== 'yes') {
    console.log('Operation cancelled. No changes were made.');
    rl.close();
    process.exit(0);
  }
  
  console.log('\n🔍 Scanning for potential secrets in git history...');
  
  try {
    // Check for patterns that might indicate credentials
    const sensitivePatterns = [
      'password', 'secret', 'key', 'token', 'auth', 
      'credential', 'smtp', 'mail', 'email', 'apikey'
    ];
    
    // Create a regex pattern for searching
    const patternString = sensitivePatterns.join('|');
    
    // Search git history for sensitive patterns
    console.log(`Searching for patterns: ${patternString}`);
    const result = execSync(
      `git log -p | findstr -i "${patternString}" | findstr -i -v "Checking|check|updating|update|looking|look|console.log"`,
      { encoding: 'utf8' }
    );
    
    // Output findings
    console.log('\n🚨 Potential sensitive data found:');
    console.log('--------------------------------');
    console.log(result);
    console.log('--------------------------------');
    
    // Ask which files to clean
    rl.question('\n➡️  Enter comma-separated list of files to clean (e.g., .env,.env.production): ', (filesToClean) => {
      if (!filesToClean.trim()) {
        console.log('No files specified. Operation cancelled.');
        rl.close();
        process.exit(0);
      }
      
      const filesList = filesToClean.split(',').map(f => f.trim());
      console.log(`\n🧹 Preparing to clean the following files from git history: ${filesList.join(', ')}`);
      
      rl.question('\n➡️  This will permanently alter git history. Confirm? (yes/no): ', (finalConfirm) => {
        if (finalConfirm.toLowerCase() !== 'yes') {
          console.log('Operation cancelled. No changes were made.');
          rl.close();
          process.exit(0);
        }
        
        console.log('\n🔧 Cleaning git history...');
        
        try {
          // Create a command that removes all the specified files
          const filterBranchCommand = `git filter-branch --force --index-filter "git rm --cached --ignore-unmatch ${filesList.map(f => `'${f}'`).join(' ')}" --prune-empty --tag-name-filter cat -- --all`;
          
          // Execute the command
          execSync(filterBranchCommand, { stdio: 'inherit' });
          
          // Force garbage collection
          console.log('\n🗑️  Running garbage collection...');
          execSync('git reflog expire --expire=now --all', { stdio: 'inherit' });
          execSync('git gc --prune=now --aggressive', { stdio: 'inherit' });
          
          console.log('\n✅ Git history cleaned successfully!');
          console.log('\n⚠️  IMPORTANT NEXT STEPS:');
          console.log('1. Revoke and rotate all credentials that were exposed');
          console.log('2. Force push to update remote repositories: git push origin --force --all');
          console.log('3. Update your .env.example file with dummy values');
          console.log('4. Consider implementing pre-commit hooks to prevent future leaks');
        } catch (error) {
          console.error('\n❌ Error cleaning git history:', error.message);
        }
        
        rl.close();
      });
    });
    
  } catch (error) {
    if (error.status === 1) {
      console.log('\n✅ No obvious sensitive data found in git history.');
    } else {
      console.error('\n❌ Error scanning git history:', error.message);
    }
    rl.close();
  }
});
