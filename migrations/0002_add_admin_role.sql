-- Migration to add admin role to the role enum
-- Add admin role to existing role enum
ALTER TYPE "public"."role" ADD VALUE 'admin';

-- Optionally create a default admin user for testing
-- You can uncomment and modify this after running the migration
-- INSERT INTO users (username, password, email, first_name, last_name, role, balance, is_verified, is_active) 
-- VALUES ('admin', 'admin123', 'admin@caraxfinance.com', 'Admin', 'User', 'admin', '0', true, true);
