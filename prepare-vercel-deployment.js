#!/usr/bin/env node

/**
 * Axix Finance - Vercel Deployment Helper
 * 
 * This script checks if the required environment variables are set
 * and prepares the application for deployment to Vercel.
 */

// Import required modules
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n🚀 Axix Finance - Vercel Deployment Helper\n');

// Check if .env.example exists
if (!fs.existsSync(path.join(__dirname, '.env.example'))) {
  console.error('❌ .env.example file not found. Please create one based on the README instructions.');
  process.exit(1);
}

// Check if vercel.json exists
if (!fs.existsSync(path.join(__dirname, 'vercel.json'))) {
  console.error('❌ vercel.json file not found. Please create one based on the README instructions.');
  process.exit(1);
}

// Build the application
console.log('📦 Building the application...');

try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully.');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Verify that dist directory exists
if (!fs.existsSync(path.join(__dirname, 'dist'))) {
  console.error('❌ Build output (dist) directory not found. The build process may have failed.');
  process.exit(1);
}

console.log('\n✅ Deployment preparation complete!');
console.log('\nNext steps:');
console.log('1. Commit and push your changes to GitHub');
console.log('2. Connect your repository to Vercel');
console.log('3. Set the required environment variables in Vercel');
console.log('4. Deploy your application');
console.log('\nFor more details, see the README.md file.\n');
