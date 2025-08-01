#!/usr/bin/env node

/**
 * Focused Security Cleanup for Axix Finance
 * 
 * This script targets specific known issues in the git history.
 */

import { execSync } from 'child_process';
import readline from 'readline';

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🔒 Axix Finance - Focused Security Cleanup\n');
console.log('⚠️  WARNING: This script will modify git history.');
console.log('⚠️  WARNING: After running this script, you will need to force push to remote repositories.');

// Confirm before proceeding
rl.question('\n➡️  Do you want to proceed? (yes/no): ', (answer) => {
  if (answer.toLowerCase() !== 'yes') {
    console.log('Operation cancelled. No changes were made.');
    rl.close();
    process.exit(0);
  }
  
  console.log('\n🔍 Running focused cleanup...');
  
  try {
    // Files with known credential issues
    const knownSensitiveFiles = [
      '.env',
      '.env.*',
      'check-account.js',
      'check-account.cjs',
      'server/emailService.ts',
      'server/resendEmailService.ts'
    ];
    
    console.log(`\n🧹 Cleaning the following files from git history:\n${knownSensitiveFiles.join('\n')}`);
    
    // Create a command to remove all the specified files from git history
    const filterBranchCommand = `git filter-branch --force --index-filter "git rm --cached --ignore-unmatch ${knownSensitiveFiles.map(f => `'${f}'`).join(' ')}" --prune-empty --tag-name-filter cat -- --all`;
    
    // Execute the command
    console.log('\n🔧 Executing git filter-branch...');
    execSync(filterBranchCommand, { stdio: 'inherit' });
    
    // Force garbage collection
    console.log('\n🗑️  Running garbage collection...');
    execSync('git reflog expire --expire=now --all', { stdio: 'inherit' });
    execSync('git gc --prune=now --aggressive', { stdio: 'inherit' });
    
    console.log('\n✅ Git history cleaned successfully!');
    console.log('\n⚠️  IMPORTANT NEXT STEPS:');
    console.log('1. Commit the changes to check-account.js and check-account.cjs');
    console.log('2. Force push to update GitHub: git push origin --force --all');
    console.log('3. Immediately revoke and rotate all credentials that were exposed');
    console.log('4. Implement the security practices in SECURITY-PRACTICES.md');
    
  } catch (error) {
    console.error('\n❌ Error cleaning git history:', error.message);
  }
  
  rl.close();
});
