#!/usr/bin/env node

/**
 * Credential Scanner for Axix Finance
 * 
 * This script checks for specific credential patterns in the current files.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n🔍 Axix Finance - Credential Scanner\n');

// Specific patterns to look for
const patterns = [
  // Database URLs
  /postgresql:\/\/\w+:([^@]+)@/g,
  /mysql:\/\/\w+:([^@]+)@/g,
  
  // API Keys
  /RESEND_API_KEY[=:]\s*['"]([^'"]+)['"]/g,
  /API_KEY[=:]\s*['"]([^'"]+)['"]/g,
  /SUPABASE_ANON_KEY[=:]\s*['"]([^'"]+)['"]/g,
  /SUPABASE_SERVICE_ROLE_KEY[=:]\s*['"]([^'"]+)['"]/g,
  
  // SMTP credentials
  /SMTP_PASSWORD[=:]\s*['"]([^'"]+)['"]/g,
  /SMTP_USER[=:]\s*['"]([^'"]+)['"]/g,
  /SMTP_SERVER[=:]\s*['"]([^'"]+)['"]/g,
  
  // JWT and session secrets
  /JWT_SECRET[=:]\s*['"]([^'"]+)['"]/g,
  /SESSION_SECRET[=:]\s*['"]([^'"]+)['"]/g,
  
  // Sendinblue specific
  /SENDINBLUE[=:]\s*['"]([^'"]+)['"]/g,
  /xkeysib-/g
];

// Files/directories to skip
const excludeDirs = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  'tmp'
];

const excludeFiles = [
  '.gitignore',
  'package-lock.json',
  'yarn.lock',
  'SECURITY-PRACTICES.md',
  'security-cleanup.js',
  'focused-cleanup.js',
  'credential-scanner.js'
];

// File extensions to check
const extensionsToCheck = [
  '.js', '.ts', '.jsx', '.tsx', '.cjs', '.mjs',
  '.json', '.yml', '.yaml', '.env', '.md', 
  '.ps1', '.sh'
];

// Track issues found
let issuesFound = 0;

// Recursive function to scan files
function scanDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      if (!excludeDirs.includes(file)) {
        scanDirectory(filePath);
      }
    } else {
      const ext = path.extname(file);
      if (extensionsToCheck.includes(ext) && !excludeFiles.includes(file)) {
        checkFile(filePath);
      }
    }
  }
}

// Function to check a file for credentials
function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let fileHasIssue = false;
    
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        if (!fileHasIssue) {
          console.log(`\n🚨 Issues found in: ${filePath}`);
          fileHasIssue = true;
        }
        
        console.log(`  - Found ${matches.length} match(es) for pattern: ${pattern}`);
        issuesFound += matches.length;
      }
    }
  } catch (error) {
    console.error(`Error reading file ${filePath}: ${error.message}`);
  }
}

// Start scanning
console.log('Scanning repository for credentials...');
scanDirectory(__dirname);

// Report results
if (issuesFound > 0) {
  console.log(`\n⚠️  Found ${issuesFound} potential credential issues in the repository.`);
  console.log('\nRecommendations:');
  console.log('1. Replace hardcoded credentials with environment variables');
  console.log('2. Update .env.example with dummy values');
  console.log('3. Run the focused-cleanup.js script to clean git history');
} else {
  console.log('\n✅ No obvious credential issues found in current files.');
  console.log('\nNext steps:');
  console.log('1. Run focused-cleanup.js to clean git history');
  console.log('2. Rotate all credentials mentioned in GitGuardian alerts');
}

console.log('\nRemember: This scanner may not catch all issues. Review files manually as well.');
