#!/usr/bin/env node

/**
 * Secret Generator for Axix Finance
 * 
 * This script generates secure random strings for use as session secrets and JWT secrets.
 */

import crypto from 'crypto';

// Generate a secure random string of specified length
function generateSecureSecret(length = 64) {
  return crypto.randomBytes(length).toString('base64');
}

// Generate session secret
const sessionSecret = generateSecureSecret();
console.log('\n==== SESSION_SECRET ====');
console.log(sessionSecret);

// Generate JWT secret
const jwtSecret = generateSecureSecret();
console.log('\n==== JWT_SECRET ====');
console.log(jwtSecret);

console.log('\n==== Instructions ====');
console.log('1. Copy these secrets to your Vercel environment variables');
console.log('2. Keep these secrets safe and do not share them');
console.log('3. Delete this file after use\n');
