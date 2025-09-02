-- Migration: Add active_deposits column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_deposits VARCHAR(255) DEFAULT '0';

-- Backfill nulls to '0'
UPDATE users SET active_deposits = '0' WHERE active_deposits IS NULL;
