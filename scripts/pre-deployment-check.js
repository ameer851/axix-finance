#!/usr/bin/env node
/**
 * Pre-deployment setup script
 * Checks configuration and prepares for deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🚀 Axix Finance - Pre-deployment Setup\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found');
  console.log('📋 Copy .env.example to .env and configure your settings');
  process.exit(1);
}

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf8');

// Check required variables
const requiredVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'SESSION_SECRET',
  'SMTP_USER',
  'SMTP_PASSWORD'
];

const missingVars = [];
requiredVars.forEach(varName => {
  if (!envContent.includes(`${varName}=`) || envContent.includes(`${varName}=your-`)) {
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.log('❌ Missing or incomplete environment variables:');
  missingVars.forEach(varName => console.log(`   - ${varName}`));
  console.log('\n📋 Please update your .env file with proper values');
  process.exit(1);
}

// Check if build directory exists
const distPath = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distPath)) {
  console.log('📦 Building application...');
  // The build command will be run by the deployment service
}

console.log('✅ Configuration check passed!');
console.log('🎯 Ready for deployment to Render and Vercel');
console.log('\n📚 Next steps:');
console.log('1. Push your code to GitHub');
console.log('2. Follow the deployment guide in docs/deployment-guide.md');
console.log('3. Deploy backend to Render');
console.log('4. Deploy frontend to Vercel');
console.log('5. Configure your custom domain');
