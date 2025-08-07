-- Fix database schema to match server expectations
-- This script adds the missing columns that the server authentication expects

-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS username VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS password VARCHAR(255),
ADD COLUMN IF NOT EXISTS "firstName" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "lastName" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS balance VARCHAR(255) DEFAULT '0',
ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "twoFactorSecret" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "referredBy" INTEGER,
ADD COLUMN IF NOT EXISTS "bitcoinAddress" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "bitcoinCashAddress" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "ethereumAddress" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "bnbAddress" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "usdtTrc20Address" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "verificationToken" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "verificationTokenExpiry" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "pendingEmail" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "passwordResetToken" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "passwordResetTokenExpiry" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW();

-- Update existing users to have proper data
UPDATE users 
SET 
  username = COALESCE(username, email),
  "firstName" = COALESCE("firstName", SPLIT_PART(full_name, ' ', 1)),
  "lastName" = COALESCE("lastName", SPLIT_PART(full_name, ' ', 2)),
  "isActive" = COALESCE("isActive", true),
  "isVerified" = COALESCE("isVerified", true),
  balance = COALESCE(balance, '0'),
  "twoFactorEnabled" = COALESCE("twoFactorEnabled", false),
  "createdAt" = COALESCE("createdAt", NOW()),
  "updatedAt" = COALESCE("updatedAt", NOW())
WHERE username IS NULL OR "firstName" IS NULL OR "lastName" IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users("isActive");
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users("isVerified");

-- Update RLS policies to allow authenticated users to read their own data
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = uid);

-- Allow authenticated users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = uid);

-- Allow service role to manage all users (for server operations)
DROP POLICY IF EXISTS "Service role can manage all users" ON users;
CREATE POLICY "Service role can manage all users" ON users
  FOR ALL USING (auth.role() = 'service_role');

COMMIT; 