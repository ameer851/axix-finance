-- Add active_deposits column to users table
-- This column tracks funds that are locked in active investments

ALTER TABLE users ADD COLUMN IF NOT EXISTS active_deposits VARCHAR(255) DEFAULT '0';

-- Update any existing NULL values to '0'
UPDATE users SET active_deposits = '0' WHERE active_deposits IS NULL;

-- Add a comment for documentation
COMMENT ON COLUMN users.active_deposits IS 'Funds currently locked in active investments (not available for withdrawal)';
